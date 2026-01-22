"""
API Views for Task Automation Framework
"""

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db import models

from automation.models import TaskAutomationRule, ScheduledTaskBatch
from automation.task_scheduler import TaskScheduler
from contacts.models import Contact


@csrf_exempt
@require_http_methods(["GET", "POST"])
def automation_rules_list(request):
    """List or create task automation rules"""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "GET":
        rules = TaskAutomationRule.objects.filter(owner=request.user)
        
        trigger_type = request.GET.get("trigger_type")
        if trigger_type:
            rules = rules.filter(trigger_type=trigger_type)
        
        active_only = request.GET.get("active_only") == "true"
        if active_only:
            rules = rules.filter(is_active=True)
        
        data = [
            {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "trigger_type": rule.trigger_type,
                "trigger_config": rule.trigger_config,
                "task_title_template": rule.task_title_template,
                "task_description_template": rule.task_description_template,
                "task_priority": rule.task_priority,
                "delay_hours": rule.delay_hours,
                "reminder_offset_hours": rule.reminder_offset_hours,
                "is_active": rule.is_active,
                "times_triggered": rule.times_triggered,
                "tasks_created": rule.tasks_created,
                "created_at": rule.created_at.isoformat(),
            }
            for rule in rules
        ]
        
        return JsonResponse({"rules": data})
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            rule = TaskAutomationRule.objects.create(
                owner=request.user,
                name=data["name"],
                description=data.get("description", ""),
                trigger_type=data["trigger_type"],
                trigger_config=data.get("trigger_config", {}),
                task_title_template=data["task_title_template"],
                task_description_template=data.get("task_description_template", ""),
                task_priority=data.get("task_priority", "medium"),
                delay_hours=data.get("delay_hours", 24),
                reminder_offset_hours=data.get("reminder_offset_hours", 1),
                is_active=data.get("is_active", True),
            )
            
            return JsonResponse({
                "id": rule.id,
                "name": rule.name,
                "trigger_type": rule.trigger_type,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def automation_rule_detail(request, rule_id):
    """Get, update, or delete an automation rule"""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        rule = TaskAutomationRule.objects.get(id=rule_id, owner=request.user)
    except TaskAutomationRule.DoesNotExist:
        return JsonResponse({"error": "Rule not found"}, status=404)
    
    if request.method == "GET":
        return JsonResponse({
            "id": rule.id,
            "name": rule.name,
            "description": rule.description,
            "trigger_type": rule.trigger_type,
            "trigger_config": rule.trigger_config,
            "task_title_template": rule.task_title_template,
            "task_description_template": rule.task_description_template,
            "task_priority": rule.task_priority,
            "delay_hours": rule.delay_hours,
            "reminder_offset_hours": rule.reminder_offset_hours,
            "is_active": rule.is_active,
            "times_triggered": rule.times_triggered,
            "tasks_created": rule.tasks_created,
            "created_at": rule.created_at.isoformat(),
            "updated_at": rule.updated_at.isoformat(),
        })
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            if "name" in data:
                rule.name = data["name"]
            if "description" in data:
                rule.description = data["description"]
            if "trigger_type" in data:
                rule.trigger_type = data["trigger_type"]
            if "trigger_config" in data:
                rule.trigger_config = data["trigger_config"]
            if "task_title_template" in data:
                rule.task_title_template = data["task_title_template"]
            if "task_description_template" in data:
                rule.task_description_template = data["task_description_template"]
            if "task_priority" in data:
                rule.task_priority = data["task_priority"]
            if "delay_hours" in data:
                rule.delay_hours = data["delay_hours"]
            if "reminder_offset_hours" in data:
                rule.reminder_offset_hours = data["reminder_offset_hours"]
            if "is_active" in data:
                rule.is_active = data["is_active"]
            
            rule.save()
            
            return JsonResponse({
                "id": rule.id,
                "name": rule.name,
                "is_active": rule.is_active,
            })
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        rule.delete()
        return JsonResponse({"message": "Rule deleted successfully"})


@csrf_exempt
@require_http_methods(["POST"])
def schedule_follow_up_sequence(request):
    """Manually trigger a follow-up sequence for a contact"""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        data = json.loads(request.body)
        contact_id = data["contact_id"]
        sequence_type = data.get("sequence_type", "standard")
        start_delay_hours = data.get("start_delay_hours", 24)
        
        contact = Contact.objects.get(id=contact_id, owner=request.user)
        scheduler = TaskScheduler(owner=request.user)
        
        tasks = scheduler.schedule_follow_up_sequence(
            contact=contact,
            sequence_type=sequence_type,
            start_delay_hours=start_delay_hours
        )
        
        # Create batch record
        batch = ScheduledTaskBatch.objects.create(
            owner=request.user,
            batch_name=f"{sequence_type.title()} follow-up sequence for {contact.first_name} {contact.last_name}",
            batch_type="follow_up_sequence",
            contact=contact,
            tasks_count=len(tasks)
        )
        
        return JsonResponse({
            "tasks_created": len(tasks),
            "batch_id": batch.id,
            "sequence_type": sequence_type,
            "contact": {
                "id": contact.id,
                "name": f"{contact.first_name} {contact.last_name}",
                "email": contact.email,
            }
        }, status=201)
    
    except Contact.DoesNotExist:
        return JsonResponse({"error": "Contact not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def schedule_recurring_tasks(request):
    """Create recurring tasks for a contact based on cadence"""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        data = json.loads(request.body)
        contact_id = data["contact_id"]
        cadence = data.get("cadence", Contact.CADENCE_WEEKLY)
        task_template = data.get("task_template", {})
        
        contact = Contact.objects.get(id=contact_id, owner=request.user)
        scheduler = TaskScheduler(owner=request.user)
        
        tasks = scheduler.schedule_recurring_tasks(
            contact=contact,
            cadence=cadence,
            task_template=task_template
        )
        
        # Update contact cadence if provided
        if cadence:
            contact.contact_cadence = cadence
            contact.save(update_fields=["contact_cadence"])
        
        return JsonResponse({
            "tasks_created": len(tasks),
            "cadence": cadence,
            "contact": {
                "id": contact.id,
                "name": f"{contact.first_name} {contact.last_name}",
            }
        }, status=201)
    
    except Contact.DoesNotExist:
        return JsonResponse({"error": "Contact not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def task_batches_list(request):
    """List task batches for the current user"""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    batches = ScheduledTaskBatch.objects.filter(owner=request.user)
    
    # Filter by contact
    contact_id = request.GET.get("contact_id")
    if contact_id:
        batches = batches.filter(contact_id=contact_id)
    
    # Filter by batch type
    batch_type = request.GET.get("batch_type")
    if batch_type:
        batches = batches.filter(batch_type=batch_type)
    
    data = [
        {
            "id": batch.id,
            "batch_name": batch.batch_name,
            "batch_type": batch.batch_type,
            "tasks_count": batch.tasks_count,
            "tasks_completed": batch.tasks_completed,
            "is_completed": batch.is_completed,
            "contact": {
                "id": batch.contact.id,
                "name": f"{batch.contact.first_name} {batch.contact.last_name}",
                "email": batch.contact.email,
            } if batch.contact else None,
            "created_at": batch.created_at.isoformat(),
            "completed_at": batch.completed_at.isoformat() if batch.completed_at else None,
        }
        for batch in batches
    ]
    
    return JsonResponse({"batches": data})


@csrf_exempt
@require_http_methods(["GET"])
def automation_stats(request):
    """Get automation statistics for the current user"""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    # Total automation rules
    total_rules = TaskAutomationRule.objects.filter(owner=request.user).count()
    active_rules = TaskAutomationRule.objects.filter(
        owner=request.user,
        is_active=True
    ).count()
    
    # Total tasks created by automation
    total_tasks_created = TaskAutomationRule.objects.filter(
        owner=request.user
    ).aggregate(
        total=models.Sum("tasks_created")
    )["total"] or 0
    
    # Recent batches
    recent_batches_count = ScheduledTaskBatch.objects.filter(
        owner=request.user,
        created_at__gte=timezone.now() - timezone.timedelta(days=30)
    ).count()
    
    # Rules by trigger type
    rules_by_trigger = {}
    for trigger_type, _ in TaskAutomationRule.TRIGGER_TYPE_CHOICES:
        count = TaskAutomationRule.objects.filter(
            owner=request.user,
            trigger_type=trigger_type
        ).count()
        if count > 0:
            rules_by_trigger[trigger_type] = count
    
    return JsonResponse({
        "total_rules": total_rules,
        "active_rules": active_rules,
        "inactive_rules": total_rules - active_rules,
        "total_tasks_created": total_tasks_created,
        "recent_batches_30days": recent_batches_count,
        "rules_by_trigger_type": rules_by_trigger,
    })
