from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserRole
from accounts.permissions import IsUserRole, IsVendorRole

from .models import Order, OrderStatus
from .services import (
    cancel_order,
    change_vendor_order_status,
    filter_vendors_by_distance,
    submit_order_feedback,
)
from .serializers import (
    OrderApprovalSerializer,
    OrderCreateSerializer,
    OrderFeedbackWriteSerializer,
    OrderReadSerializer,
    VendorDirectorySerializer,
)


class UserOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsUserRole]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return (
            Order.objects.filter(customer=self.request.user)
            .select_related("customer", "customer__profile", "vendor", "vendor__profile", "feedback")
            .prefetch_related("items__category")
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
            from notifications.services import send_vendor_event

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

        order = cancel_order(order=order, changed_by=request.user)
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="feedback")
    def feedback(self, request, pk=None):
        order = self.get_queryset().filter(pk=pk).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderFeedbackWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback = submit_order_feedback(
            order=order,
            customer=request.user,
            rating=serializer.validated_data["rating"],
            review=serializer.validated_data.get("review", ""),
        )
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

    def get_queryset(self):
        queryset = (
            Order.objects.filter(vendor=self.request.user)
            .select_related("customer", "customer__profile", "vendor", "vendor__profile", "feedback")
            .prefetch_related("items__category")
        )
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=["patch"], url_path="accept")
    def accept(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.ACCEPTED, requires_approval_details=True)

    @action(detail=True, methods=["patch"], url_path="reject")
    def reject(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.REJECTED)

    @action(detail=True, methods=["patch"], url_path="complete")
    def complete(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.COMPLETED)

    @action(detail=True, methods=["patch"], url_path="start")
    def start(self, request, pk=None):
        return self._change_status(request, pk, OrderStatus.IN_PROGRESS)

    def _change_status(self, request, pk, to_status, requires_approval_details=False):
        order = self.get_queryset().filter(pk=pk).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        approval_data = None
        if requires_approval_details:
            approval_serializer = OrderApprovalSerializer(data=request.data)
            approval_serializer.is_valid(raise_exception=True)
            approval_data = approval_serializer.validated_data

        order = change_vendor_order_status(
            order=order,
            changed_by=request.user,
            to_status=to_status,
            approval_data=approval_data,
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
        return filter_vendors_by_distance(
            queryset=queryset,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
        )

# Create your views here.
