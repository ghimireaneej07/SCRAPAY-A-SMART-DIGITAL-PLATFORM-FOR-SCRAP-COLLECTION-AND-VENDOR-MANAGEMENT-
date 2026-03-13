import secrets
from datetime import timedelta
from email.utils import parseaddr
import logging

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailOTP, OTPPurpose, User, UserProfile, UserRole, VendorAvailability, VerificationStatus


OTP_EXPIRY_MINUTES = 10
OTP_EMAIL_SUBJECTS = {
    OTPPurpose.REGISTER_USER: "Verify your Scrapay user registration",
    OTPPurpose.REGISTER_VENDOR: "Verify your Scrapay vendor registration",
    OTPPurpose.PASSWORD_RESET: "Your Scrapay password reset OTP",
    OTPPurpose.ADMIN_LOGIN: "Your Scrapay admin login OTP",
}
PROFILE_USER_FIELDS = ("email", "phone")
PROFILE_DETAIL_FIELDS = ("full_name", "avatar_url", "address", "city", "state", "pincode")
VENDOR_PROFILE_FIELDS = ("business_name", "license_number", "service_radius_km")
logger = logging.getLogger(__name__)
DEV_EMAIL_BACKENDS = {
    "django.core.mail.backends.console.EmailBackend",
    "django.core.mail.backends.filebased.EmailBackend",
    "django.core.mail.backends.locmem.EmailBackend",
}


def otp_has_attempts_remaining(otp):
    return otp.attempts < getattr(settings, "OTP_MAX_ATTEMPTS", 5)


def generate_email_otp(*, email, purpose, payload=None):
    EmailOTP.objects.filter(
        email__iexact=email,
        purpose=purpose,
        consumed_at__isnull=True,
    ).delete()
    code = f"{secrets.randbelow(900000) + 100000}"
    otp = EmailOTP.objects.create(
        email=email,
        purpose=purpose,
        otp_hash=make_password(code),
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
        payload=payload or {},
    )
    return otp, code


def verify_email_otp(*, otp, code):
    if otp.consumed_at or otp.is_expired or not otp_has_attempts_remaining(otp):
        return False
    otp.attempts += 1
    otp.save(update_fields=["attempts"])
    return check_password(code, otp.otp_hash)


def consume_email_otp(otp):
    otp.consumed_at = timezone.now()
    otp.save(update_fields=["consumed_at"])


def get_email_delivery_message(*, label):
    backend = settings.EMAIL_BACKEND
    if backend == "django.core.mail.backends.console.EmailBackend":
        return f"{label} generated successfully. Email backend is set to console mode, so check the Django terminal for the message."
    if backend == "django.core.mail.backends.filebased.EmailBackend":
        return f"{label} generated successfully. Email backend writes messages to local files instead of a real inbox."
    if backend == "django.core.mail.backends.locmem.EmailBackend":
        return f"{label} generated successfully. Email backend is in-memory, so no real email was sent."
    return f"{label} send request accepted. If it does not arrive within 2 minutes, check spam or use resend OTP."


def validate_outbound_email_configuration():
    backend = settings.EMAIL_BACKEND
    if backend in DEV_EMAIL_BACKENDS:
        return

    sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL or "")[1].strip().lower()
    if not sender_email or "@" not in sender_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL is invalid. Set BREVO_SENDER_EMAIL to a verified sender address.")

    if backend == "django.core.mail.backends.smtp.EmailBackend":
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            raise RuntimeError("SMTP credentials are missing. Configure the Brevo SMTP username and password in scrapay-backend/.env.")

        sender_domain = sender_email.rsplit("@", 1)[-1]
        email_host = (settings.EMAIL_HOST or "").strip().lower()
        if "brevo" in email_host:
            if sender_domain.endswith(".local") or sender_email.startswith("your-verified-sender@"):
                raise RuntimeError("Brevo SMTP requires a real verified sender domain. Update BREVO_SENDER_EMAIL in scrapay-backend/.env.")
            if settings.DEBUG:
                logger.info("Using Brevo SMTP with sender %s", sender_email)


def send_transactional_email(*, subject, message, recipient_list):
    validate_outbound_email_configuration()
    sent_count = send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )
    if sent_count != len(recipient_list):
        raise RuntimeError("Email backend did not confirm delivery for the outgoing message.")
    return sent_count


def send_otp_email(*, email, code, purpose):
    context = {
        "code": code,
        "purpose": purpose,
        "expiry_minutes": OTP_EXPIRY_MINUTES,
        "project_name": "Scrapay",
    }
    message = render_to_string("emails/otp_email.txt", context)
    send_transactional_email(
        subject=OTP_EMAIL_SUBJECTS.get(purpose, "Your Scrapay OTP"),
        message=message,
        recipient_list=[email],
    )
    return get_email_delivery_message(label="OTP")


def send_vendor_approval_email(*, vendor):
    """Send email notification when vendor is approved."""
    context = {
        "vendor_name": vendor.profile.full_name if hasattr(vendor, "profile") else vendor.username,
        "business_name": vendor.vendor_profile.business_name if hasattr(vendor, "vendor_profile") else "",
        "project_name": "Scrapay",
    }
    message = render_to_string("emails/vendor_approval.txt", context)
    send_transactional_email(
        subject="Vendor Account Approved - Scrapay",
        message=message,
        recipient_list=[vendor.email],
    )


