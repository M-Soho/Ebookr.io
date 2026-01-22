import logging
from datetime import datetime, timedelta
from collections import defaultdict

from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from celery import shared_task

from automation.models import ScheduledFollowUp, AutomationCampaign, AutomationStep
from automation.task_scheduler import TaskScheduler
from contacts.models import Contact, Activity, Task

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def send_scheduled_followups():
    """
    Send all pending follow-ups that are scheduled for now or earlier.
    Marks them as sent and updates the contact's last_contacted_at timestamp.
    Handles errors by marking as cancelled and storing error message.
    """
    now = timezone.now()
    pending_followups = ScheduledFollowUp.objects.filter(
        status=ScheduledFollowUp.PENDING,
        scheduled_for__lte=now,
    )

    sent_count = 0
    error_count = 0

    for followup in pending_followups:
        try:
            contact = followup.contact
            rule = followup.rule

            # Log the follow-up
            logger.info(
                f"Sending follow-up for contact {contact.id} ({contact.email}) "
                f"using rule '{rule.name}'"
            )

            # In a real implementation, you would send the email here using:
            # - rule.subject_template and rule.body_template (with variable substitution)
            # - contact.email as recipient
            # - A mail service (e.g., SendGrid, AWS SES, Django's send_mail)

            # Mark as sent
            followup.status = ScheduledFollowUp.SENT
            followup.sent_at = now
            followup.save(update_fields=["status", "sent_at", "updated_at"])

            # Update contact's last_contacted_at
            contact.last_contacted_at = now
            contact.save(update_fields=["last_contacted_at"])

            sent_count += 1
            logger.info(f"Successfully sent follow-up for contact {contact.id}")

        except Exception as e:
            error_count += 1
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(
                f"Error sending follow-up {followup.id} for contact {followup.contact.id}: {error_msg}"
            )

            # Mark as cancelled and store error
            followup.status = ScheduledFollowUp.CANCELLED
            followup.error_message = error_msg
            followup.save(update_fields=["status", "error_message", "updated_at"])

    logger.info(f"send_scheduled_followups completed: {sent_count} sent, {error_count} errors")
    return {"sent": sent_count, "errors": error_count}


@shared_task
def auto_schedule_overdue_tasks():
    """
    Automatically create tasks for contacts with overdue follow-ups
    Runs periodically (e.g., daily) to catch overdue contacts
    """
    total_tasks = 0
    
    for user in User.objects.filter(is_active=True):
        try:
            scheduler = TaskScheduler(owner=user)
            tasks = scheduler.auto_schedule_overdue_follow_ups()
            total_tasks += len(tasks)
            
            logger.info(f"Created {len(tasks)} auto-scheduled tasks for user {user.email}")
        except Exception as e:
            logger.error(f"Error auto-scheduling tasks for user {user.id}: {str(e)}")
    
    logger.info(f"auto_schedule_overdue_tasks completed: {total_tasks} tasks created")
    return {"tasks_created": total_tasks}


@shared_task
def process_activity_triggers(activity_id: int):
    """
    Process automation triggers when a new activity is created
    Automatically creates tasks based on activity type
    
    Args:
        activity_id: ID of the activity that was created
    """
    try:
        activity = Activity.objects.get(id=activity_id)
        contact = activity.contact
        owner = contact.owner
        
        scheduler = TaskScheduler(owner=owner)
        task = scheduler.schedule_based_on_activity(
            contact=contact,
            activity_type=activity.activity_type
        )
        
        if task:
            logger.info(
                f"Created task {task.id} for activity {activity_id} "
                f"({activity.activity_type}) on contact {contact.email}"
            )
            return {"task_created": True, "task_id": task.id}
        else:
            logger.info(f"No task created for activity {activity_id} - no matching rule")
            return {"task_created": False}
            
    except Activity.DoesNotExist:
        logger.error(f"Activity {activity_id} not found")
        return {"error": "Activity not found"}
    except Exception as e:
        logger.error(f"Error processing activity trigger {activity_id}: {str(e)}")
        return {"error": str(e)}


