from django.db import models


class ScrapCategory(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=20, default="kg")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class MarketRate(models.Model):
    category = models.ForeignKey(ScrapCategory, on_delete=models.CASCADE, related_name="rates")
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    effective_from = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-effective_from", "-id"]

    def __str__(self):
        return f"{self.category.code} - {self.price_per_kg}"
# Create your models here.
