from rest_framework import serializers

from .models import MarketRate, ScrapCategory


class ScrapCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapCategory
        fields = ("id", "code", "name", "unit")


class MarketRateSerializer(serializers.ModelSerializer):
    category = ScrapCategorySerializer()

    class Meta:
        model = MarketRate
        fields = ("id", "category", "price_per_kg", "effective_from")
