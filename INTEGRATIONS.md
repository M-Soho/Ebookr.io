# Integrations Management System

## Overview
The integrations section provides a centralized hub for connecting and managing third-party services. Users can configure multiple channels for communication, lead capture, and automation.

## Supported Integrations

### 1. Email Services
Connect your email provider to send automated emails, newsletters, and transactional messages.

**Supported Providers:**
- **SendGrid** - Popular email API service
- **Mailgun** - Email service for developers
- **AWS SES** - Amazon Simple Email Service
- **SMTP** - Generic SMTP server connection
- **Mailchimp** - Email marketing platform

**Configuration Fields:**
- From Email (required)
- From Name
- Reply-To Email
- API Key (for API-based providers)
- SMTP settings (for SMTP provider)
- AWS credentials (for AWS SES)

### 2. WhatsApp Business API
Send messages through WhatsApp Business API for direct customer communication.

**Configuration Fields:**
- Phone Number ID (required)
- Business Account ID (required)
- Access Token (required)
- Webhook URL
- Webhook Verify Token

**Use Cases:**
- Order confirmations
- Appointment reminders
- Customer support
- Marketing messages (with opt-in)

### 3. SMS Services
Send text messages via major SMS gateway providers.

**Supported Providers:**
- **Twilio** - Leading SMS API platform
- **Vonage (Nexmo)** - Global SMS provider
- **AWS SNS** - Amazon Simple Notification Service
- **Plivo** - Cloud communication platform

**Configuration Fields:**
- From Phone Number (required)
- Account SID / API Key
- Auth Token / API Secret
- AWS credentials (for AWS SNS)

### 4. Sign Up Pages
Capture leads from landing pages, forms, and embedded widgets.

**Configuration Fields:**
- Page URL
- Embed Code
- API Endpoint
- API Key
- Form Fields (JSON configuration)
- Redirect URL (after sign-up)
- Auto-create Contact (toggle)
- Apply Tag (optional)
- Trigger Campaign ID (optional)

**Features:**
- Automatic contact creation
- Tag assignment
- Campaign triggering
- Form customization

### 5. Facebook Integration
Connect Facebook Lead Ads and Messenger for lead capture and engagement.

**Configuration Fields:**
- App ID (required)
- App Secret (required)
- Access Token (required)
- Page ID
- Page Access Token
- Enable Lead Ads (toggle)
- Lead Form ID
- Enable Messenger (toggle)
- Webhook URL
- Webhook Verify Token
- Auto-create Contacts (toggle)
- Trigger Campaign on Lead (optional)

**Features:**
- Lead Ads integration
- Messenger bot support
- Webhook notifications
- Automatic lead import

## API Endpoints

### Base Integration Management

#### List Integrations
```
GET /api/integrations/
Query Parameters:
  - type: Filter by integration type (email, whatsapp, sms, signup_page, facebook)
```

#### Create Integration
```
POST /api/integrations/
Body: {
  "integration_type": "email",
  "name": "My Email Service",
  "provider": "sendgrid"
}
```

#### Get Integration Details
```
GET /api/integrations/<id>/
```

#### Update Integration
```
PUT /api/integrations/<id>/
Body: {
  "name": "Updated Name",
  "is_active": true,
  "status": "active"
}
```

#### Delete Integration
```
DELETE /api/integrations/<id>/
```

### Configuration Endpoints

#### Configure Email Integration
```
POST /api/integrations/<id>/configure/email/
Body: {
  "provider": "sendgrid",
  "from_email": "noreply@example.com",
  "from_name": "My Company",
  "api_key": "SG.xxxxx"
}
```

#### Configure WhatsApp Integration
```
POST /api/integrations/<id>/configure/whatsapp/
Body: {
  "phone_number_id": "123456789",
  "business_account_id": "987654321",
  "access_token": "EAAxxxxx"
}
```

#### Configure SMS Integration
```
POST /api/integrations/<id>/configure/sms/
Body: {
  "provider": "twilio",
  "from_phone_number": "+1234567890",
  "account_sid": "ACxxxxx",
  "auth_token": "xxxxx"
}
```

#### Configure Sign Up Page Integration
```
POST /api/integrations/<id>/configure/signup/
Body: {
  "page_url": "https://mysite.com/signup",
  "auto_create_contact": true,
  "apply_tag": "Newsletter"
}
```

#### Configure Facebook Integration
```
POST /api/integrations/<id>/configure/facebook/
Body: {
  "app_id": "123456789",
  "app_secret": "xxxxx",
  "access_token": "EAAxxxxx",
  "enable_lead_ads": true
}
```

