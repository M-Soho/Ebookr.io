from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class Contact(models.Model):
    id = models.BigAutoField(primary_key=True)
    owner = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name="contacts"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(db_index=True)
    company = models.CharField(max_length=150, blank=True)

    LEAD = "lead"
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOST = "lost"

    STATUS_CHOICES = [
        (LEAD, "Lead"),
        (ACTIVE, "Active"),
        (INACTIVE, "Inactive"),
        (LOST, "Lost"),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=LEAD)
    source = models.CharField(
        max_length=100, blank=True, help_text="Where this contact came from"
    )
    next_follow_up_at = models.DateTimeField(null=True, blank=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    # New fields for richer contact management
    CONTACT = "contact"
    COMPANY = "company"
    CONTACT_TYPE_CHOICES = [
        (CONTACT, "Contact"),
        (COMPANY, "Company"),
    ]

    contact_type = models.CharField(
        max_length=20, choices=CONTACT_TYPE_CHOICES, default=CONTACT
    )

    # Cadence for outreach/follow-up
    CADENCE_NONE = "none"
    CADENCE_DAILY = "daily"
    CADENCE_WEEKLY = "weekly"
    CADENCE_MONTHLY = "monthly"
    CADENCE_QUARTERLY = "quarterly"
    CADENCE_ANNUAL = "annual"

    CADENCE_CHOICES = [
        (CADENCE_NONE, "None"),
        (CADENCE_DAILY, "Daily"),
        (CADENCE_WEEKLY, "Weekly"),
        (CADENCE_MONTHLY, "Monthly"),
        (CADENCE_QUARTERLY, "Quarterly"),
        (CADENCE_ANNUAL, "Annual"),
    ]

    contact_cadence = models.CharField(
        max_length=20, choices=CADENCE_CHOICES, default=CADENCE_NONE
    )

    # Preferred contact method
    PREF_EMAIL = "email"
    PREF_PHONE = "phone"
    PREF_SMS = "sms"
    PREF_NONE = "none"

    CONTACT_PREF_CHOICES = [
        (PREF_EMAIL, "Email"),
        (PREF_PHONE, "Phone"),
        (PREF_SMS, "SMS"),
        (PREF_NONE, "None"),
    ]

    contact_pref = models.CharField(
        max_length=20, choices=CONTACT_PREF_CHOICES, default=PREF_EMAIL
    )

    # Drip campaign options (simple boolean + JSON config)
    drip_campaign_enabled = models.BooleanField(default=False)
    try:
        # Django 3.1+ supports JSONField in core
        from django.db.models import JSONField

        drip_campaign_config = JSONField(null=True, blank=True)
    except Exception:
        # Fallback to TextField storing JSON as text if JSONField unavailable
        drip_campaign_config = models.TextField(null=True, blank=True)

    # Lead scoring
    lead_score = models.IntegerField(default=0, help_text="Calculated lead score")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["owner", "email"]) ]
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        if name:
            return f"{name} <{self.email}>"
        return self.email
    
    def calculate_lead_score(self):
        """Calculate lead score based on activities and engagement."""
        score = 0
        
        # Base score by status
        if self.status == self.ACTIVE:
            score += 50
        elif self.status == self.LEAD:
            score += 20
        
        # Add points for recent activity
        if self.last_contacted_at:
            days_since_contact = (timezone.now() - self.last_contacted_at).days
            if days_since_contact < 7:
                score += 30
            elif days_since_contact < 30:
                score += 15
        
        # Add points for activities
        activity_count = self.activities.count()
        score += min(activity_count * 5, 50)  # Max 50 points from activities
        
        # Add points for tags
        score += min(self.tags.count() * 2, 20)  # Max 20 points from tags
        
        self.lead_score = min(score, 100)  # Cap at 100
        return self.lead_score


class Tag(models.Model):
    """Tags for organizing and segmenting contacts."""
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="tags"
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7,
        default="#3B82F6",
        help_text="Hex color code"
    )
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["name"]
        unique_together = ("owner", "name")
    
    def __str__(self):
        return self.name
    
    @property
    def contact_count(self):
        return self.contacts.count()


class ContactTag(models.Model):
    """Many-to-many relationship between contacts and tags."""
    
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name="contact_tags"
    )
    tag = models.ForeignKey(
        Tag,
        on_delete=models.CASCADE,
        related_name="contact_tags"
    )
    added_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        unique_together = ("contact", "tag")
        ordering = ["-added_at"]
    
    def __str__(self):
        return f"{self.contact} - {self.tag}"


# Add ManyToMany relationship to Contact
Contact.tags = models.ManyToManyField(
    Tag,
    through=ContactTag,
    related_name="contacts",
    blank=True
)


