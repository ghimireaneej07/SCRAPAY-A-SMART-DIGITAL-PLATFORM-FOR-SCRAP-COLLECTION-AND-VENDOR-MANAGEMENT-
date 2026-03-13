from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import EmailOTP, OTPPurpose, UserProfile, UserRole, VendorAvailability, VendorProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="profile.full_name", default="")
    avatar_url = serializers.SerializerMethodField()
    business_name = serializers.CharField(source="vendor_profile.business_name", default="")
    is_verified = serializers.BooleanField(source="vendor_profile.is_verified", default=False)
    verification_status = serializers.CharField(source="vendor_profile.verification_status", default="")

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
        fields = ("id", "username", "email", "phone", "role", "full_name", "avatar_url", "business_name", "is_verified", "verification_status")


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


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        password = attrs["password"]
        user = User.objects.filter(email__iexact=identifier).first()
        if not user:
            user = User.objects.filter(username__iexact=identifier).first()
        if not user or not check_password(password, user.password):
            raise serializers.ValidationError({"detail": "Invalid credentials."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "This account is inactive."})
        attrs["user"] = user
        return attrs


class OTPRequestSerializer(serializers.Serializer):
    purpose = serializers.ChoiceField(choices=OTPPurpose.choices)
    email = serializers.EmailField()
    username = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True, min_length=8)
    full_name = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    pincode = serializers.CharField(required=False, allow_blank=True)
    business_name = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    service_radius_km = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)

    def validate(self, attrs):
        purpose = attrs["purpose"]
        email = attrs["email"].lower().strip()
        attrs["email"] = email

        if purpose == OTPPurpose.PASSWORD_RESET:
            user = User.objects.filter(email__iexact=email, is_active=True).first()
            if not user:
                raise serializers.ValidationError({"email": "No active account exists with this email."})
            attrs["user"] = user
            return attrs

        if purpose == OTPPurpose.ADMIN_LOGIN:
            password = attrs.get("password", "")
            user = User.objects.filter(email__iexact=email, role=UserRole.ADMIN).first()
            if not user or not check_password(password, user.password):
                raise serializers.ValidationError({"detail": "Invalid admin credentials."})
            if not user.is_active:
                raise serializers.ValidationError({"detail": "This admin account is inactive."})
            attrs["user"] = user
            attrs["otp_payload"] = {"user_id": user.id}
            return attrs

        serializer_class = RegisterVendorSerializer if purpose == OTPPurpose.REGISTER_VENDOR else RegisterUserSerializer
        registration_input = {
            key: attrs[key]
            for key in serializer_class.Meta.fields
            if key in attrs
        }
        serializer = serializer_class(data=registration_input)
        serializer.is_valid(raise_exception=True)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "An account with this email already exists."})
        # Convert Decimal values to str so the payload is JSON-serializable.
        from decimal import Decimal
        attrs["registration_payload"] = {
            k: str(v) if isinstance(v, Decimal) else v
            for k, v in serializer.validated_data.items()
        }
        return attrs


class OTPVerifySerializer(serializers.Serializer):
    purpose = serializers.ChoiceField(choices=OTPPurpose.choices)
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        otp_record = (
            EmailOTP.objects.filter(email__iexact=email, purpose=attrs["purpose"])
            .order_by("-created_at")
            .first()
        )
        if not otp_record:
            raise serializers.ValidationError({"otp": "No OTP request was found for this email."})
        attrs["email"] = email
        attrs["otp_record"] = otp_record
        return attrs


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        otp_record = (
            EmailOTP.objects.filter(email__iexact=email, purpose=OTPPurpose.PASSWORD_RESET)
            .order_by("-created_at")
            .first()
        )
        if not otp_record:
            raise serializers.ValidationError({"otp": "No password reset OTP request was found for this email."})
        attrs["email"] = email
        attrs["otp_record"] = otp_record
        return attrs


class AdminVendorListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="profile.full_name", default="")
    business_name = serializers.CharField(source="vendor_profile.business_name", default="")
    is_verified = serializers.BooleanField(source="vendor_profile.is_verified", default=False)
    verification_status = serializers.CharField(source="vendor_profile.verification_status", default="pending")
    rejection_reason = serializers.CharField(source="vendor_profile.rejection_reason", default="")
    verified_at = serializers.DateTimeField(source="vendor_profile.verified_at", allow_null=True)
    rating_avg = serializers.DecimalField(
        source="vendor_profile.rating_avg", max_digits=3, decimal_places=2, default=0
    )
    license_number = serializers.CharField(source="vendor_profile.license_number", default="")
    is_online = serializers.BooleanField(source="vendor_availability.is_online", default=False)
    city = serializers.CharField(source="profile.city", default="")
    date_joined = serializers.DateTimeField(read_only=True)

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
            "verification_status",
            "rejection_reason",
            "verified_at",
            "is_online",
            "rating_avg",
            "city",
            "date_joined",
        )


class AdminVendorVerifySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField()
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default="")


class AdminAccountListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="profile.full_name", default="")
    business_name = serializers.CharField(source="vendor_profile.business_name", default="")

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "phone",
            "role",
            "is_active",
            "full_name",
            "business_name",
        )


class AdminAccountStatusSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()


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
    verification_status = serializers.CharField(read_only=True)
    rejection_reason = serializers.CharField(read_only=True)
    verified_at = serializers.DateTimeField(read_only=True, allow_null=True)
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
                    "verification_status": instance.vendor_profile.verification_status,
                    "rejection_reason": instance.vendor_profile.rejection_reason,
                    "verified_at": instance.vendor_profile.verified_at,
                    "is_online": getattr(
                        getattr(instance, "vendor_availability", None), "is_online", False
                    ),
                }
            )
        return payload
