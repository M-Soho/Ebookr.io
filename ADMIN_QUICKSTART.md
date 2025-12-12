# Admin Panel Quick Start Guide

## Accessing the Admin Panel

### Step 1: Navigate to Admin Sign-In
Open your browser and go to:
```
http://localhost:3000/admin/signin
```

### Step 2: Enter Admin Password
**Development Password:** `admin123`

> ⚠️ **Important:** Change this password in production!

### Step 3: Access the Dashboard
After signing in, you'll be redirected to the admin dashboard at:
```
http://localhost:3000/admin
```

## Main Admin Features

### 1. Dashboard Overview
The main dashboard displays:
- **Total Signups** - Number of registered users
- **Last 7 Days** - Recent signup activity
- **Total Contacts** - Active contacts in the system
- **Active Campaigns** - Running drip campaigns
- **Tier Breakdown** - Distribution of Starter vs Pro users

### 2. Managing Signups
Access at: `/admin/signups`

- View all user registrations in a table
- See signup date, tier (Starter/Pro), and user details
- Paginate through signups (10 per page)
- Filter by tier if needed

### 3. Configuring APIs
Access at: `/admin/api-config`

Add credentials for:
- **Stripe** - Payment processing (API key format: `sk_live_*`)
- **SendGrid** - Email sending (API key format: `SG.*`)
- **Mailgun** - Email management (API key format: `key-*`)
- **Twilio** - SMS/messaging (API key format: `ACxxxxxxxx`)
- **Anthropic** - AI features (API key format: `sk-ant-*`)

**To add a new API configuration:**
1. Click "Add API Configuration"
2. Select the service from dropdown
3. Enter your API key
4. Click "Save Configuration"

The API key will be masked (showing only last 4 characters) for security.

### 4. Setting Up Email
Access at: `/admin/email-config`

Choose your email provider:

**Option A: SendGrid**
- Requires: SendGrid API key
- [Get API key](https://app.sendgrid.com/settings/api_keys)

**Option B: Mailgun**
- Requires: Mailgun domain and API key
- [Get Mailgun credentials](https://app.mailgun.com/)

**Option C: SMTP**
- Requires: SMTP host, port, username, password
- Examples:
  - Gmail: `smtp.gmail.com:587`
  - Office365: `smtp.office365.com:587`
  - SendGrid: `smtp.sendgrid.net:587`

### 5. Global Settings
Access at: `/admin/settings`

Configure:
- **Trial Period** - Days of free trial (default: 14)
- **Feature Flags** - Enable/disable:
  - Drip Campaigns
  - AI Features
  - Reports
- **Rate Limiting** - Max API requests per hour (default: 1000)

### 6. View Reports
Access at: `/admin/reports`

Analyze:
- **30-Day Signup Trends** - Daily signup activity chart
- **Tier Distribution** - Percentage of Starter vs Pro users
- **Contact Statistics** - Total contacts and breakdown by type
- **Campaign Statistics** - Active/draft/completed campaigns

## Common Tasks

### Add a Test Signup
1. Go to `/admin/signups`
2. The table will show all signups
3. Manually testing: Use the `/signup` page to create accounts

### Enable an API Integration
1. Go to `/admin/api-config`
2. Click "Add API Configuration"
3. Select the service (e.g., Stripe)
4. Paste your API key
5. Click "Save Configuration"

### Switch Email Providers
1. Go to `/admin/email-config`
2. Select a new provider (SendGrid/Mailgun/SMTP)
3. Enter required credentials
4. Click "Save Configuration"

### Adjust Trial Period
1. Go to `/admin/settings`
2. Change "Trial Period (days)"
3. Click "Save Settings"

### Enable/Disable Features
1. Go to `/admin/settings`
2. Toggle feature flags on/off:
   - Drip Campaigns
   - AI Features
   - Reports
3. Click "Save Settings"

## API Testing

You can test admin endpoints directly using curl:

```bash
# Get dashboard metrics
curl -H "Authorization: Bearer admin-token-secret" \
  http://localhost:8000/api/admin/dashboard/

# Get signups
curl -H "Authorization: Bearer admin-token-secret" \
  http://localhost:8000/api/admin/signups/?limit=10&offset=0

# Get settings
curl -H "Authorization: Bearer admin-token-secret" \
  http://localhost:8000/api/admin/settings/

# Update settings
curl -X POST \
  -H "Authorization: Bearer admin-token-secret" \
  -H "Content-Type: application/json" \
  -d '{"trial_days": 21}' \
  http://localhost:8000/api/admin/settings/
```

## Troubleshooting

### "Unauthorized" Error
- Check that the admin token is saved in localStorage
- Try logging in again at `/admin/signin`
- Verify backend is running on `http://localhost:8000`

### Backend Connection Error
- Make sure Django dev server is running: `python manage.py runserver`
- Check port 8000 is not blocked
- Verify frontend is trying to reach `http://localhost:8000`

### API Key Not Saving
- Check that all required fields are filled
- Verify API key format is correct
- Check browser console for error messages
- Review Django server logs

### Email Configuration Issues
- For SendGrid: Verify API key starts with `SG.`
- For Mailgun: Ensure domain includes `mg.` prefix
- For SMTP: Test connection details with telnet/ping first
- Check that port is correct (usually 587 for TLS, 25 for plain)

## Security Notes

### Development vs Production
This admin panel uses simple password authentication for development.

**In production, you MUST:**
- [ ] Implement proper authentication (OAuth, JWT, SSO)
- [ ] Use HTTPS/TLS encryption
- [ ] Store API keys encrypted
- [ ] Enable CSRF protection
- [ ] Add audit logging
- [ ] Implement role-based access control
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting on admin endpoints

### Best Practices
- **Never share admin credentials** - Use environment variables
- **Rotate API keys regularly** - Update integrated service credentials
- **Monitor admin access logs** - Track who accesses what and when
- **Use strong passwords** - If using password auth
- **Backup regularly** - Protect admin configuration data

## Support

If you encounter issues:
1. Check [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for detailed documentation
2. Review Django/Next.js server logs for errors
3. Test API endpoints directly with curl
4. Check that all services (backend, frontend) are running

---

**Current Admin Panel Password (Dev):** `admin123`

Change this in production!
