"""
Views for Phase 1 features: Tags, Activities, Templates, Tasks, Segments, Bulk Import
"""
import json
import csv
import io
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Count, Q

from contacts.models import (
    Contact,
    Tag,
    ContactTag,
    Activity,
    MessageTemplate,
    Task,
    Segment,
)


# ============== TAG MANAGEMENT ==============

@csrf_exempt
@require_http_methods(["GET", "POST"])
def tags_list(request):
    """List all tags or create a new one."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "GET":
        tags = Tag.objects.filter(owner=request.user).annotate(
            contact_count=Count('contacts')
        )
        
        data = [
            {
                "id": tag.id,
                "name": tag.name,
                "color": tag.color,
                "description": tag.description,
                "contact_count": tag.contact_count,
                "created_at": tag.created_at.isoformat(),
            }
            for tag in tags
        ]
        
        return JsonResponse({"tags": data})
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            tag = Tag.objects.create(
                owner=request.user,
                name=data["name"],
                color=data.get("color", "#3B82F6"),
                description=data.get("description", ""),
            )
            
            return JsonResponse({
                "id": tag.id,
                "name": tag.name,
                "color": tag.color,
                "description": tag.description,
                "contact_count": 0,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def tag_detail(request, tag_id):
    """Update or delete a tag."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        tag = Tag.objects.get(id=tag_id, owner=request.user)
    except Tag.DoesNotExist:
        return JsonResponse({"error": "Tag not found"}, status=404)
    
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            if "name" in data:
                tag.name = data["name"]
            if "color" in data:
                tag.color = data["color"]
            if "description" in data:
                tag.description = data["description"]
            
            tag.save()
            
            return JsonResponse({
                "id": tag.id,
                "name": tag.name,
                "color": tag.color,
                "description": tag.description,
            })
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        tag.delete()
        return JsonResponse({"success": True})


