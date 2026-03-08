from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User, UserRole
from .permissions import IsAdminRole
from .serializers import (
    AdminVendorListSerializer,
    AdminVendorVerifySerializer,
    CustomTokenObtainPairSerializer,
    RegisterUserSerializer,
    RegisterVendorSerializer,
    UserSerializer,
)


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


class AdminVendorListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        vendors = (
            User.objects.filter(role=UserRole.VENDOR)
            .select_related("profile", "vendor_profile")
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
# Create your views here.
