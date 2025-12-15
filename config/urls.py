from django.contrib import admin
from django.urls import path
from django.views.generic.base import RedirectView
from billing.views import stripe_webhook, trial_status, get_subscription, create_checkout_session
from contacts.views import contacts_api, contact_detail, export_contacts_csv, drip_campaigns_report
from admin_panel.views import (
    admin_dashboard,
    list_signups,
    api_configuration_list,
    email_configuration,
    admin_settings,
    admin_reports,
)
from automation.views import (
    automation_templates,
    automation_campaigns,
    automation_campaign_detail,
    automation_calendar,
    automation_stats,
)
from integrations.views import (
    integrations_list,
    integration_detail,
    configure_email_integration,
    configure_whatsapp_integration,
    configure_sms_integration,
    configure_signup_integration,
    configure_facebook_integration,
    test_integration,
    integration_logs,
    integration_stats,
)

urlpatterns = [
    # Redirect root to the frontend dev server
    path('', RedirectView.as_view(url='http://localhost:3000/', permanent=False)),
    path('admin/', admin.site.urls),
    
    # Admin API endpoints
    path('api/admin/dashboard/', admin_dashboard, name='admin_dashboard'),
    path('api/admin/signups/', list_signups, name='list_signups'),
    path('api/admin/api-config/', api_configuration_list, name='api_configuration_list'),
    path('api/admin/email-config/', email_configuration, name='email_configuration'),
    path('api/admin/settings/', admin_settings, name='admin_settings'),
    path('api/admin/reports/', admin_reports, name='admin_reports'),
    
    # Stripe webhook
    path('stripe/webhook/', stripe_webhook, name='stripe_webhook'),
    
    # Contacts API
    path('api/contacts/export/csv/', export_contacts_csv, name='export_contacts_csv'),
    path('api/reports/drip-campaigns/', drip_campaigns_report, name='drip_campaigns_report'),
    path('api/contacts/<int:contact_id>/', contact_detail, name='contact_detail'),
    path('api/contacts/', contacts_api, name='contacts_api'),
    
    # Billing API
    path('api/billing/trial-status/', trial_status, name='trial_status'),
    path('api/billing/subscription/', get_subscription, name='get_subscription'),
    path('api/billing/create-checkout-session/', create_checkout_session, name='create_checkout_session'),
    
    # Automation API
    path('api/automation/templates/', automation_templates, name='automation_templates'),
    path('api/automation/campaigns/', automation_campaigns, name='automation_campaigns'),
    path('api/automation/campaigns/<int:campaign_id>/', automation_campaign_detail, name='automation_campaign_detail'),
    path('api/automation/calendar/', automation_calendar, name='automation_calendar'),
    path('api/automation/stats/', automation_stats, name='automation_stats'),
    
    # Integrations API
    path('api/integrations/', integrations_list, name='integrations_list'),
    path('api/integrations/<int:integration_id>/', integration_detail, name='integration_detail'),
    path('api/integrations/<int:integration_id>/configure/email/', configure_email_integration, name='configure_email_integration'),
    path('api/integrations/<int:integration_id>/configure/whatsapp/', configure_whatsapp_integration, name='configure_whatsapp_integration'),
    path('api/integrations/<int:integration_id>/configure/sms/', configure_sms_integration, name='configure_sms_integration'),
    path('api/integrations/<int:integration_id>/configure/signup/', configure_signup_integration, name='configure_signup_integration'),
    path('api/integrations/<int:integration_id>/configure/facebook/', configure_facebook_integration, name='configure_facebook_integration'),
    path('api/integrations/<int:integration_id>/test/', test_integration, name='test_integration'),
    path('api/integrations/<int:integration_id>/logs/', integration_logs, name='integration_logs'),
    path('api/integrations/stats/', integration_stats, name='integration_stats'),
]
