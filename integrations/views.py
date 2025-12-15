import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .models import (
    Integration,
    EmailIntegration,
    WhatsAppIntegration,
    SMSIntegration,
    SignUpPageIntegration,
    FacebookIntegration,
    IntegrationLog,
)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def integrations_list(request):
    """List all integrations or create a new one."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    if request.method == "GET":
        integrations = Integration.objects.filter(owner=request.user)
        
        # Filter by type if provided
        integration_type = request.GET.get("type")
        if integration_type:
            integrations = integrations.filter(integration_type=integration_type)
        
        data = [
            {
                "id": i.id,
                "name": i.name,
                "integration_type": i.integration_type,
                "provider": i.provider,
                "status": i.status,
                "is_active": i.is_active,
                "last_sync_at": i.last_sync_at.isoformat() if i.last_sync_at else None,
                "error_count": i.error_count,
                "created_at": i.created_at.isoformat(),
            }
            for i in integrations
        ]
        
        return JsonResponse({"integrations": data})
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            
            integration = Integration.objects.create(
                owner=request.user,
                integration_type=data["integration_type"],
                name=data["name"],
                provider=data.get("provider", ""),
                status=Integration.PENDING,
                is_active=False,
                config=data.get("config", {}),
            )
            
            return JsonResponse({
                "id": integration.id,
                "name": integration.name,
                "integration_type": integration.integration_type,
                "status": integration.status,
            }, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def integration_detail(request, integration_id):
    """Get, update, or delete a specific integration."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(id=integration_id, owner=request.user)
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)
    
    if request.method == "GET":
        # Get specific config based on integration type
        specific_config = {}
        
        if integration.integration_type == Integration.EMAIL and hasattr(integration, "email_config"):
            ec = integration.email_config
            specific_config = {
                "provider": ec.provider,
                "from_email": ec.from_email,
                "from_name": ec.from_name,
                "reply_to_email": ec.reply_to_email,
                "smtp_host": ec.smtp_host,
                "smtp_port": ec.smtp_port,
                "smtp_username": ec.smtp_username,
                "smtp_use_tls": ec.smtp_use_tls,
                "aws_region": ec.aws_region,
            }
        elif integration.integration_type == Integration.WHATSAPP and hasattr(integration, "whatsapp_config"):
            wc = integration.whatsapp_config
            specific_config = {
                "phone_number_id": wc.phone_number_id,
                "business_account_id": wc.business_account_id,
                "webhook_url": wc.webhook_url,
            }
        elif integration.integration_type == Integration.SMS and hasattr(integration, "sms_config"):
            sc = integration.sms_config
            specific_config = {
                "provider": sc.provider,
                "from_phone_number": sc.from_phone_number,
                "aws_region": sc.aws_region,
            }
        elif integration.integration_type == Integration.SIGNUP_PAGE and hasattr(integration, "signup_config"):
            spc = integration.signup_config
            specific_config = {
                "page_url": spc.page_url,
                "api_endpoint": spc.api_endpoint,
                "form_fields": spc.form_fields,
                "redirect_url": spc.redirect_url,
                "auto_create_contact": spc.auto_create_contact,
                "apply_tag": spc.apply_tag,
                "trigger_campaign_id": spc.trigger_campaign_id,
            }
        elif integration.integration_type == Integration.FACEBOOK and hasattr(integration, "facebook_config"):
            fc = integration.facebook_config
            specific_config = {
                "page_id": fc.page_id,
                "enable_lead_ads": fc.enable_lead_ads,
                "lead_form_id": fc.lead_form_id,
                "enable_messenger": fc.enable_messenger,
                "webhook_url": fc.webhook_url,
                "auto_create_contact_from_leads": fc.auto_create_contact_from_leads,
                "trigger_campaign_on_lead": fc.trigger_campaign_on_lead,
            }
        
        return JsonResponse({
            "id": integration.id,
            "name": integration.name,
            "integration_type": integration.integration_type,
            "provider": integration.provider,
            "status": integration.status,
            "is_active": integration.is_active,
            "config": integration.config,
            "specific_config": specific_config,
            "last_sync_at": integration.last_sync_at.isoformat() if integration.last_sync_at else None,
            "last_error": integration.last_error,
            "error_count": integration.error_count,
            "created_at": integration.created_at.isoformat(),
        })
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            if "name" in data:
                integration.name = data["name"]
            if "provider" in data:
                integration.provider = data["provider"]
            if "status" in data:
                integration.status = data["status"]
            if "is_active" in data:
                integration.is_active = data["is_active"]
            if "config" in data:
                integration.config = data["config"]
            
            integration.save()
            
            return JsonResponse({
                "id": integration.id,
                "name": integration.name,
                "status": integration.status,
                "is_active": integration.is_active,
            })
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        integration.delete()
        return JsonResponse({"success": True})


