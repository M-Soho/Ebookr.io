# Ebookr.io Changelog

All notable changes to the Ebookr.io CRM platform.

---

## [2.0.0] - 2026-01-22 - Critical Features Release 🎉

### Major Features Added

#### 📧 Email System (Complete)
- **Email Sending Service** - Send emails to single or multiple contacts
- **Template System** - Create and use email templates with variables
- **Template Variables** - `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{email}}`
- **Bulk Email** - Send same email to multiple contacts at once
- **Email Tracking** - Track sent emails in activity timeline
- **Email Compose Modal** - Rich UI component for composing emails

**Files Added:**
- `contacts/email_service.py` - Email sending service layer
- `contacts/email_views.py` - Email API endpoints (4 endpoints)
- `frontend/components/EmailComposeModal.tsx` - Email composition UI

**API Endpoints:**
- `POST /api/emails/send-email/` - Send email to contact(s)
- `POST /api/emails/send-template-email/` - Send templated email
- `GET /api/emails/email-templates/` - List templates
- `POST /api/emails/email-templates/create/` - Create template

---

#### 🔔 Notification System (Complete)
- **Real-time Notifications** - In-app notification system
- **6 Notification Types:**
  - Task Assigned
  - Task Due Soon
  - Task Overdue
  - Email Received
  - Contact Updated
  - Mention
- **Notification Preferences** - Configure in-app and email delivery per type
- **Notification Bell** - UI component with unread count and auto-refresh
- **Email Notifications** - Send notifications via email
- **Notification Center** - View, mark as read, delete notifications

**Files Added:**
- `contacts/notification_models.py` - Notification and NotificationPreference models
- `contacts/notification_views.py` - Notification API (6 endpoints + helper)
- `frontend/components/NotificationBell.tsx` - Notification center UI
- `frontend/components/NotificationPreferences.tsx` - Settings page UI

