# Task Automation Framework

## Overview

The Task Automation Framework automatically creates and schedules tasks based on various triggers and events in your CRM. This helps ensure timely follow-ups and consistent contact management without manual intervention.

## Features

### 🎯 Automatic Task Creation
- **Activity-based**: Create tasks when contacts engage (email opens, clicks, form submissions)
- **Status-based**: Auto-schedule tasks when contact status changes
- **Cadence-based**: Recurring tasks based on contact cadence settings
- **Time-based**: Schedule tasks at specific times or intervals
- **Overdue detection**: Automatically create urgent tasks for overdue follow-ups

### 🔄 Follow-up Sequences
Pre-built sequences that create multiple tasks automatically:
- **Standard**: 1, 3, 7, and 14-day follow-ups
- **Aggressive**: 1, 2, 4, and 7-day follow-ups
- **Gentle**: 3, 7, 14, and 30-day follow-ups

### 📋 Automation Rules
Create custom rules with:
- Trigger type (activity, status change, cadence, etc.)
- Task title and description templates
- Priority levels (low, medium, high, urgent)
- Configurable delays
- Automatic reminders

## Backend Components

### Core Scheduler (`automation/task_scheduler.py`)

**TaskScheduler** class provides:

```python
from automation.task_scheduler import TaskScheduler

scheduler = TaskScheduler(owner=request.user)

# Schedule a single task
task = scheduler.schedule_task_for_contact(
    contact=contact,
    title="Follow up with lead",
    description="Check on project status",
    priority="high",
    due_date=timezone.now() + timedelta(days=1),
    reminder_offset_hours=2
)

# Schedule a follow-up sequence
tasks = scheduler.schedule_follow_up_sequence(
    contact=contact,
    sequence_type="standard",  # or "aggressive" or "gentle"
    start_delay_hours=24
)

# Schedule based on activity
task = scheduler.schedule_based_on_activity(
    contact=contact,
    activity_type=Activity.EMAIL_OPENED
)

# Schedule based on status change
task = scheduler.schedule_based_on_status(
    contact=contact,
    old_status=Contact.LEAD,
    new_status=Contact.ACTIVE
)

# Schedule recurring tasks
tasks = scheduler.schedule_recurring_tasks(
    contact=contact,
    cadence=Contact.CADENCE_WEEKLY,
    task_template={
        "title": "Weekly check-in",
        "priority": "medium"
    }
)
```

### Celery Tasks (`automation/tasks.py`)

Automated background jobs:

```python
# Run daily to create tasks for overdue follow-ups
@shared_task
def auto_schedule_overdue_tasks()

# Process activity triggers automatically
@shared_task
def process_activity_triggers(activity_id)

# Process status change triggers
@shared_task
def process_status_change_triggers(contact_id, old_status, new_status)

# Execute automation workflow steps
@shared_task
def process_automation_workflows()

# Create recurring tasks based on cadence
@shared_task
def schedule_recurring_contact_tasks()

# Send task reminders
@shared_task
def send_task_reminders()
```

### Database Models (`automation/models.py`)

**TaskAutomationRule**
```python
{
    "name": "Email Engagement Follow-up",
    "trigger_type": "activity",
    "trigger_config": {"activity_types": ["email_opened", "email_clicked"]},
    "task_title_template": "Follow up with {{contact_name}} - Email Engagement",
    "task_priority": "high",
    "delay_hours": 4,
    "is_active": True
}
```

**ScheduledTaskBatch**
- Tracks groups of auto-scheduled tasks
- Monitor completion progress
- Organize tasks by contact or campaign

## API Endpoints

### List/Create Automation Rules
```
GET  /api/task-automation/rules/
POST /api/task-automation/rules/
```

### Manage Individual Rules
```
GET    /api/task-automation/rules/{id}/
PUT    /api/task-automation/rules/{id}/
DELETE /api/task-automation/rules/{id}/
```

### Trigger Actions
```
POST /api/task-automation/schedule-sequence/
POST /api/task-automation/schedule-recurring/
```

### Analytics
```
GET /api/task-automation/stats/
GET /api/task-automation/batches/
```

## Frontend Interface

**Location**: `/automations/task-scheduling`