### Testing & Monitoring

#### Test Integration
```
POST /api/integrations/<id>/test/
```

#### Get Integration Logs
```
GET /api/integrations/<id>/logs/
```

#### Get Integration Statistics
```
GET /api/integrations/stats/
```

## Frontend Usage

### Navigate to Integrations
Access the integrations page at `/integrations`

### Add New Integration
1. Click on an integration card (Email, WhatsApp, SMS, Sign Up Page, or Facebook)
2. Fill in the required configuration fields
3. Click "Create" to save
4. Test the connection using the test button

### Edit Integration
1. Click the settings icon on an existing integration
2. Modify the configuration fields
3. Click "Update" to save changes

### Test Connection
Click the refresh icon next to any integration to test the connection and verify credentials.

### Delete Integration
Click the trash icon to remove an integration (requires confirmation).

## Database Models

### Integration (Base Model)
- `owner` - User who owns the integration
- `integration_type` - Type of integration (email, whatsapp, etc.)
- `name` - Display name
- `provider` - Service provider
- `status` - Current status (active, inactive, error, pending)
- `is_active` - Active/inactive toggle
- `config` - JSON field for general configuration
- `last_sync_at` - Last successful sync timestamp
- `last_error` - Last error message
- `error_count` - Number of consecutive errors

### EmailIntegration
Stores email-specific configuration including API keys, SMTP settings, and AWS credentials.

### WhatsAppIntegration
Stores WhatsApp Business API credentials and webhook configuration.

### SMSIntegration
Stores SMS provider credentials (Twilio, Vonage, AWS SNS, Plivo).

### SignUpPageIntegration
Stores sign-up page configuration, form fields, and automation settings.

### FacebookIntegration
Stores Facebook app credentials, Lead Ads, and Messenger configuration.

### IntegrationLog
Tracks all integration activities, errors, and status changes.

## Setup Instructions

1. **Run Migrations:**
   ```bash
   python manage.py makemigrations integrations
   python manage.py migrate
   ```

2. **Start Backend:**
   ```bash
   python manage.py runserver
   ```

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access Integrations:**
   Navigate to http://localhost:3000/integrations

## Security Considerations

- All API keys and tokens are stored in the database
- Sensitive fields (passwords, tokens) should be encrypted at rest in production
- Use environment variables for system-wide credentials
- Implement rate limiting on test endpoints
- Validate webhook signatures for external services
- Use HTTPS for all webhook endpoints

## Best Practices

1. **Test Before Activating**: Always test connections before marking integrations as active
2. **Monitor Logs**: Regularly check integration logs for errors
3. **Backup Credentials**: Keep a secure backup of API keys and credentials
4. **Rotate Keys**: Periodically rotate API keys and access tokens
5. **Use Separate Accounts**: Use different accounts for development and production
6. **Set Up Webhooks**: Configure webhooks for real-time data sync
7. **Handle Rate Limits**: Respect API rate limits of third-party services

## Troubleshooting

### Email Integration Issues
- Verify SMTP credentials and port settings
- Check if the sender email is verified with the provider
- Review SPF, DKIM, and DMARC records
- Test with a simple email first

### WhatsApp Issues
- Ensure WhatsApp Business API is properly set up
- Verify phone number is registered with WhatsApp Business
- Check webhook URL is accessible
- Review message templates are approved

### SMS Issues
- Verify phone number format includes country code
- Check account balance with SMS provider
- Ensure sender ID is registered if required
- Test with a small message first

### Sign Up Page Issues
- Verify API endpoint is accessible
- Check CORS settings if using browser-based forms
- Test with a simple form first
- Review webhook logs

### Facebook Issues
- Verify Facebook app is in production mode
- Check all required permissions are granted
- Ensure webhooks are subscribed to correct events
- Review Facebook API version compatibility

## Future Enhancements

- **Additional Integrations**: Slack, Discord, LinkedIn, Instagram
- **OAuth Support**: Simplified authentication flows
- **Webhook Management**: Visual webhook testing and debugging
- **Message Templates**: Store and manage message templates
- **A/B Testing**: Test different messaging strategies
- **Analytics**: Track delivery rates, open rates, and engagement
- **Sandbox Mode**: Test integrations without sending real messages
- **Bulk Operations**: Send messages to multiple contacts
- **Scheduled Sending**: Queue messages for future delivery
- **Failover Support**: Automatic fallback to backup providers
