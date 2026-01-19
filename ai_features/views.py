"""Phase 4: AI Features API Views"""

import json
import logging
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.core.paginator import Paginator

from contacts.models import Contact
from .models import (
    AIEmailTemplate,
    GeneratedEmail,
    ContactScore,
    PredictiveAnalytics,
    SmartRecommendation,
    SentimentAnalysis
)
from .services import (
    EmailGenerationService,
    ContactScoringService,
    SentimentAnalysisService
)

logger = logging.getLogger(__name__)


def get_user_from_request(request):
    """Extract user from request - mock user for development"""
    # In production, use request.user from auth middleware
    return getattr(request, 'user', None) or type('User', (), {'id': 1, 'username': 'testuser'})()


@csrf_exempt
@require_http_methods(["POST"])
def generate_email(request):
    """
    POST /api/ai/generate-email/
    Generate AI email content based on template and contact data.
    
    Body:
    {
        "contact_id": 123,
        "template_id": 456 (optional),
        "category": "follow_up" (optional),
        "tone": "professional" (optional),
        "custom_prompt": "..." (optional),
        "additional_context": {} (optional)
    }
    """
    try:
        user = get_user_from_request(request)
        data = json.loads(request.body)
        
        contact_id = data.get('contact_id')
        if not contact_id:
            return JsonResponse({'error': 'contact_id is required'}, status=400)
        
        try:
            contact = Contact.objects.get(id=contact_id, owner_id=user.id)
        except Contact.DoesNotExist:
            return JsonResponse({'error': 'Contact not found'}, status=404)
        
        # Get template if specified
        template = None
        template_id = data.get('template_id')
        if template_id:
            try:
                template = AIEmailTemplate.objects.get(id=template_id, owner_id=user.id)
            except AIEmailTemplate.DoesNotExist:
                pass
        
        # Generate email
        service = EmailGenerationService()
        start_time = datetime.now()
        
        email_data, error = service.generate_email(
            contact=contact,
            template=template,
            category=data.get('category', 'follow_up'),
            custom_prompt=data.get('custom_prompt'),
            tone=data.get('tone', 'professional'),
            additional_context=data.get('additional_context')
        )
        
        if error:
            return JsonResponse({'error': error}, status=500)
        
        generation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Save generated email
        generated = GeneratedEmail.objects.create(
            template=template,
            contact=contact,
            owner_id=user.id,
            prompt_used=data.get('custom_prompt') or template.prompt if template else 'Default prompt',
            subject=email_data['subject'],
            body=email_data['body'],
            status='draft',
            generation_time_ms=int(generation_time)
        )
        
        # Update template usage
        if template:
            template.usage_count += 1
            template.save(update_fields=['usage_count'])
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'id': generated.id,
                'subject': email_data['subject'],
                'body': email_data['body'],
                'contact_id': contact.id,
                'contact_name': contact.name,
                'generation_time_ms': int(generation_time),
                'created_at': generated.created_at.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error generating email: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def email_templates(request):
    """
    GET /api/ai/email-templates/ - List AI email templates
    POST /api/ai/email-templates/ - Create new template
    """
    user = get_user_from_request(request)
    
    if request.method == "GET":
        category = request.GET.get('category')
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        
        templates = AIEmailTemplate.objects.filter(owner_id=user.id, is_active=True)
        
        if category:
            templates = templates.filter(category=category)
        
        templates = templates.order_by('-usage_count', '-created_at')
        
        paginator = Paginator(templates, limit)
        page_obj = paginator.get_page(page)
        
        data = [
            {
                'id': t.id,
                'name': t.name,
                'category': t.category,
                'tone': t.tone,
                'usage_count': t.usage_count,
                'success_rate': t.success_rate,
                'created_at': t.created_at.isoformat()
            }
            for t in page_obj
        ]
        
        return JsonResponse({
            'templates': data,
            'count': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages
        })
    
    else:  # POST
        try:
            data = json.loads(request.body)
            
            template = AIEmailTemplate.objects.create(
                owner_id=user.id,
                name=data.get('name'),
                category=data.get('category', 'custom'),
                prompt=data.get('prompt'),
                subject_template=data.get('subject_template', ''),
                body_template=data.get('body_template', ''),
                tone=data.get('tone', 'professional'),
                personalization_fields=data.get('personalization_fields', {})
            )
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'id': template.id,
                    'name': template.name,
                    'category': template.category
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Error creating template: {str(e)}")
            return JsonResponse({'error': 'Internal server error'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def contact_scores(request):
    """
    GET /api/ai/contact-scores/
    Get contact scores for lead prioritization.
    
    Query params:
    - score_level: hot|warm|cold|nurture|inactive
    - min_score: minimum overall score
    - page, limit
    """
    user = get_user_from_request(request)
    
    score_level = request.GET.get('score_level')
    min_score = request.GET.get('min_score')
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 20))
    
    scores = ContactScore.objects.filter(owner_id=user.id)
    
    if score_level:
        scores = scores.filter(score_level=score_level)
    
    if min_score:
        scores = scores.filter(overall_score__gte=float(min_score))
    
    scores = scores.select_related('contact').order_by('-overall_score')
    
    paginator = Paginator(scores, limit)
    page_obj = paginator.get_page(page)
    
    data = [
        {
            'id': s.id,
            'contact_id': s.contact.id,
            'contact_name': s.contact.name,
            'contact_email': s.contact.email,
            'overall_score': round(s.overall_score, 1),
            'score_level': s.score_level,
            'engagement_score': round(s.engagement_score, 1),
            'recency_score': round(s.recency_score, 1),
            'conversion_probability': round(s.conversion_probability * 100, 1),
            'churn_risk': round(s.churn_risk * 100, 1),
            'next_best_action': s.next_best_action,
            'key_insights': s.key_insights,
            'last_calculated_at': s.last_calculated_at.isoformat()
        }
        for s in page_obj
    ]
    
    return JsonResponse({
        'scores': data,
        'count': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages
    })


