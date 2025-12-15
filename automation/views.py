import json
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.db.models import Q, Count, Prefetch

from .models import (
    AutomationTemplate,
    AutomationCampaign,
    AutomationStep,
    ScheduledFollowUp,
    FollowUpRule,
)
from contacts.models import Contact


@csrf_exempt
@require_http_methods(["GET", "POST"])
def automation_templates(request):
    """List all automation templates or create a new one."""
    
    if request.method == "GET":
        user = request.user if request.user.is_authenticated else None
        
        # Get system templates and user's custom templates
        templates = AutomationTemplate.objects.filter(
            Q(is_system_template=True) | Q(owner=user)
        )
        
        category = request.GET.get("category")
        if category:
            templates = templates.filter(category=category)
        
        data = [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "is_system_template": t.is_system_template,
                "created_at": t.created_at.isoformat(),
            }
            for t in templates
        ]
        
        return JsonResponse({"templates": data})
    
    elif request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)
        
        try:
            data = json.loads(request.body)
            template = AutomationTemplate.objects.create(
                name=data["name"],
                description=data.get("description", ""),
                category=data.get("category", AutomationTemplate.CUSTOM),
                owner=request.user,
                is_system_template=False,
            )
            
            return JsonResponse({
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "category": template.category,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def automation_campaigns(request):
    """List all automation campaigns or create a new one."""
    
    if request.method == "GET":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)
        
        campaigns = AutomationCampaign.objects.filter(
            owner=request.user
        ).select_related("template", "contact").prefetch_related("steps")
        
        status = request.GET.get("status")
        if status:
            campaigns = campaigns.filter(status=status)
        
        contact_id = request.GET.get("contact_id")
        if contact_id:
            campaigns = campaigns.filter(contact_id=contact_id)
        
        data = [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "template": {
                    "id": c.template.id,
                    "name": c.template.name,
                } if c.template else None,
                "contact": {
                    "id": c.contact.id,
                    "email": c.contact.email,
                    "first_name": c.contact.first_name,
                    "last_name": c.contact.last_name,
                },
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "completed_at": c.completed_at.isoformat() if c.completed_at else None,
                "steps_count": c.steps.count(),
                "steps_executed": c.steps.filter(is_executed=True).count(),
                "created_at": c.created_at.isoformat(),
            }
            for c in campaigns
        ]
        
        return JsonResponse({"campaigns": data})
    
    elif request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)
        
        try:
            data = json.loads(request.body)
            
            # Get contact
            contact = Contact.objects.get(id=data["contact_id"], owner=request.user)
            
            # Get template if provided
            template = None
            if data.get("template_id"):
                template = AutomationTemplate.objects.get(id=data["template_id"])
            
            # Create campaign
            campaign = AutomationCampaign.objects.create(
                name=data["name"],
                template=template,
                contact=contact,
                owner=request.user,
                status=AutomationCampaign.ACTIVE,
                started_at=timezone.now(),
            )
            
            # Create steps if provided
            if data.get("steps"):
                for step_data in data["steps"]:
                    AutomationStep.objects.create(
                        campaign=campaign,
                        template=template,
                        order=step_data.get("order", 0),
                        name=step_data["name"],
                        message_type=step_data.get("message_type", AutomationStep.EMAIL),
                        delay_days=step_data.get("delay_days", 0),
                        delay_hours=step_data.get("delay_hours", 0),
                        subject=step_data.get("subject", ""),
                        body=step_data.get("body", ""),
                    )
            
            return JsonResponse({
                "id": campaign.id,
                "name": campaign.name,
                "status": campaign.status,
            }, status=201)
        
        except Contact.DoesNotExist:
            return JsonResponse({"error": "Contact not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def automation_campaign_detail(request, campaign_id):
    """Get, update, or delete a specific campaign."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        campaign = AutomationCampaign.objects.select_related(
            "template", "contact"
        ).prefetch_related("steps").get(
            id=campaign_id,
            owner=request.user
        )
    except AutomationCampaign.DoesNotExist:
        return JsonResponse({"error": "Campaign not found"}, status=404)
    
    if request.method == "GET":
        steps = [
            {
                "id": s.id,
                "order": s.order,
                "name": s.name,
                "message_type": s.message_type,
                "delay_days": s.delay_days,
                "delay_hours": s.delay_hours,
                "subject": s.subject,
                "body": s.body,
                "scheduled_for": s.scheduled_for.isoformat() if s.scheduled_for else None,
                "executed_at": s.executed_at.isoformat() if s.executed_at else None,
                "is_executed": s.is_executed,
            }
            for s in campaign.steps.all()
        ]
        
        return JsonResponse({
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status,
            "template": {
                "id": campaign.template.id,
                "name": campaign.template.name,
            } if campaign.template else None,
            "contact": {
                "id": campaign.contact.id,
                "email": campaign.contact.email,
                "first_name": campaign.contact.first_name,
                "last_name": campaign.contact.last_name,
            },
            "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
            "completed_at": campaign.completed_at.isoformat() if campaign.completed_at else None,
            "steps": steps,
            "created_at": campaign.created_at.isoformat(),
        })
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            if "name" in data:
                campaign.name = data["name"]
            if "status" in data:
                campaign.status = data["status"]
                if data["status"] == AutomationCampaign.PAUSED:
                    campaign.paused_at = timezone.now()
                elif data["status"] == AutomationCampaign.COMPLETED:
                    campaign.completed_at = timezone.now()
            
            campaign.save()
            
            return JsonResponse({
                "id": campaign.id,
                "name": campaign.name,
                "status": campaign.status,
            })
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        campaign.delete()
        return JsonResponse({"success": True})


@csrf_exempt
@require_http_methods(["GET"])
def automation_calendar(request):
    """Get calendar view of automation events."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    # Get date range from query params
    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")
    
    if start_date_str and end_date_str:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
    else:
        # Default to current month
        today = timezone.now()
        start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if today.month == 12:
            end_date = start_date.replace(year=today.year + 1, month=1)
        else:
            end_date = start_date.replace(month=today.month + 1)
    
    # Get all automation steps scheduled in this range
    steps = AutomationStep.objects.filter(
        campaign__owner=request.user,
        scheduled_for__gte=start_date,
        scheduled_for__lt=end_date,
    ).select_related("campaign", "campaign__contact")
    
    # Get all scheduled follow-ups in this range
    followups = ScheduledFollowUp.objects.filter(
        contact__owner=request.user,
        scheduled_for__gte=start_date,
        scheduled_for__lt=end_date,
    ).select_related("contact", "rule")
    
    events = []
    
    # Add automation steps to calendar
    for step in steps:
        events.append({
            "id": f"step-{step.id}",
            "type": "automation_step",
            "title": step.name,
            "message_type": step.message_type,
            "date": step.scheduled_for.isoformat(),
            "is_executed": step.is_executed,
            "campaign": {
                "id": step.campaign.id,
                "name": step.campaign.name,
            },
            "contact": {
                "id": step.campaign.contact.id,
                "email": step.campaign.contact.email,
                "first_name": step.campaign.contact.first_name,
                "last_name": step.campaign.contact.last_name,
            },
        })
    
    # Add follow-ups to calendar
    for followup in followups:
        events.append({
            "id": f"followup-{followup.id}",
            "type": "followup",
            "title": f"Follow-up: {followup.contact.email}",
            "date": followup.scheduled_for.isoformat(),
            "status": followup.status,
            "contact": {
                "id": followup.contact.id,
                "email": followup.contact.email,
                "first_name": followup.contact.first_name,
                "last_name": followup.contact.last_name,
            },
        })
    
    return JsonResponse({
        "events": events,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    })


@csrf_exempt
@require_http_methods(["GET"])
def automation_stats(request):
    """Get automation statistics."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    campaigns = AutomationCampaign.objects.filter(owner=request.user)
    
    stats = {
        "total_campaigns": campaigns.count(),
        "active_campaigns": campaigns.filter(status=AutomationCampaign.ACTIVE).count(),
        "paused_campaigns": campaigns.filter(status=AutomationCampaign.PAUSED).count(),
        "completed_campaigns": campaigns.filter(status=AutomationCampaign.COMPLETED).count(),
        "total_steps": AutomationStep.objects.filter(campaign__owner=request.user).count(),
        "executed_steps": AutomationStep.objects.filter(
            campaign__owner=request.user,
            is_executed=True
        ).count(),
        "pending_followups": ScheduledFollowUp.objects.filter(
            contact__owner=request.user,
            status=ScheduledFollowUp.PENDING
        ).count(),
    }
    
    return JsonResponse(stats)
