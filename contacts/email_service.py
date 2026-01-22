"""
Email sending service for contact communication.
Supports multiple email providers (SendGrid, SMTP).
"""

import logging
from typing import List, Dict, Optional, Any
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template import Template, Context
from contacts.models import Contact, Activity

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails to contacts."""
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ebookr.io')
    
    def send_email_to_contact(
        self,
        contact: Contact,
        subject: str,
        message: str,
        html_message: Optional[str] = None,
        user=None,
        track_opens: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send an email to a contact and log the activity.
        
        Args:
            contact: Contact to send email to
            subject: Email subject line
            message: Plain text email body
            html_message: Optional HTML version of email
            user: User sending the email (for activity tracking)
            track_opens: Whether to track email opens
            metadata: Additional metadata to store
        
        Returns:
            bool: True if email sent successfully
        """
        try:
            # Replace template variables
            subject = self._replace_variables(subject, contact)
            message = self._replace_variables(message, contact)
            if html_message:
                html_message = self._replace_variables(html_message, contact)
            
            # Send email
            if html_message:
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=message,
                    from_email=self.from_email,
                    to=[contact.email]
                )
                email.attach_alternative(html_message, "text/html")
                email.send()
            else:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=self.from_email,
                    recipient_list=[contact.email],
                    fail_silently=False
                )
            
            # Log activity
            activity_metadata = metadata or {}
            activity_metadata.update({
                'subject': subject,
                'to': contact.email,
                'track_opens': track_opens
            })
            
            Activity.objects.create(
                contact=contact,
                activity_type=Activity.EMAIL_SENT,
                title=f"Email sent: {subject}",
                description=message[:500],  # First 500 chars
                metadata=activity_metadata,
                created_by=user
            )
            
            logger.info(f"Email sent to {contact.email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {contact.email}: {str(e)}")
            return False
    
    def send_bulk_email(
        self,
        contacts: List[Contact],
        subject: str,
        message: str,
        html_message: Optional[str] = None,
        user=None
    ) -> Dict[str, int]:
        """
        Send email to multiple contacts.
        
        Returns:
            Dict with 'sent' and 'failed' counts
        """
        results = {'sent': 0, 'failed': 0}
        
        for contact in contacts:
            success = self.send_email_to_contact(
                contact=contact,
                subject=subject,
                message=message,
                html_message=html_message,
                user=user
            )
            
            if success:
                results['sent'] += 1
            else:
                results['failed'] += 1
        
        logger.info(f"Bulk email completed: {results['sent']} sent, {results['failed']} failed")
        return results
    
    def send_template_email(
        self,
        contact: Contact,
        template_id: int,
        user=None,
        custom_variables: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Send email using a saved template.
        
        Args:
            contact: Contact to send to
            template_id: ID of MessageTemplate
            user: User sending the email
            custom_variables: Additional variables to replace
        
        Returns:
            bool: True if successful
        """
        from contacts.models import MessageTemplate
        
        try:
            template = MessageTemplate.objects.get(id=template_id)
            
            # Merge custom variables
            variables = {
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'email': contact.email,
                'company': contact.company,
            }
            if custom_variables:
                variables.update(custom_variables)
            
            # Replace variables in template
            subject = self._replace_dict_variables(template.subject, variables)
            body = self._replace_dict_variables(template.body, variables)
            
            return self.send_email_to_contact(
                contact=contact,
                subject=subject,
                message=body,
                user=user,
                metadata={'template_id': template_id, 'template_name': template.name}
            )
            
        except MessageTemplate.DoesNotExist:
            logger.error(f"Template {template_id} not found")
            return False
        except Exception as e:
            logger.error(f"Failed to send template email: {str(e)}")
            return False
    
    def _replace_variables(self, text: str, contact: Contact) -> str:
        """Replace template variables like {{first_name}} with contact data."""
        replacements = {
            '{{first_name}}': contact.first_name,
            '{{last_name}}': contact.last_name,
            '{{email}}': contact.email,
            '{{company}}': contact.company or '',
            '{{contact_name}}': f"{contact.first_name} {contact.last_name}".strip() or contact.email,
        }
        
        for key, value in replacements.items():
            text = text.replace(key, value)
        
        return text
    
    def _replace_dict_variables(self, text: str, variables: Dict[str, str]) -> str:
        """Replace variables using a dictionary."""
        for key, value in variables.items():
            text = text.replace(f"{{{{{key}}}}}", value)
        return text


# Global email service instance
email_service = EmailService()
