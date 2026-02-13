# messaging/urls.py - VERSION CORRIGÉE
from django.urls import path
from . import views

urlpatterns = [
    # ==================== CONVERSATIONS ====================
    path('conversations/', 
         views.conversation_list_create, 
         name='conversation-list-create'),
    
    path('conversations/<int:pk>/', 
         views.conversation_detail, 
         name='conversation-detail'),
    
    path('conversations/<int:pk>/add-participant/', 
         views.add_participant, 
         name='add-participant'),
    
    path('conversations/<int:pk>/mark-as-read/', 
         views.mark_conversation_as_read, 
         name='mark-conversation-as-read'),
    
    path('conversations/with-user/', 
         views.conversation_with_user, 
         name='conversation-with-user'),
    
    path('conversations/create-group/', 
         views.create_group_conversation, 
         name='create-group-conversation'),
    
    # ==================== MESSAGES ====================
    path('conversations/<int:conversation_id>/messages/', 
         views.message_list_create, 
         name='message-list-create'),
    
    path('conversations/<int:conversation_id>/messages/<int:pk>/', 
         views.message_detail, 
         name='message-detail'),
    
    path('conversations/<int:conversation_id>/messages/<int:pk>/mark-as-read/', 
         views.mark_message_as_read, 
         name='mark-message-as-read'),
    
    path('conversations/<int:conversation_id>/messages/<int:pk>/delete-for-me/', 
         views.delete_message_for_me, 
         name='delete-message-for-me'),
    
    path('conversations/<int:conversation_id>/messages/<int:pk>/delete-for-everyone/', 
         views.delete_message_for_everyone, 
         name='delete-message-for-everyone'),
    
    # ==================== UTILISATEURS ====================
    path('users/', 
         views.user_list, 
         name='user-list'),
    
    path('users/search/', 
         views.user_search, 
         name='user-search'),
    
    # ==================== STATISTIQUES ====================
    path('messaging/stats/', 
         views.messaging_stats, 
         name='messaging-stats'),
    
    # ==================== GROUPE : CRÉATION & GESTION ====================
    path('groups/create/', 
         views.create_group, 
         name='create-group'),
    
    path('groups/<int:pk>/', 
         views.get_group_details,  # NOUVELLE VUE - IMPORTANT !
         name='group-detail'),
    
    path('groups/<int:pk>/update/', 
         views.update_group, 
         name='update-group'),
    
    path('groups/<int:pk>/delete/', 
         views.delete_group, 
         name='delete-group'),
    
    # ==================== GROUPE : ADHÉSION ====================
    # NOTE: Choisissez UNE des deux options suivantes, pas les deux !
    
    # OPTION 1: Pour les groupes publics (pas besoin d'approbation)
 # path('groups/<int:pk>/join/', 
    #    views.join_group,  # Pour rejoindre directement
    # name='join-group'),
    
    # OPTION 2: Pour les groupes avec approbation
  # path('groups/<int:pk>/join/', 
      #views.request_to_join_group,  # Pour demander à rejoindre
     #  name='request-join-group'),
    
    path('groups/<int:pk>/leave/', 
         views.leave_group, 
        name='leave-group'),
    
    path('groups/<int:pk>/cancel-join/', 
         views.cancel_join_request, 
         name='cancel-join-request'),
   path('groups/<int:pk>/join/', 
        views.smart_join_group, 
        name='join_or_request_group'),

    # ==================== GROUPE : MEMBRES ====================
    path('groups/<int:pk>/members/', 
         views.list_group_members, 
         name='list-group-members'),
    
    path('groups/<int:pk>/invite/', 
         views.invite_to_group, 
         name='invite-to-group'),
    
    path('groups/<int:pk>/remove-member/<int:user_id>/', 
         views.remove_member_from_group, 
         name='remove-member'),
    
    path('groups/<int:pk>/transfer-ownership/', 
         views.transfer_group_ownership, 
         name='transfer-ownership'),
    
    # ==================== GROUPE : DEMANDES D'ADHÉSION ====================
    path('groups/<int:pk>/requests/', 
         views.list_group_join_requests, 
         name='list-group-requests'),
    
    path('groups/<int:pk>/requests/<int:request_id>/approve/', 
         views.approve_join_request, 
         name='approve-join-request'),
    
    path('groups/<int:pk>/requests/<int:request_id>/reject/', 
         views.reject_join_request, 
         name='reject-join-request'),
    
    path('my-group-requests/', 
         views.list_my_group_join_requests, 
         name='my-group-requests'),
    
    # ==================== GROUPE : FEEDBACK ====================
    path('groups/<int:pk>/feedback/', 
         views.submit_group_feedback, 
         name='submit-group-feedback'),
    
    path('groups/<int:pk>/reviews/', 
         views.list_group_feedbacks, 
         name='list-group-feedbacks'),
    
    # ==================== GROUPE : RECHERCHE & EXPLORATION ====================
    path('groups/explore/', 
         views.explore_public_groups, 
         name='explore-public-groups'),
      path('groups/<int:pk>/all-members/', views.get_group_members, name='group-all-members'),
    path('groups/search/', 
         views.search_groups_advanced,  # Un seul 'search/', pas deux !
         name='search-groups-advanced'),
    
    path('groups/public/', 
         views.list_public_groups, 
         name='list-public-groups'),
    
    # ==================== GROUPE : CATÉGORIES ====================
    path('groups/categories/', 
         views.list_group_categories, 
         name='group-categories'),
    
    # ==================== GROUPE : ADMIN ====================
    path('groups/<int:pk>/admin-info/', 
         views.group_admin_info, 
         name='group-admin-info'),
    path('conversations/by-group/<int:group_id>/', 
         views.conversation_by_group_id, 
         name='conversation-by-group-id'),
    
    # ==================== STATUT EN LIGNE ====================
    path('online-status/ping/', 
         views.ping_online_status, 
         name='ping_online_status'),
    
    path('online-status/me/', 
         views.get_my_online_status, 
         name='get_my_online_status'),
    
    path('online-status/set/', 
         views.set_online_status, 
         name='set_online_status'),
    
    path('users/<int:user_id>/online-status/', 
         views.check_user_online, 
         name='check_user_online'),
    
    path('users/online-status/bulk/', 
         views.get_multiple_users_online_status, 
         name='bulk_online_status'),
      # URLs de blocage
    path('block/status/<int:user_id>/', views.block_status, name='block_status'),
    path('block/user/<int:user_id>/', views.block_user_view, name='block_user'),
    path('block/unblock/<int:user_id>/', views.unblock_user_view, name='unblock_user'),
    path('block/list/', views.blocked_users_list, name='blocked_users_list'),
    path('block/who-blocked-me/', views.who_blocked_me, name='who_blocked_me'),
    path('block/settings/', views.block_settings, name='block_settings'), # URLs de blocage
    path('block/status/<int:user_id>/', views.block_status, name='block_status'),
    path('block/user/<int:user_id>/', views.block_user_view, name='block_user'),
    path('block/unblock/<int:user_id>/', views.unblock_user_view, name='unblock_user'),
    path('block/list/', views.blocked_users_list, name='blocked_users_list'),
    path('block/who-blocked-me/', views.who_blocked_me, name='who_blocked_me'),
    path('block/settings/', views.block_settings, name='block_settings'),
]