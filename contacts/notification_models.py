"""
Notification models for in-app notifications and alerts.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class Notification(models.Model):
    """In-app notifications for users."""
    
    # Notification types
    TASK_REMINDER = "task_reminder"
    TASK_OVERDUE = "task_overdue"
    TASK_ASSIGNED = "task_assigned"
    CONTACT_ACTIVITY = "contact_activity"
    WORKFLOW_COMPLETED = "workflow_completed"
    SYSTEM = "system"
    
    TYPE_CHOICES = [
        (TASK_REMINDER, "Task Reminder"),
        (TASK_OVERDUE, "Task Overdue"),
        (TASK_ASSIGNED, "Task Assigned"),
        (CONTACT_ACTIVITY, "Contact Activity"),
        (WORKFLOW_COMPLETED, "Workflow Completed"),
        (SYSTEM, "System"),
    ]
    
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    notification_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Link to related object
    link_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="URL to navigate to when clicked"
    )
    
    # Additional metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional notification data"
    )
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class NotificationPreference(models.Model):
    """User preferences for notifications."""
    
    user = models.OneToOneField(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="notification_preferences"
    )
    
    # In-app notifications
    in_app_task_reminders = models.BooleanField(default=True)
    in_app_task_overdue = models.BooleanField(default=True)
    in_app_task_assigned = models.BooleanField(default=True)
    in_app_contact_activity = models.BooleanField(default=True)
    in_app_workflow_completed = models.BooleanField(default=True)
    in_app_system = models.BooleanField(default=True)
    
    # Email notifications
    email_task_reminders = models.BooleanField(default=True)
    email_task_overdue = models.BooleanField(default=True)
    email_task_assigned = models.BooleanField(default=True)
    email_daily_digest = models.BooleanField(default=False)
    email_weekly_digest = models.BooleanField(default=False)
    
    # Digest timing
    daily_digest_time = models.TimeField(
        default=timezone.now().replace(hour=9, minute=0, second=0, microsecond=0).time(),
        help_text="Time to send daily digest (UTC)"
    )
    weekly_digest_day = models.IntegerField(
        default=1,  # Monday
        help_text="Day of week for weekly digest (0=Monday, 6=Sunday)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification preferences for {self.user}"
