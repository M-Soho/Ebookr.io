# Admin Panel Quick Reference

## Access URLs

### Frontend Pages
- **Admin Home:** http://localhost:3000/admin (redirects to System Monitor)
- **System Monitor:** http://localhost:3000/admin/system
- **User Management:** http://localhost:3000/admin/users
- **Activity Logs:** http://localhost:3000/admin/logs
- **Celery Monitor:** http://localhost:3000/admin/celery

### Backend API Endpoints

#### System Health & Metrics
```
GET /api/admin/health/              # System health check
GET /api/admin/metrics/             # CPU, Memory, Disk metrics
GET /api/admin/dashboard/           # Platform statistics
```

#### User Management
```
GET  /api/admin/users/              # List all users
GET  /api/admin/users/<id>/activity/  # User activity details
POST /api/admin/users/<id>/toggle-status/  # Activate/deactivate user
```

#### Activity Logs
```
GET /api/admin/logs/activity/?hours=24  # Activity logs (default 24h)
GET /api/admin/logs/errors/             # Error logs
```

#### Celery Tasks
```
GET /api/admin/celery/status/       # Task queue status
GET /api/admin/celery/history/      # Task execution history
```

#### Database
```
GET /api/admin/database/stats/      # Database statistics
GET /api/admin/database/slow-queries/  # Slow query analysis
```

#### Email & Notifications
```
GET /api/admin/email/queue/         # Email queue status
GET /api/admin/notifications/stats/  # Notification statistics
```

## Common Tasks

### Check System Status
```bash
curl http://localhost:8000/api/admin/health/
```

### Monitor Resource Usage
```bash
curl http://localhost:8000/api/admin/metrics/
```

### View Platform Statistics
```bash
curl http://localhost:8000/api/admin/dashboard/
```

### List All Users
```bash
curl http://localhost:8000/api/admin/users/
```

### Toggle User Status
```bash
curl -X POST http://localhost:8000/api/admin/users/1/toggle-status/
```

## System Components

### Services to Monitor
1. **Database** (PostgreSQL/SQLite)
2. **Redis** (Cache & Celery broker)
3. **Celery Worker** (Background tasks)
4. **Celery Beat** (Scheduled tasks)
5. **Email Service** (SMTP/SendGrid/Mailgun)

### Critical Metrics
- **CPU Usage:** Should be < 80%
- **Memory Usage:** Should be < 80%
- **Disk Space:** Should have > 20% free
- **Active Workers:** Should be ≥ 1
- **Database:** Should be "healthy"
- **Redis:** Should be "healthy"

## Troubleshooting Commands

### Start Django Server
```bash
python manage.py runserver
```

### Start Celery Worker
```bash
celery -A config worker -l info
```

### Start Celery Beat
```bash
celery -A config beat -l info
```

### Start Redis (if not running)
```bash
redis-server
# or
sudo service redis-server start
```

### Check Service Status
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Check Celery workers
celery -A config inspect active

# Check database connection
python manage.py dbshell
```

## Key Features

### 1. Real-time Monitoring
- Auto-refresh every 30 seconds (System Monitor)
- Auto-refresh every 10 seconds (Celery Tasks)
- Manual refresh available on all pages

### 2. User Management
- View all users with statistics
- Filter by active/inactive status
- Search by username, email, or name
- One-click activate/deactivate

### 3. Activity Tracking
- Filter by time range (1h to 1 week)
- Filter by activity type
- User attribution for all activities
- Full audit trail

### 4. Task Queue Monitoring
- Active tasks count
- Scheduled tasks
- Reserved tasks
- Worker health status

## Alert Thresholds

### Service Status
- 🟢 **Healthy:** All systems operational
- 🟡 **Degraded:** Some services offline (non-critical)
- 🔴 **Unhealthy:** Critical services offline

### Resource Usage
- 🟢 **Normal:** < 60%
- 🟡 **Warning:** 60-80%
- 🔴 **Critical:** > 80%

### Task Queue
- 🟢 **Normal:** Workers active, queue < 100
- 🟡 **Warning:** No workers or queue 100-500
- 🔴 **Critical:** Queue > 500 or workers crashed

## Security Notes

⚠️ **Important:** Restrict admin panel access to superusers only!

Add authentication decorators to all admin views:
```python
from django.contrib.admin.views.decorators import staff_member_required

@staff_member_required
def system_health(request):
    # ... view code
```

## Quick Diagnostics

### System is Slow
1. Check CPU/Memory usage in System Monitor
2. Review slow queries in Database section
3. Check Celery task queue length
4. Review recent error logs

### Email Not Sending
1. Check Email Queue status
2. Verify email service configuration
3. Check Celery worker is running
4. Review error logs for SMTP errors

### Tasks Not Running
1. Verify Celery worker is active
2. Check Celery Beat is running (for scheduled tasks)
3. Verify Redis connection
4. Check task queue in Celery Monitor

### High Database Load
1. Check Database Stats for table sizes
2. Review slow queries
3. Check for missing indexes
4. Monitor active connections

## API Response Formats

### Health Check Response
```json
{
  "overall_status": "healthy",
  "timestamp": "2026-01-22T10:30:00Z",
  "services": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"},
    "celery_worker": {
      "status": "healthy",
      "workers": 1,
      "worker_names": ["celery@hostname"]
    }
  }
}
```

### Metrics Response
```json
{
  "success": true,
  "metrics": {
    "cpu": {"percent": 25.5, "count": 4},
    "memory": {
      "percent": 45.2,
      "total_gb": 16.0,
      "available_gb": 8.8
    },
    "disk": {
      "percent": 60.0,
      "total_gb": 500.0,
      "free_gb": 200.0
    }
  }
}
```

### Dashboard Response
```json
{
  "success": true,
  "dashboard": {
    "users": {
      "total": 150,
      "active": 142,
      "new_today": 5,
      "new_this_week": 23
    },
    "contacts": {
      "total": 4532,
      "new_today": 45,
      "new_this_week": 234
    },
    "tasks": {
      "total": 1234,
      "todo": 456,
      "in_progress": 123,
      "completed": 655,
      "overdue": 12
    }
  }
}
```

## Navigation Shortcuts

- **Admin Home:** `/admin`
- **System Health:** `/admin/system`
- **Users:** `/admin/users`
- **Logs:** `/admin/logs`
- **Celery:** `/admin/celery`
- **Django Admin:** `/admin/` (Django's built-in admin)

## Support Information

For technical issues:
1. Check error logs in Activity Logs section
2. Review system metrics for resource constraints
3. Verify all services are running
4. Check Django and Celery logs

For feature requests or bugs:
- Refer to main documentation
- Check ADMIN_PANEL_GUIDE.md for detailed instructions
