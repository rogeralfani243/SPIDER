# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Report, ReportAction, ReportType, ReportStatus, ContentType
from messaging.models import Message,Conversation
from post.models import Post
from comment_post.models import Comment
from app.models import Profile
from feedback.models import Feedback

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ContentPreviewSerializer(serializers.Serializer):
    """Sérialiseur pour prévisualiser le contenu signalé"""
    id = serializers.IntegerField()
    type = serializers.CharField()
    preview = serializers.CharField()
    author = serializers.DictField(required=False)
    created_at = serializers.DateTimeField(required=False)

class ReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    reviewer = UserSerializer(read_only=True, source='reviewed_by')
    reported_content = serializers.SerializerMethodField()
    content_author = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()
    
    # Champs d'affichage pour les choix
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'content_type', 'content_type_display',
            'content_id', 'report_type', 'report_type_display',
            'reason', 'status', 'status_display', 'reviewer',
            'reviewed_at', 'moderator_notes', 'action_taken',
            'created_at', 'updated_at', 'reported_content',
            'content_author', 'can_moderate', 'actions'
        ]
        read_only_fields = [
            'id', 'reporter', 'created_at', 'updated_at', 
            'actions', 'reviewer', 'reviewed_at', 'moderator_notes',
            'action_taken', 'content_type_display', 'report_type_display',
            'status_display', 'reported_content', 'content_author', 'can_moderate'
        ]
        # ⚠️ IMPORTANT: Ne pas inclure les champs ForeignKey dans fields
    
    def get_reported_content(self, obj):
        """Serialize reported content based on type"""
        try:
            content = obj.get_reported_content()
            if not content:
                return None
            
            content_data = {
                'id': content.id,
                'type': obj.content_type,
                'preview': str(content)[:100] if str(content) else '',
            }
            
            # Add author if available
            author = obj.get_content_author()
            if author:
                content_data['author'] = {
                    'id': author.id,
                    'username': author.username
                }
            
            # Add creation date if available
            if hasattr(content, 'created_at'):
                content_data['created_at'] = content.created_at
            
            return content_data
        except Exception:
            return None
    
    def get_content_author(self, obj):
        """Get content author"""
        try:
            author = obj.get_content_author()
            if author:
                return {
                    'id': author.id,
                    'username': author.username
                }
            return None
        except Exception:
            return None
    
    def get_can_moderate(self, obj):
        """Check if user can moderate"""
        request = self.context.get('request')
        if request and request.user:
            return request.user.groups.filter(name='Moderators').exists() or request.user.is_staff
        return False
    
    def get_actions(self, obj):
        """Get associated actions"""
        try:
            actions = obj.actions.all().order_by('-performed_at')
            return ReportActionSerializer(actions, many=True, context=self.context).data
        except Exception:
            return []

class ReportActionSerializer(serializers.ModelSerializer):
    moderator = UserSerializer(read_only=True)
    report_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ReportAction
        fields = ['id', 'report_id', 'action_type', 'description', 
                 'moderator', 'duration_days', 'performed_at']
        read_only_fields = ['moderator', 'performed_at']

class ReportStatsSerializer(serializers.Serializer):
    """Sérialiseur pour les statistiques"""
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    under_review = serializers.IntegerField()
    resolved = serializers.IntegerField()
    dismissed = serializers.IntegerField()
    
    by_type = serializers.DictField()
    by_content = serializers.DictField()
    
    recent_week = serializers.IntegerField()
    recent_day = serializers.IntegerField()

# serializers.py - QuickReportSerializer corrigé
class QuickReportSerializer(serializers.Serializer):
    """Sérialiseur pour le signalement rapide - version corrigée"""
    content_type = serializers.ChoiceField(choices=ContentType.choices)
    content_id = serializers.IntegerField(min_value=1)
    report_type = serializers.ChoiceField(choices=ReportType.choices)
    
    def validate(self, data):
        """Validation du signalement rapide"""
        request = self.context.get('request')
        content_type = data['content_type']
        content_id = data['content_id']
        
        # Map content type to model
        content_map = {
            ContentType.MESSAGE: Message,
            ContentType.POST: Post,
            ContentType.COMMENT: Comment,
            ContentType.PROFILE: Profile,
            ContentType.FEEDBACK: Feedback,
            ContentType.CONVERSATION: Conversation,
        }
        
        model_class = content_map.get(content_type)
        if not model_class:
            raise serializers.ValidationError({
                'content_type': f'Type de contenu invalide: {content_type}'
            })
        
        try:
            content = model_class.objects.get(id=content_id)
        except model_class.DoesNotExist:
            # On ne lève pas d'erreur, on crée le signalement quand même
            # Le contenu peut avoir été supprimé entre-temps
            print(f"[WARNING] Content {content_type} with id {content_id} not found")
            data['content'] = None
            return data
        
        # Vérifier que l'utilisateur ne signale pas son propre contenu
        author = self._get_content_author(content, content_type)
        
        if author and author.id == request.user.id:
            raise serializers.ValidationError("Vous ne pouvez pas signaler votre propre contenu")
        
        data['content'] = content
        return data
    
    def _get_content_author(self, content, content_type):
        """Méthode robuste pour trouver l'auteur"""
        if content_type == ContentType.MESSAGE:
            return getattr(content, 'sender', 
                   getattr(content, 'user', 
                   getattr(content, 'author', None)))
        elif content_type in [ContentType.POST, ContentType.COMMENT]:
            return getattr(content, 'user', 
                   getattr(content, 'author', 
                   getattr(content, 'created_by', None)))
        elif content_type == ContentType.PROFILE:
            return getattr(content, 'user', None)
        elif content_type == ContentType.FEEDBACK:
            return getattr(content, 'user', 
                   getattr(content, 'author', 
                   getattr(content, 'rater', None)))
        elif content_type == ContentType.CONVERSATION:
            return getattr(content, 'sender', 
                   getattr(content, 'user', 
                   getattr(content, 'author', None)))
        return None
    
class MyReportsSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour mes reports"""
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    content_type_display = serializers.CharField(source='get_content_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'content_type', 'content_type_display',
            'content_id', 'report_type', 'report_type_display',
            'reason', 'status', 'status_display',
            'created_at', 'updated_at',
            'reviewed_at', 'action_taken'
        ]
        read_only_fields = fields 