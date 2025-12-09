from django.contrib import admin

from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "plan", "trial_end_at", "updated_at")
    list_filter = ("status", "plan")
    search_fields = ("user__username", "user__email", "stripe_customer_id")
    raw_id_fields = ("user",)
    ordering = ("-updated_at",)
