# messaging/views.py
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q

# messaging/block_views.py
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.shortcuts import get_object_or_404, render
from django.db import transaction
from .models import User, Block, BlockSettings, BlockHistory
from .block_utils import BlockManager

User = get_user_model()
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from .models import (
    Conversation, Message, GroupCategory, 
    GroupJoinRequest, GroupFeedback, GroupMember,GroupBlock
)
from .serializers import (
   PublicGroupSerializer, ConversationSerializer, ConversationDetailSerializer,
    MessageSerializer, GroupCreateSerializer, GroupDetailSerializer,
    GroupCategorySerializer, GroupJoinRequestSerializer,
    GroupFeedbackSerializer, GroupMemberSerializer,ConversationCreateSerializer
)
from django.db.models import Q, Count, Avg
class UserWithProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_image']
        read_only_fields = fields
    
    def get_profile_image(self, obj):
        if hasattr(obj, 'profile') and obj.profile and obj.profile.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.image.url)
            return obj.profile.image.url
        return None

# ==================== CONVERSATIONS ====================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def conversation_list_create(request):
    """
    List all conversations or create a new conversation
    """
    if request.method == 'GET':
        # Précharger les participants et leurs profils
        conversations = Conversation.objects.filter(
            participants=request.user
        ).prefetch_related(
            'participants__profile'  # IMPORTANT
        ).prefetch_related('messages')
        
        serializer = ConversationSerializer(
            conversations, 
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ConversationCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            conversation = serializer.save()
            return Response(
                ConversationSerializer(conversation, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def conversation_detail(request, pk):
    """
    Retrieve, update or delete a conversation
    """
    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=pk
    )
    
    if request.method == 'GET':
  # Utiliser le bon serializer selon le type de conversation
        if conversation.is_group:
            # Pour les groupes, utiliser ConversationSerializer (qui contient can_invite)
            serializer = ConversationSerializer(
                conversation,
                context={'request': request}
            )
        else:
            # Pour les conversations privées, utiliser ConversationDetailSerializer
            serializer = ConversationDetailSerializer(
                conversation,
                context={'request': request}
            )
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        participant_ids = request.data.get('participant_ids', [])
        
        if participant_ids:
            users = User.objects.filter(id__in=participant_ids)
            conversation.participants.set(users)
            
            if request.user not in users:
                conversation.participants.add(request.user)
            
            conversation.save()
        
        serializer = ConversationSerializer(
            conversation,
            context={'request': request}
        )
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        conversation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def conversation_with_user(request):
    """
    Retrieve or create a 1-to-1 conversation with a specific user
    EXCLUDE GROUP CONVERSATIONS
    """
    user_id = request.query_params.get('user_id')
    
    if not user_id:
        return Response(
            {'error': 'user_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # FILTRE IMPORTANT: exclure les groupes
    conversations = Conversation.objects.filter(
        participants=request.user,
        is_group=False  # <--- AJOUTEZ CE FILTRE
    ).filter(
        participants=other_user
    ).distinct()
    
    one_to_one_conversation = None
    for conv in conversations:
        if conv.participants.count() == 2:
            one_to_one_conversation = conv
            break
    
    if one_to_one_conversation:
        serializer = ConversationDetailSerializer(
            one_to_one_conversation,
            context={'request': request}
        )
        return Response(serializer.data)
    
    # Créer une conversation NON groupe
    conversation = Conversation.objects.create(
        is_group=False  # <--- IMPORTANT
    )
    conversation.participants.add(request.user, other_user)
    
    serializer = ConversationDetailSerializer(
        conversation,
        context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def add_participant(request, pk):
    """
    Add a participant to a conversation
    """
    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=pk
    )
    
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response(
            {'error': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id, is_active=True  )
        conversation.participants.add(user)
        conversation.updated_at = timezone.now()
        conversation.save()
        
        return Response(
            ConversationSerializer(conversation, context={'request': request}).data
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def mark_conversation_as_read(request, pk):
    """
    Mark all messages in a conversation as read
    """
    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=pk
    )
    
    updated_count = conversation.messages.filter(
        is_read=False
    ).exclude(
        sender=request.user
    ).update(is_read=True)
    
    return Response({
        'status': 'success',
        'messages_marked_as_read': updated_count
    })


# ==================== MESSAGES ====================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def message_list_create(request, conversation_id):
    """
    List all messages of a conversation or create a new message
    """
    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=conversation_id
    )
    
    if request.method == 'GET':
        # ⚠️ COMPLEX FILTERING WITH Q OBJECTS
        from django.db.models import Q
        
        # Build filter for visible messages
        visible_filter = Q(conversation=conversation) & ~Q(deleted_for_everyone=True)
        
        # Messages where user is sender
        sender_condition = Q(sender=request.user) & ~Q(deleted_for_sender=True)
        
        # Messages where user is receiver
        receiver_condition = ~Q(sender=request.user) & ~Q(deleted_for_receiver=True)
        
        # Combine conditions
        messages = Message.objects.filter(
            visible_filter & (sender_condition | receiver_condition)
        ).select_related('sender').order_by('timestamp')
        
        # Mark as read
        unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
        if unread_messages.exists():
            unread_messages.update(is_read=True)
        
        serializer = MessageSerializer(
            messages, 
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # ============ BLOCK CHECK ============
        # Check if this is a private conversation (not a group)
        if not conversation.is_group:
            # Get the other participant in private conversation
            other_participants = conversation.participants.exclude(id=request.user.id)
            
            if other_participants.exists():
                other_user = other_participants.first()
                
                # Check if user is blocked
                try:
                    # Import BlockManager if not already imported
                    from .block_utils import BlockManager
                    
                    # Check if user has blocked the receiver
                    user_has_blocked_receiver = BlockManager.is_blocked(request.user.id, other_user.id)
                    if user_has_blocked_receiver:
                        return Response({
                            'success': False,
                            'error': 'You have blocked this user. Unblock them to send messages.',
                            'block_type': 'user_blocked_receiver'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Check if receiver has blocked the user
                    receiver_has_blocked_user = BlockManager.is_blocked(other_user.id, request.user.id)
                    if receiver_has_blocked_user:
                        return Response({
                            'success': False,
                            'error': 'This user has blocked you. You cannot send messages to them.',
                            'block_type': 'receiver_blocked_user'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                except ImportError:
                    # If BlockManager is not available, check directly
                    try:
                        from .models import Block
                        
                        # Check if user has blocked the receiver
                        user_blocks_receiver = Block.objects.filter(
                            blocker=request.user,
                            blocked=other_user,
                            is_active=True
                        ).exists()
                        
                        if user_blocks_receiver:
                            return Response({
                                'success': False,
                                'error': 'You have blocked this user. Unblock them to send messages.',
                                'block_type': 'user_blocked_receiver'
                            }, status=status.HTTP_403_FORBIDDEN)
                        
                        # Check if receiver has blocked the user
                        receiver_blocks_user = Block.objects.filter(
                            blocker=other_user,
                            blocked=request.user,
                            is_active=True
                        ).exists()
                        
                        if receiver_blocks_user:
                            return Response({
                                'success': False,
                                'error': 'This user has blocked you. You cannot send messages to them.',
                                'block_type': 'receiver_blocked_user'
                            }, status=status.HTTP_403_FORBIDDEN)
                        
                    except Exception as e:
                        # Log error but allow message to be sent
                        print(f"Error checking block status: {e}")
        # ============ END BLOCK CHECK ============
        
        data = {}
        
        if 'content' in request.data:
            data['content'] = request.data.get('content')
        
        if 'image' in request.FILES:
            data['image'] = request.FILES['image']
        
        if 'file' in request.FILES:
            data['file'] = request.FILES['file']
        
        serializer = MessageSerializer(
            data=data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            message = serializer.save(
                conversation=conversation,
                sender=request.user
            )
            
            conversation.updated_at = timezone.now()
            conversation.save()
            
            return Response(
                MessageSerializer(message, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def message_detail(request, conversation_id, pk):
    """
    Retrieve, update or delete a message
    """
    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=conversation_id
    )
    
    message = get_object_or_404(
        Message.objects.filter(conversation=conversation),
        pk=pk
    )
    
    if request.method == 'GET':
        serializer = MessageSerializer(
            message,
            context={'request': request}
        )
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Check if user is the sender of the message
        if message.sender != request.user:
            return Response(
                {'error': 'You can only edit your own messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        partial = request.method == 'PATCH'
        
        # ⚠️ IMPORTANT: For PATCH, only send the fields you want to update
        # For messages with media, we should only update the content
        update_data = {}
        
        # Always include content if present
        if 'content' in request.data:
            update_data['content'] = request.data.get('content')
        
        # Optionally allow media updates (uncomment if you want this)
        # if 'image' in request.data:
        #     update_data['image'] = request.data.get('image')
        # if 'file' in request.data:
        #     update_data['file'] = request.data.get('file')
        
        serializer = MessageSerializer(
            message, 
            data=update_data, 
            partial=partial,
            context={'request': request}
        )
        
        if serializer.is_valid():
            updated_message = serializer.save()
            
            conversation.updated_at = timezone.now()
            conversation.save()
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Check if user is the sender of the message
        if request.user not in (message.sender, message.conversation.created_by):
            return Response(
            {'error': 'You can only delete your own messages for everyone'},
            status=status.HTTP_403_FORBIDDEN
        )
        
        # ⚠️ OPTIONAL: Implement WhatsApp-like delete
        # For now, we'll do a hard delete
        message.delete()
        
        conversation.updated_at = timezone.now()
        conversation.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


# ⚠️ NEW: WhatsApp-like delete endpoints
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication])
def delete_message_for_me(request, conversation_id, pk):
    """
    Delete message only for current user (WhatsApp-like)
    - If user is sender: mark deleted_for_sender = True
    - If user is receiver: mark deleted_for_receiver = True
    """
    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=conversation_id
    )
    
    message = get_object_or_404(
        Message.objects.filter(conversation=conversation),
        pk=pk
    )
    
    print(f"🔧 DELETE FOR ME - User: {request.user.id}, Message: {message.id}, Sender: {message.sender.id}")
    
    # Déterminer si l'utilisateur est l'expéditeur ou le destinataire
    if message.sender == request.user:
        # L'utilisateur est l'expéditeur du message
        message.deleted_for_sender = True
        action = "deleted for sender"
    else:
        # L'utilisateur est le destinataire du message
        message.deleted_for_receiver = True
        action = "deleted for receiver"
    
    # Sauvegarder les modifications
    message.save()
    
    print(f"✅ Message {message.id} {action} successfully")
    
    return Response({
        'status': 'success',
        'message': 'Message deleted for you',
        'deleted_message_id': message.id,
        'action': action,
        'timestamp': timezone.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def delete_message_for_everyone(request, conversation_id, pk):
    """
    Delete a message for all participants (WhatsApp-like)
    """

    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=conversation_id
    )

    message = get_object_or_404(
        Message.objects.filter(conversation=conversation),
        pk=pk
    )

    # Permission check
    if request.user not in (message.sender, message.conversation.created_by):
        return Response(
            {'error': 'You can only delete your own messages for everyone'},
            status=status.HTTP_403_FORBIDDEN
        )

    message_id = message.id
    message.delete()

    conversation.updated_at = timezone.now()
    conversation.save(update_fields=["updated_at"])

    return Response({
        'status': 'success',
        'message': 'Message deleted for everyone',
        'deleted_message_id': message_id
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def mark_message_as_read(request, conversation_id, pk):
    """
    Mark a specific message as read
    """
    conversation = get_object_or_404(
        Conversation.objects.filter(participants=request.user),
        pk=conversation_id
    )
    
    message = get_object_or_404(
        Message.objects.filter(conversation=conversation),
        pk=pk
    )
    
    if not message.is_read:
        message.is_read = True
        message.save()
    
    return Response({'status': 'message marked as read'})


# ==================== USERS ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def user_list(request):
    """
    List of users to start a conversation
    """
    users = User.objects.exclude(id=request.user.id).select_related('profile')
    
    # Filtrer les utilisateurs inactifs
    users = users.filter(is_active=True)
    
    # Si le modèle Profile a un champ is_active, le filtrer aussi
    from django.db.models import Q
    users = users.filter(
        Q(profile__isnull=True) |  # Inclure les utilisateurs sans profil
        Q(profile__is_active=True)  # OU avec profil actif
    )
    
    # Exclure les utilisateurs supprimés (si champ deleted_at existe)
    users = users.filter(
        Q(profile__isnull=True) |
        Q(profile__deleted_at__isnull=True)  # deleted_at est NULL
    )
    
    search = request.query_params.get('search', None)
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    serializer = UserWithProfileSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def user_search(request):
    """
    Advanced user search - EXCLUT les utilisateurs inactifs
    """
    search = request.query_params.get('q', '')
    
    if not search or len(search) < 2:
        return Response(
            {'error': 'Search term must be at least 2 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Base queryset avec filtre d'utilisateurs actifs
    users = User.objects.filter(
        is_active=True  # <-- FILTRE AJOUTÉ: uniquement les utilisateurs actifs
    ).exclude(id=request.user.id).select_related('profile')
    
    # Filtre supplémentaire pour les profils actifs
    users = users.filter(
        Q(profile__isnull=True) |  # Inclure les utilisateurs sans profil
        Q(profile__is_active=True)  # Inclure les utilisateurs avec profil actif
    )
    
    # Appliquer la recherche
    users = users.filter(
        Q(username__icontains=search) |
        Q(email__icontains=search) |
        Q(first_name__icontains=search) |
        Q(last_name__icontains=search)
    )[:20]
    
    serializer = UserWithProfileSerializer(users, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'count': users.count(),
        'search': search,
        'message': f'Found {users.count()} active users matching "{search}"'
    })

# ==================== STATISTICS ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def messaging_stats(request):
    """
    Get user messaging statistics
    """
    total_conversations = Conversation.objects.filter(
        participants=request.user
    ).count()
    
    unread_messages = 0
    conversations = Conversation.objects.filter(participants=request.user)
    
    for conv in conversations:
        unread_messages += conv.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).count()
    
    last_message_sent = Message.objects.filter(
        sender=request.user
    ).order_by('-timestamp').first()
    
    last_message_received = Message.objects.filter(
        conversation__participants=request.user
    ).exclude(
        sender=request.user
    ).order_by('-timestamp').first()
    
    return Response({
        'total_conversations': total_conversations,
        'unread_messages': unread_messages,
        'last_message_sent': MessageSerializer(last_message_sent).data if last_message_sent else None,
        'last_message_received': MessageSerializer(last_message_received).data if last_message_received else None,
    })



# ==================== ONLINE STATUS VIEWS ====================

# messaging/views.py - Version simplifiée
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ping_online_status(request):
    """
    Version simplifiée sans méthodes de classe
    """
    try:
        from .models import UserOnlineStatus
        
        # Récupérer ou créer le statut
        user_status, created = UserOnlineStatus.objects.get_or_create(
            user=request.user
        )
        
        # Mettre à jour manuellement
        from datetime import timedelta
        from django.utils import timezone
        
        user_status.last_activity = timezone.now()
        
        # Marquer comme en ligne si activité dans les 2 dernières minutes
        two_minutes_ago = timezone.now() - timedelta(minutes=2)
        user_status.is_online = user_status.last_activity > two_minutes_ago
        
        user_status.save()
        
        return Response({
            'status': 'success',
            'is_online': user_status.is_online,
            'last_activity': user_status.last_activity,
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=500  # Code HTTP direct
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication])
def get_my_online_status(request):
    """
    Récupérer son propre statut en ligne
    """
    try:
        from .models import UserOnlineStatus
        
        status, created = UserOnlineStatus.objects.get_or_create(
            user=request.user,
            defaults={
                'is_online': True,
                'last_activity': timezone.now(),
                'last_seen': timezone.now()
            }
        )
        
        return Response({
            'user_id': request.user.id,
            'username': request.user.username,
            'is_online': status.is_online,
            'last_activity': status.last_activity,
            'last_seen': status.last_seen,
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication])
def check_user_online(request, user_id):
    """
    Vérifier si un utilisateur spécifique est en ligne
    """
    try:
        user = User.objects.get(id=user_id)
        
        if hasattr(user, 'online_status'):
            status = user.online_status
            
            # Considérer en ligne si activité dans les 2 dernières minutes
            two_minutes_ago = timezone.now() - timedelta(minutes=2)
            is_currently_online = status.last_activity > two_minutes_ago
            
            # Mettre à jour le champ is_online si nécessaire
            if status.is_online != is_currently_online:
                status.is_online = is_currently_online
                status.save()
            
            return Response({
                'user_id': user_id,
                'username': user.username,
                'is_online': is_currently_online,
                'last_seen': status.last_activity,
                'last_activity': status.last_activity,
                'formatted_last_seen': format_last_seen(status.last_activity),
            })
        
        # Si pas de statut, créer un par défaut
        from .models import UserOnlineStatus
        status = UserOnlineStatus.objects.create(
            user=user,
            is_online=False,
            last_activity=timezone.now() - timedelta(days=1)
        )
        
        return Response({
            'user_id': user_id,
            'username': user.username,
            'is_online': False,
            'last_seen': status.last_activity,
            'last_activity': status.last_activity,
            'formatted_last_seen': 'Long time ago',
            'note': 'Status created with default values'
        })
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication])
def get_multiple_users_online_status(request):
    """
    Récupérer le statut en ligne de plusieurs utilisateurs
    """
    user_ids = request.GET.getlist('user_ids[]')
    
    if not user_ids:
        return Response(
            {'error': 'No user_ids provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        users = User.objects.filter(id__in=user_ids)
        results = []
        
        for user in users:
            if hasattr(user, 'online_status'):
                status = user.online_status
                
                # Vérifier si en ligne
                two_minutes_ago = timezone.now() - timedelta(minutes=2)
                is_online = status.last_activity > two_minutes_ago
                
                results.append({
                    'user_id': user.id,
                    'username': user.username,
                    'is_online': is_online,
                    'last_seen': status.last_activity,
                    'formatted_last_seen': format_last_seen(status.last_activity),
                })
            else:
                results.append({
                    'user_id': user.id,
                    'username': user.username,
                    'is_online': False,
                    'last_seen': None,
                    'formatted_last_seen': 'Unknown',
                })
        
        return Response({
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication])
def set_online_status(request):
    """
    Définir manuellement son statut en ligne (pour tests ou contrôle manuel)
    """
    try:
        from .models import UserOnlineStatus
        
        is_online = request.data.get('is_online', True)
        
        status, created = UserOnlineStatus.objects.get_or_create(
            user=request.user
        )
        
        status.is_online = is_online
        status.last_activity = timezone.now()
        
        if not is_online:
            status.last_seen = timezone.now()
        
        status.save()
        
        return Response({
            'status': 'success',
            'is_online': status.is_online,
            'last_activity': status.last_activity,
            'last_seen': status.last_seen,
            'message': f"Status set to {'online' if is_online else 'offline'}"
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Fonction utilitaire
def format_last_seen(dt):
    """Formater la dernière fois vu en texte lisible"""
    if not dt:
        return "Never"
    
    now = timezone.now()
    diff = now - dt
    
    if diff < timedelta(minutes=1):
        return "Just now"
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff < timedelta(days=30):
        days = diff.days
        return f"{days} day{'s' if days > 1 else ''} ago"
    else:
        return dt.strftime("%Y-%m-%d")
    

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def create_group_conversation(request):
    """
    Créer une nouvelle conversation de groupe AVEC MESSAGE SYSTÈME
    """
    participant_ids = request.data.get('participant_ids', [])
    group_name = request.data.get('name', '')
    
    # Validation
    if not participant_ids:
        return Response(
            {'error': 'At least one member is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier que tous les utilisateurs existent
    try:
        participants = User.objects.filter(id__in=participant_ids)
        if participants.count() != len(participant_ids):
            missing_ids = set(participant_ids) - set(participants.values_list('id', flat=True))
            return Response(
                {'error': f'Users not found: {missing_ids}'},
                status=status.HTTP_404_NOT_FOUND
            )
    except User.DoesNotExist:
        return Response(
            {'error': 'One or many users not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier si un groupe avec les mêmes participants existe déjà
    existing_groups = Conversation.objects.filter(
        is_group=True,
        participants=request.user
    ).filter(
        participants__in=participants
    ).distinct()
    
    # Compter les participants communs
    for group in existing_groups:
        group_participants = set(group.participants.values_list('id', flat=True))
        request_participants = set(participant_ids + [request.user.id])
        
        if group_participants == request_participants:
            # Même groupe existe déjà
            serializer = ConversationDetailSerializer(group, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Créer le groupe
    conversation = Conversation.objects.create(
        is_group=True,
        name=group_name.strip() if group_name else None,
        created_by=request.user
    )
    
    # Ajouter tous les participants (y compris l'utilisateur qui crée)
    all_participants = list(participants) + [request.user]
    conversation.participants.add(*all_participants)
    
    # Créer un message système de création de groupe
    if group_name:
        welcome_message = f"{request.user.username} created the group \"{group_name}\""
    else:
        participant_names = ", ".join([user.username for user in all_participants])
        welcome_message = f"{request.user.username} created a group with {participant_names}"
    
    # Créer un message système au lieu d'un message normal
    # Option 1: Utiliser la méthode utils si vous l'avez créée
    try:
        from .message_utils import create_system_message
        create_system_message(
            conversation=conversation,
            user=request.user,
            message_type='group_created',
            extra_data={
                'group_name': group_name,
                'participants_count': len(all_participants)
            }
        )
    except ImportError:
        # Option 2: Créer manuellement le message système
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=welcome_message,
            is_system_message=True,
            system_message_type='group_created',
            message_type='system'  # Alternative
        )
    
    # Option 3: Vous pouvez aussi créer un message pour chaque participant ajouté
    for participant in participants:
        if participant.id != request.user.id:
            # Message système pour chaque participant ajouté
            Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=f"{request.user.username} added {participant.username} to the group",
                is_system_message=True,
                system_message_type='user_invited',
                message_type='system'
            )
    
    # Créer automatiquement les enregistrements GroupMember
    for participant in all_participants:
        GroupMember.objects.create(
            group=conversation,
            user=participant,
            role='owner' if participant == request.user else 'member',
            joined_at=timezone.now()
        )
    
    # Si le groupe a une photo par défaut ou envoyée
    if 'group_photo' in request.FILES:
        conversation.group_photo = request.FILES['group_photo']
        conversation.save()
        
        # Message système pour la photo
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=f"{request.user.username} set the group photo",
            is_system_message=True,
            system_message_type='group_photo_changed',
            message_type='system'
        )
    
    # Si des tags sont fournis
    tags = request.data.get('tags', [])
    if tags:
        conversation.tags = tags
        conversation.save()
    
    # Si une description est fournie
    description = request.data.get('description', '')
    if description:
        conversation.description = description
        conversation.save()
    
    serializer = ConversationDetailSerializer(conversation, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
# messaging/views.py - Ajoutez ces vues
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def create_group(request):
    """
    Créer un nouveau groupe (privé ou public)
    """
    serializer = GroupCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        conversation = serializer.save()
        
        return Response(
            ConversationDetailSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_public_groups(request):
    """
    Lister tous les groupes publics
    """
    public_groups = Conversation.objects.filter(
        is_group=True,
        group_type='group_public',
        is_active=True
    ).exclude(
        participants=request.user
    ).prefetch_related('participants')
    
    page = request.query_params.get('page', 1)
    limit = request.query_params.get('limit', 20)
    
    try:
        page = int(page)
        limit = int(limit)
    except ValueError:
        return Response(
            {'error': 'page et limit doivent être des nombres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    paginator = Paginator(public_groups, limit)
    
    try:
        groups = paginator.page(page)
    except EmptyPage:
        return Response({
            'results': [],
            'count': public_groups.count(),
            'next': None,
            'previous': None,
            'page': page,
            'pages': paginator.num_pages
        })
    
    serializer = ConversationSerializer(
        groups, 
        many=True,
        context={'request': request}
    )
    
    return Response({
        'results': serializer.data,
        'count': public_groups.count(),
        'next': groups.has_next(),
        'previous': groups.has_previous(),
        'page': page,
        'pages': paginator.num_pages
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_group(request, pk):
    """
    Rejoindre un groupe public
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            group_type='group_public',
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé ou inaccessible'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier si l'utilisateur est déjà membre
    if group.is_user_member(request.user):
        return Response(
            {'error': 'Vous êtes déjà membre de ce groupe'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier si le groupe a encore de la place
    if group.participants.count() >= group.max_participants:
        return Response(
            {'error': 'Le groupe a atteint sa capacité maximale'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Ajouter l'utilisateur au groupe
    group.participants.add(request.user)
    
    # Créer un message de bienvenue
    Message.objects.create(
        conversation=group,
        sender=request.user,
        content=f"{request.user.username} a rejoint le groupe"
    )
    
    return Response(
        {'success': 'Vous avez rejoint le groupe'},
        status=status.HTTP_200_OK
    )

from . import message_utils  # Import message utilities

from . import message_utils  # Import message utilities

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def smart_join_group(request, pk):
    """
    Smart endpoint for joining a group - WITH ADMIN BLOCKING
    """
    print(f"🤖 SMART JOIN - User: {request.user.id}, Group: {pk}")
    
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True,
            is_visible=True
        )
        print(f"✅ Group found: {group.name}")
        print(f"⚙️  Settings: requires_approval={group.requires_approval}, max={group.max_participants}")
    except Conversation.DoesNotExist:
        print(f"❌ Group {pk} not found or not public")
        return Response(
            {'error': 'Group not found or inaccessible'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # ============ CRITICAL CHECK: USER BLOCKED BY ADMIN ============
    # Check if user was removed by admin
    admin_removed_request = GroupJoinRequest.objects.filter(
        group=group,
        user=request.user,
        status='rejected',
        metadata__admin_removed=True
    ).first()
    
    if admin_removed_request:
        print(f"🚫 USER WAS REMOVED BY ADMIN! Blocking rejoin.")
        
        # Check if it's a permanent block
        if admin_removed_request.metadata.get('permanent', False):
            return Response(
                {'error': 'You have been permanently removed from this group by an administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )
        else:
            # Temporarily block or require special approval
            return Response(
                {'error': 'You have been removed from this group by an administrator. Contact the administrator if you wish to join again.'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # ============ NORMAL CHECKS ============
    # Check if user is already a member
    is_member = group.participants.filter(id=request.user.id).exists()
    print(f"🔍 User is member: {is_member}")
    
    if is_member:
        return Response(
            {'error': 'You are already a member of this group'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if group is full
    current_members = group.participants.count()
    is_full = group.max_participants and current_members >= group.max_participants
    print(f"👥 Members: {current_members}/{group.max_participants}, Full: {is_full}")
    
    if is_full:
        return Response(
            {'error': 'The group has reached maximum capacity'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Determine action based on group settings
    action = request.data.get('action', 'auto')  # 'auto', 'direct', 'request'
    print(f"🎯 Action requested: {action}")
    
    # CASE 1: Group does NOT require approval
    if not group.requires_approval:
        print("📢 Group: No approval required - joining directly")
        
        # Add user to group
        group.participants.add(request.user)
        
        # Create/update GroupMember
        GroupMember.objects.get_or_create(
            group=group,
            user=request.user,
            defaults={'role': 'member'}
        )
        
        # Welcome message using message_utils
        message_utils.create_system_message(
            conversation=group,
            user=request.user,  # L'utilisateur qui rejoint
            message_type='user_joined'  # Type de message système
        )
        
        print(f"✅ {request.user.username} joined group {group.name}")
        
        return Response({
            'success': True,
            'message': 'You have successfully joined the group',
            'joined': True,
            'requires_approval': False,
            'action': 'direct_join',
            'remaining_spots': group.max_participants - current_members - 1 if group.max_participants else None
        })
    
    # CASE 2: Group requires approval
    else:
        print("📋 Group: Approval required")
        
        # If user wants to force direct join (admin feature)
        if action == 'direct' and request.user == group.created_by:
            print("⚡ Admin forcing direct join")
            
            group.participants.add(request.user)
            GroupMember.objects.get_or_create(
                group=group,
                user=request.user,
                defaults={'role': 'member'}
            )
            
            # Admin join message using message_utils
            message_utils.create_system_message(
                conversation=group,
                user=request.user,  # L'admin qui rejoint
                message_type='user_joined'  # Type de message système
            )
            
            return Response({
                'success': True,
                'message': 'You have joined the group (admin override)',
                'joined': True,
                'requires_approval': True,
                'action': 'admin_direct_join'
            })
        
        # Otherwise, handle join request
        message = request.data.get('message', 'I would like to join this group')
        print(f"📝 Join message: {message}")
        
        # Check if a request already exists
        existing_request = GroupJoinRequest.objects.filter(
            group=group,
            user=request.user
        ).first()
        
        if existing_request:
            print(f"📄 Existing request found: {existing_request.status}")
            
            if existing_request.status == 'pending':
                return Response(
                    {'error': 'You already have a pending request'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            elif existing_request.status == 'approved':
                # IMPORTANT FIX: Request is approved but user is not a member
                print(f"⚠️ Request approved but user not in group! Fixing...")
                
                # Add user to group
                group.participants.add(request.user)
                
                # Create/update GroupMember
                GroupMember.objects.get_or_create(
                    group=group,
                    user=request.user,
                    defaults={'role': 'member'}
                )
                
                # Announcement message using message_utils
                message_utils.create_system_message(
                    conversation=group,
                    user=request.user,  # L'utilisateur qui rejoint via request
                    message_type='user_joined'  # Type de message système
                )
                
                print(f"✅ User added to group from approved request")
                
                return Response({
                    'success': True,
                    'message': 'You have joined the group (request approved)',
                    'joined': True,
                    'requires_approval': True,
                    'action': 'approved_request_completed',
                    'note': 'Your request had already been approved'
                })
            
            elif existing_request.status == 'rejected':
                # Check if it was an admin rejection
                if existing_request.metadata and existing_request.metadata.get('admin_removed', False):
                    print(f"🚫 Rejected by admin - blocking new request")
                    return Response(
                        {'error': 'You have been removed from this group by an administrator. Contact the administrator to make a new request.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Normal rejection - user can submit new request
                existing_request.status = 'pending'
                existing_request.message = message
                existing_request.save()
                
                print(f"🔄 Re-submitting rejected request")
                
                serializer = GroupJoinRequestSerializer(existing_request, context={'request': request})
                return Response({
                    'success': True,
                    'message': 'Request renewed successfully',
                    'request': serializer.data,
                    'joined': False,
                    'requires_approval': True,
                    'action': 'request_renewed'
                })
        
        # Create a new request
        join_request = GroupJoinRequest.objects.create(
            group=group,
            user=request.user,
            message=message
        )
        
        print(f"📨 New join request created: {join_request.id}")
        
        serializer = GroupJoinRequestSerializer(join_request, context={'request': request})
        
        return Response({
            'success': True,
            'message': 'Join request sent successfully',
            'request': serializer.data,
            'joined': False,
            'requires_approval': True,
            'action': 'request_sent',
            'note': 'The group administrator must approve your request'
        }, status=status.HTTP_201_CREATED)

# Fonction helper si vous voulez la garder séparée
def _join_user_to_group(group, user, join_type="direct"):
    """
    Helper function to add user to group
    """
    # Add user to group
    group.participants.add(user)
    
    # Create/update GroupMember
    GroupMember.objects.get_or_create(
        group=group,
        user=user,
        defaults={'role': 'member'}
    )
    
    # Create appropriate message
    if join_type == "admin_direct":
        message_content = f"{user.username} a rejoint le groupe (admin join)"
    else:
        message_content = f"{user.username} a rejoint le groupe"
    
    Message.objects.create(
        conversation=group,
        sender=user,
        content=message_content
    )
    
    print(f"✅ {user.username} joined group {group.name} ({join_type})")
    
    return Response({
        'success': True,
        'message': 'Vous avez rejoint le groupe avec succès',
        'joined': True,
        'requires_approval': group.requires_approval,
        'action': join_type,
        'remaining_spots': group.max_participants - group.participants.count() if group.max_participants else None
    })
from . import message_utils  # Import message utilities

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_group(request, pk):
    """
    Leave a group - FIXED VERSION
    """
    print(f"🔴 LEAVE GROUP - User: {request.user.id}, Group: {pk}")
    
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
        print(f"✅ Group found: {group.name}")
    except Conversation.DoesNotExist:
        print(f"❌ Group {pk} not found")
        return Response(
            {'error': 'Group not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user is a member
    is_member = group.participants.filter(id=request.user.id).exists()
    print(f"🔍 User {request.user.username} is member: {is_member}")
    
    if not is_member:
        return Response(
            {'error': 'You are not a member of this group'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user is the creator
    if group.created_by == request.user:
        print(f"⚠️ User {request.user.username} is the creator")
        return Response(
            {'error': 'As the creator, you cannot leave the group. Transfer ownership first.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # DEBUG: Before removal
    print(f"📊 Before - Participants count: {group.participants.count()}")
    print(f"📊 Before - GroupMember count: {GroupMember.objects.filter(group=group).count()}")
    
    # 1. Remove user from participants
    group.participants.remove(request.user)
    
    # 2. DELETE the GroupMember record (CRITICAL FIX!)
    try:
        deleted_count, _ = GroupMember.objects.filter(
            group=group, 
            user=request.user
        ).delete()
        print(f"✅ GroupMember deleted: {deleted_count} record(s)")
    except Exception as e:
        print(f"⚠️ GroupMember error: {e}")
    
    # Refresh the object
    group.refresh_from_db()
    
    # DEBUG: After removal
    print(f"📊 After - Participants count: {group.participants.count()}")
    print(f"📊 After - GroupMember count: {GroupMember.objects.filter(group=group).count()}")
    
    # 3. Create departure message using message_utils
    try:
        message_utils.create_system_message(
            conversation=group,
            user=request.user,  # L'utilisateur qui quitte
            message_type='user_left'  # Type de message système
        )
        print(f"✅ Departure message created")
    except Exception as e:
        print(f"⚠️ Error creating message: {e}")
    
    print(f"🎉 {request.user.username} has left group {group.name}")
    
    return Response(
        {
            'success': True,
            'message': 'You have left the group',
            'data': {
                'group_id': group.id,
                'group_name': group.name,
                'remaining_members': group.participants.count()
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_group(request, pk):
    """
    Mettre à jour les informations d'un groupe
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True,
            created_by=request.user  # Seul le créateur peut modifier
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Group not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = GroupCreateSerializer(
        group,
        data=request.data,
        partial=True,
        context={'request': request}
    )
    
    if serializer.is_valid():
        updated_group = serializer.save()
        
        # Si la photo a changé, créer un message d'annonce
        if 'group_photo' in request.FILES:
            from .message_utils import create_system_message
            create_system_message(
                conversation=group,
                user=request.user,
                message_type='group_photo_changed'
            )
        
        return Response(
            ConversationDetailSerializer(updated_group, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
    return Response({'error':'The group name is too long '}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_groups(request):
    """
    Rechercher des groupes publics
    """
    search_query = request.query_params.get('q', '')
    
    if len(search_query) < 2:
        return Response(
            {'error': 'La requête de recherche doit contenir au moins 2 caractères'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    groups = Conversation.objects.filter(
        is_group=True,
        group_type='group_public',
        is_active=True,
        name__icontains=search_query
    ).exclude(
        participants=request.user
    )
    
    serializer = ConversationSerializer(
        groups, 
        many=True,
        context={'request': request}
    )
    
    return Response({
        'results': serializer.data,
        'count': groups.count()
    })


from . import message_utils  # Import message utilities

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def invite_to_group(request, pk):
    """
    Invite users to a group
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Group not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check invitation permissions
    if not group.can_anyone_invite and group.created_by != request.user:
        return Response(
            {'error': 'You do not have permission to invite members'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    user_ids = request.data.get('user_ids', [])
    
    if not user_ids:
        return Response(
            {'error': 'No users specified'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get users
    users = User.objects.filter(id__in=user_ids).exclude(
        id__in=group.participants.values_list('id', flat=True)
    )
    
    if not users.exists():
        return Response(
            {'error': 'No valid users to invite'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check group capacity
    if group.participants.count() + users.count() > group.max_participants:
        return Response(
            {'error': 'The group does not have enough space for all these users'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Add users
    group.participants.add(*users)
    
    # Create announcement messages using message_utils
    for user in users:
        message_utils.create_system_message(
            conversation=group,
            user=request.user,  # L'utilisateur qui fait l'invitation
            message_type='user_invited',  # Type de message système
            extra_data={'invited_user': user}  # L'utilisateur invité
        )
    
    return Response({
        'success': f'{users.count()} users have been invited',
        'invited_users': [user.username for user in users]
    })

# messaging/views.py - Ajoutez ces vues
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def remove_member_from_group(request, pk, user_id):
    """
    Remove a member from a group (admin only) - PREVENTS AUTO-REJOIN
    """
    print(f"🚫 REMOVE MEMBER - Admin: {request.user.id}, Group: {pk}, User: {user_id}")
    
    try:
        # Get the group
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
        print(f"✅ Group: {group.name}, Creator: {group.created_by.username}")
    except Conversation.DoesNotExist:
        print(f"❌ Group {pk} not found")
        return Response(
            {'error': 'Group not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    if group.created_by != request.user:
        print(f"❌ Permission denied")
        return Response(
            {'error': 'Only group creator can remove members'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Cannot remove self
    if int(user_id) == request.user.id:
        print(f"❌ Cannot remove self")
        return Response(
            {'error': 'You cannot remove yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_to_remove = User.objects.get(id=user_id)
        print(f"✅ User to remove: {user_to_remove.username}")
    except User.DoesNotExist:
        print(f"❌ User {user_id} not found")
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check membership
    is_member = group.participants.filter(id=user_id).exists()
    print(f"🔍 Is member: {is_member}")
    
    if not is_member:
        return Response(
            {'error': 'User is not a member'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # DEBUG: Before removal
    print(f"📊 Before - Participants: {group.participants.count()}")
    print(f"📊 Before - GroupMember: {GroupMember.objects.filter(group=group).count()}")
    print(f"📊 Before - JoinRequests: {GroupJoinRequest.objects.filter(group=group, user=user_to_remove).count()}")
    
    # 1. Remove from participants
    group.participants.remove(user_to_remove)
    
    # 2. DELETE GroupMember record (not just mark as inactive)
    deleted_members = GroupMember.objects.filter(
        group=group, 
        user=user_to_remove
    ).delete()
    print(f"✅ GroupMember deleted: {deleted_members}")
    
    # 3. CRITICAL: Reject ALL existing join requests and prevent new ones
    # Mark ALL requests as rejected with a special flag
    join_requests = GroupJoinRequest.objects.filter(
        group=group,
        user=user_to_remove
    )
    
    if join_requests.exists():
        join_requests.update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
            review_notes=f'User was removed from group by admin. Cannot rejoin.',
            # Add a flag to indicate this was an admin removal
            metadata={'admin_removed': True, 'removed_by': request.user.id, 'removed_at': timezone.now().isoformat()}
        )
        print(f"✅ {join_requests.count()} join requests marked as rejected")
    
    # 4. Create a BlockRecord to prevent future joins
    # This is a new model you might want to create
    try:
        from .models import GroupBlock  # You'll need to create this model
        
        GroupBlock.objects.get_or_create(
            group=group,
            user=user_to_remove,
            defaults={
                'blocked_by': request.user,
                'reason': 'Removed by admin',
                'can_ever_join_again': False,  # Permanent block
                'blocked_at': timezone.now()
            }
        )
        print(f"✅ User blocked from future joins")
    except ImportError:
        # If GroupBlock model doesn't exist yet, use metadata
        print(f"ℹ️ GroupBlock model not available")
    
    # 5. Create announcement message
    from .message_utils import create_system_message
    
    # Créer un message système au lieu d'un message normal
    create_system_message(
        conversation=group,
        user=request.user,
        message_type='user_removed',
        extra_data={'removed_user': user_to_remove}
    )
    # Refresh
    group.refresh_from_db()
    
    # DEBUG: After removal
    print(f"📊 After - Participants: {group.participants.count()}")
    print(f"📊 After - GroupMember: {GroupMember.objects.filter(group=group).count()}")
    
    print(f"🎉 {user_to_remove.username} permanently removed from {group.name}")
    
    return Response({
        'success': True,
        'message': f'{user_to_remove.username} has been removed from the group and cannot rejoin',
        'permanently_removed': True,
        'can_rejoin': False,
        'removed_user': {
            'id': user_to_remove.id,
            'username': user_to_remove.username
        },
        'group': {
            'id': group.id,
            'name': group.name,
            'remaining_members': group.participants.count()
        }
    })

@api_view(['POST' ,'DELETE'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def delete_group(request, pk):
    """
    Supprimer définitivement un groupe (admin seulement)
    """
    try:
        # Récupérer le groupe
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier que l'utilisateur qui fait la requête est le créateur/admin
    if group.created_by != request.user:
        return Response(
            {'error': 'Seul le créateur du groupe peut supprimer le groupe'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les informations avant suppression pour la réponse
    group_info = {
        'id': group.id,
        'name': group.name,
        'members_count': group.participants.count()
    }
    
    # Supprimer tous les messages associés d'abord (optionnel)
    # group.messages.all().delete()
    
    # Supprimer le groupe
    group.delete()
    
    return Response({
        'success': 'Groupe supprimé avec succès',
        'deleted_group': group_info,
        'message': f'Le groupe "{group.name}" a été supprimé définitivement'
    })


from django.db import transaction

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication])
def transfer_group_ownership(request, pk):
    """
    Transférer la propriété d'un groupe - Version avec debugging avancé
    """
    print(f"\n🔧 ===== TRANSFERT DEMARRÉ =====")
    print(f"👤 User: {request.user.id} ({request.user.username})")
    print(f"🏷️ Group: {pk}")
    
    # DEBUG: Voir TOUS les headers
    print(f"📋 Headers:")
    for header, value in request.headers.items():
        print(f"  {header}: {value}")
    
    # DEBUG: Voir le body RAW
    print(f"📦 Body raw: {request.body}")
    
    # DEBUG: Voir request.data
    print(f"📊 request.data: {request.data}")
    print(f"📊 Type request.data: {type(request.data)}")
    
    try:
        # Essayer plusieurs méthodes pour extraire new_owner_id
        new_owner_id = None
        
        # Méthode 1: Via request.data (DRF normal)
        if isinstance(request.data, dict):
            new_owner_id = request.data.get('new_owner_id')
            print(f"✅ Méthode dict: new_owner_id = {new_owner_id}")
        elif isinstance(request.data, (int, float)):
            new_owner_id = int(request.data)
            print(f"✅ Méthode int: new_owner_id = {new_owner_id}")
        elif isinstance(request.data, str):
            # Essayer de parser comme JSON
            import json
            try:
                parsed = json.loads(request.data)
                if isinstance(parsed, dict):
                    new_owner_id = parsed.get('new_owner_id')
                    print(f"✅ Méthode JSON string: new_owner_id = {new_owner_id}")
                else:
                    new_owner_id = int(parsed)
                    print(f"✅ Méthode JSON number: new_owner_id = {new_owner_id}")
            except (json.JSONDecodeError, ValueError):
                # Si c'est juste une string de nombre
                try:
                    new_owner_id = int(request.data)
                    print(f"✅ Méthode string number: new_owner_id = {new_owner_id}")
                except ValueError:
                    pass
        
        # Méthode 2: Via POST direct (pour les formulaires)
        if new_owner_id is None and request.POST:
            post_new_owner_id = request.POST.get('new_owner_id')
            if post_new_owner_id:
                try:
                    new_owner_id = int(post_new_owner_id)
                    print(f"✅ Méthode POST: new_owner_id = {new_owner_id}")
                except ValueError:
                    pass
        
        # Si toujours None, erreur
        if new_owner_id is None:
            print("❌ ERREUR: new_owner_id non trouvé")
            return Response(
                {'error': 'new_owner_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convertir en int final
        try:
            new_owner_id = int(new_owner_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'new_owner_id doit être un nombre'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"🔢 new_owner_id final: {new_owner_id}")
        
        # Le reste du code...
        group = get_object_or_404(
            Conversation,
            pk=pk,
            is_group=True,
            is_active=True,
            created_by=request.user
        )
        
        new_owner = get_object_or_404(User, id=new_owner_id)
        
        if new_owner_id == request.user.id:
            return Response(
                {'error': 'Vous ne pouvez pas vous transférer la propriété à vous-même'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not group.participants.filter(id=new_owner_id).exists():
            return Response(
                {'error': 'Le nouveau propriétaire doit être membre du groupe'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Effectuer le transfert
        old_owner = group.created_by
        group.created_by = new_owner
        group.save()
        
        # Mettre à jour GroupMember
        try:
            GroupMember.objects.filter(group=group, user=old_owner).update(role='member')
            GroupMember.objects.filter(group=group, user=new_owner).update(role='owner')
        except:
            pass
        
        # Message d'annonce
        Message.objects.create(
            conversation=group,
            sender=request.user,
            content=f"{request.user.username} a transféré la propriété du groupe à {new_owner.username}"
        )
        
        print("🎉 TRANSFERT RÉUSSI !")
        
        return Response({
            'success': True,
            'message': 'Propriété transférée avec succès',
            'new_owner': {
                'id': new_owner.id,
                'username': new_owner.username
            }
        })
        
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé ou vous n\'êtes pas le propriétaire'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"💥 ERREUR CRITIQUE: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def group_admin_info(request, pk):
    """
    Récupérer les informations d'administration d'un groupe
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier que l'utilisateur est admin
    is_admin = group.created_by == request.user
    
    if not is_admin:
        return Response(
            {'error': 'Seul l\'administrateur peut voir ces informations'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Préparer les données
    members = group.participants.all()
    member_list = []
    
    for member in members:
        member_list.append({
            'id': member.id,
            'username': member.username,
            'email': member.email,
            'is_admin': member.id == group.created_by.id,
            'joined_date': member.date_joined if hasattr(member, 'date_joined') else None
        })
    
    return Response({
        'group_id': group.id,
        'group_name': group.name,
        'created_by': {
            'id': group.created_by.id,
            'username': group.created_by.username
        },
        'created_at': group.created_at,
        'members_count': group.participants.count(),
        'max_participants': group.max_participants,
        'members': member_list,
        'settings': {
            'can_anyone_invite': group.can_anyone_invite,
            'group_type': group.group_type,
            'is_active': group.is_active
        }
    })



# Vues existantes...

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_group_categories(request):
    """
    Lister toutes les catégories de groupes
    """
    categories = GroupCategory.objects.filter(is_active=True).annotate(
        groups_count=Count('groups', filter=Q(groups__is_active=True, groups__is_visible=True))
    )
    
    serializer = GroupCategorySerializer(categories, many=True, context={'request': request})
    return Response(serializer.data)

# messaging/views.py - CORRECTION de la fonction explore_public_groups
# messaging/views.py - CORRECTION de la fonction explore_public_groups
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def explore_public_groups(request):
    """
    Explorer les groupes publics avec filtres
    """
    # IMPORTATION de Q AU DÉBUT DE LA FONCTION
    from django.db.models import Q, Avg, Count, F, ExpressionWrapper, FloatField
    from django.db.models.functions import Coalesce
    
    groups = Conversation.objects.filter(
        is_group=True,
        is_active=True,
        is_visible=True
    ).select_related('category').prefetch_related('participants')
    
    # Filtres
    category_id = request.query_params.get('category')
    search = request.query_params.get('search')
    sort_by = request.query_params.get('sort', 'popular')
    min_rating = request.query_params.get('min_rating')
    
    if category_id:
        groups = groups.filter(category_id=category_id)
    
    if search:
        # Recherche sur le nom et la description
        groups = groups.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search) |
            Q(tags__icontains=search)  # Adaptation selon votre structure JSON
        )
    
    # CORRECTION: Toujours annoter avg_rating et reviews_count
    groups = groups.annotate(
        avg_rating=Coalesce(Avg('feedbacks__rating', filter=Q(feedbacks__is_visible=True)), 0.0),
        reviews_count=Count('feedbacks', filter=Q(feedbacks__is_visible=True))
    )
    
    if min_rating:
        try:
            min_rating = float(min_rating)
            # Filtrer par note moyenne
            groups = groups.filter(avg_rating__gte=min_rating)
        except ValueError:
            pass
    
    # Tri
    if sort_by == 'popular':
        groups = groups.annotate(members_count=Count('participants')).order_by('-members_count')
    elif sort_by == 'recent':
        groups = groups.order_by('-created_at')
    elif sort_by == 'rating':
        # CORRECTION: Score bayésien simple
        # Formule: (rating * reviews) / (reviews + min_reviews_threshold)
        # Cela donne un bonus aux groupes avec plus d'avis
        
        # Seuil minimum d'avis pour être pris au sérieux
        MIN_REVIEWS_THRESHOLD = 3
        
        groups = groups.annotate(
            weighted_score=ExpressionWrapper(
                F('avg_rating') * F('reviews_count') / (F('reviews_count') + MIN_REVIEWS_THRESHOLD),
                output_field=FloatField()
            )
        ).order_by('-weighted_score', '-reviews_count')
    else:
        groups = groups.order_by('-updated_at')
    
    # Pagination
    page = request.query_params.get('page', 1)
    limit = request.query_params.get('limit', 20)
    
    try:
        page = int(page)
        limit = int(limit)
    except ValueError:
        return Response(
            {'error': 'page et limit doivent être des nombres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    paginator = Paginator(groups, limit)
    
    try:
        groups_page = paginator.page(page)
    except EmptyPage:
        return Response({
            'results': [],
            'count': groups.count(),
            'next': None,
            'previous': None,
            'page': page,
            'pages': paginator.num_pages
        })
    
    serializer = GroupDetailSerializer(
        groups_page, 
        many=True,
        context={'request': request}
    )
    
    return Response({
        'results': serializer.data,
        'count': groups.count(),
        'next': groups_page.has_next(),
        'previous': groups_page.has_previous(),
        'page': page,
        'pages': paginator.num_pages
    })
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_to_join_group(request, pk):
    """
    Envoyer une demande d'adhésion à un groupe
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            group_type='group_public',
            is_active=True,
            is_visible=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé ou inaccessible'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier si l'utilisateur est déjà membre
    if group.is_user_member(request.user):
        return Response(
            {'error': 'Vous êtes déjà membre de ce groupe'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier si le groupe est plein
    if group.is_full:
        return Response(
            {'error': 'Le groupe a atteint sa capacité maximale'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier les paramètres du groupe
    if not group.requires_approval:
        # Rejoindre directement si pas besoin d'approbation
        group.participants.add(request.user)
        GroupMember.objects.create(group=group, user=request.user, role='member')
        
        # Message d'annonce
        Message.objects.create(
            conversation=group,
            sender=request.user,
            content=f"{request.user.username} a rejoint le groupe"
        )
        
        return Response({
            'success': 'Vous avez rejoint le groupe avec succès',
            'joined': True
        })
    
    # Créer une demande d'adhésion
    message = request.data.get('message', '')
    
    # Vérifier si une demande existe déjà
    existing_request = GroupJoinRequest.objects.filter(
        group=group,
        user=request.user
    ).first()
    
    if existing_request:
        if existing_request.status == 'pending':
            return Response(
                {'error': 'Vous avez déjà une demande en attente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif existing_request.status == 'approved':
            return Response(
                {'error': 'Vous êtes déjà membre de ce groupe'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif existing_request.status == 'rejected':
            # L'utilisateur peut soumettre une nouvelle demande
            existing_request.status = 'pending'
            existing_request.message = message
            existing_request.save()
            serializer = GroupJoinRequestSerializer(existing_request, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Créer une nouvelle demande
    join_request = GroupJoinRequest.objects.create(
        group=group,
        user=request.user,
        message=message
    )
    
    serializer = GroupJoinRequestSerializer(join_request, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_group_join_requests(request, pk):
    """
    Lister les demandes d'adhésion d'un groupe (admin seulement)
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier que l'utilisateur est admin
    if group.created_by != request.user:
        return Response(
            {'error': 'Seul l\'administrateur peut voir les demandes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    status_filter = request.query_params.get('status', 'pending')
    join_requests = group.join_requests.filter(status=status_filter)
    
    serializer = GroupJoinRequestSerializer(
        join_requests, 
        many=True,
        context={'request': request}
    )
    
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_join_request(request, pk, request_id):
    """
    Approuver une demande d'adhésion (admin seulement)
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier que l'utilisateur est admin
    if group.created_by != request.user:
        return Response(
            {'error': 'Seul l\'administrateur peut approuver les demandes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        join_request = GroupJoinRequest.objects.get(
            id=request_id,
            group=group,
            status='pending'
        )
    except GroupJoinRequest.DoesNotExist:
        return Response(
            {'error': 'Demande non trouvée ou déjà traitée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier si le groupe est plein
    if group.is_full:
        return Response(
            {'error': 'Le groupe a atteint sa capacité maximale'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Approuver la demande
    review_notes = request.data.get('review_notes', '')
    join_request.approve(reviewed_by=request.user, notes=review_notes)
    
    serializer = GroupJoinRequestSerializer(join_request, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_join_request(request, pk, request_id):
    """
    Rejeter une demande d'adhésion (admin seulement)
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier que l'utilisateur est admin
    if group.created_by != request.user:
        return Response(
            {'error': 'Seul l\'administrateur peut rejeter les demandes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        join_request = GroupJoinRequest.objects.get(
            id=request_id,
            group=group,
            status='pending'
        )
    except GroupJoinRequest.DoesNotExist:
        return Response(
            {'error': 'Demande non trouvée ou déjà traitée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Rejeter la demande
    review_notes = request.data.get('review_notes', '')
    join_request.reject(reviewed_by=request.user, notes=review_notes)
    
    serializer = GroupJoinRequestSerializer(join_request, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_join_request(request, pk):
    """
    Annuler sa propre demande d'adhésion
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        join_request = GroupJoinRequest.objects.get(
            group=group,
            user=request.user,
            status='pending'
        )
    except GroupJoinRequest.DoesNotExist:
        return Response(
            {'error': 'Demande non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    join_request.cancel()
    
    return Response({
        'success': 'Demande annulée',
        'cancelled_request_id': join_request.id
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_group_feedback(request, pk):
    """
    Soumettre un feedback/avis pour un groupe
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier que l'utilisateur est membre
    if not group.is_user_member(request.user):
        return Response(
            {'error': 'Vous devez être membre du groupe pour donner un avis'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Vérifier si un feedback existe déjà
    existing_feedback = GroupFeedback.objects.filter(
        group=group,
        user=request.user
    ).first()
    
    data = request.data.copy()
    data['group'] = group.id
    data['user'] = request.user.id
    
    if existing_feedback:
        # Mettre à jour le feedback existant
        serializer = GroupFeedbackSerializer(
            existing_feedback,
            data=data,
            context={'request': request}
        )
    else:
        # Créer un nouveau feedback
        serializer = GroupFeedbackSerializer(
            data=data,
            context={'request': request}
        )
    
    if serializer.is_valid():
        feedback = serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_group_feedbacks(request, pk):
    """
    Lister les feedbacks d'un groupe
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True,
            is_visible=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    feedbacks = group.feedbacks.filter(is_visible=True).select_related('user')
    
    # Pagination
    page = request.query_params.get('page', 1)
    limit = request.query_params.get('limit', 10)
    
    try:
        page = int(page)
        limit = int(limit)
    except ValueError:
        return Response(
            {'error': 'page et limit doivent être des nombres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    paginator = Paginator(feedbacks, limit)
    
    try:
        feedbacks_page = paginator.page(page)
    except EmptyPage:
        return Response({
            'results': [],
            'count': feedbacks.count(),
            'next': None,
            'previous': None,
            'page': page,
            'pages': paginator.num_pages
        })
    
    serializer = GroupFeedbackSerializer(
        feedbacks_page, 
        many=True,
        context={'request': request}
    )
    
    return Response({
        'results': serializer.data,
        'count': feedbacks.count(),
        'next': feedbacks_page.has_next(),
        'previous': feedbacks_page.has_previous(),
        'page': page,
        'pages': paginator.num_pages,
        'average_rating': group.feedbacks.filter(is_visible=True).aggregate(
            Avg('rating')
        )['rating__avg'] or 0
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_my_group_join_requests(request):
    """
    Lister mes demandes d'adhésion
    """
    join_requests = GroupJoinRequest.objects.filter(
        user=request.user
    ).select_related('group', 'group__category')
    
    status_filter = request.query_params.get('status')
    if status_filter:
        join_requests = join_requests.filter(status=status_filter)
    
    serializer = GroupJoinRequestSerializer(
        join_requests, 
        many=True,
        context={'request': request}
    )
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Changé à AllowAny
def list_group_members(request, pk):
    """
    Lister les membres d'un groupe (accessible à tous)
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True,
              # Ajouter cette condition
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # SUPPRIMER la vérification de membre
    # if not group.is_user_member(request.user):
    #     return Response(
    #         {'error': 'Vous devez être membre du groupe pour voir la liste des membres'},
    #         status=status.HTTP_403_FORBIDDEN
    #     )
    
    # Pour les groupes privés, limiter l'accès aux membres seulement
    if group.group_type == 'group_private' and not group.is_user_member(request.user):
        return Response(
            {'error': 'Ce groupe est privé. Seuls les membres peuvent voir la liste des membres.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Pour les groupes publics, montrer tous les membres
    members = GroupMember.objects.filter(
        group=group,
        is_banned=False
    ).select_related('user', 'user__profile')
    
    # Pour les non-membres, limiter à 20 membres maximum
    if not group.is_user_member(request.user) and group.group_type == 'group_public':
        members = members[:20]
    
    # Pagination
    page = request.query_params.get('page', 1)
    limit = request.query_params.get('limit', 50)
    
    try:
        page = int(page)
        limit = int(limit)
    except ValueError:
        return Response(
            {'error': 'page et limit doivent être des nombres'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    paginator = Paginator(members, limit)
    
    try:
        members_page = paginator.page(page)
    except EmptyPage:
        return Response({
            'results': [],
            'count': members.count(),
            'next': None,
            'previous': None,
            'page': page,
            'pages': paginator.num_pages
        })
    
    serializer = GroupMemberSerializer(
        members_page, 
        many=True,
        context={'request': request}
    )
    
    return Response({
        'results': serializer.data,
        'count': members.count(),
        'next': members_page.has_next(),
        'previous': members_page.has_previous(),
        'page': page,
        'pages': paginator.num_pages,
        'total_members': group.current_members_count,
        'can_see_all': group.is_user_member(request.user)  # Indique si l'utilisateur peut voir tous les membres
    })
# messaging/views.py - CORRECTION de search_groups_advanced
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def search_groups_advanced(request):
    """
    Recherche avancée de groupes - CORRIGÉE
    """
    search_query = request.data.get('q', '')
    category_id = request.data.get('category_id')
    min_rating = request.data.get('min_rating')
    max_members = request.data.get('max_members')
    tags = request.data.get('tags', [])
    location = request.data.get('location')
    
    groups = Conversation.objects.filter(
        is_group=True,
        group_type='group_public',
        is_active=True,
        is_visible=True
    ).select_related('category')
    
    # Filtre par recherche textuelle
    if search_query:
        from django.db.models import Q
        groups = groups.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    # Filtre par catégorie
    if category_id:
        groups = groups.filter(category_id=category_id)
    
    # Filtre par note minimum
    if min_rating:
        try:
            min_rating = float(min_rating)
            groups = groups.annotate(
                avg_rating=Avg('feedbacks__rating', filter=Q(feedbacks__is_visible=True))
            ).filter(avg_rating__gte=min_rating)
        except ValueError:
            pass
    
    # Filtre par nombre maximum de membres
    if max_members:
        try:
            max_members = int(max_members)
            groups = groups.annotate(
                members_count=Count('participants')
            ).filter(members_count__lte=max_members)
        except ValueError:
            pass
    
    # Filtre par tags - NOUVELLE MÉTHODE
    if tags and isinstance(tags, list):
        # Méthode 1: Utiliser une requête brute si vous utilisez PostgreSQL
        # Méthode 2: Filtrer après coup (moins efficace)
        # Pour l'instant, nous allons filtrer après la requête principale
        
        # Nous allons d'abord récupérer tous les groupes puis filtrer
        group_ids = []
        all_groups = list(groups)
        
        for group in all_groups:
            group_tags = group.tags or []
            # Vérifier si au moins un tag correspond
            if any(tag.lower() in [t.lower() for t in group_tags] for tag in tags):
                group_ids.append(group.id)
        
        # Filtrer les groupes par IDs
        groups = groups.filter(id__in=group_ids)
    
    # Filtre par location
    if location:
        groups = groups.filter(location__icontains=location)
    
    # Tri par pertinence
    groups = groups.annotate(
        members_count=Count('participants'),
        avg_rating=Avg('feedbacks__rating', filter=Q(feedbacks__is_visible=True)
    )).order_by('-avg_rating', '-members_count')
    
    serializer = GroupDetailSerializer(
        groups[:50],  # Limiter à 50 résultats
        many=True,
        context={'request': request}
    )
    
    return Response({
        'results': serializer.data,
        'count': groups.count()
    })
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_group_details(request, pk):
    """
    Récupérer les détails d'un groupe (accessible à tous)
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True,
        
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # DEBUG: Vérifier les données
    print(f"\n🔍 ===== DEBUG Group {group.id}: {group.name} =====")
    print(f"  Participants count: {group.participants.count()}")
    print(f"  GroupMember count BEFORE: {group.member_info.count()}")
    
    # Vérifier et créer les GroupMember manquants
    participants = list(group.participants.all())
    group_members = list(group.member_info.all())
    
    participant_ids = {p.id for p in participants}
    group_member_ids = {gm.user.id for gm in group_members}
    
    missing_ids = participant_ids - group_member_ids
    
    if missing_ids:
        print(f"  ⚠️  Missing GroupMember records for participants: {missing_ids}")
        
        # Créer les GroupMember manquants
        for participant_id in missing_ids:
            participant = User.objects.get(id=participant_id)
            role = 'owner' if participant == group.created_by else 'member'
            GroupMember.objects.create(
                group=group,
                user=participant,
                role=role,
                joined_at=group.created_at
            )
            print(f"  ✅ Created GroupMember for {participant.username} (role: {role})")
    
    # Reload les GroupMember après création
    group.refresh_from_db()
    print(f"  GroupMember count AFTER: {group.member_info.count()}")
    
    # Lister tous les GroupMember
    for gm in group.member_info.all():
        print(f"  GroupMember: {gm.user.username} (role: {gm.role}, banned: {gm.is_banned})")
    
    # Utiliser GroupDetailSerializer qui inclut get_members()
    serializer = GroupDetailSerializer(
        group, 
        context={'request': request}
    )
    
    return Response(serializer.data)
# messaging/views.py - Ajoutez cette vue
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_group_members(request, pk):
    """
    Récupérer TOUS les membres d'un groupe
    """
    try:
        group = Conversation.objects.get(
            pk=pk,
            is_group=True,
            is_active=True
        )
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Groupe non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Vérifier si l'utilisateur peut voir les membres
    if not group.is_visible and not group.participants.filter(id=request.user.id).exists():
        return Response(
            {'error': 'Vous n\'avez pas accès à ce groupe'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer TOUS les membres
    group_members = group.member_info.all().select_related('user', 'user__profile')
    
    # DEBUG
    print(f"🔍 DEBUG get_group_members - Group {group.id}:")
    print(f"  Total GroupMember records: {group_members.count()}")
    for gm in group_members:
        print(f"  - {gm.user.username} (role: {gm.role})")
    
    # Pagination
    page = request.query_params.get('page', 1)
    per_page = request.query_params.get('per_page', 100)
    
    # Pagination manuelle pour le debugging
    all_members = list(group_members)
    start_idx = (int(page) - 1) * int(per_page)
    end_idx = start_idx + int(per_page)
    paginated_members = all_members[start_idx:end_idx]
    
    serializer = GroupMemberSerializer(paginated_members, many=True, context={'request': request})
    
    return Response({
        'members': serializer.data,
        'total': len(all_members),
        'page': int(page),
        'per_page': int(per_page),
        'total_pages': (len(all_members) + int(per_page) - 1) // int(per_page)
    })
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversation_by_group_id(request, group_id):
    """
    Récupérer une conversation par ID de groupe et rediriger vers les messages
    """
    try:
        conversation = Conversation.objects.get(
            id=group_id,
            is_active=True
        )
        
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a member of this group'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Sérialiser avec les messages
        serializer = ConversationDetailSerializer(
            conversation,
            context={'request': request}
        )
        
        # Récupérer les messages aussi
        messages = Message.objects.filter(
            conversation=conversation
        ).select_related('sender').order_by('timestamp')[:50]  # Limiter à 50
        
        messages_serializer = MessageSerializer(
            messages,
            many=True,
            context={'request': request}
        )
        
        return Response({
            'conversation': serializer.data,
            'messages': messages_serializer.data,
            'messages_count': messages.count(),
            'messages_url': f'/msg/conversations/{conversation.id}/messages/'
        })
        
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Conversation not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

User = get_user_model()

# ==================== BLOCK STATUS ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def block_status(request, user_id):
    """
    Vérifie le statut de blocage entre l'utilisateur courant et un autre utilisateur
    """
    try:
        other_user = get_object_or_404(User, id=user_id)
        status_data = BlockManager.get_block_status(request.user.id, other_user.id)
        
        return Response({
            'success': True,
            'status': status_data
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== BLOCK USER ====================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def block_user_view(request, user_id):
    """
    Bloque un utilisateur
    """
    try:
        user_to_block = get_object_or_404(User, id=user_id)
        
        # Ne pas se bloquer soi-même
        if request.user.id == user_id:
            return Response({
                'success': False,
                'error': "Vous ne pouvez pas vous bloquer vous-même"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier les paramètres depuis request.data (DRF) au lieu de request.POST
        block_type = request.data.get('block_type', 'both')
        reason = request.data.get('reason', '')
        duration_days = int(request.data.get('duration_days', 0))
        
        # Vérifier si l'utilisateur peut encore bloquer
        settings, created = BlockSettings.objects.get_or_create(user=request.user)
        if not settings.can_block_more():
            return Response({
                'success': False,
                'error': "Vous avez atteint la limite de blocages"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Bloquer l'utilisateur
        success, message = BlockManager.block_user(
            request.user.id,
            user_to_block.id,
            block_type,
            reason,
            duration_days
        )
        
        return Response({
            'success': success,
            'message': message
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== UNBLOCK USER ====================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def unblock_user_view(request, user_id):
    """
    Débloque un utilisateur
    """
    try:
        user_to_unblock = get_object_or_404(User, id=user_id)
        
        success, message = BlockManager.unblock_user(
            request.user.id,
            user_to_unblock.id
        )
        
        return Response({
            'success': success,
            'message': message
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== BLOCKED USERS LIST ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def blocked_users_list(request):
    """
    Liste des utilisateurs bloqués par l'utilisateur courant
    """
    blocks = BlockManager.get_blocked_users(request.user.id)
    
    blocked_users = []
    for block in blocks:
        blocked_users.append({
            'id': block.blocked.id,
            'username': block.blocked.username,
            'block_type': block.block_type,
            'reason': block.reason,
            'created_at': block.created_at.isoformat(),
            'expires_at': block.expires_at.isoformat() if block.expires_at else None,
            'is_expired': block.is_expired
        })
    
    return Response({
        'success': True,
        'blocked_users': blocked_users,
        'total': len(blocked_users)
    })


# ==================== WHO BLOCKED ME ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def who_blocked_me(request):
    """
    Liste des utilisateurs qui ont bloqué l'utilisateur courant
    """
    blocks = BlockManager.get_users_who_blocked(request.user.id)
    
    blockers = []
    for block in blocks:
        blockers.append({
            'id': block.blocker.id,
            'username': block.blocker.username,
            'block_type': block.block_type,
            'reason': block.reason,
            'created_at': block.created_at.isoformat()
        })
    
    return Response({
        'success': True,
        'blockers': blockers,
        'total': len(blockers)
    })


# ==================== BLOCK SETTINGS ====================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def block_settings(request):
    """
    Récupère ou modifie les paramètres de blocage
    """
    if request.method == 'GET':
        settings, created = BlockSettings.objects.get_or_create(user=request.user)
        
        return Response({
            'success': True,
            'settings': {
                'hide_profile_from_blocked': settings.hide_profile_from_blocked,
                'hide_online_status_from_blocked': settings.hide_online_status_from_blocked,
                'hide_last_seen_from_blocked': settings.hide_last_seen_from_blocked,
                'notify_on_block': settings.notify_on_block,
                'notify_on_unblock': settings.notify_on_unblock,
                'auto_block_spam_users': settings.auto_block_spam_users,
                'spam_report_threshold': settings.spam_report_threshold,
                'max_blocks_allowed': settings.max_blocks_allowed,
                'block_duration_default': settings.block_duration_default,
                'blocks_count': settings.blocks_count,
                'blocked_by_count': settings.blocked_by_count,
            }
        })
    
    elif request.method == 'POST':
        settings, created = BlockSettings.objects.get_or_create(user=request.user)
        
        # Mettre à jour les paramètres depuis request.data (DRF)
        settings.hide_profile_from_blocked = request.data.get('hide_profile_from_blocked', True)
        settings.hide_online_status_from_blocked = request.data.get('hide_online_status_from_blocked', True)
        settings.hide_last_seen_from_blocked = request.data.get('hide_last_seen_from_blocked', True)
        settings.notify_on_block = request.data.get('notify_on_block', True)
        settings.notify_on_unblock = request.data.get('notify_on_unblock', True)
        settings.auto_block_spam_users = request.data.get('auto_block_spam_users', False)
        settings.spam_report_threshold = int(request.data.get('spam_report_threshold', 3))
        settings.max_blocks_allowed = int(request.data.get('max_blocks_allowed', 100))
        settings.block_duration_default = int(request.data.get('block_duration_default', 0))
        
        settings.save()
        
        return Response({
            'success': True,
            'message': 'Paramètres mis à jour avec succès'
        })


# ==================== BLOCK HISTORY (AJOUT) ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def block_history(request):
    """
    Historique des actions de blocage/déblocage
    """
    try:
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))
        offset = (page - 1) * limit
        
        # Filtrer par action si spécifié
        action = request.query_params.get('action', '')
        date_from = request.query_params.get('date_from', '')
        date_to = request.query_params.get('date_to', '')
        search = request.query_params.get('search', '')
        
        queryset = BlockHistory.objects.filter(user=request.user)
        
        if action:
            queryset = queryset.filter(action=action)
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        if search:
            queryset = queryset.filter(
                Q(target_user__username__icontains=search) |
                Q(reason__icontains=search)
            )
        
        total = queryset.count()
        history = queryset.order_by('-created_at')[offset:offset + limit]
        
        history_data = []
        for item in history:
            history_data.append({
                'id': item.id,
                'action': item.action,
                'target_user': {
                    'id': item.target_user.id,
                    'username': item.target_user.username,
                },
                'block_type': getattr(item, 'block_type', None),
                'duration_days': item.duration_days,
                'reason': item.reason,
                'created_at': item.created_at.isoformat(),
                'ip_address': item.ip_address,
            })
        
        return Response({
            'success': True,
            'results': history_data,
            'total': total,
            'page': page,
            'limit': limit
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== CAN SEND MESSAGE (AJOUT) ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def can_send_message(request, user_id):
    """
    Vérifie si l'utilisateur peut envoyer un message à un autre utilisateur
    """
    try:
        other_user = get_object_or_404(User, id=user_id)
        can_send, message = BlockManager.can_send_message(request.user.id, other_user.id)
        
        return Response({
            'success': True,
            'can_send': can_send,
            'message': message
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== CAN VIEW PROFILE (AJOUT) ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([TokenAuthentication, SessionAuthentication])
def can_view_profile(request, user_id):
    """
    Vérifie si l'utilisateur peut voir le profil d'un autre utilisateur
    """
    try:
        other_user = get_object_or_404(User, id=user_id)
        can_view, message = BlockManager.can_view_profile(request.user.id, other_user.id)
        
        return Response({
            'success': True,
            'can_view': can_view,
            'message': message
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)