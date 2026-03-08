from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import NotificationEvent


def _persist_event(user_id, event_type, payload):
    NotificationEvent.objects.create(
        recipient_id=user_id,
        order_id=payload.get("order_id"),
        event_type=event_type,
        payload=payload,
    )


def _send_group_event(group_name, payload):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "realtime.message",
                "payload": payload,
            },
        )
    except Exception:
        # Keep API side effects resilient even when channel backend is unavailable.
        return


def send_user_event(user_id, payload):
    event_type = payload.get("type", "generic")
    _persist_event(user_id, event_type, payload)
    _send_group_event(f"user_{user_id}", payload)


def send_vendor_event(vendor_id, payload):
    event_type = payload.get("type", "generic")
    _persist_event(vendor_id, event_type, payload)
    _send_group_event(f"vendor_{vendor_id}", payload)
