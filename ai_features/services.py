"""
AI Features Service Layer
Handles integration with Anthropic Claude API and AI processing logic
"""

import os
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Count, Avg, Q
from django.utils import timezone

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    
from contacts.models import Contact, Activity
from .models import (
    AIEmailTemplate,
    GeneratedEmail,
    ContactScore,
    PredictiveAnalytics,
    SmartRecommendation,
    SentimentAnalysis
)

logger = logging.getLogger(__name__)


class AnthropicService:
    """Service for interacting with Anthropic Claude API"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        if not self.api_key:
            logger.warning("ANTHROPIC_API_KEY not configured in settings")
        
        if ANTHROPIC_AVAILABLE and self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("Anthropic client not available")
    
    def is_available(self) -> bool:
        """Check if Anthropic API is configured and available"""
        return self.client is not None
    
    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        model: str = "claude-3-5-sonnet-20241022"
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Generate a completion using Claude API
        Returns: (response_text, error_message)
        """
        if not self.is_available():
            return None, "Anthropic API not configured"
        
        try:
            start_time = datetime.now()
            
            messages = [{"role": "user", "content": prompt}]
            
            kwargs = {
                "model": model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": messages
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            response = self.client.messages.create(**kwargs)
            
            generation_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Claude API call completed in {generation_time:.0f}ms")
            
            # Extract text from response
            if response.content and len(response.content) > 0:
                return response.content[0].text, None
            
            return None, "No content in response"
            
        except Exception as e:
            logger.error(f"Error calling Anthropic API: {str(e)}")
            return None, str(e)


class EmailGenerationService:
    """Service for AI-powered email generation"""
    
    def __init__(self):
        self.anthropic = AnthropicService()
    
    def generate_email(
        self,
        contact: Contact,
        template: Optional[AIEmailTemplate] = None,
        category: str = 'follow_up',
        custom_prompt: Optional[str] = None,
        tone: str = 'professional',
        additional_context: Optional[Dict] = None
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Generate a personalized email for a contact
        Returns: (email_data, error_message)
        """
        if not self.anthropic.is_available():
            # Return mock data for development
            return self._generate_mock_email(contact, category, tone), None
        
        try:
            # Build context about the contact
            contact_context = self._build_contact_context(contact, additional_context)
            
            # Build the prompt
            if template:
                prompt = template.prompt
            elif custom_prompt:
                prompt = custom_prompt
            else:
                prompt = self._build_default_prompt(category, tone)
            
            # Create system prompt
            system_prompt = f"""You are an expert email writer helping to create personalized, professional emails.
Generate an email that is {tone} in tone.
Contact context: {json.dumps(contact_context, indent=2)}

Generate ONLY a JSON response with this exact structure:
{{
    "subject": "email subject line",
    "body": "email body text"
}}"""
            
            # Generate email
            response_text, error = self.anthropic.generate_completion(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.8,
                max_tokens=1500
            )
            
            if error:
                return None, error
            
            # Parse JSON response
            try:
                # Try to extract JSON from the response
                response_text = response_text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif response_text.startswith('```'):
                    response_text = response_text.split('```')[1].split('```')[0].strip()
                
                email_data = json.loads(response_text)
                return email_data, None
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI response as JSON: {response_text[:200]}")
                return None, "Failed to parse AI response"
                
        except Exception as e:
            logger.error(f"Error generating email: {str(e)}")
            return None, str(e)
    
    def _build_contact_context(self, contact: Contact, additional_context: Optional[Dict]) -> Dict:
        """Build context information about the contact"""
        contact_name = f"{contact.first_name} {contact.last_name}".strip() or "there"
        
        context = {
            'name': contact_name,
            'email': contact.email,
            'company': contact.company or 'Unknown',
            'status': contact.status,
            'source': contact.source or 'Unknown',
        }
        
        if hasattr(contact, 'contact_pref'):
            context['preferred_contact'] = contact.contact_pref
        
        if hasattr(contact, 'contact_cadence'):
            context['cadence'] = contact.contact_cadence
        
        # Get recent activities
        recent_activities = Activity.objects.filter(
            contact=contact
        ).order_by('-created_at')[:5]
        
        if recent_activities:
            context['recent_activities'] = [
                {
                    'type': act.activity_type,
                    'title': act.title,
                    'date': act.created_at.isoformat()
                }
                for act in recent_activities
            ]
        
        if additional_context:
            context.update(additional_context)
        
        return context
    
    def _build_default_prompt(self, category: str, tone: str) -> str:
        """Build a default prompt based on category"""
        prompts = {
            'introduction': f"Write a {tone} introduction email to establish initial contact.",
            'follow_up': f"Write a {tone} follow-up email checking in and maintaining engagement.",
            'proposal': f"Write a {tone} proposal email presenting a solution or offer.",
            'thank_you': f"Write a {tone} thank you email expressing gratitude.",
            're_engagement': f"Write a {tone} re-engagement email to reconnect with an inactive contact.",
            'meeting_request': f"Write a {tone} meeting request email to schedule a call or meeting.",
        }
        return prompts.get(category, f"Write a {tone} professional email.")
    
    def _generate_mock_email(self, contact: Contact, category: str, tone: str) -> Dict:
        """Generate mock email data for development/testing"""
        contact_name = f"{contact.first_name} {contact.last_name}".strip() or "there"
        
        mock_emails = {
            'introduction': {
                'subject': f"Introduction - Partnership Opportunity with {contact.company or 'Your Company'}",
                'body': f"""Hi {contact_name},

I hope this email finds you well. I wanted to reach out to introduce myself and explore potential collaboration opportunities.

I've been following {contact.company or 'your work'} and am impressed by your approach. I believe there could be some interesting synergies between our organizations.

Would you be open to a brief call next week to discuss this further?

Best regards"""
            },
            'follow_up': {
                'subject': f"Following up on our conversation",
                'body': f"""Hi {contact_name},

I wanted to follow up on our last conversation and see if you had any questions or needed additional information.

I'm here to help and would love to continue our discussion.

Looking forward to hearing from you.

Best regards"""
            }
        }
        
        return mock_emails.get(category, {
            'subject': f"Message for {contact_name}",
            'body': f"""Hi {contact_name},\n\nI wanted to reach out regarding our recent interaction.\n\nBest regards"""
        })


class ContactScoringService:
    """Service for AI-powered contact scoring and prioritization"""
    
    def calculate_contact_score(self, contact: Contact) -> ContactScore:
        """
        Calculate comprehensive AI score for a contact
        Returns ContactScore instance
        """
        # Calculate component scores
        engagement_score = self._calculate_engagement_score(contact)
        recency_score = self._calculate_recency_score(contact)
        response_rate_score = self._calculate_response_rate_score(contact)
        profile_completeness = self._calculate_profile_completeness(contact)
        
        # Calculate overall score (weighted average)
        overall_score = (
            engagement_score * 0.35 +
            recency_score * 0.25 +
            response_rate_score * 0.25 +
            profile_completeness * 0.15
        )
        
        # Determine score level
        score_level = self._determine_score_level(overall_score)
        
        # Calculate probabilities
        conversion_probability = self._calculate_conversion_probability(
            overall_score, engagement_score, response_rate_score
        )
        churn_risk = self._calculate_churn_risk(recency_score, engagement_score)
        
        # Generate insights
        key_insights = self._generate_insights(contact, {
            'engagement': engagement_score,
            'recency': recency_score,
            'response_rate': response_rate_score,
            'completeness': profile_completeness
        })
        
        # Determine next best action
        next_best_action = self._determine_next_action(contact, score_level, churn_risk)
        
        # Behavioral patterns
        behavioral_patterns = self._analyze_behavioral_patterns(contact)
        
        # Create or update score
        score, created = ContactScore.objects.update_or_create(
            contact=contact,
            owner=contact.owner,
            defaults={
                'engagement_score': engagement_score,
                'recency_score': recency_score,
                'response_rate_score': response_rate_score,
                'profile_completeness': profile_completeness,
                'overall_score': overall_score,
                'score_level': score_level,
                'conversion_probability': conversion_probability,
                'churn_risk': churn_risk,
                'next_best_action': next_best_action,
                'key_insights': key_insights,
                'behavioral_patterns': behavioral_patterns,
            }
        )
        
        return score
    
    def _calculate_engagement_score(self, contact: Contact) -> float:
        """Calculate engagement score based on activities"""
        # Get activities in last 90 days
        ninety_days_ago = timezone.now() - timedelta(days=90)
        recent_activities = Activity.objects.filter(
            contact=contact,
            created_at__gte=ninety_days_ago
        ).count()
        
        # Score based on activity count
        if recent_activities >= 10:
            return 100.0
        elif recent_activities >= 5:
            return 75.0
        elif recent_activities >= 2:
            return 50.0
        elif recent_activities >= 1:
            return 25.0
        else:
            return 0.0
    
    def _calculate_recency_score(self, contact: Contact) -> float:
        """Calculate recency score based on last interaction"""
        last_activity = Activity.objects.filter(
            contact=contact
        ).order_by('-created_at').first()
        
        if not last_activity:
            return 0.0
        
        days_since = (timezone.now() - last_activity.created_at).days
        
        if days_since <= 7:
            return 100.0
        elif days_since <= 14:
            return 80.0
        elif days_since <= 30:
            return 60.0
        elif days_since <= 60:
            return 40.0
        elif days_since <= 90:
            return 20.0
        else:
            return 0.0
    
    def _calculate_response_rate_score(self, contact: Contact) -> float:
        """Calculate response rate score"""
        # Get email activities
        email_sent = Activity.objects.filter(
            contact=contact,
            activity_type='email'
        ).count()
        
        email_responded = Activity.objects.filter(
            contact=contact,
            activity_type__in=['email', 'call', 'meeting']
        ).count()
        
        if email_sent == 0:
            return 50.0  # Neutral score if no emails sent
        
        response_rate = (email_responded / email_sent) * 100
        return min(response_rate, 100.0)
    
    def _calculate_profile_completeness(self, contact: Contact) -> float:
        """Calculate profile completeness score"""
        score = 0.0
        total_fields = 6
        
        if contact.first_name:
            score += 100 / total_fields
        if contact.last_name:
            score += 100 / total_fields
        if contact.email:
            score += 100 / total_fields
        if contact.company:
            score += 100 / total_fields
        if contact.source:
            score += 100 / total_fields
        if contact.notes:
            score += 100 / total_fields
        
        return score
    
    def _determine_score_level(self, overall_score: float) -> str:
        """Determine score level category"""
        if overall_score >= 80:
            return 'hot'
        elif overall_score >= 60:
            return 'warm'
        elif overall_score >= 40:
            return 'cold'
        elif overall_score >= 20:
            return 'nurture'
        else:
            return 'inactive'
    
    def _calculate_conversion_probability(
        self, overall_score: float, engagement: float, response_rate: float
    ) -> float:
        """Calculate probability of conversion"""
        # Weighted calculation
        probability = (overall_score * 0.5 + engagement * 0.3 + response_rate * 0.2) / 100
        return min(max(probability, 0.0), 1.0)
    
    def _calculate_churn_risk(self, recency_score: float, engagement_score: float) -> float:
        """Calculate churn risk"""
        # Higher churn risk when recency and engagement are low
        risk = (100 - recency_score) * 0.6 + (100 - engagement_score) * 0.4
        return risk / 100
    
    def _generate_insights(self, contact: Contact, scores: Dict) -> List[str]:
        """Generate key insights about the contact"""
        insights = []
        
        if scores['engagement'] >= 75:
            insights.append("Highly engaged contact with frequent interactions")
        elif scores['engagement'] <= 25:
            insights.append("Low engagement - needs re-activation strategy")
        
        if scores['recency'] <= 40:
            insights.append("No recent activity - follow-up recommended")
        
        if scores['response_rate'] >= 70:
            insights.append("High response rate - strong interest indicator")
        
        if scores['completeness'] <= 50:
            insights.append("Incomplete profile - gather more information")
        
        return insights
    
    def _determine_next_action(self, contact: Contact, score_level: str, churn_risk: float) -> str:
        """Determine the next best action for this contact"""
        if churn_risk > 0.7:
            return "Send re-engagement email"
        elif score_level == 'hot':
            return "Schedule meeting or call"
        elif score_level == 'warm':
            return "Send targeted follow-up"
        elif score_level == 'cold':
            return "Nurture with valuable content"
        else:
            return "Update contact information"
    
    def _analyze_behavioral_patterns(self, contact: Contact) -> Dict:
        """Analyze behavioral patterns"""
        activities = Activity.objects.filter(contact=contact).order_by('created_at')
        
        if not activities.exists():
            return {}
        
        # Analyze activity types
        activity_distribution = {}
        for activity in activities:
            activity_type = activity.activity_type
            activity_distribution[activity_type] = activity_distribution.get(activity_type, 0) + 1
        
        # Most active day of week (if we have timestamps)
        # Most active time of day
        
        return {
            'activity_distribution': activity_distribution,
            'total_interactions': activities.count(),
            'first_interaction': activities.first().created_at.isoformat() if activities.first() else None,
            'last_interaction': activities.last().created_at.isoformat() if activities.last() else None,
        }


class PredictiveAnalyticsService:
    """Service for predictive analytics and forecasting"""
    
    def generate_prediction(
        self,
        user: User,
        metric: str,
        training_period_days: int = 90,
        forecast_period_days: int = 30
    ) -> PredictiveAnalytics:
        """
        Generate predictive analytics for a given metric.
        Uses historical data to forecast future trends.
        """
        from ai_features.models import PredictiveAnalytics
        
        # Get historical data
        historical_data = self._get_historical_data(user, metric, training_period_days)
        
        # Calculate predictions
        predicted_values = self._calculate_forecast(
            historical_data, forecast_period_days
        )
        
        # Calculate confidence intervals
        confidence_interval = self._calculate_confidence_interval(
            historical_data, predicted_values
        )
        
        # Determine trend direction
        trend_direction = self._determine_trend(historical_data)
        
        # Detect anomalies
        anomalies = self._detect_anomalies(historical_data)
        
        # Calculate accuracy (if we have past predictions to compare)
        accuracy_score = self._calculate_accuracy(user, metric)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            metric, trend_direction, anomalies, predicted_values
        )
        
        # Create or update prediction
        prediction, created = PredictiveAnalytics.objects.update_or_create(
            owner=user,
            metric=metric,
            defaults={
                'historical_data': historical_data,
                'training_period_days': training_period_days,
                'predicted_values': predicted_values,
                'forecast_period_days': forecast_period_days,
                'confidence_interval': confidence_interval,
                'accuracy_score': accuracy_score,
                'trend_direction': trend_direction,
                'anomalies_detected': anomalies,
                'recommendations': recommendations,
            }
        )
        
        return prediction
    
    def _get_historical_data(self, user: User, metric: str, days: int) -> Dict:
        """Get historical data for the specified metric"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        dates = []
        values = []
        
        if metric == 'contact_growth':
            # Count new contacts per day
            current = start_date
            while current <= end_date:
                count = Contact.objects.filter(
                    owner=user,
                    created_at__date=current.date()
                ).count()
                dates.append(current.isoformat())
                values.append(count)
                current += timedelta(days=1)
        
        elif metric == 'email_engagement':
            # Calculate email engagement rate per day
            current = start_date
            while current <= end_date:
                emails_sent = Activity.objects.filter(
                    created_by=user,
                    activity_type='email',
                    created_at__date=current.date()
                ).count()
                
                # Engagement: calls + meetings as responses to emails
                engagements = Activity.objects.filter(
                    created_by=user,
                    activity_type__in=['call', 'meeting'],
                    created_at__date=current.date()
                ).count()
                
                rate = (engagements / emails_sent * 100) if emails_sent > 0 else 0
                dates.append(current.isoformat())
                values.append(round(rate, 2))
                current += timedelta(days=1)
        
        elif metric == 'conversion_rate':
            # Calculate conversion rate (contacts with recent activity)
            current = start_date
            while current <= end_date:
                total_contacts = Contact.objects.filter(
                    owner=user,
                    created_at__lte=current
                ).count()
                
                active_contacts = Contact.objects.filter(
                    owner=user,
                    activities__created_at__date=current.date()
                ).distinct().count()
                
                rate = (active_contacts / total_contacts * 100) if total_contacts > 0 else 0
                dates.append(current.isoformat())
                values.append(round(rate, 2))
                current += timedelta(days=1)
        
        elif metric == 'churn_rate':
            # Calculate churn rate (contacts with no activity in 30 days)
            current = start_date
            while current <= end_date:
                total_contacts = Contact.objects.filter(
                    owner=user,
                    created_at__lte=current
                ).count()
                
                inactive_cutoff = current - timedelta(days=30)
                churned = Contact.objects.filter(
                    owner=user,
                    created_at__lte=current
                ).exclude(
                    activities__created_at__gte=inactive_cutoff
                ).count()
                
                rate = (churned / total_contacts * 100) if total_contacts > 0 else 0
                dates.append(current.isoformat())
                values.append(round(rate, 2))
                current += timedelta(days=1)
        
        else:
            # Default: contact growth
            current = start_date
            while current <= end_date:
                count = Contact.objects.filter(
                    owner=user,
                    created_at__date=current.date()
                ).count()
                dates.append(current.isoformat())
                values.append(count)
                current += timedelta(days=1)
        
        return {'dates': dates, 'values': values}
    
    def _calculate_forecast(self, historical_data: Dict, forecast_days: int) -> Dict:
        """Calculate forecast using simple moving average and trend"""
        values = historical_data['values']
        
        if len(values) < 7:
            # Not enough data, return flat forecast
            avg = sum(values) / len(values) if values else 0
            return {
                'dates': [(timezone.now() + timedelta(days=i)).isoformat() 
                         for i in range(1, forecast_days + 1)],
                'values': [avg] * forecast_days
            }
        
        # Calculate moving average (7-day window)
        window_size = min(7, len(values))
        moving_avg = sum(values[-window_size:]) / window_size
        
        # Calculate trend (linear regression slope)
        x_values = list(range(len(values)))
        y_values = values
        
        n = len(values)
        sum_x = sum(x_values)
        sum_y = sum(y_values)
        sum_xy = sum(x * y for x, y in zip(x_values, y_values))
        sum_x2 = sum(x * x for x in x_values)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) if (n * sum_x2 - sum_x * sum_x) != 0 else 0
        intercept = (sum_y - slope * sum_x) / n
        
        # Generate forecast
        forecast_dates = []
        forecast_values = []
        
        for i in range(1, forecast_days + 1):
            future_date = timezone.now() + timedelta(days=i)
            forecast_dates.append(future_date.isoformat())
            
            # Predict using trend line
            predicted_value = intercept + slope * (len(values) + i)
            
            # Smooth with moving average
            predicted_value = predicted_value * 0.7 + moving_avg * 0.3
            
            # Ensure non-negative
            predicted_value = max(0, predicted_value)
            
            forecast_values.append(round(predicted_value, 2))
        
        return {'dates': forecast_dates, 'values': forecast_values}
    
    def _calculate_confidence_interval(self, historical_data: Dict, predicted_values: Dict) -> Dict:
        """Calculate confidence intervals for predictions"""
        values = historical_data['values']
        
        if len(values) < 2:
            return {'lower': [], 'upper': []}
        
        # Calculate standard deviation
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5
        
        # 95% confidence interval (~1.96 std devs)
        confidence_factor = 1.96
        
        lower = [max(0, v - confidence_factor * std_dev) for v in predicted_values['values']]
        upper = [v + confidence_factor * std_dev for v in predicted_values['values']]
        
        return {
            'lower': [round(v, 2) for v in lower],
            'upper': [round(v, 2) for v in upper]
        }
    
    def _determine_trend(self, historical_data: Dict) -> str:
        """Determine if trend is increasing, decreasing, or stable"""
        values = historical_data['values']
        
        if len(values) < 2:
            return 'stable'
        
        # Compare recent average to older average
        mid_point = len(values) // 2
        first_half_avg = sum(values[:mid_point]) / mid_point if mid_point > 0 else 0
        second_half_avg = sum(values[mid_point:]) / (len(values) - mid_point)
        
        change_pct = ((second_half_avg - first_half_avg) / first_half_avg * 100) if first_half_avg > 0 else 0
        
        if change_pct > 10:
            return 'up'
        elif change_pct < -10:
            return 'down'
        else:
            return 'stable'
    
    def _detect_anomalies(self, historical_data: Dict) -> List[Dict]:
        """Detect anomalies in historical data"""
        values = historical_data['values']
        dates = historical_data['dates']
        
        if len(values) < 7:
            return []
        
        # Calculate mean and std dev
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5
        
        # Detect values outside 2 standard deviations
        anomalies = []
        threshold = 2 * std_dev
        
        for i, (date, value) in enumerate(zip(dates, values)):
            if abs(value - mean) > threshold:
                anomalies.append({
                    'date': date,
                    'value': value,
                    'expected': round(mean, 2),
                    'deviation': round(abs(value - mean), 2)
                })
        
        return anomalies
    
    def _calculate_accuracy(self, user: User, metric: str) -> Optional[float]:
        """Calculate accuracy of past predictions"""
        # Get previous prediction
        from ai_features.models import PredictiveAnalytics
        
        previous = PredictiveAnalytics.objects.filter(
            owner=user,
            metric=metric,
            created_at__lt=timezone.now() - timedelta(days=7)
        ).order_by('-created_at').first()
        
        if not previous or not previous.predicted_values.get('values'):
            return None
        
        # Compare predicted vs actual (simplified)
        # This would need actual implementation to compare properly
        return 0.85  # Placeholder accuracy score
    
    def _generate_recommendations(self, metric: str, trend: str, anomalies: List, predictions: Dict) -> str:
        """Generate actionable recommendations based on predictions"""
        recommendations = []
        
        # Trend-based recommendations
        if trend == 'up':
            if metric == 'contact_growth':
                recommendations.append("Your contact growth is increasing. Scale your outreach efforts.")
            elif metric == 'email_engagement':
                recommendations.append("Email engagement is rising. Continue current messaging strategies.")
            elif metric == 'churn_rate':
                recommendations.append("⚠️ Churn rate is increasing. Implement re-engagement campaigns immediately.")
        elif trend == 'down':
            if metric == 'contact_growth':
                recommendations.append("Contact growth is declining. Review and optimize lead generation channels.")
            elif metric == 'email_engagement':
                recommendations.append("Email engagement is dropping. Test new subject lines and content.")
            elif metric == 'conversion_rate':
                recommendations.append("Conversion rate is falling. Analyze contact journey and identify bottlenecks.")
        else:
            recommendations.append(f"{metric.replace('_', ' ').title()} is stable. Maintain current strategies.")
        
        # Anomaly-based recommendations
        if len(anomalies) > 5:
            recommendations.append("High variability detected. Consider implementing more consistent workflows.")
        
        # Forecast-based recommendations
        forecast_values = predictions.get('values', [])
        if forecast_values:
            avg_forecast = sum(forecast_values) / len(forecast_values)
            if avg_forecast > 0:
                recommendations.append(f"Projected average: {avg_forecast:.1f}. Plan resources accordingly.")
        
        return " ".join(recommendations)


class SmartRecommendationService:
    """Service for generating smart AI recommendations"""
    
    def generate_recommendations(self, user: User, limit: int = 10) -> List['SmartRecommendation']:
        """
        Generate smart recommendations for user actions.
        Returns list of SmartRecommendation instances.
        """
        from ai_features.models import SmartRecommendation
        
        recommendations = []
        
        # 1. Contact action recommendations (high-priority contacts)
        contact_recs = self._generate_contact_recommendations(user)
        recommendations.extend(contact_recs)
        
        # 2. Workflow suggestions (optimize processes)
        workflow_recs = self._generate_workflow_recommendations(user)
        recommendations.extend(workflow_recs)
        
        # 3. Template usage recommendations
        template_recs = self._generate_template_recommendations(user)
        recommendations.extend(template_recs)
        
        # 4. Timing optimization recommendations
        timing_recs = self._generate_timing_recommendations(user)
        recommendations.extend(timing_recs)
        
        # Sort by priority and confidence
        recommendations.sort(key=lambda r: (
            -self._priority_score(r.priority),
            -r.confidence_score
        ))
        
        return recommendations[:limit]
    
    def _generate_contact_recommendations(self, user: User) -> List:
        """Generate recommendations for specific contacts"""
        from ai_features.models import SmartRecommendation, ContactScore
        
        recommendations = []
        
        # Find hot leads that need immediate action
        hot_leads = ContactScore.objects.filter(
            owner=user,
            score_level='hot'
        ).select_related('contact')[:5]
        
        for score in hot_leads:
            contact = score.contact
            
            # Check if already have active recommendation for this contact
            existing = SmartRecommendation.objects.filter(
                owner=user,
                related_contact=contact,
                is_dismissed=False,
                expires_at__gt=timezone.now()
            ).exists()
            
            if not existing:
                rec = SmartRecommendation.objects.create(
                    owner=user,
                    recommendation_type='contact_action',
                    priority='high',
                    title=f"Follow up with {contact.first_name} {contact.last_name}",
                    description=f"This contact has a score of {score.overall_score:.1f}/100 and shows high engagement. Recommended action: {score.next_best_action}",
                    action_url=f"/contacts/{contact.id}/",
                    related_contact=contact,
                    context_data={
                        'score': score.overall_score,
                        'score_level': score.score_level,
                        'conversion_probability': score.conversion_probability * 100
                    },
                    expected_impact="High probability of conversion or engagement",
                    confidence_score=score.conversion_probability,
                    expires_at=timezone.now() + timedelta(days=3)
                )
                recommendations.append(rec)
        
        # Find contacts at risk of churning
        churn_risks = ContactScore.objects.filter(
            owner=user,
            churn_risk__gte=0.7
        ).select_related('contact')[:3]
        
        for score in churn_risks:
            contact = score.contact
            existing = SmartRecommendation.objects.filter(
                owner=user,
                related_contact=contact,
                is_dismissed=False,
                expires_at__gt=timezone.now()
            ).exists()
            
            if not existing:
                rec = SmartRecommendation.objects.create(
                    owner=user,
                    recommendation_type='contact_action',
                    priority='high',
                    title=f"Re-engage {contact.first_name} {contact.last_name} (Churn Risk)",
                    description=f"This contact has a {score.churn_risk*100:.0f}% churn risk. Send a re-engagement email to prevent losing this lead.",
                    action_url=f"/contacts/{contact.id}/",
                    related_contact=contact,
                    context_data={
                        'churn_risk': score.churn_risk * 100,
                        'last_activity': score.behavioral_patterns.get('last_interaction')
                    },
                    expected_impact="Prevent contact churn and maintain relationship",
                    confidence_score=score.churn_risk,
                    expires_at=timezone.now() + timedelta(days=2)
                )
                recommendations.append(rec)
        
        return recommendations
    
    def _generate_workflow_recommendations(self, user: User) -> List:
        """Generate workflow optimization recommendations"""
        from ai_features.models import SmartRecommendation
        
        recommendations = []
        
        # Check if user has many contacts without activities
        inactive_contacts = Contact.objects.filter(
            owner=user
        ).annotate(
            activity_count=Count('activities')
        ).filter(activity_count=0).count()
        
        total_contacts = Contact.objects.filter(owner=user).count()
        
        if total_contacts > 0:
            inactive_pct = (inactive_contacts / total_contacts) * 100
            
            if inactive_pct > 30:
                rec = SmartRecommendation.objects.create(
                    owner=user,
                    recommendation_type='workflow_suggestion',
                    priority='medium',
                    title="Create automation for inactive contacts",
                    description=f"{inactive_pct:.0f}% of your contacts have no activities. Set up an automated workflow to engage them.",
                    action_url="/automations/create/",
                    context_data={'inactive_count': inactive_contacts, 'percentage': inactive_pct},
                    expected_impact="Increase overall engagement and conversion rates",
                    confidence_score=0.8,
                    expires_at=timezone.now() + timedelta(days=7)
                )
                recommendations.append(rec)
        
        return recommendations
    
    def _generate_template_recommendations(self, user: User) -> List:
        """Generate email template recommendations"""
        from ai_features.models import SmartRecommendation, AIEmailTemplate
        
        recommendations = []
        
        # Check if user has email templates
        template_count = AIEmailTemplate.objects.filter(owner=user, is_active=True).count()
        
        if template_count < 3:
            rec = SmartRecommendation.objects.create(
                owner=user,
                recommendation_type='template_usage',
                priority='low',
                title="Create more email templates",
                description="You only have a few email templates. Create templates for common scenarios like follow-ups, introductions, and proposals to save time.",
                action_url="/ai/templates/",
                context_data={'current_count': template_count},
                expected_impact="Reduce email composition time by 60%",
                confidence_score=0.7,
                expires_at=timezone.now() + timedelta(days=14)
            )
            recommendations.append(rec)
        
        return recommendations
    
    def _generate_timing_recommendations(self, user: User) -> List:
        """Generate timing optimization recommendations"""
        from ai_features.models import SmartRecommendation
        from django.db.models import Count
        
        recommendations = []
        
        # Analyze activity patterns to suggest optimal times
        # Get activities from last 30 days
        activities = Activity.objects.filter(
            created_by=user,
            created_at__gte=timezone.now() - timedelta(days=30)
        )
        
        hour_counts = {}
        for activity in activities:
            hour = activity.created_at.hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        if hour_counts:
            best_hour = max(hour_counts, key=hour_counts.get)
            rec = SmartRecommendation.objects.create(
                owner=user,
                recommendation_type='timing_optimization',
                priority='low',
                title=f"Optimal outreach time: {best_hour}:00",
                description=f"Your contacts are most active around {best_hour}:00. Schedule emails and calls during this time for better engagement.",
                action_url="/contacts/",
                context_data={'optimal_hour': best_hour, 'activity_count': hour_counts[best_hour]},
                expected_impact="Increase response rates by 15-25%",
                confidence_score=0.65,
                expires_at=timezone.now() + timedelta(days=30)
            )
            recommendations.append(rec)
        
        return recommendations
    
    def _priority_score(self, priority: str) -> int:
        """Convert priority string to numeric score"""
        return {'high': 3, 'medium': 2, 'low': 1}.get(priority, 0)


class SentimentAnalysisService:
    """Service for sentiment analysis of text"""
    
    def __init__(self):
        self.anthropic = AnthropicService()
    
    def analyze_sentiment(
        self,
        text: str,
        contact: Contact,
        source_type: str = 'email'
    ) -> Optional[SentimentAnalysis]:
        """
        Analyze sentiment of text
        Returns SentimentAnalysis instance
        """
        if not self.anthropic.is_available():
            # Return mock sentiment for development
            return self._create_mock_sentiment(text, contact, source_type)
        
        try:
            system_prompt = """You are an expert at analyzing sentiment and emotions in text.
Analyze the provided text and return ONLY a JSON response with this exact structure:
{
    "sentiment": "very_positive|positive|neutral|negative|very_negative",
    "sentiment_score": 0.0 to 1.0,
    "confidence": 0.0 to 1.0,
    "emotions": {"joy": 0.8, "surprise": 0.2},
    "key_phrases": ["phrase1", "phrase2"],
    "response_urgency": "urgent|moderate|low"
}"""
            
            prompt = f"Analyze the sentiment of this text:\n\n{text}"
            
            response_text, error = self.anthropic.generate_completion(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=500
            )
            
            if error:
                return self._create_mock_sentiment(text, contact, source_type)
            
            # Parse response
            try:
                response_text = response_text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif response_text.startswith('```'):
                    response_text = response_text.split('```')[1].split('```')[0].strip()
                
                sentiment_data = json.loads(response_text)
                
                # Create sentiment analysis record
                analysis = SentimentAnalysis.objects.create(
                    contact=contact,
                    owner=contact.owner,
                    source_type=source_type,
                    source_text=text[:1000],  # Limit stored text
                    sentiment=sentiment_data.get('sentiment', 'neutral'),
                    sentiment_score=sentiment_data.get('sentiment_score', 0.5),
                    confidence=sentiment_data.get('confidence', 0.5),
                    emotions=sentiment_data.get('emotions', {}),
                    key_phrases=sentiment_data.get('key_phrases', []),
                    response_urgency=sentiment_data.get('response_urgency', 'moderate')
                )
                
                return analysis
                
            except json.JSONDecodeError:
                return self._create_mock_sentiment(text, contact, source_type)
                
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return self._create_mock_sentiment(text, contact, source_type)
    
    def _create_mock_sentiment(
        self, text: str, contact: Contact, source_type: str
    ) -> SentimentAnalysis:
        """Create mock sentiment analysis for development"""
        # Simple keyword-based sentiment
        positive_words = ['great', 'excellent', 'happy', 'thanks', 'appreciate', 'good']
        negative_words = ['bad', 'disappointed', 'issue', 'problem', 'concern']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = 'positive'
            score = 0.7
        elif negative_count > positive_count:
            sentiment = 'negative'
            score = 0.3
        else:
            sentiment = 'neutral'
            score = 0.5
        
        return SentimentAnalysis.objects.create(
            contact=contact,
            owner=contact.owner,
            source_type=source_type,
            source_text=text[:1000],
            sentiment=sentiment,
            sentiment_score=score,
            confidence=0.6,
            emotions={'detected': True},
            key_phrases=[],
            response_urgency='moderate'
        )
