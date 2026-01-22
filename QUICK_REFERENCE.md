# Quick Reference - Critical Features

**Last Updated:** January 2026  
**Version:** 2.0

## 🚀 START COMMANDS

```bash
# 1. Apply database migrations (REQUIRED FIRST)
python manage.py migrate

# 2. Start Django server
python manage.py runserver

# 3. Start Celery worker (for background tasks) - REQUIRED
celery -A config worker -l info

# 4. Start Celery beat (for scheduled tasks) - REQUIRED for notifications
celery -A config beat -l info

# 5. Start frontend (in separate terminal)
cd frontend && npm run dev

# 6. Test APIs
./test-apis.sh
```

## 📧 EMAIL SYSTEM

### Send Email to Single Contact
```bash
curl -X POST http://localhost:8000/api/emails/send-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": 1,
    "subject": "Follow up",
    "body": "Hi {{first_name}}, just following up!"
  }'
```

### Send Email to Multiple Contacts
```bash
curl -X POST http://localhost:8000/api/emails/send-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact_ids": [1, 2, 3],
    "subject": "Team Update",
    "body": "Hello {{first_name}}, here is your update..."
  }'
```

### Send Template Email
```bash
curl -X POST http://localhost:8000/api/emails/send-template-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": 1,
    "template_id": 1
  }'
```

### List Email Templates
```bash
curl http://localhost:8000/api/emails/email-templates/
```

### Create Email Template
```bash
curl -X POST http://localhost:8000/api/emails/email-templates/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Email",
    "subject": "Welcome to {{company}}!",
    "body": "Hi {{first_name}}, thanks for signing up!"
  }'
```

### Variables Available
- `{{first_name}}` - Contact first name
- `{{last_name}}` - Contact last name
- `{{email}}` - Contact email
- `{{company}}` - Contact company

## 🔔 NOTIFICATIONS

### List Notifications
```bash
curl http://localhost:8000/api/notifications/
```

### List Unread Only
```bash
curl "http://localhost:8000/api/notifications/?unread_only=true&limit=10"
```

### Mark as Read
```bash
curl -X POST http://localhost:8000/api/notifications/5/mark-read/
```

### Mark All as Read
```bash
curl -X POST http://localhost:8000/api/notifications/mark-all-read/
```

### Delete Notification
```bash
curl -X DELETE http://localhost:8000/api/notifications/5/
```

### Get Notification Preferences
```bash
curl http://localhost:8000/api/notifications/preferences/
```

### Update Notification Preference
```bash
curl -X PUT http://localhost:8000/api/notifications/preferences/1/ \
  -H "Content-Type: application/json" \
  -d '{
    "in_app_enabled": true,
    "email_enabled": false
  }'
```

### Notification Types
- `task_assigned` - Task assigned to you
- `task_due` - Task due within 24 hours
- `task_overdue` - Task is overdue
- `email_received` - Email from contact
- `contact_updated` - Contact info changed
- `mention` - Mentioned in note/comment

## 📥 BULK OPERATIONS

### Bulk Delete Contacts
```bash
curl -X POST http://localhost:8000/api/bulk/delete-contacts/ \
  -H "Content-Type: application/json" \
  -d '{"contact_ids": [1, 2, 3]}'
```

### Bulk Update Status
```bash
curl -X POST http://localhost:8000/api/bulk/update-status/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact_ids": [1, 2, 3],
    "status": "active"
  }'
```

### Bulk Add Tags
```bash
curl -X POST http://localhost:8000/api/bulk/add-tags/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact_ids": [1, 2, 3],
    "tags": ["vip", "enterprise"]
  }'
```

### Bulk Remove Tags
```bash
curl -X POST http://localhost:8000/api/bulk/remove-tags/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact_ids": [1, 2, 3],
    "tags": ["old-tag"]
  }'
```

### Bulk Update Contact Cadence
```bash
curl -X POST http://localhost:8000/api/bulk/update-cadence/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact_ids": [1, 2, 3],
    "cadence": "monthly"
  }'
```

