from django.contrib import admin
from django.urls import path
from django.views.generic.base import RedirectView
from billing.views import stripe_webhook, trial_status, get_subscription, create_checkout_session
from contacts.views import contacts_api, contact_detail, export_contacts_csv, drip_campaigns_report
from contacts.views_extended import (
    tags_list,
    tag_detail,
    contact_tags,
    activities_list,
    templates_list,
    template_detail,
    tasks_list,
    task_detail,
    segments_list,
    segment_detail,
    bulk_import_contacts,
    export_template_csv,
)
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
from automation.workflow_views import (
    workflows_list,
    workflow_detail,
    enroll_contact_in_workflow,
    workflow_enrollments,
    ab_tests_list,
    workflow_templates_list,
    create_workflow_from_template,
    test_workflow_condition,
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
from analytics.views import (
    dashboard_summary,
    contacts_over_time,
    activity_breakdown,
    conversion_funnel_data,
    lead_source_analytics,
    task_performance,
    campaign_performance,
    export_analytics,
)
from teams.views import (
    teams_list,
    team_detail,
    team_members,
    invite_member,
    remove_member,
    comments_list,
    team_activity_feed,
)
from ai_features.views import (
    generate_email,
    email_templates,
    contact_scores,
    calculate_score,
    predictions,
    recommendations,
    analyze_sentiment,
)
from crm_integrations.views import (
    integrations_list as crm_integrations_list,
    integration_detail as crm_integration_detail,
    integration_sync,
    calendar_events,
    webhooks_list,
    webhook_detail,
    api_keys_list,
    sync_logs,
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
    path('api/contacts/import/template/', export_template_csv, name='export_template_csv'),
    path('api/contacts/bulk-import/', bulk_import_contacts, name='bulk_import_contacts'),
    path('api/reports/drip-campaigns/', drip_campaigns_report, name='drip_campaigns_report'),
    path('api/contacts/<int:contact_id>/', contact_detail, name='contact_detail'),
    path('api/contacts/<int:contact_id>/tags/', contact_tags, name='contact_tags'),
    path('api/contacts/', contacts_api, name='contacts_api'),
    
    # Tags API
    path('api/tags/<int:tag_id>/', tag_detail, name='tag_detail'),
    path('api/tags/', tags_list, name='tags_list'),
    
    # Activities API
    path('api/activities/', activities_list, name='activities_list'),
    
    # Templates API
    path('api/templates/<int:template_id>/', template_detail, name='template_detail'),
    path('api/templates/', templates_list, name='templates_list'),
    
    # Tasks API
    path('api/tasks/<int:task_id>/', task_detail, name='task_detail'),
    path('api/tasks/', tasks_list, name='tasks_list'),
    
    # Segments API
    path('api/segments/<int:segment_id>/', segment_detail, name='segment_detail'),
    path('api/segments/', segments_list, name='segments_list'),
    
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
    
    # Workflow API
    path('api/workflows/', workflows_list, name='workflows_list'),
    path('api/workflows/<int:workflow_id>/', workflow_detail, name='workflow_detail'),
    path('api/workflows/<int:workflow_id>/enroll/', enroll_contact_in_workflow, name='enroll_contact_in_workflow'),
    path('api/workflows/<int:workflow_id>/enrollments/', workflow_enrollments, name='workflow_enrollments'),
    path('api/workflows/ab-tests/', ab_tests_list, name='ab_tests_list'),
    path('api/workflows/templates/', workflow_templates_list, name='workflow_templates_list'),
    path('api/workflows/templates/<int:template_id>/create/', create_workflow_from_template, name='create_workflow_from_template'),
    path('api/workflows/test-condition/', test_workflow_condition, name='test_workflow_condition'),
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
    
    # Teams API
    path('api/teams/', teams_list, name='teams_list'),
    path('api/teams/<int:team_id>/', team_detail, name='team_detail'),
    path('api/teams/<int:team_id>/members/', team_members, name='team_members'),
    path('api/teams/<int:team_id>/invite/', invite_member, name='invite_member'),
    path('api/teams/<int:team_id>/members/<int:member_id>/remove/', remove_member, name='remove_member'),
    path('api/teams/<int:team_id>/activity/', team_activity_feed, name='team_activity_feed'),
    path('api/comments/', comments_list, name='comments_list'),
    
    # Analytics API
    path('api/analytics/dashboard/', dashboard_summary, name='dashboard_summary'),
    path('api/analytics/contacts-over-time/', contacts_over_time, name='contacts_over_time'),
    path('api/analytics/activity-breakdown/', activity_breakdown, name='activity_breakdown'),
    path('api/analytics/conversion-funnel/', conversion_funnel_data, name='conversion_funnel_data'),
    path('api/analytics/lead-sources/', lead_source_analytics, name='lead_source_analytics'),
    path('api/analytics/task-performance/', task_performance, name='task_performance'),
    path('api/analytics/campaign-performance/', campaign_performance, name='campaign_performance'),
    path('api/analytics/export/', export_analytics, name='export_analytics'),
    
    # Phase 4: AI Features API
    path('api/ai/generate-email/', generate_email, name='ai_generate_email'),
    path('api/ai/email-templates/', email_templates, name='ai_email_templates'),
    path('api/ai/contact-scores/', contact_scores, name='ai_contact_scores'),
    path('api/ai/contacts/<int:contact_id>/calculate-score/', calculate_score, name='ai_calculate_score'),
    path('api/ai/predictions/', predictions, name='ai_predictions'),
    path('api/ai/recommendations/', recommendations, name='ai_recommendations'),
    path('api/ai/analyze-sentiment/', analyze_sentiment, name='ai_analyze_sentiment'),
    
    # Phase 5: CRM Integrations API
    path('api/crm-integrations/', crm_integrations_list, name='crm_integrations_list'),
    path('api/crm-integrations/<int:integration_id>/', crm_integration_detail, name='crm_integration_detail'),
    path('api/crm-integrations/<int:integration_id>/sync/', integration_sync, name='crm_integration_sync'),
    path('api/crm-integrations/calendar-events/', calendar_events, name='crm_calendar_events'),
    path('api/crm-integrations/webhooks/', webhooks_list, name='crm_webhooks_list'),
    path('api/crm-integrations/webhooks/<int:webhook_id>/', webhook_detail, name='crm_webhook_detail'),
    path('api/crm-integrations/api-keys/', api_keys_list, name='crm_api_keys_list'),
    path('api/crm-integrations/sync-logs/', sync_logs, name='crm_sync_logs'),
]
