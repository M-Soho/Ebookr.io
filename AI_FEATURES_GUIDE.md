# AI Features Documentation

## Overview

The AI Features module provides intelligent automation and insights powered by Anthropic's Claude API. It includes email generation, contact scoring, sentiment analysis, predictive analytics, and smart recommendations.

## Features

### 1. AI Email Generation
Generate personalized emails using AI based on contact context and templates.

**Key Capabilities:**
- Context-aware email generation
- Multiple tone options (professional, friendly, casual, formal)
- Category-based templates (introduction, follow-up, proposal, etc.)
- Personalization using contact data
- Template management and tracking

**API Endpoint:**
```
POST /api/ai/generate-email/
```

**Request Body:**
```json
{
  "contact_id": 123,
  "template_id": 456,  // optional
  "category": "follow_up",  // optional
  "tone": "professional",  // optional
  "custom_prompt": "Write a follow-up email...",  // optional
  "additional_context": {  // optional
    "last_meeting": "2026-01-15",
    "topics_discussed": ["pricing", "features"]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 789,
    "subject": "Following up on our conversation",
    "body": "Hi John,\n\nI wanted to follow up...",
    "contact_id": 123,
    "contact_name": "John Doe",
    "generation_time_ms": 850,
    "created_at": "2026-01-19T10:30:00Z"
  }
}
```

### 2. Contact Scoring
AI-powered lead scoring and prioritization based on multiple factors.

**Scoring Components:**
- **Engagement Score (35%)**: Based on activity frequency and recency
- **Recency Score (25%)**: Time since last interaction
- **Response Rate Score (25%)**: How often contact responds
- **Profile Completeness (15%)**: Amount of data available

**Score Levels:**
- **Hot (80-100)**: High priority, ready for conversion
- **Warm (60-79)**: Interested, needs nurturing
- **Cold (40-59)**: Low engagement, maintain contact
- **Nurture (20-39)**: Needs re-engagement strategy
- **Inactive (0-19)**: Minimal activity, low priority

**API Endpoints:**

**Get Contact Scores:**
```
GET /api/ai/contact-scores/
```

**Query Parameters:**
- `score_level`: hot|warm|cold|nurture|inactive
- `min_score`: minimum overall score (0-100)
- `page`: page number
- `limit`: results per page

**Calculate/Recalculate Score:**
```
POST /api/ai/calculate-score/<contact_id>/
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "contact_id": 123,
    "overall_score": 75.5,
    "score_level": "warm",
    "engagement_score": 80.0,
    "recency_score": 60.0,
    "response_rate_score": 75.0,
    "profile_completeness": 85.7,
    "conversion_probability": 68.5,
    "churn_risk": 25.0,
    "next_best_action": "Send targeted follow-up",
    "key_insights": [
      "High engagement with frequent interactions",
      "High response rate - strong interest indicator"
    ],
    "behavioral_patterns": {
      "activity_distribution": {
        "email": 15,
        "call": 3,
        "meeting": 2
      },
      "total_interactions": 20,
      "first_interaction": "2025-12-01T10:00:00Z",
      "last_interaction": "2026-01-15T14:30:00Z"
    }
  }
}
```

### 3. Sentiment Analysis
Analyze sentiment and emotions in email responses and interactions.

**API Endpoint:**
```
POST /api/ai/analyze-sentiment/
```

**Request Body:**
```json
{
  "text": "Thank you so much! This is exactly what I was looking for. Very impressed with your service.",
  "contact_id": 123,
  "source_type": "email"  // email|note|call
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 456,
    "sentiment": "very_positive",
    "sentiment_score": 0.92,
    "confidence": 0.88,
    "emotions": {
      "joy": 0.85,
      "gratitude": 0.90,
      "satisfaction": 0.88
    },
    "key_phrases": [
      "exactly what I was looking for",
      "very impressed"
    ],
    "response_urgency": "low",
    "analyzed_at": "2026-01-19T10:30:00Z"
  }
}
```

