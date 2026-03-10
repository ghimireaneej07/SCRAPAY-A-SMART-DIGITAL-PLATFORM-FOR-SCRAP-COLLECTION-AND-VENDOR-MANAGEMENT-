from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserProfile, UserRole, VendorAvailability, VendorProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="profile.full_name", default="")
    avatar_url = serializers.SerializerMethodField()
    business_name = serializers.CharField(source="vendor_profile.business_name", default="")

    def get_avatar_url(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            return ""
        if getattr(profile, "avatar", None):
            request = self.context.get("request")
            url = profile.avatar.url
            return request.build_absolute_uri(url) if request else url
        return profile.avatar_url or ""

    class Meta:
        model = User
        fields = ("id", "username", "email", "phone", "role", "full_name", "avatar_url", "business_name")


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
            "avatar_url": "",
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
    license_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
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
            "license_number",
        )

    def create(self, validated_data):
        profile_data = {
            "full_name": validated_data.pop("full_name"),
            "avatar_url": "",
            "address": validated_data.pop("address", ""),
            "city": validated_data.pop("city", ""),
            "state": validated_data.pop("state", ""),
            "pincode": validated_data.pop("pincode", ""),
        }
        business_name = validated_data.pop("business_name")
        service_radius_km = validated_data.pop("service_radius_km", 10)
        license_number = validated_data.pop("license_number", "")
        password = validated_data.pop("password")

        user = User(**validated_data, role=UserRole.VENDOR)
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, **profile_data)
        VendorProfile.objects.create(
            user=user,
            business_name=business_name,
            service_radius_km=service_radius_km,
            license_number=license_number,
        )
        VendorAvailability.objects.create(vendor=user, is_online=False)
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
    license_number = serializers.CharField(source="vendor_profile.license_number", default="")
    is_online = serializers.BooleanField(source="vendor_availability.is_online", default=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "phone",
            "is_active",
            "full_name",
            "business_name",
            "license_number",
            "is_verified",
            "is_online",
            "rating_avg",
        )


class AdminVendorVerifySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField()


class VendorAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorAvailability
        fields = ("is_online", "updated_at")


class ProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(read_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    avatar_url = serializers.CharField(read_only=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    pincode = serializers.CharField(required=False, allow_blank=True)
    business_name = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    service_radius_km = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=False,
    )
    is_verified = serializers.BooleanField(read_only=True)
    is_online = serializers.BooleanField(read_only=True)

    def to_representation(self, instance):
        profile = instance.profile if hasattr(instance, "profile") else None
        avatar_url = ""
        if profile:
            if getattr(profile, "avatar", None):
                request = self.context.get("request")
                url = profile.avatar.url
                avatar_url = request.build_absolute_uri(url) if request else url
            else:
                avatar_url = getattr(profile, "avatar_url", "")
        payload = {
            "id": instance.id,
            "username": instance.username,
            "email": instance.email,
            "phone": instance.phone,
            "role": instance.role,
            "full_name": getattr(profile, "full_name", ""),
            "avatar_url": avatar_url,
            "address": getattr(profile, "address", ""),
            "city": getattr(profile, "city", ""),
            "state": getattr(profile, "state", ""),
            "pincode": getattr(profile, "pincode", ""),
        }
        if instance.role == UserRole.VENDOR and hasattr(instance, "vendor_profile"):
            payload.update(
                {
                    "business_name": instance.vendor_profile.business_name,
                    "license_number": instance.vendor_profile.license_number,
                    "service_radius_km": instance.vendor_profile.service_radius_km,
                    "is_verified": instance.vendor_profile.is_verified,
                    "is_online": getattr(
                        getattr(instance, "vendor_availability", None), "is_online", False
                    ),
                }
            )
        return payload
