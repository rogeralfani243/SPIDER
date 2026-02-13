from django.urls import path
from . import views

urlpatterns = [
    # Vues utilisateur
    path('', views.get_user_certifications, name='get_user_certifications'),
    path('check-premium/', views.check_premium_eligibility, name='check_premium_eligibility'),
    path('check_fire/', views.check_fire_eligibility, name='check_fire_eligibility'),
    path('request-verification/', views.request_id_verification, name='request_id_verification'),
    path('verification-status/', views.get_verification_status, name='get_verification_status'),
    path('profile/<int:profile_id>/', views.get_profile_certifications, name='get_profile_certifications'),
    path('info/', views.get_certification_info, name='get_certification_info'),
     path('user-stats/', views.get_user_stats, name='get_user_stats'),
    path('check-influencer/', views.check_influencer_eligibility, name='check_influencer_eligibility'),
    path('request-influencer/', views.request_influencer_badge, name='request_influencer_badge'),
    path('create-checkout-session/', views.create_checkout_session, name='create_checkout_session'),
    path('manage-subscription/', views.manage_subscription, name='manage_subscription'),
    # Paiements Stripe
    path('create-checkout-session/', views.create_checkout_session, name='create_checkout_session'),
    path('checkout/success/', views.checkout_success, name='checkout_success'),
    path('checkout/cancel/', views.checkout_cancel, name='checkout_cancel'),
    path('payment/status/<str:session_id>/', views.payment_status, name='payment_status'),
    path('manage-subscription/', views.manage_subscription, name='manage_subscription'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),

   #Cancel subscription
     path('subscription/details/', views.get_subscription_details, name='subscription_details'),
    path('subscription/cancel/', views.cancel_subscription, name='cancel_subscription'),
    path('subscription/reactivate/', views.reactivate_subscription, name='reactivate_subscription'),
    path('subscription/cancellation-history/', views.get_cancellation_history, name='cancellation_history'),
    # URL de simulation de paiement (pour développement)
# Vues admin
    path('certifications/', views.admin_get_all_certifications, name='admin_get_all_certifications'),
    path('scan-activity/', views.admin_scan_all_activity, name='admin_scan_all_activity'),
    path('check-expired/', views.admin_check_expired_certifications, name='admin_check_expired_certifications'),
    path('admin/verifications/pending/', views.admin_get_pending_verifications, name='admin_get_pending_verifications'),
    path('admin/verifications/<int:verification_id>/approve/', views.admin_approve_id_verification, name='admin_approve_id_verification'),
    path('admin/verifications/<int:verification_id>/reject/', views.admin_reject_id_verification, name='admin_reject_id_verification'),
]