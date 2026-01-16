# urls.py (dans votre application)
from django.urls import path
from . import views

urlpatterns = [
    # Feedback endpoints
    path('create/', views.create_feedback, name='create_feedback'),
    path('list/', views.list_feedbacks, name='list_feedbacks'),
    path('list/<int:profile_id>/', views.list_feedbacks, name='list_feedbacks_by_profile'),
    path('<int:feedback_id>/', views.get_feedback, name='get_feedback'),
    path('<int:feedback_id>/update/', views.update_feedback, name='update_feedback'),
    path('<int:feedback_id>/delete/', views.delete_feedback, name='delete_feedback'),
    
     # Helpful endpoints
    path('<int:feedback_id>/helpful/', views.toggle_helpful, name='toggle_helpful'),
    path('<int:feedback_id>/mark-helpful/', views.mark_as_helpful, name='mark_as_helpful'),
    path('<int:feedback_id>/unmark-helpful/', views.unmark_as_helpful, name='unmark_as_helpful'),
    
    # Test endpoints
    path('test-feedback/', views.test_feedback, name='test_feedback'),
    path('debug-urls/', views.debug_urls, name='debug_urls'),
]