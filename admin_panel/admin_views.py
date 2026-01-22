"""
Admin Panel Views for System Management
Provides comprehensive admin tools for monitoring and managing Ebookr.io
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
import psutil
import redis
from celery import current_app
from celery.result import AsyncResult
import logging
import os
import sys

from contacts.models import Contact, Task, Activity
from contacts.notification_models import Notification
from billing.models import Subscription
from automation.models import Workflow

User = get_user_model()
logger = logging.getLogger(__name__)


# ============================================
# SYSTEM HEALTH MONITORING
# ============================================

@require_http_methods(["GET"])
def system_health(request):
    """
    Comprehensive system health check
    Returns status of all critical services
    """
    health_status = {
        "timestamp": timezone.now().isoformat(),
        "overall_status": "healthy",
        "services": {}
    }
    
    # 1. Database Health
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status["services"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["overall_status"] = "unhealthy"
    
    # 2. Redis Health
    try:
        r = redis.Redis(host='localhost', port=6379, db=0, socket_connect_timeout=2)
        r.ping()
        health_status["services"]["redis"] = {
            "status": "healthy",
            "message": "Redis connection successful"
        }
    except Exception as e:
        health_status["services"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["overall_status"] = "degraded"
    
    # 3. Celery Worker Health
    try:
        inspector = current_app.control.inspect()
        active_workers = inspector.active()
        if active_workers:
            health_status["services"]["celery_worker"] = {
                "status": "healthy",
                "workers": len(active_workers),
                "worker_names": list(active_workers.keys())
            }
        else:
            health_status["services"]["celery_worker"] = {
                "status": "unhealthy",
                "message": "No active Celery workers"
            }
            health_status["overall_status"] = "degraded"
    except Exception as e:
        health_status["services"]["celery_worker"] = {
            "status": "unknown",
            "error": str(e)
        }
    
    # 4. Celery Beat Health
    try:
        inspector = current_app.control.inspect()
        scheduled = inspector.scheduled()
        if scheduled:
            health_status["services"]["celery_beat"] = {
                "status": "healthy",
                "scheduled_tasks": sum(len(tasks) for tasks in scheduled.values())
            }
        else:
            health_status["services"]["celery_beat"] = {
                "status": "unknown",
                "message": "No scheduled tasks found"
            }
    except Exception as e:
        health_status["services"]["celery_beat"] = {
            "status": "unknown",
            "error": str(e)
        }
    
    # 5. Email Service Health (check settings)
    email_backend = getattr(sys.modules['django.conf'].settings, 'EMAIL_BACKEND', None)
    if email_backend and 'console' not in email_backend.lower():
        health_status["services"]["email"] = {
            "status": "configured",
            "backend": email_backend
        }
    else:
        health_status["services"]["email"] = {
            "status": "not_configured",
            "message": "Email backend not configured for production"
        }
    
    return JsonResponse(health_status)


@require_http_methods(["GET"])
def system_metrics(request):
    """
    Get system resource metrics (CPU, memory, disk)
    """
    try:
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # Memory metrics
        memory = psutil.virtual_memory()
        
        # Disk metrics
        disk = psutil.disk_usage('/')
        
        # Process info (Django process)
        process = psutil.Process(os.getpid())
        
        metrics = {
            "cpu": {
                "percent": cpu_percent,
                "count": cpu_count,
                "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "percent": memory.percent,
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2)
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent,
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2)
            },
            "process": {
                "cpu_percent": process.cpu_percent(),
                "memory_mb": round(process.memory_info().rss / (1024**2), 2),
                "num_threads": process.num_threads()
            }
        }
        
        return JsonResponse({"success": True, "metrics": metrics})
    except Exception as e:
        logger.error(f"Error getting system metrics: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# USER MANAGEMENT
# ============================================

@require_http_methods(["GET"])
def list_users(request):
    """
    List all users with statistics
    """
    try:
        users = User.objects.all().order_by('-date_joined')
        
        user_data = []
        for user in users:
            # Get user stats
            contact_count = Contact.objects.filter(owner=user).count()
            task_count = Task.objects.filter(contact__owner=user).count()
            
            # Get subscription info
            try:
                subscription = Subscription.objects.get(user=user)
                subscription_status = subscription.status
                plan = subscription.plan
            except Subscription.DoesNotExist:
                subscription_status = "none"
                plan = "none"
            
            # Last activity
            last_activity = Activity.objects.filter(
                contact__owner=user
            ).order_by('-created_at').first()
            
            user_data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "stats": {
                    "contacts": contact_count,
                    "tasks": task_count,
                    "subscription_status": subscription_status,
                    "plan": plan,
                    "last_activity": last_activity.created_at.isoformat() if last_activity else None
                }
            })
        
        return JsonResponse({
            "success": True,
            "count": len(user_data),
            "users": user_data
        })
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@require_http_methods(["GET"])
def user_activity(request, user_id):
    """
    Get detailed activity for a specific user
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Recent activities
        activities = Activity.objects.filter(
            contact__owner=user
        ).order_by('-created_at')[:50]
        
        activity_data = [{
            "id": activity.id,
            "type": activity.activity_type,
            "title": activity.title,
            "description": activity.description,
            "created_at": activity.created_at.isoformat(),
            "contact_id": activity.contact.id if activity.contact else None
        } for activity in activities]
        
        # Activity breakdown by type
        activity_breakdown = Activity.objects.filter(
            contact__owner=user
        ).values('activity_type').annotate(count=Count('id'))
        
        return JsonResponse({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "recent_activities": activity_data,
            "breakdown": list(activity_breakdown)
        })
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Exception as e:
        logger.error(f"Error getting user activity: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@require_http_methods(["POST"])
def toggle_user_status(request, user_id):
    """
    Activate/deactivate a user
    """
    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        
        return JsonResponse({
            "success": True,
            "user_id": user.id,
            "is_active": user.is_active,
            "message": f"User {'activated' if user.is_active else 'deactivated'}"
        })
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Exception as e:
        logger.error(f"Error toggling user status: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# ACTIVITY LOGS
# ============================================

@require_http_methods(["GET"])
def system_activity_logs(request):
    """
    Get system-wide activity logs
    """
    try:
        # Time range filter
        hours = int(request.GET.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        
        # Get recent activities
        activities = Activity.objects.filter(
            created_at__gte=since
        ).select_related('contact', 'contact__owner').order_by('-created_at')[:100]
        
        activity_data = [{
            "id": activity.id,
            "type": activity.activity_type,
            "title": activity.title,
            "description": activity.description,
            "created_at": activity.created_at.isoformat(),
            "user": {
                "id": activity.contact.owner.id,
                "username": activity.contact.owner.username
            } if activity.contact and activity.contact.owner else None,
            "contact_id": activity.contact.id if activity.contact else None
        } for activity in activities]
        
        # Activity statistics
        stats = {
            "total": activities.count(),
            "by_type": list(Activity.objects.filter(
                created_at__gte=since
            ).values('activity_type').annotate(count=Count('id')))
        }
        
        return JsonResponse({
            "success": True,
            "hours": hours,
            "activities": activity_data,
            "stats": stats
        })
    except Exception as e:
        logger.error(f"Error getting activity logs: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# EMAIL QUEUE MANAGEMENT
# ============================================

@require_http_methods(["GET"])
def email_queue_status(request):
    """
    Get email queue status and recent emails
    Note: This is a placeholder - actual implementation depends on email backend
    """
    try:
        # Get email-related activities
        hours = int(request.GET.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        
        email_activities = Activity.objects.filter(
            activity_type__in=['email_sent', 'email_opened', 'email_clicked'],
            created_at__gte=since
        ).order_by('-created_at')
        
        stats = {
            "total_sent": email_activities.filter(activity_type='email_sent').count(),
            "total_opened": email_activities.filter(activity_type='email_opened').count(),
            "total_clicked": email_activities.filter(activity_type='email_clicked').count(),
        }
        
        recent_emails = [{
            "id": activity.id,
            "type": activity.activity_type,
            "title": activity.title,
            "created_at": activity.created_at.isoformat(),
            "metadata": activity.metadata
        } for activity in email_activities[:50]]
        
        return JsonResponse({
            "success": True,
            "stats": stats,
            "recent_emails": recent_emails
        })
    except Exception as e:
        logger.error(f"Error getting email queue status: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# CELERY TASK MONITORING
# ============================================

@require_http_methods(["GET"])
def celery_task_status(request):
    """
    Get Celery task queue status
    """
    try:
        inspector = current_app.control.inspect()
        
        # Get active tasks
        active_tasks = inspector.active() or {}
        
        # Get scheduled tasks
        scheduled_tasks = inspector.scheduled() or {}
        
        # Get reserved tasks
        reserved_tasks = inspector.reserved() or {}
        
        # Get worker stats
        stats = inspector.stats() or {}
        
        task_info = {
            "active_tasks": {
                "count": sum(len(tasks) for tasks in active_tasks.values()),
                "by_worker": {
                    worker: len(tasks) for worker, tasks in active_tasks.items()
                }
            },
            "scheduled_tasks": {
                "count": sum(len(tasks) for tasks in scheduled_tasks.values()),
                "by_worker": {
                    worker: len(tasks) for worker, tasks in scheduled_tasks.items()
                }
            },
            "reserved_tasks": {
                "count": sum(len(tasks) for tasks in reserved_tasks.values()),
                "by_worker": {
                    worker: len(tasks) for worker, tasks in reserved_tasks.items()
                }
            },
            "workers": list(stats.keys()),
            "worker_stats": stats
        }
        
        return JsonResponse({"success": True, "tasks": task_info})
    except Exception as e:
        logger.error(f"Error getting Celery task status: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@require_http_methods(["GET"])
def celery_task_history(request):
    """
    Get recent task execution history
    Note: This requires celery-results backend to be configured
    """
    try:
        # Get recent task results if available
        # This is a simplified version - expand based on your celery result backend
        
        return JsonResponse({
            "success": True,
            "message": "Task history requires celery-results backend configuration",
            "recent_tasks": []
        })
    except Exception as e:
        logger.error(f"Error getting task history: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# DATABASE INSPECTOR
# ============================================

@require_http_methods(["GET"])
def database_stats(request):
    """
    Get database statistics and table sizes
    """
    try:
        stats = {}
        
        # Table counts
        stats["tables"] = {
            "users": User.objects.count(),
            "contacts": Contact.objects.count(),
            "tasks": Task.objects.count(),
            "activities": Activity.objects.count(),
            "notifications": Notification.objects.count(),
            "subscriptions": Subscription.objects.count(),
            "workflows": Workflow.objects.count()
        }
        
        # Recent growth (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        stats["growth_last_7_days"] = {
            "users": User.objects.filter(date_joined__gte=week_ago).count(),
            "contacts": Contact.objects.filter(created_at__gte=week_ago).count(),
            "tasks": Task.objects.filter(created_at__gte=week_ago).count(),
            "activities": Activity.objects.filter(created_at__gte=week_ago).count()
        }
        
        # Database size (PostgreSQL specific)
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database()))
                """)
                db_size = cursor.fetchone()[0]
                stats["database_size"] = db_size
        except:
            stats["database_size"] = "N/A (requires PostgreSQL)"
        
        return JsonResponse({"success": True, "stats": stats})
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@require_http_methods(["GET"])
def slow_queries(request):
    """
    Identify slow database queries
    Note: Requires query logging to be enabled
    """
    try:
        # This is a placeholder - actual implementation depends on database logging
        return JsonResponse({
            "success": True,
            "message": "Slow query monitoring requires database query logging",
            "queries": []
        })
    except Exception as e:
        logger.error(f"Error getting slow queries: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# ERROR LOG VIEWER
# ============================================

@require_http_methods(["GET"])
def error_logs(request):
    """
    Get recent error logs from Django logger
    """
    try:
        # This reads from log file if available
        log_file = request.GET.get('file', 'django.log')
        lines = int(request.GET.get('lines', 100))
        
        errors = []
        
        # Try to read log file
        try:
            with open(log_file, 'r') as f:
                all_lines = f.readlines()
                recent_lines = all_lines[-lines:]
                errors = [line.strip() for line in recent_lines if 'ERROR' in line or 'CRITICAL' in line]
        except FileNotFoundError:
            errors = ["Log file not found. Configure Django logging to file."]
        
        return JsonResponse({
            "success": True,
            "log_file": log_file,
            "error_count": len(errors),
            "errors": errors
        })
    except Exception as e:
        logger.error(f"Error reading error logs: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# NOTIFICATION MANAGEMENT
# ============================================

@require_http_methods(["GET"])
def notification_stats(request):
    """
    Get notification statistics
    """
    try:
        hours = int(request.GET.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        
        stats = {
            "total": Notification.objects.count(),
            "unread": Notification.objects.filter(read=False).count(),
            "recent": Notification.objects.filter(created_at__gte=since).count(),
            "by_type": list(
                Notification.objects.filter(created_at__gte=since)
                .values('notification_type')
                .annotate(count=Count('id'))
            ),
            "by_user": list(
                Notification.objects.filter(created_at__gte=since)
                .values('user__username')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
            )
        }
        
        return JsonResponse({"success": True, "stats": stats})
    except Exception as e:
        logger.error(f"Error getting notification stats: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ============================================
# ADMIN DASHBOARD SUMMARY
# ============================================

@require_http_methods(["GET"])
def admin_dashboard(request):
    """
    Comprehensive admin dashboard data
    """
    try:
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)
        
        dashboard_data = {
            "timestamp": now.isoformat(),
            
            # User stats
            "users": {
                "total": User.objects.count(),
                "active": User.objects.filter(is_active=True).count(),
                "new_today": User.objects.filter(date_joined__gte=today).count(),
                "new_this_week": User.objects.filter(date_joined__gte=week_ago).count()
            },
            
            # Contact stats
            "contacts": {
                "total": Contact.objects.count(),
                "new_today": Contact.objects.filter(created_at__gte=today).count(),
                "new_this_week": Contact.objects.filter(created_at__gte=week_ago).count()
            },
            
            # Task stats
            "tasks": {
                "total": Task.objects.count(),
                "todo": Task.objects.filter(status='todo').count(),
                "in_progress": Task.objects.filter(status='in_progress').count(),
                "completed": Task.objects.filter(status='completed').count(),
                "overdue": Task.objects.filter(
                    status__in=['todo', 'in_progress'],
                    due_date__lt=now
                ).count()
            },
            
            # Activity stats
            "activities": {
                "total": Activity.objects.count(),
                "today": Activity.objects.filter(created_at__gte=today).count(),
                "this_week": Activity.objects.filter(created_at__gte=week_ago).count()
            },
            
            # Notification stats
            "notifications": {
                "total": Notification.objects.count(),
                "unread": Notification.objects.filter(read=False).count(),
                "today": Notification.objects.filter(created_at__gte=today).count()
            },
            
            # Subscription stats
            "subscriptions": {
                "total": Subscription.objects.count(),
                "active": Subscription.objects.filter(status='active').count(),
                "trialing": Subscription.objects.filter(status='trialing').count(),
                "past_due": Subscription.objects.filter(status='past_due').count()
            }
        }
        
        return JsonResponse({"success": True, "dashboard": dashboard_data})
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)
