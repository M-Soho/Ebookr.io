"""
API views for advanced workflow management.
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
import json

from .models import (
    Workflow,
    WorkflowEnrollment,
    WorkflowCondition,
    ABTest,
    WorkflowTemplate
)
from contacts.models import Contact
from .conditions import ConditionEvaluator


@login_required
@require_http_methods(["GET", "POST"])
def workflows_list(request):
    """List all workflows or create a new one."""
    user = request.user
    
    if request.method == "GET":
        workflows = Workflow.objects.filter(owner=user)
        
        workflows_data = []
        for workflow in workflows:
            workflows_data.append({
                'id': workflow.id,
                'name': workflow.name,
                'description': workflow.description,
                'is_active': workflow.is_active,
                'trigger_type': workflow.trigger_type,
                'total_enrolled': workflow.total_enrolled,
                'total_completed': workflow.total_completed,
                'created_at': workflow.created_at.isoformat(),
            })
        
        return JsonResponse({'workflows': workflows_data})
    
    elif request.method == "POST":
        data = json.loads(request.body)
        
        workflow = Workflow.objects.create(
            owner=user,
            name=data.get('name'),
            description=data.get('description', ''),
            workflow_data=data.get('workflow_data', {}),
            trigger_type=data.get('trigger_type', 'manual'),
            trigger_config=data.get('trigger_config', {}),
        )
        
        return JsonResponse({
            'id': workflow.id,
            'name': workflow.name,
            'message': 'Workflow created successfully'
        })


@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
def workflow_detail(request, workflow_id):
    """Get, update, or delete a workflow."""
    workflow = get_object_or_404(Workflow, id=workflow_id, owner=request.user)
    
    if request.method == "GET":
        return JsonResponse({
            'id': workflow.id,
            'name': workflow.name,
            'description': workflow.description,
            'workflow_data': workflow.workflow_data,
            'is_active': workflow.is_active,
            'trigger_type': workflow.trigger_type,
            'trigger_config': workflow.trigger_config,
            'total_enrolled': workflow.total_enrolled,
            'total_completed': workflow.total_completed,
            'created_at': workflow.created_at.isoformat(),
        })
    
    elif request.method == "PUT":
        data = json.loads(request.body)
        
        workflow.name = data.get('name', workflow.name)
        workflow.description = data.get('description', workflow.description)
        workflow.workflow_data = data.get('workflow_data', workflow.workflow_data)
        workflow.is_active = data.get('is_active', workflow.is_active)
        workflow.trigger_type = data.get('trigger_type', workflow.trigger_type)
        workflow.trigger_config = data.get('trigger_config', workflow.trigger_config)
        workflow.save()
        
        return JsonResponse({'message': 'Workflow updated successfully'})
    
    elif request.method == "DELETE":
        workflow.delete()
        return JsonResponse({'message': 'Workflow deleted successfully'})


@login_required
@require_http_methods(["POST"])
def enroll_contact_in_workflow(request, workflow_id):
    """Enroll a contact in a workflow."""
    workflow = get_object_or_404(Workflow, id=workflow_id, owner=request.user)
    data = json.loads(request.body)
    contact_id = data.get('contact_id')
    
    contact = get_object_or_404(Contact, id=contact_id, owner=request.user)
    
    # Check if already enrolled
    enrollment, created = WorkflowEnrollment.objects.get_or_create(
        workflow=workflow,
        contact=contact,
        defaults={'status': WorkflowEnrollment.STATUS_ACTIVE}
    )
    
    if not created:
        return JsonResponse({
            'message': 'Contact already enrolled in this workflow',
            'enrollment_id': enrollment.id
        })
    
    # Update workflow stats
    workflow.total_enrolled += 1
    workflow.save()
    
    return JsonResponse({
        'message': 'Contact enrolled successfully',
        'enrollment_id': enrollment.id
    })


@login_required
@require_http_methods(["GET"])
def workflow_enrollments(request, workflow_id):
    """Get all enrollments for a workflow."""
    workflow = get_object_or_404(Workflow, id=workflow_id, owner=request.user)
    
    enrollments = WorkflowEnrollment.objects.filter(
        workflow=workflow
    ).select_related('contact')
    
    enrollments_data = []
    for enrollment in enrollments:
        enrollments_data.append({
            'id': enrollment.id,
            'contact': {
                'id': enrollment.contact.id,
                'name': f"{enrollment.contact.first_name} {enrollment.contact.last_name}",
                'email': enrollment.contact.email,
            },
            'status': enrollment.status,
            'current_node_id': enrollment.current_node_id,
            'enrolled_at': enrollment.enrolled_at.isoformat(),
            'completed_at': enrollment.completed_at.isoformat() if enrollment.completed_at else None,
        })
    
    return JsonResponse({'enrollments': enrollments_data})


@login_required
@require_http_methods(["GET", "POST"])
def ab_tests_list(request):
    """List or create A/B tests."""
    user = request.user
    
    if request.method == "GET":
        workflow_id = request.GET.get('workflow_id')
        
        if workflow_id:
            ab_tests = ABTest.objects.filter(
                workflow_id=workflow_id,
                workflow__owner=user
            )
        else:
            ab_tests = ABTest.objects.filter(workflow__owner=user)
        
        tests_data = []
        for test in ab_tests:
            tests_data.append({
                'id': test.id,
                'name': test.name,
                'workflow_id': test.workflow_id,
                'workflow_name': test.workflow.name,
                'split_percentage': test.split_percentage,
                'variant_a_enrolled': test.variant_a_enrolled,
                'variant_b_enrolled': test.variant_b_enrolled,
                'variant_a_converted': test.variant_a_converted,
                'variant_b_converted': test.variant_b_converted,
                'variant_a_conversion_rate': test.variant_a_conversion_rate,
                'variant_b_conversion_rate': test.variant_b_conversion_rate,
                'winner': test.winner,
                'is_active': test.is_active,
            })
        
        return JsonResponse({'ab_tests': tests_data})
    
    elif request.method == "POST":
        data = json.loads(request.body)
        workflow_id = data.get('workflow_id')
        
        workflow = get_object_or_404(Workflow, id=workflow_id, owner=user)
        
        ab_test = ABTest.objects.create(
            workflow=workflow,
            name=data.get('name'),
            description=data.get('description', ''),
            variant_a_config=data.get('variant_a_config', {}),
            variant_b_config=data.get('variant_b_config', {}),
            split_percentage=data.get('split_percentage', 50),
        )
        
        return JsonResponse({
            'id': ab_test.id,
            'message': 'A/B test created successfully'
        })


@login_required
@require_http_methods(["GET"])
def workflow_templates_list(request):
    """List available workflow templates."""
    # System templates and user-created templates
    templates = WorkflowTemplate.objects.filter(
        models.Q(is_system=True) | models.Q(created_by=request.user)
    )
    
    templates_data = []
    for template in templates:
        templates_data.append({
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'category': template.category,
            'is_system': template.is_system,
            'times_used': template.times_used,
        })
    
    return JsonResponse({'templates': templates_data})


@login_required
@require_http_methods(["POST"])
def create_workflow_from_template(request, template_id):
    """Create a new workflow from a template."""
    template = get_object_or_404(WorkflowTemplate, id=template_id)
    data = json.loads(request.body)
    
    workflow = Workflow.objects.create(
        owner=request.user,
        name=data.get('name', template.name),
        description=data.get('description', template.description),
        workflow_data=template.workflow_data,
        trigger_type=data.get('trigger_type', 'manual'),
    )
    
    # Increment template usage
    template.times_used += 1
    template.save()
    
    return JsonResponse({
        'id': workflow.id,
        'message': 'Workflow created from template successfully'
    })


@login_required
@require_http_methods(["POST"])
def test_workflow_condition(request):
    """Test a condition against a contact."""
    data = json.loads(request.body)
    
    contact_id = data.get('contact_id')
    field = data.get('field')
    operator = data.get('operator')
    value = data.get('value')
    
    contact = get_object_or_404(Contact, id=contact_id, owner=request.user)
    
    result = ConditionEvaluator.evaluate(contact, field, operator, value)
    
    return JsonResponse({
        'result': result,
        'contact_id': contact_id,
        'field': field,
        'operator': operator,
        'value': value,
    })
