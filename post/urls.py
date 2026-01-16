from django.urls import path
from . import views

# urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Posts
    path('posts/', views.post_list_create, name='post-list-create'),
    path('posts/<int:pk>/', views.post_detail_update_delete, name='post-detail-update-delete'),
    path('posts/<int:pk>/upload-image/', views.upload_post_image, name='upload-post-image'),
    path('posts/<int:pk>/upload-file/', views.upload_post_file, name='upload-post-file'),
    path('posts/<int:pk>/upload-images/', views.upload_multiple_images, name='upload-multiple-images'),
       path('posts/<int:pk>/images/', views.add_post_images, name='add-post-images'),
    path('posts/<int:pk>/files/', views.add_post_files, name='add-post-files'),
    path('posts/<int:pk>/images/<int:image_id>/', views.delete_post_image, name='delete-post-image'),
      path('posts/best-rated/', views.get_best_rated_posts, name='best-rated-posts'),
    path('posts/most-popular/', views.get_most_popular_posts, name='most-popular-posts'),
    # Catégories
    path('categories/', views.category_list_create, name='category-list-create'),
    path('categories/<int:pk>/', views.category_detail_update_delete, name='category-detail-update-delete'),
       path('categories/<str:category_name>/', views.category_by_name, name='category_by_name'),
    path('categories/<str:category_name>/posts/', views.category_posts, name='category_posts'),
    
    # Tags
    path('tags/', views.tag_list_create, name='tag-list-create'),
    path('tags/<int:pk>/', views.tag_detail_update_delete, name='tag-detail-update-delete'),
    
    path('posts/<int:post_id>/upload-images/', views.upload_post_images, name='upload-post-images'),
    path('posts/<int:post_id>/images/<int:image_id>/', views.delete_post_image, name='delete-post-image'),
     path('posts/create-with-images/', views.create_post_with_images, name='create-post-with-images'),
    # Fonctions utilitaires
    path('users/<str:username>/posts/', views.user_posts, name='user-posts'),
    path('categories/<int:category_id>/posts/', views.category_posts, name='category-posts'),
    path('tags/<str:tag_name>/posts/', views.tag_posts, name='tag-posts'),
    path('search/', views.search_posts, name='search-posts'),
    path('my-posts/', views.my_posts, name='my-posts'),
    path('mentioned-posts/', views.mentioned_posts, name='mentioned-posts'),
    # Vos URLs existantes
    path('posts/user/<int:user_id>/', views.get_user_posts, name='get_user_posts'),
    path('posts/user/<int:user_id>/posts/<int:post_id>/', views.get_user_post_detail, name='get_user_post_detail'),
    path('posts/user/<int:user_id>/recent/', views.get_recent_user_posts, name='get_recent_user_posts'),
     path('all-categories/', views.get_categories, name='get-categories'),
    # Nouvelles URLs pour le système de feedback
    path('posts/<int:post_id>/rate/', views.rate_post, name='rate_post'),
    path('posts/<int:post_id>/ratings/', views.get_post_ratings, name='get_post_ratings'),
    path('posts/<int:post_id>/rate/delete/', views.delete_rating, name='delete_rating'),
    path('ratings/my-ratings/', views.get_user_ratings, name='get_user_ratings'),
        path('posts/<int:post_id>/download-media/', views.download_post_media, name='download_post_media'),
    path('posts/<int:post_id>/media-list/', views.get_post_media_list, name='get_post_media_list'),
]
