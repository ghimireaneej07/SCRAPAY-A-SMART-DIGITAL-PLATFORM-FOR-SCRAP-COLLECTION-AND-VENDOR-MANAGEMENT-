from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from .models import MarketRate
from .serializers import MarketRateSerializer, MarketRateWriteSerializer, ScrapCategorySerializer
from .services import build_global_search_payload, get_active_categories_queryset, get_latest_market_rates_queryset


class ScrapCategoryListView(ListAPIView):
    serializer_class = ScrapCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_active_categories_queryset()


class LatestMarketRateListView(ListAPIView):
    serializer_class = MarketRateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_latest_market_rates_queryset()


class GlobalSearchView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ScrapCategorySerializer

    def list(self, request, *args, **kwargs):
        payload = build_global_search_payload(
            query=request.query_params.get("q"),
            user=request.user,
        )
        return Response(
            {
                "categories": ScrapCategorySerializer(payload["categories"], many=True).data,
                "vendors": payload["vendors"],
                "orders": payload["orders"],
            }
        )


class AdminMarketRateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = MarketRate.objects.select_related("category").order_by("-effective_from", "-id")
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action in {"create", "partial_update"}:
            return MarketRateWriteSerializer
        return MarketRateSerializer

# Create your views here.
