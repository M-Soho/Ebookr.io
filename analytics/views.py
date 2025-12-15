from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.db.models import Count, Avg, Q, Sum
from datetime import timedelta, datetime
import json

from contacts.models import Contact, Activity, Task
from automation.models import AutomationCampaign
from .models import Metric, ConversionFunnel, LeadSource


@login_required
@require_http_methods(["GET"])
def dashboard_summary(request):
    """Get dashboard summary with key metrics."""
    user = request.user
    
    # Date ranges
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Contact metrics
    total_contacts = Contact.objects.filter(owner=user).count()
    new_contacts_today = Contact.objects.filter(
        owner=user,
        created_at__gte=today_start
    ).count()
    new_contacts_week = Contact.objects.filter(
        owner=user,
        created_at__gte=week_ago
    ).count()
    new_contacts_month = Contact.objects.filter(
        owner=user,
        created_at__gte=month_ago
    ).count()
    
    # Lead metrics by status
    leads_by_status = Contact.objects.filter(owner=user).values('status').annotate(
        count=Count('id')
    )
    
    # Activity metrics
    activities_today = Activity.objects.filter(
        contact__owner=user,
        created_at__gte=today_start
    ).count()
    activities_week = Activity.objects.filter(
        contact__owner=user,
        created_at__gte=week_ago
    ).count()
    
    # Email metrics
    emails_sent_week = Activity.objects.filter(
        contact__owner=user,
        activity_type='email_sent',
        created_at__gte=week_ago
    ).count()
    emails_opened_week = Activity.objects.filter(
        contact__owner=user,
        activity_type='email_opened',
        created_at__gte=week_ago
    ).count()
    
    email_open_rate = 0
    if emails_sent_week > 0:
        email_open_rate = (emails_opened_week / emails_sent_week) * 100
    
    # Task metrics
    total_tasks = Task.objects.filter(contact__owner=user).count()
    completed_tasks = Task.objects.filter(
        contact__owner=user,
        status='completed'
    ).count()
    overdue_tasks = Task.objects.filter(
        contact__owner=user,
        status__in=['pending', 'in_progress'],
        due_date__lt=now
    ).count()
    
    # Campaign metrics
    active_campaigns = AutomationCampaign.objects.filter(
        owner=user,
        is_active=True
    ).count()
    
    # Average lead score
    avg_lead_score = Contact.objects.filter(owner=user).aggregate(
        avg_score=Avg('lead_score')
    )['avg_score'] or 0
    
    # Top performing contacts (by lead score)
    top_contacts = Contact.objects.filter(owner=user).order_by('-lead_score')[:5]
    top_contacts_data = [{
        'id': c.id,
        'name': f"{c.first_name} {c.last_name}",
        'email': c.email,
        'lead_score': c.lead_score,
        'status': c.status,
    } for c in top_contacts]
    
    # Recent activities
    recent_activities = Activity.objects.filter(
        contact__owner=user
    ).select_related('contact').order_by('-created_at')[:10]
    
    recent_activities_data = [{
        'id': a.id,
        'type': a.activity_type,
        'title': a.title,
        'contact_name': f"{a.contact.first_name} {a.contact.last_name}",
        'contact_id': a.contact.id,
        'created_at': a.created_at.isoformat(),
    } for a in recent_activities]
    
    return JsonResponse({
        'summary': {
            'total_contacts': total_contacts,
            'new_contacts_today': new_contacts_today,
            'new_contacts_week': new_contacts_week,
            'new_contacts_month': new_contacts_month,
            'activities_today': activities_today,
            'activities_week': activities_week,
            'emails_sent_week': emails_sent_week,
            'emails_opened_week': emails_opened_week,
            'email_open_rate': round(email_open_rate, 2),
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'overdue_tasks': overdue_tasks,
            'active_campaigns': active_campaigns,
            'avg_lead_score': round(avg_lead_score, 2),
        },
        'leads_by_status': list(leads_by_status),
        'top_contacts': top_contacts_data,
        'recent_activities': recent_activities_data,
    })


@login_required
@require_http_methods(["GET"])
def contacts_over_time(request):
    """Get contact growth over time."""
    user = request.user
    period = request.GET.get('period', '30')  # days
    
    try:
        days = int(period)
    except ValueError:
        days = 30
    
    now = timezone.now()
    start_date = now - timedelta(days=days)
    
    # Get contacts created each day
    contacts_by_day = []
    current_date = start_date
    
    while current_date <= now:
        next_date = current_date + timedelta(days=1)
        count = Contact.objects.filter(
            owner=user,
            created_at__gte=current_date,
            created_at__lt=next_date
        ).count()
        
        contacts_by_day.append({
            'date': current_date.date().isoformat(),
            'count': count,
        })
        
        current_date = next_date
    
    # Calculate cumulative
    total = 0
    cumulative_data = []
    for item in contacts_by_day:
        total += item['count']
        cumulative_data.append({
            'date': item['date'],
            'total': total,
        })
    
    return JsonResponse({
        'period_days': days,
        'daily_counts': contacts_by_day,
        'cumulative': cumulative_data,
    })


@login_required
@require_http_methods(["GET"])
def activity_breakdown(request):
    """Get activity breakdown by type."""
    user = request.user
    period = request.GET.get('period', '30')
    
    try:
        days = int(period)
    except ValueError:
        days = 30
    
    start_date = timezone.now() - timedelta(days=days)
    
    activities = Activity.objects.filter(
        contact__owner=user,
        created_at__gte=start_date
    ).values('activity_type').annotate(count=Count('id'))
    
    return JsonResponse({
        'period_days': days,
        'activities': list(activities),
    })


