from decimal import Decimal
from math import asin, cos, radians, sin, sqrt

from django.db import transaction
from django.db.models import Avg, Count
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounts.services import send_transactional_email
from catalog.models import MarketRate

from .models import Order, OrderFeedback, OrderItem, OrderStatus, OrderStatusHistory


VENDOR_STATUS_TRANSITIONS = {
    OrderStatus.PENDING: {OrderStatus.ACCEPTED, OrderStatus.REJECTED},
    OrderStatus.ACCEPTED: {OrderStatus.IN_PROGRESS},
    OrderStatus.IN_PROGRESS: {OrderStatus.COMPLETED},
}


def haversine_km(lat1, lon1, lat2, lon2):
    earth_radius_km = 6371.0
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(a))


def _get_latest_rate_map(category_ids):
    latest_rates = {}
    if not category_ids:
        return latest_rates

    rate_queryset = (
        MarketRate.objects.filter(
            category_id__in=category_ids,
            is_active=True,
            effective_from__lte=timezone.now(),
        )
        .order_by("category_id", "-effective_from", "-id")
        .only("category_id", "price_per_kg")
    )
    for rate in rate_queryset:
        latest_rates.setdefault(rate.category_id, rate)
    return latest_rates


def create_order_with_items(*, customer, validated_data, files):
    items = validated_data.pop("items")
    rate_map = _get_latest_rate_map([item["category_id"] for item in items])

    with transaction.atomic():
        order = Order.objects.create(customer=customer, **validated_data)
        estimated_total = Decimal("0.00")

        for item in items:
            order_item = OrderItem.objects.create(
                order=order,
                category_id=item["category_id"],
                quantity_kg=item["quantity_kg"],
                note=item.get("note", ""),
                image_url=item.get("image_url", ""),
                image=files.get(item.get("image_key", "")) if item.get("image_key") else None,
            )
            latest_rate = rate_map.get(order_item.category_id)
            if latest_rate:
                estimated_total += latest_rate.price_per_kg * order_item.quantity_kg

        order.total_estimated = estimated_total
        order.save(update_fields=["total_estimated", "updated_at"])
        OrderStatusHistory.objects.create(
            order=order,
            from_status="",
            to_status=OrderStatus.PENDING,
            changed_by=customer,
        )

    return Order.objects.select_related(
        "customer",
        "customer__profile",
        "vendor",
        "vendor__profile",
        "feedback",
    ).prefetch_related("items__category").get(pk=order.pk)


def cancel_order(*, order, changed_by):
    if order.status not in {OrderStatus.PENDING, OrderStatus.ACCEPTED}:
        raise ValidationError({"detail": f"Order cannot be cancelled from status '{order.status}'."})

    with transaction.atomic():
        locked_order = Order.objects.select_for_update().get(pk=order.pk)
        from_status = locked_order.status
        if from_status not in {OrderStatus.PENDING, OrderStatus.ACCEPTED}:
            raise ValidationError({"detail": f"Order cannot be cancelled from status '{from_status}'."})

        locked_order.status = OrderStatus.CANCELLED
        locked_order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(
            order=locked_order,
            from_status=from_status,
            to_status=OrderStatus.CANCELLED,
            changed_by=changed_by,
        )

    if locked_order.vendor_id:
        from notifications.services import send_vendor_event

        send_vendor_event(
            locked_order.vendor_id,
            {
                "type": "order_status_updated",
                "order_id": locked_order.id,
                "from_status": from_status,
                "to_status": OrderStatus.CANCELLED,
            },
        )

    return Order.objects.select_related(
        "customer",
        "customer__profile",
        "vendor",
        "vendor__profile",
        "feedback",
    ).prefetch_related("items__category").get(pk=order.pk)


def refresh_vendor_rating(vendor_id):
    from accounts.models import VendorProfile

    aggregates = OrderFeedback.objects.filter(vendor_id=vendor_id).aggregate(
        rating_avg=Avg("rating"),
        rating_count=Count("id"),
    )
    vendor_profile = VendorProfile.objects.filter(user_id=vendor_id).first()
    if not vendor_profile:
        return
    vendor_profile.rating_avg = aggregates["rating_avg"] or 0
    vendor_profile.rating_count = aggregates["rating_count"] or 0
    vendor_profile.save(update_fields=["rating_avg", "rating_count"])


