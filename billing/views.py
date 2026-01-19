import json
import logging
from datetime import datetime

import stripe
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone

from billing.models import Subscription

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_API_KEY


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """
    Handle Stripe webhook events for subscription lifecycle.
    Verifies the webhook signature and updates Subscription model accordingly.
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError as e:
        logger.warning(f"Invalid payload: {e}")
        return JsonResponse({"error": "Invalid payload"}, status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.warning(f"Invalid signature: {e}")
        return JsonResponse({"error": "Invalid signature"}, status=400)

    event_type = event["type"]
    data = event["data"]["object"]

    try:
        if event_type == "customer.subscription.created":
            handle_subscription_created(data)
        elif event_type == "customer.subscription.updated":
            handle_subscription_updated(data)
        elif event_type == "customer.subscription.deleted":
            handle_subscription_deleted(data)
        else:
            logger.info(f"Unhandled event type: {event_type}")

    except Exception as e:
        logger.error(f"Error handling event {event_type}: {e}", exc_info=True)
        return JsonResponse({"error": "Event processing failed"}, status=400)

    return JsonResponse({"status": "success"})


def handle_subscription_created(data):
    """
    Handle customer.subscription.created event.
    Creates or updates a Subscription record.
    """
    stripe_subscription_id = data["id"]
    stripe_customer_id = data["customer"]
    plan = parse_plan_from_items(data["items"]["data"])
    status = data["status"]
    current_period_start = parse_timestamp(data["current_period_start"])
    current_period_end = parse_timestamp(data["current_period_end"])

    subscription, created = Subscription.objects.update_or_create(
        stripe_subscription_id=stripe_subscription_id,
        defaults={
            "stripe_customer_id": stripe_customer_id,
            "plan": plan,
            "status": status,
            "current_period_start": current_period_start,
            "current_period_end": current_period_end,
        },
    )

    action = "created" if created else "updated"
    logger.info(
        f"Subscription {action}: {stripe_subscription_id} "
        f"(customer={stripe_customer_id}, status={status})"
    )


def handle_subscription_updated(data):
    """
    Handle customer.subscription.updated event.
    Updates the Subscription record with new details.
    """
    stripe_subscription_id = data["id"]
    stripe_customer_id = data["customer"]
    plan = parse_plan_from_items(data["items"]["data"])
    status = data["status"]
    current_period_start = parse_timestamp(data["current_period_start"])
    current_period_end = parse_timestamp(data["current_period_end"])
    cancel_at_period_end = data.get("cancel_at_period_end", False)

    subscription, created = Subscription.objects.update_or_create(
        stripe_subscription_id=stripe_subscription_id,
        defaults={
            "stripe_customer_id": stripe_customer_id,
            "plan": plan,
            "status": status,
            "current_period_start": current_period_start,
            "current_period_end": current_period_end,
            "cancel_at_period_end": cancel_at_period_end,
        },
    )

    action = "created" if created else "updated"
    logger.info(
        f"Subscription {action}: {stripe_subscription_id} "
        f"(customer={stripe_customer_id}, status={status})"
    )


def handle_subscription_deleted(data):
    """
    Handle customer.subscription.deleted event.
    Updates the Subscription status to 'canceled'.
    """
    stripe_subscription_id = data["id"]
    stripe_customer_id = data["customer"]

    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=stripe_subscription_id
        )
        subscription.status = Subscription.CANCELED
        subscription.save(update_fields=["status", "updated_at"])
        logger.info(
            f"Subscription deleted: {stripe_subscription_id} "
            f"(customer={stripe_customer_id})"
        )
    except Subscription.DoesNotExist:
        logger.warning(
            f"Subscription not found for deletion: {stripe_subscription_id} "
            f"(customer={stripe_customer_id})"
        )


def parse_plan_from_items(items):
    """
    Extract plan name from subscription items.
    Assumes a single product with metadata or price name.
    Returns 'monthly' or 'annual', defaulting to 'monthly'.
    """
    if not items:
        return Subscription.MONTHLY

    # Get first item's price
    price = items[0].get("price", {})
    metadata = price.get("metadata", {})
    plan = metadata.get("plan", "").lower()

    if plan in [Subscription.MONTHLY, Subscription.ANNUAL]:
        return plan

    # Fallback: check recurring interval
    recurring = price.get("recurring", {})
    interval = recurring.get("interval", "").lower()
    if interval == "year":
        return Subscription.ANNUAL

    return Subscription.MONTHLY


def parse_timestamp(timestamp):
    """
    Convert Unix timestamp to Django datetime.
    Returns None if timestamp is None or 0.
    """
    if timestamp is None or timestamp == 0:
        return None
    return timezone.datetime.fromtimestamp(timestamp, tz=timezone.utc)


@require_http_methods(["GET"])
def get_subscription(request):
    """GET /api/billing/subscription/
    Return full subscription details for the current (test) user.
    """
    user_id = getattr(request, 'mock_user_id', None) or 1
    try:
        sub = Subscription.objects.get(user__id=user_id)
        payload = {
            "id": sub.id,
            "user_id": sub.user.id,
            "plan": sub.plan,
            "status": sub.status,
            "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
            "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
            "updated_at": sub.updated_at.isoformat() if sub.updated_at else None,
        }
        return JsonResponse({"data": payload})
    except Subscription.DoesNotExist:
        return JsonResponse({"data": None})


@csrf_exempt
@require_http_methods(["POST"])
def create_checkout_session(request):
    """POST /api/billing/create-checkout-session/
    Create a Stripe Checkout session for the requested plan.
    For development this returns a fake checkout URL. TODO: wire real Stripe Checkout.
    """
    try:
        payload = json.loads(request.body or b"{}")
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    plan = payload.get("plan", "monthly")
    # Map to configured price IDs (if available)
    price_id = settings.STRIPE_PRICE_MONTHLY
    if plan == "annual":
        price_id = settings.STRIPE_PRICE_ANNUAL or price_id

    # In prod we would call stripe.checkout.sessions.create(...) and return the URL.
    # For now return a placeholder URL so the frontend can continue to test the flow.
    checkout_url = f"https://checkout.stripe.com/pay/cs_test_fake_{plan}"

    return JsonResponse({"data": {"checkout_url": checkout_url}})
