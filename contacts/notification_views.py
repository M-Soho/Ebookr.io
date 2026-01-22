"""
API views for notifications.
"""

import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from contacts.notification_models import Notification, NotificationPreference
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()


@require_http_methods(["GET"])
def notifications_list(request):
    """
    GET /api/notifications/
    Get all notifications for the user.
    Query params:
    - unread_only=true: Only show unread notifications
    - limit=20: Limit results
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        unread_only = request.GET.get('unread_only', '').lower() == 'true'
        limit = int(request.GET.get('limit', 50))
        
        notifications = Notification.objects.filter(user=user)
        
        if unread_only:
            notifications = notifications.filter(is_read=False)
        
        notifications = notifications[:limit]
        
        data = [{
            'id': n.id,
            'type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'link_url': n.link_url,
            'is_read': n.is_read,
            'read_at': n.read_at.isoformat() if n.read_at else None,
            'created_at': n.created_at.isoformat(),
            'metadata': n.metadata
        } for n in notifications]
        
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        
        return JsonResponse({
            'data': data,
            'unread_count': unread_count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def mark_notification_read(request, notification_id):
    """
    POST /api/notifications/<id>/mark-read/
    Mark a notification as read.
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        notification = Notification.objects.get(id=notification_id, user=user)
        notification.mark_as_read()
        
        return JsonResponse({
            'status': 'success',
            'notification': {
                'id': notification.id,
                'is_read': notification.is_read,
                'read_at': notification.read_at.isoformat()
            }
        })
    
    except Notification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def mark_all_read(request):
    """
    POST /api/notifications/mark-all-read/
    Mark all notifications as read for the user.
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        count = Notification.objects.filter(user=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return JsonResponse({
            'status': 'success',
            'marked_read': count
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_notification(request, notification_id):
    """
    DELETE /api/notifications/<id>/
    Delete a notification.
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        notification = Notification.objects.get(id=notification_id, user=user)
        notification.delete()
        
        return JsonResponse({'status': 'success', 'message': 'Notification deleted'})
    
    except Notification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def notification_preferences(request):
    """
    GET /api/notifications/preferences/
    Get user's notification preferences.
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        prefs, created = NotificationPreference.objects.get_or_create(user=user)
        
        return JsonResponse({
            'in_app_task_reminders': prefs.in_app_task_reminders,
            'in_app_task_overdue': prefs.in_app_task_overdue,
            'in_app_task_assigned': prefs.in_app_task_assigned,
            'in_app_contact_activity': prefs.in_app_contact_activity,
            'in_app_workflow_completed': prefs.in_app_workflow_completed,
            'in_app_system': prefs.in_app_system,
            'email_task_reminders': prefs.email_task_reminders,
            'email_task_overdue': prefs.email_task_overdue,
            'email_task_assigned': prefs.email_task_assigned,
            'email_daily_digest': prefs.email_daily_digest,
            'email_weekly_digest': prefs.email_weekly_digest,
            'daily_digest_time': prefs.daily_digest_time.isoformat(),
            'weekly_digest_day': prefs.weekly_digest_day,
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching notification preferences: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_notification_preferences(request):
    """
    PUT /api/notifications/preferences/
    Update user's notification preferences.
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        prefs, created = NotificationPreference.objects.get_or_create(user=user)
        
        # Update fields if provided
        for field in [
            'in_app_task_reminders', 'in_app_task_overdue', 'in_app_task_assigned',
            'in_app_contact_activity', 'in_app_workflow_completed', 'in_app_system',
            'email_task_reminders', 'email_task_overdue', 'email_task_assigned',
            'email_daily_digest', 'email_weekly_digest', 'weekly_digest_day'
        ]:
            if field in data:
                setattr(prefs, field, data[field])
        
        if 'daily_digest_time' in data:
            from datetime import datetime
            prefs.daily_digest_time = datetime.fromisoformat(data['daily_digest_time']).time()
        
        prefs.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Preferences updated'
        })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error updating notification preferences: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


def create_notification(user, notification_type, title, message, link_url='', metadata=None):
    """
    Helper function to create notifications.
    Can be used by other parts of the system.
    """
    try:
        # Check user preferences
        prefs, created = NotificationPreference.objects.get_or_create(user=user)
        
        # Map notification types to preference fields
        pref_map = {
            Notification.TASK_REMINDER: prefs.in_app_task_reminders,
            Notification.TASK_OVERDUE: prefs.in_app_task_overdue,
            Notification.TASK_ASSIGNED: prefs.in_app_task_assigned,
            Notification.CONTACT_ACTIVITY: prefs.in_app_contact_activity,
            Notification.WORKFLOW_COMPLETED: prefs.in_app_workflow_completed,
            Notification.SYSTEM: prefs.in_app_system,
        }
        
        # Only create if user has this notification type enabled
        if pref_map.get(notification_type, True):
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                link_url=link_url,
                metadata=metadata or {}
            )
            logger.info(f"Created notification for {user}: {title}")
            return notification
        else:
            logger.debug(f"Skipped notification for {user}: {title} (disabled in preferences)")
            return None
    
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        return None