**API Endpoints:**
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/<id>/mark-read/` - Mark as read
- `POST /api/notifications/mark-all-read/` - Mark all as read
- `DELETE /api/notifications/<id>/` - Delete notification
- `GET /api/notifications/preferences/` - Get preferences
- `PUT /api/notifications/preferences/<id>/` - Update preferences

**Database Changes:**
- Added `Notification` model
- Added `NotificationPreference` model
- Migration: `0004_add_notifications_and_task_assignment.py`

---

#### 📥 Import/Export Contacts (Complete)
- **CSV Import** - Import contacts from CSV file
- **Field Mapping** - Automatic field detection and mapping
- **Error Handling** - Detailed error reporting with line numbers
- **Validation** - Email validation and duplicate checking
- **Update Existing** - Update contacts if email already exists
- **CSV Export** - Export all contacts to CSV
- **Template Download** - Download CSV template with correct format
- **Import Modal** - Drag-and-drop upload UI with progress indicator

**Files Added:**
- `frontend/components/ImportContactsModal.tsx` - Import UI component

**API Endpoints:**
- `POST /api/contacts/import-csv/` - Import contacts
- `GET /api/contacts/export-csv/` - Export contacts
- `GET /api/tasks/export-csv/` - Export tasks

**Features:**
- Drag and drop file upload
- Progress indicator
- Result summary (created/updated/errors)
- Detailed error display
- CSV template generation

---

#### 🗂️ Bulk Operations (Complete)
- **Bulk Delete Contacts** - Delete multiple contacts
- **Bulk Update Status** - Change status for multiple contacts
- **Bulk Add Tags** - Add tags to multiple contacts
- **Bulk Remove Tags** - Remove tags from contacts
- **Bulk Update Cadence** - Set follow-up frequency
- **Bulk Delete Tasks** - Delete multiple tasks
- **Bulk Complete Tasks** - Mark multiple tasks as completed
- **Transaction Safety** - All operations are atomic
- **Bulk Actions Bar** - Fixed bottom toolbar when items selected

**Files Added:**
- `contacts/bulk_operations.py` - Bulk operations API (7 endpoints)
- `frontend/components/BulkActionsBar.tsx` - Bulk operations UI

**API Endpoints:**
- `POST /api/bulk/delete-contacts/` - Bulk delete contacts
- `POST /api/bulk/update-status/` - Bulk update contact status
- `POST /api/bulk/add-tags/` - Bulk add tags
- `POST /api/bulk/remove-tags/` - Bulk remove tags
- `POST /api/bulk/update-cadence/` - Bulk update contact cadence
- `POST /api/bulk/delete-tasks/` - Bulk delete tasks
- `POST /api/bulk/complete-tasks/` - Bulk complete tasks

**Features:**
- Confirmation modals
- Loading states
- Error handling
- Success messages
- Result counts

---

#### 🔍 Advanced Search (Complete)
- **Global Search** - Search across contacts, tasks, and activities
- **Keyboard Shortcut** - Cmd+K / Ctrl+K to open search
- **Real-time Results** - Search as you type with debouncing
- **Type Filtering** - Filter by contacts, tasks, activities, or all
- **Result Highlighting** - Highlight matching text in results
- **Grouped Results** - Results grouped by entity type
- **Advanced Filters:**
  - Contact search: status, tags, source, email, company, dates
  - Task search: priority, status, assigned to, due date, overdue
- **Click to Navigate** - Click result to go to detail page

**Files Added:**
- `contacts/search_views.py` - Search API (3 endpoints)
- `frontend/components/AdvancedSearchBar.tsx` - Search UI component

**API Endpoints:**
- `GET /api/search/global/?q=query&type=all` - Global search
- `GET /api/search/contacts/?status=lead&tags=vip` - Advanced contact search
- `GET /api/search/tasks/?priority=high&status=todo` - Advanced task search

**Features:**
- Fuzzy matching
- Partial text search
- Multi-field search
- Case-insensitive
- Query highlighting

---

#### 📅 Calendar View for Tasks (Complete)
- **Month View** - Full month calendar grid
- **Week View** - 7-day view with time slots
- **Priority Color-Coding:**
  - Urgent: Red
  - High: Orange
  - Medium: Yellow
  - Low: Green
- **Today Highlighting** - Current day highlighted
- **Task Summary** - Count by status (To Do, In Progress, Completed)
- **Click to Create** - Click date to create task
- **Navigation** - Previous/Next month, Go to Today
- **Task Display** - Show up to 3 tasks per day with overflow indicator

**Files Added:**
- `frontend/components/TaskCalendar.tsx` - Calendar view component

**Features:**
- Month/week toggle
- Responsive design
- Task tooltips
- Date selection
- Priority legend

---

#### 📊 Activity Timeline Enhancement (Enhanced)
- **Visual Timeline** - Icon-based activity display
- **Activity Types:**
  - Email Sent/Opened/Clicked
  - Call Made
  - SMS Sent
  - Task Completed
  - Tag Added/Removed
  - Status Changed
  - Note
- **Activity Filtering** - Filter by activity type
- **Relative Timestamps** - "2 hours ago", "3 days ago"
- **Activity Metadata** - Display additional context per activity
- **Color-Coded Icons** - Different color for each activity type
- **Add Manual Notes** - Button to add custom activity

**Files Enhanced:**
- `frontend/components/ActivityTimeline.tsx` - Enhanced existing component

**Features:**
- Filter panel
- Icon indicators
- Metadata badges
- Time formatting
- Activity count

---

#### ✏️ Rich Text Editor for Notes (Complete)
- **Rich Formatting Toolbar:**
  - Bold, Italic, Underline
  - Bullet Lists, Numbered Lists
  - Links, Images
  - Blockquotes, Code Blocks
  - Headings (H1-H4)
- **Keyboard Shortcuts:**
  - Ctrl+B: Bold
  - Ctrl+I: Italic
  - Ctrl+U: Underline
- **HTML Output** - Saves formatted content as HTML
- **WYSIWYG** - What you see is what you get editing

**Files Added:**
- `frontend/components/RichTextEditor.tsx` - Rich text editor component

**Features:**
- Format toolbar
- Keyboard shortcuts
- Link/image insertion
- Code block support
- Heading styles

---

#### 👥 Task Assignment (Complete)
- **Assign to Team Members** - Assign tasks to users
- **Search Members** - Search by name, email, or username
- **Member Avatars** - Show initials in colored circles
- **Unassign Option** - Set task as unassigned
- **Team Filtering** - Filter members by team
- **Assignment Dropdown** - Clean UI component with search

**Files Added:**
- `frontend/components/TaskAssignmentDropdown.tsx` - Assignment UI component

**Database Changes:**
- Added `assigned_to` field to Task model
- Migration: `0004_add_notifications_and_task_assignment.py`

**API Enhancements:**
- `POST /api/tasks/` - Accept `assigned_to` field
- `PUT /api/tasks/<id>/` - Update task assignment
- `GET /api/teams/<id>/members/` - Get team members
- `GET /api/users/` - Get all users

**Features:**
- Member search
- Avatar display
- Team filtering
- Visual selection
- Clear assignment

---

#### ⚡ Automated Email Notifications (Complete)
- **Celery Beat Integration** - Scheduled background tasks
- **Task Reminders** - Send reminders 24 hours before due date
  - Schedule: Every 15 minutes
  - Creates in-app and email notifications
- **Overdue Notifications** - Notify about overdue tasks
  - Schedule: Daily at 9:00 AM
  - Creates notifications for all overdue tasks
- **Daily Digest** - Activity summary email
  - Schedule: Daily at 8:00 AM
  - Includes tasks, emails, activities
- **Notification Creation** - Automatically creates Notification records

**Files Enhanced:**
- `automation/tasks.py` - Added 3 new Celery tasks
- `config/celery.py` - Added beat schedule

**Celery Tasks:**
```python
@shared_task
def send_task_reminders()

