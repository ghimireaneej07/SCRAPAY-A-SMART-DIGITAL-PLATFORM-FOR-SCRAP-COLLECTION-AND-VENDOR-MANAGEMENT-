from django.contrib import admin

from .models import MarketRate, ScrapCategory

admin.site.register(ScrapCategory)
admin.site.register(MarketRate)

# Register your models here.
