#!/usr/bin/env python
"""
Test script for AI Features
Demonstrates the core AI capabilities
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from contacts.models import Contact, Activity
from ai_features.services import (
    EmailGenerationService,
    ContactScoringService,
    SentimentAnalysisService
)
from ai_features.models import ContactScore


def test_email_generation():
    """Test AI email generation"""
    print("\n" + "="*60)
    print("Testing AI Email Generation")
    print("="*60)
    
    # Get or create a test user
    user, _ = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    # Get or create a test contact
    contact, _ = Contact.objects.get_or_create(
        email='john.doe@example.com',
        owner=user,
        defaults={
            'first_name': 'John',
            'last_name': 'Doe',
            'company': 'Acme Corp',
            'status': 'active'
        }
    )
    
    service = EmailGenerationService()
    
    contact_name = f"{contact.first_name} {contact.last_name}".strip()
    print(f"\nGenerating email for: {contact_name} ({contact.email})")
    print(f"Category: follow_up")
    print(f"Tone: professional")
    
    email_data, error = service.generate_email(
        contact=contact,
        category='follow_up',
        tone='professional'
    )
    
    if error:
        print(f"\n❌ Error: {error}")
    else:
        print(f"\n✅ Email Generated Successfully!")
        print(f"\nSubject: {email_data['subject']}")
        print(f"\nBody:\n{email_data['body']}")


def test_contact_scoring():
    """Test contact scoring algorithm"""
    print("\n" + "="*60)
    print("Testing Contact Scoring")
    print("="*60)
    
    user = User.objects.filter(username='testuser').first()
    if not user:
        print("❌ No test user found")
        return
    
    contact = Contact.objects.filter(owner=user).first()
    if not contact:
        print("❌ No test contact found")
        return
    
    # Create some test activities (if they don't already exist)
    if not Activity.objects.filter(contact=contact, activity_type='email', title='Initial outreach').exists():
        Activity.objects.create(
            contact=contact,
            activity_type='email',
            title='Initial outreach',
            description='Sent introduction email'
        )
    
    if not Activity.objects.filter(contact=contact, activity_type='call', title='Discovery call').exists():
        Activity.objects.create(
            contact=contact,
            activity_type='call',
            title='Discovery call',
            description='Discussed needs and requirements'
        )
    
    service = ContactScoringService()
    
    contact_name = f"{contact.first_name} {contact.last_name}".strip()
    print(f"\nCalculating score for: {contact_name}")
    
    score = service.calculate_contact_score(contact)
    
    print(f"\n✅ Score Calculated Successfully!")
    print(f"\n{'='*60}")
    print(f"Overall Score: {score.overall_score:.1f}/100")
    print(f"Score Level: {score.score_level.upper()}")
    print(f"{'='*60}")
    
    print(f"\nComponent Scores:")
    print(f"  • Engagement: {score.engagement_score:.1f}/100")
    print(f"  • Recency: {score.recency_score:.1f}/100")
    print(f"  • Response Rate: {score.response_rate_score:.1f}/100")
    print(f"  • Profile Completeness: {score.profile_completeness:.1f}/100")
    
    print(f"\nPredictions:")
    print(f"  • Conversion Probability: {score.conversion_probability * 100:.1f}%")
    print(f"  • Churn Risk: {score.churn_risk * 100:.1f}%")
    
    print(f"\nRecommended Action:")
    print(f"  → {score.next_best_action}")
    
    if score.key_insights:
        print(f"\nKey Insights:")
        for insight in score.key_insights:
            print(f"  • {insight}")
    
    if score.behavioral_patterns:
        print(f"\nBehavioral Patterns:")
        patterns = score.behavioral_patterns
        if 'total_interactions' in patterns:
            print(f"  • Total Interactions: {patterns['total_interactions']}")
        if 'activity_distribution' in patterns:
            print(f"  • Activity Distribution:")
            for activity_type, count in patterns['activity_distribution'].items():
                print(f"    - {activity_type}: {count}")


def test_sentiment_analysis():
    """Test sentiment analysis"""
    print("\n" + "="*60)
    print("Testing Sentiment Analysis")
    print("="*60)
    
    user = User.objects.filter(username='testuser').first()
    if not user:
        print("❌ No test user found")
        return
    
    contact = Contact.objects.filter(owner=user).first()
    if not contact:
        print("❌ No test contact found")
        return
    
    service = SentimentAnalysisService()
    
    # Test positive sentiment
    positive_text = "Thank you so much for the great presentation! I'm very impressed with the features and would love to move forward."
    
    print(f"\nAnalyzing text: \"{positive_text[:50]}...\"")
    
    analysis = service.analyze_sentiment(
        text=positive_text,
        contact=contact,
        source_type='email'
    )
    
    if analysis:
        print(f"\n✅ Sentiment Analyzed Successfully!")
        print(f"\nSentiment: {analysis.sentiment.upper()}")
        print(f"Confidence: {analysis.confidence * 100:.1f}%")
        print(f"Sentiment Score: {analysis.sentiment_score:.2f}")
        print(f"Response Urgency: {analysis.response_urgency}")
        
        if analysis.emotions:
            print(f"\nDetected Emotions:")
            for emotion, score in analysis.emotions.items():
                if isinstance(score, (int, float)):
                    print(f"  • {emotion}: {score * 100:.0f}%")
                else:
                    print(f"  • {emotion}: {score}")


def test_api_availability():
    """Test if AI services are available"""
    print("\n" + "="*60)
    print("Testing AI Service Availability")
    print("="*60)
    
    from ai_features.services import AnthropicService
    
    service = AnthropicService()
    
    if service.is_available():
        print("\n✅ Anthropic API is configured and available")
        print(f"Using Claude model for AI features")
    else:
        print("\n⚠️  Anthropic API not configured")
        print("AI features will use mock data for development")
        print("\nTo enable real AI features:")
        print("1. Get an API key from https://console.anthropic.com/")
        print("2. Add to .env file: ANTHROPIC_API_KEY=sk-ant-api...")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("AI FEATURES TEST SUITE")
    print("="*60)
    
    try:
        # Check API availability
        test_api_availability()
        
        # Test email generation
        test_email_generation()
        
        # Test contact scoring
        test_contact_scoring()
        
        # Test sentiment analysis
        test_sentiment_analysis()
        
        print("\n" + "="*60)
        print("✅ All Tests Completed!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
