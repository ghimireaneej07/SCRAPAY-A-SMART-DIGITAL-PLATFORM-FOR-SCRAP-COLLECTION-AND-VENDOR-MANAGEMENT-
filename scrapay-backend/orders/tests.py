from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import UserProfile, VendorProfile
from catalog.models import MarketRate, ScrapCategory

from .models import OrderStatus

User = get_user_model()


class OrdersApiTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="securePass123",
            role="user",
        )
        self.vendor = User.objects.create_user(
            username="vendor",
            email="vendor@example.com",
            password="securePass123",
            role="vendor",
        )
        UserProfile.objects.create(
            user=self.vendor,
            full_name="Vendor One",
            address="Vendor Address",
            latitude="13.082700",
            longitude="80.270700",
        )
        VendorProfile.objects.create(user=self.vendor, business_name="Verified Vendor", is_verified=True)
        self.unverified_vendor = User.objects.create_user(
            username="vendor2",
            email="vendor2@example.com",
            password="securePass123",
            role="vendor",
        )
        UserProfile.objects.create(
            user=self.unverified_vendor,
            full_name="Vendor Two",
            address="Vendor2 Address",
            latitude="12.971600",
            longitude="77.594600",
        )
        VendorProfile.objects.create(
            user=self.unverified_vendor, business_name="Unverified Vendor", is_verified=False
        )
        self.category = ScrapCategory.objects.create(code="metal_test", name="Metal Test", is_active=True)
        MarketRate.objects.create(
            category=self.category,
            price_per_kg="20.00",
            effective_from=timezone.now() - timedelta(days=1),
            is_active=True,
        )

    def _create_order_for_vendor(self):
        self.client.force_authenticate(self.customer)
        payload = {
            "vendor": self.vendor.id,
            "pickup_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "address": "123 Test Street",
            "customer_note": "",
            "items": [{"category_id": self.category.id, "quantity_kg": "5.00"}],
        }
        response = self.client.post("/api/orders/my/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data["id"]

    def test_user_can_create_order(self):
        self.client.force_authenticate(self.customer)
        payload = {
            "vendor": self.vendor.id,
            "pickup_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "address": "123 Test Street",
            "customer_note": "",
            "items": [
                {
                    "category_id": self.category.id,
                    "quantity_kg": "5.00",
                    "note": "",
                    "image_url": "",
                }
            ],
        }
        response = self.client.post("/api/orders/my/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], OrderStatus.PENDING)

    def test_user_can_create_order_with_scrap_image(self):
        self.client.force_authenticate(self.customer)
        image = SimpleUploadedFile(
            "scrap.gif",
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!"
            b"\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )
        payload = {
            "vendor": str(self.vendor.id),
            "pickup_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "address": "123 Test Street, Kolkata",
            "customer_note": "",
            "items": f'[{{"category_id": {self.category.id}, "quantity_kg": "5.00", "note": "metal bundle", "image_key": "item_image_0"}}]',
            "item_image_0": image,
        }
        response = self.client.post("/api/orders/my/", payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["items"][0]["image_url"])

    def test_user_cannot_create_order_with_duplicate_categories(self):
        self.client.force_authenticate(self.customer)
        payload = {
            "vendor": self.vendor.id,
            "pickup_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "address": "123 Test Street, Kolkata",
            "customer_note": "",
            "items": [
                {"category_id": self.category.id, "quantity_kg": "5.00"},
                {"category_id": self.category.id, "quantity_kg": "2.00"},
            ],
        }
        response = self.client.post("/api/orders/my/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("only once", str(response.data))

    def test_user_cannot_create_order_with_short_address(self):
        self.client.force_authenticate(self.customer)
        payload = {
            "vendor": self.vendor.id,
            "pickup_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "address": "Too short",
            "customer_note": "",
            "items": [{"category_id": self.category.id, "quantity_kg": "5.00"}],
        }
        response = self.client.post("/api/orders/my/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("more specific", str(response.data))

    def test_vendor_cannot_complete_pending_order_directly(self):
        order_id = self._create_order_for_vendor()

        self.client.force_authenticate(self.vendor)
        response = self.client.patch(f"/api/orders/vendor/{order_id}/complete/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_create_order_for_unverified_vendor(self):
        self.client.force_authenticate(self.customer)
        payload = {
            "vendor": self.unverified_vendor.id,
            "pickup_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "address": "123 Test Street",
            "customer_note": "",
            "items": [{"category_id": self.category.id, "quantity_kg": "5.00"}],
        }
        response = self.client.post("/api/orders/my/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("verified", str(response.data))

    def test_vendor_directory_returns_only_verified_vendors(self):
        self.client.force_authenticate(self.customer)
        response = self.client.get("/api/orders/vendors/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [vendor["id"] for vendor in response.data]
        self.assertIn(self.vendor.id, ids)
        self.assertNotIn(self.unverified_vendor.id, ids)

    def test_vendor_directory_filters_by_geo_radius(self):
        self.client.force_authenticate(self.customer)
        response = self.client.get("/api/orders/vendors/?lat=13.0827&lon=80.2707&radius_km=5")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [vendor["id"] for vendor in response.data]
        self.assertIn(self.vendor.id, ids)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_vendor_can_accept_with_pickup_details_and_email_customer(self):
        order_id = self._create_order_for_vendor()

        self.client.force_authenticate(self.vendor)
        accept_response = self.client.patch(
            f"/api/orders/vendor/{order_id}/accept/",
            {
                "pickup_person_name": "Ramesh Driver",
                "pickup_person_contact": "9800000000",
                "pickup_datetime": (timezone.now() + timedelta(days=2)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_response.data["status"], OrderStatus.ACCEPTED)
        self.assertEqual(accept_response.data["pickup_person_name"], "Ramesh Driver")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Ramesh Driver", mail.outbox[0].body)

    def test_vendor_can_start_then_complete_order(self):
        order_id = self._create_order_for_vendor()

        self.client.force_authenticate(self.vendor)
        accept_response = self.client.patch(
            f"/api/orders/vendor/{order_id}/accept/",
            {"pickup_person_name": "Ramesh Driver", "pickup_person_contact": "9800000000"},
            format="json",
        )
        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_response.data["status"], OrderStatus.ACCEPTED)

        start_response = self.client.patch(f"/api/orders/vendor/{order_id}/start/")
        self.assertEqual(start_response.status_code, status.HTTP_200_OK)
        self.assertEqual(start_response.data["status"], OrderStatus.IN_PROGRESS)

        complete_response = self.client.patch(f"/api/orders/vendor/{order_id}/complete/")
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["status"], OrderStatus.COMPLETED)

    def test_user_can_cancel_pending_order(self):
        order_id = self._create_order_for_vendor()
        self.client.force_authenticate(self.customer)
        response = self.client.patch(f"/api/orders/my/{order_id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], OrderStatus.CANCELLED)

    def test_user_can_submit_feedback_for_completed_order(self):
        order_id = self._create_order_for_vendor()

        self.client.force_authenticate(self.vendor)
        self.client.patch(
            f"/api/orders/vendor/{order_id}/accept/",
            {"pickup_person_name": "Ramesh Driver", "pickup_person_contact": "9800000000"},
            format="json",
        )
        self.client.patch(f"/api/orders/vendor/{order_id}/start/")
        self.client.patch(f"/api/orders/vendor/{order_id}/complete/")

        self.client.force_authenticate(self.customer)
        response = self.client.post(
            f"/api/orders/my/{order_id}/feedback/",
            {"rating": 5, "review": "Great pickup experience"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rating"], 5)

        self.vendor.refresh_from_db()
        self.assertEqual(str(self.vendor.vendor_profile.rating_avg), "5.00")
        self.assertEqual(self.vendor.vendor_profile.rating_count, 1)
