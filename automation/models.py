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


class Workflow(models.Model):
    """Advanced workflow with conditional logic and branching."""
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="workflows"
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Workflow configuration stored as JSON
    # Format: {"nodes": [...], "edges": [...]}
    workflow_data = models.JSONField(default=dict)
    
    is_active = models.BooleanField(default=True)
    
    # Trigger settings
    TRIGGER_MANUAL = "manual"
    TRIGGER_STATUS_CHANGE = "status_change"
    TRIGGER_TAG_ADDED = "tag_added"
    TRIGGER_FORM_SUBMIT = "form_submit"
    TRIGGER_SCHEDULED = "scheduled"
    
    TRIGGER_CHOICES = [
        (TRIGGER_MANUAL, "Manual Trigger"),
        (TRIGGER_STATUS_CHANGE, "Status Change"),
        (TRIGGER_TAG_ADDED, "Tag Added"),
        (TRIGGER_FORM_SUBMIT, "Form Submit"),
        (TRIGGER_SCHEDULED, "Scheduled"),
    ]
    
    trigger_type = models.CharField(
        max_length=20,
        choices=TRIGGER_CHOICES,
        default=TRIGGER_MANUAL
    )
    trigger_config = models.JSONField(default=dict)
    
    # Statistics
    total_enrolled = models.IntegerField(default=0)
    total_completed = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.name


class WorkflowEnrollment(models.Model):
    """Track a contact's progress through a workflow."""
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )
    
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name="workflow_enrollments"
    )
    
    current_node_id = models.CharField(max_length=100, blank=True)
    
    STATUS_ACTIVE = "active"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_PAUSED = "paused"
    
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
        (STATUS_PAUSED, "Paused"),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE
    )
    
    # Store execution history
    execution_log = models.JSONField(default=list)
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-enrolled_at"]
        unique_together = ("workflow", "contact")
    
    def __str__(self):
        return f"{self.contact} in {self.workflow.name}"


class WorkflowCondition(models.Model):
    """Define conditions for workflow branching."""
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="conditions"
    )
    
    name = models.CharField(max_length=255)
    
    # Condition configuration
    field = models.CharField(max_length=100)
    operator = models.CharField(max_length=50)
    value = models.JSONField()
    
    # Logical grouping
    LOGIC_AND = "AND"
    LOGIC_OR = "OR"
    
    LOGIC_CHOICES = [
        (LOGIC_AND, "AND"),
        (LOGIC_OR, "OR"),
    ]
    
    logic = models.CharField(
        max_length=3,
        choices=LOGIC_CHOICES,
        default=LOGIC_AND
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["created_at"]
    
    def __str__(self):
        return f"{self.name} - {self.field} {self.operator}"


class ABTest(models.Model):
    """A/B test configuration for workflows."""
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="ab_tests"
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # A/B test variants
    variant_a_config = models.JSONField(default=dict)
    variant_b_config = models.JSONField(default=dict)
    
    # Split percentage (0-100)
    split_percentage = models.IntegerField(default=50)
    
    # Results
    variant_a_enrolled = models.IntegerField(default=0)
    variant_b_enrolled = models.IntegerField(default=0)
    variant_a_converted = models.IntegerField(default=0)
    variant_b_converted = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.name} - {self.workflow.name}"
    
    @property
    def variant_a_conversion_rate(self):
        if self.variant_a_enrolled == 0:
            return 0
        return (self.variant_a_converted / self.variant_a_enrolled) * 100
    
    @property
    def variant_b_conversion_rate(self):
        if self.variant_b_enrolled == 0:
            return 0
        return (self.variant_b_converted / self.variant_b_enrolled) * 100
    
    @property
    def winner(self):
        if self.variant_a_conversion_rate > self.variant_b_conversion_rate:
            return "A"
        elif self.variant_b_conversion_rate > self.variant_a_conversion_rate:
            return "B"
        return "Tie"


class WorkflowTemplate(models.Model):
    """Pre-built workflow templates."""
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    
    # Template workflow data
    workflow_data = models.JSONField(default=dict)
    
    is_system = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_workflow_templates"
    )
    
    times_used = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-times_used", "name"]
    
    def __str__(self):
        return self.name


class TaskAutomationRule(models.Model):
    """
    Rules for automatically creating and scheduling tasks
    """
    
    TRIGGER_ACTIVITY = "activity"
    TRIGGER_STATUS_CHANGE = "status_change"
    TRIGGER_NEW_CONTACT = "new_contact"
    TRIGGER_CADENCE = "cadence"
    TRIGGER_OVERDUE_FOLLOWUP = "overdue_followup"
    TRIGGER_TIME_BASED = "time_based"
    
    TRIGGER_TYPE_CHOICES = [
        (TRIGGER_ACTIVITY, "Activity Trigger"),
        (TRIGGER_STATUS_CHANGE, "Status Change"),
        (TRIGGER_NEW_CONTACT, "New Contact"),
        (TRIGGER_CADENCE, "Contact Cadence"),
        (TRIGGER_OVERDUE_FOLLOWUP, "Overdue Follow-up"),
        (TRIGGER_TIME_BASED, "Time-based"),
    ]
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="task_automation_rules"
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    trigger_type = models.CharField(
        max_length=50,
        choices=TRIGGER_TYPE_CHOICES
    )
    
    # Trigger configuration (JSON)
    # For activity: {"activity_types": ["email_opened", "email_clicked"]}
    # For status: {"from_status": "lead", "to_status": "active"}
    # For cadence: {"cadences": ["daily", "weekly"]}
    trigger_config = models.JSONField(default=dict)
    
    # Task template
    task_title_template = models.CharField(
        max_length=255,
        help_text="Use {{contact_name}}, {{activity_type}}, etc."
    )
    task_description_template = models.TextField(blank=True)
    task_priority = models.CharField(
        max_length=20,
        default="medium",
        help_text="low, medium, high, urgent"
    )
    
    # Timing
    delay_hours = models.IntegerField(
        default=24,
        help_text="Hours after trigger to schedule task"
    )
    reminder_offset_hours = models.IntegerField(
        default=1,
        help_text="Hours before due date to set reminder"
    )
    
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    times_triggered = models.IntegerField(default=0)
    tasks_created = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return f"{self.name} ({self.trigger_type})"


class ScheduledTaskBatch(models.Model):
    """
    Track batches of automatically scheduled tasks
    """
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="scheduled_task_batches"
    )
    
    batch_name = models.CharField(max_length=255)
    batch_type = models.CharField(
        max_length=50,
        help_text="follow_up_sequence, recurring, automation_workflow, etc."
    )
    
    contact = models.ForeignKey(
        "contacts.Contact",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="task_batches"
    )
    
    tasks_count = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Scheduled task batches"
    
    def __str__(self):
        return f"{self.batch_name} ({self.tasks_completed}/{self.tasks_count})"
    
    @property
    def is_completed(self):
        return self.tasks_completed >= self.tasks_count and self.tasks_count > 0