@shared_task
def send_overdue_task_notifications()

@shared_task
def send_daily_digest()
```

**Features:**
- Automatic scheduling
- Email delivery
- In-app notifications
- Configurable schedules
- Error handling

---

### Frontend Components (9 new)

1. **EmailComposeModal.tsx** (213 lines)
   - Email composition with templates
   - Variable preview
   - Multi-recipient support

2. **NotificationBell.tsx** (187 lines)
   - Notification center
   - Unread count badge
   - Auto-refresh every 30 seconds

3. **ImportContactsModal.tsx** (204 lines)
   - CSV import UI
   - Drag-and-drop upload
   - Progress indicator

4. **BulkActionsBar.tsx** (267 lines)
   - Fixed bottom toolbar
   - Multiple action types
   - Confirmation modals

5. **AdvancedSearchBar.tsx** (240 lines)
   - Global search
   - Cmd+K shortcut
   - Real-time results

6. **TaskCalendar.tsx** (224 lines)
   - Month/week calendar
   - Priority color-coding
   - Task summaries

7. **RichTextEditor.tsx** (234 lines)
   - Rich formatting toolbar
   - WYSIWYG editing
   - HTML output

8. **TaskAssignmentDropdown.tsx** (189 lines)
   - Member selection
   - Search functionality
   - Avatar display

9. **NotificationPreferences.tsx** (271 lines)
   - Settings page
   - Toggle in-app/email
   - Bulk save

**Total:** 2,029 lines of production-ready React/TypeScript code

---

### Backend Files (7 new + 1 enhanced)

1. **contacts/email_service.py** (NEW)
   - Email sending service layer
   - Template variable substitution
   - Bulk email support

2. **contacts/email_views.py** (NEW)
   - 4 email API endpoints
   - Template management
   - Send tracking

3. **contacts/notification_models.py** (NEW)
   - Notification model
   - NotificationPreference model
   - 6 notification types

4. **contacts/notification_views.py** (NEW)
   - 6 notification API endpoints
   - Helper functions
   - Preference management

5. **contacts/bulk_operations.py** (NEW)
   - 7 bulk operation endpoints
   - Transaction safety
   - Error handling

6. **contacts/search_views.py** (NEW)
   - 3 search API endpoints
   - Multi-entity search
   - Advanced filtering

7. **contacts/models.py** (ENHANCED)
   - Added `assigned_to` field to Task

8. **automation/tasks.py** (ENHANCED)
   - 3 new Celery tasks
   - Automated notifications
   - Daily digest

---

### API Endpoints (28 new)

#### Email APIs (4)
- POST /api/emails/send-email/
- POST /api/emails/send-template-email/
- GET /api/emails/email-templates/
- POST /api/emails/email-templates/create/

#### Notification APIs (6)
- GET /api/notifications/
- POST /api/notifications/<id>/mark-read/
- POST /api/notifications/mark-all-read/
- DELETE /api/notifications/<id>/
- GET /api/notifications/preferences/
- PUT /api/notifications/preferences/<id>/

#### Bulk Operation APIs (7)
- POST /api/bulk/delete-contacts/
- POST /api/bulk/update-status/
- POST /api/bulk/add-tags/
- POST /api/bulk/remove-tags/
- POST /api/bulk/update-cadence/
- POST /api/bulk/delete-tasks/
- POST /api/bulk/complete-tasks/

#### Search APIs (3)
- GET /api/search/global/
- GET /api/search/contacts/
- GET /api/search/tasks/

#### Import/Export APIs (3)
- POST /api/contacts/import-csv/
- GET /api/contacts/export-csv/
- GET /api/tasks/export-csv/

#### Activity & Task APIs (5)
- GET /api/activities/
- POST /api/tasks/ (enhanced)
- PUT /api/tasks/<id>/ (enhanced)
- GET /api/teams/<id>/members/
- GET /api/users/

**Total: 28 new/enhanced API endpoints**

---

### Database Migrations

**Migration:** `contacts/migrations/0004_add_notifications_and_task_assignment.py`

**Changes:**
- Created `Notification` table
- Created `NotificationPreference` table
- Added `assigned_to_id` column to `contacts_task` table
- Added foreign key constraint for task assignment

**Models Added:**
```python
class Notification(models.Model):
    user = ForeignKey(User)
    notification_type = CharField(max_length=50)
    title = CharField(max_length=255)
    description = TextField()
    read = BooleanField(default=False)
    link = URLField(blank=True)
    created_at = DateTimeField(auto_now_add=True)

