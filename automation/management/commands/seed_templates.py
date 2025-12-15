"""
Management command to seed automation templates
"""
from django.core.management.base import BaseCommand
from automation.models import AutomationTemplate


class Command(BaseCommand):
    help = 'Seeds the database with sample automation templates'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'Lead Nurture - 7 Day',
                'description': 'A 7-day nurture sequence for new leads',
                'category': AutomationTemplate.NURTURE,
                'is_system_template': True,
            },
            {
                'name': 'Lead Nurture - 30 Day',
                'description': 'Extended 30-day lead nurture campaign',
                'category': AutomationTemplate.NURTURE,
                'is_system_template': True,
            },
            {
                'name': 'Customer Onboarding',
                'description': 'Welcome and onboard new customers',
                'category': AutomationTemplate.ONBOARDING,
                'is_system_template': True,
            },
            {
                'name': 'Weekly Check-in',
                'description': 'Regular weekly engagement touchpoint',
                'category': AutomationTemplate.ENGAGEMENT,
                'is_system_template': True,
            },
            {
                'name': 'Re-engagement Campaign',
                'description': 'Win back inactive contacts',
                'category': AutomationTemplate.REACTIVATION,
                'is_system_template': True,
            },
            {
                'name': 'Product Launch Sequence',
                'description': 'Announce and promote new products',
                'category': AutomationTemplate.ENGAGEMENT,
                'is_system_template': True,
            },
        ]

        created_count = 0
        for template_data in templates:
            template, created = AutomationTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Template already exists: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\nTotal templates created: {created_count}')
        )
