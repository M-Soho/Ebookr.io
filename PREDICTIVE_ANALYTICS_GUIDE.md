# Predictive Analytics & Smart Recommendations

Complete documentation for the AI-powered predictive analytics and smart recommendations features.

## Overview

These features provide:
1. **Predictive Analytics**: Forecast future trends based on historical data
2. **Smart Recommendations**: AI-generated actionable suggestions for user actions

## Predictive Analytics

### Supported Metrics

#### 1. Contact Growth
Predicts future contact acquisition based on historical growth patterns.

**Use Cases:**
- Resource planning for sales teams
- Scaling infrastructure for growing contact bases
- Identifying growth trends and opportunities

#### 2. Email Engagement
Forecasts email engagement rates (calls/meetings as responses to emails).

**Use Cases:**
- Optimizing email campaign timing
- A/B testing content strategies
- Measuring messaging effectiveness

#### 3. Conversion Rate
Predicts percentage of contacts showing active engagement.

**Use Cases:**
- Sales pipeline forecasting
- Lead quality assessment
- Marketing ROI prediction

#### 4. Churn Rate
Forecasts percentage of contacts becoming inactive.

**Use Cases:**
- Proactive retention campaigns
- Customer health monitoring
- Risk mitigation strategies

### Algorithm Details

#### Forecasting Method
Uses simple moving average with linear regression trend analysis:

1. **Moving Average (7-day window)**: Smooths recent data
2. **Linear Regression**: Calculates trend slope
3. **Hybrid Prediction**: 70% trend + 30% moving average
4. **Confidence Intervals**: 95% confidence bounds using standard deviation

#### Anomaly Detection
Identifies values beyond 2 standard deviations from mean.

#### Accuracy Tracking
Compares previous predictions to actual outcomes (when available).

### API Endpoint

```http
GET /api/ai/predictions/
```

**Query Parameters:**
- `metric`: contact_growth | conversion_rate | email_engagement | churn_rate
- `training_days`: Days of historical data (default: 90)
- `forecast_days`: Days to forecast ahead (default: 30)

**Response:**
```json
{
  "prediction": {
    "id": 123,
    "metric": "contact_growth",
    "historical_data": {
      "dates": ["2026-01-01T00:00:00Z", ...],
      "values": [5, 7, 3, ...]
    },
    "predicted_values": {
      "dates": ["2026-01-20T00:00:00Z", ...],
      "values": [8.5, 9.2, 10.1, ...]
    },
    "confidence_interval": {
      "lower": [5.2, 6.1, ...],
      "upper": [11.8, 12.3, ...]
    },
    "trend_direction": "up|down|stable",
    "accuracy_score": 0.85,
    "anomalies_detected": [
      {
        "date": "2026-01-15T00:00:00Z",
        "value": 25,
        "expected": 8.5,
        "deviation": 16.5
      }
    ],
    "recommendations": "Contact growth is increasing. Scale your outreach efforts.",
    "training_period_days": 90,
    "forecast_period_days": 30,
    "created_at": "2026-01-19T12:00:00Z"
  }
}
```

### Code Example

```python
from ai_features.services import PredictiveAnalyticsService

service = PredictiveAnalyticsService()
prediction = service.generate_prediction(
    user=request.user,
    metric='contact_growth',
    training_period_days=90,
    forecast_period_days=30
)

print(f"Trend: {prediction.trend_direction}")
print(f"Forecast: {prediction.predicted_values}")
print(f"Recommendations: {prediction.recommendations}")
```

## Smart Recommendations

### Recommendation Types

#### 1. Contact Actions
Suggests specific actions for high-value or at-risk contacts.

**Generated When:**
- Contact score reaches "hot" level (>80)
- Churn risk exceeds 70%
- High conversion probability detected

**Examples:**
- "Follow up with John Doe" (hot lead)
- "Re-engage Sarah Smith (Churn Risk)" (at-risk contact)

#### 2. Workflow Suggestions
Recommends process optimizations based on patterns.

**Generated When:**
- >30% of contacts have no activities
- Engagement rates are low
- Manual processes could be automated

**Examples:**
- "Create automation for inactive contacts"
- "Set up weekly follow-up workflow"

#### 3. Template Usage
Suggests creating or using email templates.

**Generated When:**
- User has fewer than 3 active templates
- Frequently sends similar emails manually
- Template success rates are high

**Examples:**
- "Create more email templates"
- "Use 'Follow-up' template for warm leads"

#### 4. Timing Optimization
Recommends optimal times for outreach based on activity patterns.

**Generated When:**
- Sufficient activity data exists (>30 days)
- Clear activity time patterns emerge
- Engagement varies by time of day

**Examples:**
- "Optimal outreach time: 14:00"
- "Schedule calls between 10-11am for best response"

### Priority Levels

- **High**: Immediate action required (hot leads, churn risks)
- **Medium**: Important but not urgent (workflow optimizations)
- **Low**: Nice to have (timing suggestions, template creation)

### Confidence Scoring

Recommendations include confidence scores (0.0-1.0):
- **0.8-1.0**: High confidence (based on strong signals)
- **0.6-0.79**: Medium confidence (based on patterns)
- **0.0-0.59**: Low confidence (suggestive only)

### API Endpoints

#### Get Recommendations
```http
GET /api/ai/recommendations/
```

**Query Parameters:**
- `type`: contact_action | workflow_suggestion | template_usage | timing_optimization
- `priority`: high | medium | low
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `generate`: Set to 'true' to generate new recommendations

