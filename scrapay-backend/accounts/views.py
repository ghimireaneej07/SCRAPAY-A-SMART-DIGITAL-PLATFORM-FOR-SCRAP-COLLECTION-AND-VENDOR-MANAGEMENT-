import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .models import OTPPurpose, User, UserRole
from .permissions import IsAdminRole, IsVendorRole
from .services import (
    consume_email_otp,
    ensure_user_profile,
    ensure_vendor_availability,
    generate_email_otp,
    get_admin_account_queryset,
    get_admin_analytics,
    get_admin_order_queryset,
    get_admin_vendor_queryset,
    issue_tokens_for_user,
    load_user_with_related,
    otp_has_attempts_remaining,
    send_otp_email,
    set_account_active_state,
    set_vendor_verification,
    update_user_profile,
    verify_email_otp,
)
from .serializers import (
    AdminAccountListSerializer,
    AdminAccountStatusSerializer,
    AdminVendorListSerializer,
    AdminVendorVerifySerializer,
    LoginSerializer,
    OTPRequestSerializer,
    PasswordResetConfirmSerializer,
    OTPVerifySerializer,
    ProfileSerializer,
    RegisterUserSerializer,
    RegisterVendorSerializer,
    UserSerializer,
    VendorAvailabilitySerializer,
)
from orders.serializers import OrderReadSerializer

UserModel = get_user_model()
logger = logging.getLogger(__name__)


class RegisterUserView(CreateAPIView):
    serializer_class = RegisterUserSerializer
    permission_classes = [AllowAny]


