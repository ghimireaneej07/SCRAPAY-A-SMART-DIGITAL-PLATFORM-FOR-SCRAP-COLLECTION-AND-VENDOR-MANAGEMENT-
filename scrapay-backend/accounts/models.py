from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    USER = "user", "User"
    VENDOR = "vendor", "Vendor"
    ADMIN = "admin", "Admin"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.USER)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255)
    avatar_url = models.URLField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=12, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"


class VerificationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class VendorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vendor_profile")
    business_name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, blank=True)
    service_radius_km = models.DecimalField(max_digits=6, decimal_places=2, default=10)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    rejection_reason = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.business_name


class VendorAvailability(models.Model):
    vendor = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vendor_availability")
    is_online = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vendor.username} - {'online' if self.is_online else 'offline'}"


class OTPPurpose(models.TextChoices):
    REGISTER_USER = "register_user", "Register User"
    REGISTER_VENDOR = "register_vendor", "Register Vendor"
    PASSWORD_RESET = "password_reset", "Password Reset"
    ADMIN_LOGIN = "admin_login", "Admin Login"


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    purpose = models.CharField(max_length=32, choices=OTPPurpose.choices)
    otp_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.purpose})"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

# Create your models here.
