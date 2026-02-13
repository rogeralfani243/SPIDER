from rest_framework import serializers
from .models import Profile, Certification, Payment,CertificationType, IDVerificationRequest
from django.contrib.auth.models import User
from app.models import Profile
from django.utils import timezone 
from django.conf import settings
class CertificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificationType
        fields = '__all__'

class CertificationSerializer(serializers.ModelSerializer):
    certification_type_detail = CertificationTypeSerializer(source='certification_type', read_only=True)
    
    class Meta:
        model = Certification
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

# serializers.py
class IDVerificationRequestSerializer(serializers.ModelSerializer):
    # Déclarez explicitement les champs de fichiers
    document_front = serializers.FileField(required=True)
    document_back = serializers.FileField(required=False, allow_null=True)
    selfie_with_id = serializers.FileField(required=True)
    
    class Meta:
        model = IDVerificationRequest
        fields = [
            'id',
            'id_type',
            'id_number', 
            'document_front', 
            'document_back', 
            'selfie_with_id', 
            'additional_notes',
            'status',
            'submitted_at',
            'updated_at',
            'reviewed_by',
            'reviewed_at',
            'rejection_reason'
        ]
        read_only_fields = ('profile', 'submitted_at', 'updated_at', 'reviewed_by', 'reviewed_at', 'status')
    
    def create(self, validated_data):
        # Récupérer le profile depuis le contexte
        profile = self.context['profile']
        
        # Créer la demande avec le profile
        verification_request = IDVerificationRequest.objects.create(
            profile=profile,
            **validated_data
        )
        return verification_request
class ProfileSerializer(serializers.ModelSerializer):
    certifications = CertificationSerializer(many=True, read_only=True)
    has_premium = serializers.SerializerMethodField()
    has_fire = serializers.SerializerMethodField()
    has_verified = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = '__all__'
    
    def get_has_premium(self, obj):
        return obj.certifications.filter(
            certification_type__name='premium',
            status='active',
            subscription_end__gt=timezone.now()
        ).exists()
    
    def get_has_fire(self, obj):
        return obj.certifications.filter(
            certification_type__name='fire',
            status='active'
        ).exists()
    
    def get_has_verified(self, obj):
        return obj.certifications.filter(
            certification_type__name='verified',
            status='active'
        ).exists()
    


class PaymentSerializer(serializers.ModelSerializer):
    amount_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'user',
            'stripe_customer_id',
            'stripe_subscription_id',
            'stripe_payment_intent_id',
            'stripe_checkout_session_id',
            'plan_type',
            'amount',
            'amount_display',
            'currency',
            'status',
            'status_display',
            'payment_date',
            'subscription_start',
            'subscription_end',
            'plan_name',
            'days_remaining',
            'is_active',
            'metadata',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ('user', 'created_at', 'updated_at')
    
    def get_amount_display(self, obj):
        return f"{obj.amount:.2f} {obj.currency}"
    
    def get_status_display(self, obj):
        return dict(Payment.STATUS_CHOICES).get(obj.status, obj.status)
    
    def get_plan_name(self, obj):
        return obj.metadata.get('plan_name', obj.plan_type.replace('_', ' ').title())
    
    def get_days_remaining(self, obj):
        if obj.subscription_end:
            remaining = (obj.subscription_end - timezone.now()).days
            return max(0, remaining)
        return None
    
    def get_is_active(self, obj):
        if obj.status != 'completed':
            return False
        if obj.subscription_end:
            return obj.subscription_end > timezone.now()
        return False