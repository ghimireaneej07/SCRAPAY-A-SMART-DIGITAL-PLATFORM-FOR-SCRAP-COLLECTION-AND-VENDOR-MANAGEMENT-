from django.urls import path

from .views import (
    AdminAnalyticsView,
    AdminAccountListView,
    AdminAccountStatusView,
    AdminOrderListView,
    AdminVendorListView,
    AdminVendorVerifyView,
    LoginView,
    MeView,
    ProfileView,
    RefreshView,
    RegisterUserView,
    RegisterVendorView,
    VendorAvailabilityView,
)

urlpatterns = [
    path("register/user", RegisterUserView.as_view(), name="register-user"),
    path("register/vendor", RegisterVendorView.as_view(), name="register-vendor"),
    path("login", LoginView.as_view(), name="login"),
    path("refresh", RefreshView.as_view(), name="refresh"),
    path("me", MeView.as_view(), name="me"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("vendor/availability", VendorAvailabilityView.as_view(), name="vendor-availability"),
    path("admin/accounts", AdminAccountListView.as_view(), name="admin-accounts"),
    path("admin/accounts/<int:user_id>/status", AdminAccountStatusView.as_view(), name="admin-account-status"),
    path("admin/vendors", AdminVendorListView.as_view(), name="admin-vendors"),
    path("admin/vendors/<int:vendor_id>/verify", AdminVendorVerifyView.as_view(), name="admin-vendor-verify"),
    path("admin/analytics", AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("admin/orders", AdminOrderListView.as_view(), name="admin-orders"),
]
