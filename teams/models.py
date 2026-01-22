from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class Team(models.Model):
    """A team/workspace for collaboration."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Team owner/creator
    owner = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='owned_teams'
    )
    
    # Team settings
    settings = models.JSONField(default=dict)
    
    # Billing
    plan = models.CharField(
        max_length=50,
        choices=[
            ('free', 'Free'),
            ('professional', 'Professional'),
            ('enterprise', 'Enterprise'),
        ],
        default='free'
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Role(models.Model):
    """Predefined roles with permissions."""
    
    # System roles
    OWNER = 'owner'
    ADMIN = 'admin'
    MANAGER = 'manager'
    MEMBER = 'member'
    VIEWER = 'viewer'
    
    ROLE_CHOICES = [
        (OWNER, 'Owner'),
        (ADMIN, 'Admin'),
        (MANAGER, 'Manager'),
        (MEMBER, 'Member'),
        (VIEWER, 'Viewer'),
    ]
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='roles',
        null=True,
        blank=True
    )
    
    name = models.CharField(max_length=100)
    role_type = models.CharField(max_length=20, choices=ROLE_CHOICES)
    description = models.TextField(blank=True)
    
    # Permissions stored as JSON
    permissions = models.JSONField(default=dict)
    
    is_system_role = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.role_type})"
    
    @staticmethod
    def get_default_permissions(role_type):
        """Get default permissions for a role type."""
        permissions = {
            'owner': {
                'contacts': ['view', 'create', 'edit', 'delete', 'export', 'import'],
                'workflows': ['view', 'create', 'edit', 'delete', 'execute'],
                'analytics': ['view', 'export'],
                'team': ['view', 'invite', 'remove', 'edit_roles', 'manage_billing'],
                'settings': ['view', 'edit'],
            },
            'admin': {
                'contacts': ['view', 'create', 'edit', 'delete', 'export', 'import'],
                'workflows': ['view', 'create', 'edit', 'delete', 'execute'],
                'analytics': ['view', 'export'],
                'team': ['view', 'invite', 'remove'],
                'settings': ['view', 'edit'],
            },
            'manager': {
                'contacts': ['view', 'create', 'edit', 'delete', 'export'],
                'workflows': ['view', 'create', 'edit', 'execute'],
                'analytics': ['view'],
                'team': ['view', 'invite'],
                'settings': ['view'],
            },
            'member': {
                'contacts': ['view', 'create', 'edit'],
                'workflows': ['view', 'execute'],
                'analytics': ['view'],
                'team': ['view'],
                'settings': ['view'],
            },
            'viewer': {
                'contacts': ['view'],
                'workflows': ['view'],
                'analytics': ['view'],
                'team': ['view'],
                'settings': ['view'],
            },
        }
        return permissions.get(role_type, {})


class TeamMember(models.Model):
    """A user's membership in a team."""
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='members'
    )
    
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='team_memberships'
    )
    
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        related_name='team_members'
    )
    
    # Status
    STATUS_ACTIVE = 'active'
    STATUS_INVITED = 'invited'
    STATUS_SUSPENDED = 'suspended'
    
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INVITED, 'Invited'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_INVITED
    )
    
    # Invitation
    invited_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_invitations'
    )
    
    invited_at = models.DateTimeField(auto_now_add=True)
    joined_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-joined_at']
        unique_together = ('team', 'user')
    
    def __str__(self):
        return f"{self.user.email} in {self.team.name}"
    
    def has_permission(self, resource, action):
        """Check if member has specific permission."""
        if not self.role:
            return False
        
        permissions = self.role.permissions
        resource_perms = permissions.get(resource, [])
        return action in resource_perms


class TeamInvitation(models.Model):
    """Invitation to join a team."""
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    
    email = models.EmailField()
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    
    invited_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='team_invitations_sent'
    )
    
    # Invitation token
    token = models.CharField(max_length=100, unique=True)
    
    # Status
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_EXPIRED = 'expired'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_EXPIRED, 'Expired'),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation for {self.email} to {self.team.name}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at


class Comment(models.Model):
    """Comments on contacts, workflows, or other resources."""
    
    # Generic foreign key support
    RESOURCE_CONTACT = 'contact'
    RESOURCE_WORKFLOW = 'workflow'
    RESOURCE_CAMPAIGN = 'campaign'
    RESOURCE_TASK = 'task'
    
    RESOURCE_CHOICES = [
        (RESOURCE_CONTACT, 'Contact'),
        (RESOURCE_WORKFLOW, 'Workflow'),
        (RESOURCE_CAMPAIGN, 'Campaign'),
        (RESOURCE_TASK, 'Task'),
    ]
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    
    resource_type = models.CharField(max_length=20, choices=RESOURCE_CHOICES)
    resource_id = models.IntegerField()
    
    author = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='comments'
    )
    
    content = models.TextField()
    
    # Mentions
    mentions = models.ManyToManyField(
        get_user_model(),
        related_name='comment_mentions',
        blank=True
    )
    
    # Parent comment for threading
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.email} on {self.resource_type} #{self.resource_id}"


class ActivityShare(models.Model):
    """Share activities/updates within a team."""
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='shared_activities'
    )
    
    shared_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name='shared_activities'
    )
    
    # What's being shared
    activity_type = models.CharField(max_length=50)
    activity_data = models.JSONField()
    
    # Share settings
    shared_with = models.ManyToManyField(
        get_user_model(),
        related_name='received_shares',
        blank=True
    )
    
    is_public = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.activity_type} shared by {self.shared_by.email}"


class TeamAuditLog(models.Model):
    """Audit log for team activities."""
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        related_name='team_audit_logs'
    )
    
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=50)
    resource_id = models.IntegerField(null=True, blank=True)
    
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} by {self.user.email if self.user else 'System'} at {self.created_at}"