### Bulk Delete Tasks
```bash
curl -X POST http://localhost:8000/api/bulk/delete-tasks/ \
  -H "Content-Type: application/json" \
  -d '{"task_ids": [10, 11, 12]}'
```

### Bulk Complete Tasks
```bash
curl -X POST http://localhost:8000/api/bulk/complete-tasks/ \
  -H "Content-Type: application/json" \
  -d '{"task_ids": [10, 11, 12]}'
```

## 🔍 SEARCH

### Global Search (all entities)
```bash
curl "http://localhost:8000/api/search/global/?q=john"
```

### Global Search with Type Filter
```bash
# Search only contacts
curl "http://localhost:8000/api/search/global/?q=smith&type=contacts"

# Search only tasks
curl "http://localhost:8000/api/search/global/?q=follow&type=tasks"

# Search only activities
curl "http://localhost:8000/api/search/global/?q=email&type=activities"
```

### Advanced Contact Search
```bash
curl "http://localhost:8000/api/search/contacts/?status=lead&tags=vip&source=referral&email=@gmail.com"
```

### Advanced Contact Search Parameters
- `status` - lead, active, inactive, lost
- `tags` - Comma-separated tag names
- `source` - Lead source
- `email` - Email pattern match
- `company` - Company name pattern
- `created_after` - ISO date
- `created_before` - ISO date

### Advanced Task Search
```bash
curl "http://localhost:8000/api/search/tasks/?priority=high&status=todo&assigned_to=1&overdue=true"
```

### Advanced Task Search Parameters
- `priority` - low, medium, high, urgent
- `status` - todo, in_progress, completed
- `assigned_to` - User ID
- `contact` - Contact ID
- `overdue` - true/false
- `due_after` - ISO date
- `due_before` - ISO date

## 📤 IMPORT / EXPORT

### Import Contacts from CSV
```bash
curl -X POST http://localhost:8000/api/contacts/import-csv/ \
  -F "file=@contacts.csv"
```

### CSV Format
```csv
first_name,last_name,email,company,phone,status
John,Doe,john@example.com,Acme Inc,555-0100,lead
Jane,Smith,jane@example.com,TechCorp,555-0200,active
```

### Export Contacts to CSV
```bash
curl http://localhost:8000/api/contacts/export-csv/ -o contacts.csv
```

### Export Tasks to CSV
```bash
curl http://localhost:8000/api/tasks/export-csv/ -o tasks.csv
```

## 📊 ACTIVITIES

### Get Contact Activities
```bash
curl "http://localhost:8000/api/activities/?contact_id=1"
```

### Get All Activities (paginated)
```bash
curl "http://localhost:8000/api/activities/?limit=50&offset=0"
```

### Activity Types
- `email_sent` - Email sent to contact
- `email_opened` - Contact opened email
- `email_clicked` - Contact clicked link
- `call_made` - Phone call logged
- `sms_sent` - SMS sent
- `task_completed` - Task marked done
- `tag_added` - Tag added to contact
- `tag_removed` - Tag removed
- `status_changed` - Contact status updated
- `note` - Manual note added

## ✅ TASKS

### Create Task
```bash
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Follow up with lead",
    "contact": 1,
    "assigned_to": 2,
    "due_date": "2026-01-25",
    "priority": "high",
    "status": "todo",
    "notes": "<p>Important follow-up</p>"
  }'
```

### Update Task
```bash
curl -X PUT http://localhost:8000/api/tasks/10/ \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "assigned_to": 3
  }'
```

### Get Team Members (for assignment)
```bash
curl http://localhost:8000/api/teams/1/members/
```

### Get All Users
```bash
curl http://localhost:8000/api/users/
```

## ⚡ CELERY TASKS (Automated)

### Task Reminders
**Schedule:** Every 15 minutes  
**Function:** `send_task_reminders()`  
**Purpose:** Sends notifications for tasks due within 24 hours

### Overdue Notifications
**Schedule:** Daily at 9:00 AM  
**Function:** `send_overdue_task_notifications()`  
**Purpose:** Notifies about overdue tasks