**Sentiment Levels:**
- `very_positive`: Extremely positive response
- `positive`: Positive sentiment
- `neutral`: Neutral sentiment
- `negative`: Negative sentiment
- `very_negative`: Very negative, requires urgent attention

### 4. Predictive Analytics
Forecast trends and patterns in contact data.

**Metrics Available:**
- `contact_growth`: Predict future contact acquisition
- `conversion_rate`: Forecast conversion trends
- `email_engagement`: Predict email engagement rates
- `deal_closure`: Forecast deal closure rates
- `churn_rate`: Predict customer churn

**API Endpoint:**
```
GET /api/ai/predictions/?metric=contact_growth
```

**Response:**
```json
{
  "prediction": {
    "id": 789,
    "metric": "contact_growth",
    "historical_data": {
      "dates": ["2025-12-01", "2025-12-08", "2025-12-15"],
      "values": [50, 55, 62]
    },
    "predicted_values": {
      "dates": ["2026-01-22", "2026-01-29", "2026-02-05"],
      "values": [68, 72, 76]
    },
    "confidence_interval": {
      "lower": [65, 68, 71],
      "upper": [71, 76, 81]
    },
    "trend_direction": "up",
    "accuracy_score": 0.85,
    "anomalies_detected": [],
    "recommendations": "Continue current growth strategies. Consider scaling marketing efforts.",
    "created_at": "2026-01-19T10:00:00Z"
  }
}
```

### 5. Smart Recommendations
AI-generated actionable recommendations.

**Recommendation Types:**
- `contact_action`: Suggested actions for specific contacts
- `workflow_suggestion`: Workflow optimization suggestions
- `template_usage`: Email template recommendations
- `timing_optimization`: Best time to contact suggestions

**API Endpoint:**
```
GET /api/ai/recommendations/
```

**Query Parameters:**
- `type`: contact_action|workflow_suggestion|template_usage|timing_optimization
- `priority`: high|medium|low
- `page`: page number
- `limit`: results per page

**Response:**
```json
{
  "recommendations": [
    {
      "id": 123,
      "type": "contact_action",
      "priority": "high",
      "title": "Follow up with hot lead: John Doe",
      "description": "This contact has shown high engagement and hasn't been contacted in 7 days. Conversion probability is 85%.",
      "action_url": "/contacts/123",
      "expected_impact": "High probability of conversion within next 2 weeks",
      "confidence_score": 92.5,
      "contact_id": 123,
      "created_at": "2026-01-19T09:00:00Z",
      "expires_at": "2026-01-26T09:00:00Z"
    }
  ],
  "count": 1,
  "page": 1,
  "total_pages": 1
}
```

## Service Layer Architecture

### AnthropicService
Core service for interacting with Claude API.

```python
from ai_features.services import AnthropicService

service = AnthropicService()

if service.is_available():
    response, error = service.generate_completion(
        prompt="Write a professional email",
        system_prompt="You are an expert email writer",
        max_tokens=1024,
        temperature=0.7
    )
```

### EmailGenerationService
High-level service for email generation.

```python
from ai_features.services import EmailGenerationService

service = EmailGenerationService()
email_data, error = service.generate_email(
    contact=contact_instance,
    category='follow_up',
    tone='professional'
)
```

### ContactScoringService
Service for calculating contact scores.

```python
from ai_features.services import ContactScoringService

service = ContactScoringService()
score = service.calculate_contact_score(contact_instance)

print(f"Overall Score: {score.overall_score}")
print(f"Score Level: {score.score_level}")
print(f"Next Action: {score.next_best_action}")
```

### SentimentAnalysisService
Service for analyzing sentiment.