@csrf_exempt
@require_http_methods(["POST", "DELETE"])
def contact_tags(request, contact_id):
    """Add or remove tags from a contact."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        contact = Contact.objects.get(id=contact_id, owner=request.user)
    except Contact.DoesNotExist:
        return JsonResponse({"error": "Contact not found"}, status=404)
    
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            tag_ids = data.get("tag_ids", [])
            
            for tag_id in tag_ids:
                tag = Tag.objects.get(id=tag_id, owner=request.user)
                ContactTag.objects.get_or_create(
                    contact=contact,
                    tag=tag,
                    defaults={"added_by": request.user}
                )
                
                # Log activity
                Activity.objects.create(
                    contact=contact,
                    activity_type=Activity.TAG_ADDED,
                    title=f"Tag added: {tag.name}",
                    created_by=request.user,
                )
            
            # Recalculate lead score
            contact.calculate_lead_score()
            contact.save()
            
            return JsonResponse({"success": True})
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        try:
            data = json.loads(request.body)
            tag_ids = data.get("tag_ids", [])
            
            for tag_id in tag_ids:
                tag = Tag.objects.get(id=tag_id, owner=request.user)
                ContactTag.objects.filter(contact=contact, tag=tag).delete()
                
                # Log activity
                Activity.objects.create(
                    contact=contact,
                    activity_type=Activity.TAG_REMOVED,
                    title=f"Tag removed: {tag.name}",
                    created_by=request.user,
                )
            
            # Recalculate lead score
            contact.calculate_lead_score()
            contact.save()
            
            return JsonResponse({"success": True})
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


# ============== ACTIVITY TIMELINE ==============

@csrf_exempt
@require_http_methods(["GET", "POST"])
def activities_list(request):
    """List activities or create a new one."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "GET":
        contact_id = request.GET.get("contact_id")
        
        if contact_id:
            activities = Activity.objects.filter(contact_id=contact_id, contact__owner=request.user)
        else:
            activities = Activity.objects.filter(contact__owner=request.user)
        
        # Filter by type if provided
        activity_type = request.GET.get("type")
        if activity_type:
            activities = activities.filter(activity_type=activity_type)
        
        # Limit results
        limit = int(request.GET.get("limit", 50))
        activities = activities[:limit]
        
        data = [
            {
                "id": activity.id,
                "contact": {
                    "id": activity.contact.id,
                    "name": f"{activity.contact.first_name} {activity.contact.last_name}",
                    "email": activity.contact.email,
                },
                "activity_type": activity.activity_type,
                "activity_type_display": activity.get_activity_type_display(),
                "title": activity.title,
                "description": activity.description,
                "metadata": activity.metadata,
                "created_at": activity.created_at.isoformat(),
            }
            for activity in activities
        ]
        
        return JsonResponse({"activities": data})
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            contact = Contact.objects.get(id=data["contact_id"], owner=request.user)
            
            activity = Activity.objects.create(
                contact=contact,
                activity_type=data["activity_type"],
                title=data["title"],
                description=data.get("description", ""),
                metadata=data.get("metadata", {}),
                created_by=request.user,
            )
            
            # Update contact's last_contacted_at for certain activity types
            if activity.activity_type in [Activity.EMAIL_SENT, Activity.SMS_SENT, Activity.CALL_MADE]:
                contact.last_contacted_at = timezone.now()
                contact.save()
            
            # Recalculate lead score
            contact.calculate_lead_score()
            contact.save()
            
            return JsonResponse({
                "id": activity.id,
                "activity_type": activity.activity_type,
                "title": activity.title,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


# ============== MESSAGE TEMPLATES ==============

@csrf_exempt
@require_http_methods(["GET", "POST"])
def templates_list(request):
    """List templates or create a new one."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "GET":
        templates = MessageTemplate.objects.filter(owner=request.user)
        
        # Filter by type
        template_type = request.GET.get("type")
        if template_type:
            templates = templates.filter(template_type=template_type)
        
        # Filter by category
        category = request.GET.get("category")
        if category:
            templates = templates.filter(category=category)
        
        # Filter by active status
        is_active = request.GET.get("is_active")
        if is_active is not None:
            templates = templates.filter(is_active=is_active.lower() == "true")
        
        data = [
            {
                "id": template.id,
                "name": template.name,
                "template_type": template.template_type,
                "subject": template.subject,
                "body": template.body,
                "category": template.category,
                "is_active": template.is_active,
                "usage_count": template.usage_count,
                "created_at": template.created_at.isoformat(),
            }
            for template in templates
        ]
        
        return JsonResponse({"templates": data})
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            template = MessageTemplate.objects.create(
                owner=request.user,
                name=data["name"],
                template_type=data["template_type"],
                subject=data.get("subject", ""),
                body=data["body"],
                category=data.get("category", ""),
                is_active=data.get("is_active", True),
            )
            
            return JsonResponse({
                "id": template.id,
                "name": template.name,
                "template_type": template.template_type,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def template_detail(request, template_id):
    """Get, update, or delete a template."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        template = MessageTemplate.objects.get(id=template_id, owner=request.user)
    except MessageTemplate.DoesNotExist:
        return JsonResponse({"error": "Template not found"}, status=404)
    
    if request.method == "GET":
        return JsonResponse({
            "id": template.id,
            "name": template.name,
            "template_type": template.template_type,
            "subject": template.subject,
            "body": template.body,
            "category": template.category,
            "is_active": template.is_active,
            "usage_count": template.usage_count,
            "created_at": template.created_at.isoformat(),
        })
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            if "name" in data:
                template.name = data["name"]
            if "subject" in data:
                template.subject = data["subject"]
            if "body" in data:
                template.body = data["body"]
            if "category" in data:
                template.category = data["category"]
            if "is_active" in data:
                template.is_active = data["is_active"]
            
            template.save()
            
            return JsonResponse({"success": True})
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        template.delete()
        return JsonResponse({"success": True})


# ============== TASK MANAGEMENT ==============

@csrf_exempt
@require_http_methods(["GET", "POST"])
def tasks_list(request):
    """List tasks or create a new one."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "GET":
        tasks = Task.objects.filter(owner=request.user)
        
        # Filter by status
        status = request.GET.get("status")
        if status:
            tasks = tasks.filter(status=status)
        
        # Filter by contact
        contact_id = request.GET.get("contact_id")
        if contact_id:
            tasks = tasks.filter(contact_id=contact_id)
        
        # Filter by priority
        priority = request.GET.get("priority")
        if priority:
            tasks = tasks.filter(priority=priority)
        
        # Filter overdue
        if request.GET.get("overdue") == "true":
            tasks = tasks.filter(
                due_date__lt=timezone.now(),
                status__in=[Task.TODO, Task.IN_PROGRESS]
            )
        
        data = [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "is_overdue": task.is_overdue,
                "contact": {
                    "id": task.contact.id,
                    "name": f"{task.contact.first_name} {task.contact.last_name}",
                    "email": task.contact.email,
                } if task.contact else None,
                "created_at": task.created_at.isoformat(),
            }
            for task in tasks
        ]
        
        return JsonResponse({"tasks": data})
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            contact = None
            if data.get("contact_id"):
                contact = Contact.objects.get(id=data["contact_id"], owner=request.user)
            
            task = Task.objects.create(
                owner=request.user,
                contact=contact,
                title=data["title"],
                description=data.get("description", ""),
                status=data.get("status", Task.TODO),
                priority=data.get("priority", Task.MEDIUM),
                due_date=data.get("due_date"),
                reminder_enabled=data.get("reminder_enabled", False),
                reminder_time=data.get("reminder_time"),
            )
            
            return JsonResponse({
                "id": task.id,
                "title": task.title,
                "status": task.status,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def task_detail(request, task_id):
    """Update or delete a task."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        task = Task.objects.get(id=task_id, owner=request.user)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)
    
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            if "title" in data:
                task.title = data["title"]
            if "description" in data:
                task.description = data["description"]
            if "status" in data:
                old_status = task.status
                task.status = data["status"]
                
                # Mark completed if status changed to completed
                if task.status == Task.COMPLETED and old_status != Task.COMPLETED:
                    task.completed_at = timezone.now()
                    
                    # Log activity if task is associated with contact
                    if task.contact:
                        Activity.objects.create(
                            contact=task.contact,
                            activity_type=Activity.TASK_COMPLETED,
                            title=f"Task completed: {task.title}",
                            created_by=request.user,
                        )
            
            if "priority" in data:
                task.priority = data["priority"]
            if "due_date" in data:
                task.due_date = data["due_date"]
            if "reminder_enabled" in data:
                task.reminder_enabled = data["reminder_enabled"]
            if "reminder_time" in data:
                task.reminder_time = data["reminder_time"]
            
            task.save()
            
            return JsonResponse({"success": True})
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        task.delete()
        return JsonResponse({"success": True})


# ============== SEGMENTS ==============

@csrf_exempt
@require_http_methods(["GET", "POST"])
def segments_list(request):
    """List segments or create a new one."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "GET":
        segments = Segment.objects.filter(owner=request.user)
        
        data = [
            {
                "id": segment.id,
                "name": segment.name,
                "description": segment.description,
                "criteria": segment.criteria,
                "contact_count": segment.contact_count,
                "is_active": segment.is_active,
                "created_at": segment.created_at.isoformat(),
            }
            for segment in segments
        ]
        
        return JsonResponse({"segments": data})
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            segment = Segment.objects.create(
                owner=request.user,
                name=data["name"],
                description=data.get("description", ""),
                criteria=data.get("criteria", {}),
                is_active=data.get("is_active", True),
            )
            
            return JsonResponse({
                "id": segment.id,
                "name": segment.name,
                "contact_count": segment.contact_count,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def segment_detail(request, segment_id):
    """Get, update, or delete a segment."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        segment = Segment.objects.get(id=segment_id, owner=request.user)
    except Segment.DoesNotExist:
        return JsonResponse({"error": "Segment not found"}, status=404)
    
    if request.method == "GET":
        contacts = segment.get_contacts()[:100]  # Limit to 100 for preview
        
        contact_data = [
            {
                "id": contact.id,
                "first_name": contact.first_name,
                "last_name": contact.last_name,
                "email": contact.email,
                "status": contact.status,
                "lead_score": contact.lead_score,
            }
            for contact in contacts
        ]
        
        return JsonResponse({
            "id": segment.id,
            "name": segment.name,
            "description": segment.description,
            "criteria": segment.criteria,
            "contact_count": segment.contact_count,
            "is_active": segment.is_active,
            "contacts": contact_data,
        })
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            if "name" in data:
                segment.name = data["name"]
            if "description" in data:
                segment.description = data["description"]
            if "criteria" in data:
                segment.criteria = data["criteria"]
            if "is_active" in data:
                segment.is_active = data["is_active"]
            
            segment.save()
            
            return JsonResponse({"success": True})
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        segment.delete()
        return JsonResponse({"success": True})


# ============== BULK IMPORT ==============

@csrf_exempt
@require_http_methods(["POST"])
def bulk_import_contacts(request):
    """Import contacts from CSV file."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        if 'file' not in request.FILES:
            return JsonResponse({"error": "No file provided"}, status=400)
        
        csv_file = request.FILES['file']
        
        # Read CSV
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        created_count = 0
        updated_count = 0
        error_count = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 for header
            try:
                email = row.get('email', '').strip()
                if not email:
                    errors.append(f"Row {row_num}: Missing email")
                    error_count += 1
                    continue
                
                # Check if contact exists
                contact, created = Contact.objects.get_or_create(
                    owner=request.user,
                    email=email,
                    defaults={
                        'first_name': row.get('first_name', '').strip(),
                        'last_name': row.get('last_name', '').strip(),
                        'company': row.get('company', '').strip(),
                        'status': row.get('status', Contact.LEAD),
                        'source': row.get('source', 'bulk_import'),
                        'notes': row.get('notes', '').strip(),
                    }
                )
                
                if created:
                    created_count += 1
                    
                    # Log activity
                    Activity.objects.create(
                        contact=contact,
                        activity_type=Activity.FORM_SUBMITTED,
                        title="Contact imported via CSV",
                        created_by=request.user,
                    )
                else:
                    # Update existing contact
                    if row.get('first_name'):
                        contact.first_name = row['first_name'].strip()
                    if row.get('last_name'):
                        contact.last_name = row['last_name'].strip()
                    if row.get('company'):
                        contact.company = row['company'].strip()
                    if row.get('status'):
                        contact.status = row['status']
                    
                    contact.save()
                    updated_count += 1
                
                # Handle tags if provided
                if row.get('tags'):
                    tag_names = [t.strip() for t in row['tags'].split(',')]
                    for tag_name in tag_names:
                        if tag_name:
                            tag, _ = Tag.objects.get_or_create(
                                owner=request.user,
                                name=tag_name,
                                defaults={'color': '#3B82F6'}
                            )
                            ContactTag.objects.get_or_create(
                                contact=contact,
                                tag=tag,
                                defaults={'added_by': request.user}
                            )
                
                # Calculate lead score
                contact.calculate_lead_score()
                contact.save()
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                error_count += 1
        
        return JsonResponse({
            "success": True,
            "created": created_count,
            "updated": updated_count,
            "errors": error_count,
            "error_details": errors[:10],  # Limit to first 10 errors
        })
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@require_http_methods(["GET"])
def export_template_csv(request):
    """Download a CSV template for bulk import."""
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="import_template.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['email', 'first_name', 'last_name', 'company', 'status', 'source', 'tags', 'notes'])
    writer.writerow(['john@example.com', 'John', 'Doe', 'Acme Inc', 'lead', 'website', 'vip,newsletter', 'Sample contact'])
    
    return response
