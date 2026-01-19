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
        context = {
            'name': contact.name,
            'email': contact.email,
            'company': contact.company or 'Unknown',
            'status': contact.status,
        }
        
        if contact.phone:
            context['phone'] = contact.phone
        
        if contact.tags:
            context['tags'] = contact.tags
        
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
        mock_emails = {
            'introduction': {
                'subject': f"Introduction - Partnership Opportunity with {contact.company or 'Your Company'}",
                'body': f"""Hi {contact.name},

I hope this email finds you well. I wanted to reach out to introduce myself and explore potential collaboration opportunities.

I've been following {contact.company or 'your work'} and am impressed by your approach. I believe there could be some interesting synergies between our organizations.

Would you be open to a brief call next week to discuss this further?

Best regards"""
            },
            'follow_up': {
                'subject': f"Following up on our conversation",
                'body': f"""Hi {contact.name},

I wanted to follow up on our last conversation and see if you had any questions or needed additional information.

I'm here to help and would love to continue our discussion.

Looking forward to hearing from you.

Best regards"""
            }
        }
        
        return mock_emails.get(category, {
            'subject': f"Message for {contact.name}",
            'body': f"""Hi {contact.name},\n\nI wanted to reach out regarding our recent interaction.\n\nBest regards"""
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
        total_fields = 7
        
        if contact.name:
            score += 100 / total_fields
        if contact.email:
            score += 100 / total_fields
        if contact.phone:
            score += 100 / total_fields
        if contact.company:
            score += 100 / total_fields
        if contact.position:
            score += 100 / total_fields
        if contact.tags:
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
