from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import NotificationEvent

User = get_user_model()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notif-user",
            email="notif@example.com",
            password="securePass123",
            role="user",
        )
        self.event = NotificationEvent.objects.create(
            recipient=self.user,
            event_type="order_status_updated",
            payload={"order_id": 1, "type": "order_status_updated"},
        )

    def test_list_notifications(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_mark_notification_read(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(f"/api/notifications/{self.event.id}/read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertTrue(self.event.is_read)
