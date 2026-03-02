from django.db import migrations


def seed_categories(apps, schema_editor):
    ScrapCategory = apps.get_model("catalog", "ScrapCategory")
    categories = [
        ("plastic", "Plastic"),
        ("paper", "Papers"),
        ("glass", "Glass"),
        ("metal", "Metals"),
        ("ewaste", "E-waste"),
    ]
    for code, name in categories:
        ScrapCategory.objects.get_or_create(
            code=code,
            defaults={
                "name": name,
                "unit": "kg",
                "is_active": True,
            },
        )


def remove_categories(apps, schema_editor):
    ScrapCategory = apps.get_model("catalog", "ScrapCategory")
    ScrapCategory.objects.filter(code__in=["plastic", "paper", "glass", "metal", "ewaste"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]
