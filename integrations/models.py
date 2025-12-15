from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import json


class Integration(models.Model):
    """Base model for managing third-party service integrations."""
    
    # Integration types
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    SIGNUP_PAGE = "signup_page"
    FACEBOOK = "facebook"
    WEBHOOK = "webhook"
    
    INTEGRATION_TYPE_CHOICES = [
        (EMAIL, "Email Service"),
        (WHATSAPP, "WhatsApp"),
        (SMS, "SMS Service"),
        (SIGNUP_PAGE, "Sign Up Page"),
        (FACEBOOK, "Facebook"),
        (WEBHOOK, "Webhook"),
    ]
    
    # Status
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"
    
    STATUS_CHOICES = [
        (ACTIVE, "Active"),
        (INACTIVE, "Inactive"),
        (ERROR, "Error"),
        (PENDING, "Pending Setup"),
    ]
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="integrations"
    )
    integration_type = models.CharField(
        max_length=20,
        choices=INTEGRATION_TYPE_CHOICES
    )
    name = models.CharField(
        max_length=255,
        help_text="Display name for this integration"
    )
    provider = models.CharField(
        max_length=100,
        blank=True,
        help_text="Service provider (e.g., SendGrid, Twilio, Mailchimp)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    is_active = models.BooleanField(default=False)
    
    # Configuration stored as JSON
    config = models.JSONField(
        default=dict,
        help_text="Integration-specific configuration"
    )
    
    # Metadata
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    error_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        unique_together = ("owner", "integration_type", "provider")
    
    def __str__(self):
        return f"{self.name} ({self.get_integration_type_display()})"
    
    def test_connection(self):
        """Test the integration connection. Override in specific integration types."""
        # This would be implemented based on integration type
        return True, "Connection test not implemented"


class EmailIntegration(models.Model):
    """Specific configuration for email service integrations."""
    
    # Email providers
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    AWS_SES = "aws_ses"
    SMTP = "smtp"
    MAILCHIMP = "mailchimp"
    
    PROVIDER_CHOICES = [
        (SENDGRID, "SendGrid"),
        (MAILGUN, "Mailgun"),
        (AWS_SES, "AWS SES"),
        (SMTP, "SMTP"),
        (MAILCHIMP, "Mailchimp"),
    ]
    
    integration = models.OneToOneField(
        Integration,
        on_delete=models.CASCADE,
        related_name="email_config"
    )
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    
    # Common email settings
    api_key = models.CharField(max_length=500, blank=True)
    from_email = models.EmailField()
    from_name = models.CharField(max_length=255, blank=True)
    reply_to_email = models.EmailField(blank=True)
    
    # SMTP specific
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.IntegerField(null=True, blank=True)
    smtp_username = models.CharField(max_length=255, blank=True)
    smtp_password = models.CharField(max_length=500, blank=True)
    smtp_use_tls = models.BooleanField(default=True)
    
    # AWS SES specific
    aws_region = models.CharField(max_length=50, blank=True)
    aws_access_key_id = models.CharField(max_length=255, blank=True)
    aws_secret_access_key = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.from_email}"


class WhatsAppIntegration(models.Model):
    """Configuration for WhatsApp Business API integration."""
    
    integration = models.OneToOneField(
        Integration,
        on_delete=models.CASCADE,
        related_name="whatsapp_config"
    )
    
    # WhatsApp Business API credentials
    phone_number_id = models.CharField(max_length=255)
    business_account_id = models.CharField(max_length=255)
    access_token = models.CharField(max_length=500)
    
    # Webhook configuration
    webhook_verify_token = models.CharField(max_length=500, blank=True)
    webhook_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"WhatsApp - {self.phone_number_id}"


class SMSIntegration(models.Model):
    """Configuration for SMS service integrations."""
    
    # SMS providers
    TWILIO = "twilio"
    VONAGE = "vonage"
    AWS_SNS = "aws_sns"
    PLIVO = "plivo"
    
    PROVIDER_CHOICES = [
        (TWILIO, "Twilio"),
        (VONAGE, "Vonage (Nexmo)"),
        (AWS_SNS, "AWS SNS"),
        (PLIVO, "Plivo"),
    ]
    
    integration = models.OneToOneField(
        Integration,
        on_delete=models.CASCADE,
        related_name="sms_config"
    )
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    
    # Common SMS settings
    account_sid = models.CharField(max_length=255, blank=True)
    auth_token = models.CharField(max_length=500)
    api_key = models.CharField(max_length=500, blank=True)
    api_secret = models.CharField(max_length=500, blank=True)
    
    # Phone number settings
    from_phone_number = models.CharField(max_length=20)
    
    # AWS SNS specific
    aws_region = models.CharField(max_length=50, blank=True)
    aws_access_key_id = models.CharField(max_length=255, blank=True)
    aws_secret_access_key = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.from_phone_number}"


class SignUpPageIntegration(models.Model):
    """Configuration for sign-up page/form integrations."""
    
    integration = models.OneToOneField(
        Integration,
        on_delete=models.CASCADE,
        related_name="signup_config"
    )
    
    # Page settings
    page_url = models.URLField(blank=True)
    embed_code = models.TextField(
        blank=True,
        help_text="HTML embed code for the sign-up form"
    )
    api_endpoint = models.URLField(
        blank=True,
        help_text="API endpoint to receive sign-ups"
    )
    api_key = models.CharField(max_length=500, blank=True)
    
    # Form configuration
    form_fields = models.JSONField(
        default=list,
        help_text="List of form fields to collect"
    )
    redirect_url = models.URLField(
        blank=True,
        help_text="URL to redirect after successful sign-up"
    )
    
    # Automation settings
    auto_create_contact = models.BooleanField(
        default=True,
        help_text="Automatically create contact on sign-up"
    )
    apply_tag = models.CharField(
        max_length=100,
        blank=True,
        help_text="Tag to apply to new contacts"
    )
    trigger_campaign_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Campaign to trigger on sign-up"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Sign Up Page - {self.page_url or 'Embedded'}"


class FacebookIntegration(models.Model):
    """Configuration for Facebook integration."""
    
    integration = models.OneToOneField(
        Integration,
        on_delete=models.CASCADE,
        related_name="facebook_config"
    )
    
    # Facebook App credentials
    app_id = models.CharField(max_length=255)
    app_secret = models.CharField(max_length=500)
    access_token = models.CharField(max_length=500)
    page_id = models.CharField(max_length=255, blank=True)
    
    # Page access token (for posting)
    page_access_token = models.CharField(max_length=500, blank=True)
    
    # Lead ads settings
    enable_lead_ads = models.BooleanField(default=False)
    lead_form_id = models.CharField(max_length=255, blank=True)
    
    # Messenger settings
    enable_messenger = models.BooleanField(default=False)
    
    # Webhook configuration
    webhook_verify_token = models.CharField(max_length=500, blank=True)
    webhook_url = models.URLField(blank=True)
    
    # Automation settings
    auto_create_contact_from_leads = models.BooleanField(default=True)
    trigger_campaign_on_lead = models.IntegerField(
        null=True,
        blank=True,
        help_text="Campaign to trigger when lead is captured"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Facebook - Page {self.page_id or 'Not Connected'}"


class IntegrationLog(models.Model):
    """Log of integration activities and errors."""
    
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"
    
    LEVEL_CHOICES = [
        (SUCCESS, "Success"),
        (ERROR, "Error"),
        (WARNING, "Warning"),
        (INFO, "Info"),
    ]
    
    integration = models.ForeignKey(
        Integration,
        on_delete=models.CASCADE,
        related_name="logs"
    )
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.integration.name} - {self.level} - {self.created_at}"
