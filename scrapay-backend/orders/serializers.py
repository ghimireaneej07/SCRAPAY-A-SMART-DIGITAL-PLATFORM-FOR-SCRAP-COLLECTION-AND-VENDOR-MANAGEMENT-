from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from catalog.models import MarketRate
from accounts.models import User, UserRole

from .models import Order, OrderItem, OrderStatus, OrderStatusHistory


class OrderItemWriteSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    quantity_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    note = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.URLField(required=False, allow_blank=True)


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = ("vendor", "pickup_datetime", "address", "customer_note", "items")

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one order item is required.")
        for item in value:
            if item["quantity_kg"] <= 0:
                raise serializers.ValidationError("Quantity must be greater than zero for all items.")
        return value

    def validate_vendor(self, value):
        if not value:
            return value
        if value.role != UserRole.VENDOR:
            raise serializers.ValidationError("Selected vendor is invalid.")
        if not value.is_active:
            raise serializers.ValidationError("Selected vendor is not active.")
        return value

    def validate_pickup_datetime(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Pickup date and time must be in the future.")
        return value

    def create(self, validated_data):
        items = validated_data.pop("items")
        customer = self.context["request"].user

        order = Order.objects.create(customer=customer, **validated_data)
        estimated_total = Decimal("0.00")

        for item in items:
            order_item = OrderItem.objects.create(
                order=order,
                category_id=item["category_id"],
                quantity_kg=item["quantity_kg"],
                note=item.get("note", ""),
                image_url=item.get("image_url", ""),
            )
            latest_rate = (
                MarketRate.objects.filter(category_id=order_item.category_id, is_active=True)
                .order_by("-effective_from", "-id")
                .first()
            )
            if latest_rate:
                estimated_total += latest_rate.price_per_kg * order_item.quantity_kg

        order.total_estimated = estimated_total
        order.save(update_fields=["total_estimated", "updated_at"])
        OrderStatusHistory.objects.create(order=order, from_status="", to_status=OrderStatus.PENDING, changed_by=customer)
        return order


class OrderItemReadSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "category", "category_name", "quantity_kg", "note", "image_url")


class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.username", read_only=True)
    vendor_name = serializers.CharField(source="vendor.username", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "customer",
            "customer_name",
            "vendor",
            "vendor_name",
            "status",
            "pickup_datetime",
            "address",
            "customer_note",
            "total_estimated",
            "total_final",
            "created_at",
            "updated_at",
            "items",
        )


class VendorDirectorySerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="vendor_profile.business_name", default="")
    rating_avg = serializers.DecimalField(
        source="vendor_profile.rating_avg", max_digits=3, decimal_places=2, default=Decimal("0.00")
    )
    service_radius_km = serializers.DecimalField(
        source="vendor_profile.service_radius_km", max_digits=6, decimal_places=2, default=Decimal("0.00")
    )
    is_verified = serializers.BooleanField(source="vendor_profile.is_verified", default=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "business_name",
            "rating_avg",
            "service_radius_km",
            "is_verified",
        )
