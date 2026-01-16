# In serializers.py - Remove the duplicate RatingSerializer
from rest_framework import serializers
from .models import Post, Category, Tag, PostImage, PostFile
from feedback_post.models import Rating
from django.contrib.auth import get_user_model
import base64
from django.core.files.base import ContentFile

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
    class Meta:
        model = Post
        fields = [
             'is_owner', 'comments_count','user_can_edit', 'user_can_delete',
            'id', 'title', 'content', 'user', 'user_name', 'user_profile_image',
            'user_profile_id', 'category_id', 'average_rating', 'total_ratings',
            'user_rating', 'image', 'image_url', 'link',
            'mentions', 'tags', 'created_at', 'updated_at', 'category', 
            'post_images','tag_ids', 'post_files',  'category_details', 'category_hierarchy',
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
        # Option 1: Retourner les noms des tags
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
       # ✅ AJOUTEZ CETTE MÉTHODE
    def get_comments_count(self, obj):
        """Retourne le nombre de commentaires pour ce post"""
        return obj.post_comments.count()
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
    class Meta:
        model = Post
        fields = [
            'comments_count',
            # Identifiants
            'id', 'title', 'content', 'user_id',
            
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
            'image_url', 'files', 'link','post_images','post_files','comments_count',
      
            
            # Dates et tags
            'created_at', 'tags'
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
        # Compte tous les commentaires du post
        return obj.post_comments.count()
    
        return 0
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