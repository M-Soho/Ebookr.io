from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import RedirectView
from billing.views import stripe_webhook, get_subscription, create_checkout_session
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
from contacts.email_views import (
    send_email,
    send_template_email,
    email_templates,
    create_email_template,
)
from contacts.notification_views import (
    notifications_list,
    mark_notification_read,
    mark_all_read,
    delete_notification,
    notification_preferences,
    update_notification_preferences,
)
from contacts.bulk_operations import (
    bulk_delete_contacts,
    bulk_update_status,
    bulk_add_tags,
    bulk_remove_tags,
    bulk_delete_tasks,
    bulk_complete_tasks,
    bulk_update_contact_cadence,
)
from contacts.search_views import (
    global_search,
    advanced_contact_search,
    advanced_task_search,
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
from automation.automation_views import (
    automation_rules_list,
    automation_rule_detail,
    schedule_follow_up_sequence,
    schedule_recurring_tasks,
    task_batches_list,
    automation_stats as task_automation_stats,
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
    
    # New Admin Panel System Monitoring (all endpoints)
    path('api/admin/', include('admin_panel.urls')),
    
    # Legacy Admin API endpoints (keep for backward compatibility)
    path('api/admin-legacy/dashboard/', admin_dashboard, name='admin_dashboard'),
    path('api/admin-legacy/signups/', list_signups, name='list_signups'),
    path('api/admin-legacy/api-config/', api_configuration_list, name='api_configuration_list'),
    path('api/admin-legacy/email-config/', email_configuration, name='email_configuration'),
    path('api/admin-legacy/settings/', admin_settings, name='admin_settings'),
    path('api/admin-legacy/reports/', admin_reports, name='admin_reports'),
    
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
    
    # Email API
    path('api/contacts/send-email/', send_email, name='send_email'),
    path('api/contacts/send-template-email/', send_template_email, name='send_template_email'),
    path('api/contacts/email-templates/', email_templates, name='email_templates'),
    path('api/contacts/email-templates/create/', create_email_template, name='create_email_template'),
    
    # Notifications API
    path('api/notifications/', notifications_list, name='notifications_list'),
    path('api/notifications/<int:notification_id>/mark-read/', mark_notification_read, name='mark_notification_read'),
    path('api/notifications/mark-all-read/', mark_all_read, name='mark_all_read'),
    path('api/notifications/<int:notification_id>/', delete_notification, name='delete_notification'),
    path('api/notifications/preferences/', notification_preferences, name='notification_preferences'),
    path('api/notifications/preferences/update/', update_notification_preferences, name='update_notification_preferences'),
    
    # Bulk Operations API
    path('api/contacts/bulk-delete/', bulk_delete_contacts, name='bulk_delete_contacts'),
    path('api/contacts/bulk-update-status/', bulk_update_status, name='bulk_update_status'),
    path('api/contacts/bulk-add-tags/', bulk_add_tags, name='bulk_add_tags'),
    path('api/contacts/bulk-remove-tags/', bulk_remove_tags, name='bulk_remove_tags'),
    path('api/contacts/bulk-update-cadence/', bulk_update_contact_cadence, name='bulk_update_contact_cadence'),
    path('api/tasks/bulk-delete/', bulk_delete_tasks, name='bulk_delete_tasks'),
    path('api/tasks/bulk-complete/', bulk_complete_tasks, name='bulk_complete_tasks'),
    
    # Search API
    path('api/search/', global_search, name='global_search'),
    path('api/contacts/search/', advanced_contact_search, name='advanced_contact_search'),
    path('api/tasks/search/', advanced_task_search, name='advanced_task_search'),
    
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
    path('api/billing/subscription/', get_subscription, name='get_subscription'),
    path('api/billing/create-checkout-session/', create_checkout_session, name='create_checkout_session'),
    
    # Automation API
    path('api/automation/templates/', automation_templates, name='automation_templates'),
    path('api/automation/campaigns/', automation_campaigns, name='automation_campaigns'),
    path('api/automation/campaigns/<int:campaign_id>/', automation_campaign_detail, name='automation_campaign_detail'),
    path('api/automation/calendar/', automation_calendar, name='automation_calendar'),
    path('api/automation/stats/', automation_stats, name='automation_stats'),
    
    # Task Automation API
    path('api/task-automation/rules/', automation_rules_list, name='automation_rules_list'),
    path('api/task-automation/rules/<int:rule_id>/', automation_rule_detail, name='automation_rule_detail'),
    path('api/task-automation/schedule-sequence/', schedule_follow_up_sequence, name='schedule_follow_up_sequence'),
    path('api/task-automation/schedule-recurring/', schedule_recurring_tasks, name='schedule_recurring_tasks'),
    path('api/task-automation/batches/', task_batches_list, name='task_batches_list'),
    path('api/task-automation/stats/', task_automation_stats, name='task_automation_stats'),
    
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
