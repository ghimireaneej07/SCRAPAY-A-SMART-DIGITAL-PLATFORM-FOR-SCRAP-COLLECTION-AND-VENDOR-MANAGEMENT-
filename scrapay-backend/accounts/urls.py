from django.urls import path

from .views import LoginView, MeView, RefreshView, RegisterUserView, RegisterVendorView

urlpatterns = [
    path("register/user", RegisterUserView.as_view(), name="register-user"),
    path("register/vendor", RegisterVendorView.as_view(), name="register-vendor"),
    path("login", LoginView.as_view(), name="login"),
    path("refresh", RefreshView.as_view(), name="refresh"),
    path("me", MeView.as_view(), name="me"),
]
