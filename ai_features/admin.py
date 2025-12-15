from django.contrib import admin
from .models import (
    AIEmailTemplate,
    GeneratedEmail,
    ContactScore,
    PredictiveAnalytics,
    SmartRecommendation,
    SentimentAnalysis,
)


@admin.register(AIEmailTemplate)
class AIEmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'owner', 'tone', 'usage_count', 
                   'success_rate', 'is_active', 'created_at']
    list_filter = ['category', 'tone', 'is_active', 'created_at']
    search_fields = ['name', 'prompt', 'owner__email']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']


@admin.register(GeneratedEmail)
class GeneratedEmailAdmin(admin.ModelAdmin):
    list_display = ['contact', 'owner', 'status', 'sentiment_score', 
                   'engagement_score', 'ai_model_used', 'created_at']
    list_filter = ['status', 'ai_model_used', 'created_at']
    search_fields = ['contact__email', 'owner__email', 'subject']
    readonly_fields = ['created_at']


@admin.register(ContactScore)
class ContactScoreAdmin(admin.ModelAdmin):
    list_display = ['contact', 'owner', 'overall_score', 'score_level', 
                   'conversion_probability', 'churn_risk']
    list_filter = ['score_level', 'last_calculated_at']
    search_fields = ['contact__email', 'owner__email']
    readonly_fields = ['last_calculated_at', 'created_at']


@admin.register(PredictiveAnalytics)
class PredictiveAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['owner', 'metric', 'trend_direction', 'accuracy_score', 
                   'training_period_days', 'created_at']
    list_filter = ['metric', 'trend_direction', 'created_at']
    search_fields = ['owner__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SmartRecommendation)
class SmartRecommendationAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'recommendation_type', 'priority', 
                   'confidence_score', 'is_viewed', 'is_acted_upon', 'created_at']
    list_filter = ['recommendation_type', 'priority', 'is_viewed', 
                  'is_acted_upon', 'is_dismissed', 'created_at']
    search_fields = ['title', 'description', 'owner__email']
    readonly_fields = ['created_at']


@admin.register(SentimentAnalysis)
class SentimentAnalysisAdmin(admin.ModelAdmin):
    list_display = ['contact', 'owner', 'sentiment', 'sentiment_score', 
                   'confidence', 'source_type', 'analyzed_at']
    list_filter = ['sentiment', 'source_type', 'response_urgency', 'analyzed_at']
    search_fields = ['contact__email', 'owner__email']
    readonly_fields = ['analyzed_at']
