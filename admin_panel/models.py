from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminSignup(models.Model):
    """Track all user signups for admin analytics"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='signup_record', null=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    tier = models.CharField(
        max_length=50,
        choices=[('starter', 'Starter'), ('pro', 'Pro')],
        default='starter'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.tier}) - {self.created_at.strftime('%Y-%m-%d')}"


class APIConfiguration(models.Model):
    """Store API keys and configuration for external services"""
    SERVICE_CHOICES = [
        ('stripe', 'Stripe'),
        ('sendgrid', 'SendGrid'),
        ('mailgun', 'Mailgun'),
        ('twilio', 'Twilio'),
        ('anthropic', 'Anthropic (Claude)'),
    ]

    service = models.CharField(max_length=50, choices=SERVICE_CHOICES, unique=True)
    api_key = models.TextField(help_text="Encrypted API key")
    api_secret = models.TextField(blank=True, help_text="Optional API secret")
    webhook_url = models.URLField(blank=True, help_text="Webhook URL for this service")
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['service']

    def __str__(self):
        return f"{self.service} - {'Active' if self.is_active else 'Inactive'}"


class EmailConfiguration(models.Model):
    """Email sending configuration"""
    EMAIL_PROVIDERS = [
        ('sendgrid', 'SendGrid'),
        ('mailgun', 'Mailgun'),
        ('smtp', 'SMTP'),
    ]

    provider = models.CharField(max_length=50, choices=EMAIL_PROVIDERS, default='sendgrid')
    from_email = models.EmailField()
    from_name = models.CharField(max_length=255, default='Ebookr')
    is_active = models.BooleanField(default=False)
    
    # SMTP settings (if provider is 'smtp')
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.IntegerField(blank=True, null=True)
    smtp_username = models.CharField(max_length=255, blank=True)
    smtp_password = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Email Configurations'

    def __str__(self):
        return f"{self.provider} - {self.from_email}"


class AdminSettings(models.Model):
    """Global admin settings"""
    # Email settings
    welcome_email_enabled = models.BooleanField(default=True)
    welcome_email_template = models.TextField(
        default="Welcome to Ebookr! You're now part of our community.",
        help_text="HTML template for welcome email"
    )
    
    # Trial settings
    trial_days = models.IntegerField(default=14)
    
    # Feature flags
    enable_drip_campaigns = models.BooleanField(default=True)
    enable_ai_features = models.BooleanField(default=False)
    enable_reports = models.BooleanField(default=True)
    
    # Rate limiting
    rate_limit_requests_per_minute = models.IntegerField(default=60)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Admin Settings'

    def __str__(self):
        return "Global Admin Settings"
