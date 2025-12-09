# This file is required to make Python treat the directories as containing packages.
from .celery import app as celery_app

__all__ = ('celery_app',)
