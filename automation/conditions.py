"""
Conditional logic engine for automation workflows.
Allows for complex rules and branching based on contact data.
"""
from django.db import models
from contacts.models import Contact
import json


class ConditionOperator:
    """Available operators for conditions."""
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
    LESS_THAN_OR_EQUAL = "less_than_or_equal"
    IN_LIST = "in_list"
    NOT_IN_LIST = "not_in_list"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"
    
    CHOICES = [
        (EQUALS, "Equals"),
        (NOT_EQUALS, "Not Equals"),
        (CONTAINS, "Contains"),
        (NOT_CONTAINS, "Does Not Contain"),
        (GREATER_THAN, "Greater Than"),
        (LESS_THAN, "Less Than"),
        (GREATER_THAN_OR_EQUAL, "Greater Than or Equal"),
        (LESS_THAN_OR_EQUAL, "Less Than or Equal"),
        (IN_LIST, "In List"),
        (NOT_IN_LIST, "Not In List"),
        (IS_EMPTY, "Is Empty"),
        (IS_NOT_EMPTY, "Is Not Empty"),
    ]


class ConditionEvaluator:
    """Evaluate conditions against contact data."""
    
    @staticmethod
    def evaluate(contact: Contact, field: str, operator: str, value: any) -> bool:
        """
        Evaluate a single condition.
        
        Args:
            contact: Contact instance to evaluate
            field: Field name to check (e.g., 'status', 'lead_score', 'email')
            operator: Comparison operator
            value: Value to compare against
            
        Returns:
            Boolean result of the condition
        """
        # Get field value from contact
        field_value = ConditionEvaluator._get_field_value(contact, field)
        
        # Evaluate based on operator
        if operator == ConditionOperator.EQUALS:
            return field_value == value
        
        elif operator == ConditionOperator.NOT_EQUALS:
            return field_value != value
        
        elif operator == ConditionOperator.CONTAINS:
            if isinstance(field_value, str) and isinstance(value, str):
                return value.lower() in field_value.lower()
            return False
        
        elif operator == ConditionOperator.NOT_CONTAINS:
            if isinstance(field_value, str) and isinstance(value, str):
                return value.lower() not in field_value.lower()
            return True
        
        elif operator == ConditionOperator.GREATER_THAN:
            try:
                return float(field_value) > float(value)
            except (ValueError, TypeError):
                return False
        
        elif operator == ConditionOperator.LESS_THAN:
            try:
                return float(field_value) < float(value)
            except (ValueError, TypeError):
                return False
        
        elif operator == ConditionOperator.GREATER_THAN_OR_EQUAL:
            try:
                return float(field_value) >= float(value)
            except (ValueError, TypeError):
                return False
        
        elif operator == ConditionOperator.LESS_THAN_OR_EQUAL:
            try:
                return float(field_value) <= float(value)
            except (ValueError, TypeError):
                return False
        
        elif operator == ConditionOperator.IN_LIST:
            if isinstance(value, list):
                return field_value in value
            return False
        
        elif operator == ConditionOperator.NOT_IN_LIST:
            if isinstance(value, list):
                return field_value not in value
            return True
        
        elif operator == ConditionOperator.IS_EMPTY:
            return not field_value or field_value == "" or field_value == None
        
        elif operator == ConditionOperator.IS_NOT_EMPTY:
            return field_value and field_value != "" and field_value != None
        
        return False
    
    @staticmethod
    def _get_field_value(contact: Contact, field: str):
        """Get field value from contact, supporting nested fields."""
        # Handle custom fields
        if field.startswith('custom_'):
            return contact.custom_fields.get(field, None)
        
        # Handle related fields (e.g., 'tags__name')
        if '__' in field:
            parts = field.split('__')
            obj = contact
            for part in parts:
                if hasattr(obj, part):
                    obj = getattr(obj, part)
                else:
                    return None
            return obj
        
        # Handle direct fields
        if hasattr(contact, field):
            return getattr(contact, field)
        
        return None
    
    @staticmethod
    def evaluate_group(contact: Contact, conditions: list, logic: str = "AND") -> bool:
        """
        Evaluate a group of conditions with AND/OR logic.
        
        Args:
            contact: Contact instance
            conditions: List of condition dicts with 'field', 'operator', 'value'
            logic: Either "AND" or "OR"
            
        Returns:
            Boolean result of all conditions combined
        """
        if not conditions:
            return True
        
        results = []
        for condition in conditions:
            field = condition.get('field')
            operator = condition.get('operator')
            value = condition.get('value')
            
            result = ConditionEvaluator.evaluate(contact, field, operator, value)
            results.append(result)
        
        if logic == "AND":
            return all(results)
        elif logic == "OR":
            return any(results)
        
        return False


class WorkflowNode:
    """Base class for workflow nodes."""
    
    def __init__(self, node_id: str, node_type: str):
        self.node_id = node_id
        self.node_type = node_type
        self.next_nodes = []
    
    def execute(self, contact: Contact) -> str:
        """
        Execute this node.
        
        Returns:
            ID of the next node to execute
        """
        raise NotImplementedError


class ActionNode(WorkflowNode):
    """Node that performs an action (send email, wait, etc.)."""
    
    def __init__(self, node_id: str, action_type: str, action_data: dict):
        super().__init__(node_id, "action")
        self.action_type = action_type
        self.action_data = action_data
    
    def execute(self, contact: Contact) -> str:
        """Execute the action and return next node."""
        # Action logic would be implemented here
        # For now, just return the first next node
        return self.next_nodes[0] if self.next_nodes else None


class DecisionNode(WorkflowNode):
    """Node that branches based on conditions."""
    
    def __init__(self, node_id: str, conditions: list, logic: str = "AND"):
        super().__init__(node_id, "decision")
        self.conditions = conditions
        self.logic = logic
        self.true_node = None
        self.false_node = None
    
    def execute(self, contact: Contact) -> str:
        """Evaluate conditions and return appropriate next node."""
        result = ConditionEvaluator.evaluate_group(contact, self.conditions, self.logic)
        
        if result:
            return self.true_node
        else:
            return self.false_node


class WaitNode(WorkflowNode):
    """Node that waits for a specified duration."""
    
    def __init__(self, node_id: str, wait_duration: int, wait_unit: str):
        super().__init__(node_id, "wait")
        self.wait_duration = wait_duration
        self.wait_unit = wait_unit  # 'minutes', 'hours', 'days'
    
    def execute(self, contact: Contact) -> str:
        """Schedule the next node for later execution."""
        # This would schedule the next node
        return self.next_nodes[0] if self.next_nodes else None


class ABTestNode(WorkflowNode):
    """Node that randomly splits contacts for A/B testing."""
    
    def __init__(self, node_id: str, split_percentage: int):
        super().__init__(node_id, "ab_test")
        self.split_percentage = split_percentage  # 0-100
        self.variant_a_node = None
        self.variant_b_node = None
    
    def execute(self, contact: Contact) -> str:
        """Randomly assign to variant A or B."""
        import random
        if random.randint(1, 100) <= self.split_percentage:
            return self.variant_a_node
        else:
            return self.variant_b_node
