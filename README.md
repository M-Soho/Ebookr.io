# Ebookr.io

A full-stack SaaS platform for freelancer CRM with automated follow-ups and AI-powered features. Built with Django 5 + Celery 5 backend and Next.js 14 frontend.

## Features

### Core CRM
- **Contact Management** – Organize unlimited contacts with custom fields (type, cadence, preference)
- **Drip Campaigns** – Set up automated email sequences with configurable delays
- **Follow-up Tracking** – Schedule and track follow-ups with timestamps
- **Reports & Analytics** – Monitor campaign performance and contact engagement

### Tier-Based Pricing

**Starter (Free)**
- Unlimited contacts
- Basic contact management
- Manual follow-up scheduling
- Basic reports

**Pro ($29/month)**
- Everything in Starter
- Automated drip campaigns
- Advanced automation rules
- AI-powered email suggestions
- AI contact insights & scoring
- Advanced analytics & reports
- Priority support

## Stack

### Backend
- **Framework:** Django 5.0.1
- **Task Queue:** Celery 5.3.1 with Redis broker
- **Database:** PostgreSQL (Supabase) or SQLite (dev)
- **Payments:** Stripe API
- **Server:** Gunicorn + Django development server
- **Language:** Python 3.12

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18 with TypeScript
- **Styling:** Tailwind CSS 3.3
- **Components:** Radix UI (Dialog, etc.)
- **Icons:** Lucide React

## Quick Start

### Backend Setup

#### 1. Bootstrap the Django Project

```bash
./01-bootstrap.sh
```

This script will:
- Create and activate a Python virtual environment (`.venv`)
- Create `requirements.txt` with all dependencies
- Install all packages
- Run `django-admin startproject config .` to scaffold the Django project
- Create apps: `users`, `contacts`, `billing`, `automation`
- Generate a SaaS-ready `config/settings.py` (env-based, Celery-wired)
- Create Celery wiring (`config/celery.py`, `config/__init__.py`)
- Create minimal `config/urls.py`
- Run `python manage.py migrate`

#### 2. Activate Virtual Environment

```bash
source .venv/bin/activate
```

#### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- **DATABASE_URL** – PostgreSQL connection string (Supabase) or leave blank for SQLite
- **CELERY_BROKER_URL** – Redis URL (default: `redis://localhost:6379/0`)
- **CELERY_RESULT_BACKEND** – Redis URL for task results
- **SECRET_KEY** – Django secret (replace default)
- **DEBUG** – Set to `False` in production
- **STRIPE_API_KEY** – Your Stripe API key
- **STRIPE_WEBHOOK_SECRET** – Your Stripe webhook signing secret
- **STRIPE_PRICE_MONTHLY** – Stripe price ID for monthly plan
- **STRIPE_PRICE_ANNUAL** – Stripe price ID for annual plan

#### 4. Run the Backend Development Server

```bash
python manage.py runserver 0.0.0.0:8000
```

#### 5. Run Celery Worker (in a separate terminal)

```bash
source .venv/bin/activate
celery -A config worker -l info
```

#### 6. (Optional) Run Celery Beat for Scheduled Tasks

In another terminal:

```bash
source .venv/bin/activate
celery -A config beat -l info
```

This will run the `send_scheduled_followups` task every 5 minutes to process pending follow-ups.

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- **NEXT_PUBLIC_API_BASE_URL** – Backend API URL (default: `http://localhost:8000`)

#### 3. Run Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

#### 4. Development Auth (Fake User)

For development, a fake auth user is hardcoded via `lib/auth.ts`:
- **User ID:** 1
- **Name:** Test User
- **Email:** test@example.com

This user is displayed in the top-right of the navbar. When real authentication is wired (Supabase), update `lib/auth.ts` with actual auth logic.

## Project Structure

