from django.contrib import admin
from .models import (
    Team,
    Role,
    TeamMember,
    TeamInvitation,
    Comment,
    ActivityShare,
    TeamAuditLog,
)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'plan', 'is_active', 'created_at']
    list_filter = ['plan', 'is_active', 'created_at']
    search_fields = ['name', 'owner__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'role_type', 'team', 'is_system_role', 'created_at']
    list_filter = ['role_type', 'is_system_role', 'created_at']
    search_fields = ['name', 'team__name']


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'team', 'role', 'status', 'joined_at', 'invited_at']
    list_filter = ['status', 'role__role_type', 'joined_at']
    search_fields = ['user__email', 'team__name']
    readonly_fields = ['invited_at', 'joined_at']


@admin.register(TeamInvitation)
class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'team', 'role', 'status', 'invited_by', 'created_at', 'expires_at']
    list_filter = ['status', 'created_at']
    search_fields = ['email', 'team__name', 'invited_by__email']
    readonly_fields = ['token', 'created_at', 'responded_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'resource_type', 'resource_id', 'team', 'created_at']
    list_filter = ['resource_type', 'created_at']
    search_fields = ['content', 'author__email', 'team__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ActivityShare)
class ActivityShareAdmin(admin.ModelAdmin):
    list_display = ['shared_by', 'activity_type', 'team', 'is_public', 'created_at']
    list_filter = ['activity_type', 'is_public', 'created_at']
    search_fields = ['shared_by__email', 'team__name']


@admin.register(TeamAuditLog)
class TeamAuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'team', 'ip_address', 'created_at']
    list_filter = ['action', 'resource_type', 'created_at']
    search_fields = ['user__email', 'action', 'team__name']
    readonly_fields = ['created_at']
