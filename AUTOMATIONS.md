# Automations Feature

## Overview
The automations section allows users to create and manage automated campaigns for their contacts. It includes:

- **Template Selection**: Choose from pre-built templates or create custom campaigns
- **Calendar Views**: Visualize automation schedules in week, month, or year views
- **Campaign Steps**: Configure multi-step sequences with different message types (Email, SMS, Task, Webhook)
- **Timing Controls**: Set delays in days and hours for each step
- **Progress Tracking**: Monitor campaign execution and step completion

## Features

### Calendar View
- **Weekly View**: See all automation events for the current week
- **Monthly View**: Full month calendar with events grouped by day
- **Yearly View**: Overview of all automation activities across the year
- Navigate between time periods with Previous/Next buttons

### Templates
Pre-built system templates include:
- **Lead Nurture** (7-day and 30-day sequences)
- **Customer Onboarding**
- **Weekly Check-in**
- **Re-engagement Campaign**
- **Product Launch Sequence**

### Campaign Creation
1. Click "New Campaign" button
2. Enter campaign name
3. Select a contact to apply the campaign to
4. (Optional) Choose a template or start from scratch
5. Add steps with:
   - Step name
   - Message type (Email, SMS, Task, or Webhook)
   - Delay timing (days and hours)
   - Subject and body content (for email/SMS)
6. Save to activate the campaign

### Campaign Management
- View active campaigns with progress bars
- See step execution status
- Track pending follow-ups
- Monitor campaign statistics

## Backend API Endpoints

### Templates
- `GET /api/automation/templates/` - List all templates
- `POST /api/automation/templates/` - Create new template

### Campaigns
- `GET /api/automation/campaigns/` - List all campaigns
- `POST /api/automation/campaigns/` - Create new campaign
- `GET /api/automation/campaigns/<id>/` - Get campaign details
- `PUT /api/automation/campaigns/<id>/` - Update campaign
- `DELETE /api/automation/campaigns/<id>/` - Delete campaign

### Calendar & Stats
- `GET /api/automation/calendar/` - Get calendar events (with date range params)
- `GET /api/automation/stats/` - Get automation statistics

## Database Models

### AutomationTemplate
Stores reusable automation templates with categories like nurture, onboarding, engagement, etc.

### AutomationCampaign
Represents an active campaign applied to a contact with status tracking (active, paused, completed, canceled).

### AutomationStep
Individual steps within a campaign with message types, delays, and execution tracking.

### ScheduledFollowUp
Tracks scheduled follow-up tasks with status and execution details.

### FollowUpRule
Defines rules for automatic follow-up scheduling based on triggers.

## Setup Instructions

1. **Run Migrations**:
   ```bash
   python manage.py makemigrations automation
   python manage.py migrate
   ```

2. **Seed Sample Templates**:
   ```bash
   python manage.py seed_templates
   ```

3. **Start Backend**:
   ```bash
   python manage.py runserver
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access Automations**:
   Navigate to http://localhost:3000/automations

## Future Enhancements
- Email template editor
- Conditional branching (if/then logic)
- A/B testing for campaigns
- Advanced analytics and reporting
- Integration with external services (Mailchimp, SendGrid, etc.)
- Trigger campaigns based on contact actions
- SMS integration
- Webhook callbacks for step completion
