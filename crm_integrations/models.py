"""
Phase 5: CRM Integrations Models

Integration features including:
- Calendar sync (Google, Outlook)
- Third-party CRM connections (Salesforce, HubSpot)
- Webhook management
- API key management
- OAuth connections
- Data sync and mapping
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import secrets


class Integration(models.Model):
    """
    Main integration configuration for third-party services.
    """
    PROVIDER_CHOICES = [
        ('google_calendar', 'Google Calendar'),
        ('outlook_calendar', 'Outlook Calendar'),
        ('salesforce', 'Salesforce'),
        ('hubspot', 'HubSpot'),
        ('pipedrive', 'Pipedrive'),
        ('zoho', 'Zoho CRM'),
        ('zapier', 'Zapier'),
        ('make', 'Make'),
        ('slack', 'Slack'),
        ('custom', 'Custom Webhook'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
        ('pending', 'Pending Authorization'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='crm_integrations')
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    name = models.CharField(max_length=200, help_text="Custom name for this integration")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # OAuth data
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    # API credentials
    api_key = models.CharField(max_length=500, blank=True)
    api_secret = models.CharField(max_length=500, blank=True)
    
    # Configuration
    config = models.JSONField(default=dict, help_text="Provider-specific configuration")
    webhook_url = models.URLField(blank=True, max_length=500)
    
    # Sync settings
    sync_enabled = models.BooleanField(default=True)
    sync_interval_minutes = models.PositiveIntegerField(default=15)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    next_sync_at = models.DateTimeField(null=True, blank=True)
    
    # Stats
    total_syncs = models.PositiveIntegerField(default=0)
    failed_syncs = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'provider', 'status']),
            models.Index(fields=['next_sync_at']),
        ]
        unique_together = [['owner', 'provider', 'name']]
    
    def __str__(self):
        return f"{self.name} ({self.get_provider_display()})"


class CalendarSync(models.Model):
    """
    Calendar event synchronization.
    """
    EVENT_TYPE_CHOICES = [
        ('meeting', 'Meeting'),
        ('call', 'Call'),
        ('follow_up', 'Follow Up'),
        ('demo', 'Demo'),
        ('other', 'Other'),
    ]
    
    integration = models.ForeignKey(Integration, on_delete=models.CASCADE, 
                                   related_name='calendar_events')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    
    # Event details
    external_event_id = models.CharField(max_length=500, unique=True)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    timezone = models.CharField(max_length=100, default='UTC')
    
    location = models.CharField(max_length=500, blank=True)
    meeting_url = models.URLField(blank=True, max_length=500)
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES, default='meeting')
    
    # Attendees
    attendees = models.JSONField(default=list, help_text="List of attendee emails")
    
    # CRM linking
    linked_contacts = models.ManyToManyField('contacts.Contact', 
                                            related_name='calendar_events',
                                            blank=True)
    
    # Sync tracking
    is_synced = models.BooleanField(default=False)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_errors = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['owner', 'start_time']),
            models.Index(fields=['external_event_id']),
        ]
    
    def __str__(self):
        return f"{self.title} at {self.start_time}"


class DataMapping(models.Model):
    """
    Field mapping between external systems and CRM.
    """
    integration = models.ForeignKey(Integration, on_delete=models.CASCADE, 
                                   related_name='field_mappings')
    
    # Source field (external system)
    source_field = models.CharField(max_length=200)
    source_field_type = models.CharField(max_length=50, 
                                        choices=[('string', 'String'),
                                                ('number', 'Number'),
                                                ('boolean', 'Boolean'),
                                                ('date', 'Date'),
                                                ('datetime', 'DateTime'),
                                                ('json', 'JSON')])
    
    # Target field (CRM)
    target_model = models.CharField(max_length=100, help_text="contacts.Contact, etc.")
    target_field = models.CharField(max_length=200)
    
    # Transformation
    transform_function = models.CharField(max_length=100, blank=True,
                                         help_text="Optional transformation function")
    default_value = models.CharField(max_length=500, blank=True)
    
    is_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [['integration', 'source_field', 'target_model', 'target_field']]
        indexes = [
            models.Index(fields=['integration', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.source_field} → {self.target_model}.{self.target_field}"


class SyncLog(models.Model):
    """
    Log of integration sync operations.
    """
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('partial', 'Partial Success'),
        ('failed', 'Failed'),
    ]
    
    integration = models.ForeignKey(Integration, on_delete=models.CASCADE, 
                                   related_name='sync_logs')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    direction = models.CharField(max_length=20,
                                choices=[('inbound', 'Inbound'),
                                        ('outbound', 'Outbound'),
                                        ('bidirectional', 'Bidirectional')])
    
    records_processed = models.PositiveIntegerField(default=0)
    records_created = models.PositiveIntegerField(default=0)
    records_updated = models.PositiveIntegerField(default=0)
    records_failed = models.PositiveIntegerField(default=0)
    
    duration_ms = models.PositiveIntegerField(help_text="Sync duration in milliseconds")
    
    error_messages = models.JSONField(default=list)
    details = models.JSONField(default=dict)
    
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['integration', '-started_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.integration.name} sync - {self.status}"


class Webhook(models.Model):
    """
    Webhook configuration for external systems.
    """
    EVENT_CHOICES = [
        ('contact.created', 'Contact Created'),
        ('contact.updated', 'Contact Updated'),
        ('contact.deleted', 'Contact Deleted'),
        ('workflow.completed', 'Workflow Completed'),
        ('email.sent', 'Email Sent'),
        ('email.opened', 'Email Opened'),
        ('email.clicked', 'Email Clicked'),
        ('task.completed', 'Task Completed'),
        ('deal.won', 'Deal Won'),
        ('deal.lost', 'Deal Lost'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='webhooks')
    name = models.CharField(max_length=200)
    url = models.URLField(max_length=500)
    
    events = models.JSONField(default=list, help_text="List of events to trigger webhook")
    
    # Security
    secret = models.CharField(max_length=100, unique=True)
    
    # Headers and config
    headers = models.JSONField(default=dict, help_text="Custom headers to include")
    payload_template = models.TextField(blank=True, 
                                       help_text="Optional custom payload template")
    
    is_active = models.BooleanField(default=True)
    
    # Stats
    total_calls = models.PositiveIntegerField(default=0)
    failed_calls = models.PositiveIntegerField(default=0)
    last_called_at = models.DateTimeField(null=True, blank=True)
    last_status_code = models.PositiveIntegerField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.secret:
            self.secret = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


class WebhookLog(models.Model):
    """
    Log of webhook deliveries.
    """
    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, 
                               related_name='delivery_logs')
    
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    
    status_code = models.PositiveIntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    is_success = models.BooleanField(default=False)
    duration_ms = models.PositiveIntegerField(help_text="Request duration")
    
    attempted_at = models.DateTimeField(auto_now_add=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['webhook', '-attempted_at']),
            models.Index(fields=['is_success']),
        ]
    
    def __str__(self):
        return f"{self.webhook.name} - {self.event_type}"


class APIKey(models.Model):
    """
    API keys for external access to the CRM.
    """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=200)
    
    key = models.CharField(max_length=100, unique=True)
    
    # Permissions
    scopes = models.JSONField(default=list, help_text="API scopes/permissions")
    rate_limit_per_hour = models.PositiveIntegerField(default=1000)
    
    # IP restrictions
    allowed_ips = models.JSONField(default=list, blank=True,
                                   help_text="Whitelist of allowed IP addresses")
    
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    total_requests = models.PositiveBigIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['key', 'is_active']),
            models.Index(fields=['owner', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({'active' if self.is_active else 'inactive'})"
    
    def save(self, *args, **kwargs):
        if not self.key:
            self.key = f"ebk_{secrets.token_urlsafe(32)}"
        super().save(*args, **kwargs)
