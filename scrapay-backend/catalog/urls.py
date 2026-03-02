from django.urls import path

from .views import LatestMarketRateListView, ScrapCategoryListView

urlpatterns = [
    path("scrap-categories", ScrapCategoryListView.as_view(), name="scrap-categories"),
    path("market-rates/latest", LatestMarketRateListView.as_view(), name="market-rates-latest"),
]
