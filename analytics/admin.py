from django.contrib import admin
from .models import Metric, ConversionFunnel, LeadSource


@admin.register(Metric)
class MetricAdmin(admin.ModelAdmin):
    list_display = [
        "owner",
        "period_type",
        "period_start",
        "total_contacts",
        "new_contacts",
        "converted_leads",
        "emails_sent",
    ]
    list_filter = ["period_type", "period_start", "owner"]
    search_fields = ["owner__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ConversionFunnel)
class ConversionFunnelAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "owner",
        "date_from",
        "date_to",
        "stage_1_count",
        "stage_5_count",
        "overall_conversion_rate",
    ]
    list_filter = ["date_from", "owner"]
    search_fields = ["name", "owner__email"]


@admin.register(LeadSource)
class LeadSourceAdmin(admin.ModelAdmin):
    list_display = [
        "source_name",
        "owner",
        "total_leads",
        "qualified_leads",
        "converted_leads",
        "conversion_rate",
    ]
    list_filter = ["date_from", "owner"]
    search_fields = ["source_name", "owner__email"]
    readonly_fields = ["conversion_rate"]
