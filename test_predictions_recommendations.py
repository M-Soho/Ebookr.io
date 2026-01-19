#!/usr/bin/env python
"""
Test script for AI predictive analytics and smart recommendations
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
sys.path.insert(0, '/workspaces/Ebookr.io')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from contacts.models import Contact, Activity
from ai_features.services import PredictiveAnalyticsService, SmartRecommendationService
from ai_features.models import ContactScore


def print_separator(title=""):
    print("\n" + "="*60)
    if title:
        print(title)
        print("="*60)
    print()


def test_predictive_analytics():
    """Test predictive analytics service"""
    print_separator("Testing Predictive Analytics")
    
    # Get or create test user
    user, _ = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    # Create some test contacts with dates spread over time
    print("Creating test data...")
    for i in range(30):
        date = timezone.now() - timedelta(days=30-i)
        # Create 1-3 contacts per day
        for j in range((i % 3) + 1):
            if not Contact.objects.filter(
                owner=user, 
                email=f"contact_{i}_{j}@test.com"
            ).exists():
                contact = Contact.objects.create(
                    owner=user,
                    first_name=f"Test{i}",
                    last_name=f"Contact{j}",
                    email=f"contact_{i}_{j}@test.com",
                    company=f"Company {i}",
                    created_at=date
                )
                
                # Add some activities
                for k in range((i % 5)):
                    activity_date = date + timedelta(hours=k)
                    if not Activity.objects.filter(
                        created_by=user,
                        contact=contact,
                        created_at=activity_date
                    ).exists():
                        Activity.objects.create(
                            created_by=user,
                            contact=contact,
                            activity_type=['email', 'call', 'meeting'][k % 3],
                            title=f"Activity {k}",
                            created_at=activity_date
                        )
    
    print(f"✓ Created test data")
    
    # Test different prediction types
    service = PredictiveAnalyticsService()
    
    metrics = [
        'contact_growth',
        'email_engagement', 
        'conversion_rate',
        'churn_rate'
    ]
    
    for metric in metrics:
        print(f"\n📊 Generating prediction for: {metric}")
        
        prediction = service.generate_prediction(
            user=user,
            metric=metric,
            training_period_days=30,
            forecast_period_days=7
        )
        
        print(f"\n✅ Prediction Generated!")
        print(f"\nMetric: {prediction.metric}")
        print(f"Trend Direction: {prediction.trend_direction.upper()}")
        print(f"Accuracy Score: {prediction.accuracy_score or 'N/A'}")
        
        # Show historical data summary
        hist_values = prediction.historical_data.get('values', [])
        if hist_values:
            print(f"\nHistorical Data Summary:")
            print(f"  • Data Points: {len(hist_values)}")
            print(f"  • Average: {sum(hist_values)/len(hist_values):.2f}")
            print(f"  • Min: {min(hist_values):.2f}")
            print(f"  • Max: {max(hist_values):.2f}")
        
        # Show forecast
        forecast_values = prediction.predicted_values.get('values', [])
        if forecast_values:
            print(f"\nForecast (Next {len(forecast_values)} days):")
            print(f"  • Predicted Average: {sum(forecast_values)/len(forecast_values):.2f}")
            print(f"  • Predicted Range: {min(forecast_values):.2f} - {max(forecast_values):.2f}")
        
        # Show confidence intervals
        conf_lower = prediction.confidence_interval.get('lower', [])
        conf_upper = prediction.confidence_interval.get('upper', [])
        if conf_lower and conf_upper:
            print(f"\n95% Confidence Interval:")
            avg_lower = sum(conf_lower) / len(conf_lower)
            avg_upper = sum(conf_upper) / len(conf_upper)
            print(f"  • Lower Bound: {avg_lower:.2f}")
            print(f"  • Upper Bound: {avg_upper:.2f}")
        
        # Show anomalies
        anomalies = prediction.anomalies_detected
        if anomalies:
            print(f"\n⚠️  Anomalies Detected: {len(anomalies)}")
            for anomaly in anomalies[:3]:  # Show first 3
                print(f"  • {anomaly['date'][:10]}: {anomaly['value']} (expected: {anomaly['expected']})")
        
        # Show recommendations
        if prediction.recommendations:
            print(f"\n💡 Recommendations:")
            print(f"  {prediction.recommendations}")


def test_smart_recommendations():
    """Test smart recommendations service"""
    print_separator("Testing Smart Recommendations")
    
    # Get or create test user
    user, _ = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    # Create some high-scoring contacts
    print("Creating test contacts with scores...")
    
    for i in range(5):
        contact, _ = Contact.objects.get_or_create(
            owner=user,
            email=f"scored_contact_{i}@test.com",
            defaults={
                'first_name': f"Scored{i}",
                'last_name': f"Contact{i}",
                'company': f"HighValue Corp {i}"
            }
        )
        
        # Create high score
        ContactScore.objects.update_or_create(
            contact=contact,
            owner=user,
            defaults={
                'engagement_score': 90.0,
                'recency_score': 85.0,
                'response_rate_score': 80.0,
                'profile_completeness': 75.0,
                'overall_score': 85.0,
                'score_level': 'hot',
                'conversion_probability': 0.85,
                'churn_risk': 0.15,
                'next_best_action': 'Schedule meeting or call',
                'key_insights': ['Highly engaged', 'Quick responder'],
                'behavioral_patterns': {}
            }
        )
    
    # Create some at-risk contacts
    for i in range(3):
        contact, _ = Contact.objects.get_or_create(
            owner=user,
            email=f"churn_risk_{i}@test.com",
            defaults={
                'first_name': f"Churn{i}",
                'last_name': f"Risk{i}",
                'company': f"AtRisk Inc {i}"
            }
        )
        
        ContactScore.objects.update_or_create(
            contact=contact,
            owner=user,
            defaults={
                'engagement_score': 20.0,
                'recency_score': 10.0,
                'response_rate_score': 15.0,
                'profile_completeness': 60.0,
                'overall_score': 25.0,
                'score_level': 'cold',
                'conversion_probability': 0.15,
                'churn_risk': 0.85,
                'next_best_action': 'Send re-engagement email',
                'key_insights': ['Low engagement', 'At risk of churning'],
                'behavioral_patterns': {}
            }
        )
    
    print("✓ Created scored contacts")
    
    # Generate recommendations
    print("\n🤖 Generating smart recommendations...")
    service = SmartRecommendationService()
    recommendations = service.generate_recommendations(user, limit=15)
    
    print(f"\n✅ Generated {len(recommendations)} Recommendations!\n")
    
    # Group by type and priority
    by_type = {}
    by_priority = {'high': [], 'medium': [], 'low': []}
    
    for rec in recommendations:
        # Group by type
        if rec.recommendation_type not in by_type:
            by_type[rec.recommendation_type] = []
        by_type[rec.recommendation_type].append(rec)
        
        # Group by priority
        by_priority[rec.priority].append(rec)
    
    # Display summary
    print("📊 Summary by Type:")
    for rec_type, recs in by_type.items():
        print(f"  • {rec_type}: {len(recs)}")
    
    print("\n📊 Summary by Priority:")
    for priority in ['high', 'medium', 'low']:
        count = len(by_priority[priority])
        if count > 0:
            print(f"  • {priority.upper()}: {count}")
    
    # Display top recommendations
    print("\n" + "="*60)
    print("Top Recommendations:")
    print("="*60)
    
    for i, rec in enumerate(recommendations[:10], 1):
        print(f"\n{i}. [{rec.priority.upper()}] {rec.title}")
        print(f"   Type: {rec.recommendation_type}")
        print(f"   {rec.description}")
        print(f"   Expected Impact: {rec.expected_impact}")
        print(f"   Confidence: {rec.confidence_score*100:.1f}%")
        if rec.action_url:
            print(f"   Action: {rec.action_url}")
        if rec.related_contact:
            print(f"   Contact: {rec.related_contact.email}")
        print(f"   Expires: {rec.expires_at.strftime('%Y-%m-%d %H:%M')}")


def main():
    print_separator("AI PREDICTIVE ANALYTICS & RECOMMENDATIONS TEST")
    
    try:
        # Test predictive analytics
        test_predictive_analytics()
        
        # Test smart recommendations
        test_smart_recommendations()
        
        print_separator("✅ All Tests Completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
