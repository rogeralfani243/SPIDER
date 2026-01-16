from django.urls import path
from . import views
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


urlpatterns = [
    # User Authentication
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/check-auth/', views.check_auth, name='check_auth'),
    path('auth/register/', views.register_view, name='register'),

     # JWT Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

      # Inscription avec vérification par email
    path('auth/register/', views.register_view, name='register'),
    path('auth/verify-email/', views.verify_email_view, name='verify_email'),
    path('auth/resend-verification/', views.resend_verification_code, name='resend_verification'),
    path('auth/cancel-registration/', views.cancel_registration, name='cancel_registration'),
]

