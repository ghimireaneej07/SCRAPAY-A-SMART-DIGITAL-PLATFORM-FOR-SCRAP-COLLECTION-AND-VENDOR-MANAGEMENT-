from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


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
