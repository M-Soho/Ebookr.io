from django.contrib import admin

from .models import Contact, Tag, ContactTag, Activity, MessageTemplate, Task, Segment


class ContactTagInline(admin.TabularInline):
    model = ContactTag
    extra = 1
    raw_id_fields = ("tag",)


class ActivityInline(admin.TabularInline):
    model = Activity
    extra = 0
    fields = ("activity_type", "title", "created_at")
    readonly_fields = ("created_at",)
    can_delete = False


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0
    fields = ("title", "status", "priority", "due_date")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "first_name",
        "last_name",
        "email",
        "company",
        "status",
        "lead_score",
        "owner",
        "next_follow_up_at",
        "last_contacted_at",
    )
    list_filter = ("status", "company", "lead_score")
    search_fields = ("first_name", "last_name", "email", "company", "notes")
    ordering = ("-updated_at",)
    date_hierarchy = "updated_at"
    raw_id_fields = ("owner",)
    inlines = [ContactTagInline, ActivityInline, TaskInline]
    
    actions = ["recalculate_lead_scores"]
    
    def recalculate_lead_scores(self, request, queryset):
        for contact in queryset:
            contact.calculate_lead_score()
            contact.save()
        self.message_user(request, f"Recalculated lead scores for {queryset.count()} contacts.")
    recalculate_lead_scores.short_description = "Recalculate lead scores"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "owner", "contact_count", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "description")
    ordering = ("name",)


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("contact", "activity_type", "title", "created_by", "created_at")
    list_filter = ("activity_type", "created_at")
    search_fields = ("title", "description", "contact__email")
    ordering = ("-created_at",)
    raw_id_fields = ("contact", "created_by")


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "template_type", "category", "is_active", "usage_count", "owner", "created_at")
    list_filter = ("template_type", "category", "is_active", "created_at")
    search_fields = ("name", "subject", "body")
    ordering = ("-created_at",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "contact", "status", "priority", "due_date", "is_overdue", "owner", "created_at")
    list_filter = ("status", "priority", "created_at", "due_date")
    search_fields = ("title", "description", "contact__email")
    ordering = ("-created_at",)
    raw_id_fields = ("contact", "owner")


@admin.register(Segment)
class SegmentAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "contact_count", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "description")
    ordering = ("name",)