class RegisterVendorView(CreateAPIView):
    serializer_class = RegisterVendorSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if user.role == UserRole.ADMIN:
            otp, code = generate_email_otp(
                email=user.email,
                purpose=OTPPurpose.ADMIN_LOGIN,
                payload={"user_id": user.id},
            )
            try:
                delivery_detail = send_otp_email(email=user.email, code=code, purpose=OTPPurpose.ADMIN_LOGIN)
            except Exception as exc:
                otp.delete()
                logger.exception("Failed to send admin login OTP email to %s", user.email)
                detail = "Unable to send admin OTP email. Check SMTP/Brevo configuration."
                if isinstance(exc, RuntimeError):
                    detail = str(exc)
                elif settings.DEBUG:
                    detail = f"{detail} {exc}"
                return Response({"detail": detail}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            return Response(
                {
                    "detail": delivery_detail,
                    "requires_otp": True,
                    "email": user.email,
                    "otp_request_id": otp.id,
                    "expires_at": otp.expires_at,
                },
                status=status.HTTP_200_OK,
            )

        token_payload = issue_tokens_for_user(user)
        token_payload["user"] = UserSerializer(user, context={"request": request}).data
        return Response(token_payload, status=status.HTTP_200_OK)


class OTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp, code = generate_email_otp(
            email=serializer.validated_data["email"],
            purpose=serializer.validated_data["purpose"],
            payload=serializer.validated_data.get("registration_payload", serializer.validated_data.get("otp_payload", {})),
        )
        try:
            delivery_detail = send_otp_email(
                email=serializer.validated_data["email"],
                code=code,
                purpose=serializer.validated_data["purpose"],
            )
        except Exception as exc:
            otp.delete()
            logger.exception("Failed to send OTP email to %s for %s", serializer.validated_data["email"], serializer.validated_data["purpose"])
            detail = "Unable to send OTP email. Check SMTP/Brevo configuration."
            if isinstance(exc, RuntimeError):
                detail = str(exc)
            elif settings.DEBUG:
                detail = f"{detail} {exc}"
            return Response({"detail": detail}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(
            {
                "detail": delivery_detail,
                "otp_request_id": otp.id,
                "expires_at": otp.expires_at,
            },
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp_record = serializer.validated_data["otp_record"]
        if otp_record.consumed_at:
            return Response({"detail": "This OTP has already been used."}, status=status.HTTP_400_BAD_REQUEST)
        if otp_record.is_expired:
            return Response({"detail": "This OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp_has_attempts_remaining(otp_record):
            return Response({"detail": "OTP attempt limit reached. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if not verify_email_otp(otp=otp_record, code=serializer.validated_data["otp"]):
            if not otp_has_attempts_remaining(otp_record):
                return Response({"detail": "OTP attempt limit reached. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.purpose == OTPPurpose.REGISTER_VENDOR:
            register_serializer = RegisterVendorSerializer(data=otp_record.payload)
            register_serializer.is_valid(raise_exception=True)
            user = register_serializer.save()
        elif otp_record.purpose == OTPPurpose.REGISTER_USER:
            register_serializer = RegisterUserSerializer(data=otp_record.payload)
            register_serializer.is_valid(raise_exception=True)
            user = register_serializer.save()
        elif otp_record.purpose == OTPPurpose.ADMIN_LOGIN:
            user = UserModel.objects.filter(
                id=otp_record.payload.get("user_id"),
                email__iexact=serializer.validated_data["email"],
                role=UserRole.ADMIN,
                is_active=True,
            ).first()
            if not user:
                return Response({"detail": "Admin account not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"detail": "Unsupported OTP verification flow."}, status=status.HTTP_400_BAD_REQUEST)

        consume_email_otp(otp_record)
        token_payload = issue_tokens_for_user(user)
        token_payload["user"] = UserSerializer(user, context={"request": request}).data
        return Response(token_payload, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp_record = serializer.validated_data["otp_record"]
        if otp_record.consumed_at:
            return Response({"detail": "This OTP has already been used."}, status=status.HTTP_400_BAD_REQUEST)
        if otp_record.is_expired:
            return Response({"detail": "This OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp_has_attempts_remaining(otp_record):
            return Response({"detail": "OTP attempt limit reached. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if not verify_email_otp(otp=otp_record, code=serializer.validated_data["otp"]):
            if not otp_has_attempts_remaining(otp_record):
                return Response({"detail": "OTP attempt limit reached. Request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        user = UserModel.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
        if not user:
            return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        consume_email_otp(otp_record)
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class MeView(RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return load_user_with_related(self.request.user.id)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = load_user_with_related(request.user.id)
        ensure_user_profile(user)
        serializer = ProfileSerializer(load_user_with_related(user.id), context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = load_user_with_related(request.user.id)
        user = update_user_profile(user=user, data=request.data, files=request.FILES)
        serializer = ProfileSerializer(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminVendorListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        vendors = get_admin_vendor_queryset()
        serializer = AdminVendorListSerializer(vendors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminVendorVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, vendor_id):
        vendor = (
            User.objects.filter(role=UserRole.VENDOR, id=vendor_id)
            .select_related("vendor_profile")
            .first()
        )
        if not vendor or not hasattr(vendor, "vendor_profile"):
            return Response({"detail": "Vendor not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminVendorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = set_vendor_verification(
            vendor=vendor,
            is_verified=serializer.validated_data["is_verified"],
            rejection_reason=serializer.validated_data.get("rejection_reason", ""),
        )
        payload = AdminVendorListSerializer(vendor).data
        return Response(payload, status=status.HTTP_200_OK)


class AdminAccountListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        role_filter = (request.query_params.get("role") or "").strip()
        queryset = get_admin_account_queryset(role_filter=role_filter)
        serializer = AdminAccountListSerializer(queryset[:50], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAccountStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, user_id):
        target_user = User.objects.filter(id=user_id).first()
        if not target_user:
            return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
        if target_user.id == request.user.id:
            return Response(
                {"detail": "You cannot deactivate your own admin account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AdminAccountStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = set_account_active_state(
            target_user=target_user,
            is_active=serializer.validated_data["is_active"],
        )
        payload = AdminAccountListSerializer(target_user).data
        return Response(payload, status=status.HTTP_200_OK)


class VendorAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsVendorRole]

    def get(self, request):
        user = load_user_with_related(request.user.id)
        availability = getattr(user, "vendor_availability", None) or ensure_vendor_availability(user)
        serializer = VendorAvailabilitySerializer(availability)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        availability = ensure_vendor_availability(request.user)
        serializer = VendorAvailabilitySerializer(availability, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response(get_admin_analytics(), status=status.HTTP_200_OK)


class AdminOrderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        status_filter = (request.query_params.get("status") or "").strip()
        queryset = get_admin_order_queryset(status_filter=status_filter)
        serializer = OrderReadSerializer(queryset[:25], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
# Create your views here.
