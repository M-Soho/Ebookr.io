# Ebookr.io

A full-stack SaaS platform for freelancer CRM with automated follow-ups. Built with Django 5 + Celery 5 backend and Next.js 14 frontend, featuring Stripe subscriptions, Redis broker, and PostgreSQL database.

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
│   │   ├── layout.tsx           # Root layout with navbar, trial banner, footer
│   │   ├── globals.css          # Global Tailwind directives
│   │   ├── page.tsx             # Home page with features & upgrade CTA
│   │   ├── contacts/
│   │   │   ├── page.tsx         # Contacts list (server component)
│   │   │   └── contacts-page-client.tsx  # Contacts UI (client component)
│   │   └── settings/
│   │       └── page.tsx         # Settings page (profile + subscription)
│   ├── components/
│   │   ├── NewContactModal.tsx  # Radix UI modal for creating contacts
│   │   ├── TrialBanner.tsx      # Dismissible trial status banner
│   │   └── UpgradeButton.tsx    # Stripe checkout CTA buttons
│   └── lib/
│       ├── api.ts              # TypeScript API client (Contact, Trial, Subscription)
│       └── auth.ts             # Fake auth module (TODO: replace with Supabase)
└── README.md                     # This file
```

## Models

### contacts.Contact
CRM contact with follow-up tracking:
- `owner` – ForeignKey to auth.User
- `first_name`, `last_name`, `email`, `company`
- `status` – choices: lead, active, inactive, lost
- `source` – where contact came from
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

## API Endpoints

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
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "company": "TechCorp",
    "source": "Referral",
    "status": "active"
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
    "created_at": "2025-12-09T10:35:00Z",
    "updated_at": "2025-12-09T10:35:00Z"
  }
}
```

### Billing API

**GET /api/billing/trial-status/** – Get trial status for authenticated user

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
- List all contacts in table (desktop) or cards (mobile)
- "New Contact" button opens modal dialog
- Empty state with instructions
- Uses server-side data fetching for initial load

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
- Required fields: First Name, Email

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

## Next Steps

- [ ] **Real Authentication** – Integrate Supabase Auth (replace `lib/auth.ts`)
- [ ] **Email Sending** – SendGrid or AWS SES integration for follow-ups
- [ ] **Contact Management** – Update/delete endpoints and UI
- [ ] **Follow-up Rules UI** – Dashboard for managing automation rules
- [ ] **Search & Filtering** – Advanced contact search in frontend
- [ ] **Analytics Dashboard** – Contact pipeline and metrics visualization
- [ ] **Test Suite** – Unit/integration tests for backend and frontend
- [ ] **CI/CD Pipeline** – GitHub Actions for automated testing and deployment
- [ ] **Production Deployment** – Vercel (frontend), Railway/AWS (backend)
- [ ] **API Documentation** – OpenAPI/Swagger docs for backend endpoints

## License

Proprietary – M-Soho