# serializers.py
from rest_framework import serializers
from comment_post.models import Comment

class CommentAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'created_at', 'updated_at', 'edited_at',
            'is_edited', 'is_pinned', 'is_hidden', 'is_spam',
            'likes_count', 'reply_count', 'depth'
        ]

class CommentDetailAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = '__all__'