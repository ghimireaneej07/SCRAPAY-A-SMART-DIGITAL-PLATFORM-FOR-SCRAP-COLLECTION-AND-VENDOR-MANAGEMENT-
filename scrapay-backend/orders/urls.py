from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import UserOrderViewSet, VendorDirectoryViewSet, VendorOrderViewSet

router = DefaultRouter()
router.register("my", UserOrderViewSet, basename="user-orders")
router.register("vendor", VendorOrderViewSet, basename="vendor-orders")
router.register("vendors", VendorDirectoryViewSet, basename="vendors")

urlpatterns = [
    path("", include(router.urls)),
]
