from decimal import Decimal

from rest_framework import serializers

from catalog.models import MarketRate

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
