from django.db import models
from django.contrib.auth import get_user_model


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
