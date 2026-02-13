# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.search_general, name='search-general'),
        # Recherche avancée
    path('posts/advanced/', views.search_posts_advanced, name='search-posts-advanced'),
    path('posts/', views.search_posts_advanced, name='post-advance'),
   # path('profiles/', views.),
    # Suggestions et filtres
    path('suggestions/', views.search_suggestions, name='search-suggestions'),
    path('filters/', views.search_filters, name='search-filters'),
    path('<str:model_type>/', views.search_by_type, name='search-by-type'),
]