**Response:**
```json
{
  "recommendations": [
    {
      "id": 456,
      "type": "contact_action",
      "priority": "high",
      "title": "Follow up with John Doe",
      "description": "This contact has a score of 85.0/100...",
      "action_url": "/contacts/123/",
      "expected_impact": "High probability of conversion",
      "confidence_score": 85.0,
      "contact_id": 123,
      "created_at": "2026-01-19T12:00:00Z",
      "expires_at": "2026-01-22T12:00:00Z"
    }
  ],
  "count": 10,
  "page": 1,
  "total_pages": 2
}
```

#### Generate New Recommendations
```http
POST /api/ai/recommendations/
```

**Query Parameters:**
- `limit`: Maximum recommendations to generate (default: 10)

**Response:** Same as GET endpoint

### Code Example

```python
from ai_features.services import SmartRecommendationService

service = SmartRecommendationService()
recommendations = service.generate_recommendations(
    user=request.user,
    limit=10
)

for rec in recommendations:
    if rec.priority == 'high':
        print(f"⚠️ {rec.title}")
        print(f"   {rec.description}")
        print(f"   Action: {rec.action_url}")
```

## Integration Guide

### 1. Enable Features

Both features are ready to use immediately:

```python
# In your views or services
from ai_features.services import (
    PredictiveAnalyticsService,
    SmartRecommendationService
)

# Generate predictions
analytics = PredictiveAnalyticsService()
prediction = analytics.generate_prediction(user, 'contact_growth')

# Generate recommendations
recommendations = SmartRecommendationService()
recs = recommendations.generate_recommendations(user, limit=5)
```

### 2. Scheduled Updates

For real-time dashboards, schedule regular updates:

```python
# In your Celery tasks
from celery import shared_task

@shared_task
def update_predictions():
    from django.contrib.auth.models import User
    from ai_features.services import PredictiveAnalyticsService
    
    service = PredictiveAnalyticsService()
    for user in User.objects.filter(is_active=True):
        for metric in ['contact_growth', 'email_engagement', 
                       'conversion_rate', 'churn_rate']:
            service.generate_prediction(user, metric)

@shared_task
def update_recommendations():
    from django.contrib.auth.models import User
    from ai_features.services import SmartRecommendationService
    
    service = SmartRecommendationService()
    for user in User.objects.filter(is_active=True):
        service.generate_recommendations(user, limit=10)
```

### 3. Frontend Display

Example React component:

```typescript
// Predictions Dashboard
const PredictionsDashboard = () => {
  const [prediction, setPrediction] = useState(null);
  
  useEffect(() => {
    fetch('/api/ai/predictions/?metric=contact_growth')
      .then(res => res.json())
      .then(data => setPrediction(data.prediction));
  }, []);
  
  return (
    <div>
      <h2>Contact Growth Forecast</h2>
      <Chart data={prediction?.predicted_values} />
      <p>Trend: {prediction?.trend_direction}</p>
      <p>{prediction?.recommendations}</p>
    </div>
  );
};

// Recommendations List
const RecommendationsList = () => {
  const [recs, setRecs] = useState([]);
  
  useEffect(() => {
    fetch('/api/ai/recommendations/?priority=high')
      .then(res => res.json())
      .then(data => setRecs(data.recommendations));
  }, []);
  
  return (
    <div>
      {recs.map(rec => (
        <div key={rec.id} className={`priority-${rec.priority}`}>
          <h3>{rec.title}</h3>
          <p>{rec.description}</p>
          <a href={rec.action_url}>Take Action</a>
        </div>
      ))}
    </div>
  );
};
```

## Performance Considerations

### Predictive Analytics
- **Computation Time**: ~200-500ms for 90 days of data
- **Caching**: Cache predictions for 1-24 hours
- **Database Impact**: Read-only queries, low impact

### Smart Recommendations
- **Computation Time**: ~500-1000ms to generate 10 recommendations
- **Caching**: Recommendations valid for hours/days (check expires_at)
- **Database Impact**: Moderate (reads scores, contacts, activities)

### Optimization Tips

1. **Cache predictions** for frequently accessed metrics
2. **Generate recommendations async** using Celery
3. **Paginate results** for large datasets
4. **Index database fields** used in queries (already done)
5. **Limit historical data** to 90-180 days max

## Testing

Run the test suite:

```bash
python test_predictions_recommendations.py
```

Expected output:
- ✅ Predictions generated for all metrics
- ✅ Forecasts calculated with confidence intervals
- ✅ Anomalies detected
- ✅ Recommendations generated by type and priority
- ✅ Contact-specific recommendations created

## Troubleshooting

### No predictions generated
- Check if user has sufficient historical data (>7 days)
- Verify contacts and activities exist
- Check database connectivity

### Inaccurate forecasts
- Increase training_period_days for more data
- Check for data quality issues
- Review anomalies for outliers affecting predictions

### No recommendations
- Ensure ContactScore records exist
- Run contact scoring service first
- Check recommendation expiration dates
- Verify user has contacts and activities

### Performance issues
- Reduce training_period_days (default: 90)
- Implement caching
- Use async tasks for generation
- Paginate results

## Future Enhancements

Planned improvements:
- [ ] Advanced forecasting models (ARIMA, Prophet)
- [ ] Machine learning for recommendation confidence
- [ ] Multi-variate predictions
- [ ] Recommendation A/B testing
- [ ] Custom recommendation rules engine
- [ ] Real-time prediction updates
