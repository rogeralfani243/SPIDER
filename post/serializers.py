# In serializers.py - Remove the duplicate RatingSerializer
from rest_framework import serializers
from .models import Post, Category, Tag, PostImage,SponsoredPost, PostFile,AdCampaign,SponsoredPost
from feedback_post.models import Rating
from django.contrib.auth import get_user_model
import base64
from django.core.files.base import ContentFile
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from certfications.models import Payment 
User = get_user_model()

class Base64ImageField(serializers.ImageField):
    """
    Custom field pour gérer les images en base64
    """
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            format, imgstr = data.split(';base64,')
            ext = format.split('/')[-1]
            
            data = ContentFile(
                base64.b64decode(imgstr),
                name=f'temp.{ext}'
            )
        
        return super().to_internal_value(data)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Rating
        fields = ['id', 'user', 'user_name', 'stars', 'created_at']
        read_only_fields = ['user']

class PostFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PostFile
        fields = ['id', 'file', 'name', 'file_type', 'file_type_display', 'file_url', 'created_at']
        read_only_fields = ['created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_type_display(self, obj):
        return obj.get_file_type_display()

class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer spécifique pour la création de posts"""
    
    category_id = serializers.IntegerField(write_only=True, required=True)
    images = serializers.ListField(
        child=serializers.ImageField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
    videos = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
    audio = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
    documents = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
      
    category_id = serializers.IntegerField(write_only=True, required=True)
    class Meta:
        model = Post
        fields = [
            'title', 'content', 'category_id', 'link', 'image', 
            'images', 'videos', 'audio', 'documents'
        ]
        extra_kwargs = {
            'title': {'required': True},
            'content': {'required': True},
            'link': {'required': False, 'allow_blank': True},
            'image': {'required': False}
        }
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        # Extraire les données
        category_id = validated_data.pop('category_id')
        images = validated_data.pop('images', [])
        videos = validated_data.pop('videos', [])
        audio_files = validated_data.pop('audio', [])
        documents = validated_data.pop('documents', [])
        
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise serializers.ValidationError({
                'category_id': f'Catégorie avec ID {category_id} n\'existe pas'
            })
        
        # Créer le post
        post = Post.objects.create(
            user=request.user,
            category=category,
            **validated_data
        )
        
        # Gérer les images
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
        
        # Gérer les vidéos
        for video in videos:
            PostFile.objects.create(
                post=post,
                file=video,
                file_type='video',
                name=video.name
            )
        
        # Gérer les fichiers audio
        for audio in audio_files:
            PostFile.objects.create(
                post=post,
                file=audio,
                file_type='audio',
                name=audio.name
            )
        
        # Gérer les documents
        for document in documents:
            PostFile.objects.create(
                post=post,
                file=document,
                file_type='document',
                name=document.name
            )
        
        return post
    
    def validate_category_id(self, value):
        try:
            Category.objects.get(id=value,is_active=True)
            return value
        except Category.DoesNotExist:
            raise serializers.ValidationError(f"Catégorie avec ID {value} n'existe pas")

class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'image', 'uploaded_at', 'order']
        read_only_fields = ['uploaded_at']



class PostSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username')
    user_profile_image = serializers.SerializerMethodField()
    user_profile_id = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    total_ratings = serializers.IntegerField(read_only=True)
    user_rating = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=True
    )
    mentions = UserSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        source='tags',
        queryset=Tag.objects.all(),
        write_only=True,
        required=False
    )
    image_url = serializers.SerializerMethodField()
    post_images = PostImageSerializer(many=True, read_only=True)
    post_files = PostFileSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()
    user_can_edit = serializers.SerializerMethodField()
    user_can_delete = serializers.SerializerMethodField()
    category_details = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    category_hierarchy = serializers.SerializerMethodField()
    
    # ✅ NOUVEAU CHAMP: Boost status
    is_boosted = serializers.SerializerMethodField()
    boost_details = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'is_owner', 'comments_count', 'user_can_edit', 'user_can_delete',
            'id', 'title', 'content', 'user', 'user_name', 'user_profile_image',
            'user_profile_id', 'category_id', 'average_rating', 'total_ratings',
            'user_rating', 'image', 'image_url', 'link',
            'mentions', 'tags', 'created_at', 'updated_at', 'category', 
            'post_images', 'tag_ids', 'post_files', 'category_details', 'category_hierarchy',
            'is_boosted', 'boost_details',  # ✅ Nouveaux champs
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'average_rating', 'total_ratings']
    
    def get_user_profile_image(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.image:
            return obj.user.profile.image.url
        return None
    
    def get_user_profile_id(self, obj):
        if hasattr(obj.user, 'profile'):
            return obj.user.profile.id
        return None
    
    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = Rating.objects.get(post=obj, user=request.user)
                return rating.stars
            except Rating.DoesNotExist:
                return None
        return None
    
    def get_tags(self, obj):
        """Retourne seulement les noms des tags"""
        return list(obj.tags.values_list('name', flat=True))
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
 
    def get_is_owner(self, obj):
        request = self.context.get('request')
        print(f"🔍 [POST SERIALIZER] get_is_owner - Post ID: {obj.id}")
        print(f"🔍 [POST SERIALIZER] Request exists: {'YES' if request else 'NO'}")
        print(f"🔍 [POST SERIALIZER] User authenticated: {'YES' if request and request.user.is_authenticated else 'NO'}")
        
        if request and request.user.is_authenticated:
            is_owner = obj.user == request.user
            print(f"🔍 [POST SERIALIZER] Is owner? {is_owner} (Post user: {obj.user.id}, Request user: {request.user.id})")
            return is_owner
        
        print(f"🔍 [POST SERIALIZER] Returning False")
        return False 
    
    def get_user_can_edit(self, obj):
        """Vérifie si l'utilisateur courant peut éditer le post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # L'auteur peut éditer, les admins aussi
            return obj.user == request.user or request.user.is_staff or request.user.is_superuser
        return False
    
    def get_user_can_delete(self, obj):
        """Vérifie si l'utilisateur courant peut supprimer le post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # L'auteur peut supprimer, les admins aussi
            return obj.user == request.user or request.user.is_staff or request.user.is_superuser
        return False
       
    def get_category_details(self, obj):
        """Retourne les détails complets de la catégorie"""
        return CategorySerializer(obj.category, context=self.context).data
    
    def get_category_hierarchy(self, obj):
        """Retourne la hiérarchie complète de la catégorie"""
        def get_hierarchy(category):
            if not category:
                return []
            
            hierarchy = []
            current = category
            
            while current:
                hierarchy.insert(0, {
                    'id': current.id,
                    'name': current.name,
                    'image_url': self.get_category_image_url(current)
                })
                current = current.parent
            
            return hierarchy
        
        return get_hierarchy(obj.category)
    
    def get_category_image_url(self, category):
        """Helper pour obtenir l'URL de l'image d'une catégorie"""
        if category and category.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(category.image.url)
            return category.image.url
        return None
    
    def get_comments_count(self, obj):
        """Retourne le nombre de commentaires pour ce post"""
        return obj.post_comments.count()
    
    # ✅ NOUVELLES MÉTHODES POUR LE BOOST
    def get_is_boosted(self, obj):
        """
        Vérifie si le post est actuellement boosté
        Deux méthodes possibles:
        1. Via le contexte (boost_info fourni par la vue)
        2. Via une vérification directe en base de données
        """
        # Méthode 1: Via le contexte (préférée pour les listes)
        boost_info = self.context.get('boost_info', {})
        if boost_info and obj.id in boost_info:
            return boost_info[obj.id].get('is_boosted', False)
        
        # Méthode 2: Vérification directe en base de données
        # (Utile quand on récupère un seul post)
        try:
            # Vérifier si le post a un SponsoredPost actif
            if hasattr(obj, 'sponsored_post'):
                sponsored_post = obj.sponsored_post
                return sponsored_post.is_active()
            
            # Sinon, vérifier directement
            sponsored_post = SponsoredPost.objects.filter(
                original_post=obj,
                payment_status='paid',
                boost_start__lte=timezone.now(),
                boost_end__gte=timezone.now(),
                campaign__status='active'
            ).first()
            
            return sponsored_post is not None
            
        except Exception as e:
            # En cas d'erreur, retourner False
            return False
    
    def get_boost_details(self, obj):
        """
        Retourne les détails du boost si le post est boosté
        """
        # Méthode 1: Via le contexte
        boost_info = self.context.get('boost_info', {})
        if boost_info and obj.id in boost_info:
            boost_data = boost_info[obj.id]
            
            # Calculer le temps restant
            boost_until = boost_data.get('boost_until')
            if boost_until:
                now = timezone.now()
                if boost_until > now:
                    time_remaining = boost_until - now
                    days_remaining = time_remaining.days
                    hours_remaining = time_remaining.seconds // 3600
                else:
                    days_remaining = 0
                    hours_remaining = 0
            else:
                days_remaining = 0
                hours_remaining = 0
            
            return {
                'type': boost_data.get('boost_type'),
                'type_display': self._format_boost_type(boost_data.get('boost_type')),
                'multiplier': boost_data.get('boost_multiplier'),
                'multiplier_display': f"{boost_data.get('boost_multiplier', 1)}x",
                'until': boost_until,
                'days_remaining': days_remaining,
                'hours_remaining': hours_remaining,
                'always_on_top': boost_data.get('always_on_top', False),
                'priority': boost_data.get('boost_priority', 0),
                'sponsored_post_id': boost_data.get('sponsored_post_id'),
                'price': boost_data.get('price'),
                'status': boost_data.get('payment_status', 'paid'),
                'is_active': True if days_remaining > 0 or hours_remaining > 0 else False
            }
        
        # Méthode 2: Vérification directe
        try:
            # Chercher un SponsoredPost actif pour ce post
            sponsored_post = None
            
            if hasattr(obj, 'sponsored_post'):
                sponsored_post = obj.sponsored_post
            else:
                sponsored_post = SponsoredPost.objects.filter(
                    original_post=obj,
                    payment_status='paid',
                    boost_start__lte=timezone.now(),
                    boost_end__gte=timezone.now(),
                    campaign__status='active'
                ).first()
            
            if not sponsored_post:
                return None
            
            # Calculer le temps restant
            now = timezone.now()
            if sponsored_post.boost_end > now:
                time_remaining = sponsored_post.boost_end - now
                days_remaining = time_remaining.days
                hours_remaining = time_remaining.seconds // 3600
            else:
                days_remaining = 0
                hours_remaining = 0
            
            return {
                'type': sponsored_post.post_type,
                'type_display': self._format_boost_type(sponsored_post.post_type),
                'multiplier': float(sponsored_post.boost_multiplier),
                'multiplier_display': f"{sponsored_post.boost_multiplier}x",
                'until': sponsored_post.boost_end,
                'boost_start': sponsored_post.boost_start,
                'days_remaining': days_remaining,
                'hours_remaining': hours_remaining,
                'always_on_top': sponsored_post.always_on_top,
                'sponsored_post_id': sponsored_post.id,
                'price': float(sponsored_post.price) if sponsored_post.price else 0,
                'status': sponsored_post.payment_status,
                'campaign_id': sponsored_post.campaign.id if sponsored_post.campaign else None,
                'is_active': True if days_remaining > 0 or hours_remaining > 0 else False
            }
            
        except Exception as e:
            # En cas d'erreur, retourner None
            return None
    
    def _format_boost_type(self, boost_type):
        """
        Formate le type de boost pour l'affichage
        """
        if not boost_type:
            return "Boost"
        
        boost_type_lower = boost_type.lower()
        
        type_mapping = {
            'standard': 'Standard Boost',
            'premium': 'Premium Boost',
            'featured': 'Featured Boost',
            'spotlight': 'Spotlight Boost',
            'standard_7': 'Standard Boost (7 days)',
            'premium_14': 'Premium Boost (14 days)',
            'featured_7': 'Featured Boost (7 days)',
            'spotlight_7': 'Spotlight Boost (7 days)',
        }
        
        return type_mapping.get(boost_type_lower, boost_type.replace('_', ' ').title())
# Serializer détaillé pour un post spécifique
class PostDetailSerializer(PostSerializer):
    ratings = RatingSerializer(many=True, read_only=True)
    rating_distribution = serializers.SerializerMethodField()
    
    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['ratings', 'rating_distribution', 'updated_at']
    
    def get_rating_distribution(self, obj):
        """Calculer la distribution des notes (1-5 étoiles)"""
        from django.db.models import Count
        
        # Récupérer les ratings de ce post
        ratings_qs = obj.ratings.all() if hasattr(obj, 'ratings') else Rating.objects.filter(post=obj)
        
        # Compter les ratings par nombre d'étoiles
        distribution = ratings_qs.values('stars').annotate(
            count=Count('stars')
        ).order_by('stars')
        
        # Initialiser le dictionnaire
        result = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        
        # Remplir avec les valeurs réelles
        for item in distribution:
            stars = item['stars']
            count = item['count']
            if 1 <= stars <= 5:
                result[stars] = count
        
        return result

# Serializer simplifié pour la liste des posts
# Dans PostListSerializer, ajoutez ces champs :
# Dans PostListSerializer, modifiez comme suit :
class PostListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username')
    user_profile_image = serializers.SerializerMethodField()
    user_profile_id = serializers.SerializerMethodField()
    
    # Champs de permission
    is_owner = serializers.SerializerMethodField()
    user_can_edit = serializers.SerializerMethodField()
    user_can_delete = serializers.SerializerMethodField()
    
    # Ratings
    average_rating = serializers.FloatField(read_only=True)
    total_ratings = serializers.IntegerField(read_only=True)
    calculated_rating = serializers.SerializerMethodField()
    calculated_rating_count = serializers.SerializerMethodField()
    engagement_score = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    
    # Category
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_details = serializers.SerializerMethodField()
    category_hierarchy = serializers.SerializerMethodField()
    
    # Images et fichiers
    image_url = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    
    # Tags
    tags = TagSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    post_images = PostImageSerializer(many=True, read_only=True)
    post_files = PostFileSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    comments_count = serializers.SerializerMethodField()
    recommendation_score = serializers.FloatField(read_only=True, required=False)
    user_has_viewed = serializers.SerializerMethodField()
    user_has_rated = serializers.BooleanField(read_only=True)
    user_rating_value = serializers.FloatField(read_only=True, required=False)
    user_has_commented = serializers.BooleanField(read_only=True)
    
    # Scores détaillés (optionnel, pour le debug)
    country_score = serializers.FloatField(read_only=True, required=False)
    category_similarity = serializers.FloatField(read_only=True, required=False)
    tag_similarity = serializers.FloatField(read_only=True, required=False)
    freshness_score = serializers.FloatField(read_only=True, required=False)
    
    # ✅ NOUVEAUX CHAMPS: Boost status
    is_boosted = serializers.SerializerMethodField()
    boost_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'comments_count',
            # Identifiants
            'id', 'title', 'content', 'user_id',
            'recommendation_score',
            'user_has_viewed',  
            'user_has_rated', 'user_rating_value',
            'user_has_commented', 'country_score', 'category_similarity',
            'tag_similarity', 'freshness_score',
            
            # User info
            'user_name', 'user_profile_image', 'user_profile_id',
            
            # Permissions
            'is_owner', 'user_can_edit', 'user_can_delete',
            
            # Ratings
            'average_rating', 'total_ratings', 'calculated_rating', 
            'calculated_rating_count', 'engagement_score', 'user_rating',
            
            # Category
            'category', 'category_name', 'category_details', 'category_hierarchy',
            
            # Media
            'image_url', 'files', 'link', 'post_images', 'post_files', 'comments_count',
            
            # Dates et tags
            'created_at', 'tags',
            
            # ✅ Boost fields
            'is_boosted', 'boost_details'
        ]
    
    def get_user_profile_image(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.image:
            request = self.context.get('request')
            if request and obj.user.profile.image:
                return request.build_absolute_uri(obj.user.profile.image.url)
            return obj.user.profile.image.url
        return None
    
    def get_user_profile_id(self, obj):
        if hasattr(obj.user, 'profile'):
            return obj.user.profile.id
        return None
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False
    
    def get_user_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user or request.user.is_staff or request.user.is_superuser
        return False
    
    def get_comments_count(self, obj):
        """Retourne le nombre de commentaires pour ce post"""
        return obj.post_comments.count()
    
    def get_user_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user or request.user.is_staff or request.user.is_superuser
        return False
    
    def get_category_details(self, obj):
        if obj.category:
            return CategorySerializer(obj.category, context=self.context).data
        return None
    
    def get_category_hierarchy(self, obj):
        def get_hierarchy(category):
            if not category:
                return []
            
            hierarchy = []
            current = category
            
            while current:
                hierarchy.insert(0, {
                    'id': current.id,
                    'name': current.name,
                    'image_url': self.get_category_image_url(current)
                })
                current = current.parent
            
            return hierarchy
        
        return get_hierarchy(obj.category)
    
    def get_category_image_url(self, category):
        if category and category.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(category.image.url)
            return category.image.url
        return None
    
    def get_calculated_rating(self, obj):
        if hasattr(obj, 'calculated_avg_rating'):
            return float(obj.calculated_avg_rating)
        elif hasattr(obj, 'avg_rating'):
            return float(obj.avg_rating)
        return getattr(obj, 'average_rating', 0.0)
    
    def get_calculated_rating_count(self, obj):
        if hasattr(obj, 'calculated_rating_count'):
            return obj.calculated_rating_count
        elif hasattr(obj, 'rating_count'):
            return obj.rating_count
        return getattr(obj, 'total_ratings', 0)
    
    def get_engagement_score(self, obj):
        rating_count = self.get_calculated_rating_count(obj)
        rating_avg = self.get_calculated_rating(obj)
        
        import math
        if rating_count > 0:
            return rating_avg * math.log(rating_count + 1)
        return 0
    
    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = Rating.objects.get(post=obj, user=request.user)
                return {
                    'id': rating.id,
                    'stars': rating.stars,
                    'created_at': rating.created_at
                }
            except Rating.DoesNotExist:
                return None
        return None
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request and obj.image:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_files(self, obj):
        post_files = obj.post_files.all()
        if post_files.exists():
            request = self.context.get('request')
            files_data = []
            for file in post_files[:3]:
                file_info = {
                    'id': file.id,
                    'name': file.name,
                    'file_type': file.file_type,
                    'file_type_display': file.get_file_type_display(),
                }
                
                if file.file:
                    if request:
                        file_info['file_url'] = request.build_absolute_uri(file.file.url)
                    else:
                        file_info['file_url'] = file.file.url
                
                files_data.append(file_info)
            return files_data
        return None
        
    def get_user_has_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.post_views.filter(user=request.user).exists()
        return False
    
    def get_user_has_rated(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.ratings.filter(user=request.user).exists()
        return False

     # ✅ MÉTHODE SIMPLIFIÉE POUR is_boosted
    def get_is_boosted(self, obj):
        """
        Vérifie si le post est boosté - VERSION FIABLE
        """
        # Méthode 1: Vérifier l'attribut direct sur l'objet
        if hasattr(obj, 'is_boosted'):
            return obj.is_boosted
        
        # Méthode 2: Vérifier via le contexte
        boost_info = self.context.get('boost_info', {})
        if boost_info and obj.id in boost_info:
            return boost_info[obj.id].get('is_boosted', False)
        
        # Méthode 3: Vérifier si c'est le premier spotlight
        spotlight_first = self.context.get('spotlight_first')
        if spotlight_first and obj.id == spotlight_first:
            return True
        
        # Par défaut, non boosté
        return False
    
    # ✅ MÉTHODE CORRIGÉE POUR boost_details
    def get_boost_details(self, obj):
        """
        Retourne les détails du boost - VERSION SIMPLIFIÉE ET FIABLE
        """
        # Si le post n'est pas boosté, retourner None
        if not self.get_is_boosted(obj):
            return None
        
        # Récupérer les données depuis les attributs directs
        boost_data = {}
        
        # D'abord essayer depuis les attributs de l'objet
        if hasattr(obj, 'boost_type'):
            boost_data = {
                'type': getattr(obj, 'boost_type', 'standard'),
                'type_display': self._format_boost_type(getattr(obj, 'boost_type', 'standard')),
                'multiplier': getattr(obj, 'boost_multiplier', 1.0),
                'multiplier_display': f"{getattr(obj, 'boost_multiplier', 1.0)}x",
                'until': getattr(obj, 'boost_until', None),
                'days_remaining': getattr(obj, 'boost_days_remaining', 0),
                'hours_remaining': getattr(obj, 'boost_hours_remaining', 0),
                'always_on_top': getattr(obj, 'always_on_top', False),
                'is_spotlight': getattr(obj, 'is_spotlight', False),
                'is_first_spotlight': getattr(obj, 'is_first_spotlight', False),
                'sponsored_post_id': getattr(obj, 'sponsored_post_id', None),
                'is_active': True if getattr(obj, 'boost_days_remaining', 0) > 0 else False,
                'color': self._get_boost_color(getattr(obj, 'boost_type', 'standard'))
            }
        
        # Sinon, essayer depuis le contexte
        elif self.context.get('boost_info') and obj.id in self.context['boost_info']:
            context_data = self.context['boost_info'][obj.id]
            
            # Calculer le temps restant
            boost_until = context_data.get('boost_until')
            days_remaining = 0
            hours_remaining = 0
            
            if boost_until:
                from django.utils import timezone
                now = timezone.now()
                if boost_until > now:
                    time_remaining = boost_until - now
                    days_remaining = time_remaining.days
                    hours_remaining = time_remaining.seconds // 3600
            
            boost_data = {
                'type': context_data.get('boost_type', 'standard'),
                'type_display': self._format_boost_type(context_data.get('boost_type', 'standard')),
                'multiplier': context_data.get('boost_multiplier', 1.0),
                'multiplier_display': f"{context_data.get('boost_multiplier', 1.0)}x",
                'until': boost_until,
                'days_remaining': days_remaining,
                'hours_remaining': hours_remaining,
                'always_on_top': context_data.get('always_on_top', False),
                'is_spotlight': context_data.get('is_spotlight', False),
                'is_first_spotlight': context_data.get('is_first_spotlight', False),
                'sponsored_post_id': context_data.get('sponsored_post_id'),
                'is_active': days_remaining > 0,
                'color': self._get_boost_color(context_data.get('boost_type', 'standard'))
            }
        
        return boost_data if boost_data else None
    
    def _format_boost_type(self, boost_type):
        """Formate le type de boost pour l'affichage"""
        if not boost_type:
            return "Boost"
        
        type_mapping = {
            'standard': 'Standard Boost',
            'premium': 'Premium Boost',
            'featured': 'Featured Boost',
            'spotlight': 'Spotlight Boost',
            'standard_7': 'Standard Boost (7 days)',
            'premium_14': 'Premium Boost (14 days)',
            'featured_7': 'Featured Boost (7 days)',
            'spotlight_7': 'Spotlight Boost (7 days)',
        }
        
        boost_type_lower = str(boost_type).lower()
        return type_mapping.get(boost_type_lower, str(boost_type).replace('_', ' ').title())
    
    def _get_boost_color(self, boost_type):
        """Retourne une couleur CSS pour le type de boost"""
        if not boost_type:
            return '#1976d2'
        
        boost_type_lower = str(boost_type).lower()
        color_mapping = {
            'standard': '#1976d2',
            'standard_7': '#1976d2',
            'premium': '#ff9800',
            'premium_14': '#ff9800',
            'featured': '#9c27b0',
            'featured_7': '#9c27b0',
            'spotlight': '#f44336',
            'spotlight_7': '#f44336',
        }
        
        return color_mapping.get(boost_type_lower, '#1976d2')    
    def _get_boost_color(self, boost_type):
        """
        Retourne une couleur CSS associée au type de boost
        Utile pour le frontend
        """
        if not boost_type:
            return '#1976d2'  # Blue default
        
        boost_type_lower = str(boost_type).lower()
        
        color_mapping = {
            'standard': '#1976d2',  # Blue
            'standard_7': '#1976d2',
            'premium': '#ff9800',   # Orange
            'premium_14': '#ff9800',
            'featured': '#9c27b0',  # Purple
            'featured_7': '#9c27b0',
            'spotlight': '#f44336', # Red
            'spotlight_7': '#f44336',
        }
        
        return color_mapping.get(boost_type_lower, '#1976d2')

# Dans serializers.py
class PostUpdateSerializer(serializers.ModelSerializer):
    """Serializer spécifique pour la mise à jour de posts avec fichiers"""
    
    category_id = serializers.IntegerField(write_only=True, required=False)
    images = serializers.ListField(
        child=serializers.ImageField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
    videos = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
    audio = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
    documents = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        allow_empty=True
    )
    # Pour supprimer des médias existants
    delete_images = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    delete_files = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Post
        fields = [
            'title', 'content', 'category_id', 'link', 'image',
            'images', 'videos', 'audio', 'documents',
            'delete_images', 'delete_files'
        ]
        extra_kwargs = {
            'title': {'required': False},
            'content': {'required': False},
            'link': {'required': False, 'allow_blank': True},
            'image': {'required': False}
        }
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        # Extraire les données pour les fichiers
        images = validated_data.pop('images', [])
        videos = validated_data.pop('videos', [])
        audio_files = validated_data.pop('audio', [])
        documents = validated_data.pop('documents', [])
        delete_images = validated_data.pop('delete_images', [])
        delete_files = validated_data.pop('delete_files', [])
        
        # Mise à jour de la catégorie si fournie
        if 'category_id' in validated_data:
            category_id = validated_data.pop('category_id')
            try:
                category = Category.objects.get(id=category_id)
                instance.category = category
            except Category.DoesNotExist:
                pass
        
        # Mise à jour des autres champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Supprimer les images existantes si demandé
        if delete_images:
            PostImage.objects.filter(id__in=delete_images, post=instance).delete()
        
        # Supprimer les fichiers existants si demandé
        if delete_files:
            PostFile.objects.filter(id__in=delete_files, post=instance).delete()
        
        # Gérer les nouvelles images
        if images:
            # Si on ajoute une image et qu'il n'y a pas d'image principale, utiliser la première
            if not instance.image and images:
                instance.image = images[0]
                instance.save()
            
            # Déterminer l'ordre de départ
            last_order = PostImage.objects.filter(post=instance).order_by('-order').first()
            start_order = last_order.order + 1 if last_order else 0
            
            # Créer les nouvelles images
            for i, image in enumerate(images):
                PostImage.objects.create(
                    post=instance,
                    image=image,
                    order=start_order + i
                )
        
        # Gérer les nouveaux fichiers
        def create_post_file(file, file_type):
            PostFile.objects.create(
                post=instance,
                file=file,
                file_type=file_type,
                name=file.name
            )
        
        for video in videos:
            create_post_file(video, 'video')
        
        for audio in audio_files:
            create_post_file(audio, 'audio')
        
        for document in documents:
            create_post_file(document, 'document')
        
        return instance
    

# In serializers.py - Modifier le CategorySerializer

class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        required=False, 
        allow_null=True
    )
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    parent_details = serializers.SerializerMethodField()
    subcategories = serializers.SerializerMethodField()
    has_subcategories = serializers.BooleanField(read_only=True)
    full_path = serializers.CharField(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'image', 'image_url', 
            'parent', 'parent_name', 'parent_details', 
            'subcategories', 'order', 'is_active',
            'has_subcategories', 'full_path', 'posts_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_parent_details(self, obj):
        if obj.parent:
            return {
                'id': obj.parent.id,
                'name': obj.parent.name,
                'image_url': self.get_image_url(obj.parent)
            }
        return None
    
    def get_subcategories(self, obj):
        # Récupérer uniquement les sous-catégories actives
        subcategories = obj.subcategories.filter(is_active=True).order_by('order', 'name')
        serializer = CategorySerializer(subcategories, many=True, context=self.context)
        return serializer.data

# Serializer simplifié pour les listes
class CategoryListSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    has_subcategories = serializers.BooleanField(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'image', 'image_url', 'parent', 
            'parent_name', 'has_subcategories', 'posts_count',
            'order', 'is_active'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

# Serializer pour la création/mise à jour avec image base64
class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    image = Base64ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'image', 'parent', 
            'order', 'is_active'
        ]
    
    def validate_parent(self, value):
        """Empêcher les cycles dans l'arborescence"""
        instance = self.instance
        
        if instance and value:
            # Vérifier qu'on ne crée pas un cycle
            current = value
            while current:
                if current == instance:
                    raise serializers.ValidationError(
                        "Impossible de définir cette catégorie comme parente : cycle détecté"
                    )
                if current.parent:
                    current = current.parent
                else:
                    break
        
        return value
    
    def validate(self, data):
        """Validation supplémentaire"""
        # Vérifier l'unicité du nom dans la même hiérarchie
        name = data.get('name')
        parent = data.get('parent')
        instance = self.instance
        
        if name:
            # Rechercher une catégorie avec le même nom et le même parent
            queryset = Category.objects.filter(name=name.lower().strip(), parent=parent)
            
            # Exclure l'instance courante lors de l'update
            if instance:
                queryset = queryset.exclude(id=instance.id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'name': 'Une catégorie avec ce nom existe déjà dans cette hiérarchie'
                })
        
        return data
    


# serializers.py - Serializers pour le système de publicité

class AdCampaignSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    remaining_budget = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    target_categories = CategorySerializer(many=True, read_only=True)
    target_tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = AdCampaign
        fields = [
            'id', 'user', 'name', 'description', 'budget', 'spent', 'remaining_budget',
            'start_date', 'end_date', 'target_categories', 'target_tags',
            'priority', 'status', 'impressions', 'clicks', 'conversions',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'spent', 'impressions', 'clicks', 'conversions']

class SponsoredPostSerializer(serializers.ModelSerializer):
    original_post = PostListSerializer(read_only=True)
    campaign = AdCampaignSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    post = serializers.SerializerMethodField()
    
    class Meta:
        model = SponsoredPost
        fields = [
            'id', 'original_post', 'campaign', 'post_type', 'price',
            'payment_status', 'boost_start', 'boost_end', 'boost_multiplier',
            'always_on_top', 'featured_in_feed', 'featured_in_category',
            'boosted_views', 'boosted_clicks', 'boosted_engagement',
            'is_active', 'days_remaining', 'post', 'created_at', 'updated_at'
        ]
        read_only_fields = ['boosted_views', 'boosted_clicks', 'boosted_engagement']
    
    def get_post(self, obj):
        """Retourne les données du post original enrichies"""
        post = obj.original_post
        serializer = PostListSerializer(post, context=self.context)
        data = serializer.data
        data['is_sponsored'] = True
        data['sponsored_type'] = obj.post_type
        data['sponsored_until'] = obj.boost_end
        data['boost_multiplier'] = obj.boost_multiplier
        return data

class SponsoredPostCreateSerializer(serializers.ModelSerializer):
    post_id = serializers.IntegerField(write_only=True)
    campaign_id = serializers.IntegerField(write_only=True)
    boost_days = serializers.IntegerField(write_only=True, min_value=1, max_value=30)
    
    class Meta:
        model = SponsoredPost
        fields = [
            'post_id', 'campaign_id', 'post_type', 'price',
            'boost_days', 'boost_multiplier', 'always_on_top',
            'featured_in_feed', 'featured_in_category'
        ]
    
    def validate(self, data):
        request = self.context.get('request')
        post_id = data.get('post_id')
        campaign_id = data.get('campaign_id')
        
        # Vérifier que le post existe et appartient à l'utilisateur
        try:
            post = Post.objects.get(id=post_id)
            if post.user != request.user:
                raise serializers.ValidationError({
                    "post_id": "Vous n'êtes pas l'auteur de ce post"
                })
        except Post.DoesNotExist:
            raise serializers.ValidationError({
                "post_id": "Post non trouvé"
            })
        
        # Vérifier la campagne
        try:
            campaign = AdCampaign.objects.get(id=campaign_id, user=request.user)
            if not campaign.is_active():
                raise serializers.ValidationError({
                    "campaign_id": "Campagne non active"
                })
        except AdCampaign.DoesNotExist:
            raise serializers.ValidationError({
                "campaign_id": "Campagne non trouvée"
            })
        
        data['post'] = post
        data['campaign'] = campaign
        return data
    
    def create(self, validated_data):
        post = validated_data.pop('post')
        campaign = validated_data.pop('campaign')
        boost_days = validated_data.pop('boost_days')
        
        # Calculer les dates de boost
        now = timezone.now()
        boost_start = now
        boost_end = now + timedelta(days=boost_days)
        
        # Créer le post sponsorisé
        sponsored_post = SponsoredPost.objects.create(
            original_post=post,
            campaign=campaign,
            boost_start=boost_start,
            boost_end=boost_end,
            **validated_data
        )
        
        return sponsored_post

# serializers.py
class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    # For post boost payments
    sponsored_post = serializers.PrimaryKeyRelatedField(
        queryset=SponsoredPost.objects.all(),
        required=False,
        allow_null=True
    )
    post = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(),
        required=False,
        allow_null=True
    )
    campaign = serializers.PrimaryKeyRelatedField(
        queryset=AdCampaign.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_id', 'payment_type', 'payment_type_display',
            'stripe_customer_id', 'stripe_subscription_id',
            'stripe_payment_intent_id', 'stripe_checkout_session_id',
            'plan_type', 'sponsored_post', 'post', 'campaign',
            'amount', 'currency', 'status', 'status_display',
            'payment_date', 'subscription_start', 'subscription_end',
            'boost_start', 'boost_end', 'metadata',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'payment_date',
            'is_active', 'payment_type_display', 'status_display'
        ]
    
    def validate(self, data):
        """Validate payment data based on payment type"""
        payment_type = data.get('payment_type', self.instance.payment_type if self.instance else None)
        
        if payment_type == 'certification':
            if not data.get('plan_type'):
                raise serializers.ValidationError({
                    'plan_type': 'Plan type is required for certification payments'
                })
        
        elif payment_type == 'post_boost':
            if not data.get('sponsored_post') and not data.get('post'):
                raise serializers.ValidationError({
                    'sponsored_post': 'Either sponsored_post or post is required for post boost payments'
                })
        
        return data
    
    def create(self, validated_data):
        """Create payment with automatic user assignment"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        
        # Set payment date if status is completed
        if validated_data.get('status') == 'completed':
            validated_data['payment_date'] = timezone.now()
        
        payment = super().create(validated_data)
        
        # Process payment if completed
        if payment.status == 'completed':
            payment.process_payment_success()
        
        return payment

class PostBoostPaymentSerializer(serializers.Serializer):
    """Serializer for creating post boost payments"""
    post_id = serializers.IntegerField(required=True)
    boost_type = serializers.ChoiceField(
        choices=['standard', 'premium', 'featured', 'spotlight'],
        required=True
    )
    boost_days = serializers.IntegerField(min_value=1, max_value=30, default=7)
    always_on_top = serializers.BooleanField(default=False)
    
    def validate_post_id(self, value):
        """Validate post exists and belongs to user"""
        request = self.context.get('request')
        try:
            post = Post.objects.get(id=value)
            if post.user != request.user:
                raise serializers.ValidationError("You can only boost your own posts")
            return value
        except Post.DoesNotExist:
            raise serializers.ValidationError("Post not found")
    
    def create(self, validated_data):
        """Create payment for post boost"""
        request = self.context.get('request')
        post_id = validated_data['post_id']
        boost_type = validated_data['boost_type']
        boost_days = validated_data['boost_days']
        
        # Get post
        post = Post.objects.get(id=post_id)
        
        # Create sponsored post first
        from .models import SponsoredPost, AdCampaign
        
        # Create or get campaign
        campaign, created = AdCampaign.objects.get_or_create(
            user=request.user,
            name=f"Post Boost - {post.title}",
            defaults={
                'budget': 1000.00,
                'status': 'active',
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=365)
            }
        )
        
        # Prices by type
        prices = {
            'standard': 10.00,
            'premium': 25.00,
            'featured': 50.00,
            'spotlight': 100.00,
        }
        
        # Multipliers by type
        multipliers = {
            'standard': 1.5,
            'premium': 2.0,
            'featured': 3.0,
            'spotlight': 5.0,
        }
        
        # Create sponsored post
        sponsored_post = SponsoredPost.objects.create(
            original_post=post,
            campaign=campaign,
            post_type=boost_type,
            price=prices[boost_type],
            boost_start=timezone.now(),
            boost_end=timezone.now() + timedelta(days=boost_days),
            boost_multiplier=multipliers[boost_type],
            always_on_top=validated_data['always_on_top'],
            featured_in_feed=True,
            payment_status='pending'
        )
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            payment_type='post_boost',
            sponsored_post=sponsored_post,
            post=post,
            campaign=campaign,
            amount=prices[boost_type],
            currency='USD',
            status='pending',
            boost_start=timezone.now(),
            boost_end=timezone.now() + timedelta(days=boost_days),
            metadata={
                'boost_type': boost_type,
                'boost_days': boost_days,
                'always_on_top': validated_data['always_on_top'],
                'multiplier': multipliers[boost_type]
            }
        )
        
        return {
            'payment_id': payment.id,
            'sponsored_post_id': sponsored_post.id,
            'amount': prices[boost_type],
            'boost_type': boost_type,
            'boost_days': boost_days,
            'multiplier': multipliers[boost_type]
        }