@login_required
@require_http_methods(["GET"])
def conversion_funnel_data(request):
    """Get conversion funnel data."""
    user = request.user
    period = request.GET.get('period', '30')
    
    try:
        days = int(period)
    except ValueError:
        days = 30
    
    start_date = timezone.now() - timedelta(days=days)
    
    # Count contacts by status
    lead_count = Contact.objects.filter(
        owner=user,
        created_at__gte=start_date,
        status='lead'
    ).count()
    
    contacted_count = Contact.objects.filter(
        owner=user,
        created_at__gte=start_date,
        status__in=['contacted', 'qualified', 'proposal', 'negotiation', 'customer']
    ).count()
    
    qualified_count = Contact.objects.filter(
        owner=user,
        created_at__gte=start_date,
        status__in=['qualified', 'proposal', 'negotiation', 'customer']
    ).count()
    
    proposal_count = Contact.objects.filter(
        owner=user,
        created_at__gte=start_date,
        status__in=['proposal', 'negotiation', 'customer']
    ).count()
    
    won_count = Contact.objects.filter(
        owner=user,
        created_at__gte=start_date,
        status='customer'
    ).count()
    
    # Calculate conversion rates
    def calc_rate(current, previous):
        if previous == 0:
            return 0
        return round((current / previous) * 100, 2)
    
    funnel_data = [
        {
            'stage': 'Lead',
            'count': lead_count,
            'conversion_rate': 100,
        },
        {
            'stage': 'Contacted',
            'count': contacted_count,
            'conversion_rate': calc_rate(contacted_count, lead_count),
        },
        {
            'stage': 'Qualified',
            'count': qualified_count,
            'conversion_rate': calc_rate(qualified_count, contacted_count),
        },
        {
            'stage': 'Proposal',
            'count': proposal_count,
            'conversion_rate': calc_rate(proposal_count, qualified_count),
        },
        {
            'stage': 'Won',
            'count': won_count,
            'conversion_rate': calc_rate(won_count, proposal_count),
        },
    ]
    
    overall_conversion = calc_rate(won_count, lead_count) if lead_count > 0 else 0
    
    return JsonResponse({
        'period_days': days,
        'funnel': funnel_data,
        'overall_conversion_rate': overall_conversion,
    })


@login_required
@require_http_methods(["GET"])
def lead_source_analytics(request):
    """Get lead source performance analytics."""
    user = request.user
    period = request.GET.get('period', '30')
    
    try:
        days = int(period)
    except ValueError:
        days = 30
    
    start_date = timezone.now() - timedelta(days=days)
    
    # Get contacts grouped by source
    contacts_by_source = Contact.objects.filter(
        owner=user,
        created_at__gte=start_date
    ).exclude(
        Q(source__isnull=True) | Q(source='')
    ).values('source').annotate(
        total=Count('id'),
        qualified=Count('id', filter=Q(status__in=['qualified', 'proposal', 'negotiation', 'customer'])),
        converted=Count('id', filter=Q(status='customer')),
        avg_score=Avg('lead_score'),
    )
    
    source_data = []
    for item in contacts_by_source:
        conversion_rate = 0
        if item['total'] > 0:
            conversion_rate = round((item['converted'] / item['total']) * 100, 2)
        
        source_data.append({
            'source': item['source'],
            'total_leads': item['total'],
            'qualified_leads': item['qualified'],
            'converted_leads': item['converted'],
            'avg_lead_score': round(item['avg_score'] or 0, 2),
            'conversion_rate': conversion_rate,
        })
    
    # Sort by total leads descending
    source_data.sort(key=lambda x: x['total_leads'], reverse=True)
    
    return JsonResponse({
        'period_days': days,
        'sources': source_data,
    })


@login_required
@require_http_methods(["GET"])
def task_performance(request):
    """Get task completion performance."""
    user = request.user
    period = request.GET.get('period', '30')
    
    try:
        days = int(period)
    except ValueError:
        days = 30
    
    start_date = timezone.now() - timedelta(days=days)
    
    # Task metrics
    tasks_by_status = Task.objects.filter(
        contact__owner=user,
        created_at__gte=start_date
    ).values('status').annotate(count=Count('id'))
    
    tasks_by_priority = Task.objects.filter(
        contact__owner=user,
        created_at__gte=start_date
    ).values('priority').annotate(count=Count('id'))
    
    # Completion rate
    total_tasks = Task.objects.filter(
        contact__owner=user,
        created_at__gte=start_date
    ).count()
    
    completed_tasks = Task.objects.filter(
        contact__owner=user,
        created_at__gte=start_date,
        status='completed'
    ).count()
    
    completion_rate = 0
    if total_tasks > 0:
        completion_rate = round((completed_tasks / total_tasks) * 100, 2)
    
    return JsonResponse({
        'period_days': days,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'completion_rate': completion_rate,
        'by_status': list(tasks_by_status),
        'by_priority': list(tasks_by_priority),
    })


@login_required
@require_http_methods(["GET"])
def campaign_performance(request):
    """Get campaign performance metrics."""
    user = request.user
    
    campaigns = AutomationCampaign.objects.filter(owner=user)
    
    campaign_data = []
    for campaign in campaigns:
        # Count steps in campaign
        steps_count = campaign.steps.count() if hasattr(campaign, 'steps') else 0
        
        campaign_data.append({
            'id': campaign.id,
            'name': campaign.name,
            'is_active': campaign.is_active,
            'steps_count': steps_count,
            'created_at': campaign.created_at.isoformat(),
        })
    
    return JsonResponse({
        'campaigns': campaign_data,
    })


@login_required
@require_http_methods(["GET"])
def export_analytics(request):
    """Export analytics data as CSV."""
    # This would generate a CSV file with all analytics
    # For now, return JSON that frontend can convert
    user = request.user
    
    return JsonResponse({
        'message': 'Export functionality - implement CSV generation',
    })
