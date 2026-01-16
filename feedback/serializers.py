# serializers.py
from rest_framework import serializers
from .models import Feedback
from django.contrib.auth import get_user_model

User = get_user_model()

class FeedbackSerializer(serializers.ModelSerializer):
    # Informations sur l'auteur du feedback
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_image = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    # Informations sur le profile cible (professional)
    profile_id = serializers.IntegerField(source='user.profile.id', read_only=True)
    profile_name = serializers.CharField(source='professional.username', read_only=True)
    
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
            'profile_id', 'profile_name',
            # Champs de fonctionnalité
            'helpful_count', 'is_helpful',
            # Métadonnées
            'created_at', 'updated_at', 'is_owner'
        ]
        read_only_fields = [
            'id', 'user_id', 'user_name', 'user_image',
            'profile_id', 'profile_name', 'helpful_count',
            'is_helpful', 'created_at', 'updated_at', 'is_owner'
        ]
    
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

class FeedbackUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['rating', 'comment']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value