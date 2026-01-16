from rest_framework import serializers

# models.Post 
from app.models import Post

#models.Rating
from .models import Rating

class RatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Rating 
        fields = ['id', 'user', 'user_name', 'post', 'stars', 'created_at']
        read_only_fields = ['user', 'post']