def send_vendor_rejection_email(*, vendor, rejection_reason=""):
    """Send email notification when vendor is rejected."""
    context = {
        "vendor_name": vendor.profile.full_name if hasattr(vendor, "profile") else vendor.username,
        "business_name": vendor.vendor_profile.business_name if hasattr(vendor, "vendor_profile") else "",
        "rejection_reason": rejection_reason,
        "project_name": "Scrapay",
    }
    message = render_to_string("emails/vendor_rejection.txt", context)
    send_transactional_email(
        subject="Vendor Account Verification Update - Scrapay",
        message=message,
        recipient_list=[vendor.email],
    )


def issue_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def ensure_user_profile(user):
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={"full_name": user.get_full_name() or user.username},
    )
    return profile


def ensure_vendor_availability(user):
    availability, _ = VendorAvailability.objects.get_or_create(
        vendor=user,
        defaults={"is_online": False},
    )
    return availability


def load_user_with_related(user_id):
    return User.objects.select_related("profile", "vendor_profile", "vendor_availability").get(pk=user_id)


def update_user_profile(*, user, data, files):
    profile = ensure_user_profile(user)

    user_fields = {}
    for field in PROFILE_USER_FIELDS:
        if field in data:
            user_fields[field] = data[field]
    if user_fields:
        for key, value in user_fields.items():
            setattr(user, key, value)
        user.save(update_fields=list(user_fields.keys()))

    profile_fields = {}
    for field in PROFILE_DETAIL_FIELDS:
        if field in data:
            profile_fields[field] = data[field]
    if profile_fields:
        for key, value in profile_fields.items():
            setattr(profile, key, value)
        profile.save(update_fields=list(profile_fields.keys()))

    avatar_file = files.get("avatar")
    if avatar_file:
        profile.avatar = avatar_file
        profile.avatar_url = ""
        profile.save(update_fields=["avatar", "avatar_url"])

    if user.role == UserRole.VENDOR and hasattr(user, "vendor_profile"):
        vendor_profile = user.vendor_profile
        vendor_fields = {}
        for field in VENDOR_PROFILE_FIELDS:
            if field not in data:
                continue
            value = data[field]
            if field == "service_radius_km" and (value is None or str(value).strip() == ""):
                continue
            vendor_fields[field] = value
        if vendor_fields:
            for key, value in vendor_fields.items():
                setattr(vendor_profile, key, value)
            vendor_profile.save(update_fields=list(vendor_fields.keys()))

    return load_user_with_related(user.id)


def get_admin_vendor_queryset():
    return (
        User.objects.filter(role=UserRole.VENDOR)
        .select_related("profile", "vendor_profile", "vendor_availability")
        .order_by("id")
    )


def set_vendor_verification(*, vendor, is_verified, rejection_reason=""):
    """
    Approve or reject a vendor's verification.
    
    Args:
        vendor: User instance with role VENDOR
        is_verified: Boolean - True for approval, False for rejection
        rejection_reason: Optional reason for rejection
    """
    vendor_profile = vendor.vendor_profile
    vendor_profile.is_verified = is_verified
    
    if is_verified:
        vendor_profile.verification_status = VerificationStatus.APPROVED
        vendor_profile.verified_at = timezone.now()
        vendor_profile.rejection_reason = ""
    else:
        vendor_profile.verification_status = VerificationStatus.REJECTED
        vendor_profile.rejection_reason = rejection_reason
        vendor_profile.verified_at = None
    
    vendor_profile.save(update_fields=["is_verified", "verification_status", "verified_at", "rejection_reason"])
    
    # Send email notification
    try:
        if is_verified:
            send_vendor_approval_email(vendor=vendor)
        else:
            send_vendor_rejection_email(vendor=vendor, rejection_reason=rejection_reason)
    except Exception as e:
        # Log but don't fail the verification process if email fails
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("Failed to send vendor verification email to %s", vendor.email)
    
    return load_user_with_related(vendor.id)


def get_admin_account_queryset(*, role_filter=""):
    queryset = User.objects.select_related("profile", "vendor_profile").order_by("id")
    if role_filter:
        queryset = queryset.filter(role=role_filter)
    return queryset


def set_account_active_state(*, target_user, is_active):
    target_user.is_active = is_active
    target_user.save(update_fields=["is_active"])
    return load_user_with_related(target_user.id)


def get_admin_analytics():
    from orders.models import Order, OrderStatus

    totals = {
        "total_users": User.objects.filter(role=UserRole.USER).count(),
        "total_vendors": User.objects.filter(role=UserRole.VENDOR).count(),
        "total_orders": Order.objects.count(),
        "completed_orders": Order.objects.filter(status=OrderStatus.COMPLETED).count(),
    }
    totals["revenue"] = (
        Order.objects.filter(status=OrderStatus.COMPLETED).aggregate(total=Sum("total_final"))["total"] or 0
    )
    return totals


def get_admin_order_queryset(*, status_filter=""):
    from orders.models import Order

    queryset = (
        Order.objects.select_related(
            "customer",
            "customer__profile",
            "vendor",
            "vendor__profile",
            "feedback",
        )
        .prefetch_related("items__category")
        .order_by("-created_at")
    )
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    return queryset
