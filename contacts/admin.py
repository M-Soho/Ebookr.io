from django.contrib import admin

from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "first_name",
        "last_name",
        "email",
        "company",
        "status",
        "owner",
        "next_follow_up_at",
        "last_contacted_at",
    )
    list_filter = ("status", "company")
    search_fields = ("first_name", "last_name", "email", "company", "notes")
    ordering = ("-updated_at",)
    date_hierarchy = "updated_at"
    raw_id_fields = ("owner",)
