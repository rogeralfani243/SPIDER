from django.urls import path, include

from . import views
from rest_framework import routers
router = routers.DefaultRouter()

urlpatterns = [
    # path('api/categories/', views.get_categories, name='get_categories'),
    path('posts/', views.get_posts, name='get_posts'),
    path('comments/', views.get_comments, name='get_comments'),
    path('tags/', views.get_tags, name='get_tags'),
    path('main/', views.main, name='main'),
    path('user/suggestions/', views.user_suggestions, name='user_suggestions'),
    path('user/subscribe/', views.subscribe, name='subscribe'),
    path('user/subscription-status/', views.subscription_status, name='subscription_status'),

    # Authentification
    path('register/', views.register_view, name='register'),

    #Category URL 
    path('categories/', views.category_list, name='category-list'),
    # Profil
        # Profil
    path('profile/<int:profile_id>/update/', views.update_profile, name='update-profile'),
    path('profiles/category/', views.profiles_by_category, name='profiles-by-category'),
    path('profiles/category/<int:category_id>/', views.profiles_by_category, name='profiles-by-category-id'),
    path('my-profile-id/', views.get_my_profile_id, name='my-profile-id'),
    path('api/current-user-profile/', views.current_user_profile, name='current-user-profile'),
    path('profile/<int:profile_id>/', views.profile_detail_public, name='profile'),
    path('profile/upload-image/', views.upload_profile_image, name='upload-profile-image'),
    path('profile/<str:username>/', views.user_profile_detail, name='user-profile-detail'),
      path('profile/<int:profile_id>/feedbacks/', views.profile_feedbacks, name='profile-feedbacks'),
    path('top-profiles/', views.top_profiles, name='top-profiles'),

      # Follow system
    path('profile/<int:profile_id>/follow/', views.toggle_follow, name='toggle_follow'),
    path('profile/<int:profile_id>/followers/', views.profile_followers, name='profile_followers'),
    path('profile/<int:profile_id>/following/', views.profile_following, name='profile_following'),
    path('profile/<int:profile_id>/follow-status/', views.check_follow_status, name='check_follow_status'),\
     # Profil utilisateur courant
    path('profile/me/', views.current_user_profile_id, name='current-user-profile-id'),
    path('auth/user/', views.get_current_user, name='current_user'),

     path('api/user/<int:user_id>/get-profile-id/', views.get_profile_by_user, name='get-profile-by-user'),

        # Suppression de compte
    path('account/delete/', views.delete_account, name='delete_account'),
    path('account/request-deletion/', views.request_account_deletion, name='request_account_deletion'),
    path('account/cancel-deletion/', views.cancel_account_deletion, name='cancel_account_deletion'),
     # ... autres URLs ...
    path('account/request-deletion-code/', views.request_deletion_code, name='request_deletion_code'),
    path('account/verify-deletion-code/', views.verify_deletion_code, name='verify_deletion_code'),

    # Pour confirmation par token (optionnel)
      path('account/confirm-delete/<str:token>/', views.confirm_delete_account, name='confirm_delete_account'),

     
    # Changement de mot de passe avec vérification par email
    path('account/request-password-change-code/', views.request_password_change_code, name='request_password_change_code'),
    path('account/verify-password-change-code/', views.verify_password_change_code, name='verify_password_change_code'),
    path('account/change-password/', views.change_password, name='change_password'),
    path('account/cancel-password-change/', views.cancel_password_change, name='cancel_password_change'),

     # Réinitialisation de mot de passe
    path('account/request-password-reset-code/', views.request_password_reset_code, name='request_password_reset_code'),
    path('account/verify-password-reset-code/', views.verify_password_reset_code, name='verify_password_reset_code'),
    path('account/reset-password/', views.reset_password, name='reset_password'),

]