```
.
├── 01-bootstrap.sh              # Backend bootstrap script
├── .env.example                 # Backend environment variables template
├── requirements.txt             # Python dependencies (pinned)
├── manage.py                    # Django CLI
├── config/
│   ├── __init__.py              # Celery app import
│   ├── settings.py              # SaaS-ready Django settings
│   ├── urls.py                  # URL routing
│   ├── wsgi.py                  # WSGI application
│   └── celery.py                # Celery app configuration
├── contacts/
│   ├── models.py                # Contact model (CRM)
│   ├── admin.py                 # Django admin registration
│   └── views.py                 # JSON API views (GET/POST contacts)
├── billing/
│   ├── models.py                # Subscription model with trial support
│   ├── admin.py                 # Django admin for subscriptions
│   └── views.py                 # Stripe webhook handler
├── automation/
│   ├── models.py                # FollowUpRule, ScheduledFollowUp
│   ├── admin.py                 # Admin registration
│   └── tasks.py                 # Celery task for sending follow-ups
├── users/
│   └── (placeholder app for future custom user model)
├── frontend/                     # Next.js 14 frontend
│   ├── package.json             # Node.js dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tailwind.config.ts       # Tailwind CSS config
│   ├── next.config.ts           # Next.js config
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── .env.example             # Frontend environment variables template
│   ├── app/
│   │   ├── layout.tsx           # Root layout with navbar and footer
│   │   ├── globals.css          # Global Tailwind directives
│   │   ├── page.tsx             # Landing page with features & pricing tiers
│   │   ├── signup/
│   │   │   └── page.tsx         # Signup page with tier selection
│   │   ├── contacts/
│   │   │   ├── page.tsx         # Contacts list (server component)
│   │   │   ├── [id]/page.tsx    # Contact detail page
│   │   │   └── contacts-page-client.tsx  # Contacts UI (client component)
│   │   ├── reports/
│   │   │   ├── page.tsx         # Reports index
│   │   │   └── drip/page.tsx    # Drip campaigns report
│   │   └── settings/
│   │       └── page.tsx         # Settings page
│   ├── components/
│   │   ├── NewContactModal.tsx  # Radix UI modal for creating contacts
│   │   ├── EditContactModal.tsx # Radix UI modal for editing contacts
│   │   └── AuthClient.tsx       # Client-side auth display
│   └── lib/
│       ├── api.ts              # TypeScript API client (Contact, Reports, Drip)
│       └── auth.ts             # Fake auth module (TODO: replace with Supabase)
└── README.md                     # This file
```

## Models

### contacts.Contact
CRM contact with follow-up tracking and enriched fields:
- `owner` – ForeignKey to auth.User
- `first_name`, `last_name`, `email`, `company`
- `status` – choices: lead, active, inactive, lost
- `source` – where contact came from
- `contact_type` – choices: contact, company (enrichment field)
- `contact_cadence` – choices: none, daily, weekly, monthly, quarterly, annual (follow-up frequency)
- `contact_pref` – choices: email, phone, sms, none (preferred communication method)
- `drip_campaign_enabled` – boolean flag to enable/disable drip campaigns
- `drip_campaign_config` – JSON field for drip sequence configuration
- `next_follow_up_at`, `last_contacted_at` – timestamps for follow-up scheduling
- `notes` – rich text notes
- Indexed on `(owner, email)` for fast lookups

### automation.FollowUpRule
Automation rule for scheduling follow-ups:
- `owner` – ForeignKey to auth.User
- `name`, `days_after_last_contact`
- `subject_template`, `body_template` – email templates
- `is_active` – toggle rule on/off

### automation.ScheduledFollowUp
Individual scheduled follow-up task:
- `contact` – ForeignKey to Contact
- `rule` – ForeignKey to FollowUpRule
- `scheduled_for` – when to send
- `sent_at` – actual send timestamp
- `status` – choices: pending, sent, cancelled
- `error_message` – for failed sends

### billing.Subscription
Stripe subscription with trial tracking:
- `user` – OneToOneField to auth.User
- `stripe_customer_id`, `stripe_subscription_id`
- `plan` – choices: monthly, annual
- `status` – choices: trialing, active, past_due, canceled, incomplete, incomplete_expired, unpaid
- `trial_start_at`, `trial_end_at` – 14-day trial period
- `current_period_start`, `current_period_end` – billing period
- `cancel_at_period_end` – schedule cancellation
- Helper method: `is_trial_active(now=None)` – checks if trial is active

### billing.DripCampaign
Structured drip campaign for contacts:
- `contact` – OneToOneField to Contact (related_name="drip_campaign")
- `status` – choices: active, paused, completed, canceled
- `started_at`, `completed_at`, `paused_at` – campaign lifecycle timestamps
- `created_at`, `updated_at` – record timestamps
- Related steps: access via `drip_campaign.steps.all()`