### Daily Digest
**Schedule:** Daily at 8:00 AM  
**Function:** `send_daily_digest()`  
**Purpose:** Sends activity summary email

### Check Beat Status
```bash
# View Celery Beat schedule
celery -A config inspect scheduled

# View active tasks
celery -A config inspect active
```

## 🎨 FRONTEND COMPONENTS

### EmailComposeModal
**Location:** `/frontend/components/EmailComposeModal.tsx`  
**Usage:**
```tsx
<EmailComposeModal 
  contactIds={selectedContacts}
  onClose={() => setShowModal(false)}
/>
```

### NotificationBell
**Location:** `/frontend/components/NotificationBell.tsx`  
**Usage:**
```tsx
<NotificationBell />
```

### ImportContactsModal
**Location:** `/frontend/components/ImportContactsModal.tsx`  
**Usage:**
```tsx
<ImportContactsModal 
  isOpen={showImport}
  onClose={() => setShowImport(false)}
/>
```

### BulkActionsBar
**Location:** `/frontend/components/BulkActionsBar.tsx`  
**Usage:**
```tsx
<BulkActionsBar 
  selectedIds={selectedContacts}
  type="contacts"
  onComplete={handleBulkComplete}
/>
```

### AdvancedSearchBar
**Location:** `/frontend/components/AdvancedSearchBar.tsx`  
**Usage:**
```tsx
<AdvancedSearchBar />
```
**Keyboard:** Cmd+K or Ctrl+K

### TaskCalendar
**Location:** `/frontend/components/TaskCalendar.tsx`  
**Usage:**
```tsx
<TaskCalendar 
  tasks={tasks}
  onTaskClick={handleTaskClick}
  onDateClick={handleDateClick}
/>
```

### ActivityTimeline
**Location:** `/frontend/components/ActivityTimeline.tsx`  
**Usage:**
```tsx
<ActivityTimeline contactId={contactId} />
```

### RichTextEditor
**Location:** `/frontend/components/RichTextEditor.tsx`  
**Usage:**
```tsx
<RichTextEditor 
  value={notes}
  onChange={setNotes}
  placeholder="Enter notes..."
/>
```

### TaskAssignmentDropdown
**Location:** `/frontend/components/TaskAssignmentDropdown.tsx`  
**Usage:**
```tsx
<TaskAssignmentDropdown 
  value={assignedTo}
  onChange={setAssignedTo}
  teamId={teamId}
/>
```

### NotificationPreferences
**Location:** `/frontend/components/NotificationPreferences.tsx`  
**Usage:**
```tsx
<NotificationPreferences />
```

## 📝 DATABASE MIGRATIONS

### Apply All Migrations
```bash
python manage.py migrate
```

### Create New Migration
```bash
python manage.py makemigrations
```

### View Migration Status
```bash
python manage.py showmigrations
```

### Rollback Migration
```bash
python manage.py migrate contacts 0003
```

### Latest Migration
**File:** `contacts/migrations/0004_add_notifications_and_task_assignment.py`  
**Adds:**
- Notification model
- NotificationPreference model
- Task.assigned_to field

## 🧪 TESTING

### Test All APIs
```bash
./test-apis.sh
```

### Test Email Sending
```bash
curl -X POST http://localhost:8000/api/emails/send-email/ \
  -d '{"contact_id": 1, "subject": "Test", "body": "Test"}'
```

### Test Notifications
```bash
# Create test notification programmatically
python manage.py shell
>>> from contacts.notification_views import create_notification
>>> create_notification(user_id=1, type='task_assigned', title='Test', description='Testing')
```

### Test Bulk Operations
```bash
# Create test contacts first
curl -X POST http://localhost:8000/api/contacts/ \
  -d '{"first_name": "Test", "last_name": "User", "email": "test@example.com"}'

# Then test bulk delete
curl -X POST http://localhost:8000/api/bulk/delete-contacts/ \
  -d '{"contact_ids": [999]}'
```

