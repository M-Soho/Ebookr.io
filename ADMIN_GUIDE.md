# Ebookr.io - Admin Panel Guide

## Overview

The Admin Panel is a comprehensive management interface for Ebookr.io that allows administrators to:
- Monitor user signups and analytics
- Manage API integrations (Stripe, SendGrid, Mailgun, Twilio, Anthropic)
- Configure email providers (SendGrid, Mailgun, SMTP)
- Control global settings and feature flags
- View detailed reports and analytics

## Accessing the Admin Panel

### Frontend
1. Navigate to `/admin/signin`
2. Enter admin password: `admin123` (development only - change in production!)
3. You'll be redirected to the admin dashboard

### Security Note
The current authentication is a simple Bearer token system for development. In production, implement:
- Proper OAuth 2.0 or JWT-based authentication
- Database-backed user roles and permissions
- Encrypted credential storage
- Audit logging for all admin actions

## Admin Features

### 1. Dashboard (`/admin`)
Displays key metrics:
- **Total Signups**: Overall user registration count
- **Last 7 Days**: Recent signup activity
- **Total Contacts**: Active contact records in the system
- **Active Campaigns**: Currently running drip campaigns
- **Tier Breakdown**: Distribution of Pro users

### 2. Signups Management (`/admin/signups`)
- View all user signups in a paginated table
- Filter by tier (Pro)
- Export signup data
- Track signup dates and user tiers

### 3. API Configuration (`/admin/api-config`)
Manage integrations for:
- **Stripe**: Payment processing
- **SendGrid**: Email delivery
- **Mailgun**: Email management
- **Twilio**: SMS/messaging
- **Anthropic**: AI features (Claude)

Each API configuration stores:
- Service name
- Encrypted API key (masked in UI)
- Active/inactive status
- Created/updated timestamps

### 4. Email Configuration (`/admin/email-config`)
Configure email sending provider with three options:
- **SendGrid**: Requires API key
- **Mailgun**: Requires domain and API key
- **SMTP**: Requires host, port, username, password, TLS settings

### 5. Global Settings (`/admin/settings`)
Control app-wide settings:
- **Trial Period**: Number of days for free trial (default: 14)
- **Feature Flags**:
  - Drip Campaigns enabled/disabled
  - AI Features enabled/disabled
  - Reports enabled/disabled
- **Rate Limiting**: Requests per hour per user (default: 1000)

### 6. Reports (`/admin/reports`)
View comprehensive analytics:
- **30-Day Signup Trends**: Line chart of daily signups
- **Tier Distribution**: Distribution of Pro users
- **Contact Statistics**: Total contacts and breakdown by type
- **Campaign Statistics**: Active/draft/completed campaign counts

## API Endpoints

All admin endpoints require the `Authorization: Bearer admin-token-secret` header.

### Dashboard Metrics
```
GET /api/admin/dashboard/
```
Returns:
- `total_signups`: Total number of signups
- `tier_breakdown`: Count by tier
- `signups_7days`: Signups in last 7 days
- `total_contacts`: Total contacts in system
- `active_campaigns`: Currently active campaigns

### List Signups
```
GET /api/admin/signups/?limit=10&offset=0
```
Returns paginated list of signups with:
- User ID, name, email
- Subscription tier
- Created/updated dates

### API Configuration
```
GET /api/admin/api-config/
POST /api/admin/api-config/
```
Get all configs or create/update a specific service:
```json
{
  "service": "stripe",
  "api_key": "sk_live_xxx"
}
```

### Email Configuration
```
GET /api/admin/email-config/
POST /api/admin/email-config/
```
Example for SendGrid:
```json
{
  "provider": "sendgrid",
  "sendgrid_api_key": "SG.xxx"
}
```

Example for SMTP:
```json
{
  "provider": "smtp",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_user": "email@gmail.com",
  "smtp_password": "password",
  "smtp_use_tls": true
}
```

### Global Settings
```
GET /api/admin/settings/
POST /api/admin/settings/
```
Get/update settings:
```json
{
  "trial_days": 14,
  "enable_drip_campaigns": true,
  "enable_ai_features": true,
  "enable_reports": true,
  "rate_limit_requests_per_minute": 1000
}
```