class Activity(models.Model):
    """Activity timeline for contacts."""
    
    # Activity types
    EMAIL_SENT = "email_sent"
    EMAIL_OPENED = "email_opened"
    EMAIL_CLICKED = "email_clicked"
    SMS_SENT = "sms_sent"
    CALL_MADE = "call_made"
    MEETING = "meeting"
    NOTE = "note"
    TASK_COMPLETED = "task_completed"
    STATUS_CHANGED = "status_changed"
    TAG_ADDED = "tag_added"
    TAG_REMOVED = "tag_removed"
    CAMPAIGN_STARTED = "campaign_started"
    FORM_SUBMITTED = "form_submitted"
    
    ACTIVITY_TYPE_CHOICES = [
        (EMAIL_SENT, "Email Sent"),
        (EMAIL_OPENED, "Email Opened"),
        (EMAIL_CLICKED, "Email Clicked"),
        (SMS_SENT, "SMS Sent"),
        (CALL_MADE, "Call Made"),
        (MEETING, "Meeting"),
        (NOTE, "Note"),
        (TASK_COMPLETED, "Task Completed"),
        (STATUS_CHANGED, "Status Changed"),
        (TAG_ADDED, "Tag Added"),
        (TAG_REMOVED, "Tag Removed"),
        (CAMPAIGN_STARTED, "Campaign Started"),
        (FORM_SUBMITTED, "Form Submitted"),
    ]
    
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name="activities"
    )
    activity_type = models.CharField(
        max_length=50,
        choices=ACTIVITY_TYPE_CHOICES
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional activity data"
    )
    
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Activities"
    
    def __str__(self):
        return f"{self.contact} - {self.get_activity_type_display()} - {self.created_at}"


class MessageTemplate(models.Model):
    """Reusable message templates for emails and SMS."""
    
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    
    TEMPLATE_TYPE_CHOICES = [
        (EMAIL, "Email"),
        (SMS, "SMS"),
        (WHATSAPP, "WhatsApp"),
    ]
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="message_templates"
    )
    name = models.CharField(max_length=255)
    template_type = models.CharField(
        max_length=20,
        choices=TEMPLATE_TYPE_CHOICES
    )
    subject = models.CharField(
        max_length=500,
        blank=True,
        help_text="Email subject line (not used for SMS)"
    )
    body = models.TextField(help_text="Template content with merge tags")
    category = models.CharField(
        max_length=100,
        blank=True,
        help_text="Template category for organization"
    )
    is_active = models.BooleanField(default=True)
    
    # Merge tags documentation
    available_merge_tags = models.JSONField(
        default=list,
        blank=True,
        help_text="List of available merge tags"
    )
    
    usage_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    def render(self, context):
        """Render template with context data."""
        subject = self.subject
        body = self.body
        
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
        
        return subject, body


class Task(models.Model):
    """Task management for contacts and general todos."""
    
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    
    STATUS_CHOICES = [
        (TODO, "To Do"),
        (IN_PROGRESS, "In Progress"),
        (COMPLETED, "Completed"),
        (CANCELLED, "Cancelled"),
    ]
    
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    
    PRIORITY_CHOICES = [
        (LOW, "Low"),
        (MEDIUM, "Medium"),
        (HIGH, "High"),
        (URGENT, "Urgent"),
    ]
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tasks",
        help_text="Associated contact (optional)"
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=TODO
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=MEDIUM
    )
    
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Reminder settings
    reminder_enabled = models.BooleanField(default=False)
    reminder_time = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        if self.due_date and self.status != self.COMPLETED:
            return timezone.now() > self.due_date
        return False


class Segment(models.Model):
    """Dynamic contact segments based on criteria."""
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="segments"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Segment criteria stored as JSON
    criteria = models.JSONField(
        default=dict,
        help_text="Filtering criteria for segment"
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return self.name
    
    def get_contacts(self):
        """Get contacts matching segment criteria."""
        from django.db.models import Q
        
        queryset = Contact.objects.filter(owner=self.owner)
        criteria = self.criteria
        
        # Apply status filter
        if criteria.get('status'):
            queryset = queryset.filter(status__in=criteria['status'])
        
        # Apply tag filter
        if criteria.get('tags'):
            queryset = queryset.filter(tags__id__in=criteria['tags']).distinct()
        
        # Apply lead score filter
        if criteria.get('min_score'):
            queryset = queryset.filter(lead_score__gte=criteria['min_score'])
        if criteria.get('max_score'):
            queryset = queryset.filter(lead_score__lte=criteria['max_score'])
        
        # Apply source filter
        if criteria.get('source'):
            queryset = queryset.filter(source__in=criteria['source'])
        
        # Apply date range filter
        if criteria.get('created_after'):
            queryset = queryset.filter(created_at__gte=criteria['created_after'])
        if criteria.get('created_before'):
            queryset = queryset.filter(created_at__lte=criteria['created_before'])
        
        return queryset
    
    @property
    def contact_count(self):
        return self.get_contacts().count()