### billing.DripCampaignStep
Individual step in a drip sequence:
- `campaign` – ForeignKey to DripCampaign (related_name="steps")
- `order` – PositiveIntegerField for step ordering
- `delay_days` – days to delay before sending this step
- `template_name` – name of email template to use
- `subject` – email subject line
- `body` – email body content
- `sent_at` – timestamp when step was actually sent
- Unique constraint on (campaign, order)

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Landing page with features and pricing tiers |
| `/signup` | `signup/page.tsx` | User signup form with tier selection |
| `/contacts` | `contacts/page.tsx` | Contact list with create, edit, and export |
| `/contacts/[id]` | `contacts/[id]/page.tsx` | Contact detail view |
| `/reports` | `reports/page.tsx` | Reports index |
| `/reports/drip` | `reports/drip/page.tsx` | Drip campaigns report |
| `/settings` | `settings/page.tsx` | Settings and configuration |
| `/signin` | `signin/page.tsx` | Sign-in page |

## API Endpoints

### Contacts API

**GET /api/contacts/** – List contacts for authenticated user

```bash
curl http://localhost:8000/api/contacts/
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "company": "Acme Inc",
      "status": "lead",
      "source": "Website",
      "next_follow_up_at": null,
      "last_contacted_at": null,
      "created_at": "2025-12-09T10:30:00Z",
      "updated_at": "2025-12-09T10:30:00Z"
    }
  ]
}
```

**POST /api/contacts/** – Create a contact

```bash
curl -X POST http://localhost:8000/api/contacts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token-1" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "company": "TechCorp",
    "source": "Referral",
    "status": "active",
    "contact_type": "contact",
    "contact_cadence": "weekly",
    "contact_pref": "email",
    "drip_campaign_enabled": true,
    "drip_campaign_config": {"sequence": [{"delay_days": 0, "template": "Welcome"}]}
  }'
```

Response (201 Created):
```json
{
  "data": {
    "id": 2,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "company": "TechCorp",
    "status": "active",
    "source": "Referral",
    "contact_type": "contact",
    "contact_cadence": "weekly",
    "contact_pref": "email",
    "drip_campaign_enabled": true,
    "drip_campaign_config": {"sequence": [{"delay_days": 0, "template": "Welcome"}]},
    "next_follow_up_at": null,
    "last_contacted_at": null,
    "created_at": "2025-12-09T10:35:00Z",
    "updated_at": "2025-12-09T10:35:00Z"
  }
}
```

**GET /api/contacts/{id}/** – Get a single contact by ID

```bash
curl http://localhost:8000/api/contacts/1/ \
  -H "Authorization: Bearer mock-token-1"
```

Response:
```json
{
  "data": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "company": "TechCorp",
    "status": "active",
    "source": "Referral",
    "contact_type": "contact",
    "contact_cadence": "weekly",
    "contact_pref": "email",
    "drip_campaign_enabled": true,
    "drip_campaign_config": {"sequence": [{"delay_days": 0, "template": "Welcome"}]},
    "next_follow_up_at": null,
    "last_contacted_at": null,
    "notes": "Important lead",
    "created_at": "2025-12-09T10:35:00Z",
    "updated_at": "2025-12-09T10:35:00Z"
  }
}
```

**PATCH /api/contacts/{id}/** – Update a contact

```bash
curl -X PATCH http://localhost:8000/api/contacts/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token-1" \
  -d '{
    "contact_cadence": "monthly",
    "contact_pref": "phone",
    "notes": "Updated notes"
  }'
```

Response (200 OK):
```json
{
  "data": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "company": "TechCorp",
    "status": "active",
    "source": "Referral",
    "contact_type": "contact",
    "contact_cadence": "monthly",
    "contact_pref": "phone",
    "drip_campaign_enabled": true,
    "drip_campaign_config": {"sequence": [{"delay_days": 0, "template": "Welcome"}]},
    "notes": "Updated notes",
    "created_at": "2025-12-09T10:35:00Z",
    "updated_at": "2025-12-09T10:40:00Z"
  }
}
```

**DELETE /api/contacts/{id}/** – Delete a contact

```bash
curl -X DELETE http://localhost:8000/api/contacts/1/ \
  -H "Authorization: Bearer mock-token-1"
```

Response (200 OK):
```json
{
  "data": {
    "id": 1
  }
}
```

**GET /api/contacts/export/csv/** – Export all contacts as CSV

```bash
curl http://localhost:8000/api/contacts/export/csv/ \
  -H "Authorization: Bearer mock-token-1" \
  -o contacts.csv
```

Response: CSV file with all contacts and their fields

### Reports API

**GET /api/reports/drip-campaigns/** – Get drip campaign statistics

```bash
curl http://localhost:8000/api/reports/drip-campaigns/ \
  -H "Authorization: Bearer mock-token-1"
```

Response:
```json
{
  "data": {
    "total_campaigns": 3,
    "counts_by_status": {
      "active": 2,
      "completed": 1
    },
    "campaigns": [
      {
        "campaign_id": 1,
        "contact_id": 1,
        "contact_email": "john@example.com",
        "status": "active",
        "steps_total": 3,
        "steps_sent": 1,
        "started_at": "2025-12-01T10:00:00Z",
        "completed_at": null,
        "last_step_sent_at": "2025-12-02T10:00:00Z",
        "created_at": "2025-12-01T09:59:00Z",
        "updated_at": "2025-12-02T10:00:00Z"
      }
    ]
  }
}
```

### Billing API

**GET /api/billing/trial-status/** – Get trial status for authenticated user (deprecated)

```bash
curl http://localhost:8000/api/billing/trial-status/
```

Response:
```json
{
  "data": {
    "status": "trialing",
    "trial_ends_at": "2025-12-23T10:00:00Z"
  }
}
```

**GET /api/billing/subscription/** – Get subscription details

```bash
curl http://localhost:8000/api/billing/subscription/
```

Response:
```json
{
  "data": {
    "id": 1,
    "user_id": 1,
    "plan": "monthly",
    "status": "active",
    "trial_start_at": "2025-12-09T10:00:00Z",
    "trial_end_at": null,
    "current_period_start": "2025-12-09T10:00:00Z",
    "current_period_end": "2026-01-09T10:00:00Z",
    "cancel_at_period_end": false
  }
}
```

**POST /api/billing/create-checkout-session/** – Create Stripe checkout session

```bash
curl -X POST http://localhost:8000/api/billing/create-checkout-session/ \
  -H "Content-Type: application/json" \
  -d '{"plan": "monthly"}'
```

Response:
```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/pay/cs_..."
  }
}
```

### Stripe Webhook

**POST /stripe/webhook/** – Stripe event handler

Automatically syncs subscriptions from Stripe events:
- `customer.subscription.created` – creates or updates subscription
- `customer.subscription.updated` – updates subscription details
- `customer.subscription.deleted` – marks subscription as canceled

Testing with Stripe CLI:

```bash
stripe listen --forward-to localhost:8000/stripe/webhook/
stripe trigger customer.subscription.created
```

## Frontend Pages & Components

### Pages

**Home (`/`)**
- Hero section with CRM features
- Feature cards highlighting key capabilities
- Upgrade CTA with plan selection buttons

**Contacts (`/contacts`)**
- List all contacts in table (desktop) or cards (mobile) with rich fields displayed
- Shows: Name, Email, Company, Type, Status, Preference, Cadence, Drip Status, Follow-up dates
- Actions per contact:
  - **View Details** – Click name to navigate to contact detail page (`/contacts/{id}`)
  - **Edit Contact** – Edit button (pencil icon) opens EditContactModal for inline updates
  - **Email Link** – Click email to compose email
- "New Contact" button opens NewContactModal for creating contacts
- "Export CSV" button downloads all contacts with all fields
- Empty state with instructions
- Uses server-side data fetching for initial load

**Contact Details (`/contacts/{id}`)**
- Server-side rendered contact detail page
- Shows all contact fields including enriched fields (type, cadence, preference, drip config)
- Displays drip campaign configuration as formatted JSON
- Shows contact notes
- "Edit Contact" button to modify any field
- Back link to contacts list
- Accessible via clicking contact name in list or detail page

**Settings (`/settings`)**
- **Profile Section** – Read-only display of name, email, member since date
- **Subscription Section** – Shows subscription status, plan, trial details, billing period
- Conditional upgrade CTA if user is trialing, past due, or has no subscription
- Displays success message if subscription is active
- Uses client-side data fetching with loading/error states

### Layout & Navigation

- **Sticky navbar** with logo, navigation links (Contacts, Settings), user info (top-right showing "Test User" from fake auth)
- **Trial banner** – Dismissible blue banner showing trial end date (sessionStorage-backed)
- **Footer** – Copyright information

### Components

**`lib/auth.ts` – Fake Auth Module**
Development-only auth provider returning hard-coded test user:
```typescript
{
  id: 1,
  name: 'Test User',
  email: 'test@example.com'
}
```
Used in `app/layout.tsx` to display user info in navbar.
TODO: Replace with real Supabase auth when ready.

**`lib/api.ts` – TypeScript API Client**
Fully typed API client with these interfaces and functions:
- `Contact` – ID, first/last name, email, company, status, timestamps
- `TrialStatus` – status ('trialing' | 'active' | etc), trial_ends_at
- `Subscription` – Plan, status, trial dates, billing period, cancel flags
- `getContacts()` – Fetch user's contacts
- `createContact(payload)` – Create new contact
- `getTrialStatus()` – Get trial status for navbar banner
- `createCheckoutSession(plan)` – Create Stripe checkout session
- `getSubscription()` – Get subscription details for settings page

**`NewContactModal.tsx` – Radix UI Dialog**
Accessible modal for creating contacts:
- Fully controlled form state with validation
- Uses `useTransition` for optimistic form submission
- Calls `createContact()`, closes modal, refreshes page on success
- Error alert for failed submissions
- Form fields: First Name*, Last Name, Email*, Company, Source, Status, Type, Cadence, Preference, Drip Config
- Support for enriched contact fields (type, cadence, preference)
- Optional drip campaign configuration with JSON validation

**`EditContactModal.tsx` – Inline Contact Editing**
Modal for updating existing contacts:
- Similar to NewContactModal but with pre-filled form values
- Calls `updateContact(id, payload)` instead of `createContact()`
- Triggered by Edit button from contacts list
- Full field support matching NewContactModal

**`TrialBanner.tsx` – Dismissible Trial Status**
Shows trial end date with dismiss button:
- Uses `sessionStorage` to remember dismissal during browser session
- Blue styling with X close button
- Only appears if user has active trial (trialing status)

**`UpgradeButton.tsx` – Stripe Checkout CTA**
Two buttons (monthly/annual) triggering Stripe checkout:
- Calls `createCheckoutSession(plan)` with 'monthly' or 'annual'
- Redirects to Stripe checkout URL on success
- Shows loading spinner on active button
- Error alert for failed redirects

## Django Admin

After bootstrap, create a superuser and access the admin panel:

```bash
python manage.py createsuperuser
# Then visit http://localhost:8000/admin/
```

Registered models:
- **Contacts** – manage CRM contacts
- **Follow-up Rules** – create/edit automation rules
- **Scheduled Follow-ups** – view and manage pending sends
- **Subscriptions** – view Stripe subscription syncs

## Celery & Tasks

### Running Tasks

**Development (with Worker):**

```bash
# Terminal 1: Worker
celery -A config worker -l info

# Terminal 2: Trigger tasks manually
python manage.py shell
from automation.tasks import send_scheduled_followups
send_scheduled_followups()
```

**Production (with Beat Scheduler):**

Celery Beat runs the `send_scheduled_followups` task every 5 minutes. To enable it, ensure `celery-beat` is installed and run:

```bash
celery -A config beat -l info
```

In a separate process, run the worker:

```bash
celery -A config worker -l info
```

For persistent database-backed schedules (recommended):

1. Add `django-celery-beat` to `requirements.txt`
2. Add `'django_celery_beat'` to `INSTALLED_APPS` in `config/settings.py`
3. Run `python manage.py migrate`
4. Run beat with:
   ```bash
   celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
   ```

## Production Deployment (Gunicorn + Systemd)

### 1. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 2. Run Gunicorn

```bash
gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --worker-class sync \
  --timeout 120
```

### 3. Run Celery Worker (Separate Container/Process)

```bash
celery -A config worker -l info -c 4
```

### 4. Run Celery Beat (Optional, for Scheduled Tasks)

```bash
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## Environment Variables

### Backend (`.env`)

See `.env.example` for all available variables. Key ones:

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret | `your-secret-key` |
| `DEBUG` | Enable debug mode | `False` (production) |
| `DATABASE_URL` | PostgreSQL connection | `postgres://user:pass@host:5432/db` |
| `CELERY_BROKER_URL` | Redis broker URL | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND` | Redis results store | `redis://localhost:6379/0` |
| `STRIPE_API_KEY` | Stripe API key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `STRIPE_PRICE_MONTHLY` | Monthly price ID | `price_...` |
| `STRIPE_PRICE_ANNUAL` | Annual price ID | `price_...` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

## Troubleshooting

### Backend Issues

**Redis Connection Error**

```
ConnectionError: Error 111 connecting to localhost:6379
```

Ensure Redis is running:

```bash
redis-cli ping
# Should respond: PONG
```

If not installed, install Redis or use Docker:

```bash
docker run -d -p 6379:6379 redis:latest
```

**Database Migration Errors**

```bash
python manage.py makemigrations
python manage.py migrate
```

**Celery Task Not Running**

1. Ensure worker is running: `celery -A config worker -l info`
2. Check worker logs for errors
3. Test manually: `python manage.py shell` then `send_scheduled_followups()`

**Stripe Webhook Not Triggering**

1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly in `.env`
2. Use Stripe CLI to test: `stripe trigger customer.subscription.created`
3. Check Django logs for webhook errors

### Frontend Issues

**API Connection Errors**

If frontend can't reach backend:
1. Ensure backend is running: `python manage.py runserver`
2. Check `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`
3. Verify CORS is configured (if needed)

**Build or Dev Server Issues**

```bash
cd frontend
npm install
npm run dev
```

Check for TypeScript errors:
```bash
npm run lint
```

## Features & Capabilities

### Contact Management ✅
- **Rich Contact Fields** – Type (contact/company), cadence, preference, notes
- **Create Contacts** – Via modal with enriched fields and validation
- **View Contact Details** – Dedicated detail page with full information
- **Edit Contacts** – Update any field via inline modal (PATCH endpoint)
- **Delete Contacts** – Remove contacts from database
- **List Contacts** – Table view (desktop) or card view (mobile) with sorting
- **Search/Filter** – Basic name/email visibility in list
- **Export Data** – CSV export of all contacts with all fields

### Follow-up Management ✅
- **Contact Cadence** – Define follow-up frequency (daily, weekly, monthly, etc.)
- **Contact Preferences** – Specify preferred communication method (email, phone, SMS)
- **Follow-up Dates** – Track next follow-up and last contacted timestamps
- **Notes** – Store rich text notes per contact

### Drip Campaigns ✅ (Foundation)
- **Structured Models** – DripCampaign and DripCampaignStep models for campaign management
- **Campaign Configuration** – Store drip sequence as JSON with server-side validation
- **Campaign Status** – Track campaign state (active, paused, completed, canceled)
- **Step Tracking** – Individual step monitoring with delay_days, templates, and sent_at
- Ready for automation integration and email sending

### API Features ✅
- **RESTful Endpoints** – GET, POST, PATCH, DELETE on `/api/contacts/`
- **Server-side Validation** – Drip config JSON validation with helpful errors
- **Authorization** – Bearer token authentication (mock auth for dev)
- **CSV Export** – Bulk data export endpoint `/api/contacts/export/csv/`
- **Proper HTTP Status Codes** – 201 Created, 404 Not Found, 400 Bad Request, 200 OK

### Frontend Features ✅
- **Responsive Design** – Mobile-first approach with desktop optimizations
- **Rich Modals** – NewContactModal and EditContactModal with full field support
- **Detail Pages** – Individual contact view with all enriched information
- **Action Buttons** – Edit, View, Delete, Export actions
- **Error Handling** – User-friendly error messages and validation feedback
- **Loading States** – Transitions and spinners for async operations
- **Type Safety** – Full TypeScript support with Contact interface

## Next Steps

- [ ] **Real Authentication** – Integrate Supabase Auth (replace `lib/auth.ts`)
- [ ] **Email Sending** – SendGrid or AWS SES integration for follow-ups
- [ ] **Drip Campaign Automation** – Celery tasks to trigger drip campaigns
- [ ] **Drip Sequence Editor** – Visual UI to build drip sequences instead of JSON textarea
- [ ] **Follow-up Rules UI** – Dashboard for managing automation rules
- [ ] **Search & Filtering** – Advanced contact search (by company, source, status)
- [ ] **Analytics Dashboard** – Contact pipeline, conversion metrics, follow-up statistics
- [ ] **Bulk Operations** – Bulk edit, bulk delete, bulk tag/categorize contacts
- [ ] **Test Suite** – Unit/integration tests for backend and frontend
- [ ] **CI/CD Pipeline** – GitHub Actions for automated testing and deployment
- [ ] **Production Deployment** – Vercel (frontend), Railway/AWS (backend)
- [ ] **API Documentation** – OpenAPI/Swagger docs for backend endpoints

## License

Proprietary – M-Soho