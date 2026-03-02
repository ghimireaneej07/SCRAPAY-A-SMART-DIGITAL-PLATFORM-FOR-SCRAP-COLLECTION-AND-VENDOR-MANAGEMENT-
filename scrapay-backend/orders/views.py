from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserRole
from accounts.permissions import IsUserRole, IsVendorRole
from notifications.services import send_user_event, send_vendor_event

from .models import Order, OrderStatus, OrderStatusHistory
from .serializers import OrderCreateSerializer, OrderReadSerializer


class UserOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsUserRole]

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


class VendorOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderReadSerializer
    permission_classes = [IsAuthenticated, IsVendorRole]

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

    def _change_status(self, request, pk, to_status):
        order = self.get_queryset().filter(pk=pk).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        from_status = order.status
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
    serializer_class = None
    permission_classes = [IsAuthenticated, IsUserRole]

    def list(self, request, *args, **kwargs):
        from accounts.models import User

        vendors = User.objects.filter(role=UserRole.VENDOR, is_active=True).select_related("vendor_profile")
        payload = []
        for vendor in vendors:
            profile = getattr(vendor, "vendor_profile", None)
            payload.append(
                {
                    "id": vendor.id,
                    "username": vendor.username,
                    "email": vendor.email,
                    "business_name": profile.business_name if profile else "",
                    "rating_avg": str(profile.rating_avg) if profile else "0.00",
                    "service_radius_km": str(profile.service_radius_km) if profile else "0.00",
                    "is_verified": profile.is_verified if profile else False,
                }
            )
        return Response(payload, status=status.HTTP_200_OK)

# Create your views here.
