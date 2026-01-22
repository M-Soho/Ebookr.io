# Admin Panel Installation Guide

## Overview
The Ebookr.io Admin Panel provides comprehensive system monitoring, user management, and troubleshooting tools for platform administrators.

## Features

### 1. **System Monitor** (`/admin/system`)
- Real-time system health monitoring
- Service status (Database, Redis, Celery, Email)
- System resource metrics (CPU, Memory, Disk)
- Platform statistics overview

### 2. **User Management** (`/admin/users`)
- View all users and their statistics
- Activate/deactivate user accounts
- View user activity and subscription status
- Search and filter users

### 3. **Activity Logs** (`/admin/logs`)
- System-wide activity tracking
- Filter by time range and activity type
- User action audit trail
- Activity statistics and breakdown

### 4. **Celery Task Monitor** (`/admin/celery`)
- Real-time task queue monitoring
- Active, scheduled, and reserved tasks
- Worker status and health
- Background job tracking

### 5. **Database Inspector** (coming soon)
- Database statistics and table sizes
- Query performance monitoring
- Growth metrics

### 6. **Email Queue** (coming soon)
- Email sending status
- Failed email retry
- Email templates management

### 7. **Error Logs** (coming soon)
- Application error tracking
- Error frequency and patterns
- Stack trace viewer

## Installation

### Backend Setup

1. **Install Required Dependencies**
   ```bash
   pip install psutil redis
   ```

2. **URL Configuration**
   The admin panel URLs are already configured in `config/urls.py`:
   ```python
   path('api/admin/', include('admin_panel.urls'))
   ```

3. **Verify Imports**
   Make sure all required packages are installed:
   - `psutil` - For system metrics
   - `redis` - For Redis connection monitoring
   - `celery` - For task queue monitoring

### Frontend Setup

The frontend pages are located in `/frontend/app/admin/`:
- `system/page.tsx` - System monitor dashboard
- `users/page.tsx` - User management
- `logs/page.tsx` - Activity logs
- `celery/page.tsx` - Celery task monitor
- `layout.tsx` - Admin panel layout with navigation

## API Endpoints

### System Health & Metrics
- `GET /api/admin/health/` - System health check
- `GET /api/admin/metrics/` - System resource metrics
- `GET /api/admin/dashboard/` - Dashboard summary

### User Management
- `GET /api/admin/users/` - List all users
- `GET /api/admin/users/<id>/activity/` - User activity
- `POST /api/admin/users/<id>/toggle-status/` - Activate/deactivate user

### Activity Logs
- `GET /api/admin/logs/activity/?hours=24` - Activity logs
- `GET /api/admin/logs/errors/` - Error logs

### Celery Tasks
- `GET /api/admin/celery/status/` - Task queue status
- `GET /api/admin/celery/history/` - Task execution history

### Database
- `GET /api/admin/database/stats/` - Database statistics
- `GET /api/admin/database/slow-queries/` - Slow query analysis

### Notifications
- `GET /api/admin/notifications/stats/` - Notification statistics

### Email Queue
- `GET /api/admin/email/queue/` - Email queue status

## Access Control

**Important:** The admin panel should only be accessible to superuser accounts.

### Add Authentication Middleware

Add to `admin_panel/admin_views.py`:
```python
from django.contrib.admin.views.decorators import staff_member_required

# Decorate all views with @staff_member_required or @user_passes_test
```

### Example:
```python
@staff_member_required
@require_http_methods(["GET"])
def system_health(request):
    # ... existing code
```

## Usage

### 1. Start All Services

```bash
# Terminal 1: Django server
python manage.py runserver

# Terminal 2: Celery worker
celery -A config worker -l info

# Terminal 3: Celery beat
celery -A config beat -l info

# Terminal 4: Redis (if not running)
redis-server

# Terminal 5: Frontend
cd frontend
npm run dev
```

### 2. Access Admin Panel

Navigate to: `http://localhost:3000/admin`

The panel will automatically redirect to the System Monitor page.

### 3. Navigation

Use the sidebar to navigate between different admin sections:
- **System Monitor** - Overall health and metrics
- **Users** - User management and activity
- **Activity Logs** - System activity tracking
- **Celery Tasks** - Background job monitoring

## Monitoring Best Practices

### 1. **System Health Checks**
- Check system status regularly (every 30 seconds auto-refresh)
- Monitor CPU, memory, and disk usage
- Ensure all services are healthy (green status)

### 2. **User Management**
- Review new user signups daily
- Monitor inactive users
- Track subscription statuses

### 3. **Activity Monitoring**
- Review activity logs for unusual patterns
- Track user engagement
- Identify popular features

### 4. **Task Queue Health**
- Ensure Celery workers are running
- Monitor task queue lengths
- Check for stuck or failed tasks

### 5. **Performance Monitoring**
- Watch for high CPU/memory usage
- Monitor disk space
- Check for slow database queries

## Troubleshooting

### No Celery Workers Active

**Problem:** Celery tasks section shows "No Workers Active"

**Solution:**
```bash
celery -A config worker -l info
```

### Redis Connection Failed

**Problem:** Redis service shows unhealthy status

**Solution:**
```bash
# Start Redis
redis-server

# Or if installed via package manager
sudo service redis-server start
```

### High Memory Usage

**Problem:** Memory usage above 80%

**Actions:**
1. Restart Celery workers
2. Clear Redis cache
3. Review and optimize database queries
4. Check for memory leaks in custom code

### Database Connection Issues

**Problem:** Database service shows unhealthy

**Solution:**
1. Check database server status
2. Verify connection credentials in settings.py
3. Check database logs for errors

## Security Recommendations

1. **Restrict Access**
   - Only allow superuser/staff access to admin panel
   - Use Django's built-in authentication decorators
   - Consider IP whitelisting for production

2. **HTTPS Only**
   - Always use HTTPS in production
   - Set `SECURE_SSL_REDIRECT = True`

3. **Rate Limiting**
   - Implement rate limiting on admin endpoints
   - Prevent brute force attacks

4. **Logging**
   - Log all admin actions
   - Monitor for suspicious activity
   - Set up alerts for critical actions

## Future Enhancements

Planned features:
- Database backup management
- Email template editor
- Custom metric dashboards
- Automated alert system
- System configuration editor
- Log file viewer
- Performance profiling tools
- API usage statistics
- Integration health monitoring

## Support

For issues or questions:
1. Check application logs
2. Review Django error logs
3. Check Celery worker logs
4. Verify all services are running

## API Response Examples

### System Health
```json
{
  "overall_status": "healthy",
  "timestamp": "2026-01-22T10:30:00Z",
  "services": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"},
    "celery_worker": {"status": "healthy", "workers": 1}
  }
}
```

### User List
```json
{
  "success": true,
  "count": 150,
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "is_active": true,
      "stats": {
        "contacts": 45,
        "tasks": 12,
        "subscription_status": "active"
      }
    }
  ]
}
```
