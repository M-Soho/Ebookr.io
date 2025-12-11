import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model

from contacts.models import Contact

logger = logging.getLogger(__name__)
User = get_user_model()


def validate_drip_config(config):
    """
    Validate drip_campaign_config structure.
    Returns (is_valid, error_message).
    """
    if config is None:
        return True, None
    
    if isinstance(config, str):
        try:
            config = json.loads(config)
        except json.JSONDecodeError as e:
            return False, f"Drip config must be valid JSON: {str(e)}"
    
    if not isinstance(config, dict):
        return False, "Drip config must be a JSON object"
    
    # Validate sequence array if present
    if "sequence" in config:
        if not isinstance(config["sequence"], list):
            return False, "Drip sequence must be an array"
        for i, step in enumerate(config["sequence"]):
            if not isinstance(step, dict):
                return False, f"Step {i} must be an object"
            if "delay_days" in step and not isinstance(step["delay_days"], int):
                return False, f"Step {i}: delay_days must be an integer"
    
    return True, None


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
        "contact_type",
        "contact_cadence",
        "contact_pref",
        "drip_campaign_enabled",
        "drip_campaign_config",
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

    # Validate drip config if provided
    if "drip_campaign_config" in payload:
        is_valid, error_msg = validate_drip_config(payload.get("drip_campaign_config"))
        if not is_valid:
            return JsonResponse(
                {"error": error_msg},
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
            contact_type=payload.get(
                "contact_type", Contact._meta.get_field("contact_type").default
            ),
            contact_cadence=payload.get(
                "contact_cadence",
                Contact._meta.get_field("contact_cadence").default,
            ),
            contact_pref=payload.get(
                "contact_pref", Contact._meta.get_field("contact_pref").default
            ),
            drip_campaign_enabled=payload.get(
                "drip_campaign_enabled", False
            ),
            drip_campaign_config=payload.get("drip_campaign_config", None),
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
                    "contact_type": contact.contact_type,
                    "contact_cadence": contact.contact_cadence,
                    "contact_pref": contact.contact_pref,
                    "drip_campaign_enabled": contact.drip_campaign_enabled,
                    "drip_campaign_config": contact.drip_campaign_config,
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
@require_http_methods(["GET", "PATCH", "DELETE"])
def contact_detail(request, contact_id):
    """
    GET /api/contacts/{id}/ - Get a contact by ID
    PATCH /api/contacts/{id}/ - Update a contact
    DELETE /api/contacts/{id}/ - Delete a contact
    """
    user_id = getattr(request, 'mock_user_id', None) or 1
    try:
        user = User.objects.get(id=user_id)
        contact = Contact.objects.get(id=contact_id, owner=user)
    except (User.DoesNotExist, Contact.DoesNotExist):
        return JsonResponse(
            {"error": "Contact not found"},
            status=404,
        )

    if request.method == "GET":
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
                    "contact_type": contact.contact_type,
                    "contact_cadence": contact.contact_cadence,
                    "contact_pref": contact.contact_pref,
                    "drip_campaign_enabled": contact.drip_campaign_enabled,
                    "drip_campaign_config": contact.drip_campaign_config,
                    "next_follow_up_at": contact.next_follow_up_at.isoformat()
                    if contact.next_follow_up_at
                    else None,
                    "last_contacted_at": contact.last_contacted_at.isoformat()
                    if contact.last_contacted_at
                    else None,
                    "notes": contact.notes,
                    "created_at": contact.created_at.isoformat(),
                    "updated_at": contact.updated_at.isoformat(),
                }
            },
            status=200,
        )

    if request.method == "DELETE":
        contact.delete()
        return JsonResponse({"data": {"id": contact_id}}, status=200)

    if request.method == "PATCH":
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON in request body"},
                status=400,
            )

        # Validate drip config if provided
        if "drip_campaign_config" in payload:
            is_valid, error_msg = validate_drip_config(
                payload.get("drip_campaign_config")
            )
            if not is_valid:
                return JsonResponse(
                    {"error": error_msg},
                    status=400,
                )

        # Update allowed fields
        allowed_fields = [
            "first_name",
            "last_name",
            "email",
            "company",
            "source",
            "status",
            "contact_type",
            "contact_cadence",
            "contact_pref",
            "drip_campaign_enabled",
            "drip_campaign_config",
            "next_follow_up_at",
            "last_contacted_at",
            "notes",
        ]
        for field in allowed_fields:
            if field in payload:
                setattr(contact, field, payload[field])

        contact.save()

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
                    "contact_type": contact.contact_type,
                    "contact_cadence": contact.contact_cadence,
                    "contact_pref": contact.contact_pref,
                    "drip_campaign_enabled": contact.drip_campaign_enabled,
                    "drip_campaign_config": contact.drip_campaign_config,
                    "next_follow_up_at": contact.next_follow_up_at.isoformat()
                    if contact.next_follow_up_at
                    else None,
                    "last_contacted_at": contact.last_contacted_at.isoformat()
                    if contact.last_contacted_at
                    else None,
                    "notes": contact.notes,
                    "created_at": contact.created_at.isoformat(),
                    "updated_at": contact.updated_at.isoformat(),
                }
            },
            status=200,
        )


@require_http_methods(["GET"])
def export_contacts_csv(request):
    """
    GET /api/contacts/export/csv/
    Export all contacts as CSV for the authenticated user.
    """
    import csv
    from io import StringIO

    user_id = getattr(request, 'mock_user_id', None) or 1
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "User not found"},
            status=404,
        )

    contacts = Contact.objects.filter(owner=user).order_by("-updated_at")

    output = StringIO()
    fieldnames = [
        "id",
        "first_name",
        "last_name",
        "email",
        "company",
        "status",
        "source",
        "contact_type",
        "contact_cadence",
        "contact_pref",
        "drip_campaign_enabled",
        "drip_campaign_config",
        "next_follow_up_at",
        "last_contacted_at",
        "created_at",
        "updated_at",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for contact in contacts:
        writer.writerow({
            "id": contact.id,
            "first_name": contact.first_name,
            "last_name": contact.last_name,
            "email": contact.email,
            "company": contact.company,
            "status": contact.status,
            "source": contact.source,
            "contact_type": contact.contact_type,
            "contact_cadence": contact.contact_cadence,
            "contact_pref": contact.contact_pref,
            "drip_campaign_enabled": contact.drip_campaign_enabled,
            "drip_campaign_config": json.dumps(contact.drip_campaign_config)
            if contact.drip_campaign_config
            else "",
            "next_follow_up_at": contact.next_follow_up_at.isoformat()
            if contact.next_follow_up_at
            else "",
            "last_contacted_at": contact.last_contacted_at.isoformat()
            if contact.last_contacted_at
            else "",
            "created_at": contact.created_at.isoformat(),
            "updated_at": contact.updated_at.isoformat(),
        })

    response = JsonResponse({"data": output.getvalue()}, status=200)
    response["Content-Disposition"] = "attachment; filename=contacts.csv"
    response["Content-Type"] = "text/csv"
    return response


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
