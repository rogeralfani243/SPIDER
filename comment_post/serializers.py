from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Comment
from post.models import Post
import os

User = get_user_model()

# serializers.py - Correction du CommentUserSerializer

class CommentUserSerializer(serializers.ModelSerializer):
    """Serializer léger pour les infos utilisateur dans les commentaires"""
    profile_picture = serializers.SerializerMethodField()
    profile_id = serializers.SerializerMethodField()  # AJOUTEZ CE CHAMP!
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture', 'profile_id']  # Ajoutez profile_id
    
    def get_profile_picture(self, obj):
        if hasattr(obj, 'profile') and obj.profile.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.image.url)
            return obj.profile.image.url
        return None
    
    def get_profile_id(self, obj):  # NOUVELLE MÉTHODE
        """Retourne l'ID du profil, pas l'ID utilisateur"""
        if hasattr(obj, 'profile'):
            return obj.profile.id
        return None  # ou return obj.id si vous n'avez pas de modèle Profile séparé

class CommentSerializer(serializers.ModelSerializer):
    """Serializer principal pour les commentaires"""
    user = CommentUserSerializer(read_only=True)
    post_id = serializers.SerializerMethodField()
    parent_comment_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    # Permission fields for frontend
    is_owner = serializers.SerializerMethodField()
    is_post_owner = serializers.SerializerMethodField()
    user_can_pin = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    
    likes_count = serializers.IntegerField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    
    # Pour les réponses imbriquées
    replies = serializers.SerializerMethodField()
    total_comments_count = serializers.SerializerMethodField()
    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'post_id', 'parent_comment_id', 'content',
            'image', 'video', 'file', 'mentions', 'likes_count', 'reply_count',
            'is_edited', 'is_pinned', 'post',
            'is_owner', 'is_post_owner', 'user_can_pin', 'has_liked',
            'replies','total_comments_count','user_id',
            'created_at', 'updated_at', 'edited_at', 'depth'
        ]
        read_only_fields = [
            'id', 'user', 'is_edited', 'is_pinned', 'likes_count', 'total_comments_count',
            'reply_count', 'created_at', 'updated_at', 'edited_at', 'depth'
        ]
    
    def get_is_owner(self, obj):
        """Check if current user is the comment author"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user.id == request.user.id
        return False
    
    def get_is_post_owner(self, obj):
        """Check if current user is the post author"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 🔥 CORRECTION: Use obj.post.user (not obj.post.author)
            return obj.post.user == request.user
        return False
    def get_total_replies_count(self, obj):
        """Retourne le nombre TOTAL de réponses (incluant les réponses des réponses)"""
        # Méthode simple: compter récursivement
        def count_all_replies(comment):
            total = comment.comment_replies.count()  # Réponses directes
            for reply in comment.comment_replies.all():
                total += count_all_replies(reply)  # Réponses des réponses
            return total
        
        return count_all_replies(obj)
    def get_user_can_pin(self, obj):
        """Check if current user can pin this comment"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 🔥 CORRECTION: Post authors can pin (using post.user)
            if obj.post.user == request.user:
                return True
            # Staff and superusers can pin
            if request.user.is_staff or request.user.is_superuser:
                return True
            # Admins can pin (if you have custom permissions)
            if hasattr(request.user, 'is_admin') and request.user.is_admin:
                return True
        return False
    
    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user_has_liked(request.user)
        return False
    def get_post_id(self, obj):
        """Get post ID"""
        return obj.post.id
    def get_replies(self, obj):
        """Récupérer les réponses de manière récursive si demandé"""
        request = self.context.get('request')
        if request and request.query_params.get('include_replies') == 'true':
            replies = obj.get_replies()[:5]  # Limiter pour éviter la surcharge
            return CommentSerializer(replies, many=True, context={'request': request}).data
        return []
    def get_total_comments_count(self, obj):
        """Retourne le nombre TOTAL de commentaires + réponses pour CE commentaire"""
        # Cette méthode compte: ce commentaire + toutes ses réponses récursivement
        def count_all(comment):
            total = 1  # Ce commentaire
            # Ajouter toutes les réponses
            for reply in comment.comment_replies.all():
                total += count_all(reply)
            return total
        return count_all(obj)
    def validate_content(self, value):
        """Valider le contenu du commentaire"""
        if len(value) > 5000:
            raise serializers.ValidationError("Comment is too long (max 5000 characters)")
        return value

class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de commentaires"""
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())
    parent_comment = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(), 
        required=False, 
        allow_null=True
    )
    image = serializers.ImageField(
        required=False,
        allow_null=True,
        max_length=255000  # Augmenter à 255 caractères
    )
    
    video = serializers.FileField(
        required=False,
        allow_null=True,
        max_length=255000  # Augmenter à 255 caractères
    )
    
    file = serializers.FileField(
        required=False,
        allow_null=True,
        max_length=255000  # Augmenter à 255 caractères
    )
    
    class Meta:
        model = Comment
        fields = ['content', 'post', 'parent_comment', 'image', 'video', 'file']
        
    def validate(self, data):
        """Validation supplémentaire"""
        # Vérifier que le parent_comment appartient au bon post
        if 'parent_comment' in data and data['parent_comment']:
            if data['parent_comment'].post.id != data['post'].id:
                raise serializers.ValidationError({
                    "parent_comment": "Parent comment must belong to the same post"
                })
        
        # 🔥 IMPORTANT: Raccourcir le nom de fichier si trop long
        for field in ['image', 'video', 'file']:
            if field in data and data[field]:
                file_obj = data[field]
                if len(file_obj.name) > 100:
                    # Raccourcir le nom de fichier
                    name, ext = os.path.splitext(file_obj.name)
                    if len(name) > 95:
                        name = name[:95]
                    new_name = f"{name}{ext}"
                    file_obj.name = new_name
        
        # IMPORTANT MODIFICATION: Permettre le contenu vide si un fichier est présent
        content = data.get('content', '')
        has_file = any([
            data.get('image'), 
            data.get('video'), 
            data.get('file')
        ])
        
        # Si pas de fichier et contenu vide → erreur
        if not has_file and not content.strip():
            raise serializers.ValidationError({
                "content": "Comment content cannot be empty unless you attach a file"
            })
        
        # Si contenu trop long → erreur
        if content and len(content) > 5000:
            raise serializers.ValidationError({
                "content": "Comment is too long (max 5000 characters)"
            })
        
        return data
    
    def create(self, validated_data):
        print(f"\n=== CREATING COMMENT ===")
        print(f"Validated data before removing user: {validated_data}")
        
        # RETIRER 'user' s'il est présent (il ne devrait pas l'être)
        validated_data.pop('user', None)
        validated_data.pop('ip_address', None)
        validated_data.pop('user_agent', None)
        
        print(f"Validated data after cleaning: {validated_data}")
        
        # Récupérer les données supplémentaires du contexte
        user = self.context.get('user', self.context['request'].user)
        ip_address = self.context.get('ip_address', '')
        user_agent = self.context.get('user_agent', '')
        
        # Créer le commentaire
        comment = Comment.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            **validated_data
        )
        
        print(f"Created comment ID: {comment.id}")
        print(f"Parent comment: {comment.parent_comment}")
        print(f"Is reply? {comment.parent_comment is not None}")
        
        # Mettre à jour le compteur de réponses
        if comment.parent_comment:
            parent = comment.parent_comment
            parent.reply_count = Comment.objects.filter(parent_comment=parent).count()
            parent.save()
            print(f"Updated parent {parent.id} reply_count to {parent.reply_count}")
        
        return comment

class CommentUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des commentaires"""
    image = serializers.ImageField(
        required=False,
        allow_null=True,
        max_length=255000  # Augmenter à 255 caractères
    )
    
    video = serializers.FileField(
        required=False,
        allow_null=True,
        max_length=255000  # Augmenter à 255 caractères
    )
    
    file = serializers.FileField(
        required=False,
        allow_null=True,
        max_length=255000  # Augmenter à 255 caractères
    )
    
    class Meta:
        model = Comment
        fields = ['content', 'image', 'video', 'file']
    
    def validate(self, data):
        """Validation pour la mise à jour"""
        # Raccourcir le nom de fichier si nécessaire
        for field in ['image', 'video', 'file']:
            if field in data and data[field]:
                file_obj = data[field]
                if len(file_obj.name) > 100:
                    name, ext = os.path.splitext(file_obj.name)
                    if len(name) > 95:
                        name = name[:95]
                    new_name = f"{name}{ext}"
                    file_obj.name = new_name
        
        # Vérifier le contenu
        content = data.get('content', '')
        if content and len(content) > 5000:
            raise serializers.ValidationError({
                "content": "Comment is too long (max 5000 characters)"
            })
        
        return data
    
    def update(self, instance, validated_data):
        instance.is_edited = True
        instance.edited_at = timezone.now()
        return super().update(instance, validated_data)

class CommentLikeSerializer(serializers.Serializer):
    """Serializer pour les likes de commentaires"""
    action = serializers.ChoiceField(choices=['like', 'unlike'])