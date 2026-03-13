from django.contrib import admin

from .models import EmailOTP, User, UserProfile, VendorProfile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "full_name", "city", "state")
    search_fields = ("user__username", "user__email", "full_name", "city")


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "business_name", "verification_status", "is_verified", "verified_at")
    list_filter = ("verification_status", "is_verified")
    search_fields = ("user__username", "user__email", "business_name", "license_number")


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "purpose", "attempts", "created_at", "expires_at", "consumed_at")
    list_filter = ("purpose", "consumed_at", "created_at")
    search_fields = ("email",)
    readonly_fields = ("email", "purpose", "attempts", "payload", "created_at", "expires_at", "consumed_at")
    exclude = ("otp_hash",)