Features:
- Create and manage automation rules
- View automation statistics
- Activate/deactivate rules
- Monitor task creation metrics

## Usage Examples

### 1. Create Activity-Based Rule

When a contact opens an email, automatically create a high-priority follow-up task in 4 hours:

```python
rule = TaskAutomationRule.objects.create(
    owner=user,
    name="Email Open Follow-up",
    trigger_type="activity",
    trigger_config={"activity_types": ["email_opened"]},
    task_title_template="Follow up with {{contact_name}} - engaged with email",
    task_description_template="{{contact_name}} opened your email - strike while hot!",
    task_priority="high",
    delay_hours=4,
    reminder_offset_hours=1,
    is_active=True
)
```

### 2. Status Change Automation

When a contact becomes active (customer), create urgent onboarding task:

```python
rule = TaskAutomationRule.objects.create(
    owner=user,
    name="New Customer Onboarding",
    trigger_type="status_change",
    trigger_config={"from_status": "lead", "to_status": "active"},
    task_title_template="Onboard {{contact_name}} - New Customer!",
    task_description_template="Send welcome email and schedule kickoff call",
    task_priority="urgent",
    delay_hours=2,
    is_active=True
)
```

### 3. Manual Sequence Trigger

```python
# Via API
POST /api/task-automation/schedule-sequence/
{
    "contact_id": 123,
    "sequence_type": "aggressive",
    "start_delay_hours": 24
}

# Via Code
scheduler = TaskScheduler(owner=user)
tasks = scheduler.schedule_follow_up_sequence(
    contact=contact,
    sequence_type="aggressive"
)
# Creates 4 tasks at 1, 2, 4, and 7 days
```

### 4. Recurring Tasks by Cadence

```python
# Set contact cadence
contact.contact_cadence = Contact.CADENCE_WEEKLY
contact.save()

# Celery task will automatically create weekly recurring tasks
# Or trigger manually:
POST /api/task-automation/schedule-recurring/
{
    "contact_id": 123,
    "cadence": "weekly",
    "task_template": {
        "title": "Weekly check-in with {{contact_name}}",
        "priority": "medium"
    }
}
```

## Celery Configuration

Add to `config/celery.py`:

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'auto-schedule-overdue-tasks': {
        'task': 'automation.tasks.auto_schedule_overdue_tasks',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    'process-automation-workflows': {
        'task': 'automation.tasks.process_automation_workflows',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    'schedule-recurring-tasks': {
        'task': 'automation.tasks.schedule_recurring_contact_tasks',
        'schedule': crontab(hour=8, minute=0),  # Daily at 8 AM
    },
    'send-task-reminders': {
        'task': 'automation.tasks.send_task_reminders',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
}
```

## Workflow Integration

Automation steps can create tasks:

```python
step = AutomationStep.objects.create(
    campaign=campaign,
    message_type=AutomationStep.TASK,
    name="Follow up call",
    body="Schedule and complete follow-up call",
    delay_days=3,
    order=2
)

# Celery will automatically create the task when step is due
```

## Template Variables

Available in task title/description templates:
- `{{contact_name}}` - Contact's full name
- `{{contact_email}}` - Contact's email
- `{{activity_type}}` - Type of activity that triggered (if applicable)
- `{{old_status}}` - Previous status (for status change triggers)
- `{{new_status}}` - New status (for status change triggers)

## Best Practices

1. **Start Simple**: Begin with 1-2 rules and expand
2. **Test First**: Create rules as inactive, test, then activate
3. **Monitor Performance**: Check `times_triggered` and `tasks_created` metrics
4. **Adjust Delays**: Tune `delay_hours` based on response patterns
5. **Priority Balance**: Don't make everything urgent
6. **Clean Up**: Deactivate rules that aren't performing

## Migration

Run migrations to create the new models:

```bash
python manage.py migrate automation
```

## Future Enhancements

- ML-based optimal scheduling times
- A/B testing for different delays
- Smart priority assignment based on lead score
- Integration with calendar apps
- SMS/WhatsApp task notifications
- Conditional logic in templates
- Task dependencies and chaining

## Support

For issues or questions:
- Check the automation stats dashboard
- Review Celery logs for task execution
- Monitor database for TaskAutomationRule usage