@shared_task
def process_status_change_triggers(contact_id: int, old_status: str, new_status: str):
    """
    Process automation triggers when contact status changes
    
    Args:
        contact_id: ID of the contact
        old_status: Previous status
        new_status: New status
    """
    try:
        contact = Contact.objects.get(id=contact_id)
        owner = contact.owner
        
        scheduler = TaskScheduler(owner=owner)
        task = scheduler.schedule_based_on_status(
            contact=contact,
            old_status=old_status,
            new_status=new_status
        )
        
        if task:
            logger.info(
                f"Created task {task.id} for status change on contact {contact.email} "
                f"from {old_status} to {new_status}"
            )
            return {"task_created": True, "task_id": task.id}
        else:
            logger.info(f"No task created for status change - same status or no rule")
            return {"task_created": False}
            
    except Contact.DoesNotExist:
        logger.error(f"Contact {contact_id} not found")
        return {"error": "Contact not found"}
    except Exception as e:
        logger.error(f"Error processing status change for contact {contact_id}: {str(e)}")
        return {"error": str(e)}


@shared_task
def process_automation_workflows():
    """
    Process pending automation workflow steps and create tasks
    Runs periodically to check for workflow steps that are ready to execute
    """
    now = timezone.now()
    steps_processed = 0
    tasks_created = 0
    
    # Find automation steps that are scheduled but not yet executed
    pending_steps = AutomationStep.objects.filter(
        message_type=AutomationStep.TASK,
        is_executed=False,
        scheduled_for__lte=now,
        campaign__status=AutomationCampaign.ACTIVE
    )
    
    for step in pending_steps:
        try:
            contact = step.campaign.contact
            owner = step.campaign.owner
            
            scheduler = TaskScheduler(owner=owner)
            task = scheduler.schedule_from_automation_step(
                automation_step=step,
                contact=contact
            )
            
            if task:
                tasks_created += 1
                logger.info(
                    f"Created task {task.id} from automation step {step.id} "
                    f"for contact {contact.email}"
                )
            
            steps_processed += 1
            
        except Exception as e:
            logger.error(f"Error processing automation step {step.id}: {str(e)}")
    
    logger.info(
        f"process_automation_workflows completed: "
        f"{steps_processed} steps processed, {tasks_created} tasks created"
    )
    return {"steps_processed": steps_processed, "tasks_created": tasks_created}


@shared_task
def schedule_recurring_contact_tasks():
    """
    Create recurring tasks based on contact cadence settings
    Runs daily to ensure contacts with recurring cadences have upcoming tasks
    """
    tasks_created = 0
    
    # Find contacts with cadence settings and no upcoming tasks
    contacts_with_cadence = Contact.objects.filter(
        contact_cadence__in=[
            Contact.CADENCE_DAILY,
            Contact.CADENCE_WEEKLY,
            Contact.CADENCE_MONTHLY,
            Contact.CADENCE_QUARTERLY,
            Contact.CADENCE_ANNUAL
        ]
    ).exclude(
        status=Contact.LOST
    )
    
    for contact in contacts_with_cadence:
        try:
            # Check if contact has any future tasks
            future_tasks = Task.objects.filter(
                contact=contact,
                status__in=[Task.TODO, Task.IN_PROGRESS],
                due_date__gte=timezone.now()
            ).count()
            
            # Only create recurring tasks if there are fewer than 2 future tasks
            if future_tasks < 2:
                owner = contact.owner
                scheduler = TaskScheduler(owner=owner)
                
                task_template = {
                    "title": f"{contact.contact_cadence.title()} check-in with {contact.first_name}",
                    "description": f"Scheduled touchpoint based on {contact.contact_cadence} cadence",
                    "priority": "medium"
                }
                
                tasks = scheduler.schedule_recurring_tasks(
                    contact=contact,
                    cadence=contact.contact_cadence,
                    task_template=task_template
                )
                
                tasks_created += len(tasks)
                
        except Exception as e:
            logger.error(
                f"Error creating recurring tasks for contact {contact.id}: {str(e)}"
            )
    
    logger.info(
        f"schedule_recurring_contact_tasks completed: {tasks_created} tasks created"
    )
    return {"tasks_created": tasks_created}


