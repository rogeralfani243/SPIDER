from django.shortcuts import render
# rest framework module 
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view , permission_classes

# Model 
from .models import Post, Category, Tag, PostImage, PostFile, PostView
from feedback_post.models import Rating
from comment_post.models import Comment

# django.contrib.auth 
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model  
from django.db.models import Avg, Count

# Importez vos serializers mis à jour
from .serializers import PostSerializer,PostUpdateSerializer, PostCreateSerializer, PostDetailSerializer,PostListSerializer, RatingSerializer
import os 
# ✅ TOUJOURS utiliser get_user_model()
User = get_user_model()
from rest_framework import status, permissions
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.conf import settings
from .serializers import  CategorySerializer,CategoryCreateUpdateSerializer,CategoryListSerializer, TagSerializer
from django.core.files.storage import default_storage
# Permission personnalisée
def is_owner_or_read_only(request, post):
    """Vérifie si l'utilisateur est propriétaire du post"""
    if request.method in permissions.SAFE_METHODS:
        return True
    return post.user == request.user

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def post_list_create(request):
    """
    Liste tous les posts ou crée un nouveau post
    Avec algorithme de recommandation personnalisé
    """
    if request.method == 'GET':
        # Récupération et filtrage des posts
        queryset = Post.objects.filter(user__is_active=True)
        from django.db.models import Count, Avg, Q, F, ExpressionWrapper, FloatField, Case, When, Value
        from django.db.models.functions import Coalesce
        from django.utils import timezone
        
        # Annoter avec le compte des commentaires
        queryset = queryset.annotate(
            comments_count_annotated=Count('post_comments', distinct=True)
        )
        
        # Filtrage par catégorie
        category = request.query_params.get('category', None)
        if category and category != '':
            try:
                category_id = int(category)
                queryset = queryset.filter(category_id=category_id)
            except ValueError:
                queryset = queryset.filter(category__name__icontains=category)
        
        # Filtrage par tag
        tag = request.query_params.get('tag', None)
        if tag and tag != '':
            queryset = queryset.filter(tags__name=tag)
        
        # Filtrage par recherche
        search = request.query_params.get('search', None)
        if search and search != '':
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        # Filtrage par utilisateur
        user = request.query_params.get('user', None)
        if user and user != '':
            queryset = queryset.filter(user__username=user)
        
        # LOGIQUE AVANCÉE D'ALGORITHME DE RECOMMANDATION
        algorithm = request.query_params.get('algorithm', 'recommended')
        
        # Score de recommandation personnalisé (si utilisateur authentifié)
        if request.user.is_authenticated and algorithm != 'newest':
            user_profile = request.user.profile
            
            # 1. Score de similarité avec le pays de l'utilisateur
            country_score = Case(
                When(user__profile__country=user_profile.country, then=Value(50.0)),
                default=Value(0.0),
                output_field=FloatField()
            )
            
            # 2. Score d'interaction de l'utilisateur
            # Posts déjà vus (basés sur PostView)
            viewed_posts = PostView.objects.filter(user=request.user).values_list('post_id', flat=True)
            
            # Posts notés par l'utilisateur
            user_ratings = Rating.objects.filter(user=request.user).values('post_id', 'stars')
            user_rated_posts = {}
            for rating in user_ratings:
                user_rated_posts[rating['post_id']] = rating['stars']
            
            # Posts commentés par l'utilisateur
            commented_posts = Comment.objects.filter(
                user=request.user
            ).values_list('post_id', flat=True).distinct()
            
            # Posts likés par l'utilisateur
            liked_posts = Post.objects.filter(
                likes=request.user
            ).values_list('id', flat=True)
            
            # 3. Calculer les préférences de l'utilisateur
            # Catégories préférées (basées sur les likes/ratings)
            user_category_prefs = {}
            user_rated_categories = Rating.objects.filter(
                user=request.user
            ).values('post__category__id').annotate(
                avg_rating=Avg('stars')
            )
            
            for pref in user_rated_categories:
                if pref['post__category__id']:
                    user_category_prefs[pref['post__category__id']] = pref['avg_rating'] * 10
            
            # Tags préférés
            user_tag_prefs = {}
            user_tag_interactions = Post.objects.filter(
                Q(likes=request.user) | 
                Q(post_comments__user=request.user) |
                Q(ratings__user=request.user)
            ).values('tags__id', 'tags__name').annotate(
                interaction_count=Count('id')
            )
            
            for pref in user_tag_interactions:
                if pref['tags__id']:
                    user_tag_prefs[pref['tags__id']] = pref['interaction_count']
            
            # 4. Score de similarité de catégorie
            category_similarity_score = Case(
                *[When(category_id=cat_id, then=Value(score)) 
                  for cat_id, score in user_category_prefs.items()],
                default=Value(0.0),
                output_field=FloatField()
            )
            
            # 5. Score de similarité de tags
            tag_similarity_score = Coalesce(
                Avg(
                    Case(
                        *[When(tags__id=tag_id, then=Value(score))
                          for tag_id, score in user_tag_prefs.items()],
                        default=Value(0.0),
                        output_field=FloatField()
                    )
                ),
                Value(0.0),
                output_field=FloatField()
            )
            
            # 6. Score de fraîcheur (les nouveaux posts sont favorisés)
            freshness_score = ExpressionWrapper(
                Value(100.0) / (
                    1.0 + (timezone.now() - F('created_at')).days / 30.0
                ),
                output_field=FloatField()
            )
            
            # 7. Score de popularité globale
            popularity_score = ExpressionWrapper(
                Coalesce(Avg('ratings__stars'), Value(0.0)) * 20.0 +
                Count('likes', distinct=True) * 2.0 +
                Count('post_comments', distinct=True) * 1.0,
                output_field=FloatField()
            )
            
            # 8. Score d'interaction négative (déjà vu/noté)
            interaction_penalty = Case(
                # Forte pénalité pour les posts notés bas
                When(id__in=[pid for pid, stars in user_rated_posts.items() if stars < 3], 
                      then=Value(-100.0)),
                # Pénalité modérée pour les posts déjà vus
                When(id__in=viewed_posts, then=Value(-30.0)),
                # Pénalité légère pour les posts commentés
                When(id__in=commented_posts, then=Value(-10.0)),
                # Petit bonus pour les posts likés
                When(id__in=liked_posts, then=Value(20.0)),
                default=Value(0.0),
                output_field=FloatField()
            )
            
            # 9. Score final de recommandation
            recommendation_score = (
                country_score * 1.5 +  # Priorité pays
                category_similarity_score * 2.0 +  # Catégories préférées
                tag_similarity_score * 1.2 +  # Tags préférés
                freshness_score * 0.8 +  # Fraîcheur
                popularity_score * 1.0 +  # Popularité
                interaction_penalty  # Interactions utilisateur
            )
            
            # Annoter avec tous les scores
            queryset = queryset.annotate(
                country_score=country_score,
                category_similarity=category_similarity_score,
                tag_similarity=tag_similarity_score,
                freshness_score=freshness_score,
                popularity_score=popularity_score,
                interaction_penalty=interaction_penalty,
                recommendation_score=recommendation_score
            )
            
            # Appliquer l'algorithme de tri
            if algorithm == 'recommended':
                # Tri par score de recommandation (posts du pays + préférences + fraîcheur)
                queryset = queryset.order_by('-recommendation_score', '-created_at')
            
            elif algorithm == 'country_priority':
                # Priorité absolue aux posts du même pays
                queryset = queryset.order_by('-country_score', '-created_at')
            
            elif algorithm == 'fresh_for_you':
                # Posts récents mais adaptés aux préférences
                recent_days = 7  # Dernière semaine
                recent_posts = queryset.filter(
                    created_at__gte=timezone.now() - timezone.timedelta(days=recent_days)
                ).annotate(
                    personal_score=category_similarity_score + tag_similarity_score
                ).order_by('-personal_score', '-created_at')
                
                older_posts = queryset.filter(
                    created_at__lt=timezone.now() - timezone.timedelta(days=recent_days)
                ).order_by('-recommendation_score')
                
                # Combiner : récents adaptés d'abord, puis recommandations
                queryset = list(recent_posts) + list(older_posts)
            
            elif algorithm == 'similar_users':
                # Recommandation basée sur les utilisateurs similaires
                similar_users = User.objects.filter(
                    profile__country=user_profile.country
                ).exclude(id=request.user.id)
                
                similar_posts = Post.objects.filter(
                    user__in=similar_users,
                    ratings__stars__gte=4
                ).annotate(
                    similar_users_score=Count('likes') + Count('ratings')
                ).order_by('-similar_users_score', '-created_at')
                
                queryset = similar_posts
                
        else:
            # Pour les utilisateurs non authentifiés ou tri explicite
            sort_by = request.query_params.get('sort', 'newest')
            ordering = request.query_params.get('ordering', None)
            
            if ordering:
                queryset = queryset.order_by(ordering)
            else:
                if sort_by == 'newest':
                    queryset = queryset.order_by('-created_at')
                elif sort_by == 'oldest':
                    queryset = queryset.order_by('created_at')
                elif sort_by == 'popular':
                    queryset = queryset.annotate(
                        rating_count=Count('ratings', distinct=True)
                    ).filter(
                        rating_count__gt=0
                    ).order_by('-rating_count', '-created_at')
                elif sort_by == 'rated':
                    queryset = queryset.annotate(
                        rating_count=Count('ratings', distinct=True),
                        avg_rating=Avg('ratings__stars')
                    ).filter(
                        rating_count__gte=3,
                        avg_rating__isnull=False
                    ).order_by(
                        '-rating_count',
                        '-avg_rating',
                        '-created_at'
                    )
                elif sort_by == 'country_priority' and request.user.is_authenticated:
                    # Tri par pays de l'utilisateur
                    user_country = request.user.profile.country
                    queryset = queryset.annotate(
                        is_same_country=Case(
                            When(user__profile__country=user_country, then=Value(1)),
                            default=Value(0),
                            output_field=FloatField()
                        )
                    ).order_by('-is_same_country', '-created_at')
                else:
                    queryset = queryset.order_by('-created_at')
        
        # Pagination
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
        
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            page = 1
            page_size = 20
        
        total_posts = queryset.count()
        
        start = (page - 1) * page_size
        end = start + page_size
        
        # Pour les querysets combinés (listes)
        if isinstance(queryset, list):
            paginated_queryset = queryset[start:end]
            total_posts = len(queryset)
        else:
            paginated_queryset = queryset[start:end]
        
        # Précharger les relations
        if isinstance(paginated_queryset, list):
            # Pour les listes, précharger manuellement
            from django.db.models import Prefetch
            post_ids = [p.id for p in paginated_queryset]
            optimized_queryset = Post.objects.filter(id__in=post_ids).select_related(
                'category', 'user'
            ).prefetch_related(
                'tags', 'mentions', 'post_images', 'post_files'
            )
            # Préserver l'ordre original
            order_by_field = f"FIELD(id, {','.join(map(str, post_ids))})" if post_ids else '-created_at'
            optimized_queryset = optimized_queryset.extra(
                select={'ordering': order_by_field}
            ) if post_ids else optimized_queryset
            paginated_queryset = optimized_queryset
        else:
            paginated_queryset = paginated_queryset.select_related(
                'category', 'user'
            ).prefetch_related(
                'tags', 'mentions', 'post_images', 'post_files'
            )
        
        from .serializers import PostListSerializer 
        serializer = PostListSerializer(paginated_queryset, many=True, context={'request': request})
        
        # Retourner avec des métadonnées
        response_data = {
            'posts': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_posts': total_posts,
                'total_pages': (total_posts + page_size - 1) // page_size,
                'has_next': end < total_posts,
                'has_previous': page > 1
            },
            'filters': {
                'algorithm': algorithm,
                'category': category,
                'search': search,
                'tag': tag,
                'user': user
            },
            'recommendation_info': {
                'user_country': request.user.profile.country if request.user.is_authenticated else None,
                'algorithm_applied': algorithm
            } if request.user.is_authenticated else {}
        }
        
        return Response(response_data)
    
    elif request.method == 'POST':
        # ... (le reste de votre code POST reste inchangé) ...
        print("=" * 60)
        print("🔍 [POST CREATE] DEBUG START")
        print("🔍 [POST CREATE] User:", request.user.username)
        print("🔍 [POST CREATE] Content-Type:", request.content_type)
        
        from .serializers import PostCreateSerializer
        
        print("🔍 [POST CREATE] POST data (keys):", list(request.POST.keys()))
        for key in request.POST:
            print(f"  {key}: {request.POST[key]}")
        
        print("🔍 [POST CREATE] FILES data (keys):", list(request.FILES.keys()))
        for key in request.FILES:
            files = request.FILES.getlist(key)
            for i, file in enumerate(files):
                print(f"  {key}[{i}]: {file.name} ({file.size} bytes)")
        
        images = request.FILES.getlist('images')
        print(f"🔍 [POST CREATE] Received {len(images)} images with getlist('images')")
        
        if len(images) == 0:
            single_image = request.FILES.get('image')
            if single_image:
                images = [single_image]
                print(f"🔍 [POST CREATE] Single image found: {single_image.name}")
        
        videos = request.FILES.getlist('videos')
        print(f"🔍 [POST CREATE] Received {len(videos)} videos with getlist('videos')")
        
        audio_files = request.FILES.getlist('audio')
        print(f"🔍 [POST CREATE] Received {len(audio_files)} audio files with getlist('audio')")
        
        documents = request.FILES.getlist('documents')
        print(f"🔍 [POST CREATE] Received {len(documents)} documents with getlist('documents')")
        
        data = {}
        for key in request.POST:
            data[key] = request.POST[key]
        
        all_data = {
            **data,
            'images': images,
            'videos': videos,
            'audio': audio_files,
            'documents': documents
        }
        
        total_files = len(images) + len(videos) + len(audio_files) + len(documents)
        print(f"🔍 [POST CREATE] Total files to process: {total_files}")
        
        serializer = PostCreateSerializer(
            data=all_data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            print("✅ [POST CREATE] Serializer is valid")
            print("✅ [POST CREATE] Validated data keys:", list(serializer.validated_data.keys()))
            
            if 'images' in serializer.validated_data:
                print(f"✅ [POST CREATE] Images in validated data: {len(serializer.validated_data['images'])}")
            
            if 'videos' in serializer.validated_data:
                print(f"✅ [POST CREATE] Videos in validated data: {len(serializer.validated_data['videos'])}")
            
            if 'audio' in serializer.validated_data:
                print(f"✅ [POST CREATE] Audio files in validated data: {len(serializer.validated_data['audio'])}")
            
            if 'documents' in serializer.validated_data:
                print(f"✅ [POST CREATE] Documents in validated data: {len(serializer.validated_data['documents'])}")
            
            try:
                post = serializer.save()
                print(f"✅ [POST CREATE] Post created successfully!")
                print(f"  - ID: {post.id}")
                print(f"  - Title: {post.title}")
                print(f"  - Category: {post.category.id if post.category else 'None'}")
                print(f"  - Main Image: {'Yes' if post.image else 'No'}")
                
                from .models import PostImage, PostFile
                post_images_count = PostImage.objects.filter(post=post).count()
                print(f"  - Post Images count: {post_images_count}")
                
                post_files_count = PostFile.objects.filter(post=post).count()
                print(f"  - Post Files count: {post_files_count}")
                
                if post_files_count > 0:
                    file_types = PostFile.objects.filter(post=post).values_list('file_type', flat=True)
                    print(f"  - File types: {list(set(file_types))}")
                
                from .serializers import PostSerializer
                return_serializer = PostSerializer(post, context={'request': request})
                return Response(return_serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                print(f"💥 [POST CREATE] Error saving post: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response(
                    {'error': f'Erreur lors de la création: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            print("❌ [POST CREATE] Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def post_detail_update_delete(request, pk):
    """
    Récupère, met à jour ou supprime un post spécifique
    """
    post = get_object_or_404(Post, pk=pk)
    
    # Vérification des permissions
    if not is_owner_or_read_only(request, post):
        return Response(
            {'error': 'Vous n\'avez pas la permission de modifier ce post'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Déterminer si c'est un update partiel
        partial = request.method == 'PATCH'
        
        print("=" * 60)
        print("🔍 [POST UPDATE] DEBUG START")
        print("🔍 [POST UPDATE] Method:", request.method)
        print("🔍 [POST UPDATE] Content-Type:", request.content_type)
        print("🔍 [POST UPDATE] User:", request.user.username)
        
        # IMPORTANT: Pour les updates avec fichiers, utiliser PostUpdateSerializer
        # Créer une copie des données POST (form-data)
        data = {}
        
        # Extraire les données texte de request.POST (form-data)
        for key in request.POST:
            data[key] = request.POST[key]
            print(f"🔍 [POST UPDATE] POST data {key}: {request.POST[key]}")
        
        # Préparer les fichiers
        files_data = {}
        
        # Récupérer toutes les images
        images = request.FILES.getlist('images')
        print(f"🔍 [POST UPDATE] Received {len(images)} images with getlist('images')")
        
        # Image principale
        main_image = request.FILES.get('image')
        if main_image:
            print(f"🔍 [POST UPDATE] Main image: {main_image.name}")
            files_data['image'] = main_image
        
        # Récupérer les autres fichiers
        files_data['images'] = images if images else []
        files_data['videos'] = request.FILES.getlist('videos')
        files_data['audio'] = request.FILES.getlist('audio')
        files_data['documents'] = request.FILES.getlist('documents')
        
        print(f"🔍 [POST UPDATE] Videos: {len(files_data['videos'])}")
        print(f"🔍 [POST UPDATE] Audio: {len(files_data['audio'])}")
        print(f"🔍 [POST UPDATE] Documents: {len(files_data['documents'])}")
        
        # Récupérer les IDs à supprimer
        delete_images = request.POST.getlist('delete_images') if 'delete_images' in request.POST else []
        delete_files = request.POST.getlist('delete_files') if 'delete_files' in request.POST else []
        
        if delete_images:
            print(f"🔍 [POST UPDATE] Images to delete: {delete_images}")
            data['delete_images'] = delete_images
        
        if delete_files:
            print(f"🔍 [POST UPDATE] Files to delete: {delete_files}")
            data['delete_files'] = delete_files
        
        # Combiner les données texte et fichiers
        all_data = {**data, **files_data}
        
        # IMPORTANT: Convertir les valeurs texte si nécessaire
        # Django QueryDict retourne tout en string, on doit convertir
        if 'category_id' in all_data and all_data['category_id']:
            try:
                all_data['category_id'] = int(all_data['category_id'])
            except (ValueError, TypeError):
                pass
        
        # Utiliser PostUpdateSerializer pour gérer form-data
        from .serializers import PostUpdateSerializer
        
        serializer = PostUpdateSerializer(
            post, 
            data=all_data, 
            partial=partial, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            print("✅ [POST UPDATE] Serializer is valid")
            print("✅ [POST UPDATE] Validated data:", serializer.validated_data)
            
            try:
                updated_post = serializer.save()
                print(f"✅ [POST UPDATE] Post updated successfully! ID: {updated_post.id}")
                
                # Retourner le post mis à jour avec le serializer complet
                return_serializer = PostSerializer(updated_post, context={'request': request})
                return Response(return_serializer.data, status=status.HTTP_200_OK)
                
            except Exception as e:
                print(f"💥 [POST UPDATE] Error updating post: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response(
                    {'error': f'Erreur lors de la mise à jour: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            print("❌ [POST UPDATE] Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        post.delete()
        return Response(
            {'message': 'Post supprimé avec succès'},
            status=status.HTTP_204_NO_CONTENT
        )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_post_images(request, pk):
    """Ajouter des images à un post existant"""
    post = get_object_or_404(Post, pk=pk)
    
    if post.user != request.user:
        return Response(
            {'error': 'Permission refusée'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    images = request.FILES.getlist('images')
    if not images:
        return Response(
            {'error': 'Aucune image fournie'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Limiter le nombre d'images
    existing_images = PostImage.objects.filter(post=post).count()
    if existing_images + len(images) > 10:
        return Response(
            {'error': 'Maximum 10 images par post'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    uploaded_images = []
    last_order = PostImage.objects.filter(post=post).order_by('-order').first()
    start_order = last_order.order + 1 if last_order else 0
    
    for i, image in enumerate(images):
        try:
            post_image = PostImage.objects.create(
                post=post,
                image=image,
                order=start_order + i
            )
            
            uploaded_images.append({
                'id': post_image.id,
                'url': request.build_absolute_uri(post_image.image.url),
                'name': image.name
            })
        except Exception as e:
            print(f"Error uploading image {image.name}: {str(e)}")
    
    # Si le post n'a pas d'image principale, utiliser la première
    if not post.image and uploaded_images:
        post.image = images[0]
        post.save()
    
    return Response({
        'success': True,
        'message': f'{len(uploaded_images)} image(s) ajoutée(s)',
        'images': uploaded_images,
        'total_images': PostImage.objects.filter(post=post).count()
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_post_files(request, pk):
    """Ajouter des fichiers à un post existant"""
    post = get_object_or_404(Post, pk=pk)
    
    if post.user != request.user:
        return Response(
            {'error': 'Permission refusée'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les fichiers par type
    videos = request.FILES.getlist('videos')
    audio_files = request.FILES.getlist('audio')
    documents = request.FILES.getlist('documents')
    
    if not videos and not audio_files and not documents:
        return Response(
            {'error': 'Aucun fichier fourni'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    uploaded_files = []
    
    # Ajouter les vidéos
    for video in videos:
        try:
            post_file = PostFile.objects.create(
                post=post,
                file=video,
                file_type='video',
                name=video.name
            )
            uploaded_files.append({
                'id': post_file.id,
                'type': 'video',
                'name': video.name,
                'url': request.build_absolute_uri(post_file.file.url) if post_file.file else None
            })
        except Exception as e:
            print(f"Error uploading video {video.name}: {str(e)}")
    
    # Ajouter les fichiers audio
    for audio in audio_files:
        try:
            post_file = PostFile.objects.create(
                post=post,
                file=audio,
                file_type='audio',
                name=audio.name
            )
            uploaded_files.append({
                'id': post_file.id,
                'type': 'audio',
                'name': audio.name,
                'url': request.build_absolute_uri(post_file.file.url) if post_file.file else None
            })
        except Exception as e:
            print(f"Error uploading audio {audio.name}: {str(e)}")
    
    # Ajouter les documents
    for doc in documents:
        try:
            post_file = PostFile.objects.create(
                post=post,
                file=doc,
                file_type='document',
                name=doc.name
            )
            uploaded_files.append({
                'id': post_file.id,
                'type': 'document',
                'name': doc.name,
                'url': request.build_absolute_uri(post_file.file.url) if post_file.file else None
            })
        except Exception as e:
            print(f"Error uploading document {doc.name}: {str(e)}")
    
    return Response({
        'success': True,
        'message': f'{len(uploaded_files)} fichier(s) ajouté(s)',
        'files': uploaded_files,
        'total_files': PostFile.objects.filter(post=post).count()
    })
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_post_image(request, pk):
    """
    Upload une image pour un post spécifique
    """
    post = get_object_or_404(Post, pk=pk)
    
    # Vérifier que l'utilisateur est propriétaire
    if post.user != request.user:
        return Response(
            {'error': 'Vous n\'avez pas la permission de modifier ce post'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    image = request.FILES.get('image')
    if not image:
        return Response(
            {'error': 'Aucune image fournie'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Supprimer l'ancienne image si elle existe
    if post.image:
        old_image_path = post.image.path
        if os.path.exists(old_image_path):
            os.remove(old_image_path)
    
    # Sauvegarder la nouvelle image
    post.image = image
    post.save()
    
    return Response({
        'status': 'Image uploadée avec succès',
        'image_url': post.image.url if post.image else None
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_post_file(request, pk):
    """
    Upload un fichier pour un post spécifique
    """
    post = get_object_or_404(Post, pk=pk)
    
    # Vérifier que l'utilisateur est propriétaire
    if post.user != request.user:
        return Response(
            {'error': 'Vous n\'avez pas la permission de modifier ce post'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    file = request.FILES.get('file')
    if not file:
        return Response(
            {'error': 'Aucun fichier fourni'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Supprimer l'ancien fichier si il existe
    if post.files:
        old_file_path = post.files.path
        if os.path.exists(old_file_path):
            os.remove(old_file_path)
    
    # Sauvegarder le nouveau fichier
    post.files = file
    post.save()
    
    return Response({
        'status': 'Fichier uploadé avec succès',
        'file_url': post.files.url if post.files else None
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_multiple_images(request, pk):
    """
    Upload plusieurs images pour un post (version alternative)
    """
    post = get_object_or_404(Post, pk=pk)
    
    if post.user != request.user:
        return Response(
            {'error': 'Permission refusée'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    images = request.FILES.getlist('images')
    if not images:
        return Response(
            {'error': 'Aucune image fournie'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    uploaded_images = []
    for image in images:
        # Pour stocker plusieurs images, vous pourriez avoir besoin d'un modèle séparé
        # Pour l'instant, nous sauvegardons seulement la première image
        if not post.image:
            post.image = image
            post.save()
            uploaded_images.append({
                'name': image.name,
                'url': post.image.url
            })
            break
    
    return Response({
        'status': f'{len(uploaded_images)} image(s) uploadée(s)',
        'images': uploaded_images
    })

# ============== CATEGORIES ==============

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def category_list_create(request):
    """
    Liste toutes les catégories ou crée une nouvelle catégorie
    """
    if request.method == 'GET':
        # Filtrer par parent (optionnel)
        parent_id = request.query_params.get('parent')
        only_root = request.query_params.get('only_root', 'false').lower() == 'true'
        
        queryset = Category.objects.all()
        
        if parent_id:
            try:
                parent_category = Category.objects.get(id=parent_id)
                queryset = queryset.filter(parent=parent_category)
            except Category.DoesNotExist:
                pass
        elif only_root:
            queryset = queryset.filter(parent__isnull=True)
        
        # Filtrer par statut actif (optionnel)
        active_only = request.query_params.get('active_only', 'false').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        # Trier par ordre et nom
        queryset = queryset.order_by('order', 'name')
        
        # Compter le nombre de posts par catégorie
        for category in queryset:
            category.posts_count = category.post_categorie.count()
        
        # Choisir le serializer selon le besoin
        if request.query_params.get('simple', 'false').lower() == 'true':
            serializer = CategoryListSerializer(queryset, many=True, context={'request': request})
        else:
            serializer = CategorySerializer(queryset, many=True, context={'request': request})
        
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Pour les images en base64 ou fichier
        data = request.data.copy()
        
        # Gérer l'image si fournie
        if 'image' in request.FILES:
            data['image'] = request.FILES['image']
        
        serializer = CategoryCreateUpdateSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            category = serializer.save()
            
            # Retourner les détails complets
            return_serializer = CategorySerializer(category, context={'request': request})
            return Response(return_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def category_detail_update_delete(request, pk):
    """
    Récupère, met à jour ou supprime une catégorie spécifique
    """
    category = get_object_or_404(Category, pk=pk)
    
    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PATCH':
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Vérifier si des posts utilisent cette catégorie
        if category.post_categorie.count() > 0:
            return Response(
                {'error': 'Impossible de supprimer cette catégorie car des posts l\'utilisent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        category.delete()
        return Response(
            {'message': 'Catégorie supprimée avec succès'},
            status=status.HTTP_204_NO_CONTENT
        )

# ============== TAGS ==============

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def tag_list_create(request):
    """
    Liste tous les tags ou crée un nouveau tag
    """
    if request.method == 'GET':
        tags = Tag.objects.all()
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def tag_detail_update_delete(request, pk):
    """
    Récupère, met à jour ou supprime un tag spécifique
    """
    tag = get_object_or_404(Tag, pk=pk)
    
    if request.method == 'GET':
        serializer = TagSerializer(tag)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TagSerializer(tag, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PATCH':
        serializer = TagSerializer(tag, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        tag.delete()
        return Response(
            {'message': 'Tag supprimé avec succès'},
            status=status.HTTP_204_NO_CONTENT
        )

# ============== FONCTIONS UTILITAIRES ==============

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def user_posts(request, username):
    """
    Récupère tous les posts d'un utilisateur spécifique
    """
    posts = Post.objects.filter(user__username=username).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def category_posts(request, category_id):
    """
    Récupère tous les posts d'une catégorie spécifique
    """
    posts = Post.objects.filter(category_id=category_id).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def tag_posts(request, tag_name):
    """
    Récupère tous les posts avec un tag spécifique
    """
    posts = Post.objects.filter(tags__name=tag_name).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_posts(request):
    """
    Recherche des posts par titre ou contenu
    """
    query = request.query_params.get('q', '')
    if not query:
        return Response(
            {'error': 'Le paramètre de recherche "q" est requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    posts = Post.objects.filter(
        Q(title__icontains=query) | 
        Q(content__icontains=query)
    ).order_by('-created_at')
    
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_posts(request):
    """
    Récupère tous les posts de l'utilisateur connecté
    """
    posts = Post.objects.filter(user=request.user).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mentioned_posts(request):
    """
    Récupère tous les posts où l'utilisateur est mentionné
    """
    posts = Post.objects.filter(mentions=request.user).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_posts(request, user_id=None):
    """
    Récupère tous les posts d'un utilisateur spécifique
    GET /posts/user/<user_id>/
    """
    print(f"🎯 GET_USER_POSTS called for user_id: {user_id}")
    
    try:
        # Vérifier que l'utilisateur existe
        try:
            target_user = User.objects.get(id=user_id)  # ✅ Utiliser User
            print(f"✅ User found: {target_user.username}")
        except User.DoesNotExist:  # ✅ Utiliser User
            print(f"❌ User not found with ID: {user_id}")
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer les posts de l'utilisateur
        posts = Post.objects.filter(user=target_user).order_by('-created_at')
        
        print(f"📝 Found {posts.count()} posts for user {target_user.username}")
        
        # Sérialiser les données
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        
        response_data = {
            "user_info": {
                "id": target_user.id,
                "username": target_user.username,
                "posts_count": posts.count(),
                
            },
            "posts": serializer.data
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"💥 Exception in get_user_posts: {str(e)}")
        import traceback
        print(f"🔍 Stack trace: {traceback.format_exc()}")
        return Response(
            {"error": f"Server error: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_post_detail(request, user_id=None, post_id=None):
    """
    Fetch a specific post with ratings and distribution
    """
    print(f"🎯 GET_USER_POST_DETAIL called for user_id: {user_id}, post_id: {post_id}")
    
    try:
        # Optimiser la requête avec prefetch_related
        try:
            post = Post.objects.prefetch_related('ratings').get(id=post_id)
            print(f"✅ Post found: {post.title}")
            
            # Calculer la distribution manuellement si nécessaire
            from django.db.models import Count, Avg
            
            # Obtenir la distribution des ratings
            distribution = {}
            for i in range(1, 6):
                count = post.ratings.filter(stars=i).count()
                distribution[i] = count
            
            # Ajouter la distribution au post
            post.rating_distribution_calculated = distribution
            
            # Calculer la moyenne et le total
            ratings_agg = post.ratings.aggregate(
                average=Avg('stars'),
                count=Count('id')
            )
            
            post.average_rating_calc = ratings_agg['average'] or 0.0
            post.total_ratings_calc = ratings_agg['count']
            
        except Post.DoesNotExist:
            print(f"❌ Post not found with ID: {post_id}")
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Sérialiser le post
        serializer = PostDetailSerializer(post, context={'request': request})
        response_data = serializer.data
        
        # Vérifier ce qui est envoyé
        print(f"📤 Sending post data. Has ratings: {'ratings' in response_data}")
        print(f"📤 Has rating_distribution: {'rating_distribution' in response_data}")
        
        return Response(response_data)
        
    except Exception as e:
        print(f"💥 Exception in get_user_post_detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# views.py - CORRIGÉ
@api_view(['GET'])
@permission_classes([AllowAny])
def get_recent_user_posts(request, user_id=None):
    """
    Récupère les posts récents d'un utilisateur (limité à 10)
    GET /posts/user/<user_id>/recent/?exclude_post=<post_id>
    """
    print(f"🎯 GET_RECENT_USER_POSTS called for user_id: {user_id}")
    
    try:
        # Vérifier que l'utilisateur existe
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer le post à exclure depuis les paramètres de requête
        exclude_post_id = request.GET.get('exclude_post')
        
        # Construire la queryset de base
        posts = Post.objects.filter(user=target_user)
        
        # Exclure le post spécifique si fourni
        if exclude_post_id:
            posts = posts.exclude(id=exclude_post_id)
            print(f"📝 Excluding post ID: {exclude_post_id}")
        
        # Récupérer les 10 posts les plus récents
        posts = posts.order_by('-created_at')[:10]
        
        print(f"📝 Found {posts.count()} recent posts for user {target_user.username}")
        
        # Sérialiser les données
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        
        response_data = {
            "user_info": {
                "id": target_user.id,
                "username": target_user.username
            },
            "posts": serializer.data,
            "total_posts": Post.objects.filter(user=target_user).count(),
            "excluded_post": exclude_post_id
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"💥 Exception in get_recent_user_posts: {str(e)}")
        return Response(
            {"error": f"Server error: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# ✅ NOUVELLES VUES POUR LE SYSTÈME DE FEEDBACK AVEC ÉTOILES
# Dans votre views.py - Modifier la vue existante
@api_view(['POST', 'DELETE'])  # ✅ Accepter DELETE et POST
@permission_classes([IsAuthenticated])
def rate_post(request, post_id):
    """
    Noter ou supprimer la note d'un post
    POST /posts/{post_id}/rate/ - {"stars": 4}
    DELETE /posts/{post_id}/rate/ - Supprimer la note
    """
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'DELETE':
        # ✅ SUPPRESSION de la note
        try:
            rating = Rating.objects.get(post=post, user=request.user)
            rating.delete()
            
            # Recalculer la moyenne
            ratings_agg = Rating.objects.filter(post=post).aggregate(
                average=Avg('stars'),
                count=Count('id')
            )
            
            post.average_rating = ratings_agg['average'] or 0
            post.total_ratings = ratings_agg['count']
            post.save()
            
            return Response({
                "average_rating": post.average_rating,
                "total_ratings": post.total_ratings,
                "user_rating": None,
                "message": "Note supprimée"
            }, status=status.HTTP_200_OK)
            
        except Rating.DoesNotExist:
            return Response({"error": "Aucune note à supprimer"}, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        # ✅ NOTATION normale
        stars = request.data.get('stars')
        
        if not stars or not (1 <= int(stars) <= 5):
            return Response(
                {"error": "La note doit être entre 1 et 5 étoiles"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rating, created = Rating.objects.get_or_create(
            post=post,
            user=request.user,
            defaults={'stars': stars}
        )
        
        if not created:
            rating.stars = stars
            rating.save()
        
        # Recalculer la moyenne
        ratings_agg = Rating.objects.filter(post=post).aggregate(
            average=Avg('stars'),
            count=Count('id')
        )
        
        post.average_rating = ratings_agg['average'] or 0
        post.total_ratings = ratings_agg['count']
        post.save()

        try:
            user_rating_obj = Rating.objects.get(post=post, user=request.user)
            user_rating_data = {
                'stars': user_rating_obj.stars,
                'id': user_rating_obj.id,
                'created_at': user_rating_obj.created_at
            }
        except Rating.DoesNotExist:
            user_rating_data = None
        
        return Response({
            "user_rating": user_rating_data,
            "average_rating": post.average_rating,
            "total_ratings": post.total_ratings,
            "message": "Note mise à jour" if not created else "Note ajoutée"
        }, status=status.HTTP_200_OK)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_post_ratings(request, post_id):
    """
    Récupérer toutes les notes d'un post
    GET /api/posts/{post_id}/ratings/
    """
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    
    user_rating = None
    if request.user.is_authenticated:
        try:
            user_rating = Rating.objects.get(post=post, user=request.user)
        except Rating.DoesNotExist:
            pass
    
    ratings = Rating.objects.filter(post=post).select_related('user')
    serializer = RatingSerializer(ratings, many=True)
    
    return Response({
        "post_id": post.id,
        "post_title": post.title,
        "average_rating": post.average_rating,
        "total_ratings": post.total_ratings,
        "user_rating": RatingSerializer(user_rating).data if user_rating else None,
        "all_ratings": serializer.data
    })

@api_view(['POST','DELETE'])
@permission_classes([IsAuthenticated])
def delete_rating(request, post_id):
    """
    Supprimer la note de l'utilisateur connecté sur un post
    DELETE /posts/{post_id}/rate/
    """
    try:
        post = Post.objects.get(id=post_id)
        rating = Rating.objects.get(post=post, user=request.user)
        rating.delete()
        
        # Recalculer la moyenne
        ratings_agg = Rating.objects.filter(post=post).aggregate(
            average=Avg('stars'),
            count=Count('id')
        )
        
        post.average_rating = ratings_agg['average'] or 0
        post.total_ratings = ratings_agg['count']
        post.save()
        
        return Response({
            "message": "Note supprimée",
            "average_rating": post.average_rating,
            "total_ratings": post.total_ratings
        })
        
    except Post.DoesNotExist:
        return Response({"error": "Post non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    except Rating.DoesNotExist:
        return Response({"error": "Note non trouvée"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_ratings(request):
    """
    Récupérer toutes les notes données par l'utilisateur connecté
    GET /ratings/my-ratings/
    """
    try:
        ratings = Rating.objects.filter(user=request.user).select_related('post')
        serializer = RatingSerializer(ratings, many=True)
        
        return Response({
            "user": request.user.username,
            "total_ratings": ratings.count(),
            "ratings": serializer.data
        })
        
    except Exception as e:
        return Response(
            {"error": f"Erreur serveur: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_categories(request):
    """
    Récupère toutes les catégories
    """
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_post_images(request, post_id):
    """
    Upload plusieurs images pour un post
    POST /post/posts/<post_id>/upload-images/
    """
    post = get_object_or_404(Post, id=post_id)
    
    # Vérifier les permissions
    if post.user != request.user:
        return Response(
            {'error': 'Permission refusée'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    images = request.FILES.getlist('images')
    if not images:
        return Response(
            {'error': 'Aucune image fournie'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Limiter le nombre d'images (optionnel)
    MAX_IMAGES = 10
    existing_images_count = PostImage.objects.filter(post=post).count()
    if existing_images_count + len(images) > MAX_IMAGES:
        return Response(
            {'error': f'Maximum {MAX_IMAGES} images autorisées par post'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    uploaded_images = []
    
    # Déterminer l'ordre de départ
    last_order = PostImage.objects.filter(post=post).order_by('-order').first()
    start_order = last_order.order + 1 if last_order else 0
    
    # Sauvegarder chaque image
    for i, image in enumerate(images):
        try:
            # Valider le type de fichier
            if not image.content_type.startswith('image/'):
                continue
            
            # Créer l'instance PostImage
            post_image = PostImage.objects.create(
                post=post,
                image=image,
                order=start_order + i
            )
            
            uploaded_images.append({
                'id': post_image.id,
                'image_url': request.build_absolute_uri(post_image.image.url),
                'order': post_image.order,
                'name': image.name
            })
            
        except Exception as e:
            print(f"Erreur lors de l'upload de l'image {image.name}: {str(e)}")
            continue
    
    # Si le post n'a pas d'image principale et qu'on upload des images
    if not post.image and len(uploaded_images) > 0:
        post.image = images[0]
        post.save()
    
    return Response({
        'status': 'success',
        'message': f'{len(uploaded_images)} image(s) uploadée(s) avec succès',
        'images': uploaded_images,
        'post_id': post.id,
        'post_title': post.title,
        'main_image': post.image.url if post.image else None
    }, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post_image(request, post_id, image_id):
    """
    Supprimer une image spécifique d'un post
    DELETE /post/posts/<post_id>/images/<image_id>/
    """
    post = get_object_or_404(Post, id=post_id)
    post_image = get_object_or_404(PostImage, id=image_id, post=post)
    
    # Vérifier les permissions
    if post.user != request.user:
        return Response(
            {'error': 'Permission refusée'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Supprimer le fichier physique
    if post_image.image:
        if default_storage.exists(post_image.image.name):
            default_storage.delete(post_image.image.name)
    
    # Supprimer l'entrée de la base de données
    image_id = post_image.id
    post_image.delete()
    
    # Réorganiser l'ordre des images restantes
    remaining_images = PostImage.objects.filter(post=post).order_by('order')
    for index, img in enumerate(remaining_images):
        if img.order != index:
            img.order = index
            img.save()
    
    return Response({
        'status': 'success',
        'message': 'Image supprimée avec succès',
        'deleted_image_id': image_id,
        'remaining_images': remaining_images.count()
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post_with_images(request):
    """
    Créer un post avec plusieurs images
    """
    print("🔍 [CREATE WITH IMAGES] Starting...")
    
    # Récupérer les données du formulaire
    title = request.POST.get('title')
    content = request.POST.get('content')
    category_id = request.POST.get('category_id')
    link = request.POST.get('link', '')
    
    # Validation basique
    if not title or not content or not category_id:
        return Response(
            {'error': 'Titre, contenu et catégorie sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {'error': 'Catégorie non trouvée'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Récupérer toutes les images
    images = request.FILES.getlist('images')
    print(f"🔍 [CREATE WITH IMAGES] Found {len(images)} images")
    
    # Créer le post
    try:
        post = Post.objects.create(
            user=request.user,
            title=title,
            content=content,
            category=category,
            link=link if link else None
        )
        
        # Ajouter les images
        if images and len(images) > 0:
            # Première image comme image principale
            post.image = images[0]
            post.save()
            
            # Créer les PostImage pour toutes les images
            for i, image in enumerate(images):
                PostImage.objects.create(
                    post=post,
                    image=image,
                    order=i
                )
            
            print(f"✅ [CREATE WITH IMAGES] Created post with {len(images)} images")
        else:
            print("✅ [CREATE WITH IMAGES] Created post without images")
        
        # Retourner le post créé
        from .serializers import PostSerializer
        serializer = PostSerializer(post, context={'request': request})
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"💥 [CREATE WITH IMAGES] Error: {str(e)}")
        return Response(
            {'error': f'Erreur lors de la création: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
 
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_best_rated_posts(request):
    """
    Posts les mieux notés - Version avec support de catégorie et recherche
    """
    from django.db.models import Avg, Count, Q
    
    # Paramètres
    limit = int(request.query_params.get('limit', 20))
    min_ratings = int(request.query_params.get('min_ratings', 3))
    
    # Base queryset
    queryset = Post.objects.all()
    
    # Filtrage par catégorie
    category = request.query_params.get('category', None)
    if category and category != '':
        try:
            category_id = int(category)
            queryset = queryset.filter(category_id=category_id)
        except ValueError:
            queryset = queryset.filter(category__name__icontains=category)
    
    # Filtrage par recherche
    search = request.query_params.get('search', None)
    if search and search != '':
        queryset = queryset.filter(
            Q(title__icontains=search) | 
            Q(content__icontains=search)
        )
    
    # Annoter avec les statistiques
    queryset = queryset.annotate(
        rating_count=Count('ratings'),
        avg_rating=Avg('ratings__stars')
    ).filter(
        rating_count__gte=min_ratings,
        avg_rating__isnull=False
    )
    
    # Trier d'abord par nombre de notes, puis par moyenne
    queryset = queryset.order_by('-rating_count', '-avg_rating', '-created_at')
    
    # Limiter
    queryset = queryset[:limit]
    
    from .serializers import PostListSerializer
    serializer = PostListSerializer(queryset, many=True, context={'request': request})
    
    return Response({
        'posts': serializer.data,
        'stats': {
            'min_ratings': min_ratings,
            'category': category,
            'search': search,
            'algorithm': 'rating_count DESC, avg_rating DESC'
        }
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_most_popular_posts(request):
    """
    Posts les plus populaires - Version avec support de catégorie et recherche
    """
    from django.db.models import Count, Q
    
    # Paramètres
    limit = int(request.query_params.get('limit', 20))
    days = int(request.query_params.get('days', 30))
    
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    # Base queryset
    queryset = Post.objects.all()
    
    # Filtrage par catégorie
    category = request.query_params.get('category', None)
    if category and category != '':
        try:
            category_id = int(category)
            queryset = queryset.filter(category_id=category_id)
        except ValueError:
            queryset = queryset.filter(category__name__icontains=category)
    
    # Filtrage par recherche
    search = request.query_params.get('search', None)
    if search and search != '':
        queryset = queryset.filter(
            Q(title__icontains=search) | 
            Q(content__icontains=search)
        )
    
    # Date limite pour l'engagement récent
    recent_date = timezone.now() - timedelta(days=days)
    
    # Annoter avec l'engagement
    queryset = queryset.annotate(
        total_rating_count=Count('ratings'),
        recent_rating_count=Count('ratings', filter=Q(ratings__created_at__gte=recent_date))
    ).filter(
        total_rating_count__gt=0
    )
    
    # Calculer le score de popularité
    from django.db.models import F, ExpressionWrapper, FloatField
    queryset = queryset.annotate(
        popularity_score=ExpressionWrapper(
            F('recent_rating_count') * 3.0 + F('total_rating_count') * 1.0,
            output_field=FloatField()
        )
    )
    
    # Trier par score de popularité
    queryset = queryset.order_by('-popularity_score', '-created_at')
    
    # Limiter
    queryset = queryset[:limit]
    
    from .serializers import PostListSerializer
    serializer = PostListSerializer(queryset, many=True, context={'request': request})
    
    return Response({
        'posts': serializer.data,
        'stats': {
            'days': days,
            'category': category,
            'search': search,
            'algorithm': 'recent_ratings*3 + total_ratings*1'
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def category_by_name(request, category_name):
    """
    Get category by name with all related posts and filters
    GET /api/categories/{category_name}/
    """
    print(f"🔍 [CATEGORY BY NAME] Request for category: {category_name}")
    
    try:
        # Get category by name (case-insensitive)
        category = Category.objects.filter(
            Q(name__iexact=category_name) | Q(name__iexact=category_name.lower())
        ).first()
        
        if not category:
            print(f"❌ Category not found: {category_name}")
            return Response(
                {"error": f"Category '{category_name}' not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        print(f"✅ Category found: {category.name} (ID: {category.id})")
        
        # Get query parameters for filtering posts
        search = request.GET.get('search', '')
        sort_by = request.GET.get('sort', 'newest')
        tag = request.GET.get('tag', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        # Start with posts in this category
        posts = Post.objects.filter(category=category)
        
        # Apply filters
        if search:
            posts = posts.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )
            print(f"🔍 Applied search filter: {search}")
        
        if tag:
            posts = posts.filter(tags__name__iexact=tag)
            print(f"🔍 Applied tag filter: {tag}")
        
        # Apply sorting
        if sort_by == 'newest':
            posts = posts.order_by('-created_at')
        elif sort_by == 'oldest':
            posts = posts.order_by('created_at')
        elif sort_by == 'popular':
            posts = posts.annotate(
                rating_count=Count('ratings')
            ).order_by('-rating_count', '-created_at')
        elif sort_by == 'rated':
            posts = posts.annotate(
                avg_rating=Avg('ratings__stars'),
                rating_count=Count('ratings')
            ).filter(
                rating_count__gte=3,
                avg_rating__isnull=False
            ).order_by('-avg_rating', '-rating_count', '-created_at')
        
        # Calculate total before pagination
        total_posts = posts.count()
        total_pages = (total_posts + page_size - 1) // page_size
        
        # Apply pagination
        start = (page - 1) * page_size
        end = start + page_size
        posts = posts[start:end]
        
        # Prefetch related data
        posts = posts.select_related('user', 'category').prefetch_related(
            'tags', 'post_images', 'post_files'
        )
        
        # Serialize the data
        category_serializer = CategorySerializer(category, context={'request': request})
        posts_serializer = PostListSerializer(posts, many=True, context={'request': request})
        
        # Get subcategories
        subcategories = category.subcategories.filter(is_active=True).order_by('order', 'name')
        subcategories_serializer = CategorySerializer(subcategories, many=True, context={'request': request})
        
        # Get popular tags in this category
        from django.db.models import Count
        popular_tags = Tag.objects.filter(
            posts__category=category
        ).annotate(
            post_count=Count('posts')
        ).order_by('-post_count')[:10]
        
        response_data = {
            'category': category_serializer.data,
            'posts': posts_serializer.data,
            'subcategories': subcategories_serializer.data,
            'popular_tags': [
                {
                    'name': tag.name,
                    'count': tag.post_count
                } for tag in popular_tags
            ],
            'pagination': {
                'current_page': page,
                'page_size': page_size,
                'total_posts': total_posts,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1
            },
            'filters': {
                'search': search,
                'sort': sort_by,
                'tag': tag,
                'applied_filters': {
                    'has_search': bool(search),
                    'has_tag': bool(tag),
                    'sort_by': sort_by
                }
            },
            'stats': {
                'posts_count': total_posts,
                'subcategories_count': subcategories.count(),
                'tags_count': popular_tags.count()
            }
        }
        
        print(f"✅ Sending response with {len(posts)} posts")
        return Response(response_data)
        
    except Exception as e:
        print(f"💥 Error in category_by_name: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def category_posts(request, category_name):
    """
    Get only posts for a specific category (simplified version)
    GET /api/categories/{category_name}/posts/
    """
    try:
        category = Category.objects.filter(
            Q(name__iexact=category_name) | Q(name__iexact=category_name.lower())
        ).first()
        
        if not category:
            return Response(
                {"error": f"Category '{category_name}' not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        posts = Post.objects.filter(category=category).order_by('-created_at')
        
        # Apply pagination
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        posts = posts.select_related('user', 'category').prefetch_related('tags')[start:end]
        
        serializer = PostListSerializer(posts, many=True, context={'request': request})
        
        return Response({
            'category': category.name,
            'category_id': category.id,
            'posts': serializer.data,
            'count': posts.count()
        })
        
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

# Dans views.py - Ajouter ces imports
import zipfile
import io
from django.http import HttpResponse
from django.core.files.storage import default_storage
from wsgiref.util import FileWrapper
import tempfile
import os

@api_view(['POST'])
@permission_classes([AllowAny])
def download_post_media(request, post_id):
    """
    Télécharger les médias d'un post en ZIP ou individuellement
    POST /api/posts/{post_id}/download-media/
    {
        "media_ids": [1, 2, 3],
        "format": "zip"  # ou "individual"
    }
    """
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post non trouvé"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    media_ids = request.data.get('media_ids', [])
    download_format = request.data.get('format', 'zip')
    
    # Récupérer tous les médias du post
    all_media = []
    
    # Images principales
    if post.image and (not media_ids or 'main-image' in media_ids):
        all_media.append({
            'id': 'main-image',
            'type': 'image',
            'name': f"main_image_{post.id}.{post.image.name.split('.')[-1]}",
            'file_path': post.image.path if post.image else None,
            'file_url': post.image.url if post.image else None,
            'size': post.image.size if post.image else 0
        })
    
    # Images supplémentaires
    post_images = post.post_images.all()
    for i, image in enumerate(post_images):
        if not media_ids or f"image-{i}" in media_ids:
            all_media.append({
                'id': f"image-{i}",
                'type': 'image',
                'name': f"image_{i+1}_{post.id}.{image.image.name.split('.')[-1]}",
                'file_path': image.image.path if image.image else None,
                'file_url': image.image.url if image.image else None,
                'size': image.image.size if image.image else 0
            })
    
    # Fichiers divers
    post_files = post.post_files.all()
    for i, file in enumerate(post_files):
        if not media_ids or f"file-{i}" in media_ids:
            all_media.append({
                'id': f"file-{i}",
                'type': file.file_type,
                'name': file.name or file.file.name,
                'file_path': file.file.path if file.file else None,
                'file_url': file.file.url if file.file else None,
                'size': file.file.size if file.file else 0
            })
    
    # Si aucun média sélectionné, retourner tous
    selected_media = all_media if not media_ids else [
        media for media in all_media if media['id'] in media_ids
    ]
    
    if not selected_media:
        return Response(
            {"error": "Aucun média sélectionné"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if download_format == 'zip' and len(selected_media) > 1:
        # Créer un ZIP avec les fichiers sélectionnés
        return create_zip_response(selected_media, post.title)
    else:
        # Pour un seul fichier ou format individuel, retourner le premier
        media = selected_media[0]
        if media.get('file_path') and os.path.exists(media['file_path']):
            with open(media['file_path'], 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="{media["name"]}"'
                return response
        else:
            # Fallback: rediriger vers l'URL
            return Response({
                "url": media.get('file_url'),
                "name": media.get('name'),
                "direct_download": True
            })

def create_zip_response(media_list, post_title):
    """Crée une réponse HTTP avec un ZIP contenant les fichiers"""
    # Créer un fichier temporaire
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
    
    try:
        with zipfile.ZipFile(temp_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for media in media_list:
                if media.get('file_path') and os.path.exists(media['file_path']):
                    # Ajouter le fichier au ZIP avec un chemin relatif
                    zipf.write(media['file_path'], media['name'])
        
        temp_file.close()
        
        # Lire le fichier ZIP
        with open(temp_file.name, 'rb') as f:
            zip_data = f.read()
        
        # Créer la réponse
        response = HttpResponse(zip_data, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{post_title}_media.zip"'
        response['Content-Length'] = len(zip_data)
        
        return response
        
    finally:
        # Nettoyer le fichier temporaire
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_post_media_list(request, post_id):
    """
    Récupérer la liste de tous les médias d'un post
    GET /api/posts/{post_id}/media-list/
    """
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post non trouvé"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    media_list = []
    
    # Détecter si on utilise S3
    from django.conf import settings
    USE_S3 = hasattr(settings, 'DEFAULT_FILE_STORAGE') and 's3' in settings.DEFAULT_FILE_STORAGE.lower()
    
    # Fonction pour obtenir la taille sécurisée
    def get_safe_file_size(file_field):
        """Récupère la taille d'un fichier de manière sécurisée (support S3)"""
        if not file_field:
            return 0
        
        try:
            # Essayer d'abord l'attribut size (fonctionne souvent avec S3)
            if hasattr(file_field, 'size'):
                return file_field.size
            
            # Si S3 et l'attribut size n'existe pas, on ne peut pas récupérer la taille
            # sans télécharger le fichier (ce qu'on veut éviter)
            return 0
            
        except (FileNotFoundError, OSError, ValueError, AttributeError):
            # En cas d'erreur, retourner 0
            return 0
    
    # Fonction pour obtenir l'extension sécurisée
    def get_safe_extension(file_field):
        """Récupère l'extension du fichier de manière sécurisée"""
        if not file_field or not file_field.name:
            return ''
        
        try:
            return file_field.name.split('.')[-1].lower()
        except (AttributeError, IndexError):
            return ''
    
    # Images supplémentaires
    post_images = post.post_images.all().order_by('order')
    for i, image in enumerate(post_images):
        safe_size = get_safe_file_size(image.image)
        media_list.append({
            'id': f"image-{i}",
            'type': 'image',
            'name': f"Image {i+1}",
            'url': request.build_absolute_uri(image.image.url) if image.image else None,
            'size': format_file_size(safe_size),
            'bytes': safe_size,
            'extension': get_safe_extension(image.image),
            'created_at': image.uploaded_at,
            'order': image.order + 1
        })
    
    # Fichiers
    post_files = post.post_files.all().order_by('created_at')
    for i, file in enumerate(post_files):
        safe_size = get_safe_file_size(file.file)
        media_list.append({
            'id': f"file-{i}",
            'type': file.file_type,
            'name': file.name or (file.file.name if file.file else ''),
            'url': request.build_absolute_uri(file.file.url) if file.file else None,
            'size': format_file_size(safe_size),
            'bytes': safe_size,
            'extension': get_safe_extension(file.file),
            'created_at': file.created_at,
            'order': 100 + i,  # Les fichiers viennent après les images
            'file_type_display': file.get_file_type_display()
        })
    
    # Calculer la taille totale
    total_bytes = sum(item['bytes'] for item in media_list)
    
    return Response({
        'post_id': post.id,
        'post_title': post.title,
        'total_media': len(media_list),
        'total_size': format_file_size(total_bytes),
        'total_bytes': total_bytes,
        'media': media_list,
        'statistics': {
            'images': len([m for m in media_list if m['type'] == 'image']),
            'videos': len([m for m in media_list if m['type'] == 'video']),
            'audio': len([m for m in media_list if m['type'] == 'audio']),
            'documents': len([m for m in media_list if m['type'] == 'document']),
            'other': len([m for m in media_list if m['type'] == 'other'])
        }
    })

def format_file_size(bytes_size):
    """Formate la taille des fichiers de manière lisible"""
    if not bytes_size:
        return "0 KB"
    
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} TB"