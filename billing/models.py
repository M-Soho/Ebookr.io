from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class Subscription(models.Model):
    MONTHLY = "monthly"
    ANNUAL = "annual"

    PLAN_CHOICES = [
        (MONTHLY, "Monthly"),
        (ANNUAL, "Annual"),
    ]

    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    UNPAID = "unpaid"

    STATUS_CHOICES = [
        (TRIALING, "Trialing"),
        (ACTIVE, "Active"),
        (PAST_DUE, "Past Due"),
        (CANCELED, "Canceled"),
        (INCOMPLETE, "Incomplete"),
        (INCOMPLETE_EXPIRED, "Incomplete Expired"),
        (UNPAID, "Unpaid"),
    ]

    user = models.OneToOneField(
        get_user_model(), on_delete=models.CASCADE, related_name="subscription"
    )
    stripe_customer_id = models.CharField(max_length=255)
    stripe_subscription_id = models.CharField(max_length=255)
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    trial_start_at = models.DateTimeField(null=True, blank=True)
    trial_end_at = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.user.username} - {self.plan} ({self.status})"

    def is_trial_active(self, now=None) -> bool:
        """Return True if status is 'trialing' and trial_end_at is in the future."""
        if self.status != self.TRIALING:
            return False
        if self.trial_end_at is None:
            return False
        if now is None:
            now = timezone.now()
        return self.trial_end_at > now


class DripCampaign(models.Model):
    """A drip campaign is a sequence of automated messages sent to a contact over time."""

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

    contact = models.OneToOneField(
        "contacts.Contact", on_delete=models.CASCADE, related_name="drip_campaign"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Drip for {self.contact.email} ({self.status})"


class DripCampaignStep(models.Model):
    """A step in a drip campaign sequence."""

    campaign = models.ForeignKey(
        DripCampaign, on_delete=models.CASCADE, related_name="steps"
    )
    order = models.PositiveIntegerField(default=0)
    delay_days = models.PositiveIntegerField(
        default=0, help_text="Days to wait before sending this step"
    )
    template_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("campaign", "order")

    def __str__(self) -> str:
        return f"Step {self.order} of {self.campaign} - {self.subject or 'No Subject'}"
