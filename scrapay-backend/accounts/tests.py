from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core import mail
from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Order, OrderStatus

from .models import EmailOTP, OTPPurpose, UserProfile, VendorProfile

User = get_user_model()


class AuthApiTests(APITestCase):
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp-relay.brevo.com",
        EMAIL_HOST_USER="smtp-user",
        EMAIL_HOST_PASSWORD="smtp-pass",
        DEFAULT_FROM_EMAIL="your-verified-sender@yourdomain.com",
    )
    def test_vendor_registration_otp_request_rejects_placeholder_brevo_sender(self):
        response = self.client.post(
            reverse("otp-request"),
            {
                "purpose": OTPPurpose.REGISTER_VENDOR,
                "username": "vendor1",
                "email": "vendor1@example.com",
                "phone": "9999999999",
                "password": "securePass123",
                "full_name": "Vendor One",
                "business_name": "Vendor One Metals",
                "address": "Kolkata, India",
                "service_radius_km": "10.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("verified sender domain", response.data["detail"])
        self.assertFalse(
            EmailOTP.objects.filter(email="vendor1@example.com", purpose=OTPPurpose.REGISTER_VENDOR).exists()
        )

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.console.EmailBackend")
    def test_vendor_registration_otp_request_console_backend_mentions_terminal(self):
        response = self.client.post(
            reverse("otp-request"),
            {
                "purpose": OTPPurpose.REGISTER_VENDOR,
                "username": "vendor_console",
                "email": "vendor_console@example.com",
                "phone": "9999999999",
                "password": "securePass123",
                "full_name": "Vendor Console",
                "business_name": "Console Metals",
                "address": "Kolkata, India",
                "service_radius_km": "10.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("check the Django terminal", response.data["detail"])

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_user_registration_otp_verification_creates_account_and_tokens(self):
        request_response = self.client.post(
            reverse("otp-request"),
            {
                "purpose": OTPPurpose.REGISTER_USER,
                "username": "user1",
                "email": "user1@example.com",
                "phone": "9999999999",
                "password": "securePass123",
                "full_name": "User One",
                "address": "Kolkata, India",
            },
            format="json",
        )
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        otp_record = EmailOTP.objects.get(email="user1@example.com", purpose=OTPPurpose.REGISTER_USER)
        otp_record.otp_hash = make_password("123456")
        otp_record.save(update_fields=["otp_hash"])

        verify_response = self.client.post(
            reverse("otp-verify"),
            {"purpose": OTPPurpose.REGISTER_USER, "email": "user1@example.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", verify_response.data)
        self.assertEqual(verify_response.data["user"]["role"], "user")

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_requesting_new_registration_otp_replaces_previous_pending_code(self):
        request_payload = {
            "purpose": OTPPurpose.REGISTER_USER,
            "username": "user_replace",
            "email": "user_replace@example.com",
            "phone": "9999999999",
            "password": "securePass123",
            "full_name": "User Replace",
            "address": "Kolkata, India",
        }

        first_response = self.client.post(reverse("otp-request"), request_payload, format="json")
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        first_otp_id = EmailOTP.objects.get(email="user_replace@example.com", purpose=OTPPurpose.REGISTER_USER).id

        second_response = self.client.post(reverse("otp-request"), request_payload, format="json")
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)

        otp_records = EmailOTP.objects.filter(email="user_replace@example.com", purpose=OTPPurpose.REGISTER_USER)
        self.assertEqual(otp_records.count(), 1)
        self.assertNotEqual(otp_records.first().id, first_otp_id)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", OTP_MAX_ATTEMPTS=3)
    def test_registration_otp_attempt_limit_requires_requesting_a_new_code(self):
        request_payload = {
            "purpose": OTPPurpose.REGISTER_USER,
            "username": "otp_limit_user",
            "email": "otp_limit@example.com",
            "phone": "9999999999",
            "password": "securePass123",
            "full_name": "OTP Limit User",
            "address": "Kolkata, India",
        }
        request_response = self.client.post(reverse("otp-request"), request_payload, format="json")
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)

        otp_record = EmailOTP.objects.get(email="otp_limit@example.com", purpose=OTPPurpose.REGISTER_USER)
        otp_record.otp_hash = make_password("123456")
        otp_record.save(update_fields=["otp_hash"])

        for _ in range(2):
            invalid_response = self.client.post(
                reverse("otp-verify"),
                {"purpose": OTPPurpose.REGISTER_USER, "email": "otp_limit@example.com", "otp": "000000"},
                format="json",
            )
            self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(invalid_response.data["detail"], "Invalid OTP.")

        locked_response = self.client.post(
            reverse("otp-verify"),
            {"purpose": OTPPurpose.REGISTER_USER, "email": "otp_limit@example.com", "otp": "000000"},
            format="json",
        )
        self.assertEqual(locked_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(locked_response.data["detail"], "OTP attempt limit reached. Request a new OTP.")

        new_otp_response = self.client.post(reverse("otp-request"), request_payload, format="json")
        self.assertEqual(new_otp_response.status_code, status.HTTP_200_OK)

        new_otp_record = EmailOTP.objects.get(email="otp_limit@example.com", purpose=OTPPurpose.REGISTER_USER)
        self.assertEqual(new_otp_record.attempts, 0)

    def test_password_login_returns_tokens_for_non_admin(self):
        User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="securePass123",
            role="user",
        )
        response = self.client.post(
            reverse("login"),
            {"identifier": "user1@example.com", "password": "securePass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertFalse(response.data.get("requires_otp", False))

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_admin_login_requires_password_then_otp(self):
        User.objects.create_user(
            username="admin1",
            email="admin1@example.com",
            password="securePass123",
            role="admin",
        )
        login_response = self.client.post(
            reverse("login"),
            {"identifier": "admin1@example.com", "password": "securePass123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertTrue(login_response.data["requires_otp"])
        self.assertEqual(len(mail.outbox), 1)

        otp_record = EmailOTP.objects.get(email="admin1@example.com", purpose=OTPPurpose.ADMIN_LOGIN)
        otp_record.otp_hash = make_password("123456")
        otp_record.save(update_fields=["otp_hash"])

        verify_response = self.client.post(
            reverse("otp-verify"),
            {"purpose": OTPPurpose.ADMIN_LOGIN, "email": "admin1@example.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_response.data["user"]["role"], "admin")
        self.assertIn("access", verify_response.data)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_forgot_password_otp_resets_password(self):
        user = User.objects.create_user(
            username="forgot_user",
            email="forgot@example.com",
            password="oldPass123",
            role="user",
        )
        otp_response = self.client.post(
            reverse("otp-request"),
            {"purpose": OTPPurpose.PASSWORD_RESET, "email": "forgot@example.com"},
            format="json",
        )
        self.assertEqual(otp_response.status_code, status.HTTP_200_OK)

        otp_record = EmailOTP.objects.get(email="forgot@example.com", purpose=OTPPurpose.PASSWORD_RESET)
        otp_record.otp_hash = make_password("123456")
        otp_record.save(update_fields=["otp_hash"])

        reset_response = self.client.post(
            reverse("password-reset-confirm"),
            {"email": "forgot@example.com", "otp": "123456", "new_password": "newSecure456"},
            format="json",
        )
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("newSecure456"))

    def test_vendor_availability_toggle(self):
        vendor = User.objects.create_user(
            username="vendor1",
            email="vendor1@example.com",
            password="securePass123",
            role="vendor",
        )
        self.client.force_authenticate(vendor)
        url = reverse("vendor-availability")
        initial = self.client.get(url)
        self.assertEqual(initial.status_code, status.HTTP_200_OK)
        self.assertFalse(initial.data["is_online"])

        updated = self.client.patch(url, {"is_online": True}, format="json")
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertTrue(updated.data["is_online"])

    def test_admin_analytics_endpoint(self):
        admin = User.objects.create_user(
            username="admin2",
            email="admin2@example.com",
            password="securePass123",
            role="admin",
        )
        self.client.force_authenticate(admin)
        response = self.client.get(reverse("admin-analytics"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_users", response.data)
        self.assertIn("revenue", response.data)

    def test_admin_orders_endpoint(self):
        admin = User.objects.create_user(
            username="admin_orders",
            email="admin_orders@example.com",
            password="securePass123",
            role="admin",
        )
        customer = User.objects.create_user(
            username="customer_orders",
            email="customer_orders@example.com",
            password="securePass123",
            role="user",
        )
        vendor = User.objects.create_user(
            username="vendor_orders",
            email="vendor_orders@example.com",
            password="securePass123",
            role="vendor",
        )
        Order.objects.create(
            customer=customer,
            vendor=vendor,
            status=OrderStatus.PENDING,
            pickup_datetime="2030-01-01T10:00:00Z",
            address="123 Market Street, Kolkata",
            customer_note="Handle carefully",
            total_estimated="120.00",
        )

        self.client.force_authenticate(admin)
        response = self.client.get(reverse("admin-orders"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_admin_can_list_and_suspend_accounts(self):
        admin = User.objects.create_user(
            username="admin_manage",
            email="admin_manage@example.com",
            password="securePass123",
            role="admin",
        )
        user = User.objects.create_user(
            username="normal_user",
            email="normal_user@example.com",
            password="securePass123",
            role="user",
        )
        self.client.force_authenticate(admin)
        list_response = self.client.get(reverse("admin-accounts"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(account["id"] == user.id for account in list_response.data))

        suspend_response = self.client.patch(
            reverse("admin-account-status", kwargs={"user_id": user.id}),
            {"is_active": False},
            format="json",
        )
        self.assertEqual(suspend_response.status_code, status.HTTP_200_OK)
        self.assertFalse(suspend_response.data["is_active"])

    def test_admin_cannot_suspend_self(self):
        admin = User.objects.create_user(
            username="admin_self",
            email="admin_self@example.com",
            password="securePass123",
            role="admin",
        )
        self.client.force_authenticate(admin)
        response = self.client.patch(
            reverse("admin-account-status", kwargs={"user_id": admin.id}),
            {"is_active": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seed_admin_command_creates_admin_account(self):
        output = StringIO()
        call_command(
            "seed_admin",
            username="platform_admin",
            email="platform_admin@example.com",
            password="securePass123",
            stdout=output,
        )
        admin = User.objects.get(username="platform_admin")
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_seed_admin_command_updates_existing_account(self):
        existing = User.objects.create_user(
            username="ops_admin",
            email="ops_old@example.com",
            password="oldPass123",
            role="user",
        )
        call_command(
            "seed_admin",
            username="ops_admin",
            email="ops_new@example.com",
            password="securePass123",
        )
        existing.refresh_from_db()
        self.assertEqual(existing.role, "admin")
        self.assertEqual(existing.email, "ops_new@example.com")

    def test_user_profile_get_and_update(self):
        user = User.objects.create_user(
            username="profile_user",
            email="profile@example.com",
            password="securePass123",
            role="user",
        )
        UserProfile.objects.create(user=user, full_name="Profile User", address="Old Address")
        self.client.force_authenticate(user)
        url = reverse("profile")
        get_response = self.client.get(url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        patch_response = self.client.patch(
            url,
            {"full_name": "Updated User", "avatar_url": "https://example.com/avatar.png"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["full_name"], "Updated User")

    def test_vendor_profile_update_allows_empty_service_radius(self):
        vendor = User.objects.create_user(
            username="vendor_profile",
            email="vendor_profile@example.com",
            password="securePass123",
            role="vendor",
        )
        UserProfile.objects.create(user=vendor, full_name="Vendor Profile")
        VendorProfile.objects.create(user=vendor, business_name="Vendor Biz", service_radius_km="10.00")
        self.client.force_authenticate(vendor)
        response = self.client.patch(
            reverse("profile"),
            {"full_name": "Vendor Updated", "service_radius_km": ""},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Vendor Updated")