### Reports
```
GET /api/admin/reports/
```
Returns:
- `signup_trends_30days`: Array of daily signup counts
- `tier_distribution`: Count by tier
- `contact_statistics`: Total and breakdown by type
- `campaign_statistics`: Total and breakdown by status

## Database Models

### AdminSignup
Tracks user signups:
- `name`: User's name
- `email`: User's email address
- `tier`: Subscription tier (pro)
- `user`: Optional reference to User model
- `created_at/updated_at`: Timestamps

### APIConfiguration
Stores API credentials:
- `service`: Service name (choices: stripe, sendgrid, mailgun, twilio, anthropic)
- `api_key`: Encrypted API key
- `api_secret`: Optional secret key
- `webhook_url`: Optional webhook endpoint
- `is_active`: Enable/disable this configuration

### EmailConfiguration
Email provider settings:
- `provider`: Email provider (sendgrid/mailgun/smtp)
- `from_email/from_name`: Sender information
- `sendgrid_api_key`: SendGrid specific
- `mailgun_domain/api_key`: Mailgun specific
- `smtp_host/port/username/password/use_tls`: SMTP specific
- `is_active`: Enable/disable

### AdminSettings
Global application settings:
- `trial_days`: Free trial duration
- `enable_drip_campaigns`: Feature flag
- `enable_ai_features`: Feature flag
- `enable_reports`: Feature flag
- `rate_limit_requests_per_minute`: Rate limit
- `welcome_email_enabled`: Welcome email toggle
- `welcome_email_template`: HTML template for welcome emails

## Development vs Production

### Development
- Password auth: `admin123`
- Token auth: `admin-token-secret`
- SQLite database
- API keys stored as plain text (for testing only)

### Production Checklist
- [ ] Implement proper authentication (OAuth, JWT, SSO)
- [ ] Enable HTTPS/TLS
- [ ] Encrypt API keys and secrets in database
- [ ] Add comprehensive audit logging
- [ ] Implement role-based access control (RBAC)
- [ ] Add rate limiting on admin endpoints
- [ ] Enable CSRF protection
- [ ] Set up admin email notifications for critical changes
- [ ] Implement webhook signing for all integrations
- [ ] Add API key rotation mechanism
- [ ] Use environment variables for all secrets
- [ ] Implement database backups
- [ ] Add monitoring and alerting

## Testing the Admin Panel

### Create Test Signups
```bash
python manage.py shell
from admin_panel.models import AdminSignup
AdminSignup.objects.create(name="Test User", email="test@example.com", tier="pro")
```

### Test API Endpoints
```bash
# Dashboard
curl -H "Authorization: Bearer admin-token-secret" \
  http://localhost:8000/api/admin/dashboard/

# Signups
curl -H "Authorization: Bearer admin-token-secret" \
  http://localhost:8000/api/admin/signups/?limit=10&offset=0

# Settings
curl -H "Authorization: Bearer admin-token-secret" \
  http://localhost:8000/api/admin/settings/
```

## Troubleshooting

### Admin pages not loading
- Check that you're logged in (token in localStorage)
- Verify backend is running on `http://localhost:8000`
- Check browser console for CORS errors

### API endpoints returning 401
- Verify the Bearer token is correct
- Check HTTP headers have `Authorization: Bearer admin-token-secret`

### Email configuration not saving
- Verify all required fields are filled
- Check that the provider is valid (sendgrid/mailgun/smtp)
- Review backend logs for validation errors

### Missing data in reports
- Ensure sample data exists in the database
- Check that Contacts and DripCampaigns have been created
- Verify timestamps are correct (reports use created_at fields)

## Future Enhancements

1. **Email Templates**: Visual builder for welcome/notification emails
2. **Webhook Management**: UI to manage and test webhooks
3. **User Management**: Admin panel for managing user accounts
4. **Activity Logs**: Full audit trail of admin actions
5. **Bulk Operations**: Import/export signups, bulk email sends
6. **Advanced Reports**: Custom date ranges, export to PDF
7. **Integration Health**: Monitor API connectivity and health
8. **Alert Configuration**: Set up alerts for key metrics
9. **Two-Factor Authentication**: Strengthen admin security
10. **API Token Management**: Allow admins to generate API tokens for automation

## Support & Documentation

For more information about Ebookr features:
- Contact: [support email]
- Documentation: [wiki/docs URL]
- GitHub Issues: [repo URL]