```python
from ai_features.services import SentimentAnalysisService

service = SentimentAnalysisService()
analysis = service.analyze_sentiment(
    text="Thank you for the great service!",
    contact=contact_instance,
    source_type='email'
)
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Anthropic AI API Key
ANTHROPIC_API_KEY=sk-ant-api...

# Optional: Specific model version
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Settings

In `config/settings.py`:

```python
# Anthropic AI Configuration
ANTHROPIC_API_KEY = env('ANTHROPIC_API_KEY', default='')
```

## Database Models

### AIEmailTemplate
Stores AI email template configurations.

**Fields:**
- `name`: Template name
- `category`: Template category
- `prompt`: AI generation prompt
- `tone`: Email tone
- `personalization_fields`: Dynamic fields
- `usage_count`: Number of times used
- `success_rate`: Response rate percentage

### GeneratedEmail
Tracks all AI-generated emails.

**Fields:**
- `template`: Related template
- `contact`: Target contact
- `subject`, `body`: Email content
- `status`: draft|sent|opened|replied|bounced
- `sentiment_score`, `engagement_score`: Metrics
- `generation_time_ms`: Performance metric

### ContactScore
Stores contact scoring data.

**Fields:**
- `contact`: Related contact
- `overall_score`: Composite score (0-100)
- `score_level`: hot|warm|cold|nurture|inactive
- `engagement_score`, `recency_score`, etc.: Component scores
- `conversion_probability`: 0.0 to 1.0
- `churn_risk`: 0.0 to 1.0
- `next_best_action`: Recommended action
- `key_insights`: List of insights
- `behavioral_patterns`: JSON data

### SentimentAnalysis
Stores sentiment analysis results.

**Fields:**
- `contact`: Related contact
- `source_type`: email|note|call
- `sentiment`: very_positive to very_negative
- `sentiment_score`: 0.0 to 1.0
- `emotions`: JSON emotion data
- `key_phrases`: Extracted phrases
- `response_urgency`: urgent|moderate|low

## Usage Examples

### Generate an Email

```python
from contacts.models import Contact
from ai_features.services import EmailGenerationService

contact = Contact.objects.get(id=123)
service = EmailGenerationService()

email_data, error = service.generate_email(
    contact=contact,
    category='follow_up',
    tone='professional',
    additional_context={
        'last_meeting_date': '2026-01-15',
        'topics': ['pricing', 'features']
    }
)

if not error:
    print(f"Subject: {email_data['subject']}")
    print(f"Body: {email_data['body']}")
```

### Calculate Contact Score

```python
from contacts.models import Contact
from ai_features.services import ContactScoringService

contact = Contact.objects.get(id=123)
service = ContactScoringService()

score = service.calculate_contact_score(contact)

print(f"Score: {score.overall_score}/100")
print(f"Level: {score.score_level}")
print(f"Conversion Probability: {score.conversion_probability * 100}%")
print(f"Recommended Action: {score.next_best_action}")
```

### Analyze Sentiment

```python
from contacts.models import Contact
from ai_features.services import SentimentAnalysisService

contact = Contact.objects.get(id=123)
service = SentimentAnalysisService()

text = "Thank you for the wonderful presentation! I'm very interested."
analysis = service.analyze_sentiment(text, contact, 'email')

print(f"Sentiment: {analysis.sentiment}")
print(f"Score: {analysis.sentiment_score}")
print(f"Urgency: {analysis.response_urgency}")
```

## Development Mode

When `ANTHROPIC_API_KEY` is not configured, the services automatically fall back to mock data for development and testing purposes.

**Mock Features:**
- Simple keyword-based sentiment analysis
- Template-based email generation
- Formula-based contact scoring
- All endpoints remain functional

## Performance Considerations

1. **API Rate Limits**: Anthropic has rate limits. Monitor usage.
2. **Caching**: Consider caching scores for frequently accessed contacts.
3. **Async Processing**: Use Celery tasks for bulk operations.
4. **Token Usage**: Monitor token consumption for cost optimization.

## Best Practices

1. **Prompts**: Keep prompts clear and specific
2. **Context**: Provide relevant contact context for better results
3. **Scoring**: Recalculate scores regularly (daily/weekly)
4. **Sentiment**: Analyze important communications
5. **Templates**: Create templates for common scenarios
6. **Monitoring**: Track generation times and success rates

## Future Enhancements

- [ ] Batch email generation
- [ ] A/B testing for email content
- [ ] Advanced predictive models
- [ ] Custom AI model fine-tuning
- [ ] Multi-language support
- [ ] Voice of customer analysis
- [ ] Competitive intelligence
