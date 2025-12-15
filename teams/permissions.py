"""
Permission checking middleware and decorators for team-based access control.
"""
from functools import wraps
from django.http import JsonResponse
from teams.models import TeamMember, Team


def require_team_permission(resource, action):
    """
    Decorator to check if user has permission for a specific action on a resource.
    
    Usage:
        @require_team_permission('contacts', 'edit')
        def edit_contact(request, contact_id):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Get team_id from request
            team_id = request.GET.get('team_id') or request.POST.get('team_id')
            
            if not team_id:
                # If no team_id, allow for backward compatibility
                return view_func(request, *args, **kwargs)
            
            # Check if user is member of team
            member = TeamMember.objects.filter(
                team_id=team_id,
                user=request.user,
                status=TeamMember.STATUS_ACTIVE
            ).select_related('role').first()
            
            if not member:
                return JsonResponse({'error': 'Not a member of this team'}, status=403)
            
            # Check permission
            if not member.has_permission(resource, action):
                return JsonResponse({
                    'error': f'You do not have permission to {action} {resource}'
                }, status=403)
            
            # Add team and member to request for use in view
            request.team = member.team
            request.team_member = member
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def get_user_teams(user):
    """Get all teams a user belongs to."""
    owned_teams = Team.objects.filter(owner=user)
    member_teams = Team.objects.filter(
        members__user=user,
        members__status=TeamMember.STATUS_ACTIVE
    )
    return (owned_teams | member_teams).distinct()


def check_team_permission(user, team_id, resource, action):
    """Check if user has specific permission in a team."""
    member = TeamMember.objects.filter(
        team_id=team_id,
        user=user,
        status=TeamMember.STATUS_ACTIVE
    ).select_related('role').first()
    
    if not member:
        return False
    
    return member.has_permission(resource, action)


class TeamContext:
    """Helper class to manage team context in views."""
    
    def __init__(self, request, team_id=None):
        self.request = request
        self.user = request.user
        self.team_id = team_id or request.GET.get('team_id') or request.POST.get('team_id')
        self._team = None
        self._member = None
    
    @property
    def team(self):
        if not self._team and self.team_id:
            self._team = Team.objects.filter(id=self.team_id).first()
        return self._team
    
    @property
    def member(self):
        if not self._member and self.team:
            self._member = TeamMember.objects.filter(
                team=self.team,
                user=self.user,
                status=TeamMember.STATUS_ACTIVE
            ).select_related('role').first()
        return self._member
    
    def has_permission(self, resource, action):
        """Check if user has permission."""
        if not self.member:
            return False
        return self.member.has_permission(resource, action)
    
    def is_owner(self):
        """Check if user is team owner."""
        return self.team and self.team.owner == self.user
    
    def is_member(self):
        """Check if user is team member."""
        return self.member is not None
