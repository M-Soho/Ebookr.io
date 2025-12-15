from django.contrib import admin
from .models import (
    Integration,
    CalendarSync,
    DataMapping,
    SyncLog,
    Webhook,
    WebhookLog,
    APIKey,
)


@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider', 'owner', 'status', 'sync_enabled', 
                   'last_synced_at', 'total_syncs', 'created_at']
    list_filter = ['provider', 'status', 'sync_enabled', 'created_at']
    search_fields = ['name', 'owner__email']
    readonly_fields = ['total_syncs', 'failed_syncs', 'last_synced_at', 
                      'created_at', 'updated_at']


@admin.register(CalendarSync)
class CalendarSyncAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'event_type', 'start_time', 
                   'is_synced', 'last_synced_at']
    list_filter = ['event_type', 'is_synced', 'start_time']
    search_fields = ['title', 'description', 'owner__email']
    readonly_fields = ['external_event_id', 'last_synced_at', 'created_at', 'updated_at']


@admin.register(DataMapping)
class DataMappingAdmin(admin.ModelAdmin):
    list_display = ['source_field', 'target_model', 'target_field', 
                   'integration', 'is_required', 'is_active']
    list_filter = ['source_field_type', 'is_required', 'is_active']
    search_fields = ['source_field', 'target_field', 'integration__name']
    readonly_fields = ['created_at']


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ['integration', 'status', 'direction', 'records_processed', 
                   'records_created', 'records_updated', 'started_at']
    list_filter = ['status', 'direction', 'started_at']
    search_fields = ['integration__name']
    readonly_fields = ['started_at', 'completed_at']


@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'is_active', 'total_calls', 
                   'failed_calls', 'last_called_at']
    list_filter = ['is_active', 'created_at', 'last_called_at']
    search_fields = ['name', 'url', 'owner__email']
    readonly_fields = ['secret', 'total_calls', 'failed_calls', 
                      'created_at', 'updated_at']


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ['webhook', 'event_type', 'is_success', 'status_code', 
                   'duration_ms', 'attempted_at']
    list_filter = ['is_success', 'event_type', 'attempted_at']
    search_fields = ['webhook__name', 'event_type']
    readonly_fields = ['attempted_at']


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'is_active', 'total_requests', 
                   'rate_limit_per_hour', 'last_used_at']
    list_filter = ['is_active', 'created_at', 'expires_at']
    search_fields = ['name', 'owner__email', 'key']
    readonly_fields = ['key', 'total_requests', 'last_used_at', 'last_ip', 'created_at']
