from rest_framework import serializers

from .models import NotificationEvent


class NotificationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationEvent
        fields = ("id", "event_type", "payload", "is_read", "created_at", "order")
