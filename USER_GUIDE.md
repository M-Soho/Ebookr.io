# Ebookr.io User Guide

Complete guide to using all features of the Ebookr.io CRM platform.

**Last Updated:** January 2026  
**Version:** 2.0 (Critical Features Release)

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Contact Management](#contact-management)
3. [Email System](#email-system)
4. [Task Management](#task-management)
5. [Notifications](#notifications)
6. [Bulk Operations](#bulk-operations)
7. [Search & Filters](#search--filters)
8. [Import & Export](#import--export)
9. [Calendar View](#calendar-view)
10. [Activity Timeline](#activity-timeline)
11. [Automation & Workflows](#automation--workflows)
12. [Analytics & Reports](#analytics--reports)
13. [Team Collaboration](#team-collaboration)
14. [Settings & Preferences](#settings--preferences)

---

## Getting Started

### Accessing the Platform

1. **Navigate** to `http://localhost:3000` (development) or your production URL
2. **Sign in** with your credentials
3. **Dashboard** shows overview of your contacts, tasks, and activities

### Quick Keyboard Shortcuts

- **Cmd+K** (Mac) / **Ctrl+K** (Windows) - Global search
- **Cmd+N** (Mac) / **Ctrl+N** (Windows) - New contact
- **ESC** - Close modal/dropdown

---

## Contact Management

### Viewing Contacts

Navigate to `/contacts` to see all your contacts in a list view.

**Contact Card Shows:**
- Name and email
- Company
- Status (Lead, Active, Inactive, Lost)
- Tags
- Last contacted date
- Assigned owner

### Creating a Contact

1. Click **"New Contact"** button
2. Fill in required fields:
   - First Name
   - Last Name
   - Email
3. Optional fields:
   - Company
   - Phone
   - Status
   - Source
   - Tags
   - Contact Cadence (frequency of follow-ups)
   - Preferred Contact Method
4. Click **"Create Contact"**

### Editing a Contact

1. Click on a contact to open detail view
2. Click **"Edit"** button
3. Update any fields
4. Click **"Save Changes"**

### Contact Details Page

The detail page (`/contacts/[id]`) shows:
- Full contact information
- Activity timeline
- Assigned tasks
- Email history
- Notes (with rich text editing)
- Tags and segments

---

## Email System

### Sending an Email

**Method 1: From Contact Detail**
1. Open contact detail page
2. Click **"Send Email"** button
3. Email compose modal opens with contact pre-filled

**Method 2: From Contact List**
1. Select one or more contacts (checkboxes)
2. Click **"Send Email"** in bulk actions bar
3. Compose email for all selected contacts

**Method 3: From Email Templates**
1. Click **"Send Email"** button
2. Select a template from dropdown
3. Template auto-fills with variables
4. Edit as needed and send

### Email Compose Modal Features

- **To:** Single or multiple recipients
- **Subject:** Email subject line
- **Body:** Email content
- **Templates:** Select from saved templates
- **Variables:** Use template variables like:
  - `{{first_name}}` - Contact's first name
  - `{{last_name}}` - Contact's last name
  - `{{company}}` - Contact's company
  - `{{email}}` - Contact's email
- **Preview:** Variables are replaced in real-time
- **Send:** Click to send immediately

### Email Templates

Create reusable templates for common emails:

1. Navigate to `/settings/email-templates`
2. Click **"New Template"**
3. Name your template
4. Write subject and body with variables
5. Save template

**Example Template:**

```
Subject: Welcome to {{company}}!

Hi {{first_name}},

Thank you for signing up! We're excited to have you at {{company}}.

Best regards,
The Team
```

### Email Tracking

After sending an email:
- View in contact activity timeline
- See sent timestamp
- Track email status

---

## Task Management

### Creating a Task

1. Click **"New Task"** button
2. Fill in details:
   - **Title:** Task description
   - **Contact:** Link to a contact (optional)
   - **Assigned To:** Team member (optional)
   - **Due Date:** Deadline
   - **Priority:** Low, Medium, High, Urgent
   - **Status:** To Do, In Progress, Completed
   - **Notes:** Additional details (rich text)
3. Click **"Create Task"**

### Task Assignment

Assign tasks to team members:

1. In task form, click **"Assigned To"** dropdown
2. Search for team member by name or email
3. Select member from list
4. Save task

**Features:**
- Search team members
- View member avatar and email
- Unassign by clicking X
- See all your assigned tasks in `/tasks`

### Task Priorities

Tasks are color-coded by priority:
- 🔴 **Urgent** - Red
- 🟠 **High** - Orange
- 🟡 **Medium** - Yellow
- 🟢 **Low** - Green

### Task Notifications

Automatic notifications for:
- **Task Assigned** - When a task is assigned to you
- **Task Due Soon** - 24 hours before due date
- **Task Overdue** - When a task becomes overdue

Configure in `/settings/notifications`

---

## Notifications

### Notification Bell

The bell icon in the top-right shows:
- Unread notification count (badge)
- Click to view recent notifications
- Auto-refreshes every 30 seconds

### Notification Types

1. **Task Assigned** - Someone assigned you a task
2. **Task Due Soon** - Task deadline approaching
3. **Task Overdue** - Task is past due date
4. **Email Received** - New email from contact
5. **Contact Updated** - Contact information changed
6. **Mention** - Someone mentioned you in a note

### Managing Notifications

In the notification dropdown:
- **Mark as Read** - Click checkmark icon
- **Delete** - Click trash icon
- **Mark All as Read** - Click "Mark all as read" button
- **View All** - Link to full notifications page

### Notification Preferences

Configure how you receive notifications:

1. Navigate to `/settings/notifications`
2. For each notification type, toggle:
   - **In-App** - Show in notification bell
   - **Email** - Send email notification
3. Click **"Save Preferences"**

**Recommendation:**
- Enable in-app for all types
- Enable email only for urgent items (task assigned, overdue)

---

## Bulk Operations

### Selecting Multiple Items

1. In contact or task list, check boxes next to items
2. **Bulk Actions Bar** appears at bottom of screen
3. Select an operation from toolbar

### Available Bulk Operations

#### For Contacts:

1. **Delete** - Remove multiple contacts
   - Shows confirmation modal
   - Displays count of items to delete
   
2. **Update Status** - Change status for all selected
   - Choose new status: Lead, Active, Inactive, Lost
   
3. **Add Tags** - Add tags to multiple contacts
   - Enter comma-separated tags
   - Tags are added to existing tags
   
4. **Remove Tags** - Remove tags from contacts
   - Select tags to remove
   
5. **Update Cadence** - Set follow-up frequency
   - None, Daily, Weekly, Monthly, Quarterly, Annual

#### For Tasks:

1. **Delete** - Remove multiple tasks
2. **Complete** - Mark multiple tasks as completed

### Bulk Operations Best Practices

- Review selected items before applying
- Use filters to select specific groups
- Start with small batches to test
- Check results in activity timeline

---

## Search & Filters

### Global Search (Cmd+K)

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) anywhere:

1. Search modal opens
2. Type your query
3. Results appear in real-time
4. Filter by type:
   - All
   - Contacts
   - Tasks
   - Activities
5. Click result to navigate

**Search indexes:**
- Contact names, emails, companies
- Task titles and descriptions
- Activity descriptions

### Advanced Contact Search

Navigate to `/contacts` and use filters:

- **Status:** Lead, Active, Inactive, Lost
- **Tags:** Filter by one or more tags
- **Source:** Where contact came from
- **Cadence:** Follow-up frequency
- **Date Range:** Created/updated dates
- **Assigned To:** Filter by owner

**API Endpoint:**
```bash
GET /api/search/contacts/?status=lead&tags=vip&source=referral
```

### Advanced Task Search

Navigate to `/tasks` and use filters:

- **Status:** To Do, In Progress, Completed
- **Priority:** Low, Medium, High, Urgent
- **Assigned To:** Filter by team member
- **Due Date:** Range or specific date
- **Contact:** Filter by linked contact

**API Endpoint:**
```bash
GET /api/search/tasks/?priority=high&status=todo
```

---

## Import & Export

### Importing Contacts from CSV

1. Navigate to `/contacts`
2. Click **"Import"** button
3. **Import Modal** opens with two options:

**Option A: Drag & Drop**
- Drag CSV file into drop zone
- File uploads automatically

**Option B: File Picker**
- Click **"Choose File"**
- Select CSV from your computer

4. Upload progress shows
5. Results display:
   - ✅ Contacts created
   - 🔄 Contacts updated
   - ❌ Errors (with details)

### CSV Format

**Required columns:**
- `email` - Must be unique

**Optional columns:**
- `first_name`
- `last_name`
- `company`
- `phone`
- `status` (lead, active, inactive, lost)
- `source`
- `tags` (comma-separated)

**Example CSV:**

```csv
first_name,last_name,email,company,phone,status,tags
John,Doe,john@example.com,Acme Inc,555-0100,lead,"vip,enterprise"
Jane,Smith,jane@example.com,TechCorp,555-0200,active,"partner"
```

### Download CSV Template

In import modal:
1. Click **"Download Template"**
2. CSV template downloads with correct format
3. Fill in your data
4. Import the completed file

### Exporting Contacts to CSV

1. Navigate to `/contacts`
2. Click **"Export"** button
3. CSV file downloads with all contacts
4. Includes all fields and tags

**API Endpoint:**
```bash
GET /api/contacts/export-csv/
```

### Exporting Tasks

**API Endpoint:**
```bash
GET /api/tasks/export-csv/
```

---

## Calendar View

### Accessing Calendar

Navigate to `/tasks/calendar` to see task calendar view.

### Calendar Features

**Month View:**
- Full month grid
- Days with tasks show colored bars
- Color-coded by priority
- Today is highlighted in blue
- Click date to create task

**Week View:**
- 7-day view with hourly slots
- Detailed task information
- Drag and drop to reschedule (coming soon)

### Calendar Navigation

- **Previous/Next** arrows - Navigate months
- **Today** button - Jump to current month
- **Month/Week** toggle - Switch views

### Task Display

Each task on calendar shows:
- Priority color (red, orange, yellow, green)
- Task title (truncated if long)
- Maximum 3 tasks per day shown
- "+X more" indicator for additional tasks

### Creating Task from Calendar

1. Click on any date in calendar
2. Task creation modal opens
3. Due date is pre-filled with selected date
4. Fill in other details and save

---

## Activity Timeline

### Viewing Activity

The activity timeline shows all interactions with a contact:

1. Navigate to contact detail page
2. Scroll to **"Activity Timeline"** section
3. Activities listed chronologically (newest first)

### Activity Types

Each activity has an icon and color:

- 📧 **Email Sent** (blue) - Email sent to contact
- 📧 **Email Opened** (blue) - Contact opened email
- 📧 **Email Clicked** (blue) - Contact clicked link
- 📞 **Call Made** (green) - Phone call logged
- 💬 **SMS Sent** (purple) - Text message sent
- ✅ **Task Completed** (green) - Task marked done
- 🏷️ **Tag Added/Removed** (yellow) - Tag changes
- 👤 **Status Changed** (indigo) - Contact status update
- 📝 **Note** (gray) - Manual note added

### Filtering Activities

1. Click **"Filter"** button
2. Select activity types to show:
   - All Activities
   - Emails
   - Calls
   - SMS
   - Tasks
   - Notes
   - Status Changes
   - Tags

### Adding Manual Notes

1. At bottom of timeline, click **"+ Add Manual Note"**
2. Rich text editor opens
3. Type your note with formatting
4. Click **"Save"**

### Activity Metadata

Some activities show additional details:
- Email subject and preview
- Call duration
- SMS message content
- Previous/new status for changes

---

## Automation & Workflows

### Drip Campaigns

Automated email sequences:

1. Navigate to `/automations/drip`
2. Click **"New Drip Campaign"**
3. Configure sequence:
   - **Step 1:** Delay (days), Template, Subject, Body
   - **Step 2:** Add another step
   - **Step N:** Continue sequence
4. Save campaign

**Example:**
- Day 0: Welcome email
- Day 3: Getting started guide
- Day 7: Feature highlights
- Day 14: Check-in email

### Workflow Builder

Visual workflow automation:

1. Navigate to `/automations/workflows`
2. Click **"New Workflow"**
3. Drag and drop nodes:
   - **Trigger:** What starts the workflow
   - **Condition:** If/then logic
   - **Action:** What to do (email, task, tag, etc.)
4. Connect nodes with arrows
5. Save and activate

### A/B Testing

Test workflow variations:

1. Create workflow
2. Click **"Create A/B Test"**
3. Configure:
   - Variant A: Original workflow
   - Variant B: Modified version
   - Success metric (opens, clicks, conversions)
   - Traffic split (50/50 or custom)
4. Run test
5. View results and auto-select winner

---

## Analytics & Reports

### Dashboard Overview

Navigate to `/dashboard` for real-time metrics:

- **Total Contacts** - All contacts in system
- **Active Contacts** - Contacts with recent activity
- **Tasks Summary** - To Do, In Progress, Completed
- **Email Metrics** - Sent, opened, clicked
- **Conversion Funnel** - Lead to customer flow

### Contact Growth

View contact acquisition over time:
- Chart shows daily/weekly/monthly growth
- Filter by date range
- See growth rate percentage

### Lead Source Analysis

Track performance by source:
- Table of all sources (Referral, Website, Event, etc.)
- Contact count per source
- Conversion rate
- Revenue (if applicable)

### Email Analytics

Email performance metrics:
- Total sent
- Open rate
- Click rate
- Bounce rate
- By template comparison

### Task Completion Rates

Monitor task productivity:
- Tasks created vs completed
- Completion time average
- Overdue task count
- By assignee breakdown

---

## Team Collaboration

### Creating a Team

1. Navigate to `/teams`
2. Click **"Create Team"**
3. Enter team name and description
4. Click **"Create"**

### Team Roles

- **Owner** - Full access, can delete team
- **Admin** - Manage members, settings
- **Manager** - Assign tasks, manage contacts
- **Member** - View and edit own items
- **Viewer** - Read-only access

### Inviting Team Members

1. In team settings, click **"Invite Member"**
2. Enter email address
3. Select role
4. Click **"Send Invitation"**
5. Member receives email with join link

### Team Activity Feed

View all team activity:
- Who created contacts
- Who completed tasks
- Who sent emails
- Real-time updates

---

## Settings & Preferences

### Account Settings

Navigate to `/settings/account`:

- Profile information
- Email preferences
- Password change
- Time zone

### Notification Settings

Navigate to `/settings/notifications`:

Configure for each notification type:
- In-app notifications (bell icon)
- Email notifications
- SMS notifications (if enabled)

### Email Settings

Navigate to `/settings/email`:

- Default email signature
- Email templates
- Sending preferences
- Reply-to address

### Integration Settings

Navigate to `/settings/integrations`:

Connect external services:
- Google Calendar
- Outlook Calendar
- Salesforce
- HubSpot
- Zapier webhooks

### API Access

Navigate to `/settings/api`:

- Generate API keys
- View API documentation
- Monitor API usage
- Set rate limits

---

## Troubleshooting

### Email Not Sending

**Check:**
1. Email configuration in admin panel
2. SendGrid/Mailgun API key is valid
3. Sender email is verified
4. Recipient email is valid
5. Check Celery worker logs

### Notifications Not Appearing

**Check:**
1. Notification preferences are enabled
2. Celery Beat is running
3. Browser notifications are allowed
4. Refresh page (auto-refresh is 30 seconds)

### Import Failing

**Common Issues:**
1. CSV format incorrect - download template
2. Email column missing - required field
3. Duplicate emails - updates existing contacts
4. Invalid status values - use: lead, active, inactive, lost

### Search Not Finding Results

**Tips:**
1. Check spelling
2. Try partial match (first few letters)
3. Use different search terms
4. Filter by type to narrow results
5. Check if item exists in system

---

## Support

### Getting Help

- **Documentation:** This guide and CRITICAL_FEATURES_IMPLEMENTATION.md
- **API Docs:** See README.md API endpoints section
- **Admin Guide:** ADMIN_QUICKSTART.md for setup

### Reporting Issues

Include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots
5. Browser/OS information

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + K | Global search |
| Cmd/Ctrl + N | New contact |
| Cmd/Ctrl + T | New task |
| ESC | Close modal |
| / | Focus search box |
| ? | Show keyboard shortcuts |

---

**End of User Guide** 📚

For technical implementation details, see:
- CRITICAL_FEATURES_IMPLEMENTATION.md
- FRONTEND_COMPONENTS_STATUS.md
- README.md