@csrf_exempt
@require_http_methods(["POST"])
def configure_email_integration(request, integration_id):
    """Configure email-specific settings."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(
            id=integration_id,
            owner=request.user,
            integration_type=Integration.EMAIL
        )
        
        data = json.loads(request.body)
        
        # Create or update email config
        email_config, created = EmailIntegration.objects.update_or_create(
            integration=integration,
            defaults={
                "provider": data.get("provider", EmailIntegration.SMTP),
                "api_key": data.get("api_key", ""),
                "from_email": data["from_email"],
                "from_name": data.get("from_name", ""),
                "reply_to_email": data.get("reply_to_email", ""),
                "smtp_host": data.get("smtp_host", ""),
                "smtp_port": data.get("smtp_port"),
                "smtp_username": data.get("smtp_username", ""),
                "smtp_password": data.get("smtp_password", ""),
                "smtp_use_tls": data.get("smtp_use_tls", True),
                "aws_region": data.get("aws_region", ""),
                "aws_access_key_id": data.get("aws_access_key_id", ""),
                "aws_secret_access_key": data.get("aws_secret_access_key", ""),
            }
        )
        
        integration.status = Integration.ACTIVE
        integration.is_active = True
        integration.save()
        
        return JsonResponse({
            "success": True,
            "integration_id": integration.id,
            "config_id": email_config.id,
        })
    
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def configure_whatsapp_integration(request, integration_id):
    """Configure WhatsApp-specific settings."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(
            id=integration_id,
            owner=request.user,
            integration_type=Integration.WHATSAPP
        )
        
        data = json.loads(request.body)
        
        whatsapp_config, created = WhatsAppIntegration.objects.update_or_create(
            integration=integration,
            defaults={
                "phone_number_id": data["phone_number_id"],
                "business_account_id": data["business_account_id"],
                "access_token": data["access_token"],
                "webhook_verify_token": data.get("webhook_verify_token", ""),
                "webhook_url": data.get("webhook_url", ""),
            }
        )
        
        integration.status = Integration.ACTIVE
        integration.is_active = True
        integration.save()
        
        return JsonResponse({
            "success": True,
            "integration_id": integration.id,
            "config_id": whatsapp_config.id,
        })
    
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def configure_sms_integration(request, integration_id):
    """Configure SMS-specific settings."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(
            id=integration_id,
            owner=request.user,
            integration_type=Integration.SMS
        )
        
        data = json.loads(request.body)
        
        sms_config, created = SMSIntegration.objects.update_or_create(
            integration=integration,
            defaults={
                "provider": data.get("provider", SMSIntegration.TWILIO),
                "account_sid": data.get("account_sid", ""),
                "auth_token": data["auth_token"],
                "api_key": data.get("api_key", ""),
                "api_secret": data.get("api_secret", ""),
                "from_phone_number": data["from_phone_number"],
                "aws_region": data.get("aws_region", ""),
                "aws_access_key_id": data.get("aws_access_key_id", ""),
                "aws_secret_access_key": data.get("aws_secret_access_key", ""),
            }
        )
        
        integration.status = Integration.ACTIVE
        integration.is_active = True
        integration.save()
        
        return JsonResponse({
            "success": True,
            "integration_id": integration.id,
            "config_id": sms_config.id,
        })
    
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def configure_signup_integration(request, integration_id):
    """Configure sign-up page-specific settings."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(
            id=integration_id,
            owner=request.user,
            integration_type=Integration.SIGNUP_PAGE
        )
        
        data = json.loads(request.body)
        
        signup_config, created = SignUpPageIntegration.objects.update_or_create(
            integration=integration,
            defaults={
                "page_url": data.get("page_url", ""),
                "embed_code": data.get("embed_code", ""),
                "api_endpoint": data.get("api_endpoint", ""),
                "api_key": data.get("api_key", ""),
                "form_fields": data.get("form_fields", []),
                "redirect_url": data.get("redirect_url", ""),
                "auto_create_contact": data.get("auto_create_contact", True),
                "apply_tag": data.get("apply_tag", ""),
                "trigger_campaign_id": data.get("trigger_campaign_id"),
            }
        )
        
        integration.status = Integration.ACTIVE
        integration.is_active = True
        integration.save()
        
        return JsonResponse({
            "success": True,
            "integration_id": integration.id,
            "config_id": signup_config.id,
        })
    
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def configure_facebook_integration(request, integration_id):
    """Configure Facebook-specific settings."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(
            id=integration_id,
            owner=request.user,
            integration_type=Integration.FACEBOOK
        )
        
        data = json.loads(request.body)
        
        facebook_config, created = FacebookIntegration.objects.update_or_create(
            integration=integration,
            defaults={
                "app_id": data["app_id"],
                "app_secret": data["app_secret"],
                "access_token": data["access_token"],
                "page_id": data.get("page_id", ""),
                "page_access_token": data.get("page_access_token", ""),
                "enable_lead_ads": data.get("enable_lead_ads", False),
                "lead_form_id": data.get("lead_form_id", ""),
                "enable_messenger": data.get("enable_messenger", False),
                "webhook_verify_token": data.get("webhook_verify_token", ""),
                "webhook_url": data.get("webhook_url", ""),
                "auto_create_contact_from_leads": data.get("auto_create_contact_from_leads", True),
                "trigger_campaign_on_lead": data.get("trigger_campaign_on_lead"),
            }
        )
        
        integration.status = Integration.ACTIVE
        integration.is_active = True
        integration.save()
        
        return JsonResponse({
            "success": True,
            "integration_id": integration.id,
            "config_id": facebook_config.id,
        })
    
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def test_integration(request, integration_id):
    """Test an integration connection."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(id=integration_id, owner=request.user)
        
        # Perform test based on integration type
        # This is a placeholder - actual implementation would call external APIs
        success = True
        message = f"Test successful for {integration.get_integration_type_display()}"
        
        # Log the test
        IntegrationLog.objects.create(
            integration=integration,
            level=IntegrationLog.SUCCESS if success else IntegrationLog.ERROR,
            message=message,
            details={"test_type": "manual", "test_time": timezone.now().isoformat()}
        )
        
        if success:
            integration.status = Integration.ACTIVE
            integration.error_count = 0
            integration.last_error = ""
        else:
            integration.status = Integration.ERROR
            integration.error_count += 1
            integration.last_error = message
        
        integration.last_sync_at = timezone.now()
        integration.save()
        
        return JsonResponse({
            "success": success,
            "message": message,
        })
    
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def integration_logs(request, integration_id):
    """Get logs for a specific integration."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        integration = Integration.objects.get(id=integration_id, owner=request.user)
        
        logs = IntegrationLog.objects.filter(integration=integration)[:50]
        
        data = [
            {
                "id": log.id,
                "level": log.level,
                "message": log.message,
                "details": log.details,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]
        
        return JsonResponse({"logs": data})
    
    except Integration.DoesNotExist:
        return JsonResponse({"error": "Integration not found"}, status=404)


@csrf_exempt
@require_http_methods(["GET"])
def integration_stats(request):
    """Get integration statistics."""
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    integrations = Integration.objects.filter(owner=request.user)
    
    stats = {
        "total": integrations.count(),
        "active": integrations.filter(is_active=True).count(),
        "inactive": integrations.filter(is_active=False).count(),
        "error": integrations.filter(status=Integration.ERROR).count(),
        "by_type": {
            "email": integrations.filter(integration_type=Integration.EMAIL).count(),
            "whatsapp": integrations.filter(integration_type=Integration.WHATSAPP).count(),
            "sms": integrations.filter(integration_type=Integration.SMS).count(),
            "signup_page": integrations.filter(integration_type=Integration.SIGNUP_PAGE).count(),
            "facebook": integrations.filter(integration_type=Integration.FACEBOOK).count(),
        }
    }
    
    return JsonResponse(stats)
