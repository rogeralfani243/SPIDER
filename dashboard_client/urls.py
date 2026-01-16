# urls.py
from django.urls import path
from . import views 

urlpatterns = [
    # URLs du dashboard (administrateur)
    path('dashboard/data/', views.dashboard_data, name='dashboard-data'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/activity/', views.activity_feed, name='activity-feed'),
    path('dashboard/charts/', views.chart_data, name='chart-data'),

    # URLs du profil utilisateur
    path('profile/data/', views.profile_data, name='profile-data'),
    path('profile/stats/', views.profile_stats, name='profile-stats'),
    path('profile/activity/', views.profile_activity, name='profile-activity'),
    path('profile/posts/', views.profile_posts, name='profile-posts'),
    path('profile/comments/', views.profile_comments, name='profile-comments'),
    path('profile/update/', views.update_profile, name='update-profile'),
      path('profile/report/', views.profile_report, name='report-profile'),

]