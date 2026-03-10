from math import asin, cos, radians, sin, sqrt

from django.db.models import Avg, Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserRole
from accounts.permissions import IsUserRole, IsVendorRole
from notifications.services import send_user_event, send_vendor_event

from .models import Order, OrderFeedback, OrderStatus, OrderStatusHistory
from .serializers import (
    OrderCreateSerializer,
    OrderFeedbackWriteSerializer,
    OrderReadSerializer,
    VendorDirectorySerializer,
)


def _haversine_km(lat1, lon1, lat2, lon2):
    earth_radius_km = 6371.0
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(a))


def _refresh_vendor_rating(vendor_id):
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


class UserOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsUserRole]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return (
            Order.objects.filter(customer=self.request.user)
            .select_related("customer", "vendor")
            .prefetch_related("items")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        if order.vendor_id:
            send_vendor_event(
                order.vendor_id,
                {
                    "type": "order_created",
                    "order_id": order.id,
                    "status": order.status,
                },
            )
        output = OrderReadSerializer(order, context={"request": request}).data
        return Response(output, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        order = self.get_queryset().filter(pk=pk).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.status not in {OrderStatus.PENDING, OrderStatus.ACCEPTED}:
            return Response(
                {"detail": f"Order cannot be cancelled from status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from_status = order.status
        order.status = OrderStatus.CANCELLED
        order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(
            order=order,
            from_status=from_status,
            to_status=OrderStatus.CANCELLED,
            changed_by=request.user,
        )

        if order.vendor_id:
            send_vendor_event(
                order.vendor_id,
                {
                    "type": "order_status_updated",
                    "order_id": order.id,
                    "from_status": from_status,
                    "to_status": OrderStatus.CANCELLED,
                },
            )
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="feedback")
    def feedback(self, request, pk=None):
        order = self.get_queryset().filter(pk=pk).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        if order.status != OrderStatus.COMPLETED:
            return Response(
                {"detail": "Feedback can only be submitted for completed orders."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not order.vendor_id:
            return Response(
                {"detail": "Cannot submit feedback for order without vendor."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderFeedbackWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback, _ = OrderFeedback.objects.update_or_create(
            order=order,
            defaults={
                "customer": request.user,
                "vendor_id": order.vendor_id,
                "rating": serializer.validated_data["rating"],
                "review": serializer.validated_data.get("review", ""),
            },
        )
        _refresh_vendor_rating(order.vendor_id)
        return Response(
            {
                "id": feedback.id,
                "rating": feedback.rating,
                "review": feedback.review,
                "created_at": feedback.created_at,
            },
            status=status.HTTP_201_CREATED,
        )


class VendorOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderReadSerializer
    permission_classes = [IsAuthenticated, IsVendorRole]
    http_method_names = ["get", "patch", "head", "options"]

    STATUS_TRANSITIONS = {
        OrderStatus.PENDING: {OrderStatus.ACCEPTED, OrderStatus.REJECTED},
        OrderStatus.ACCEPTED: {OrderStatus.IN_PROGRESS},
        OrderStatus.IN_PROGRESS: {OrderStatus.COMPLETED},
    }

    def get_queryset(self):
        queryset = (
            Order.objects.filter(vendor=self.request.user)
            .select_related("customer", "vendor")
            .prefetch_related("items")
        )
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=["patch"], url_path="accept")
    def accept(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.ACCEPTED)

    @action(detail=True, methods=["patch"], url_path="reject")
    def reject(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.REJECTED)

    @action(detail=True, methods=["patch"], url_path="complete")
    def complete(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.COMPLETED)

    @action(detail=True, methods=["patch"], url_path="start")
    def start(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.IN_PROGRESS)

    def _change_status(self, request, pk, to_status):
        order = self.get_queryset().filter(pk=pk).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        from_status = order.status
        allowed_statuses = self.STATUS_TRANSITIONS.get(from_status, set())
        if to_status not in allowed_statuses:
            return Response(
                {"detail": f"Invalid status transition from '{from_status}' to '{to_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = to_status
        order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(
            order=order, from_status=from_status, to_status=to_status, changed_by=request.user
        )

        send_user_event(
            order.customer_id,
            {
                "type": "order_status_updated",
                "order_id": order.id,
                "from_status": from_status,
                "to_status": to_status,
            },
        )
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)


class VendorDirectoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VendorDirectorySerializer
    permission_classes = [IsAuthenticated, IsUserRole]
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        from accounts.models import User

        queryset = User.objects.filter(
            role=UserRole.VENDOR,
            is_active=True,
            vendor_profile__is_verified=True,
        ).select_related("vendor_profile", "profile", "vendor_availability")

        lat = self.request.query_params.get("lat")
        lon = self.request.query_params.get("lon")
        radius_km = self.request.query_params.get("radius_km", "25")

        if not lat or not lon:
            return queryset

        try:
            user_lat = float(lat)
            user_lon = float(lon)
            max_radius_km = float(radius_km)
        except (TypeError, ValueError):
            return queryset

        nearby_vendor_ids = []
        for vendor in queryset:
            profile = getattr(vendor, "profile", None)
            vendor_profile = getattr(vendor, "vendor_profile", None)
            if not profile or profile.latitude is None or profile.longitude is None or not vendor_profile:
                continue

            distance_km = _haversine_km(
                user_lat,
                user_lon,
                float(profile.latitude),
                float(profile.longitude),
            )
            if distance_km <= max_radius_km and distance_km <= float(vendor_profile.service_radius_km):
                nearby_vendor_ids.append(vendor.id)

        return queryset.filter(id__in=nearby_vendor_ids)

# Create your views here.
