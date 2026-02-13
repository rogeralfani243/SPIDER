from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('dashboard-stats/', views.get_dashboard_stats, name='admin_dashboard_stats'),
    
    # Users
    path('users/', views.get_users_list, name='admin_users_list'),
    path('users/<int:user_id>/', views.get_user_detail, name='admin_user_detail'),
    path('users/<int:user_id>/update-status/', views.update_user_status, name='update_user_status'),
     path('users/analytics/', views.get_users_analytics, name='admin-users-analytics'),
    # Posts
    path('posts/', views.get_posts_list, name='admin_posts_list'),
    path('posts/<int:post_id>/', views.get_post_detail, name='admin_post_detail'),
    path('posts/<int:post_id>/delete/', views.delete_post, name='delete_post'),
     # ==================== LIST & DETAIL ====================
    
    # GET - Liste paginée de tous les commentaires (avec filtres)
    path('comments/',
         views.get_admin_comments_list,
         name='admin-comments-list'),
    
    # GET - Détail d'un commentaire spécifique
    path('comments/<int:comment_id>/',
         views.get_admin_comment_detail,
         name='admin-comment-detail'),
    
    # GET - Toutes les réponses d'un commentaire
    path('comments/<int:comment_id>/replies/',
         views.get_admin_comment_replies,
         name='admin-comment-replies'),
    
    # ==================== DELETE ====================
    
    # DELETE - Supprimer un commentaire
    path('comments/<int:comment_id>/delete/',
         views.delete_admin_comment,
         name='admin-comment-delete'),
    
    # POST - Supprimer plusieurs commentaires
    path('comments/bulk-delete/',
         views.bulk_delete_admin_comments,
         name='admin-comments-bulk-delete'),
    
    # ==================== TOGGLE ACTIONS ====================
    
    # POST - Masquer/Afficher un commentaire
    path('comments/<int:comment_id>/toggle-hide/',
         views.toggle_hide_admin_comment,
         name='admin-comment-toggle-hide'),
    
    # POST - Marquer spam/Non-spam
    path('comments/<int:comment_id>/toggle-spam/',
         views.toggle_spam_admin_comment,
         name='admin-comment-toggle-spam'),
    
    # POST - Épingler/Désépingler
    path('comments/<int:comment_id>/toggle-pin/',
         views.toggle_pin_admin_comment,
         name='admin-comment-toggle-pin'),
    
    # ==================== STATISTICS ====================
    path('posts/analytics/', views.get_posts_analytics, name='admin-posts-analytics'),
    # GET - Statistiques globales
    path('comments/analytics/',
         views.get_comments_analytics,
         name='admin-comments-analytics'),
    path('comments/stats/',
         views.get_admin_comments_stats,
         name='admin-comments-stats'),

    # Reports
    path('reports/', views.get_reports_list, name='admin_reports_list'),
    path('reports/<int:report_id>/', views.get_report_detail, name='admin_report_detail'),
    path('reports/<int:report_id>/update-status/', views.update_report_status, name='update_report_status'),
      path('reports/analytics/', views.get_reports_analytics, name='admin-reports-analytics'),
    # Certifications
    path('certifications/', views.get_certifications_list, name='admin_certifications_list'),
    path('certifications/<int:cert_id>/manage/', views.manage_certification, name='manage_certification'),
    path('certifications/analytics/', views.certification_analyst, name='admin_certifications_analytics'),
    path('certifications/<int:pk>/update/', 
         views.update_certification, 
         name='update-certification'),
    # Payments
    path('payments/', views.get_payments_list, name='admin_payments_list'),
    path('revenue-stats/', views.get_revenue_stats, name='revenue_stats'),
     path('payments/analytics/', views.get_payment_analytics, name='revenue_analytics'),
       # Group management
    path('groups/', views.get_groups_list, name='admin-groups-list'),
    path('groups/<int:pk>/update/', views.manage_group, name='admin-manage-group'),
    path('groups/bulk/', views.bulk_manage_groups, name='admin-bulk-groups'),
    
    # Group analytics
    path('groups/analytics/', views.get_group_analytics, name='admin-group-analytics'),

    # Search & Tools
    path('search/', views.search_admin, name='admin_search'),
    path('system-health/', views.system_health, name='system_health'),
    path('export/', views.export_data, name='export_data'),
]