@shared_task
def send_task_reminders():
    """
    Send reminders for tasks that have reminder_enabled and reminder_time has passed
    Runs every 15 minutes to check for due reminders
    """
    from contacts.email_service import email_service
    from contacts.notification_views import create_notification
    from contacts.notification_models import Notification
    
    now = timezone.now()
    reminders_sent = 0
    notifications_created = 0
    
    # Find tasks with reminders due
    tasks_with_reminders = Task.objects.filter(
        reminder_enabled=True,
        reminder_time__lte=now,
        status__in=[Task.TODO, Task.IN_PROGRESS]
    ).select_related('owner', 'contact', 'assigned_to')
    
    for task in tasks_with_reminders:
        try:
            # Determine who to notify (assigned user or owner)
            notify_user = task.assigned_to if task.assigned_to else task.owner
            
            # Create in-app notification
            notification = create_notification(
                user=notify_user,
                notification_type=Notification.TASK_REMINDER,
                title=f"Task Reminder: {task.title}",
                message=f"Task '{task.title}' is due {task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else 'soon'}",
                link_url=f"/tasks/{task.id}",
                metadata={
                    'task_id': task.id,
                    'priority': task.priority,
                    'contact_id': task.contact.id if task.contact else None
                }
            )
            if notification:
                notifications_created += 1
            
            # Send email notification if user has it enabled
            from contacts.notification_models import NotificationPreference
            prefs, _ = NotificationPreference.objects.get_or_create(user=notify_user)
            
            if prefs.email_task_reminders and notify_user.email:
                subject = f"Task Reminder: {task.title}"
                message = f"""
Hi {notify_user.first_name or notify_user.username},

This is a reminder about your task:

Task: {task.title}
Priority: {task.priority.upper()}
Due: {task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else 'No due date set'}
{f'Contact: {task.contact.first_name} {task.contact.last_name} ({task.contact.email})' if task.contact else ''}

Description:
{task.description or 'No description provided'}

---
View task: http://localhost:3000/tasks/{task.id}

Best regards,
Your CRM System
                """.strip()
                
                try:
                    from django.core.mail import send_mail
                    from django.conf import settings
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ebookr.io'),
                        recipient_list=[notify_user.email],
                        fail_silently=True
                    )
                    reminders_sent += 1
                except Exception as email_error:
                    logger.error(f"Failed to send email reminder for task {task.id}: {str(email_error)}")
            
            # Disable reminder so it doesn't fire again
            task.reminder_enabled = False
            task.save(update_fields=['reminder_enabled'])
            
        except Exception as e:
            logger.error(f"Error sending reminder for task {task.id}: {str(e)}")
    
    logger.info(f"send_task_reminders completed: {reminders_sent} emails sent, {notifications_created} notifications created")
    return {"reminders_sent": reminders_sent, "notifications_created": notifications_created}


