#!/usr/bin/env bash
set -euo pipefail

# 01-bootstrap.sh
# Bootstraps a Django 5 + Celery 5 project with Redis/Postgres/Stripe support.
# Usage: ./01-bootstrap.sh

ROOT_DIR=$(pwd)

echo "Bootstrapping Ebookr.io Django + Celery project in: $ROOT_DIR"

# Choose python executable (prefer python3.12 if available)
PYTHON=python3.12
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  PYTHON=python3
fi

if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "ERROR: python3 is required." >&2
  exit 1
fi

# Create and activate virtualenv
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment using $PYTHON..."
  "$PYTHON" -m venv .venv
fi

# shellcheck source=/dev/null
source .venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel

echo "Writing requirements.txt"
cat > requirements.txt <<'REQ'
# Core framework
Django==5.0.1

# Background tasks and broker
celery==5.3.1
redis==4.6.0

# Environment and configuration
django-environ==0.10.0

# Payments
stripe==11.0.0

# Postgres driver
psycopg[binary]==3.2.0

# Production server
gunicorn==20.1.0
REQ

echo "Installing dependencies..."
pip install -r requirements.txt

# Initialize Django project if needed
if [ ! -f manage.py ]; then
  echo "Creating Django project 'config'..."
  django-admin startproject config .
fi

echo "Ensuring apps exist: users, contacts, billing, automation"
for app in users contacts billing automation; do
  if [ ! -d "$app" ]; then
    echo "Creating app: $app"
    python manage.py startapp "$app"
  else
    echo "App already exists: $app"
  fi
done

echo "Writing SaaS-ready settings to config/settings.py"
mkdir -p config
cat > config/settings.py <<'PY'
import os
from pathlib import Path
import environ

# .env handling
BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env(
    DEBUG=(bool, False),
)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='replace-me-please')
DEBUG = env('DEBUG')

ALLOWED_HOSTS = env('ALLOWED_HOSTS', default='localhost').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Local apps
    'users',
    'contacts',
    'billing',
    'automation',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASE_URL = env('DATABASE_URL', default='')
if DATABASE_URL:
    DATABASES = {
        'default': env.db('DATABASE_URL'),
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Celery
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default=env('DATABASE_URL', default='redis://localhost:6379/0'))
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default=CELERY_BROKER_URL)

# Stripe
STRIPE_API_KEY = env('STRIPE_API_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')
STRIPE_PRICE_MONTHLY = env('STRIPE_PRICE_MONTHLY', default='')
STRIPE_PRICE_ANNUAL = env('STRIPE_PRICE_ANNUAL', default='')

# Logging (simple)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
PY

echo "Writing Celery app to config/celery.py and wiring it in config/__init__.py"
cat > config/celery.py <<'PY'
from __future__ import annotations
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

__all__ = ('app',)
PY

cat > config/__init__.py <<'PY'
from .celery import app as celery_app

__all__ = ('celery_app',)
PY

echo "Creating minimal config/urls.py"
cat > config/urls.py <<'PY'
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
]
PY

echo "Writing .env.example"
cat > .env.example <<'ENV'
# Django
SECRET_KEY=replace-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Postgres via Supabase or other). Example:
# DATABASE_URL=postgres://user:password@host:5432/dbname
DATABASE_URL=

# Celery / Redis
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Stripe
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_ANNUAL=
ENV

echo "Running migrations"
python manage.py migrate

echo
echo "Bootstrap complete. Next steps:"
echo "- Activate the virtualenv: source .venv/bin/activate  (if not already)"
echo "- Create a .env file (you can copy .env.example): cp .env.example .env and edit values"
echo "- Run the development server: python manage.py runserver"
echo "- Run a Celery worker: celery -A config.app worker --loglevel=info  OR: celery -A config worker --loglevel=info"
echo "- To run Gunicorn in production (example): gunicorn config.wsgi:application --bind 0.0.0.0:8000"

chmod +x 01-bootstrap.sh || true

echo "Done."
