from django.contrib import admin
from .models import (
    Integration,
    EmailIntegration,
    WhatsAppIntegration,
    SMSIntegration,
    SignUpPageIntegration,
    FacebookIntegration,
    IntegrationLog,
)


class IntegrationLogInline(admin.TabularInline):
    model = IntegrationLog
    extra = 0
    fields = ["level", "message", "created_at"]
    readonly_fields = ["created_at"]
    can_delete = False


@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = ["name", "integration_type", "provider", "status", "is_active", "owner", "created_at"]
    list_filter = ["integration_type", "status", "is_active", "created_at"]
    search_fields = ["name", "provider", "owner__email"]
    inlines = [IntegrationLogInline]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("owner", "integration_type", "name", "provider", "status", "is_active")
        }),
        ("Configuration", {
            "fields": ("config",)
        }),
        ("Status & Errors", {
            "fields": ("last_sync_at", "last_error", "error_count")
        }),
    )


@admin.register(EmailIntegration)
class EmailIntegrationAdmin(admin.ModelAdmin):
    list_display = ["integration", "provider", "from_email", "created_at"]
    list_filter = ["provider", "created_at"]
    search_fields = ["from_email", "from_name", "integration__name"]


@admin.register(WhatsAppIntegration)
class WhatsAppIntegrationAdmin(admin.ModelAdmin):
    list_display = ["integration", "phone_number_id", "business_account_id", "created_at"]
    search_fields = ["phone_number_id", "business_account_id", "integration__name"]


@admin.register(SMSIntegration)
class SMSIntegrationAdmin(admin.ModelAdmin):
    list_display = ["integration", "provider", "from_phone_number", "created_at"]
    list_filter = ["provider", "created_at"]
    search_fields = ["from_phone_number", "integration__name"]


@admin.register(SignUpPageIntegration)
class SignUpPageIntegrationAdmin(admin.ModelAdmin):
    list_display = ["integration", "page_url", "auto_create_contact", "created_at"]
    list_filter = ["auto_create_contact", "created_at"]
    search_fields = ["page_url", "integration__name"]


@admin.register(FacebookIntegration)
class FacebookIntegrationAdmin(admin.ModelAdmin):
    list_display = ["integration", "page_id", "enable_lead_ads", "enable_messenger", "created_at"]
    list_filter = ["enable_lead_ads", "enable_messenger", "created_at"]
    search_fields = ["page_id", "app_id", "integration__name"]


@admin.register(IntegrationLog)
class IntegrationLogAdmin(admin.ModelAdmin):
    list_display = ["integration", "level", "message", "created_at"]
    list_filter = ["level", "created_at"]
    search_fields = ["message", "integration__name"]
    readonly_fields = ["created_at"]
