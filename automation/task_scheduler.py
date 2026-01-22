"""
Task Auto-Scheduling Framework
Automatically creates and schedules tasks based on various triggers and rules
"""

import logging
from datetime import timedelta
from typing import Optional, Dict, Any

from django.utils import timezone
from django.contrib.auth import get_user_model

from contacts.models import Contact, Task, Activity
from automation.models import AutomationCampaign, AutomationStep

logger = logging.getLogger(__name__)
User = get_user_model()


class TaskScheduler:
    """Core task scheduling engine"""
    
    def __init__(self, owner: User):
        self.owner = owner
    
    def schedule_task_for_contact(
        self,
        contact: Contact,
        title: str,
        description: str = "",
        priority: str = "medium",
        due_date: Optional[timezone.datetime] = None,
        reminder_offset_hours: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Task:
        """
        Create and schedule a task for a specific contact
        
        Args:
            contact: Contact to associate with task
            title: Task title
            description: Task description
            priority: Task priority (low, medium, high, urgent)
            due_date: When task is due (defaults to 24 hours from now)
            reminder_offset_hours: Hours before due date to set reminder
            metadata: Additional metadata to store with task
            
        Returns:
            Created Task object
        """
        if due_date is None:
            due_date = timezone.now() + timedelta(hours=24)
        
        # Set reminder time based on offset
        reminder_time = due_date - timedelta(hours=reminder_offset_hours)
        
        task = Task.objects.create(
            owner=self.owner,
            contact=contact,
            title=title,
            description=description,
            status=Task.TODO,
            priority=priority,
            due_date=due_date,
            reminder_enabled=True,
            reminder_time=reminder_time
        )
        
        logger.info(
            f"Scheduled task '{title}' for contact {contact.email} "
            f"due at {due_date} with reminder at {reminder_time}"
        )
        
        return task
    
    def schedule_follow_up_sequence(
        self,
        contact: Contact,
        sequence_type: str = "standard",
        start_delay_hours: int = 24
    ):
        """
        Schedule a sequence of follow-up tasks for a contact
        
        Args:
            contact: Contact to create tasks for
            sequence_type: Type of follow-up sequence (standard, aggressive, gentle)
            start_delay_hours: Hours to wait before first task
        """
        sequences = {
            "standard": [
                {"days": 1, "title": "Initial follow-up", "priority": "high"},
                {"days": 3, "title": "Second follow-up", "priority": "medium"},
                {"days": 7, "title": "Third follow-up", "priority": "medium"},
                {"days": 14, "title": "Final follow-up", "priority": "low"},
            ],
            "aggressive": [
                {"days": 1, "title": "Immediate follow-up", "priority": "urgent"},
                {"days": 2, "title": "Quick check-in", "priority": "high"},
                {"days": 4, "title": "Third touch", "priority": "high"},
                {"days": 7, "title": "One week follow-up", "priority": "medium"},
            ],
            "gentle": [
                {"days": 3, "title": "Gentle check-in", "priority": "low"},
                {"days": 7, "title": "One week follow-up", "priority": "low"},
                {"days": 14, "title": "Two week follow-up", "priority": "low"},
                {"days": 30, "title": "Monthly check-in", "priority": "low"},
            ]
        }
        
        sequence = sequences.get(sequence_type, sequences["standard"])
        start_time = timezone.now() + timedelta(hours=start_delay_hours)
        
        tasks = []
        for step in sequence:
            due_date = start_time + timedelta(days=step["days"])
            description = f"Automated {sequence_type} follow-up sequence for {contact.first_name} {contact.last_name}"
            
            task = self.schedule_task_for_contact(
                contact=contact,
                title=step["title"],
                description=description,
                priority=step["priority"],
                due_date=due_date,
                reminder_offset_hours=2
            )
            tasks.append(task)
        
        logger.info(
            f"Created {len(tasks)} task sequence ({sequence_type}) for contact {contact.email}"
        )
        
        return tasks
    
    def schedule_based_on_activity(
        self,
        contact: Contact,
        activity_type: str
    ):
        """
        Automatically schedule tasks based on contact activity
        
        Args:
            contact: Contact who triggered the activity
            activity_type: Type of activity that occurred
        """
        now = timezone.now()
        
        # Define task rules based on activity types
        activity_rules = {
            Activity.EMAIL_OPENED: {
                "title": "Follow up on email engagement",
                "description": f"{contact.first_name} opened your email - follow up while engaged",
                "priority": "high",
                "due_hours": 4,
            },
            Activity.EMAIL_CLICKED: {
                "title": "High-priority follow up - clicked link",
                "description": f"{contact.first_name} clicked a link in your email - HOT lead!",
                "priority": "urgent",
                "due_hours": 2,
            },
            Activity.FORM_SUBMITTED: {
                "title": "Follow up on form submission",
                "description": f"{contact.first_name} submitted a form - respond quickly",
                "priority": "urgent",
                "due_hours": 1,
            },
            Activity.MEETING: {
                "title": "Post-meeting follow-up",
                "description": f"Send follow-up materials and next steps to {contact.first_name}",
                "priority": "high",
                "due_hours": 24,
            },
            Activity.CALL_MADE: {
                "title": "Call follow-up",
                "description": f"Send summary and action items from call with {contact.first_name}",
                "priority": "medium",
                "due_hours": 12,
            }
        }
        
        rule = activity_rules.get(activity_type)
        if not rule:
            logger.warning(f"No task scheduling rule defined for activity type: {activity_type}")
            return None
        
        due_date = now + timedelta(hours=rule["due_hours"])
        
        task = self.schedule_task_for_contact(
            contact=contact,
            title=rule["title"],
            description=rule["description"],
            priority=rule["priority"],
            due_date=due_date,
            reminder_offset_hours=1
        )
        
        return task
    
    def schedule_based_on_status(
        self,
        contact: Contact,
        old_status: str,
        new_status: str
    ):
        """
        Schedule tasks when contact status changes
        
        Args:
            contact: Contact whose status changed
            old_status: Previous status
            new_status: New status
        """
        status_rules = {
            Contact.LEAD: {
                "title": "Qualify new lead",
                "description": f"Reach out to qualify {contact.first_name} as a potential customer",
                "priority": "high",
                "due_hours": 24,
            },
            Contact.ACTIVE: {
                "title": "Onboard new customer",
                "description": f"Send onboarding materials and schedule kickoff with {contact.first_name}",
                "priority": "urgent",
                "due_hours": 4,
            },
            Contact.INACTIVE: {
                "title": "Re-engage inactive contact",
                "description": f"Create re-engagement campaign for {contact.first_name}",
                "priority": "medium",
                "due_hours": 48,
            },
            Contact.LOST: {
                "title": "Exit interview request",
                "description": f"Request feedback from {contact.first_name} about why they left",
                "priority": "low",
                "due_hours": 72,
            }
        }
        
        rule = status_rules.get(new_status)
        if not rule or old_status == new_status:
            return None
        
        due_date = timezone.now() + timedelta(hours=rule["due_hours"])
        
        task = self.schedule_task_for_contact(
            contact=contact,
            title=rule["title"],
            description=rule["description"],
            priority=rule["priority"],
            due_date=due_date
        )
        
        return task
    
    def schedule_recurring_tasks(
        self,
        contact: Contact,
        cadence: str,
        task_template: Dict[str, Any]
    ):
        """
        Schedule recurring tasks based on contact cadence setting
        
        Args:
            contact: Contact to create recurring tasks for
            cadence: Frequency (daily, weekly, monthly, quarterly, annual)
            task_template: Template for task creation
        """
        cadence_days = {
            Contact.CADENCE_DAILY: 1,
            Contact.CADENCE_WEEKLY: 7,
            Contact.CADENCE_MONTHLY: 30,
            Contact.CADENCE_QUARTERLY: 90,
            Contact.CADENCE_ANNUAL: 365,
        }
        
        if cadence == Contact.CADENCE_NONE:
            return []
        
        days_interval = cadence_days.get(cadence, 30)
        
        # Create next 3 recurring tasks
        tasks = []
        for i in range(1, 4):
            due_date = timezone.now() + timedelta(days=days_interval * i)
            
            task = self.schedule_task_for_contact(
                contact=contact,
                title=task_template.get("title", f"{cadence.title()} check-in with {contact.first_name}"),
                description=task_template.get("description", f"Scheduled {cadence} touchpoint"),
                priority=task_template.get("priority", "medium"),
                due_date=due_date,
                reminder_offset_hours=24
            )
            tasks.append(task)
        
        logger.info(
            f"Created {len(tasks)} recurring tasks ({cadence}) for contact {contact.email}"
        )
        
        return tasks
    
    def auto_schedule_overdue_follow_ups(self):
        """
        Automatically create tasks for contacts with overdue follow-ups
        """
        now = timezone.now()
        overdue_contacts = Contact.objects.filter(
            owner=self.owner,
            next_follow_up_at__lt=now,
            next_follow_up_at__isnull=False
        ).exclude(
            status=Contact.LOST
        )
        
        tasks_created = []
        for contact in overdue_contacts:
            days_overdue = (now - contact.next_follow_up_at).days
            
            if days_overdue > 30:
                priority = "urgent"
                title = f"URGENT: Follow up overdue by {days_overdue} days"
            elif days_overdue > 14:
                priority = "high"
                title = f"Follow up overdue by {days_overdue} days"
            else:
                priority = "medium"
                title = f"Scheduled follow-up with {contact.first_name}"
            
            task = self.schedule_task_for_contact(
                contact=contact,
                title=title,
                description=f"Original follow-up was scheduled for {contact.next_follow_up_at.strftime('%Y-%m-%d')}",
                priority=priority,
                due_date=now + timedelta(hours=4),
                reminder_offset_hours=1
            )
            tasks_created.append(task)
        
        logger.info(
            f"Auto-scheduled {len(tasks_created)} tasks for overdue follow-ups"
        )
        
        return tasks_created
    
    def schedule_from_automation_step(
        self,
        automation_step: AutomationStep,
        contact: Contact
    ):
        """
        Create a task from an automation workflow step
        
        Args:
            automation_step: The automation step to execute
            contact: Contact in the automation
        """
        if automation_step.message_type != AutomationStep.TASK:
            return None
        
        # Calculate due date based on step delay
        due_date = timezone.now() + timedelta(
            days=automation_step.delay_days,
            hours=automation_step.delay_hours
        )
        
        task = self.schedule_task_for_contact(
            contact=contact,
            title=automation_step.name,
            description=automation_step.body or f"Automated task from {automation_step.campaign.name}",
            priority="medium",
            due_date=due_date,
            reminder_offset_hours=2
        )
        
        # Mark automation step as executed
        automation_step.scheduled_for = due_date
        automation_step.is_executed = True
        automation_step.executed_at = timezone.now()
        automation_step.save()
        
        return task
