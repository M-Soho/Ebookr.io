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
]
