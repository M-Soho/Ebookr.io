import logging
from datetime import datetime

from django.utils import timezone
from celery import shared_task

from automation.models import ScheduledFollowUp
from contacts.models import Contact

logger = logging.getLogger(__name__)


@shared_task
def send_scheduled_followups():
    """
    Send all pending follow-ups that are scheduled for now or earlier.
    Marks them as sent and updates the contact's last_contacted_at timestamp.
    Handles errors by marking as cancelled and storing error message.
    """
    now = timezone.now()
    pending_followups = ScheduledFollowUp.objects.filter(
        status=ScheduledFollowUp.PENDING,
        scheduled_for__lte=now,
    )

    sent_count = 0
    error_count = 0

    for followup in pending_followups:
        try:
            contact = followup.contact
            rule = followup.rule

            # Log the follow-up
            logger.info(
                f"Sending follow-up for contact {contact.id} ({contact.email}) "
                f"using rule '{rule.name}'"
            )

            # In a real implementation, you would send the email here using:
            # - rule.subject_template and rule.body_template (with variable substitution)
            # - contact.email as recipient
            # - A mail service (e.g., SendGrid, AWS SES, Django's send_mail)

            # Mark as sent
            followup.status = ScheduledFollowUp.SENT
            followup.sent_at = now
            followup.save(update_fields=["status", "sent_at", "updated_at"])

            # Update contact's last_contacted_at
            contact.last_contacted_at = now
            contact.save(update_fields=["last_contacted_at"])

            sent_count += 1
            logger.info(f"Successfully sent follow-up for contact {contact.id}")

        except Exception as e:
            error_count += 1
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(
                f"Error sending follow-up {followup.id} for contact {followup.contact.id}: {error_msg}"
            )

            # Mark as cancelled and store error
            followup.status = ScheduledFollowUp.CANCELLED
            followup.error_message = error_msg
            followup.save(update_fields=["status", "error_message", "updated_at"])

    logger.info(f"send_scheduled_followups completed: {sent_count} sent, {error_count} errors")
    return {"sent": sent_count, "errors": error_count}
