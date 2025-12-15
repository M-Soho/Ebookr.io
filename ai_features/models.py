"""
Phase 4: AI Features Models

AI-powered features including:
- Email generation with templates and personalization
- Contact scoring and lead prioritization
- Predictive analytics for contact engagement
- Smart recommendations for next actions
- Sentiment analysis for email responses
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from contacts.models import Contact


class AIEmailTemplate(models.Model):
    """
    AI-generated email templates with dynamic personalization.
    Uses AI to generate contextually relevant emails based on contact data.
    """
    CATEGORY_CHOICES = [
        ('introduction', 'Introduction'),
        ('follow_up', 'Follow Up'),
        ('proposal', 'Proposal'),
        ('thank_you', 'Thank You'),
        ('re_engagement', 'Re-engagement'),
        ('meeting_request', 'Meeting Request'),
        ('custom', 'Custom'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_email_templates')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    prompt = models.TextField(help_text="AI prompt template for generating email content")
    subject_template = models.CharField(max_length=500, blank=True)
    body_template = models.TextField(blank=True)
    tone = models.CharField(max_length=50, default='professional', 
                           help_text="professional, friendly, casual, formal")
    personalization_fields = models.JSONField(default=dict, 
                                             help_text="Fields to use for personalization")
    usage_count = models.PositiveIntegerField(default=0)
    success_rate = models.FloatField(default=0.0, help_text="Response rate percentage")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-usage_count', '-created_at']
        indexes = [
            models.Index(fields=['owner', 'category']),
            models.Index(fields=['is_active', '-usage_count']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class GeneratedEmail(models.Model):
    """
    Track AI-generated emails for analytics and improvement.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('opened', 'Opened'),
        ('replied', 'Replied'),
        ('bounced', 'Bounced'),
    ]
    
    template = models.ForeignKey(AIEmailTemplate, on_delete=models.SET_NULL, 
                                null=True, blank=True, related_name='generated_emails')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='ai_emails')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_emails')
    
    prompt_used = models.TextField()
    subject = models.CharField(max_length=500)
    body = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    sent_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    
    sentiment_score = models.FloatField(null=True, blank=True)
    engagement_score = models.FloatField(null=True, blank=True)
    
    ai_model_used = models.CharField(max_length=100, default='claude-3-5-sonnet')
    generation_time_ms = models.PositiveIntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['contact', '-created_at']),
        ]
    
    def __str__(self):
        return f"Email to {self.contact.email} - {self.status}"


class ContactScore(models.Model):
    """AI-powered contact scoring for lead prioritization."""
    SCORE_LEVEL_CHOICES = [
        ('hot', 'Hot Lead'),
        ('warm', 'Warm Lead'),
        ('cold', 'Cold Lead'),
        ('nurture', 'Needs Nurturing'),
        ('inactive', 'Inactive'),
    ]
    
    contact = models.OneToOneField(Contact, on_delete=models.CASCADE, related_name='ai_score')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contact_scores')
    
    engagement_score = models.FloatField(default=0.0)
    recency_score = models.FloatField(default=0.0)
    response_rate_score = models.FloatField(default=0.0)
    profile_completeness = models.FloatField(default=0.0)
    
    overall_score = models.FloatField(default=0.0)
    score_level = models.CharField(max_length=20, choices=SCORE_LEVEL_CHOICES, default='cold')
    
    conversion_probability = models.FloatField(default=0.0)
    churn_risk = models.FloatField(default=0.0)
    next_best_action = models.CharField(max_length=200, blank=True)
    
    key_insights = models.JSONField(default=list)
    behavioral_patterns = models.JSONField(default=dict)
    
    last_calculated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-overall_score']
        indexes = [
            models.Index(fields=['owner', '-overall_score']),
            models.Index(fields=['score_level']),
        ]
    
    def __str__(self):
        return f"{self.contact.email} - {self.score_level} ({self.overall_score:.1f})"


class PredictiveAnalytics(models.Model):
    """Predictive analytics for forecasting and trend analysis."""
    METRIC_CHOICES = [
        ('contact_growth', 'Contact Growth'),
        ('conversion_rate', 'Conversion Rate'),
        ('email_engagement', 'Email Engagement'),
        ('deal_closure', 'Deal Closure'),
        ('churn_rate', 'Churn Rate'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='predictions')
    metric = models.CharField(max_length=50, choices=METRIC_CHOICES)
    
    historical_data = models.JSONField()
    training_period_days = models.PositiveIntegerField(default=90)
    
    predicted_values = models.JSONField()
    forecast_period_days = models.PositiveIntegerField(default=30)
    confidence_interval = models.JSONField()
    accuracy_score = models.FloatField(null=True, blank=True)
    
    trend_direction = models.CharField(max_length=20, 
                                      choices=[('up', 'Increasing'), 
                                              ('down', 'Decreasing'),
                                              ('stable', 'Stable')])
    anomalies_detected = models.JSONField(default=list)
    recommendations = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Predictive analytics'
    
    def __str__(self):
        return f"{self.get_metric_display()} prediction"


class SmartRecommendation(models.Model):
    """AI-generated smart recommendations for user actions."""
    RECOMMENDATION_TYPES = [
        ('contact_action', 'Contact Action'),
        ('workflow_suggestion', 'Workflow Suggestion'),
        ('template_usage', 'Template Usage'),
        ('timing_optimization', 'Timing Optimization'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    recommendation_type = models.CharField(max_length=50, choices=RECOMMENDATION_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    action_url = models.CharField(max_length=500, blank=True)
    
    related_contact = models.ForeignKey(Contact, on_delete=models.CASCADE, 
                                       null=True, blank=True,
                                       related_name='recommendations')
    context_data = models.JSONField(default=dict)
    
    expected_impact = models.TextField(blank=True)
    confidence_score = models.FloatField(default=0.5)
    
    is_viewed = models.BooleanField(default=False)
    is_acted_upon = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-priority', '-confidence_score', '-created_at']
        indexes = [
            models.Index(fields=['owner', 'is_dismissed', 'expires_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.priority})"


class SentimentAnalysis(models.Model):
    """Sentiment analysis for email responses and interactions."""
    SENTIMENT_CHOICES = [
        ('very_positive', 'Very Positive'),
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
        ('very_negative', 'Very Negative'),
    ]
    
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, 
                               related_name='sentiment_analyses')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, 
                             related_name='sentiment_analyses')
    
    source_type = models.CharField(max_length=50, 
                                  choices=[('email', 'Email'), 
                                          ('note', 'Note'),
                                          ('call', 'Call')])
    source_text = models.TextField()
    
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES)
    sentiment_score = models.FloatField()
    confidence = models.FloatField()
    
    emotions = models.JSONField(default=dict)
    key_phrases = models.JSONField(default=list)
    
    response_urgency = models.CharField(max_length=20,
                                       choices=[('urgent', 'Urgent'),
                                               ('moderate', 'Moderate'),
                                               ('low', 'Low')],
                                       default='moderate')
    
    analyzed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-analyzed_at']
        verbose_name_plural = 'Sentiment analyses'
    
    def __str__(self):
        return f"{self.contact.email} - {self.sentiment}"
