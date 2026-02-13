# comments/urls.py
from django.urls import path
from . import views

app_name = 'comment_post'

urlpatterns = [
    # Post comments
    path('posts/<int:post_id>/comments/', views.post_comments_list_create, name='post-comments'),
    
    # Comment CRUD
    path('comments/<int:pk>/', views.comment_detail, name='comment-detail'),
    
    # Reply management - NOUVELLE ROUTE
    path('comments/<int:comment_id>/replies/', views.comment_replies_list_create, name='comment-replies-list-create'),
    
    # Likes
    path('comments/<int:pk>/like/', views.comment_like, name='comment-like'),
    
    # Moderation
    path('comments/<int:pk>/pin/', views.comment_pin, name='comment-pin'),
    path('comments/<int:pk>/hide/', views.comment_hide, name='comment-hide'),
    path('comments/<int:pk>/report/', views.comment_report, name='comment-report'),
    
    # Bulk actions
    path('comments/bulk-delete/', views.bulk_comment_delete, name='bulk-delete'),
    
    # User comments
    path('users/<int:user_id>/comments/', views.user_comments, name='user-comments'),

     path('users/profile/by-username/<str:username>/', views.get_profile_by_username, name='profile-by-username'),
    path('users/list/', views.user_list, name='user-list'),
]