from django.db.models import Sum
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User, UserRole
from .permissions import IsAdminRole, IsVendorRole
from .serializers import (
    AdminAccountListSerializer,
    AdminAccountStatusSerializer,
    AdminVendorListSerializer,
    AdminVendorVerifySerializer,
    CustomTokenObtainPairSerializer,
    ProfileSerializer,
    RegisterUserSerializer,
    RegisterVendorSerializer,
    UserSerializer,
    VendorAvailabilitySerializer,
)
from orders.serializers import OrderReadSerializer


class RegisterUserView(CreateAPIView):
    serializer_class = RegisterUserSerializer
    permission_classes = [AllowAny]


class RegisterVendorView(CreateAPIView):
    serializer_class = RegisterVendorSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class MeView(RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        from .models import UserProfile

        UserProfile.objects.get_or_create(
            user=request.user, defaults={"full_name": request.user.get_full_name() or request.user.username}
        )
        serializer = ProfileSerializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        from .models import UserProfile

        user = request.user
        profile, _ = UserProfile.objects.get_or_create(
            user=user, defaults={"full_name": user.get_full_name() or user.username}
        )

        user_fields = {}
        for field in ("email", "phone"):
            if field in request.data:
                user_fields[field] = request.data[field]
        if user_fields:
            for key, value in user_fields.items():
                setattr(user, key, value)
            user.save(update_fields=list(user_fields.keys()))

        profile_fields = {}
        for field in ("full_name", "avatar_url", "address", "city", "state", "pincode"):
            if field in request.data:
                profile_fields[field] = request.data[field]
        if profile_fields:
            for key, value in profile_fields.items():
                setattr(profile, key, value)
            profile.save(update_fields=list(profile_fields.keys()))

        avatar_file = request.FILES.get("avatar")
        if avatar_file:
            profile.avatar = avatar_file
            profile.avatar_url = ""
            profile.save(update_fields=["avatar", "avatar_url"])

        if user.role == UserRole.VENDOR and hasattr(user, "vendor_profile"):
            vendor_profile = user.vendor_profile
            vendor_fields = {}
            for field in ("business_name", "license_number", "service_radius_km"):
                if field in request.data:
                    value = request.data[field]
                    if field == "service_radius_km" and (value is None or str(value).strip() == ""):
                        continue
                    vendor_fields[field] = value
            if vendor_fields:
                for key, value in vendor_fields.items():
                    setattr(vendor_profile, key, value)
                vendor_profile.save(update_fields=list(vendor_fields.keys()))

        user.refresh_from_db()
        serializer = ProfileSerializer(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminVendorListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        vendors = (
            User.objects.filter(role=UserRole.VENDOR)
            .select_related("profile", "vendor_profile", "vendor_availability")
            .order_by("id")
        )
        serializer = AdminVendorListSerializer(vendors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminVendorVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, vendor_id):
        vendor = (
            User.objects.filter(role=UserRole.VENDOR, id=vendor_id)
            .select_related("vendor_profile")
            .first()
        )
        if not vendor or not hasattr(vendor, "vendor_profile"):
            return Response({"detail": "Vendor not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminVendorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor.vendor_profile.is_verified = serializer.validated_data["is_verified"]
        vendor.vendor_profile.save(update_fields=["is_verified"])
        payload = AdminVendorListSerializer(vendor).data
        return Response(payload, status=status.HTTP_200_OK)


class AdminAccountListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        role_filter = (request.query_params.get("role") or "").strip()
        queryset = User.objects.select_related("profile", "vendor_profile").order_by("id")
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        serializer = AdminAccountListSerializer(queryset[:50], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAccountStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, user_id):
        target_user = User.objects.filter(id=user_id).first()
        if not target_user:
            return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
        if target_user.id == request.user.id:
            return Response(
                {"detail": "You cannot deactivate your own admin account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AdminAccountStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user.is_active = serializer.validated_data["is_active"]
        target_user.save(update_fields=["is_active"])
        payload = AdminAccountListSerializer(target_user).data
        return Response(payload, status=status.HTTP_200_OK)


class VendorAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsVendorRole]

    def get(self, request):
        if hasattr(request.user, "vendor_availability"):
            availability = request.user.vendor_availability
        else:
            from .models import VendorAvailability

            availability = VendorAvailability.objects.create(vendor=request.user, is_online=False)
        serializer = VendorAvailabilitySerializer(availability)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        from .models import VendorAvailability

        availability, _ = VendorAvailability.objects.get_or_create(vendor=request.user)
        serializer = VendorAvailabilitySerializer(availability, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        from orders.models import Order, OrderStatus

        totals = {
            "total_users": User.objects.filter(role=UserRole.USER).count(),
            "total_vendors": User.objects.filter(role=UserRole.VENDOR).count(),
            "total_orders": Order.objects.count(),
            "completed_orders": Order.objects.filter(status=OrderStatus.COMPLETED).count(),
        }
        revenue = Order.objects.filter(status=OrderStatus.COMPLETED).aggregate(
            total=Sum("total_final")
        )["total"] or 0
        totals["revenue"] = revenue
        return Response(totals, status=status.HTTP_200_OK)


class AdminOrderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        from orders.models import Order

        queryset = (
            Order.objects.select_related("customer", "vendor")
            .prefetch_related("items", "items__category")
            .order_by("-created_at")
        )
        status_filter = (request.query_params.get("status") or "").strip()
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        serializer = OrderReadSerializer(queryset[:25], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
# Create your views here.
