"""
Admin Panel URL Configuration
"""

from django.urls import path
from . import admin_views

app_name = 'admin_panel'

urlpatterns = [
    # Dashboard
    path('dashboard/', admin_views.admin_dashboard, name='admin_dashboard'),
    
    # System Health
    path('health/', admin_views.system_health, name='system_health'),
    path('metrics/', admin_views.system_metrics, name='system_metrics'),
    
    # User Management
    path('users/', admin_views.list_users, name='list_users'),
    path('users/<int:user_id>/activity/', admin_views.user_activity, name='user_activity'),
    path('users/<int:user_id>/toggle-status/', admin_views.toggle_user_status, name='toggle_user_status'),
    
    # Activity Logs
    path('logs/activity/', admin_views.system_activity_logs, name='activity_logs'),
    path('logs/errors/', admin_views.error_logs, name='error_logs'),
    
    # Email Queue
    path('email/queue/', admin_views.email_queue_status, name='email_queue'),
    
    # Celery Tasks
    path('celery/status/', admin_views.celery_task_status, name='celery_status'),
    path('celery/history/', admin_views.celery_task_history, name='celery_history'),
    
    # Database
    path('database/stats/', admin_views.database_stats, name='database_stats'),
    path('database/slow-queries/', admin_views.slow_queries, name='slow_queries'),
    
    # Notifications
    path('notifications/stats/', admin_views.notification_stats, name='notification_stats'),
]
