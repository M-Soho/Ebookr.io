"""
Bulk operations API for contacts and tasks.
"""

import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.db import transaction
from contacts.models import Contact, Task, Tag, ContactTag, Activity

logger = logging.getLogger(__name__)
User = get_user_model()


@csrf_exempt
@require_http_methods(["POST"])
def bulk_delete_contacts(request):
    """
    POST /api/contacts/bulk-delete/
    Delete multiple contacts.
    
    Body:
    {
        "contact_ids": [1, 2, 3]
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        contact_ids = data.get('contact_ids', [])
        
        if not contact_ids:
            return JsonResponse({'error': 'contact_ids required'}, status=400)
        
        # Only delete contacts owned by user
        deleted_count, _ = Contact.objects.filter(
            id__in=contact_ids,
            owner=user
        ).delete()
        
        logger.info(f"Bulk deleted {deleted_count} contacts for user {user.id}")
        
        return JsonResponse({
            'status': 'success',
            'deleted': deleted_count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error bulk deleting contacts: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def bulk_update_status(request):
    """
    POST /api/contacts/bulk-update-status/
    Update status for multiple contacts.
    
    Body:
    {
        "contact_ids": [1, 2, 3],
        "status": "active"
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        contact_ids = data.get('contact_ids', [])
        new_status = data.get('status')
        
        if not contact_ids or not new_status:
            return JsonResponse({'error': 'contact_ids and status required'}, status=400)
        
        # Validate status
        valid_statuses = dict(Contact.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return JsonResponse({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}, status=400)
        
        # Update contacts
        contacts = Contact.objects.filter(id__in=contact_ids, owner=user)
        updated_count = contacts.count()
        
        with transaction.atomic():
            contacts.update(status=new_status)
            
            # Log activities
            for contact in contacts:
                Activity.objects.create(
                    contact=contact,
                    activity_type=Activity.STATUS_CHANGED,
                    title=f"Status changed to {new_status}",
                    description=f"Bulk update by {user.username}",
                    created_by=user
                )
        
        logger.info(f"Bulk updated {updated_count} contacts to status={new_status}")
        
        return JsonResponse({
            'status': 'success',
            'updated': updated_count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error bulk updating status: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def bulk_add_tags(request):
    """
    POST /api/contacts/bulk-add-tags/
    Add tags to multiple contacts.
    
    Body:
    {
        "contact_ids": [1, 2, 3],
        "tag_ids": [5, 6]
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        contact_ids = data.get('contact_ids', [])
        tag_ids = data.get('tag_ids', [])
        
        if not contact_ids or not tag_ids:
            return JsonResponse({'error': 'contact_ids and tag_ids required'}, status=400)
        
        contacts = Contact.objects.filter(id__in=contact_ids, owner=user)
        tags = Tag.objects.filter(id__in=tag_ids, owner=user)
        
        added_count = 0
        with transaction.atomic():
            for contact in contacts:
                for tag in tags:
                    _, created = ContactTag.objects.get_or_create(
                        contact=contact,
                        tag=tag,
                        defaults={'added_by': user}
                    )
                    if created:
                        added_count += 1
                        
                        # Log activity
                        Activity.objects.create(
                            contact=contact,
                            activity_type=Activity.TAG_ADDED,
                            title=f"Tag added: {tag.name}",
                            description=f"Bulk tag operation",
                            created_by=user
                        )
        
        logger.info(f"Bulk added {added_count} contact-tag relationships")
        
        return JsonResponse({
            'status': 'success',
            'added': added_count,
            'contacts_affected': contacts.count(),
            'tags_added': tags.count()
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error bulk adding tags: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def bulk_remove_tags(request):
    """
    POST /api/contacts/bulk-remove-tags/
    Remove tags from multiple contacts.
    
    Body:
    {
        "contact_ids": [1, 2, 3],
        "tag_ids": [5, 6]
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        contact_ids = data.get('contact_ids', [])
        tag_ids = data.get('tag_ids', [])
        
        if not contact_ids or not tag_ids:
            return JsonResponse({'error': 'contact_ids and tag_ids required'}, status=400)
        
        # Verify ownership
        contacts = Contact.objects.filter(id__in=contact_ids, owner=user)
        tags = Tag.objects.filter(id__in=tag_ids, owner=user)
        
        removed_count, _ = ContactTag.objects.filter(
            contact__in=contacts,
            tag__in=tags
        ).delete()
        
        logger.info(f"Bulk removed {removed_count} contact-tag relationships")
        
        return JsonResponse({
            'status': 'success',
            'removed': removed_count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error bulk removing tags: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def bulk_delete_tasks(request):
    """
    POST /api/tasks/bulk-delete/
    Delete multiple tasks.
    
    Body:
    {
        "task_ids": [1, 2, 3]
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        task_ids = data.get('task_ids', [])
        
        if not task_ids:
            return JsonResponse({'error': 'task_ids required'}, status=400)
        
        # Only delete tasks owned by user
        deleted_count, _ = Task.objects.filter(
            id__in=task_ids,
            owner=user
        ).delete()
        
        logger.info(f"Bulk deleted {deleted_count} tasks for user {user.id}")
        
        return JsonResponse({
            'status': 'success',
            'deleted': deleted_count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error bulk deleting tasks: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def bulk_complete_tasks(request):
    """
    POST /api/tasks/bulk-complete/
    Mark multiple tasks as completed.
    
    Body:
    {
        "task_ids": [1, 2, 3]
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        task_ids = data.get('task_ids', [])
        
        if not task_ids:
            return JsonResponse({'error': 'task_ids required'}, status=400)
        
        from django.utils import timezone
        
        # Update tasks
        tasks = Task.objects.filter(id__in=task_ids, owner=user)
        updated_count = tasks.update(
            status=Task.COMPLETED,
            completed_at=timezone.now()
        )
        
        # Log activities for tasks with contacts
        with transaction.atomic():
            for task in tasks.filter(contact__isnull=False):
                Activity.objects.create(
                    contact=task.contact,
                    activity_type=Activity.TASK_COMPLETED,
                    title=f"Task completed: {task.title}",
                    description=f"Bulk completion",
                    created_by=user
                )
        
        logger.info(f"Bulk completed {updated_count} tasks")
        
        return JsonResponse({
            'status': 'success',
            'updated': updated_count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error bulk completing tasks: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def bulk_update_contact_cadence(request):
    """
    POST /api/contacts/bulk-update-cadence/
    Update contact cadence for multiple contacts.
    
    Body:
    {
        "contact_ids": [1, 2, 3],
        "cadence": "weekly"
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        contact_ids = data.get('contact_ids', [])
        cadence = data.get('cadence')
        
        if not contact_ids or not cadence:
            return JsonResponse({'error': 'contact_ids and cadence required'}, status=400)
        
        # Validate cadence
        valid_cadences = dict(Contact.CADENCE_CHOICES).keys()
        if cadence not in valid_cadences:
            return JsonResponse({'error': f'Invalid cadence. Must be one of: {", ".join(valid_cadences)}'}, status=400)
        
        # Update contacts
        updated_count = Contact.objects.filter(
            id__in=contact_ids,
            owner=user
        ).update(contact_cadence=cadence)
        
        logger.info(f"Bulk updated {updated_count} contacts to cadence={cadence}")
        
        return JsonResponse({
            'status': 'success',
            'updated': updated_count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error bulk updating cadence: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