@csrf_exempt
@require_http_methods(["POST"])
def calculate_score(request, contact_id):
    """
    POST /api/ai/calculate-score/<contact_id>/
    Calculate or recalculate AI score for a contact.
    """
    user = get_user_from_request(request)
    
    try:
        contact = Contact.objects.get(id=contact_id, owner_id=user.id)
    except Contact.DoesNotExist:
        return JsonResponse({'error': 'Contact not found'}, status=404)
    
    try:
        service = ContactScoringService()
        score = service.calculate_contact_score(contact)
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'contact_id': contact.id,
                'overall_score': round(score.overall_score, 1),
                'score_level': score.score_level,
                'engagement_score': round(score.engagement_score, 1),
                'recency_score': round(score.recency_score, 1),
                'response_rate_score': round(score.response_rate_score, 1),
                'profile_completeness': round(score.profile_completeness, 1),
                'conversion_probability': round(score.conversion_probability * 100, 1),
                'churn_risk': round(score.churn_risk * 100, 1),
                'next_best_action': score.next_best_action,
                'key_insights': score.key_insights,
                'behavioral_patterns': score.behavioral_patterns
            }
        })
        
    except Exception as e:
        logger.error(f"Error calculating score: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def predictions(request):
    """
    GET /api/ai/predictions/
    Get predictive analytics and forecasts.
    
    Query params:
    - metric: contact_growth|conversion_rate|email_engagement|deal_closure|churn_rate
    """
    user = get_user_from_request(request)
    metric = request.GET.get('metric', 'contact_growth')
    
    # Get or create prediction
    prediction = PredictiveAnalytics.objects.filter(
        owner_id=user.id,
        metric=metric
    ).order_by('-created_at').first()
    
    if not prediction:
        # Create mock prediction for development
        prediction = PredictiveAnalytics.objects.create(
            owner_id=user.id,
            metric=metric,
            historical_data={'dates': [], 'values': []},
            predicted_values={'dates': [], 'values': []},
            confidence_interval={'lower': [], 'upper': []},
            trend_direction='stable',
            recommendations='Continue current strategies'
        )
    
    return JsonResponse({
        'prediction': {
            'id': prediction.id,
            'metric': prediction.metric,
            'historical_data': prediction.historical_data,
            'predicted_values': prediction.predicted_values,
            'confidence_interval': prediction.confidence_interval,
            'trend_direction': prediction.trend_direction,
            'accuracy_score': prediction.accuracy_score,
            'anomalies_detected': prediction.anomalies_detected,
            'recommendations': prediction.recommendations,
            'created_at': prediction.created_at.isoformat()
        }
    })


@csrf_exempt
@require_http_methods(["GET"])
def recommendations(request):
    """
    GET /api/ai/recommendations/
    Get smart AI recommendations for actions.
    
    Query params:
    - type: contact_action|workflow_suggestion|template_usage|timing_optimization
    - priority: high|medium|low
    """
    user = get_user_from_request(request)
    
    rec_type = request.GET.get('type')
    priority = request.GET.get('priority')
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    
    # Get active recommendations
    recs = SmartRecommendation.objects.filter(
        owner_id=user.id,
        is_dismissed=False,
        expires_at__gt=timezone.now()
    )
    
    if rec_type:
        recs = recs.filter(recommendation_type=rec_type)
    
    if priority:
        recs = recs.filter(priority=priority)
    
    recs = recs.order_by('-priority', '-confidence_score', '-created_at')
    
    paginator = Paginator(recs, limit)
    page_obj = paginator.get_page(page)
    
    data = [
        {
            'id': r.id,
            'type': r.recommendation_type,
            'priority': r.priority,
            'title': r.title,
            'description': r.description,
            'action_url': r.action_url,
            'expected_impact': r.expected_impact,
            'confidence_score': round(r.confidence_score * 100, 1),
            'contact_id': r.related_contact_id,
            'created_at': r.created_at.isoformat(),
            'expires_at': r.expires_at.isoformat()
        }
        for r in page_obj
    ]
    
    return JsonResponse({
        'recommendations': data,
        'count': paginator.count,
        'page': page,
        'total_pages': paginator.num_pages
    })


@csrf_exempt
@require_http_methods(["POST"])
def analyze_sentiment(request):
    """
    POST /api/ai/analyze-sentiment/
    Analyze sentiment of text.
    
    Body:
    {
        "text": "email or message content",
        "contact_id": 123,
        "source_type": "email|note|call"
    }
    """
    try:
        user = get_user_from_request(request)
        data = json.loads(request.body)
        
        text = data.get('text')
        contact_id = data.get('contact_id')
        source_type = data.get('source_type', 'email')
        
        if not text:
            return JsonResponse({'error': 'text is required'}, status=400)
        
        if not contact_id:
            return JsonResponse({'error': 'contact_id is required'}, status=400)
        
        try:
            contact = Contact.objects.get(id=contact_id, owner_id=user.id)
        except Contact.DoesNotExist:
            return JsonResponse({'error': 'Contact not found'}, status=404)
        
        # Analyze sentiment
        service = SentimentAnalysisService()
        analysis = service.analyze_sentiment(text, contact, source_type)
        
        if not analysis:
            return JsonResponse({'error': 'Failed to analyze sentiment'}, status=500)
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'id': analysis.id,
                'sentiment': analysis.sentiment,
                'sentiment_score': round(analysis.sentiment_score, 2),
                'confidence': round(analysis.confidence, 2),
                'emotions': analysis.emotions,
                'key_phrases': analysis.key_phrases,
                'response_urgency': analysis.response_urgency,
                'analyzed_at': analysis.analyzed_at.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)
