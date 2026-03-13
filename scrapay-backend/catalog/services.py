from django.db.models import F, OuterRef, Q, Subquery
from django.utils import timezone

from accounts.models import User, UserRole
from orders.models import Order

from .models import MarketRate, ScrapCategory


def get_active_categories_queryset():
    return ScrapCategory.objects.filter(is_active=True).order_by("name")


def get_latest_market_rates_queryset():
    now = timezone.now()
    latest_rate_id = (
        MarketRate.objects.filter(
            category_id=OuterRef("category_id"),
            is_active=True,
            effective_from__lte=now,
        )
        .order_by("-effective_from", "-id")
        .values("id")[:1]
    )
    return (
        MarketRate.objects.filter(is_active=True, effective_from__lte=now)
        .annotate(latest_rate_id=Subquery(latest_rate_id))
        .filter(id=F("latest_rate_id"))
        .select_related("category")
        .order_by("category__name")
    )


def build_global_search_payload(*, query, user):
    cleaned_query = (query or "").strip()
    if len(cleaned_query) < 2:
        return {"categories": ScrapCategory.objects.none(), "vendors": [], "orders": []}

    categories = get_active_categories_queryset().filter(
        Q(name__icontains=cleaned_query) | Q(code__icontains=cleaned_query)
    )[:5]

    vendors = []
    if user.role in {UserRole.USER, UserRole.ADMIN}:
        vendor_qs = (
            User.objects.filter(role=UserRole.VENDOR, is_active=True)
            .filter(
                Q(username__icontains=cleaned_query)
                | Q(vendor_profile__business_name__icontains=cleaned_query)
            )
            .select_related("vendor_profile")
            .order_by("id")[:5]
        )
        vendors = [
            {
                "id": vendor.id,
                "username": vendor.username,
                "business_name": getattr(vendor.vendor_profile, "business_name", ""),
            }
            for vendor in vendor_qs
        ]

    orders = []
    order_filters = Q(status__icontains=cleaned_query)
    if cleaned_query.isdigit():
        order_filters |= Q(id=int(cleaned_query))

    if user.role == UserRole.USER:
        order_qs = Order.objects.filter(customer=user).filter(order_filters)[:5]
        orders = [{"id": order.id, "status": order.status} for order in order_qs]
    elif user.role == UserRole.VENDOR:
        order_qs = Order.objects.filter(vendor=user).filter(order_filters)[:5]
        orders = [{"id": order.id, "status": order.status} for order in order_qs]

    return {
        "categories": categories,
        "vendors": vendors,
        "orders": orders,
    }
