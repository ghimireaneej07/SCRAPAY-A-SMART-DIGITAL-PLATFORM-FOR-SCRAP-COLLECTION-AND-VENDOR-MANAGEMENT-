from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminRole
from .models import MarketRate, ScrapCategory
from .serializers import MarketRateSerializer, MarketRateWriteSerializer, ScrapCategorySerializer


class ScrapCategoryListView(ListAPIView):
    serializer_class = ScrapCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ScrapCategory.objects.filter(is_active=True).order_by("name")


class LatestMarketRateListView(ListAPIView):
    serializer_class = MarketRateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        categories = ScrapCategory.objects.filter(is_active=True).values_list("id", flat=True)
        latest_ids = []
        for category_id in categories:
            latest = (
                MarketRate.objects.filter(category_id=category_id, is_active=True)
                .order_by("-effective_from", "-id")
                .first()
            )
            if latest:
                latest_ids.append(latest.id)
        return MarketRate.objects.filter(id__in=latest_ids).select_related("category")


class AdminMarketRateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = MarketRate.objects.select_related("category").order_by("-effective_from", "-id")
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action in {"create", "partial_update"}:
            return MarketRateWriteSerializer
        return MarketRateSerializer

# Create your views here.
