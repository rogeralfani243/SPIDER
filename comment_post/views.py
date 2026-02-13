# comments/views.py
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Comment
from .serializers import (
    CommentSerializer, 
    CommentCreateSerializer,
    CommentUpdateSerializer
)
from post.models import Post
import json
from app.models import Profile
User = get_user_model()

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def post_comments_list_create(request, post_id):
    """
    List all comments for a post or create a new comment
    """
    post = get_object_or_404(Post, id=post_id)
    
    if request.method == 'GET':
           # Filter comments based on user permissions
        queryset = Comment.objects.filter(
            post=post,
            parent_comment__isnull=True,
            is_hidden=False
        )
        
        # Hide spam for non-staff users
        if not request.user.is_staff:
            queryset = queryset.filter(is_spam=False)
        
        queryset = queryset.select_related('user').prefetch_related('likes', 'mentions')
        serializer = CommentSerializer(
            queryset, 
            many=True,
            context={'request': request, 'include_replies': True}
        )
        return Response(serializer.data)
    elif request.method == 'POST':
        print(f"\n=== POST REQUEST TO CREATE COMMENT ===")
        print(f"Post ID: {post_id}")
        print(f"User: {request.user if request.user.is_authenticated else 'Anonymous'}")
        print(f"Request method: {request.method}")
        print(f"Content-Type: {request.content_type}")
        print(f"Query params: {dict(request.query_params)}")
        print(f"Request FILES keys: {list(request.FILES.keys())}")
        
        # Vérifier si l'utilisateur est authentifié
        if not request.user.is_authenticated:
            print("❌ User not authenticated")
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # 🔥 CORRECTION : Ne pas copier request.data qui contient des fichiers non sérialisables
        # Préparer les données manuellement
        data = {
            'post': post_id,
            'content': request.data.get('content', '')
        }
        
        # 🔥 Ajouter les fichiers depuis request.FILES
        for field_name in ['image', 'video', 'file']:
            if field_name in request.FILES:
                data[field_name] = request.FILES[field_name]
                print(f"✅ Added {field_name} from FILES: {request.FILES[field_name].name}")
            elif field_name in request.data:
                # Si le fichier est dans request.data (au cas où)
                file_obj = request.data.get(field_name)
                if file_obj:
                    data[field_name] = file_obj
                    print(f"✅ Added {field_name} from data")
        
        # RÉCUPÉRER LE parent_comment DEPUIS LES QUERY PARAMS
        parent_comment_id = None
        
        # Essayer d'abord depuis les query params (pour FormData)
        if 'parent_comment' in request.query_params:
            parent_comment_id = request.query_params.get('parent_comment')
            print(f"📌 Parent comment from query params: {parent_comment_id}")
        # Sinon depuis request.data
        elif 'parent_comment' in request.data:
            parent_comment_id = request.data.get('parent_comment')
            print(f"📌 Parent comment from request.data: {parent_comment_id}")
        
        # Si on a un parent_comment, le traiter
        if parent_comment_id:
            try:
                parent_comment_id_int = int(parent_comment_id)
                print(f"🔍 Looking for parent comment with ID: {parent_comment_id_int}")
                
                parent_comment = Comment.objects.get(
                    id=parent_comment_id_int,
                    post=post
                )
                
                print(f"✅ Found parent comment: {parent_comment.id}")
                data['parent_comment'] = parent_comment.id
                
            except ValueError:
                print(f"❌ Invalid parent_comment_id: {parent_comment_id}")
                return Response(
                    {"error": "Invalid parent comment ID"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Comment.DoesNotExist:
                print(f"❌ Parent comment {parent_comment_id} not found")
                return Response(
                    {"error": f"Parent comment {parent_comment_id} not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        print(f"📦 Data for serializer: { {k: v if not hasattr(v, 'name') else f'File: {v.name}' for k, v in data.items()} }")
        
        # Créer le serializer
        serializer = CommentCreateSerializer(
            data=data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            print(f"✅ Serializer is valid")
            
            # Créer le commentaire
            comment = serializer.save(
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            print(f"\n🎉 COMMENT CREATED SUCCESSFULLY")
            print(f"📝 Comment ID: {comment.id}")
            
            # Mettre à jour le compteur de réponses du parent
            if comment.parent_comment:
                parent = comment.parent_comment
                parent.reply_count = parent.comment_replies.count()
                parent.save()
                print(f"📊 Updated parent reply_count to: {parent.reply_count}")
            
            # Sérialiser la réponse
            response_serializer = CommentSerializer(comment, context={'request': request})
            
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def comment_detail(request, pk):
    """
    Retrieve, update or delete a comment
    """
    comment = get_object_or_404(
        Comment.objects.select_related('user', 'post').prefetch_related('likes', 'mentions'),
        id=pk
    )
    
    if request.method == 'GET':
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Check permissions
        if comment.user != request.user and not request.user.is_staff :
            return Response(
                {"error": "You don't have permission to edit this comment."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 🔥 CORRECTION: Gérer les fichiers vides pour suppression
        data = {}
        
        # Traiter le contenu
        if 'content' in request.data:
            data['content'] = request.data['content']
        
        # Traiter les fichiers
        for field in ['image', 'video', 'file']:
            if field in request.data:
                if request.data[field] == '' or request.data[field] is None:
                    # Champ vide = supprimer le fichier
                    setattr(comment, field, None)
                    print(f"🗑️ Deleting {field} from comment {comment.id}")
                elif hasattr(request.data[field], 'file'):
                    # Nouveau fichier uploadé
                    data[field] = request.data[field]
                # Si le champ n'est pas présent, on conserve le fichier existant
        
        # 🔥 IMPORTANT: Pour PATCH, on utilise partial=True
        serializer = CommentUpdateSerializer(
            comment, 
            data=data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Handle mentions update
            mentions = request.data.get('mentions')
            if mentions is not None:
                try:
                    mentions_users = User.objects.filter(id__in=mentions)
                    comment.mentions.set(mentions_users)
                except:
                    pass
            
            comment = serializer.save()
            comment.is_edited = True
            comment.save()
            
            response_serializer = CommentSerializer(comment, context={'request': request})
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    elif request.method == 'DELETE':
        # Check permissions
        if comment.user != request.user and not request.user.is_staff and not request.user == comment.post.user:
            return Response(
                {"error": "You don't have permission to delete this comment."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # If it's a reply, update parent comment reply count
        if comment.parent_comment:
            parent = comment.parent_comment
            parent.reply_count = parent.comment_replies.count() - 1
            parent.save()
        
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([AllowAny])
def comment_replies(request, pk):
    """
    Get all replies for a comment
    """
    comment = get_object_or_404(Comment, id=pk)
    
    queryset = comment.comment_replies.all()
    
    # Hide spam for non-staff users
    if not request.user.is_staff:
        queryset = queryset.filter(is_spam=False)
    
    queryset = queryset.select_related('user').prefetch_related('likes', 'mentions')
    
    # Apply ordering
    order = request.GET.get('order', 'created_at')
    if order == '-created_at':
        queryset = queryset.order_by('-created_at')
    elif order == 'created_at':
        queryset = queryset.order_by('created_at')
    elif order == 'likes':
        queryset = queryset.order_by('-likes_count', '-created_at')
    
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 10))
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_comments = queryset[start:end]
    
    serializer = CommentSerializer(
        paginated_comments, 
        many=True,
        context={'request': request}
    )
    
    return Response({
        'replies': serializer.data,
        'count': queryset.count(),
        'has_next': end < queryset.count(),
        'page': page,
        'per_page': per_page
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_like(request, pk):
    """
    Toggle like on a comment
    """
    comment = get_object_or_404(Comment, id=pk)
    
    if request.user in comment.likes.all():
        comment.likes.remove(request.user)
        comment.likes_count = max(0, comment.likes_count - 1)
        liked = False
        has_liked = False  # <-- IMPORTANT : doit être False quand on dislike
    else:
        comment.likes.add(request.user)
        comment.likes_count += 1
        liked = True
        has_liked = True  # <-- True quand on like
    
    comment.save()
    
    return Response({
        'liked': liked,
        'likes_count': comment.likes_count,
        'has_liked': has_liked  # <-- Utiliser la variable correcte
    })
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_pin(request, pk):
    """
    Pin or unpin a comment
    """
    comment = get_object_or_404(Comment, id=pk)
    
    # Check permissions
    if not (request.user == comment.post.user or request.user.is_staff):
        return Response(
            {"error": "You don't have permission to pin this comment."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    comment.is_pinned = not comment.is_pinned
    comment.save()
    
    serializer = CommentSerializer(comment, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_hide(request, pk):
    """
    Hide or unhide a comment
    """
    comment = get_object_or_404(Comment, id=pk)
    
    # Check permissions
    if not (request.user == comment.user or request.user == comment.post.author or request.user.is_staff):
        return Response(
            {"error": "You don't have permission to hide this comment."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    comment.is_hidden = not comment.is_hidden
    comment.save()
    
    serializer = CommentSerializer(comment, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_report(request, pk):
    """
    Report a comment as spam/inappropriate
    """
    comment = get_object_or_404(Comment, id=pk)
    
    # Mark as spam (in real app, you'd want a separate Report model)
    comment.is_spam = True
    comment.save()
    
    # Optional: Send notification to moderators
    # notify_moderators(comment, request.user)
    
    return Response({
        "message": "Comment reported successfully. Moderators will review it."
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_comment_delete(request):
    """
    Delete multiple comments
    """
    comment_ids = request.data.get('comment_ids', [])
    
    if not comment_ids:
        return Response(
            {"error": "No comment IDs provided."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Filter comments that user can delete
    comments = Comment.objects.filter(
        id__in=comment_ids
    ).filter(
        Q(user=request.user) | 
        Q(post__author=request.user) | 
        Q(post__user=request.user)
    )
    
    count = comments.count()
    
    # Update parent comment reply counts
    for comment in comments.filter(parent_comment__isnull=False):
        parent = comment.parent_comment
        parent.reply_count = parent.comment_replies.exclude(id=comment.id).count()
        parent.save()
    
    comments.delete()
    
    return Response({
        "message": f"Successfully deleted {count} comments."
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def user_comments(request, user_id):
    """
    Get all comments by a specific user
    """
    user = get_object_or_404(User, id=user_id)
    
    queryset = Comment.objects.filter(user=user, is_hidden=False)
    
    # Hide spam for non-staff users
    if not request.user.is_staff:
        queryset = queryset.filter(is_spam=False)
    
    # Apply filters
    post_id = request.GET.get('post_id')
    if post_id:
        queryset = queryset.filter(post_id=post_id)
    
    parent_only = request.GET.get('parent_only')
    if parent_only == 'true':
        queryset = queryset.filter(parent_comment__isnull=True)
    
    # Apply ordering
    order = request.GET.get('order', '-created_at')
    if order in ['created_at', '-created_at', 'likes_count', '-likes_count']:
        queryset = queryset.order_by(order)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 20))
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_comments = queryset.select_related('user', 'post').prefetch_related('likes', 'mentions')[start:end]
    
    serializer = CommentSerializer(
        paginated_comments, 
        many=True,
        context={'request': request}
    )
    
    return Response({
        'comments': serializer.data,
        'count': queryset.count(),
        'has_next': end < queryset.count(),
        'page': page,
        'per_page': per_page
    })

# comments/views.py (partie ajoutée)
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def comment_replies_list_create(request, comment_id):
    """
    Liste toutes les réponses d'un commentaire ou crée une nouvelle réponse
    GET: Retourne les réponses paginées
    POST: Crée une nouvelle réponse à ce commentaire
    """
    # Récupérer le commentaire parent
    parent_comment = get_object_or_404(
        Comment.objects.select_related('user', 'post'),
        id=comment_id
    )
    
    if request.method == 'GET':
        # Filtrage des réponses
        queryset = parent_comment.comment_replies.filter(
            is_hidden=False
        )
        
        # Cacher le spam pour les non-staff
        if not request.user.is_staff:
            queryset = queryset.filter(is_spam=False)
        
        queryset = queryset.select_related('user').prefetch_related('likes', 'mentions')
        
        # Tri
        order = request.GET.get('order', 'created_at')
        if order == '-created_at':
            queryset = queryset.order_by('-created_at')
        elif order == 'created_at':
            queryset = queryset.order_by('created_at')
        elif order == 'likes':
            queryset = queryset.order_by('-likes_count', '-created_at')
        
        # Pagination
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        start = (page - 1) * per_page
        end = start + per_page
        
        paginated_comments = queryset[start:end]
        
        serializer = CommentSerializer(
            paginated_comments, 
            many=True,
            context={'request': request, 'include_replies': False}
        )
        
        return Response({
            'parent_comment': {
                'id': parent_comment.id,
                'content': parent_comment.content[:100] + '...' if len(parent_comment.content) > 100 else parent_comment.content,
                'user': {
                    'id': parent_comment.user.id,
                    'username': parent_comment.user.username
                }
            },
            'replies': serializer.data,
            'count': queryset.count(),
            'has_next': end < queryset.count(),
            'page': page,
            'per_page': per_page,
            'total_pages': (queryset.count() + per_page - 1) // per_page
        })
    
    elif request.method == 'POST':
        # Vérifier si l'utilisateur est authentifié pour poster
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required to post a reply."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Vérifier que le commentaire parent n'est pas caché ou spam
        if parent_comment.is_hidden and not request.user.is_staff:
            return Response(
                {"error": "Cannot reply to a hidden comment."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Préparer les données
        data = request.data.copy()
        data['post'] = parent_comment.post.id
        data['parent_comment'] = comment_id
        
        # Gérer les médias
        if 'image' in request.FILES:
            data['image'] = request.FILES['image']
        if 'video' in request.FILES:
            data['video'] = request.FILES['video']
        if 'file' in request.FILES:
            data['file'] = request.FILES['file']
        
        serializer = CommentCreateSerializer(
            data=data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Sauvegarder la réponse
            reply = serializer.save(
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                depth=parent_comment.depth + 1 if parent_comment.depth else 1
            )
            
            # Gérer les mentions
            mentions = request.data.get('mentions', [])
            if mentions:
                try:
                    mentions_users = User.objects.filter(id__in=mentions)
                    reply.mentions.set(mentions_users)
                    
                    # Notifier les utilisateurs mentionnés (à implémenter)
                    # notify_mentioned_users(reply, mentions_users)
                except Exception as e:
                    print(f"Error setting mentions: {e}")
            
            # Mettre à jour le compteur de réponses du parent
            parent_comment.reply_count = parent_comment.comment_replies.count()
            parent_comment.save()
            
            # Mettre à jour le compteur de réponses du post si nécessaire
            if hasattr(parent_comment.post, 'comment_count'):
                parent_comment.post.comment_count = Comment.objects.filter(
                    post=parent_comment.post
                ).count()
                parent_comment.post.save()
            
            # Sérialiser la réponse pour la réponse
            response_serializer = CommentSerializer(
                reply, 
                context={'request': request}
            )
            
            # Envoyer une notification au propriétaire du commentaire parent
            if parent_comment.user != request.user:
                # À implémenter: notification système
                # send_reply_notification(parent_comment.user, reply)
                pass
            
            return Response({
                'message': 'Reply created successfully',
                'reply': response_serializer.data,
                'parent_comment_updated': {
                    'id': parent_comment.id,
                    'reply_count': parent_comment.reply_count
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
# views.py - Correction de la vue user_list
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    users = User.objects.all().order_by('username')
    
    # Exclure l'utilisateur courant si le paramètre est présent
    exclude_self = request.GET.get('exclude_self', 'false').lower() == 'true'
    if exclude_self:
        users = users.exclude(id=request.user.id)
    
    # Limiter les résultats
    limit = int(request.GET.get('limit', 50))
    users = users[:limit]
    
    data = [
        {
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'profile_picture': user.profile.image.url if hasattr(user, 'profile') and user.profile.image else None
        }
        for user in users
    ]
    
    return Response({'users': data})



# Dans votre Django views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_by_username(request, username):
    try:
        user = User.objects.get(username=username)
        
        # Vérifier si le profil existe
        try:
            profile = user.profile
            data = {
                'id': profile.id,
                'username': user.username,
                'full_name': user.get_full_name(),
                'profile_picture': request.build_absolute_uri(profile.image.url) if profile.image else None
            }
        except Profile.DoesNotExist:
            data = {
                'id': user.id,
                'username': user.username,
                'full_name': user.get_full_name(),
                'profile_picture': None
            }
        
        return Response(data)
        
    except User.DoesNotExist:
        return Response(
            {'error': f'User with username {username} not found'},
            status=404
        )