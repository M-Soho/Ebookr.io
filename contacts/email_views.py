"""
API views for email sending functionality.
"""

import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from contacts.models import Contact, MessageTemplate
from contacts.email_service import email_service

logger = logging.getLogger(__name__)
User = get_user_model()


@csrf_exempt
@require_http_methods(["POST"])
def send_email(request):
    """
    POST /api/contacts/send-email/
    Send an email to one or more contacts.
    
    Body:
    {
        "contact_ids": [1, 2, 3],  // or single "contact_id": 1
        "subject": "Email subject",
        "message": "Plain text message",
        "html_message": "<p>HTML message</p>",  // optional
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        html_message = data.get('html_message')
        
        if not subject or not message:
            return JsonResponse({'error': 'Subject and message are required'}, status=400)
        
        # Handle single contact or multiple contacts
        contact_ids = data.get('contact_ids', [])
        if 'contact_id' in data:
            contact_ids = [data['contact_id']]
        
        if not contact_ids:
            return JsonResponse({'error': 'At least one contact_id is required'}, status=400)
        
        # Get contacts owned by user
        contacts = Contact.objects.filter(id__in=contact_ids, owner=user)
        
        if not contacts.exists():
            return JsonResponse({'error': 'No valid contacts found'}, status=404)
        
        # Send emails
        if len(contacts) == 1:
            success = email_service.send_email_to_contact(
                contact=contacts.first(),
                subject=subject,
                message=message,
                html_message=html_message,
                user=user
            )
            
            if success:
                return JsonResponse({
                    'status': 'success',
                    'message': 'Email sent successfully'
                })
            else:
                return JsonResponse({'error': 'Failed to send email'}, status=500)
        else:
            results = email_service.send_bulk_email(
                contacts=list(contacts),
                subject=subject,
                message=message,
                html_message=html_message,
                user=user
            )
            
            return JsonResponse({
                'status': 'success',
                'sent': results['sent'],
                'failed': results['failed'],
                'total': len(contacts)
            })
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def send_template_email(request):
    """
    POST /api/contacts/send-template-email/
    Send an email using a saved template.
    
    Body:
    {
        "contact_id": 1,
        "template_id": 5,
        "custom_variables": {  // optional
            "custom_field": "value"
        }
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        contact_id = data.get('contact_id')
        template_id = data.get('template_id')
        custom_variables = data.get('custom_variables', {})
        
        if not contact_id or not template_id:
            return JsonResponse({
                'error': 'contact_id and template_id are required'
            }, status=400)
        
        contact = Contact.objects.get(id=contact_id, owner=user)
        
        success = email_service.send_template_email(
            contact=contact,
            template_id=template_id,
            user=user,
            custom_variables=custom_variables
        )
        
        if success:
            return JsonResponse({
                'status': 'success',
                'message': 'Template email sent successfully'
            })
        else:
            return JsonResponse({'error': 'Failed to send template email'}, status=500)
    
    except Contact.DoesNotExist:
        return JsonResponse({'error': 'Contact not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error sending template email: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def email_templates(request):
    """
    GET /api/contacts/email-templates/
    Get all email templates for the user.
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        templates = MessageTemplate.objects.filter(
            owner=user,
            template_type=MessageTemplate.EMAIL
        ).values(
            'id', 'name', 'subject', 'body', 'created_at', 'updated_at'
        )
        
        return JsonResponse({'data': list(templates)})
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        logger.error(f"Error fetching email templates: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_email_template(request):
    """
    POST /api/contacts/email-templates/
    Create a new email template.
    
    Body:
    {
        "name": "Welcome Email",
        "subject": "Welcome {{first_name}}!",
        "body": "Hi {{first_name}},\n\nWelcome to our platform..."
    }
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        user = User.objects.get(id=user_id)
        
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        subject = data.get('subject', '').strip()
        body = data.get('body', '').strip()
        
        if not name or not subject or not body:
            return JsonResponse({
                'error': 'name, subject, and body are required'
            }, status=400)
        
        template = MessageTemplate.objects.create(
            owner=user,
            name=name,
            template_type=MessageTemplate.EMAIL,
            subject=subject,
            body=body
        )
        
        return JsonResponse({
            'status': 'success',
            'template': {
                'id': template.id,
                'name': template.name,
                'subject': template.subject,
                'body': template.body,
                'created_at': template.created_at.isoformat()
            }
        }, status=201)
    
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Error creating email template: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
