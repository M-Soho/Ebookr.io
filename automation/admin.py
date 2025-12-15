from django.contrib import admin
from .models import (
    AutomationTemplate,
    AutomationCampaign,
    AutomationStep,
    ScheduledFollowUp,
    FollowUpRule,
    Workflow,
    WorkflowEnrollment,
    WorkflowCondition,
    ABTest,
    WorkflowTemplate,
)


@admin.register(AutomationTemplate)
class AutomationTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "owner", "is_system_template", "created_at"]
    list_filter = ["category", "is_system_template", "created_at"]
    search_fields = ["name", "description"]


class AutomationStepInline(admin.TabularInline):
    model = AutomationStep
    extra = 1
    fields = ["order", "name", "message_type", "delay_days", "delay_hours", "subject"]


@admin.register(AutomationCampaign)
class AutomationCampaignAdmin(admin.ModelAdmin):
    list_display = ["name", "contact", "status", "template", "started_at", "created_at"]
    list_filter = ["status", "created_at", "started_at"]
    search_fields = ["name", "contact__email", "contact__first_name", "contact__last_name"]
    inlines = [AutomationStepInline]


@admin.register(AutomationStep)
class AutomationStepAdmin(admin.ModelAdmin):
    list_display = ["campaign", "order", "name", "message_type", "delay_days", "is_executed", "executed_at"]
    list_filter = ["message_type", "is_executed", "created_at"]
    search_fields = ["name", "campaign__name", "subject"]


@admin.register(ScheduledFollowUp)
class ScheduledFollowUpAdmin(admin.ModelAdmin):
    list_display = ["contact", "scheduled_for", "status", "sent_at", "created_at"]
    list_filter = ["status", "scheduled_for", "created_at"]
    search_fields = ["contact__email", "contact__first_name", "contact__last_name"]


@admin.register(FollowUpRule)
class FollowUpRuleAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "is_active", "delay_days", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "subject_template"]


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "is_active", "trigger_type", "total_enrolled", "total_completed", "created_at"]
    list_filter = ["is_active", "trigger_type", "created_at"]
    search_fields = ["name", "description", "owner__email"]


@admin.register(WorkflowEnrollment)
class WorkflowEnrollmentAdmin(admin.ModelAdmin):
    list_display = ["workflow", "contact", "status", "current_node_id", "enrolled_at", "completed_at"]
    list_filter = ["status", "enrolled_at"]
    search_fields = ["workflow__name", "contact__email", "contact__first_name"]


@admin.register(WorkflowCondition)
class WorkflowConditionAdmin(admin.ModelAdmin):
    list_display = ["name", "workflow", "field", "operator", "logic", "created_at"]
    list_filter = ["logic", "operator", "created_at"]
    search_fields = ["name", "workflow__name", "field"]


@admin.register(ABTest)
class ABTestAdmin(admin.ModelAdmin):
    list_display = [
        "name", 
        "workflow", 
        "variant_a_conversion_rate", 
        "variant_b_conversion_rate",
        "winner",
        "is_active",
        "created_at"
    ]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "workflow__name"]
    readonly_fields = ["variant_a_conversion_rate", "variant_b_conversion_rate", "winner"]


@admin.register(WorkflowTemplate)
class WorkflowTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "is_system", "times_used", "created_by", "created_at"]
    list_filter = ["is_system", "category", "created_at"]
    search_fields = ["name", "description", "category"]
