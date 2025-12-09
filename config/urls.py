from django.contrib import admin
from django.urls import path
from django.views.generic.base import RedirectView
from billing.views import stripe_webhook, trial_status, get_subscription, create_checkout_session
from contacts.views import contacts_api

urlpatterns = [
    # Redirect root to the frontend dev server
    path('', RedirectView.as_view(url='http://localhost:3000/', permanent=False)),
    path('admin/', admin.site.urls),
    path('stripe/webhook/', stripe_webhook, name='stripe_webhook'),
    path('api/contacts/', contacts_api, name='contacts_api'),
    path('api/billing/trial-status/', trial_status, name='trial_status'),
    path('api/billing/subscription/', get_subscription, name='get_subscription'),
    path('api/billing/create-checkout-session/', create_checkout_session, name='create_checkout_session'),
]
