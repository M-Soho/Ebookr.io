"""
Advanced search functionality for contacts, tasks, and activities.
"""

import json
import logging
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.db.models import Q
from contacts.models import Contact, Task, Activity, Tag

logger = logging.getLogger(__name__)
User = get_user_model()


@require_http_methods(["GET"])
def global_search(request):
    """
    GET /api/search/
    Global search across contacts, tasks, and activities.
    
    Query params:
    - q: Search query
    - types: Comma-separated list of types to search (contacts,tasks,activities)
    - limit: Results per type (default 10)
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        query = request.GET.get('q', '').strip()
        if not query:
            return JsonResponse({'error': 'Query parameter "q" required'}, status=400)
        
        types = request.GET.get('types', 'contacts,tasks,activities').split(',')
        limit = int(request.GET.get('limit', 10))
        
        results = {}
        
        # Search contacts
        if 'contacts' in types:
            contacts = Contact.objects.filter(owner=user).filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(company__icontains=query) |
                Q(notes__icontains=query)
            )[:limit]
            
            results['contacts'] = [{
                'id': c.id,
                'type': 'contact',
                'title': f"{c.first_name} {c.last_name}".strip() or c.email,
                'subtitle': c.company or c.email,
                'link': f'/contacts/{c.id}',
                'email': c.email,
                'status': c.status
            } for c in contacts]
        
        # Search tasks
        if 'tasks' in types:
            tasks = Task.objects.filter(owner=user).filter(
                Q(title__icontains=query) |
                Q(description__icontains=query)
            )[:limit]
            
            results['tasks'] = [{
                'id': t.id,
                'type': 'task',
                'title': t.title,
                'subtitle': t.description[:100] if t.description else '',
                'link': f'/tasks/{t.id}',
                'status': t.status,
                'priority': t.priority,
                'due_date': t.due_date.isoformat() if t.due_date else None
            } for t in tasks]
        
        # Search activities
        if 'activities' in types:
            activities = Activity.objects.filter(contact__owner=user).filter(
                Q(title__icontains=query) |
                Q(description__icontains=query)
            )[:limit]
            
            results['activities'] = [{
                'id': a.id,
                'type': 'activity',
                'title': a.title,
                'subtitle': a.description[:100] if a.description else '',
                'link': f'/contacts/{a.contact.id}#activity-{a.id}',
                'activity_type': a.activity_type,
                'contact_name': str(a.contact),
                'created_at': a.created_at.isoformat()
            } for a in activities]
        
        total_results = sum(len(v) for v in results.values())
        
        return JsonResponse({
            'query': query,
            'total_results': total_results,
            'results': results
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error in global search: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def advanced_contact_search(request):
    """
    GET /api/contacts/search/
    Advanced search for contacts with multiple filters.
    
    Query params:
    - q: Text search
    - status: Contact status
    - tags: Comma-separated tag IDs
    - cadence: Contact cadence
    - lead_score_min: Minimum lead score
    - lead_score_max: Maximum lead score
    - source: Contact source
    - created_after: ISO date string
    - created_before: ISO date string
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        contacts = Contact.objects.filter(owner=user)
        
        # Text search
        q = request.GET.get('q', '').strip()
        if q:
            contacts = contacts.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(email__icontains=q) |
                Q(company__icontains=q) |
                Q(notes__icontains=q)
            )
        
        # Status filter
        status = request.GET.get('status')
        if status:
            contacts = contacts.filter(status=status)
        
        # Tags filter
        tags_param = request.GET.get('tags')
        if tags_param:
            tag_ids = [int(t) for t in tags_param.split(',') if t]
            contacts = contacts.filter(tags__id__in=tag_ids).distinct()
        
        # Cadence filter
        cadence = request.GET.get('cadence')
        if cadence:
            contacts = contacts.filter(contact_cadence=cadence)
        
        # Lead score filter
        lead_score_min = request.GET.get('lead_score_min')
        if lead_score_min:
            contacts = contacts.filter(lead_score__gte=int(lead_score_min))
        
        lead_score_max = request.GET.get('lead_score_max')
        if lead_score_max:
            contacts = contacts.filter(lead_score__lte=int(lead_score_max))
        
        # Source filter
        source = request.GET.get('source')
        if source:
            contacts = contacts.filter(source__icontains=source)
        
        # Date filters
        created_after = request.GET.get('created_after')
        if created_after:
            from django.utils.dateparse import parse_datetime
            contacts = contacts.filter(created_at__gte=parse_datetime(created_after))
        
        created_before = request.GET.get('created_before')
        if created_before:
            from django.utils.dateparse import parse_datetime
            contacts = contacts.filter(created_at__lte=parse_datetime(created_before))
        
        # Order by
        order_by = request.GET.get('order_by', '-updated_at')
        contacts = contacts.order_by(order_by)
        
        # Pagination
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        total_count = contacts.count()
        contacts = contacts[offset:offset + limit]
        
        data = [{
            'id': c.id,
            'first_name': c.first_name,
            'last_name': c.last_name,
            'email': c.email,
            'company': c.company,
            'status': c.status,
            'contact_cadence': c.contact_cadence,
            'lead_score': c.lead_score,
            'source': c.source,
            'created_at': c.created_at.isoformat(),
            'updated_at': c.updated_at.isoformat(),
        } for c in contacts]
        
        return JsonResponse({
            'data': data,
            'total': total_count,
            'limit': limit,
            'offset': offset
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error in advanced contact search: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def advanced_task_search(request):
    """
    GET /api/tasks/search/
    Advanced search for tasks with multiple filters.
    
    Query params:
    - q: Text search
    - status: Task status
    - priority: Task priority
    - contact_id: Filter by contact
    - overdue: true/false
    - due_after: ISO date string
    - due_before: ISO date string
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        tasks = Task.objects.filter(owner=user)
        
        # Text search
        q = request.GET.get('q', '').strip()
        if q:
            tasks = tasks.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q)
            )
        
        # Status filter
        status = request.GET.get('status')
        if status:
            tasks = tasks.filter(status=status)
        
        # Priority filter
        priority = request.GET.get('priority')
        if priority:
            tasks = tasks.filter(priority=priority)
        
        # Contact filter
        contact_id = request.GET.get('contact_id')
        if contact_id:
            tasks = tasks.filter(contact_id=int(contact_id))
        
        # Overdue filter
        overdue = request.GET.get('overdue', '').lower()
        if overdue == 'true':
            from django.utils import timezone
            tasks = tasks.filter(
                due_date__lt=timezone.now(),
                status__in=[Task.TODO, Task.IN_PROGRESS]
            )
        
        # Date filters
        due_after = request.GET.get('due_after')
        if due_after:
            from django.utils.dateparse import parse_datetime
            tasks = tasks.filter(due_date__gte=parse_datetime(due_after))
        
        due_before = request.GET.get('due_before')
        if due_before:
            from django.utils.dateparse import parse_datetime
            tasks = tasks.filter(due_date__lte=parse_datetime(due_before))
        
        # Order by
        order_by = request.GET.get('order_by', 'due_date')
        tasks = tasks.order_by(order_by)
        
        # Pagination
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        total_count = tasks.count()
        tasks = tasks[offset:offset + limit]
        
        data = [{
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'status': t.status,
            'priority': t.priority,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'contact_id': t.contact_id,
            'created_at': t.created_at.isoformat(),
        } for t in tasks]
        
        return JsonResponse({
            'data': data,
            'total': total_count,
            'limit': limit,
            'offset': offset
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error in advanced task search: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
