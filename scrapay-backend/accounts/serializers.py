from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserProfile, UserRole, VendorProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "phone", "role")


class RegisterUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(required=False, allow_blank=True, write_only=True)
    state = serializers.CharField(required=False, allow_blank=True, write_only=True)
    pincode = serializers.CharField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "phone",
            "password",
            "full_name",
            "address",
            "city",
            "state",
            "pincode",
        )

    def create(self, validated_data):
        profile_data = {
            "full_name": validated_data.pop("full_name"),
            "address": validated_data.pop("address", ""),
            "city": validated_data.pop("city", ""),
            "state": validated_data.pop("state", ""),
            "pincode": validated_data.pop("pincode", ""),
        }
        password = validated_data.pop("password")
        user = User(**validated_data, role=UserRole.USER)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, **profile_data)
        return user


class RegisterVendorSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    business_name = serializers.CharField(write_only=True)
    address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(required=False, allow_blank=True, write_only=True)
    state = serializers.CharField(required=False, allow_blank=True, write_only=True)
    pincode = serializers.CharField(required=False, allow_blank=True, write_only=True)
    service_radius_km = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=False,
        default=10,
        write_only=True,
    )
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "phone",
            "password",
            "full_name",
            "business_name",
            "address",
            "city",
            "state",
            "pincode",
            "service_radius_km",
        )

    def create(self, validated_data):
        profile_data = {
            "full_name": validated_data.pop("full_name"),
            "address": validated_data.pop("address", ""),
            "city": validated_data.pop("city", ""),
            "state": validated_data.pop("state", ""),
            "pincode": validated_data.pop("pincode", ""),
        }
        business_name = validated_data.pop("business_name")
        service_radius_km = validated_data.pop("service_radius_km", 10)
        password = validated_data.pop("password")

        user = User(**validated_data, role=UserRole.VENDOR)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, **profile_data)
        VendorProfile.objects.create(
            user=user, business_name=business_name, service_radius_km=service_radius_km
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class AdminVendorListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="profile.full_name", default="")
    business_name = serializers.CharField(source="vendor_profile.business_name", default="")
    is_verified = serializers.BooleanField(source="vendor_profile.is_verified", default=False)
    rating_avg = serializers.DecimalField(
        source="vendor_profile.rating_avg", max_digits=3, decimal_places=2, default=0
    )

    class Meta:
        model = User
        fields = ("id", "username", "email", "phone", "is_active", "full_name", "business_name", "is_verified", "rating_avg")


class AdminVendorVerifySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField()