def submit_order_feedback(*, order, customer, rating, review=""):
    if order.status != OrderStatus.COMPLETED:
        raise ValidationError({"detail": "Feedback can only be submitted for completed orders."})
    if not order.vendor_id:
        raise ValidationError({"detail": "Cannot submit feedback for order without vendor."})

    with transaction.atomic():
        feedback, _ = OrderFeedback.objects.update_or_create(
            order=order,
            defaults={
                "customer": customer,
                "vendor_id": order.vendor_id,
                "rating": rating,
                "review": review,
            },
        )
        refresh_vendor_rating(order.vendor_id)
    return feedback


def change_vendor_order_status(*, order, changed_by, to_status, approval_data=None):
    approval_data = approval_data or {}

    with transaction.atomic():
        locked_order = Order.objects.select_for_update().select_related(
            "customer",
            "customer__profile",
            "vendor",
        ).get(pk=order.pk)
        from_status = locked_order.status
        allowed_statuses = VENDOR_STATUS_TRANSITIONS.get(from_status, set())
        if to_status not in allowed_statuses:
            raise ValidationError(
                {"detail": f"Invalid status transition from '{from_status}' to '{to_status}'."}
            )

        update_fields = ["status", "updated_at"]
        if to_status == OrderStatus.ACCEPTED:
            locked_order.pickup_person_name = approval_data["pickup_person_name"]
            locked_order.pickup_person_contact = approval_data.get("pickup_person_contact", "")
            if approval_data.get("pickup_datetime"):
                locked_order.pickup_datetime = approval_data["pickup_datetime"]
                update_fields.append("pickup_datetime")
            locked_order.approved_at = timezone.now()
            update_fields.extend(["pickup_person_name", "pickup_person_contact", "approved_at"])

        locked_order.status = to_status
        locked_order.save(update_fields=update_fields)
        OrderStatusHistory.objects.create(
            order=locked_order,
            from_status=from_status,
            to_status=to_status,
            changed_by=changed_by,
        )

    from notifications.services import send_user_event

    send_user_event(
        locked_order.customer_id,
        {
            "type": "order_status_updated",
            "order_id": locked_order.id,
            "from_status": from_status,
            "to_status": to_status,
        },
    )
    if to_status == OrderStatus.ACCEPTED:
        send_pickup_approval_email(locked_order)
    elif to_status == OrderStatus.COMPLETED:
        send_order_completion_email(locked_order)

    return Order.objects.select_related(
        "customer",
        "customer__profile",
        "vendor",
        "vendor__profile",
        "feedback",
    ).prefetch_related("items__category").get(pk=order.pk)


def filter_vendors_by_distance(*, queryset, lat, lon, radius_km):
    if not lat or not lon:
        return queryset

    try:
        user_lat = float(lat)
        user_lon = float(lon)
        max_radius_km = float(radius_km or 25)
    except (TypeError, ValueError):
        return queryset

    nearby_vendor_ids = []
    for vendor in queryset:
        profile = getattr(vendor, "profile", None)
        vendor_profile = getattr(vendor, "vendor_profile", None)
        if not profile or profile.latitude is None or profile.longitude is None or not vendor_profile:
            nearby_vendor_ids.append(vendor.id)
            continue

        distance_km = haversine_km(
            user_lat,
            user_lon,
            float(profile.latitude),
            float(profile.longitude),
        )
        if distance_km <= max_radius_km and distance_km <= float(vendor_profile.service_radius_km):
            nearby_vendor_ids.append(vendor.id)

    return queryset.filter(id__in=nearby_vendor_ids)


def send_order_completion_email(order):
    if not order.customer.email:
        return

    context = {
        "customer_name": getattr(getattr(order.customer, "profile", None), "full_name", "")
        or order.customer.username,
        "order_id": order.id,
        "total_final": order.total_final or order.total_estimated,
    }
    message = render_to_string("emails/order_completed.txt", context)
    send_transactional_email(
        subject=f"Scrapay order #{order.id} completed - Thank you!",
        message=message,
        recipient_list=[order.customer.email],
    )


def send_pickup_approval_email(order):
    if not order.customer.email:
        return

    pickup_dt = order.pickup_datetime
    context = {
        "customer_name": getattr(getattr(order.customer, "profile", None), "full_name", "")
        or order.customer.username,
        "pickup_date": pickup_dt.strftime("%d %B %Y"),
        "pickup_time": pickup_dt.strftime("%I:%M %p"),
        "pickup_person_name": order.pickup_person_name
        or (order.vendor.username if order.vendor else "Scrapay pickup team"),
        "pickup_person_contact": order.pickup_person_contact,
        "order_id": order.id,
    }
    message = render_to_string("emails/pickup_approved.txt", context)
    send_transactional_email(
        subject=f"Scrapay pickup approved for order #{order.id}",
        message=message,
        recipient_list=[order.customer.email],
    )
