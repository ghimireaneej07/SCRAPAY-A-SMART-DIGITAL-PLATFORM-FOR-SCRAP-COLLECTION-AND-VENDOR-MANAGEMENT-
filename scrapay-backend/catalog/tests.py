from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import MarketRate, ScrapCategory

User = get_user_model()


class CatalogApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="catalog-user",
            email="catalog@example.com",
            password="securePass123",
            role="user",
        )
        self.category = ScrapCategory.objects.create(code="plastic_test", name="Plastic Test", is_active=True)
        MarketRate.objects.create(
            category=self.category,
            price_per_kg="14.00",
            effective_from=timezone.now() - timedelta(days=1),
            is_active=True,
        )

    def test_catalog_endpoints_require_auth(self):
        response = self.client.get("/api/catalog/scrap-categories")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_latest_rates_for_authenticated_user(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/catalog/market-rates/latest")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
