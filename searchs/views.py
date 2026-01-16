# searchs/views.py
from django.db.models import Q, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging
from django.conf import settings

# Importez depuis vos autres apps
from app.serializers import ProfileSerializer
from post.serializers import PostSerializer,PostListSerializer,TagSerializer,CategorySerializer
from messaging.serializers import ConversationSerializer
from app.models import Profile
from post.models import Post, Category, Tag
from messaging.models import Conversation
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_general(request):
    """
    Recherche générale optimisée avec vos serializers spécifiques
    """
    try:
        search_query = request.GET.get('q', '').strip()
        
        if not search_query:
            return Response({
                'profiles': [],
                'posts': [],
                'groups': [],
                'categories': [],
                'tags': [],
                'count': 0,
                'query': ''
            })
        
        logger.info(f"Recherche : '{search_query}' par {request.user.username}")
        
        # Contexte pour les serializers
        context = {'request': request}
        
        results = {
            'profiles': [],
            'posts': [],
            'groups': [],
            'categories': [],
            'tags': [],
            'count': 0,
            'query': search_query
        }
        
        # 1. RECHERCHE DANS PROFILES (avec vos champs spécifiques)
        try:
            profile_filters = Q()
            
            # Recherche via la relation User (comme dans votre serializer)
            profile_filters |= Q(user__username__icontains=search_query)
            profile_filters |= Q(user__first_name__icontains=search_query)
            profile_filters |= Q(user__last_name__icontains=search_query)
            profile_filters |= Q(user__email__icontains=search_query)
            
            # Recherche dans les champs directs de Profile
            if hasattr(Profile, 'bio'):
                profile_filters |= Q(bio__icontains=search_query)
            
            if hasattr(Profile, 'location'):
                profile_filters |= Q(location__icontains=search_query)
            
            if hasattr(Profile, 'city'):
                profile_filters |= Q(city__icontains=search_query)
            
            if hasattr(Profile, 'country'):
                profile_filters |= Q(country__icontains=search_query)
            
            if hasattr(Profile, 'website'):
                profile_filters |= Q(website__icontains=search_query)
            
            if hasattr(Profile, 'address'):
                profile_filters |= Q(address__icontains=search_query)
            
            # Filtrer les profils actifs
            profile_filters &= Q(user__is_active=True)
            
            profile_results = Profile.objects.filter(profile_filters).distinct()
            
            # Utiliser votre ProfileSerializer qui inclut user.username, etc.
            results['profiles'] = ProfileSerializer(
                profile_results, 
                many=True, 
                context=context
            ).data
            
            logger.info(f"Profils trouvés : {len(profile_results)}")
            
        except Exception as e:
            logger.error(f"Erreur recherche profils : {str(e)}", exc_info=True)
            results['profiles'] = []
        
        # 2. RECHERCHE DANS POSTS - VERSION OPTIMISÉE POUR POSTCARD
        try:
            post_filters = Q()
            
            # Champs principaux
            post_filters |= Q(title__icontains=search_query)
            post_filters |= Q(content__icontains=search_query)
            
            # Catégorie
            post_filters |= Q(category__name__icontains=search_query)
            
            # Tags (ManyToMany)
            post_filters |= Q(tags__name__icontains=search_query)
            
            # Mentions (ManyToMany vers User)
            post_filters |= Q(
                Q(mentions__username__icontains=search_query) |
                Q(mentions__first_name__icontains=search_query) |
                Q(mentions__last_name__icontains=search_query)
            )
            
            # Auteur
            post_filters |= Q(user__username__icontains=search_query)
            post_filters |= Q(user__first_name__icontains=search_query)
            post_filters |= Q(user__last_name__icontains=search_query)
            
            # Appliquer les filtres
            posts_results = Post.objects.filter(post_filters).distinct()
            
            # Annoter avec le nombre de commentaires
            posts_results = posts_results.annotate(
                comments_count=Count('post_comments')
            )
            
            # Options de tri
            sort_by = request.GET.get('sort', 'recent')
            if sort_by == 'recent':
                posts_results = posts_results.order_by('-created_at')
            elif sort_by == 'popular':
                posts_results = posts_results.order_by('-comments_count', '-created_at')
            elif sort_by == 'rating':
                posts_results = posts_results.order_by('-average_rating', '-created_at')
            elif sort_by == 'title':
                posts_results = posts_results.order_by('title')
            
            # IMPORTANT: OPTIMISATION POUR POSTCARD - Précharger tous les médias nécessaires
            from django.db.models import Prefetch
            
            # Préchargement optimisé
            posts_results = posts_results.select_related(
                'user',        # Pour user_name
                'category'     # Pour category details
            )
            
            # Préchargement des images
            posts_results = posts_results.prefetch_related(
                'tags',
                'mentions',
                'post_images',  # Pour les images du slider
                'post_files',   # Pour les fichiers (vidéos, audio, documents)
            )
            
            # Pour optimiser les performances des médias
            from post.models import PostImage, PostFile
            
            # Préchargement optimisé des PostImage avec tri
            posts_results = posts_results.prefetch_related(
                Prefetch('post_images', 
                        queryset=PostImage.objects.all().order_by('order'),
                        to_attr='prefetched_post_images')
            )
            
            # Préchargement optimisé des PostFile
            posts_results = posts_results.prefetch_related(
                Prefetch('post_files', 
                        queryset=PostFile.objects.all(),
                        to_attr='prefetched_post_files')
            )
            
            # Limiter pour performance
            limit = int(request.GET.get('limit', 50))
            posts_results = posts_results[:limit]
            
            # Créer le contexte pour le serializer
            post_context = {'request': request}
            
            # Utiliser PostListSerializer (plus léger pour les listes)
            try:
                from post.serializers import PostListSerializer
                post_serializer = PostListSerializer(
                    posts_results, 
                    many=True, 
                    context=post_context
                )
            except ImportError:
                # Fallback vers PostSerializer
                logger.warning("PostListSerializer non trouvé, utilisation de PostSerializer")
                post_serializer = PostSerializer(
                    posts_results, 
                    many=True, 
                    context=post_context
                )
            
            posts_data = post_serializer.data
            
            # FORMATAGE SPÉCIAL POUR POSTCARD
            # Votre PostCard a besoin des champs spécifiques:
            # - post_images (array d'images)
            # - post_files (array de fichiers)
            # - user_profile_image (URL)
            # - category_name (string)
            # - comments_count (int)
            # - etc.
            
            for i, post_data in enumerate(posts_data):
                post_instance = posts_results[i]
                
                # 1. S'assurer que post_images est bien formaté
                if 'post_images' in post_data and post_data['post_images']:
                    # Le serializer devrait déjà retourner ceci correctement
                    pass
                elif hasattr(post_instance, 'prefetched_post_images'):
                    # Format manuel si nécessaire
                    images_data = []
                    for img in post_instance.prefetched_post_images:
                        if img.image:
                            image_data = {
                                'id': img.id,
                                'image': img.image.url if img.image else None,
                                'image_url': request.build_absolute_uri(img.image.url) if request and img.image else None,
                                'uploaded_at': img.uploaded_at,
                                'order': img.order or 0
                            }
                            images_data.append(image_data)
                    post_data['post_images'] = images_data
                
                # 2. S'assurer que post_files est bien formaté
                if 'post_files' in post_data and post_data['post_files']:
                    # Le serializer devrait déjà retourner ceci correctement
                    pass
                elif hasattr(post_instance, 'prefetched_post_files'):
                    # Format manuel si nécessaire
                    files_data = []
                    for file in post_instance.prefetched_post_files:
                        if file.file:
                            file_data = {
                                'id': file.id,
                                'file': file.file.url if file.file else None,
                                'file_url': request.build_absolute_uri(file.file.url) if request and file.file else None,
                                'name': file.name or '',
                                'file_type': file.file_type or 'other',
                                'file_type_display': file.get_file_type_display() if hasattr(file, 'get_file_type_display') else file.file_type or 'File',
                                'created_at': file.created_at
                            }
                            files_data.append(file_data)
                    post_data['post_files'] = files_data
                
                # 3. Ajouter les champs nécessaires pour PostCard
                if 'user_profile_image' not in post_data or not post_data['user_profile_image']:
                    # Récupérer l'image de profil de l'utilisateur
                    if hasattr(post_instance.user, 'profile') and post_instance.user.profile.image:
                        post_data['user_profile_image'] = request.build_absolute_uri(
                            post_instance.user.profile.image.url
                        ) if request else post_instance.user.profile.image.url
                
                # 4. S'assurer que category_name existe
                if 'category_name' not in post_data and post_instance.category:
                    post_data['category_name'] = post_instance.category.name
                
                # 5. S'assurer que category_details existe (pour l'icône)
                if 'category_details' not in post_data and post_instance.category:
                    post_data['category_details'] = {
                        'id': post_instance.category.id,
                        'name': post_instance.category.name,
                        'image_url': request.build_absolute_uri(
                            post_instance.category.image.url
                        ) if request and post_instance.category.image else None
                    }
                
                # 6. S'assurer que comments_count existe
                if 'comments_count' not in post_data:
                    post_data['comments_count'] = post_instance.comments_count if hasattr(post_instance, 'comments_count') else 0
            
            results['posts'] = posts_data
            
            logger.info(f"Posts trouvés : {len(posts_results)} (avec médias formatés pour PostCard)")
            
        except Exception as e:
            logger.error(f"Erreur recherche posts : {str(e)}", exc_info=True)
            results['posts'] = []
        
        # 3. RECHERCHE DANS GROUPS (CONVERSATIONS)
        try:
            groups_filters = Q(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query),
                is_group=True,
                is_visible=True
            )
            
            groups_results = Conversation.objects.filter(groups_filters).distinct()
            
            # Tri
            group_sort = request.GET.get('group_sort', 'recent')
            if group_sort == 'recent':
                groups_results = groups_results.order_by('-created_at')
            elif group_sort == 'name':
                groups_results = groups_results.order_by('name')
            elif group_sort == 'members':
                # Ordonner par nombre de participants
                groups_results = groups_results.annotate(
                    members_count=Count('participants')
                ).order_by('-members_count')
            
            results['groups'] = ConversationSerializer(
                groups_results, 
                many=True, 
                context=context
            ).data
            
            logger.info(f"Groupes trouvés : {len(groups_results)}")
            
        except Exception as e:
            logger.error(f"Erreur recherche groupes : {str(e)}")
            results['groups'] = []
        
        # 4. RECHERCHE DANS CATÉGORIES
        try:
            categories_results = Category.objects.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query),
                is_active=True
            ).distinct()
            
            # Utiliser votre CategorySerializer qui inclut image_url, etc.
            results['categories'] = CategorySerializer(
                categories_results,
                many=True,
                context=context
            ).data
            
            logger.info(f"Catégories trouvées : {len(categories_results)}")
            
        except Exception as e:
            logger.error(f"Erreur recherche catégories : {str(e)}")
            results['categories'] = []
        
        # 5. RECHERCHE DANS TAGS
        try:
            tags_results = Tag.objects.filter(
                name__icontains=search_query
            ).distinct()
            
            # Utiliser votre TagSerializer
            results['tags'] = TagSerializer(
                tags_results,
                many=True
            ).data
            
            # Ajouter le post_count si nécessaire
            for i, tag_data in enumerate(results['tags']):
                tag_data['post_count'] = tags_results[i].posts.count()
            
            logger.info(f"Tags trouvés : {len(tags_results)}")
            
        except Exception as e:
            logger.error(f"Erreur recherche tags : {str(e)}")
            results['tags'] = []
        
        # CALCUL DU TOTAL
        results['count'] = (
            len(results['profiles']) + 
            len(results['posts']) + 
            len(results['groups']) +
            len(results['categories']) +
            len(results['tags'])
        )
        
        return Response(results)
        
    except Exception as e:
        logger.error(f"Erreur recherche générale : {str(e)}", exc_info=True)
        return Response({
            'error': 'Une erreur est survenue lors de la recherche',
            'details': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users_detailed(request):
    """
    Recherche détaillée d'utilisateurs avec tous les champs du ProfileSerializer
    """
    try:
        search_query = request.GET.get('q', '').strip()
        
        if not search_query:
            return Response([])
        
        # Construire les filtres
        user_filters = Q()
        
        # Recherche dans User
        user_filters |= Q(user__username__icontains=search_query)
        user_filters |= Q(user__first_name__icontains=search_query)
        user_filters |= Q(user__last_name__icontains=search_query)
        user_filters |= Q(user__email__icontains=search_query)
        
        # Recherche dans Profile
        profile_fields = ['bio', 'location', 'city', 'country', 
                         'website', 'address', 'state', 'zip_code']
        
        for field in profile_fields:
            if hasattr(Profile, field):
                kwargs = {f'{field}__icontains': search_query}
                user_filters |= Q(**kwargs)
        
        # Filtrer les utilisateurs actifs
        user_filters &= Q(user__is_active=True)
        
        # Appliquer les filtres
        profiles = Profile.objects.filter(user_filters).distinct()
        
        # Options de tri
        sort_by = request.GET.get('sort', 'username')
        if sort_by == 'username':
            profiles = profiles.order_by('user__username')
        elif sort_by == 'recent':
            profiles = profiles.order_by('-user__date_joined')
        elif sort_by == 'name':
            profiles = profiles.order_by('user__first_name', 'user__last_name')
        
        # Pagination
        limit = int(request.GET.get('limit', 50))
        profiles = profiles[:limit]
        
        # Utiliser votre ProfileSerializer
        serializer = ProfileSerializer(
            profiles, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'users': serializer.data,
            'count': len(serializer.data)
        })
        
    except Exception as e:
        logger.error(f"Erreur recherche utilisateurs : {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_by_type(request, model_type):
    """
    Recherche spécifique par type de modèle
    """
    try:
        search_query = request.GET.get('q', '').strip()
        
        if not search_query:
            return Response([])
        
        model_type = model_type.lower()
        context = {'request': request}
        
        if model_type == 'profiles':
            # Recherche dans Profile
            results = Profile.objects.filter(
                Q(user__username__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(bio__icontains=search_query) |
                Q(location__icontains=search_query) |
                Q(city__icontains=search_query) |
                Q(country__icontains=search_query)
            ).distinct()
            
            serializer = ProfileSerializer(results, many=True, context=context)
            
        elif model_type == 'posts':
            # Recherche dans Posts
            results = Post.objects.filter(
                Q(title__icontains=search_query) |
                Q(content__icontains=search_query) |
                Q(tags__name__icontains=search_query) |
                Q(category__name__icontains=search_query)
            ).distinct().order_by('-created_at')
            
            # Limiter les résultats
            limit = int(request.GET.get('limit', 50))
            results = results[:limit]
            
            serializer = PostSerializer(results, many=True, context=context)
            
        elif model_type == 'groups':
            # Recherche dans Groups
            results = Conversation.objects.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query),
                is_group=True,
                is_visible=True
            ).distinct()
            
            serializer = ConversationSerializer(results, many=True, context=context)
            
        elif model_type == 'categories':
            # Recherche dans Catégories
            results = Category.objects.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query),
                is_active=True
            ).distinct()
            
            # Format simple pour les résultats
            data = []
            for category in results:
                category_data = {
                    'id': category.id,
                    'name': category.name,
                    'description': category.description,
                    'post_count': category.post_categorie.count(),
                }
                
                if category.image:
                    category_data['image_url'] = request.build_absolute_uri(category.image.url) if request else category.image.url
                
                if category.parent:
                    category_data['parent'] = {
                        'id': category.parent.id,
                        'name': category.parent.name
                    }
                
                data.append(category_data)
            
            return Response(data)
            
        elif model_type == 'tags':
            # Recherche dans Tags
            results = Tag.objects.filter(
                name__icontains=search_query
            ).distinct()
            
            # Format simple pour les résultats
            data = []
            for tag in results:
                data.append({
                    'id': tag.id,
                    'name': tag.name,
                    'post_count': tag.posts.count()
                })
            
            return Response(data)
        
        else:
            return Response({'error': 'Type de modèle non supporté'}, status=400)
        
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Erreur dans search_by_type: {str(e)}")
        return Response({
            'error': 'Erreur lors de la recherche',
            'details': str(e) if settings.DEBUG else None
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_suggestions(request):
    """
    Suggestions de recherche optimisées avec groupes et sérialiseurs
    """
    try:
        search_query = request.GET.get('q', '').strip()
        
        if len(search_query) < 2:
            return Response({'suggestions': []})
        
        suggestions = []
        context = {'request': request}
        
        # ============ 1. SUGGESTIONS DE PROFILS ============
        try:
            profiles = Profile.objects.filter(
                Q(user__username__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query),
                user__is_active=True
            ).select_related('user').distinct()[:5]
            
            for profile in profiles:
                # Utiliser ProfileSerializer pour plus de cohérence
                profile_data = ProfileSerializer(profile, context=context).data
                
                suggestions.append({
                    'type': 'profile',
                    'id': profile.id,
                    'user_id': profile.user.id,
                    'username': profile.user.username,
                    'first_name': profile.user.first_name,
                    'last_name': profile.user.last_name,
      
                    'bio_preview': (profile.bio[:80] + '...') if profile.bio and len(profile.bio) > 80 else (profile.bio or ''),
                    'image_url': profile.image.url if profile.image else None,
                    'category_name': profile.category.name if profile.category else None,
                    'avatar': profile.image.url if profile.image else None,
                    'profile_picture': profile.image.url if profile.image else None,
                    'name': f"{profile.user.first_name} {profile.user.last_name}".strip() or profile.user.username,
                })
        except Exception as e:
            logger.error(f"Erreur suggestions profils : {str(e)}")
        
        # ============ 2. SUGGESTIONS DE POSTS ============
        try:
            posts = Post.objects.filter(
                Q(title__icontains=search_query) |
                Q(content__icontains=search_query),
                user__is_active=True
            ).select_related('user', 'category').prefetch_related('tags')[:5]
            
            for post in posts:
                # Chercher la première image du post
                post_image_url = None
                if post.post_images.exists():
                    post_image_url = post.post_images.first().image.url
                elif post.media_files.exists():
                    media_file = post.media_files.filter(file_type__in=['image', 'cover']).first()
                    if media_file:
                        post_image_url = media_file.file.url
                post_data = PostSerializer(post, context=context).data
               
                # Chercher l'image de profil de l'auteur
                author_profile_image = None
                try:
                    author_profile = Profile.objects.get(user=post.user)
                    if author_profile.image:
                        author_profile_image = author_profile.image.url
                except Profile.DoesNotExist:
                    pass
                
                suggestions.append({
                    'type': 'post',
                    'id': post.id,
                    'title': post.title,
                    'user_id':post.user.id,
                    'content_preview': (post.content[:100] + '...') if post.content and len(post.content) > 100 else (post.content or ''),
                    'author': post.user.username,
                    'author_name': f"{post.user.first_name} {post.user.last_name}".strip() or post.user.username,
                    'image_url': post_image_url,
                    'user_profile_image': author_profile_image,
                    'created_at': post.created_at.isoformat() if post.created_at else None,
                    'like_count': post.total_ratings or post.average_rating.count(),
                    'comment_count': post.comments_count_annotated if hasattr(post, 'comments_count_annotated') else post.post_comments.count(),
                    'tags': [tag.name for tag in post.tags.all()][:3],
                    'category': post.category.name if post.category else None,
                })
        except Exception as e:
            logger.error(f"Erreur suggestions posts : {str(e)}")
        
        # ============ 3. SUGGESTIONS DE GROUPES ============
        try:
            groups = Conversation.objects.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query),
                is_group=True,
                is_visible=True
            ).distinct()[:5]
            
            for group in groups:
                # Utiliser ConversationSerializer pour plus de cohérence
                group_data = ConversationSerializer(group, context=context).data
                
                # Compter les membres
                member_count = group.participants.count() if hasattr(group, 'participants') else 0
                
                # Chercher l'image du groupe
                group_image_url = None
                if group.group_photo:
                    group_image_url = group.group_photo.url
                elif hasattr(group, 'image') and group.image:
                    group_image_url = group.image.url
                elif hasattr(group, 'cover_image') and group.cover_image:
                    group_image_url = group.cover_image.url
                
                suggestions.append({
                    'type': 'group',
                    'id': group.id,
                    'name': group.name,
                    'title': group.name,  # Pour compatibilité avec l'existant
                    'description': group.description[:120] + '...' if group.description and len(group.description) > 120 else (group.description or ''),
                    'group_photo_url': group_image_url,
                    'image': group_image_url,  # Alias pour compatibilité
                    'cover_image': group_image_url,  # Alias pour compatibilité
                    'member_count': member_count,
                    'members_count': member_count,  # Alias pour compatibilité
                    'privacy': group.privacy if hasattr(group, 'privacy') else 'public',
                    'category_name': group.category.name if hasattr(group, 'category') and group.category else None,
                    'created_at': group.created_at.isoformat() if group.created_at else None,
                    'is_private': group.privacy == 'private' if hasattr(group, 'privacy') else False,
                })
        except Exception as e:
            logger.error(f"Erreur suggestions groupes : {str(e)}")
            # Fallback: créer une suggestion de test pour déboguer
            if settings.DEBUG:
                suggestions.append({
                    'type': 'group',
                    'id': 'test-1',
                    'name': f'Groupe "{search_query}"',
                    'description': f'Description du groupe contenant "{search_query}"',
                    'member_count': 42,
                    'privacy': 'public',
                    'category_name': 'Test'
                })
        
        # ============ 4. SUGGESTIONS DE CATÉGORIES ============
        try:
            categories = Category.objects.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query),
                is_active=True
            ).distinct()[:5]
            
            for category in categories:
                suggestions.append({
                    'type': 'category',
                    'id': category.id,
                    'name': category.name,
                    'title': category.name,  # Pour compatibilité
                    'description': category.description[:100] if category.description else '',
                    'post_count': category.post_categorie.count(),
                    'image_url': category.image.url if category.image else None,
                    'parent_name': category.parent.name if category.parent else None,
                })
        except Exception as e:
            logger.error(f"Erreur suggestions catégories : {str(e)}")
        
        # ============ 5. SUGGESTIONS DE TAGS ============
        try:
            tags = Tag.objects.filter(
                name__icontains=search_query
            ).distinct()[:5]
            
            for tag in tags:
                suggestions.append({
                    'type': 'tag',
                    'id': tag.id,
                    'name': tag.name,
                    'title': tag.name,  # Pour compatibilité
                    'post_count': tag.posts.count(),
                    'description': f'Tag "{tag.name}" utilisé dans {tag.posts.count()} posts',
                })
        except Exception as e:
            logger.error(f"Erreur suggestions tags : {str(e)}")
        
        # ============ TRI ET LIMITE FINALE ============
        # Limiter le nombre total de suggestions
        suggestions = suggestions[:15]
        
        # Ajouter un score de pertinence pour le tri
        for suggestion in suggestions:
            suggestion['relevance_score'] = calculate_relevance_score(suggestion, search_query)
        
        # Trier par score de pertinence
        suggestions.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        
        # Nettoyer le score avant de retourner
        for suggestion in suggestions:
            if 'relevance_score' in suggestion:
                del suggestion['relevance_score']
        
        logger.info(f"🔍 Suggestions trouvées : {len(suggestions)} pour '{search_query}'")
        
        return Response({'suggestions': suggestions})
        
    except Exception as e:
        logger.error(f"Erreur générale suggestions : {str(e)}", exc_info=True)
        return Response({'suggestions': []})


