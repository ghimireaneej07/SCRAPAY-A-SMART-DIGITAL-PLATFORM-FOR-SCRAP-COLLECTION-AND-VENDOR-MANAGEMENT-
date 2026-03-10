from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminMarketRateViewSet, GlobalSearchView, LatestMarketRateListView, ScrapCategoryListView

router = DefaultRouter()
router.register("admin/market-rates", AdminMarketRateViewSet, basename="admin-market-rates")

urlpatterns = [
    path("scrap-categories", ScrapCategoryListView.as_view(), name="scrap-categories"),
    path("market-rates/latest", LatestMarketRateListView.as_view(), name="market-rates-latest"),
    path("search", GlobalSearchView.as_view(), name="global-search"),
    path("", include(router.urls)),
]
