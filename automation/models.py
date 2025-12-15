from django.db import models
from django.contrib.auth import get_user_model


class AutomationTemplate(models.Model):
    """Pre-defined automation templates that users can apply to contacts."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        get_user_model(), 
        on_delete=models.CASCADE, 
        related_name="automation_templates",
        null=True,
        blank=True
    )
    is_system_template = models.BooleanField(default=False)
    
    # Template category
    NURTURE = "nurture"
    ONBOARDING = "onboarding"
    ENGAGEMENT = "engagement"
    REACTIVATION = "reactivation"
    CUSTOM = "custom"
    
    CATEGORY_CHOICES = [
        (NURTURE, "Lead Nurture"),
        (ONBOARDING, "Customer Onboarding"),
        (ENGAGEMENT, "Engagement"),
        (REACTIVATION, "Re-activation"),
        (CUSTOM, "Custom"),
    ]
    
    category = models.CharField(
        max_length=20, 
        choices=CATEGORY_CHOICES, 
        default=CUSTOM
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return self.name


class AutomationCampaign(models.Model):
    """An automation campaign applied to a contact using a template."""
    
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELED = "canceled"
    
    STATUS_CHOICES = [
        (ACTIVE, "Active"),
        (PAUSED, "Paused"),
        (COMPLETED, "Completed"),
        (CANCELED, "Canceled"),
    ]
    
    name = models.CharField(max_length=255)
    template = models.ForeignKey(
        AutomationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="campaigns"
    )
    contact = models.ForeignKey(
        "contacts.Contact",
        on_delete=models.CASCADE,
        related_name="automation_campaigns"
    )
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="automation_campaigns"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default=ACTIVE
    )
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.name} - {self.contact.email}"


class AutomationStep(models.Model):
    """A step in an automation campaign."""
    
    EMAIL = "email"
    SMS = "sms"
    TASK = "task"
    WEBHOOK = "webhook"
    
    MESSAGE_TYPE_CHOICES = [
        (EMAIL, "Email"),
        (SMS, "SMS"),
        (TASK, "Task"),
        (WEBHOOK, "Webhook"),
    ]
    
    campaign = models.ForeignKey(
        AutomationCampaign,
        on_delete=models.CASCADE,
        related_name="steps"
    )
    template = models.ForeignKey(
        AutomationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="template_steps"
    )
    
    order = models.PositiveIntegerField(default=0)
    name = models.CharField(max_length=255)
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        default=EMAIL
    )
    
    # Timing
    delay_days = models.PositiveIntegerField(
        default=0,
        help_text="Days to wait before executing this step"
    )
    delay_hours = models.PositiveIntegerField(
        default=0,
        help_text="Hours to wait before executing this step"
    )
    
    # Content
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    
    # Execution tracking
    scheduled_for = models.DateTimeField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    is_executed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["campaign", "order"]
        unique_together = ("campaign", "order")
    
    def __str__(self):
        return f"{self.campaign.name} - Step {self.order}: {self.name}"


class ScheduledFollowUp(models.Model):
    """A scheduled follow-up task for a contact."""
    
    PENDING = "pending"
    SENT = "sent"
    CANCELLED = "cancelled"
    FAILED = "failed"
    
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (SENT, "Sent"),
        (CANCELLED, "Cancelled"),
        (FAILED, "Failed"),
    ]
    
    contact = models.ForeignKey(
        "contacts.Contact",
        on_delete=models.CASCADE,
        related_name="scheduled_followups"
    )
    rule = models.ForeignKey(
        "FollowUpRule",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scheduled_followups"
    )
    scheduled_for = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["scheduled_for"]
    
    def __str__(self):
        return f"Follow-up for {self.contact.email} on {self.scheduled_for}"


class FollowUpRule(models.Model):
    """Rules for automatic follow-up scheduling."""
    
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="followup_rules"
    )
    is_active = models.BooleanField(default=True)
    
    # Trigger conditions
    trigger_on_status = models.CharField(max_length=10, blank=True)
    
    # Timing
    delay_days = models.PositiveIntegerField(default=1)
    
    # Content templates
    subject_template = models.CharField(max_length=255)
    body_template = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return self.name
