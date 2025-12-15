"""
API views for team collaboration and management.
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
import json
import secrets
from datetime import timedelta

from .models import (
    Team,
    Role,
    TeamMember,
    TeamInvitation,
    Comment,
    ActivityShare,
    TeamAuditLog,
)
from contacts.models import Contact


def log_team_action(team, user, action, resource_type=None, resource_id=None, details=None, request=None):
    """Helper function to log team actions."""
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
    
    TeamAuditLog.objects.create(
        team=team,
        user=user,
        action=action,
        resource_type=resource_type or '',
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
    )


@login_required
@require_http_methods(["GET", "POST"])
def teams_list(request):
    """List all teams or create a new team."""
    user = request.user
    
    if request.method == "GET":
        # Get teams where user is owner or member
        owned_teams = Team.objects.filter(owner=user)
        member_teams = Team.objects.filter(
            members__user=user,
            members__status=TeamMember.STATUS_ACTIVE
        )
        
        all_teams = (owned_teams | member_teams).distinct()
        
        teams_data = []
        for team in all_teams:
            member = TeamMember.objects.filter(team=team, user=user).first()
            role_name = member.role.name if member and member.role else 'Owner'
            
            teams_data.append({
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'is_owner': team.owner == user,
                'role': role_name,
                'plan': team.plan,
                'member_count': team.members.filter(status=TeamMember.STATUS_ACTIVE).count(),
                'created_at': team.created_at.isoformat(),
            })
        
        return JsonResponse({'teams': teams_data})
    
    elif request.method == "POST":
        data = json.loads(request.body)
        
        # Create team
        team = Team.objects.create(
            name=data.get('name'),
            description=data.get('description', ''),
            owner=user,
            plan=data.get('plan', 'free'),
        )
        
        # Create owner role
        owner_role = Role.objects.create(
            team=team,
            name='Owner',
            role_type=Role.OWNER,
            permissions=Role.get_default_permissions(Role.OWNER),
            is_system_role=True,
        )
        
        # Create default roles
        for role_type, role_name in [
            (Role.ADMIN, 'Admin'),
            (Role.MANAGER, 'Manager'),
            (Role.MEMBER, 'Member'),
            (Role.VIEWER, 'Viewer'),
        ]:
            Role.objects.create(
                team=team,
                name=role_name,
                role_type=role_type,
                permissions=Role.get_default_permissions(role_type),
                is_system_role=True,
            )
        
        # Add owner as team member
        TeamMember.objects.create(
            team=team,
            user=user,
            role=owner_role,
            status=TeamMember.STATUS_ACTIVE,
            joined_at=timezone.now(),
        )
        
        log_team_action(team, user, 'team_created', 'team', team.id, request=request)
        
        return JsonResponse({
            'id': team.id,
            'message': 'Team created successfully'
        })


@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
def team_detail(request, team_id):
    """Get, update, or delete a team."""
    team = get_object_or_404(Team, id=team_id)
    
    # Check if user is member
    member = TeamMember.objects.filter(team=team, user=request.user).first()
    if not member and team.owner != request.user:
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    if request.method == "GET":
        return JsonResponse({
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'owner': {
                'id': team.owner.id,
                'email': team.owner.email,
                'name': f"{team.owner.first_name} {team.owner.last_name}",
            },
            'plan': team.plan,
            'is_active': team.is_active,
            'settings': team.settings,
            'created_at': team.created_at.isoformat(),
        })
    
    elif request.method == "PUT":
        # Check permission
        if not (team.owner == request.user or (member and member.has_permission('settings', 'edit'))):
            return JsonResponse({'error': 'Not authorized'}, status=403)
        
        data = json.loads(request.body)
        team.name = data.get('name', team.name)
        team.description = data.get('description', team.description)
        team.settings = data.get('settings', team.settings)
        team.save()
        
        log_team_action(team, request.user, 'team_updated', 'team', team.id, request=request)
        
        return JsonResponse({'message': 'Team updated successfully'})
    
    elif request.method == "DELETE":
        # Only owner can delete
        if team.owner != request.user:
            return JsonResponse({'error': 'Not authorized'}, status=403)
        
        log_team_action(team, request.user, 'team_deleted', 'team', team.id, request=request)
        team.delete()
        
        return JsonResponse({'message': 'Team deleted successfully'})


@login_required
@require_http_methods(["GET"])
def team_members(request, team_id):
    """Get all team members."""
    team = get_object_or_404(Team, id=team_id)
    
    # Check if user is member
    member = TeamMember.objects.filter(team=team, user=request.user).first()
    if not member and team.owner != request.user:
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    members = TeamMember.objects.filter(team=team).select_related('user', 'role')
    
    members_data = []
    for member in members:
        members_data.append({
            'id': member.id,
            'user': {
                'id': member.user.id,
                'email': member.user.email,
                'name': f"{member.user.first_name} {member.user.last_name}",
            },
            'role': {
                'id': member.role.id if member.role else None,
                'name': member.role.name if member.role else None,
                'type': member.role.role_type if member.role else None,
            },
            'status': member.status,
            'joined_at': member.joined_at.isoformat() if member.joined_at else None,
        })
    
    return JsonResponse({'members': members_data})


@login_required
@require_http_methods(["POST"])
def invite_member(request, team_id):
    """Invite a new member to the team."""
    team = get_object_or_404(Team, id=team_id)
    
    # Check permission
    member = TeamMember.objects.filter(team=team, user=request.user).first()
    if not (team.owner == request.user or (member and member.has_permission('team', 'invite'))):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    data = json.loads(request.body)
    email = data.get('email')
    role_id = data.get('role_id')
    
    role = get_object_or_404(Role, id=role_id, team=team)
    
    # Check if already invited or member
    if TeamMember.objects.filter(team=team, user__email=email).exists():
        return JsonResponse({'error': 'User is already a member'}, status=400)
    
    if TeamInvitation.objects.filter(
        team=team, 
        email=email, 
        status=TeamInvitation.STATUS_PENDING
    ).exists():
        return JsonResponse({'error': 'Invitation already sent'}, status=400)
    
    # Create invitation
    invitation = TeamInvitation.objects.create(
        team=team,
        email=email,
        role=role,
        invited_by=request.user,
        token=secrets.token_urlsafe(32),
        expires_at=timezone.now() + timedelta(days=7),
    )
    
    log_team_action(
        team, 
        request.user, 
        'member_invited', 
        'invitation', 
        invitation.id,
        {'email': email},
        request
    )
    
    return JsonResponse({
        'message': 'Invitation sent successfully',
        'invitation_id': invitation.id,
    })


@login_required
@require_http_methods(["POST"])
def remove_member(request, team_id, member_id):
    """Remove a member from the team."""
    team = get_object_or_404(Team, id=team_id)
    team_member = get_object_or_404(TeamMember, id=member_id, team=team)
    
    # Check permission
    member = TeamMember.objects.filter(team=team, user=request.user).first()
    if not (team.owner == request.user or (member and member.has_permission('team', 'remove'))):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    # Can't remove owner
    if team_member.user == team.owner:
        return JsonResponse({'error': 'Cannot remove team owner'}, status=400)
    
    log_team_action(
        team,
        request.user,
        'member_removed',
        'member',
        team_member.id,
        {'user_email': team_member.user.email},
        request
    )
    
    team_member.delete()
    
    return JsonResponse({'message': 'Member removed successfully'})


@login_required
@require_http_methods(["GET", "POST"])
def comments_list(request):
    """List or create comments."""
    user = request.user
    
    if request.method == "GET":
        resource_type = request.GET.get('resource_type')
        resource_id = request.GET.get('resource_id')
        team_id = request.GET.get('team_id')
        
        comments = Comment.objects.filter(
            team_id=team_id,
            resource_type=resource_type,
            resource_id=resource_id,
            parent__isnull=True  # Top-level comments only
        ).select_related('author').prefetch_related('replies')
        
        comments_data = []
        for comment in comments:
            comments_data.append({
                'id': comment.id,
                'content': comment.content,
                'author': {
                    'id': comment.author.id,
                    'email': comment.author.email,
                    'name': f"{comment.author.first_name} {comment.author.last_name}",
                },
                'created_at': comment.created_at.isoformat(),
                'updated_at': comment.updated_at.isoformat(),
                'replies_count': comment.replies.count(),
            })
        
        return JsonResponse({'comments': comments_data})
    
    elif request.method == "POST":
        data = json.loads(request.body)
        
        team = get_object_or_404(Team, id=data.get('team_id'))
        
        comment = Comment.objects.create(
            team=team,
            resource_type=data.get('resource_type'),
            resource_id=data.get('resource_id'),
            author=user,
            content=data.get('content'),
        )
        
        return JsonResponse({
            'id': comment.id,
            'message': 'Comment created successfully'
        })


@login_required
@require_http_methods(["GET"])
def team_activity_feed(request, team_id):
    """Get team activity feed."""
    team = get_object_or_404(Team, id=team_id)
    
    # Check if user is member
    member = TeamMember.objects.filter(team=team, user=request.user).first()
    if not member and team.owner != request.user:
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    # Get recent activities
    activities = ActivityShare.objects.filter(team=team)[:50]
    
    activities_data = []
    for activity in activities:
        activities_data.append({
            'id': activity.id,
            'type': activity.activity_type,
            'data': activity.activity_data,
            'shared_by': {
                'id': activity.shared_by.id,
                'email': activity.shared_by.email,
                'name': f"{activity.shared_by.first_name} {activity.shared_by.last_name}",
            },
            'is_public': activity.is_public,
            'created_at': activity.created_at.isoformat(),
        })
    
    return JsonResponse({'activities': activities_data})
