from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

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
        self.category = ScrapCategory.objects.create(code="metal_test", name="Metal Test", is_active=True)
        MarketRate.objects.create(
            category=self.category,
            price_per_kg="20.00",
            effective_from=timezone.now() - timedelta(days=1),
            is_active=True,
        )

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

    def test_vendor_cannot_complete_pending_order_directly(self):
        self.client.force_authenticate(self.customer)
        create_payload = {
            "vendor": self.vendor.id,
            "pickup_datetime": (timezone.now() + timedelta(days=1)).isoformat(),
            "address": "123 Test Street",
            "customer_note": "",
            "items": [{"category_id": self.category.id, "quantity_kg": "5.00"}],
        }
        created = self.client.post("/api/orders/my/", create_payload, format="json")
        order_id = created.data["id"]

        self.client.force_authenticate(self.vendor)
        response = self.client.patch(f"/api/orders/vendor/{order_id}/complete/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
