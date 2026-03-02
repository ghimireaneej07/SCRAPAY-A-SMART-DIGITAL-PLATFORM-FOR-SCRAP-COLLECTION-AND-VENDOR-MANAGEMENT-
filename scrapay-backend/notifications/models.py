from django.db import models


class NotificationEvent(models.Model):
    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notification_events"
    )
    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

# Create your models here.
