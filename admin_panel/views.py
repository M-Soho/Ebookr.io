from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from datetime import timedelta
from django.utils import timezone
import json

from admin_panel.models import AdminSignup, APIConfiguration, EmailConfiguration, AdminSettings
from contacts.models import Contact
from billing.models import DripCampaign

User = get_user_model()


def check_admin_auth(request):
    """Simple admin check - in production, use proper token auth"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split('Bearer ')[1]
        # For demo, check if token is admin token
        return token == 'admin-token-secret'
    return False


@require_http_methods(["GET"])
def admin_dashboard(request):
    """Admin dashboard with key metrics"""
    if not check_admin_auth(request):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    # Total signups
    total_signups = AdminSignup.objects.count()
    
    # Signups by tier
    tier_breakdown = AdminSignup.objects.values('tier').annotate(count=Count('id'))
    
    # Signups in last 7 days
    week_ago = timezone.now() - timedelta(days=7)
    recent_signups = AdminSignup.objects.filter(created_at__gte=week_ago).count()
    
    # Active contacts
    total_contacts = Contact.objects.count()
    
    # Active drip campaigns
    active_campaigns = DripCampaign.objects.filter(status='active').count()
    
    return JsonResponse({
        "total_signups": total_signups,
        "tier_breakdown": {item['tier']: item['count'] for item in tier_breakdown},
        "signups_7days": recent_signups,
        "total_contacts": total_contacts,
        "active_campaigns": active_campaigns,
    })


@require_http_methods(["GET"])
def list_signups(request):
    """List all signups with pagination"""
    if not check_admin_auth(request):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    limit = int(request.GET.get('limit', 50))
    offset = int(request.GET.get('offset', 0))
    
    signups = AdminSignup.objects.all()[offset:offset+limit]
    total = AdminSignup.objects.count()
    
    data = [
        {
            "id": s.id,
            "user_id": s.user.id if s.user else None,
            "name": s.name,
            "email": s.email,
            "tier": s.tier,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        }
        for s in signups
    ]
    
    return JsonResponse({
        "count": total,
        "next": offset + limit < total,
        "previous": offset > 0,
        "results": data,
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_configuration_list(request):
    """List or create API configurations"""
    if not check_admin_auth(request):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    if request.method == "GET":
        configs = APIConfiguration.objects.all()
        data = [
            {
                "id": c.id,
                "service": c.service,
                "api_key_masked": "***" + c.api_key[-4:] if c.api_key else "",
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat(),
            }
            for c in configs
        ]
        return JsonResponse({"results": data})

    # POST - Create or update
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    service = payload.get('service')
    if not service:
        return JsonResponse({"error": "service is required"}, status=400)

    config, created = APIConfiguration.objects.update_or_create(
        service=service,
        defaults={
            'api_key': payload.get('api_key', ''),
            'api_secret': payload.get('api_secret', ''),
            'webhook_url': payload.get('webhook_url', ''),
            'is_active': payload.get('is_active', False),
        }
    )

    return JsonResponse({
        "data": {
            "id": config.id,
            "service": config.service,
            "is_active": config.is_active,
            "created_at": config.created_at.isoformat(),
        }
    }, status=201 if created else 200)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def email_configuration(request):
    """Get or update email configuration"""
    if not check_admin_auth(request):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    if request.method == "GET":
        config = EmailConfiguration.objects.first()
        if not config:
            return JsonResponse({
                "id": None,
                "provider": "sendgrid",
                "is_active": False,
            })

        return JsonResponse({
            "id": config.id,
            "provider": config.provider,
            "from_email": config.from_email,
            "from_name": config.from_name,
            "is_active": config.is_active,
            "smtp_host": config.smtp_host,
            "smtp_port": config.smtp_port,
            "smtp_user": config.smtp_username,
            "smtp_use_tls": config.smtp_use_tls,
            "sendgrid_api_key": getattr(config, 'sendgrid_api_key', None),
            "mailgun_domain": getattr(config, 'mailgun_domain', None),
            "mailgun_api_key": getattr(config, 'mailgun_api_key', None),
            "created_at": config.created_at.isoformat(),
        })

    # POST - Create or update
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    config, created = EmailConfiguration.objects.get_or_create(id=1)
    
    config.provider = payload.get('provider', config.provider)
    config.from_email = payload.get('from_email', config.from_email)
    config.from_name = payload.get('from_name', config.from_name)
    config.is_active = payload.get('is_active', config.is_active)
    
    if config.provider == 'smtp':
        config.smtp_host = payload.get('smtp_host', '')
        config.smtp_port = payload.get('smtp_port')
        config.smtp_username = payload.get('smtp_username', '')
        config.smtp_password = payload.get('smtp_password', '')
    
    config.save()

    return JsonResponse({
        "data": {
            "id": config.id,
            "provider": config.provider,
            "from_email": config.from_email,
            "is_active": config.is_active,
        }
    }, status=201 if created else 200)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_settings(request):
    """Get or update admin settings"""
    if not check_admin_auth(request):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    if request.method == "GET":
        settings = AdminSettings.objects.first()
        if not settings:
            settings = AdminSettings.objects.create()

        return JsonResponse({
            "id": settings.id,
            "trial_days": settings.trial_days,
            "welcome_email_enabled": settings.welcome_email_enabled,
            "enable_drip_campaigns": settings.enable_drip_campaigns,
            "enable_ai_features": settings.enable_ai_features,
            "enable_reports": settings.enable_reports,
            "rate_limit_requests_per_minute": settings.rate_limit_requests_per_minute,
            "updated_at": settings.updated_at.isoformat(),
        })

    # POST - Update settings
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    settings = AdminSettings.objects.first()
    if not settings:
        settings = AdminSettings.objects.create()

    settings.trial_days = payload.get('trial_days', settings.trial_days)
    settings.welcome_email_enabled = payload.get('welcome_email_enabled', settings.welcome_email_enabled)
    settings.enable_drip_campaigns = payload.get('enable_drip_campaigns', settings.enable_drip_campaigns)
    settings.enable_ai_features = payload.get('enable_ai_features', settings.enable_ai_features)
    settings.enable_reports = payload.get('enable_reports', settings.enable_reports)
    settings.rate_limit_requests_per_minute = payload.get('rate_limit_requests_per_minute', settings.rate_limit_requests_per_minute)
    
    settings.save()

    return JsonResponse({
        "data": {
            "id": settings.id,
            "trial_days": settings.trial_days,
            "enable_drip_campaigns": settings.enable_drip_campaigns,
            "enable_ai_features": settings.enable_ai_features,
        }
    })


@require_http_methods(["GET"])
def admin_reports(request):
    """Comprehensive admin reports"""
    if not check_admin_auth(request):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    # Signups trend (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_signups = AdminSignup.objects.filter(
        created_at__gte=thirty_days_ago
    ).extra(
        select={'day': 'DATE(created_at)'}
    ).values('day').annotate(count=Count('id')).order_by('day')

    # Tier distribution
    tier_dist = AdminSignup.objects.values('tier').annotate(count=Count('id'))

    # Contact statistics
    total_contacts = Contact.objects.count()
    contacts_per_user = Contact.objects.values('owner').annotate(count=Count('id')).count()

    # Drip campaign stats
    campaign_stats = {
        'active': DripCampaign.objects.filter(status='active').count(),
        'completed': DripCampaign.objects.filter(status='completed').count(),
        'paused': DripCampaign.objects.filter(status='paused').count(),
    }

    return JsonResponse({
        "signup_trends_30days": [{"date": str(item['day']), "count": item['count']} for item in daily_signups],
        "tier_distribution": {item['tier']: item['count'] for item in tier_dist},
        "contact_statistics": {
            "total": total_contacts,
            "by_type": {},
        },
        "campaign_statistics": {
            "total": sum(campaign_stats.values()),
            "by_status": campaign_stats,
        },
    })
