from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class Metric(models.Model):
    """Store daily/weekly/monthly metrics for analytics."""
    
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    
    PERIOD_CHOICES = [
        (DAILY, "Daily"),
        (WEEKLY, "Weekly"),
        (MONTHLY, "Monthly"),
    ]
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="metrics"
    )
    
    # Time period
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Contact metrics
    total_contacts = models.IntegerField(default=0)
    new_contacts = models.IntegerField(default=0)
    active_contacts = models.IntegerField(default=0)
    
    # Lead metrics
    total_leads = models.IntegerField(default=0)
    qualified_leads = models.IntegerField(default=0)
    converted_leads = models.IntegerField(default=0)
    
    # Activity metrics
    emails_sent = models.IntegerField(default=0)
    emails_opened = models.IntegerField(default=0)
    emails_clicked = models.IntegerField(default=0)
    calls_made = models.IntegerField(default=0)
    meetings_held = models.IntegerField(default=0)
    
    # Campaign metrics
    campaigns_active = models.IntegerField(default=0)
    campaign_enrollments = models.IntegerField(default=0)
    
    # Task metrics
    tasks_created = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)
    tasks_overdue = models.IntegerField(default=0)
    
    # Revenue metrics (if tracked)
    deals_won = models.IntegerField(default=0)
    deals_lost = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-period_start"]
        unique_together = ("owner", "period_type", "period_start")
    
    def __str__(self):
        return f"{self.owner} - {self.period_type} - {self.period_start.date()}"


class ConversionFunnel(models.Model):
    """Track conversion rates through the sales funnel."""
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="conversion_funnels"
    )
    
    name = models.CharField(max_length=255)
    
    # Funnel stages with counts
    stage_1_name = models.CharField(max_length=100, default="Lead")
    stage_1_count = models.IntegerField(default=0)
    
    stage_2_name = models.CharField(max_length=100, default="Contacted")
    stage_2_count = models.IntegerField(default=0)
    
    stage_3_name = models.CharField(max_length=100, default="Qualified")
    stage_3_count = models.IntegerField(default=0)
    
    stage_4_name = models.CharField(max_length=100, default="Proposal")
    stage_4_count = models.IntegerField(default=0)
    
    stage_5_name = models.CharField(max_length=100, default="Won")
    stage_5_count = models.IntegerField(default=0)
    
    # Date range for this funnel snapshot
    date_from = models.DateTimeField()
    date_to = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.name} - {self.date_from.date()}"
    
    @property
    def conversion_rate_1_to_2(self):
        if self.stage_1_count == 0:
            return 0
        return (self.stage_2_count / self.stage_1_count) * 100
    
    @property
    def conversion_rate_2_to_3(self):
        if self.stage_2_count == 0:
            return 0
        return (self.stage_3_count / self.stage_2_count) * 100
    
    @property
    def conversion_rate_3_to_4(self):
        if self.stage_3_count == 0:
            return 0
        return (self.stage_4_count / self.stage_3_count) * 100
    
    @property
    def conversion_rate_4_to_5(self):
        if self.stage_4_count == 0:
            return 0
        return (self.stage_5_count / self.stage_4_count) * 100
    
    @property
    def overall_conversion_rate(self):
        if self.stage_1_count == 0:
            return 0
        return (self.stage_5_count / self.stage_1_count) * 100


class LeadSource(models.Model):
    """Track performance by lead source."""
    
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="lead_sources"
    )
    
    source_name = models.CharField(max_length=255)
    
    # Counts
    total_leads = models.IntegerField(default=0)
    qualified_leads = models.IntegerField(default=0)
    converted_leads = models.IntegerField(default=0)
    
    # Metrics
    average_lead_score = models.FloatField(default=0)
    conversion_rate = models.FloatField(default=0)
    
    # Time tracking
    average_time_to_conversion = models.IntegerField(
        default=0,
        help_text="Average days to convert"
    )
    
    # Date range
    date_from = models.DateTimeField()
    date_to = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-total_leads"]
    
    def __str__(self):
        return f"{self.source_name} - {self.total_leads} leads"
    
    def calculate_conversion_rate(self):
        if self.total_leads == 0:
            return 0
        self.conversion_rate = (self.converted_leads / self.total_leads) * 100
        return self.conversion_rate