def calculate_relevance_score(suggestion, search_query):
    """
    Calcule un score de pertinence pour une suggestion
    """
    score = 0
    search_lower = search_query.lower()
    
    # Score selon le type
    type_scores = {
        'profile': 100,
        'group': 90,
        'post': 80,
        'category': 70,
        'tag': 60
    }
    
    score += type_scores.get(suggestion['type'], 50)
    
    # Bonus pour correspondance exacte dans le nom/titre
    name = suggestion.get('name') or suggestion.get('title') or suggestion.get('username') or ''
    if search_lower == name.lower():
        score += 50
    elif search_lower in name.lower():
        score += 30
    
    # Bonus pour correspondance au début
    if name.lower().startswith(search_lower):
        score += 20
    
    # Bonus pour les profils complets
    if suggestion['type'] == 'profile':
        if suggestion.get('first_name') and suggestion.get('last_name'):
            full_name = f"{suggestion['first_name']} {suggestion['last_name']}".lower()
            if search_lower in full_name:
                score += 40
    
    # Bonus pour les groupes populaires
    if suggestion['type'] == 'group':
        member_count = suggestion.get('member_count', 0) or suggestion.get('members_count', 0)
        if member_count > 100:
            score += 10
        elif member_count > 50:
            score += 5
    
    # Bonus pour les posts récents
    if suggestion['type'] == 'post':
        if suggestion.get('created_at'):
            from datetime import datetime, timedelta
            try:
                created_at = datetime.fromisoformat(suggestion['created_at'].replace('Z', '+00:00'))
                if datetime.now() - created_at < timedelta(days=7):
                    score += 15
                elif datetime.now() - created_at < timedelta(days=30):
                    score += 5
            except:
                pass
    
    return score

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_filters(request):
    """
    Retourne les filtres disponibles pour la recherche
    """
    try:
        # Catégories disponibles avec count
        categories = Category.objects.filter(is_active=True).annotate(
            post_count=Count('post_categorie')
        ).order_by('name').values('id', 'name', 'post_count')
        
        # Tags populaires
        popular_tags = Tag.objects.annotate(
            post_count=Count('posts')
        ).order_by('-post_count')[:20].values('id', 'name', 'post_count')
        
        # Options de tri pour profiles
        profile_sort_options = [
            {'value': 'username', 'label': 'Nom d\'utilisateur (A-Z)'},
            {'value': '-username', 'label': 'Nom d\'utilisateur (Z-A)'},
            {'value': 'recent', 'label': 'Inscription récente'},
            {'value': 'name', 'label': 'Nom complet (A-Z)'},
        ]
        
        # Options de tri pour posts
        post_sort_options = [
            {'value': '-created_at', 'label': 'Plus récents'},
            {'value': 'created_at', 'label': 'Plus anciens'},
            {'value': '-average_rating', 'label': 'Meilleures notes'},
            {'value': 'title', 'label': 'Titre (A-Z)'},
            {'value': '-title', 'label': 'Titre (Z-A)'},
        ]
        
        # Filtres booléens
        boolean_filters = [
            {'value': 'true', 'label': 'Avec image'},
            {'value': 'false', 'label': 'Sans image'},
        ]
        
        return Response({
            'categories': list(categories),
            'popular_tags': list(popular_tags),
            'profile_sort_options': profile_sort_options,
            'post_sort_options': post_sort_options,
            'boolean_filters': boolean_filters,
        })
        
    except Exception as e:
        logger.error(f"Erreur récupération filtres : {str(e)}")
        return Response({
            'categories': [],
            'popular_tags': [],
            'profile_sort_options': [],
            'post_sort_options': [],
            'boolean_filters': [],
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_posts_advanced(request):
    """
    Recherche avancée dans les posts avec filtres spécifiques
    """
    try:
        search_query = request.GET.get('q', '').strip()
        
        # Construire les filtres
        filters = Q()
        
        if search_query:
            filters &= (
                Q(title__icontains=search_query) |
                Q(content__icontains=search_query) |
                Q(tags__name__icontains=search_query) |
                Q(category__name__icontains=search_query)
            )
        
        # Filtres additionnels
        category_id = request.GET.get('category_id')
        if category_id:
            filters &= Q(category_id=category_id)
        
        user_id = request.GET.get('user_id')
        if user_id:
            filters &= Q(user_id=user_id)
        
        has_images = request.GET.get('has_images')
        if has_images == 'true':
            filters &= Q(post_images__isnull=False)
        elif has_images == 'false':
            filters &= Q(post_images__isnull=True)
        
        min_rating = request.GET.get('min_rating')
        if min_rating:
            try:
                filters &= Q(average_rating__gte=float(min_rating))
            except ValueError:
                pass
        
        # Date range
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        if date_from:
            filters &= Q(created_at__date__gte=date_from)
        if date_to:
            filters &= Q(created_at__date__lte=date_to)
        
        # Appliquer les filtres
        posts = Post.objects.filter(filters).distinct()
        
        # Tri
        sort_by = request.GET.get('sort_by', '-created_at')
        valid_sorts = ['-created_at', 'created_at', '-average_rating', 
                      '-total_ratings', '-title', 'title']
        
        if sort_by in valid_sorts:
            posts = posts.order_by(sort_by)
        else:
            posts = posts.order_by('-created_at')
        
        # Pagination
        from rest_framework.pagination import PageNumberPagination
        
        class SearchPagination(PageNumberPagination):
            page_size = 20
            page_size_query_param = 'page_size'
            max_page_size = 100
        
        paginator = SearchPagination()
        page = paginator.paginate_queryset(posts, request)
        
        if page is not None:
            serializer = PostSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Advanced posts search error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