## 🔧 TROUBLESHOOTING

### Email not sending
1. Check `config/settings.py` EMAIL_* settings
2. Verify Celery worker is running
3. Check SendGrid/Mailgun API key
4. View Celery logs for errors

### Notifications not appearing
1. Ensure Celery Beat is running
2. Check notification preferences
3. Verify user exists
4. Check browser console for errors

### Import failing
1. Verify CSV format (email column required)
2. Check for duplicate emails
3. Validate status values
4. View error details in response

### Search not working
1. Check if data exists
2. Try exact email match
3. Use partial name search
4. Filter by specific type

## 📚 DOCUMENTATION

- **User Guide:** `USER_GUIDE.md` - Complete user documentation
- **Critical Features:** `CRITICAL_FEATURES_IMPLEMENTATION.md` - Technical implementation
- **Frontend Status:** `FRONTEND_COMPONENTS_STATUS.md` - Component inventory
- **Main README:** `README.md` - Full project documentation
- **Admin Guide:** `ADMIN_QUICKSTART.md` - Admin panel guide

---

**Quick Reference Version 2.0** - All critical features included ✨

## 📊 IMPORT/EXPORT

### Import Contacts
```bash
curl -X POST http://localhost:8000/api/contacts/bulk-import/ \
  -F "file=@contacts.csv"
```

### Export Contacts
```bash
curl -o contacts.csv http://localhost:8000/api/contacts/export/csv/
```

### Download Template
```bash
curl -o template.csv http://localhost:8000/api/contacts/import/template/
```

## ⚙️ CONFIGURATION

### Email Settings (.env)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@ebookr.io
```

### Celery Settings (settings.py)
```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'send-task-reminders': {
        'task': 'automation.tasks.send_task_reminders',
        'schedule': crontab(minute='*/15'),
    },
    'send-overdue-notifications': {
        'task': 'automation.tasks.send_overdue_task_notifications',
        'schedule': crontab(hour=9, minute=0),
    },
    'send-daily-digest': {
        'task': 'automation.tasks.send_daily_digest',
        'schedule': crontab(hour=9, minute=30),
    },
}
```

## 🧩 FRONTEND COMPONENTS

### Email Compose Modal
```tsx
import { EmailComposeModal } from '@/components/EmailComposeModal'

<EmailComposeModal
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  selectedContacts={selectedContacts}
  onEmailSent={() => refreshContacts()}
/>
```

### Notification Bell
```tsx
import { NotificationBell } from '@/components/NotificationBell'

// Add to your layout/navbar
<NotificationBell />
```

## 📁 FILES CREATED

### Backend (7 new files)
- `contacts/email_service.py`
- `contacts/email_views.py`
- `contacts/notification_models.py`
- `contacts/notification_views.py`
- `contacts/bulk_operations.py`
- `contacts/search_views.py`
- `test-apis.sh`

### Frontend (2 new files)
- `frontend/components/EmailComposeModal.tsx`
- `frontend/components/NotificationBell.tsx`

### Documentation (2 new files)
- `CRITICAL_FEATURES_IMPLEMENTATION.md`
- `IMPLEMENTATION_COMPLETE.md`

### Database
- Migration: `contacts/migrations/0004_add_notifications_and_task_assignment.py`

## 🎯 QUICK CHECKLIST

Backend Setup:
- [x] Run migrations: `python manage.py migrate`
- [ ] Configure email in `.env`
- [ ] Start Celery worker
- [ ] Start Celery beat
- [ ] Test APIs with `./test-apis.sh`

Frontend Setup:
- [ ] Add `<NotificationBell />` to layout
- [ ] Test EmailComposeModal integration
- [ ] Build remaining UI components

Testing:
- [ ] Send test email
- [ ] Create test notification
- [ ] Test bulk operations
- [ ] Import CSV file
- [ ] Run global search
- [ ] Verify Celery tasks execute

## 📚 FULL DOCUMENTATION

See `CRITICAL_FEATURES_IMPLEMENTATION.md` for complete documentation.
