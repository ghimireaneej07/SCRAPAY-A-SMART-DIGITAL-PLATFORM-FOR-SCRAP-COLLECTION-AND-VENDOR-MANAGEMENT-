import json
from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from catalog.models import ScrapCategory
from accounts.models import User, UserRole

from .models import Order, OrderFeedback, OrderItem
from .services import create_order_with_items


class OrderItemWriteSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    quantity_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    note = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    image_key = serializers.CharField(required=False, allow_blank=True)

    def validate_category_id(self, value):
        category = ScrapCategory.objects.filter(id=value, is_active=True).first()
        if not category:
            raise serializers.ValidationError("Selected scrap category is invalid.")
        return value


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = ("vendor", "pickup_datetime", "address", "customer_note", "items")

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one order item is required.")
        seen_categories = set()
        for item in value:
            if item["quantity_kg"] <= 0:
                raise serializers.ValidationError("Quantity must be greater than zero for all items.")
            if item["category_id"] in seen_categories:
                raise serializers.ValidationError("Each scrap category should be added only once per order.")
            seen_categories.add(item["category_id"])
        return value

    def validate_address(self, value):
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise serializers.ValidationError("Pickup address must be more specific.")
        return cleaned

    def validate_vendor(self, value):
        if not value:
            return value
        if value.role != UserRole.VENDOR:
            raise serializers.ValidationError("Selected vendor is invalid.")
        if not value.is_active:
            raise serializers.ValidationError("Selected vendor is not active.")
        vendor_profile = getattr(value, "vendor_profile", None)
        if not vendor_profile or not vendor_profile.is_verified:
            raise serializers.ValidationError("Selected vendor is not verified.")
        return value

    def validate_pickup_datetime(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Pickup date and time must be in the future.")
        return value

    def to_internal_value(self, data):
        if hasattr(data, "getlist") and isinstance(data.get("items"), str):
            data = {
                "vendor": data.get("vendor"),
                "pickup_datetime": data.get("pickup_datetime"),
                "address": data.get("address"),
                "customer_note": data.get("customer_note", ""),
                "items": json.loads(data.get("items")),
            }
        return super().to_internal_value(data)

    def create(self, validated_data):
        customer = self.context["request"].user
        return create_order_with_items(
            customer=customer,
            validated_data=validated_data,
            files=self.context["request"].FILES,
        )


class OrderItemReadSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return obj.image_url

    class Meta:
        model = OrderItem
        fields = ("id", "category", "category_name", "quantity_kg", "note", "image_url")


class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.username", read_only=True)
    vendor_name = serializers.CharField(source="vendor.username", read_only=True)
    vendor_is_verified = serializers.BooleanField(source="vendor.vendor_profile.is_verified", default=False, read_only=True)
    feedback = serializers.SerializerMethodField()

    def get_feedback(self, obj):
        feedback = getattr(obj, "feedback", None)
        if not feedback:
            return None
        return {
            "id": feedback.id,
            "rating": feedback.rating,
            "review": feedback.review,
            "created_at": feedback.created_at,
        }

    class Meta:
        model = Order
        fields = (
            "id",
            "customer",
            "customer_name",
            "vendor",
            "vendor_name",
            "vendor_is_verified",
            "status",
            "pickup_datetime",
            "address",
            "customer_note",
            "total_estimated",
            "total_final",
            "pickup_person_name",
            "pickup_person_contact",
            "approved_at",
            "created_at",
            "updated_at",
            "items",
            "feedback",
        )


class OrderFeedbackWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderFeedback
        fields = ("rating", "review")


class OrderApprovalSerializer(serializers.Serializer):
    pickup_person_name = serializers.CharField(max_length=255)
    pickup_person_contact = serializers.CharField(required=False, allow_blank=True, max_length=30)
    pickup_datetime = serializers.DateTimeField(required=False)

    def validate_pickup_datetime(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Pickup date and time must be in the future.")
        return value


class VendorDirectorySerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="vendor_profile.business_name", default="")
    license_number = serializers.CharField(source="vendor_profile.license_number", default="")
    rating_avg = serializers.DecimalField(
        source="vendor_profile.rating_avg", max_digits=3, decimal_places=2, default=Decimal("0.00")
    )
    service_radius_km = serializers.DecimalField(
        source="vendor_profile.service_radius_km", max_digits=6, decimal_places=2, default=Decimal("0.00")
    )
    is_verified = serializers.BooleanField(source="vendor_profile.is_verified", default=False)
    is_online = serializers.BooleanField(source="vendor_availability.is_online", default=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "business_name",
            "license_number",
            "rating_avg",
            "service_radius_km",
            "is_verified",
            "is_online",
        )
