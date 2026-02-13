

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def post_list_create(request):
    """
    List all posts or create a new post
    With custom recommendation algorithm AND RANDOM SPOTLIGHT BOOST FIRST
    """
    if request.method == 'GET':
        try:
            logger.info("=" * 60)
            logger.info("🚀 STARTING post_list_create view")
            logger.info(f"📱 Method: GET | User: {request.user}")
            logger.info(f"📱 Authenticated: {request.user.is_authenticated}")
            
            # ============================================
            # ÉTAPE 1: CONFIGURATION DE RANDOMISATION
            # ============================================
            import random
            import hashlib
            import time
            from datetime import datetime
            from django.db.models import FloatField, Value, F, Count, ExpressionWrapper, Avg
            from django.db.models.functions import Coalesce
            from django.db.models import Case, When, Exists, OuterRef, Q
            
            logger.info("✅ Step 1: Randomization setup completed")
            
            # Créer une session si elle n'existe pas
            if not request.session.session_key:
                request.session.create()
                logger.info("🆕 Created new session")
            
            # Générer un seed UNIQUE à CHAQUE requête
            timestamp = str(time.time())
            session_key = request.session.session_key
            request_count = request.session.get('request_count', 0) + 1
            request.session['request_count'] = request_count
            request.session.save()
            
            # Seed pour randomisation COMPLÈTE à chaque requête
            unique_seed = f"{timestamp}-{session_key}-{request_count}"
            seed_hash = hashlib.md5(unique_seed.encode()).hexdigest()
            seed_int = int(seed_hash[:8], 16)
            
            # Initialiser random avec ce seed unique
            random.seed(seed_int)
            
            logger.info(f"🎲 Random seed: {seed_int}")
            
            # ============================================
            # ÉTAPE 2: RÉCUPÉRER ET SÉLECTIONNER UN SPOTLIGHT ALÉATOIRE
            # ============================================
            logger.info("🔍 Step 2: Fetching spotlight boosts...")
            
            selected_spotlight_boost = None
            all_spotlights = []
            
            try:
                # Récupérer TOUS les spotlight boosts actifs
                spotlight_boosts = SponsoredPost.objects.filter(
                    payment_status='paid',
                    boost_start__lte=timezone.now(),
                    boost_end__gte=timezone.now(),
                    featured_in_feed=True,
                    campaign__status='active',
                    post_type__icontains='spotlight'
                ).select_related('original_post', 'original_post__user', 'original_post__category')
                
                all_spotlights = list(spotlight_boosts)
                logger.info(f"🔦 Found {len(all_spotlights)} active spotlight boosts")
                
                # CRITIQUE: Sélectionner un spotlight ALÉATOIRE à chaque fois
                if all_spotlights:
                    # Sélection aléatoire pure
                    selected_spotlight_boost = random.choice(all_spotlights)
                    
                    logger.info(f"🎯 Selected spotlight boost #{selected_spotlight_boost.id}: {selected_spotlight_boost.original_post.title}")
            
            except Exception as e:
                logger.error(f"❌ Error fetching spotlight boosts: {str(e)}", exc_info=True)
                selected_spotlight_boost = None
            
            logger.info(f"✅ Step 2: Spotlight selection completed")
            
            # ============================================
            # ÉTAPE 3: RÉCUPÉRER LES AUTRES BOOSTS
            # ============================================
            logger.info("🔍 Step 3: Fetching other boosts...")
            
            all_other_boosts = []
            
            try:
                other_boosts = SponsoredPost.objects.filter(
                    payment_status='paid',
                    boost_start__lte=timezone.now(),
                    boost_end__gte=timezone.now(),
                    featured_in_feed=True,
                    campaign__status='active'
                ).exclude(
                    post_type__icontains='spotlight'
                ).select_related('original_post')
                
                all_other_boosts = list(other_boosts)
                logger.info(f"📊 Found {len(all_other_boosts)} other active boosts")
                
                # Mélanger aléatoirement les autres boosts
                random.shuffle(all_other_boosts)
                
            except Exception as e:
                logger.error(f"❌ Error fetching other boosts: {str(e)}", exc_info=True)
                all_other_boosts = []
            
            logger.info(f"✅ Step 3: Other boosts fetched")
            
            # ============================================
            # ÉTAPE 4: PRÉPARER LES POSTS RÉGULIERS
            # ============================================
            logger.info("🔍 Step 4: Preparing regular posts...")
            
            # Base queryset avec les annotations nécessaires pour le serializer
            queryset = Post.objects.filter(user__is_active=True)
            
            # IMPORTANT: Annoter avec les champs requis par le serializer
            queryset = queryset.annotate(
                # Pour get_calculated_rating()
                calculated_avg_rating=Coalesce(Avg('ratings__stars'), Value(0.0), output_field=FloatField()),
                
                # Pour get_calculated_rating_count() et get_engagement_score()
                calculated_rating_count=Count('ratings', distinct=True),
                
                # Pour comments_count
                comments_count_annotated=Count('post_comments', distinct=True),
                
                # Pour les permissions (optionnel mais utile)
                user_has_rated=Exists(
                    Rating.objects.filter(user=request.user, post=OuterRef('pk'))
                ) if request.user.is_authenticated else Value(False, output_field=FloatField()),
                
                user_has_viewed=Exists(
                    PostView.objects.filter(user=request.user, post=OuterRef('pk'))
                ) if request.user.is_authenticated else Value(False, output_field=FloatField()),
                
                user_has_commented=Exists(
                    Comment.objects.filter(user=request.user, post=OuterRef('pk'))
                ) if request.user.is_authenticated else Value(False, output_field=FloatField()),
            )
            
            # Exclure TOUS les posts boostés
            all_boosted_post_ids = []
            
            if selected_spotlight_boost:
                all_boosted_post_ids.append(selected_spotlight_boost.original_post_id)
            
            for boost in all_other_boosts:
                if boost.original_post_id not in all_boosted_post_ids:
                    all_boosted_post_ids.append(boost.original_post_id)
            
            if all_boosted_post_ids:
                logger.info(f"🚫 Excluding {len(all_boosted_post_ids)} boosted posts")
                queryset = queryset.exclude(id__in=all_boosted_post_ids)
            
            logger.info(f"✅ Step 4: Regular posts prepared (total: {queryset.count()})")
            
            # ============================================
            # ÉTAPE 5: FILTRES
            # ============================================
            logger.info("🔍 Step 5: Applying filters...")
            
            category = request.query_params.get('category', None)
            if category and category != '':
                try:
                    category_id = int(category)
                    queryset = queryset.filter(category_id=category_id)
                except ValueError:
                    queryset = queryset.filter(category__name__icontains=category)
            
            tag = request.query_params.get('tag', None)
            if tag and tag != '':
                queryset = queryset.filter(tags__name=tag)
            
            search = request.query_params.get('search', None)
            if search and search != '':
                queryset = queryset.filter(
                    Q(title__icontains=search) | 
                    Q(content__icontains=search)
                )
            
            user = request.query_params.get('user', None)
            if user and user != '':
                queryset = queryset.filter(user__username=user)
            
            # ============================================
            # ÉTAPE 6: ALGORITHME DE TRI AVEC RANDOMISATION
            # ============================================
            logger.info("🔍 Step 6: Applying sorting algorithm...")
            
            algorithm = request.query_params.get('algorithm', 'recommended')
            sort_by = request.query_params.get('sort', 'newest')
            
            if request.user.is_authenticated and algorithm != 'newest':
                # Version randomisée pour utilisateurs authentifiés
                
                # Score de variation aléatoire
                variation_score = ExpressionWrapper(
                    (F('id') * seed_int) % 100000 / 100000.0 * 100.0,
                    output_field=FloatField()
                )
                
                # Score d'engagement (utilise les champs annotés)
                engagement_score = ExpressionWrapper(
                    F('calculated_avg_rating') * (F('calculated_rating_count') + Value(1)),
                    output_field=FloatField()
                )
                
                # Annoter avec les scores de randomisation
                queryset = queryset.annotate(
                    random_score=variation_score,
                    engagement=engagement_score,
                ).annotate(
                    final_score=(
                        F('engagement') * Value(0.7) + 
                        F('random_score') * Value(0.3)
                    )
                ).order_by('-final_score', '-created_at')
                
                logger.info(f"🎲 Using RANDOMIZED algorithm with seed: {seed_int}")
                
            else:
                # Pour utilisateurs non authentifiés ou algorithme 'newest'
                if sort_by == 'newest':
                    random_score = ExpressionWrapper(
                        (F('id') * seed_int) % 1000 / 1000.0,
                        output_field=FloatField()
                    )
                    queryset = queryset.annotate(random_factor=random_score)
                    queryset = queryset.order_by('-created_at', '-random_factor')
                    
                elif sort_by == 'oldest':
                    queryset = queryset.order_by('created_at')
                    
                elif sort_by == 'popular':
                    random_score = ExpressionWrapper(
                        (F('id') * seed_int) % 1000 / 1000.0,
                        output_field=FloatField()
                    )
                    queryset = queryset.annotate(
                        random_factor=random_score
                    ).order_by('-calculated_rating_count', '-random_factor', '-created_at')
                    
                elif sort_by == 'random':
                    random_score = ExpressionWrapper(
                        (F('id') * seed_int) % 1000000 / 1000000.0,
                        output_field=FloatField()
                    )
                    queryset = queryset.annotate(random_order=random_score)
                    queryset = queryset.order_by('random_order')
                    
                else:
                    random_score = ExpressionWrapper(
                        (F('id') * seed_int) % 1000 / 1000.0,
                        output_field=FloatField()
                    )
                    queryset = queryset.annotate(random_factor=random_score)
                    queryset = queryset.order_by('-created_at', '-random_factor')
            
            # ============================================
            # ÉTAPE 7: CONSTRUCTION DE LA LISTE FINALE
            # ============================================
            logger.info("🔍 Step 7: Building final list...")
            
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            final_posts = []
            
            # Page 1: spotlight en premier + mélange aléatoire
            if page == 1 and selected_spotlight_boost:
                # 1. Spotlight boost TOUJOURS en première position
                final_posts.append(selected_spotlight_boost.original_post)
                
                # 2. Limiter le nombre d'autres boosts
                max_other_boosts = min(3, len(all_other_boosts))
                other_boosts_to_show = all_other_boosts[:max_other_boosts]
                
                # 3. Calculer combien de posts réguliers nous avons besoin
                regular_posts_needed = page_size - (1 + len(other_boosts_to_show))
                
                # 4. Récupérer les posts réguliers
                regular_posts = list(queryset[:regular_posts_needed])
                
                # 5. MÉLANGE ALÉATOIRE des autres boosts et posts réguliers
                all_remaining = []
                
                for boost in other_boosts_to_show:
                    all_remaining.append(('boost', boost))
                
                for post in regular_posts:
                    all_remaining.append(('post', post))
                
                random.shuffle(all_remaining)
                
                # 6. Construire la liste finale
                for item_type, item in all_remaining:
                    if item_type == 'boost':
                        final_posts.append(item.original_post)
                    else:
                        final_posts.append(item)
                
                # 7. Limiter à la taille de page
                if len(final_posts) > page_size:
                    final_posts = final_posts[:page_size]
                
                total_regular_count = queryset.count()
                
            elif page == 1 and not selected_spotlight_boost:
                # Page 1 sans spotlight
                regular_posts = list(queryset[:page_size])
                final_posts = regular_posts
                total_regular_count = queryset.count()
                
            else:
                # Pages suivantes
                start_idx = (page - 1) * page_size
                end_idx = start_idx + page_size
                
                regular_posts = list(queryset[start_idx:end_idx])
                final_posts = regular_posts
                total_regular_count = queryset.count()
            
            logger.info(f"✅ Step 7: Final list built with {len(final_posts)} posts")
            
            # ============================================
            # ÉTAPE 8: PRÉPARER LES DONNÉES DE BOOST
            # ============================================
            logger.info("🔍 Step 8: Preparing boost data...")
            
            boost_info_map = {}
            
            if page == 1 and selected_spotlight_boost:
                # Spotlight boost (position 0)
                boost_info_map[selected_spotlight_boost.original_post_id] = {
                    'is_boosted': True,
                    'boost_type': selected_spotlight_boost.post_type,
                    'boost_multiplier': float(selected_spotlight_boost.boost_multiplier),
                    'boost_until': selected_spotlight_boost.boost_end,
                    'boost_start': selected_spotlight_boost.boost_start,
                    'always_on_top': selected_spotlight_boost.always_on_top,
                    'sponsored_post_id': selected_spotlight_boost.id,
                    'is_spotlight': True,
                    'is_first_spotlight': True,
                    'spotlight_position': 'first',
                    'position': 0,
                }
                
                # Autres boosts
                for i, post in enumerate(final_posts[1:], 1):
                    for boost in all_other_boosts:
                        if boost.original_post_id == post.id:
                            boost_info_map[post.id] = {
                                'is_boosted': True,
                                'boost_type': boost.post_type,
                                'boost_multiplier': float(boost.boost_multiplier),
                                'boost_until': boost.boost_end,
                                'boost_start': boost.boost_start,
                                'always_on_top': boost.always_on_top,
                                'sponsored_post_id': boost.id,
                                'is_spotlight': False,
                                'position': i,
                            }
                            break
            
            logger.info(f"✅ Step 8: Boost info prepared for {len(boost_info_map)} posts")
            
            # ============================================
            # ÉTAPE 9: OPTIMISER LES REQUÊTES
            # ============================================
            logger.info("🔍 Step 9: Optimizing queries...")
            
            post_ids = [p.id for p in final_posts]
            
            if post_ids:
                # Préserver l'ordre exact
                from django.db.models import Case, When, IntegerField
                preserved_order = Case(
                    *[When(pk=pk, then=pos) for pos, pk in enumerate(post_ids)],
                    output_field=IntegerField()
                )
                
                # Récupérer avec toutes les relations nécessaires
                optimized_posts = Post.objects.filter(id__in=post_ids).select_related(
                    'category', 'user', 'user__profile'
                ).prefetch_related(
                    'tags', 'mentions', 'post_images', 'post_files'
                ).order_by(preserved_order)
                
                # Réappliquer les annotations pour le serializer
                optimized_posts = optimized_posts.annotate(
                    calculated_avg_rating=Coalesce(Avg('ratings__stars'), Value(0.0), output_field=FloatField()),
                    calculated_rating_count=Count('ratings', distinct=True),
                    comments_count_annotated=Count('post_comments', distinct=True),
                )
                
                final_posts_list = list(optimized_posts)
            else:
                final_posts_list = []
            
            logger.info(f"✅ Step 9: Optimized queries, got {len(final_posts_list)} posts")
            
            # ============================================
            # ÉTAPE 10: SÉRIALISATION
            # ============================================
            logger.info("🔍 Step 10: Serializing data...")
            
            from .serializers import PostListSerializer
            
            context = {
                'request': request,
                'boost_info': boost_info_map,
                'spotlight_first': selected_spotlight_boost.original_post_id if (page == 1 and selected_spotlight_boost) else None
            }
            
            # Ajouter des attributs pour le serializer
            for post in final_posts_list:
                if post.id in boost_info_map:
                    post.is_boosted = True
                    post.boost_type = boost_info_map[post.id]['boost_type']
                    post.boost_multiplier = boost_info_map[post.id]['boost_multiplier']
                    post.is_spotlight = boost_info_map[post.id].get('is_spotlight', False)
                    post.is_first_spotlight = boost_info_map[post.id].get('is_first_spotlight', False)
                    post.sponsored_post_id = boost_info_map[post.id].get('sponsored_post_id')
                    post.boost_until = boost_info_map[post.id].get('boost_until')
            
            try:
                serializer = PostListSerializer(final_posts_list, many=True, context=context)
                logger.info("✅ Step 10: Serialization successful")
                
                # DEBUG: Vérifier le premier post
                if serializer.data and len(serializer.data) > 0:
                    first_post = serializer.data[0]
                    logger.info("=" * 50)
                    logger.info(f"🎯 FIRST POST INFO:")
                    logger.info(f"   ID: {first_post.get('id')}")
                    logger.info(f"   Title: {first_post.get('title')[:30]}...")
                    logger.info(f"   Is Boosted: {first_post.get('is_boosted')}")
                    logger.info(f"   Boost Type: {first_post.get('boost_details', {}).get('type') if first_post.get('boost_details') else 'None'}")
                    logger.info(f"   Is Spotlight: {first_post.get('boost_details', {}).get('is_spotlight') if first_post.get('boost_details') else False}")
                    logger.info("=" * 50)
            
            except Exception as e:
                logger.error(f"❌ Serialization error: {str(e)}", exc_info=True)
                return Response(
                    {'error': 'Serialization failed', 'details': str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # ============================================
            # ÉTAPE 11: CONSTRUIRE LA RÉPONSE
            # ============================================
            logger.info("🔍 Step 11: Building response...")
            
            response_data = {
                'posts': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_posts': total_regular_count + len(all_other_boosts) + (1 if selected_spotlight_boost else 0),
                    'total_pages': max(1, (total_regular_count + page_size - 1) // page_size),
                    'has_next': (page * page_size) < total_regular_count,
                    'has_previous': page > 1
                },
                'randomization': {
                    'seed': seed_int,
                    'has_spotlight': page == 1 and selected_spotlight_boost is not None,
                    'spotlight_changes_on_refresh': True,
                    'feed_changes_on_refresh': True,
                },
                'spotlight_info': {
                    'enabled': selected_spotlight_boost is not None,
                    'post_id': selected_spotlight_boost.original_post_id if selected_spotlight_boost else None,
                    'guaranteed_first_position': True,
                    'changes_every_refresh': True
                }
            }
            
            logger.info("✅ Step 11: Response built successfully")
            logger.info(f"📊 Sending {len(serializer.data)} posts to client")
            logger.info("=" * 60)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"❌ CRITICAL ERROR in post_list_create: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Internal server error', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'POST':
        # ... (votre code POST existant) ...
        
        
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
                    {'error': f'Error during creation: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            print("❌ [POST CREATE] Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
