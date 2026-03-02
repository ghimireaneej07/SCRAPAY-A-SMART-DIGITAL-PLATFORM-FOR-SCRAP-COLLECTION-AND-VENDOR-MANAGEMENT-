from django.db import migrations
from django.utils import timezone


def seed_rates(apps, schema_editor):
    ScrapCategory = apps.get_model("catalog", "ScrapCategory")
    MarketRate = apps.get_model("catalog", "MarketRate")
    defaults = {
        "plastic": "15.00",
        "paper": "18.00",
        "glass": "28.00",
        "metal": "20.00",
        "ewaste": "25.00",
    }
    now = timezone.now()
    for code, price in defaults.items():
        category = ScrapCategory.objects.filter(code=code).first()
        if category and not MarketRate.objects.filter(category=category, is_active=True).exists():
            MarketRate.objects.create(
                category=category,
                price_per_kg=price,
                effective_from=now,
                is_active=True,
            )


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_seed_categories"),
    ]

    operations = [
        migrations.RunPython(seed_rates, migrations.RunPython.noop),
    ]