@shared_task
def send_overdue_task_notifications():
    """
    Send notifications for overdue tasks.
    Runs daily to notify users about overdue tasks.
    """
    from contacts.notification_views import create_notification
    from contacts.notification_models import Notification, NotificationPreference
    from django.core.mail import send_mail
    from django.conf import settings
    
    now = timezone.now()
    notifications_sent = 0
    
    # Find overdue tasks
    overdue_tasks = Task.objects.filter(
        due_date__lt=now,
        status__in=[Task.TODO, Task.IN_PROGRESS]
    ).select_related('owner', 'assigned_to', 'contact')
    
    # Group by user
    from collections import defaultdict
    tasks_by_user = defaultdict(list)
    
    for task in overdue_tasks:
        notify_user = task.assigned_to if task.assigned_to else task.owner
        tasks_by_user[notify_user].append(task)
    
    for user, user_tasks in tasks_by_user.items():
        try:
            # Create in-app notification
            task_count = len(user_tasks)
            notification = create_notification(
                user=user,
                notification_type=Notification.TASK_OVERDUE,
                title=f"You have {task_count} overdue task{'s' if task_count > 1 else ''}",
                message=f"Tasks: {', '.join([t.title for t in user_tasks[:3]])}{'...' if task_count > 3 else ''}",
                link_url="/tasks?filter=overdue",
                metadata={'task_count': task_count}
            )
            if notification:
                notifications_sent += 1
            
            # Send email if enabled
            prefs, _ = NotificationPreference.objects.get_or_create(user=user)
            if prefs.email_task_overdue and user.email:
                subject = f"You have {task_count} overdue task{'s' if task_count > 1 else ''}"
                task_list = "\n".join([
                    f"- {task.title} (Due: {task.due_date.strftime('%Y-%m-%d')})"
                    for task in user_tasks
                ])
                
                message = f"""
Hi {user.first_name or user.username},

You have {task_count} overdue task{'s' if task_count > 1 else ''}:

{task_list}

Please review and update these tasks.

---
View all overdue tasks: http://localhost:3000/tasks?filter=overdue

Best regards,
Your CRM System
                """.strip()
                
                try:
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ebookr.io'),
                        recipient_list=[user.email],
                        fail_silently=True
                    )
                except Exception as e:
                    logger.error(f"Failed to send overdue tasks email to {user.email}: {str(e)}")
        
        except Exception as e:
            logger.error(f"Error processing overdue tasks for user {user.id}: {str(e)}")
    
    logger.info(f"send_overdue_task_notifications completed: {notifications_sent} notifications sent")
    return {"notifications_sent": notifications_sent, "users_notified": len(tasks_by_user)}


@shared_task
def send_daily_digest():
    """
    Send daily digest emails to users who have it enabled.
    Includes summary of tasks, contacts, and activities.
    """
    from contacts.notification_models import NotificationPreference
    from django.core.mail import send_mail
    from django.conf import settings
    from django.db.models import Count
    
    prefs_list = NotificationPreference.objects.filter(email_daily_digest=True).select_related('user')
    digests_sent = 0
    
    for prefs in prefs_list:
        user = prefs.user
        
        try:
            # Gather statistics
            today = timezone.now().date()
            tasks_due_today = Task.objects.filter(
                Q(owner=user) | Q(assigned_to=user),
                due_date__date=today,
                status__in=[Task.TODO, Task.IN_PROGRESS]
            ).count()
            
            tasks_overdue = Task.objects.filter(
                Q(owner=user) | Q(assigned_to=user),
                due_date__lt=timezone.now(),
                status__in=[Task.TODO, Task.IN_PROGRESS]
            ).count()
            
            new_contacts_today = Contact.objects.filter(
                owner=user,
                created_at__date=today
            ).count()
            
            recent_activities = Activity.objects.filter(
                contact__owner=user,
                created_at__date=today
            ).count()
            
            subject = f"Your Daily Digest - {today.strftime('%B %d, %Y')}"
            message = f"""
Hi {user.first_name or user.username},

Here's your daily summary for {today.strftime('%B %d, %Y')}:

📋 TASKS
- Due today: {tasks_due_today}
- Overdue: {tasks_overdue}

👥 CONTACTS
- New contacts today: {new_contacts_today}

📊 ACTIVITY
- Total activities today: {recent_activities}

---
View your dashboard: http://localhost:3000/dashboard

Best regards,
Your CRM System
            """.strip()
            
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ebookr.io'),
                recipient_list=[user.email],
                fail_silently=True
            )
            digests_sent += 1
            
        except Exception as e:
            logger.error(f"Error sending daily digest to {user.email}: {str(e)}")
    
    logger.info(f"send_daily_digest completed: {digests_sent} digests sent")
    return {"digests_sent": digests_sent}


