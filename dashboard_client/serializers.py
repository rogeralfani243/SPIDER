# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from report.models import Report
from messaging.models import Message, Conversation
from app.models import Profile 
from comment_post.models import Comment
from post.models import Category, Tag 
from post.models import Post
from feedback.models import Feedback
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
# dashboard_client/views.py
from rest_framework import serializers
from report.models import Report

class SimpleReportSerializer(serializers.ModelSerializer):
    """
    Sérialiseur ultra-simple pour Report
    Évite complètement l'inspection automatique de DRF
    """
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 
            'reporter_username',
            'content_type',
            'content_id',
            'report_type',
            'reason',
            'status',
            'created_at',
            'updated_at'
        ]
        # NE PAS utiliser extra_kwargs ici
        
    def get_fields(self):
        """
        Surcharge pour définir explicitement les champs
        et éviter l'inspection automatique
        """
        fields = super().get_fields()
        
        # Force tous les champs à être en lecture seule pour l'instant
        for field_name in fields:
            fields[field_name].read_only = True
            
        return fields
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'bio', 'image', 'image_bio', 'website', 
            'location', 'address', 'city', 'state', 'zip_code', 
            'country', 'birth_date', 'followers_count', 'following_count',
            'category', 'created_at', 'is_active'
        ]
        read_only_fields = ['followers_count', 'following_count']
    
    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_following_count(self, obj):
        # CORRECTION: Utilise le bon nom de relation
        return obj.following.count()

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    # RETIRÉ: likes_count et is_liked car ton modèle Post n'a pas de champ likes
    average_rating = serializers.FloatField(read_only=True)
    mentions = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'user', 'average_rating', 'total_ratings',
            'image', 'link', 'created_at', 'updated_at', 'category',
            'tags', 'mentions', 'comments_count'  # RETIRÉ: 'likes_count', 'is_liked'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'average_rating', 'total_ratings']
    
    def get_tags(self, obj):
        # Utilise directement les tags du modèle
        return [tag.name for tag in obj.tags.all()] if obj.tags.exists() else []
    
    def get_mentions(self, obj):
        # Utilise directement les mentions du modèle
        return [user.username for user in obj.mentions.all()] if obj.mentions.exists() else []
    
    def get_comments_count(self, obj):
        # Utilise la relation définie dans ton modèle Comment (related_name='post_comments')
        return obj.post_comments.count()
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
        read_only_fields = ['user', 'post', 'parent_comment', 'likes_count', 'reply_count', 
                           'created_at', 'updated_at', 'path', 'depth', 'replies']
    
    def get_mentions(self, obj):
        # CORRECTION: Simplifié
        return [user.username for user in obj.mentions.all()] if obj.mentions.exists() else []
    
    def get_replies(self, obj):
        if obj.depth < 3:
            # CORRECTION: Utilise le bon related_name de ton modèle
            replies = obj.comment_replies.all().order_by('created_at')[:5]
            return CommentSerializer(replies, many=True, context=self.context).data
        return []
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # CORRECTION: Ton modèle Comment a bien un champ 'likes'
            return obj.likes.filter(id=request.user.id).exists()
        return False

class FeedbackSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    professional = UserSerializer(read_only=True)
    helpful_count = serializers.IntegerField(read_only=True)
    is_helpful = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'user', 'professional', 'rating', 'comment',
            'helpful_count', 'created_at', 'updated_at', 'is_helpful'
        ]
        read_only_fields = ['user', 'professional', 'helpful_count', 'created_at', 'updated_at']
    
    def get_is_helpful(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # CORRECTION: Ton modèle Feedback a bien un champ 'helpful_users'
            return obj.helpful_users.filter(id=request.user.id).exists()
        return False

class ReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True, allow_null=True)
    content_object = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'content_type', 'content_id',
            'message', 'post', 'comment', 'profile', 'feedback',
            'report_type', 'reason', 'status', 'reviewed_by',
            'reviewed_at', 'moderator_notes', 'action_taken',
            'created_at', 'updated_at', 'content_object'
        ]
        read_only_fields = ['reporter', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']
        # AJOUTE cette ligne pour désactiver la génération automatique des relations
        extra_kwargs = {
            'message': {'read_only': True},
            'post': {'read_only': True},
            'comment': {'read_only': True},
            'profile': {'read_only': True},
            'feedback': {'read_only': True},
        }
    
    def get_content_object(self, obj):
        try:
            if obj.post:
                return PostSerializer(obj.post, context=self.context).data
            elif obj.comment:
                return CommentSerializer(obj.comment, context=self.context).data
            elif obj.profile:
                return ProfileSerializer(obj.profile, context=self.context).data
            elif obj.feedback:
                return FeedbackSerializer(obj.feedback, context=self.context).data
            elif obj.message:
                # Format simple pour les messages
                return {
                    'id': obj.message.id,
                    'content': obj.message.content[:50] if obj.message.content else '',
                    'sender': obj.message.sender.username if obj.message.sender else None
                }
        except Exception:
            return None
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation_id', 'sender', 'content', 'timestamp',
            'is_read', 'image', 'file', 'message_type', 'is_system_message',
            'system_message_type'
        ]
        read_only_fields = ['sender', 'timestamp']

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'last_message', 'unread_count']
        read_only_fields = ['participants', 'created_at']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return {
                'content': last_msg.content[:50],
                'timestamp': last_msg.timestamp,
                'sender': last_msg.sender.username if last_msg.sender else None
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

class DashboardStatsSerializer(serializers.Serializer):
    followers_count = serializers.IntegerField()
    following_count = serializers.IntegerField()
    total_posts = serializers.IntegerField()
    total_comments_received = serializers.IntegerField()
    total_feedbacks_received = serializers.IntegerField()
    total_reports_made = serializers.IntegerField()
    unresolved_reports = serializers.IntegerField()
    messages_received = serializers.IntegerField()
    
class ActivitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.CharField()
    title = serializers.CharField()
    content = serializers.CharField()
    created_at = serializers.DateTimeField()
    user = UserSerializer()
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # CORRECTION: Vérifie le type d'instance
        if isinstance(instance, Post):
            data['type'] = 'post'
            data['title'] = instance.title
            data['content'] = instance.content[:100] if instance.content else ""
            data['user'] = UserSerializer(instance.user).data
            data['created_at'] = instance.created_at
        elif isinstance(instance, Comment):
            data['type'] = 'comment'
            post_title = instance.post.title[:30] if instance.post and instance.post.title else "Unknown"
            data['title'] = f"Comment on {post_title}..."
            data['content'] = instance.content[:100] if instance.content else ""
            data['user'] = UserSerializer(instance.user).data
            data['created_at'] = instance.created_at
        elif isinstance(instance, Feedback):
            data['type'] = 'feedback'
            data['title'] = f"Feedback - {instance.rating} stars"
            data['content'] = instance.comment[:100] if instance.comment else "No comment"
            data['user'] = UserSerializer(instance.user).data
            data['created_at'] = instance.created_at
        
        return data
    

# serializers.py - Ajoutez ce serializer
class DashboardReportSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les rapports dans le dashboard"""
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id',
            'report_type',
            'report_type_display',
            'content_type',
            'content_type_display',
            'content_id',
            'reason',
            'status',
            'status_display',
            'reporter_username',
            'created_at',
            'reviewed_at',
            'action_taken'
        ]


class FeedbackSerializer(serializers.ModelSerializer):
    # Informations sur l'auteur du feedback (celui qui donne)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_image = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    # Informations sur le profile cible (professional qui reçoit) - CORRIGÉ
    profile_id = serializers.IntegerField(source='professional.id', read_only=True)
    profile_name = serializers.SerializerMethodField()  # Changé en SerializerMethodField
    profile_first_name = serializers.SerializerMethodField()  # Changé en SerializerMethodField
    profile_image = serializers.SerializerMethodField()  # Ajouté
    # Champs fonctionnels
    is_owner = serializers.SerializerMethodField()
    is_helpful = serializers.SerializerMethodField()
    helpful_count = serializers.IntegerField(read_only=True)
    
    # Champ d'écriture pour la création
    profile = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Feedback
        fields = [
            'id', 
            # Champs d'écriture
            'profile', 'rating', 'comment',
            # Informations de l'auteur
            'user_id', 'user_name', 'user_image',
            # Informations du profile cible
            'profile_id', 'profile_name', 'profile_image', 'profile_first_name', # Ajouté profile_image
            # Champs de fonctionnalité
            'helpful_count', 'is_helpful',
            # Métadonnées
            'created_at', 'updated_at', 'is_owner'
        ]
        read_only_fields = [
            'id', 'user_id', 'user_name', 'user_image','profile_first_name',
            'profile_id', 'profile_name', 'profile_image', 'helpful_count',
            'is_helpful', 'created_at', 'updated_at', 'is_owner'
        ]
    
    def get_profile_id(self, obj):
        """Retourne l'ID du profile du professional (celui qui reçoit)"""
        try:
            if hasattr(obj.professional, 'profile') and obj.professional.profile:
                return obj.professional.profile.id
        except:
            pass
        return None

    def get_profile_image(self, obj):
        """Retourne l'image du profile du professional"""
        request = self.context.get('request')
        try:
            if hasattr(obj.professional, 'profile') and obj.professional.profile:
                profile = obj.professional.profile
                if profile.image:
                    if request:
                        return request.build_absolute_uri(profile.image.url)
                    return profile.image.url
        except:
            pass
        return None
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user.id == request.user.id
        return False
    
    def get_user_image(self, obj):
        request = self.context.get('request')
        try:
            if hasattr(obj.user, 'profile') and obj.user.profile:
                profile = obj.user.profile
                if profile.image:
                    if request:
                        return request.build_absolute_uri(profile.image.url)
                    return profile.image.url
        except:
            pass
        return None
    def get_profile_name(self, obj):
        """Retourne le username du profile"""
        try:
            if hasattr(obj.professional, 'profile') and obj.professional.profile:
                return obj.professional.profile.username  # Champ du modèle Profile
        except:
            pass
        return  obj.professional.username
    
    def get_profile_first_name(self, obj):
        """Retourne le first_name du profile"""
        try:
            if hasattr(obj.professional, 'profile') and obj.professional.profile:
                return obj.professional.profile.first_name  # Champ du modèle Profile
        except:
            pass
        return None
    def get_is_helpful(self, obj):
        """Détermine si l'utilisateur connecté a marqué ce feedback comme utile"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.is_helpful_by_user(request.user)
        return False
    
    def validate_profile(self, value):
        """Valider que le profile existe"""
        try:
            professional = User.objects.get(id=value)
            return professional
        except User.DoesNotExist:
            raise serializers.ValidationError("Professional not found")
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def create(self, validated_data):
        # Extraire le professional du champ 'profile'
        professional = validated_data.pop('profile')
        
        # Créer le feedback
        feedback = Feedback.objects.create(
            user=self.context['request'].user,
            professional=professional,
            rating=validated_data['rating'],
            comment=validated_data.get('comment', '')
        )
        return feedback