class NotificationPreference(models.Model):
    user = ForeignKey(User)
    notification_type = CharField(max_length=50)
    in_app_enabled = BooleanField(default=True)
    email_enabled = BooleanField(default=False)
```

---

### Configuration Changes

**config/settings.py:**
- Added EMAIL_BACKEND configuration
- Added EMAIL_HOST, EMAIL_PORT settings
- Added EMAIL_USE_TLS setting
- Added EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
- Added DEFAULT_FROM_EMAIL

**config/celery.py:**
- Added beat schedule for task reminders
- Added beat schedule for overdue notifications
- Added beat schedule for daily digest

**config/urls.py:**
- Added 28 new URL patterns
- Organized by feature (emails, notifications, bulk, search)

---

### Documentation (4 new files)

1. **USER_GUIDE.md** (NEW)
   - Complete user documentation
   - Feature usage guide
   - Troubleshooting section
   - Keyboard shortcuts reference

2. **FRONTEND_COMPONENTS_STATUS.md** (NEW)
   - Component inventory
   - Implementation status
   - Integration checklist
   - File locations

3. **CRITICAL_FEATURES_IMPLEMENTATION.md** (EXISTING, enhanced)
   - Technical implementation details
   - API specifications
   - Database schema

4. **IMPLEMENTATION_COMPLETE.md** (EXISTING, enhanced)
   - Deployment guide
   - Production checklist
   - Environment configuration

**Documentation Updated:**
- README.md - Added critical features section
- ADMIN_QUICKSTART.md - Added new feature administration
- QUICK_REFERENCE.md - Complete API reference update

---

### Testing

**test-apis.sh:**
- Added tests for all 28 new endpoints
- Email sending tests
- Notification tests
- Bulk operation tests
- Search tests
- Import/export tests

---

### Dependencies

**No new dependencies required!**
- All features built with existing Django 5.0.1
- Celery 5.3.1 for background tasks
- Standard library modules only

---

### Breaking Changes

**None!** All changes are backwards compatible.

---

### Performance Improvements

- **Bulk Operations** - Transaction-based for speed
- **Search** - Indexed fields for fast queries
- **Notifications** - Auto-refresh limited to 30 seconds
- **Email** - Async sending via Celery

---

### Security Enhancements

- **Bulk Operations** - User ownership validation
- **Notifications** - User-scoped queries only
- **Email** - Template variable sanitization
- **Search** - SQL injection prevention

---

### Known Issues

**None reported**

---

### Upgrade Guide

```bash
# 1. Pull latest code
git pull origin main

# 2. Apply database migrations
python manage.py migrate

# 3. Restart Django server
python manage.py runserver

# 4. Start Celery worker (if not running)
celery -A config worker -l info

# 5. Start Celery beat (REQUIRED for notifications)
celery -A config beat -l info

# 6. Update frontend
cd frontend && npm install && npm run dev
```

---

### Contributors

- Development Team
- January 2026

---

## [1.0.0] - 2025-12-09 - Initial Release

Initial SaaS CRM platform with:
- Contact Management
- Task Management
- Drip Campaigns
- Analytics Dashboard
- Team Collaboration
- AI Features
- CRM Integrations

---

**For detailed technical documentation, see:**
- [CRITICAL_FEATURES_IMPLEMENTATION.md](CRITICAL_FEATURES_IMPLEMENTATION.md)
- [FRONTEND_COMPONENTS_STATUS.md](FRONTEND_COMPONENTS_STATUS.md)
- [USER_GUIDE.md](USER_GUIDE.md)
