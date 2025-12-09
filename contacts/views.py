import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model

from contacts.models import Contact

logger = logging.getLogger(__name__)
User = get_user_model()


@require_http_methods(["GET"])
def list_contacts(request):
    """
    GET /api/contacts/
    List all contacts for the authenticated user.
    For now, assumes user_id=1 for testing.
    """
    user_id = getattr(request, 'mock_user_id', None) or 1
    try:
        # TODO: Replace with request.user once authentication is wired
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "User not found. Please create a test user with id=1."},
            status=404,
        )

    contacts = Contact.objects.filter(owner=user).values(
        "id",
        "first_name",
        "last_name",
        "email",
        "company",
        "status",
        "source",
        "next_follow_up_at",
        "last_contacted_at",
        "created_at",
        "updated_at",
    )

    return JsonResponse({"data": list(contacts)})


@csrf_exempt
@require_http_methods(["POST"])
def create_contact(request):
    """
    POST /api/contacts/
    Create a new contact for the authenticated user.
    Accepts JSON body with: first_name, last_name, email, company, source, status.
    """
    try:
        user_id = getattr(request, 'mock_user_id', None) or 1
        # TODO: Replace with request.user once authentication is wired
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "User not found. Please create a test user with id=1."},
            status=404,
        )

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON in request body"},
            status=400,
        )

    # Validate required fields
    required_fields = ["first_name", "email"]
    for field in required_fields:
        if field not in payload or not payload[field]:
            return JsonResponse(
                {"error": f"Missing required field: {field}"},
                status=400,
            )

    try:
        contact = Contact.objects.create(
            owner=user,
            first_name=payload.get("first_name", "").strip(),
            last_name=payload.get("last_name", "").strip(),
            email=payload.get("email", "").strip(),
            company=payload.get("company", "").strip(),
            source=payload.get("source", "").strip(),
            status=payload.get("status", Contact._meta.get_field("status").default),
        )

        return JsonResponse(
            {
                "data": {
                    "id": contact.id,
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "email": contact.email,
                    "company": contact.company,
                    "status": contact.status,
                    "source": contact.source,
                    "next_follow_up_at": contact.next_follow_up_at.isoformat()
                    if contact.next_follow_up_at
                    else None,
                    "last_contacted_at": contact.last_contacted_at.isoformat()
                    if contact.last_contacted_at
                    else None,
                    "created_at": contact.created_at.isoformat(),
                    "updated_at": contact.updated_at.isoformat(),
                }
            },
            status=201,
        )

    except Exception as e:
        logger.error(f"Error creating contact: {e}", exc_info=True)
        return JsonResponse(
            {"error": "Failed to create contact"},
            status=500,
        )


@csrf_exempt
def contacts_api(request):
    """Combined endpoint for /api/contacts/ that dispatches by HTTP method.
    GET -> list_contacts
    POST -> create_contact
    TODO: replace with authenticated views when auth is wired.
    """
    if request.method == "GET":
        return list_contacts(request)
    if request.method == "POST":
        return create_contact(request)
    return JsonResponse({"error": "Method not allowed"}, status=405)
