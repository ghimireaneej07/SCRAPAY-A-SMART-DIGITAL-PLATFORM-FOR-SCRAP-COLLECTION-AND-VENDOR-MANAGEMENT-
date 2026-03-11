from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User, UserRole
from accounts.permissions import IsAdminRole
from orders.models import Order
from .models import MarketRate, ScrapCategory
from .serializers import MarketRateSerializer, MarketRateWriteSerializer, ScrapCategorySerializer


class ScrapCategoryListView(ListAPIView):
    serializer_class = ScrapCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ScrapCategory.objects.filter(is_active=True).order_by("name")


class LatestMarketRateListView(ListAPIView):
    serializer_class = MarketRateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        now = timezone.now()
        categories = ScrapCategory.objects.filter(is_active=True).values_list("id", flat=True)
        latest_ids = []
        for category_id in categories:
            latest = (
                MarketRate.objects.filter(category_id=category_id, is_active=True, effective_from__lte=now)
                .order_by("-effective_from", "-id")
                .first()
            )
            if latest:
                latest_ids.append(latest.id)
        return MarketRate.objects.filter(id__in=latest_ids).select_related("category")


class GlobalSearchView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ScrapCategorySerializer

    def list(self, request, *args, **kwargs):
        query = (request.query_params.get("q") or "").strip()
        if len(query) < 2:
            return Response({"categories": [], "vendors": [], "orders": []})

        categories = ScrapCategory.objects.filter(
            is_active=True
        ).filter(Q(name__icontains=query) | Q(code__icontains=query)).order_by("name")[:5]

        vendors = []
        if request.user.role in {UserRole.USER, UserRole.ADMIN}:
            vendor_qs = (
                User.objects.filter(role=UserRole.VENDOR, is_active=True)
                .filter(Q(username__icontains=query) | Q(vendor_profile__business_name__icontains=query))
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
        order_filters = Q(status__icontains=query)
        if query.isdigit():
            order_filters |= Q(id=int(query))
        if request.user.role == UserRole.USER:
            order_qs = Order.objects.filter(customer=request.user).filter(order_filters)[:5]
            orders = [{"id": order.id, "status": order.status} for order in order_qs]
        elif request.user.role == UserRole.VENDOR:
            order_qs = Order.objects.filter(vendor=request.user).filter(order_filters)[:5]
            orders = [{"id": order.id, "status": order.status} for order in order_qs]

        return Response(
            {
                "categories": ScrapCategorySerializer(categories, many=True).data,
                "vendors": vendors,
                "orders": orders,
            }
        )


class AdminMarketRateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = MarketRate.objects.select_related("category").order_by("-effective_from", "-id")
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action in {"create", "partial_update"}:
            return MarketRateWriteSerializer
        return MarketRateSerializer

# Create your views here.
