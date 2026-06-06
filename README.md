# Ebookr.io

Lightweight **CRM + follow-up automation** for freelancers and small businesses.
Standalone **React + Node.js** rebuild (mirrors the Bankroll Guardian stack).

- **Backend:** Express + TypeScript + Prisma (SQLite locally), JWT auth — port `4001`
- **Frontend:** Vite + React + TypeScript + Tailwind + Recharts — port `5175`
- **Production target:** PostgreSQL/Supabase + `org_id` multi-tenancy (see `// MT:` markers in `prisma/schema.prisma`)

## Run locally

```bash
# 1. Backend
cd backend
cp .env.example .env        # adjust if needed
npm install
npm run prisma:push         # create the SQLite schema
npm run seed                # demo data: demo@ebookr.io / demo1234
npm run dev                 # http://localhost:4001

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5175  (proxies /api -> :4001)
```

Sign in with **demo@ebookr.io / demo1234**.

## What's built

- **Auth** — register, login, email verification, password reset (bcrypt, single-use hashed tokens, rate limiting). Dev mailer logs links to the console.
- **Contacts** — CRUD, search + status filter (lead/prospect/client/inactive), tags, detail drawer with interaction timeline + quick-log.
- **Reminders** — overdue / upcoming / completed grouping, contact linking, complete toggle.
- **Dashboard** — pipeline chart, follow-up queues, recent activity.
- **Plans** — Free / Pro ($49) / Team ($99) with server-side gating (Free caps at 100 contacts → HTTP 402).

## Not yet built

Google OAuth · real Stripe checkout/webhooks · AI email generation (Anthropic SDK) ·
drip campaigns · CSV import · automated tests · CI/CD · Supabase + `org_id` migration ·
real email provider.
