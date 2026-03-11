from io import StringIO

from django.core.management import call_command
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserProfile
from .models import VendorProfile
from orders.models import Order, OrderStatus

User = get_user_model()


class AuthApiTests(APITestCase):
    def test_user_registration_login_and_me(self):
        register_payload = {
            "username": "user1",
            "email": "user1@example.com",
            "phone": "9999999999",
            "password": "securePass123",
            "full_name": "User One",
            "address": "Kolkata",
        }
        register_url = reverse("register-user")
        response = self.client.post(register_url, register_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        login_url = reverse("login")
        login_response = self.client.post(
            login_url, {"username": "user1", "password": "securePass123"}, format="json"
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

        token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me_url = reverse("me")
        me_response = self.client.get(me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["username"], "user1")

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
            username="admin1",
            email="admin1@example.com",
            password="securePass123",
            role="admin",
        )
        self.client.force_authenticate(admin)
        url = reverse("admin-analytics")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_users", response.data)
        self.assertIn("total_vendors", response.data)
        self.assertIn("total_orders", response.data)
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
        self.assertEqual(response.data[0]["status"], OrderStatus.PENDING)

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
        self.assertTrue(existing.check_password("securePass123"))

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
        self.assertEqual(get_response.data["full_name"], "Profile User")

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
        url = reverse("profile")
        response = self.client.patch(
            url,
            {"full_name": "Vendor Updated", "service_radius_km": ""},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Vendor Updated")
