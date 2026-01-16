from rest_framework import serializers
from .models import Post, Comment, Category, Tag, Profile
from accounts.serializers import UserSerializer
from django.contrib.auth.models import User 
from django.contrib.auth import authenticate
from django.utils import timezone 
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    mentions = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'user', 'image', 'link', 'files', 'created_at', 'updated_at', 'like', 'category', 'mentions', 'tags']     
class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = serializers.PrimaryKeyRelatedField(read_only=True)
    parent_comment = serializers.PrimaryKeyRelatedField(read_only=True)
    replies = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    mentions = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'post', 'parent_comment', 'content', 'image',
            'video', 'file', 'mentions', 'likes_count', 'reply_count',
            'is_edited', 'is_pinned', 'is_hidden', 'is_spam',
            'created_at', 'updated_at', 'edited_at', 'path', 'depth',
            'replies', 'is_liked'
        ]
        # IMPORTANT: Désactive les champs automatiques pour les ManyToManyField
        extra_kwargs = {
            'mentions': {'read_only': True},
        }
    
    def get_mentions(self, obj):
        # Utilise le queryset directement
        return [user.username for user in obj.mentions.all()] if hasattr(obj, 'mentions') and hasattr(obj.mentions, 'all') else []
    
    def get_replies(self, obj):
        if obj.depth < 3:
            # Utilise le related_name correct
            replies = obj.comment_replies.all().order_by('created_at')[:5]
            return CommentSerializer(replies, many=True, context=self.context).data
        return []
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(obj, 'likes') and hasattr(obj.likes, 'filter'):
                return obj.likes.filter(id=request.user.id).exists()
        return False           
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Champs utilisateur à travers la relation
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    social_links = serializers.JSONField(required=False, default=list)
    # Champs pour l'édition
    user_first_name = serializers.CharField(
        source='user.first_name',
        required=False,
         allow_blank=True,
        write_only=True
    )
    user_last_name = serializers.CharField(
        source='user.last_name',
        required=False,
         allow_blank=True,
        write_only=True
    )
    user_email = serializers.EmailField(
        source='user.email',
        required=False,
         allow_blank=True,
        write_only=True
    )
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 
            'username', 'email', 'first_name', 'last_name',  # Lecture seule
            'user_first_name', 'user_last_name', 'user_email',  # Écriture
            'bio', 'image', 'image_bio', 'website', 'location',
            'address', 'city', 'state', 'zip_code', 'country',
            'birth_date', 'followers', 'category', 'category_id',
            'created_at', 'image_url','social_links'
        ]
        read_only_fields = ['id', 'user', 'followers', 'created_at']
    
    def to_representation(self, instance):
        """Override pour gérer l'affichage des catégories"""
        representation = super().to_representation(instance)
        
        # Si la catégorie est None, laisser un champ vide
        if representation['category'] is None:
            representation['category'] = {}
        
        return representation
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    def update(self, instance, validated_data):
        """Mise à jour du profil et de l'utilisateur associé"""
        # Extraire les données utilisateur si présentes
        user_data = validated_data.pop('user', {})
        
        # Mettre à jour les champs du profil
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Mettre à jour les champs de l'utilisateur
        if user_data:
            user = instance.user
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            if 'email' in user_data:
                user.email = user_data['email']
            user.save()
        
        instance.save()
        return instance


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la mise à jour du profil"""
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Profile
        fields = [
            'bio', 'image', 'image_bio', 'website', 'location',
            'address', 'city', 'state', 'zip_code', 'country',
            'birth_date', 'category_id','social_links'
        ]
    
    def update(self, instance, validated_data):
        # Gérer la catégorie
        if 'category' in validated_data:
            category = validated_data['category']
            instance.category = category
        
        # Mettre à jour les autres champs
        for attr, value in validated_data.items():
            if attr != 'category':  # On a déjà traité la catégorie
                setattr(instance, attr, value)
        
        instance.save()
        return instance

class UserUpdateSerializer(serializers.ModelSerializer):
    # Optionnel : tu peux afficher le profil en lecture seule
    profile = ProfileUpdateSerializer(read_only=True)

    class Meta:
        model = User
        fields = [ 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(required=True, write_only=True)
    password_confirm = serializers.CharField(required=True, write_only=True)
    first_name = serializers.CharField(required=False, max_length=30)
    last_name = serializers.CharField(required=False, max_length=150)

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("This username is already taken.")
        if data.get('email') and User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("This email is already taken.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)

        # ✅ UTILISE BIEN create_user ici
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
    

# serializers.py
from rest_framework import serializers
from .models import Post, Tag, Comment, Profile
from django.contrib.auth import get_user_model

User = get_user_model()

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    profile_image = serializers.ImageField(source='image')
    
    class Meta:
        model = Profile
        fields = ['username', 'profile_image']

# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs"""
    profile_picture = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'date_joined', 'last_login', 'is_active', 'is_staff',
            'profile_picture', 'full_name', 'is_current_user'
        ]
        read_only_fields = fields
    
    def get_profile_picture(self, obj):
        """Obtenir l'URL de la photo de profil"""
        request = self.context.get('request')
        
        # Vérifier si le modèle User a un champ profile_picture
        if hasattr(obj, 'profile_picture') and obj.profile_picture:
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        
        # Vérifier si le modèle User a un profil lié
        if hasattr(obj, 'profile') and hasattr(obj.profile, 'image'):
            if obj.profile.image:
                if request:
                    return request.build_absolute_uri(obj.profile.image.url)
                return obj.profile.image.url
        
        # Photo par défaut
        if request:
            return request.build_absolute_uri('/static/default-avatar.png')
        return '/static/default-avatar.png'
    
    def get_full_name(self, obj):
        """Obtenir le nom complet"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        return obj.username
    
    def get_is_current_user(self, obj):
        """Vérifier si c'est l'utilisateur courant"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.id == request.user.id
        return False

class CurrentUserSerializer(serializers.ModelSerializer):
    """Serializer spécifique pour l'utilisateur connecté"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']