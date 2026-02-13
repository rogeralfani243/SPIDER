from django.utils import timezone
from django.db import models
import datetime
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from app.models import Profile
# models.py
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import logging
from post.models import AdCampaign, SponsoredPost,Post, Category
from comment_post.models import Comment

logger = logging.getLogger(__name__)

User = get_user_model()
# Importez vos modèles Post et Feedback
try:
    from post.models import Post
    from feedback.models import Feedback
    HAS_REQUIRED_MODELS = True
except ImportError:
    HAS_REQUIRED_MODELS = False
    Post = None
    Feedback = None


class CertificationType(models.Model):
    """Types de certification disponibles"""
    CERTIFICATION_TYPES = [
('premium', 'Premium - Paid subscription'),
('fire', 'Fire - High activity'),
('verified', 'Verified - Identity confirmed'),
('influencer', 'Influencer - High engagement'),

    ]
    
    name = models.CharField(max_length=50, choices=CERTIFICATION_TYPES, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=100, blank=True, null=True)
    color = models.CharField(max_length=20, default='#000000')
    duration_days = models.IntegerField(null=True, blank=True, help_text="Durée en jours pour expiration automatique")
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.get_name_display()
    
    def save(self, *args, **kwargs):
        # Définir la durée par défaut pour chaque type
        if not self.duration_days:
            if self.name == 'fire':
                self.duration_days = 30  # Expire après 30 jours
            elif self.name == 'premium':
                self.duration_days = 30  # Durée d'abonnement
        super().save(*args, **kwargs)


class Certification(models.Model):
    """Certifications attribuées aux utilisateurs"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('expired', 'Expired'),
        ('revoked', 'Revoked'),
    ]
    
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='certifications')
    certification_type = models.ForeignKey(CertificationType, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Pour premium : dates d'abonnement
    subscription_start = models.DateTimeField(null=True, blank=True)
    subscription_end = models.DateTimeField(null=True, blank=True)
    
    # Pour verified : info de vérification
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verified_certifications'
    )
    verification_method = models.CharField(max_length=50, blank=True, null=True)
    verification_doc_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Métriques pour fire certification
    activity_score = models.IntegerField(default=0)
    last_activity_check = models.DateTimeField(null=True, blank=True)
    
    # Ajout pour expiration automatique
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict, blank=True, null=True)
    class Meta:
        unique_together = ['profile', 'certification_type']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.profile.user.username} - {self.certification_type.name}"
    
    @property
    def is_expired(self):
        """Vérifie si la certification est expirée"""
        if self.certification_type.name == 'premium' and self.subscription_end:
            return timezone.now() > self.subscription_end
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @property
    def days_remaining(self):
        """Jours restants avant expiration"""
        if self.expires_at:
            remaining = self.expires_at - timezone.now()
            return max(0, remaining.days)
        return None
    
    def update_status(self):
        """Met à jour le statut automatiquement"""
        if self.is_expired and self.status != 'expired':
            self.status = 'expired'
            self.save(update_fields=['status', 'updated_at'])
            return True
        return False
    
    def save(self, *args, **kwargs):
        """Sauvegarde avec vérification automatique de l'expiration"""
        # Si c'est une nouvelle certification Fire, définir la date d'expiration
        if not self.pk and self.certification_type.name == 'fire' and self.certification_type.duration_days:
            self.expires_at = timezone.now() + datetime.timedelta(days=self.certification_type.duration_days)
        
        # Vérifier l'expiration avant de sauvegarder
        if self.is_expired and self.status != 'expired':
            self.status = 'expired'
        
        super().save(*args, **kwargs)
        
        # Après sauvegarde, vérifier si on peut attribuer d'autres certifications
        if self.certification_type.name != 'fire':
            check_fire_certification_after_save(self.profile)


class IDVerificationRequest(models.Model):
    """Demandes de vérification d'identité"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('under_review', 'Under Review'),
    ]
    
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='id_verification')
    id_card_front = models.ImageField(upload_to='verification_ids/front/')
    id_card_back = models.ImageField(upload_to='verification_ids/back/', null=True, blank=True)
    selfie_with_id = models.ImageField(upload_to='verification_ids/selfie/', null=True, blank=True)
    
    full_name = models.CharField(max_length=255)
    id_number = models.CharField(max_length=100)
    id_type = models.CharField(max_length=50)
    date_of_birth = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_verifications'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Vérification de {self.profile.user.username} - {self.status}"
    
    def approve(self, reviewer):
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save()
        
        # Créer la certification verified
        certification_type, _ = CertificationType.objects.get_or_create(
            name='verified',
            defaults={
                'description': 'Identité vérifiée par pièce officielle',
                'icon': 'verified_user',
                'color': '#1DA1F2'
            }
        )
        
        Certification.objects.update_or_create(
            profile=self.profile,
            certification_type=certification_type,
            defaults={
                'status': 'active',
                'verified_at': timezone.now(),
                'verified_by': reviewer,
                'verification_method': self.id_type,
                'verification_doc_id': self.id_number
            }
        )


# ===========================================
# FONCTIONS UTILITAIRES ET SIGNALS
# ===========================================

def check_fire_certification_after_save(profile):
    """
    Vérifie et attribue automatiquement la certification Fire
    après la sauvegarde d'une autre certification
    """
    try:
        # Vérifier si l'utilisateur a déjà une certification Fire active
        existing_fire = Certification.objects.filter(
            profile=profile,
            certification_type__name='fire',
            status='active'
        ).first()
        
        if existing_fire:
            # Vérifier si elle n'est pas expirée
            if not existing_fire.is_expired:
                # Vérifier si le score doit être mis à jour
                week_ago = timezone.now() - datetime.timedelta(days=7)
                user = profile.user
                
                post_count = Post.objects.filter(
                    user=user,
                    created_at__gte=week_ago
                ).count()
                
                comment_count = Feedback.objects.filter(
                    user=user,
                    created_at__gte=week_ago
                ).count()
                
                rating_count = Feedback.objects.filter(
                    user=user,
                    created_at__gte=week_ago,
                    rating__isnull=False
                ).count()
                
                # Mettre à jour le score
                new_score = (post_count * 10) + (comment_count * 5) + (rating_count * 20)
                if existing_fire.activity_score != new_score:
                    existing_fire.activity_score = new_score
                    existing_fire.last_activity_check = timezone.now()
                    existing_fire.save()
                    print(f"✅ Score Fire mis à jour pour {user.username}: {new_score} points")
                return False
        
        # Vérifier les critères d'activité
        if HAS_REQUIRED_MODELS and profile.user:
            user = profile.user
            
            # Période d'analyse (7 derniers jours)
            week_ago = timezone.now() - datetime.timedelta(days=7)
            
            # Compter les posts de la semaine
            post_count = Post.objects.filter(
                user=user,
                created_at__gte=week_ago
            ).count()
            
            # Compter les commentaires (Feedback)
            comment_count = Feedback.objects.filter(
                user=user,
                created_at__gte=week_ago
            ).count()
            
            # Compter les ratings (Feedback avec rating)
            rating_count = Feedback.objects.filter(
                user=user,
                created_at__gte=week_ago,
                rating__isnull=False
            ).count()
            
            print(f"📊 Vérification Fire pour {user.username}: {post_count} posts, {comment_count} commentaires, {rating_count} ratings")
            
            # CRITÈRES CORRIGÉS : 3 posts OU PLUS ET 3 commentaires OU PLUS
            qualifies = (post_count >= 1) and (comment_count >= 1)
            
            if qualifies:
                # Récupérer ou créer le type de certification Fire
                certification_type, _ = CertificationType.objects.get_or_create(
                    name='fire',
                    defaults={
                        'description': 'Utilisateur très actif et engagé',
                        'icon': 'whatshot',
                        'color': '#FF5722',
                        'duration_days': 30
                    }
                )
                
                # Calculer le score d'activité
                activity_score = (
                    post_count * 10 +      # 10 points par post
                    comment_count * 5 +    # 5 points par commentaire
                    rating_count * 20      # 20 points par rating
                )
                
                # Vérifier si une certification Fire existe déjà (expirée ou inactive)
                cert, created = Certification.objects.update_or_create(
                    profile=profile,
                    certification_type=certification_type,
                    defaults={
                        'status': 'active',
                        'activity_score': activity_score,
                        'last_activity_check': timezone.now(),
                        'expires_at': timezone.now() + datetime.timedelta(days=30)
                    }
                )
                
                print(f"✅ Certification Fire {'attribuée à' if created else 'mise à jour pour'} {user.username}")
                print(f"   📈 Détails: {post_count} posts, {comment_count} commentaires, {activity_score} points")
                return True
            else:
                print(f"❌ {user.username} ne remplit pas les critères: {post_count}/3 posts, {comment_count}/3 commentaires")
                
    except Exception as e:
        print(f"❌ Erreur lors de la vérification Fire: {str(e)}")
    
    return False

@receiver(post_save, sender=Profile)
def check_fire_on_profile_save(sender, instance, created, **kwargs):
    """
    Vérifie la certification Fire après la sauvegarde d'un profil
    """
    if not created:  # Seulement sur mise à jour, pas création
        check_fire_certification_after_save(instance)


# Signals pour vérifier après chaque post/commentaire
if HAS_REQUIRED_MODELS:
    
    @receiver(post_save, sender=Post)
    def check_fire_after_post(sender, instance, created, **kwargs):
        """Vérifie après chaque nouveau post"""
        if created and instance.user:
            try:
                profile = instance.user.profile
                check_fire_certification_after_save(profile)
            except Profile.DoesNotExist:
                pass
    
    @receiver(post_save, sender=Feedback)
    def check_fire_after_feedback(sender, instance, created, **kwargs):
        """Vérifie après chaque nouveau feedback/commentaire"""
        if created and instance.user:
            try:
                profile = instance.user.profile
                check_fire_certification_after_save(profile)
            except Profile.DoesNotExist:
                pass


def auto_check_all_fire_certifications():
    """
    Fonction pour vérifier automatiquement toutes les certifications Fire
    (À appeler via un cron job ou tâche planifiée)
    """
    results = {
        'granted': 0,
        'updated': 0,
        'expired': 0,
        'errors': 0
    }
    
    # Vérifier les certifications expirées
    fire_certs = Certification.objects.filter(
        certification_type__name='fire',
        status='active'
    )
    
    for cert in fire_certs:
        if cert.update_status():  # Met à jour si expiré
            results['expired'] += 1
    
    # Vérifier tous les profils pour attribution automatique
    profiles = Profile.objects.all()
    
    for profile in profiles:
        try:
            if check_fire_certification_after_save(profile):
                results['granted'] += 1
        except Exception as e:
            results['errors'] += 1
            print(f"Erreur pour {profile.user.username}: {str(e)}")
    
    return results


# Méthode utilitaire pour la classe Certification
def check_and_grant_fire_certification_method(self):
    """
    Méthode pour vérifier et attribuer la certification Fire
    (Peut être appelée depuis d'autres parties du code)
    """
    return check_fire_certification_after_save(self.profile)


# Ajout de la méthode à la classe Certification
Certification.check_and_grant_fire = check_and_grant_fire_certification_method


# models.py - Ajoutez ce modèle
class UserInteraction(models.Model):
    """
    Track user interactions for recommendation algorithm and analytics
    """
    INTERACTION_TYPES = [
        ('view', 'View'),
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('rating', 'Rating'),
        ('share', 'Share'),
        ('save', 'Save'),
        ('boost_purchase', 'Boost Purchase'),  # Nouveau type pour les boosts
        ('click', 'Click'),
        ('time_spent', 'Time Spent'),
        ('follow', 'Follow'),
        ('mention', 'Mention'),
        ('report', 'Report'),
        ('hide', 'Hide'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='certification_interactions'
    )
    
    # Content that was interacted with
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        related_name='certification_interactions',
        null=True, 
        blank=True
    )
    
    # For other types of content (optional)
    comment = models.ForeignKey(
        Comment,  # Vous aurez besoin de créer ce modèle si pas déjà fait
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='certification_interactions'
    )
    
    # For category interactions
    category = models.ForeignKey(
    Category,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='certification_interactions'
    )
    
    interaction_type = models.CharField(
        max_length=20,
        choices=INTERACTION_TYPES
    )
    
    # Value for quantitative interactions (rating stars, time in seconds, etc.)
    value = models.FloatField(null=True, blank=True)
    
    # Additional data in JSON format
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'interaction_type']),
            models.Index(fields=['post', 'interaction_type']),
            models.Index(fields=['user', 'post']),
            models.Index(fields=['created_at']),
        ]
        unique_together = [
            ('user', 'post', 'interaction_type'),  # Pour éviter les doublons
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_interaction_type_display()} - {self.post.title if self.post else 'N/A'}"
    
    def save(self, *args, **kwargs):
        # Normaliser le type d'interaction
        self.interaction_type = self.interaction_type.lower()
        
        # Pour les likes/views, vérifier les doublons
        if self.interaction_type in ['view', 'like']:
            # Vous pouvez ajouter une logique pour gérer les doublons si nécessaire
            pass
            
        super().save(*args, **kwargs)
    
    @classmethod
    def record_interaction(cls, user, interaction_type, post=None, comment=None, 
                          category=None, value=None, metadata=None):
        """
        Helper method to record interactions easily
        """
        # Vérifier si l'interaction existe déjà (pour certains types)
        if interaction_type in ['view', 'like'] and post and user:
            existing = cls.objects.filter(
                user=user,
                post=post,
                interaction_type=interaction_type
            ).first()
            
            if existing:
                # Mettre à jour l'existant au lieu de créer un nouveau
                if value is not None:
                    existing.value = value
                if metadata:
                    existing.metadata.update(metadata)
                existing.save()
                return existing
        
        # Créer une nouvelle interaction
        interaction = cls.objects.create(
            user=user,
            interaction_type=interaction_type,
            post=post,
            comment=comment,
            category=category,
            value=value,
            metadata=metadata or {}
        )
        
        # Mettre à jour les compteurs du post si nécessaire
        if post and interaction_type == 'like':
            post.refresh_from_db()  # Récupérer la dernière version
            # Vous pouvez mettre à jour un champ likes_count sur Post ici
        
        return interaction
    
    @property
    def interaction_weight(self):
        """
        Calculate weight for recommendation algorithm
        Different interactions have different weights
        """
        weights = {
            'boost_purchase': 10.0,  # Achat de boost = très important
            'rating': 5.0,           # Note
            'comment': 3.0,          # Commentaire
            'like': 2.0,             # Like
            'save': 2.0,             # Sauvegarde
            'share': 1.5,            # Partage
            'view': 1.0,             # Vue
            'click': 0.5,            # Clic
        }
        
        base_weight = weights.get(self.interaction_type, 1.0)
        
        # Ajuster avec la valeur si disponible
        if self.value is not None:
            if self.interaction_type == 'rating':
                # Les notes élevées pèsent plus
                base_weight *= (self.value / 5.0)
            elif self.interaction_type == 'time_spent':
                # Plus de temps passé = plus d'intérêt
                base_weight *= min(self.value / 60.0, 3.0)  # Max 3x pour 3+ minutes
        
        return base_weight

# models.py
class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('certification', 'Certification Premium'),
        ('post_boost', 'Post Boost'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('canceled', 'Canceled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    
    # Type de paiement
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='other')
    
    # Stripe fields
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True, null=True)
    
    # For certification payments
    plan_type = models.CharField(max_length=50, blank=True, null=True)
    
    # For post boost payments
    sponsored_post = models.ForeignKey(SponsoredPost, on_delete=models.SET_NULL, null=True, blank=True)
    campaign = models.ForeignKey(AdCampaign, on_delete=models.SET_NULL, null=True, blank=True)
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # For subscriptions
    subscription_start = models.DateTimeField(null=True, blank=True)
    subscription_end = models.DateTimeField(null=True, blank=True)
    
    # For post boosts
    boost_start = models.DateTimeField(null=True, blank=True)
    boost_end = models.DateTimeField(null=True, blank=True)
    
    # Métadonnées
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_checkout_session_id']),
            models.Index(fields=['stripe_customer_id']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_type']),
            models.Index(fields=['user', 'payment_type']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_payment_type_display()} - {self.amount}{self.currency}"
    
    @property
    def is_active(self):
        """Check if payment is active (for subscriptions or boosts)"""
        if self.payment_type == 'certification':
            if not self.subscription_end:
                return False
            return self.subscription_end > timezone.now() and self.status == 'completed'
        elif self.payment_type == 'post_boost':
            if not self.boost_end:
                return False
            return self.boost_end > timezone.now() and self.status == 'completed'
        return False
    
    def create_or_update_certification(self):
        """Create or update premium certification after payment"""
        if self.payment_type != 'certification':
            return None
            
        try:
            profile = self.user.profile
            
            certification_type, created = CertificationType.objects.get_or_create(
                name='premium',
                defaults={
                    'description': 'Premium subscription plan',
                    'icon': 'star',
                    'color': '#FFD700',
                }
            )
            
            # If user already has active premium certification, extend it
            existing_cert = Certification.objects.filter(
                profile=profile,
                certification_type=certification_type,
                status='active'
            ).first()
            
            if existing_cert and existing_cert.subscription_end > timezone.now():
                # Extend existing end date
                new_end_date = existing_cert.subscription_end + timedelta(
                    days=self.metadata.get('duration_days', 30)
                )
                existing_cert.subscription_end = new_end_date
                existing_cert.save()
                return existing_cert
            else:
                # Create new certification
                cert = Certification.objects.create(
                    profile=profile,
                    certification_type=certification_type,
                    status='active',
                    subscription_start=self.subscription_start or timezone.now(),
                    subscription_end=self.subscription_end,
                    metadata={
                        'payment_id': self.id,
                        'plan_type': self.plan_type,
                        'stripe_subscription_id': self.stripe_subscription_id,
                    }
                )
                return cert
        except Exception as e:
            logger.error(f"Error creating certification for payment {self.id}: {str(e)}")
            return None
    
    def activate_post_boost(self):
        """Activate post boost after payment"""
        if self.payment_type != 'post_boost' or not self.sponsored_post:
            return None
            
        try:
            # Update sponsored post status
            sponsored_post = self.sponsored_post
            sponsored_post.payment_status = 'paid'
            sponsored_post.paid_at = timezone.now()
            
            # Set boost dates from payment
            if self.boost_start:
                sponsored_post.boost_start = self.boost_start
            if self.boost_end:
                sponsored_post.boost_end = self.boost_end
                
            sponsored_post.save()
            
            # Create user interaction record
            UserInteraction.objects.create(
                user=self.user,
                post=self.post,
                interaction_type='boost_purchase',
                value=self.amount,
                created_at=timezone.now()
            )
            
            return sponsored_post
            
        except Exception as e:
            logger.error(f"Error activating post boost for payment {self.id}: {str(e)}")
            return None
    
    def process_payment_success(self):
        """Process successful payment based on type"""
        if self.status != 'completed':
            self.status = 'completed'
            self.payment_date = timezone.now()
            self.save()
        
        if self.payment_type == 'certification':
            return self.create_or_update_certification()
        elif self.payment_type == 'post_boost':
            return self.activate_post_boost()
        
        return None
    
    def get_payment_details(self):
        """Get payment details for display"""
        details = {
            'id': self.id,
            'payment_type': self.payment_type,
            'type_display': self.get_payment_type_display(),
            'amount': float(self.amount),
            'currency': self.currency,
            'status': self.status,
            'status_display': self.get_status_display(),
            'created_at': self.created_at,
            'payment_date': self.payment_date,
            'is_active': self.is_active,
        }
        
        if self.payment_type == 'certification':
            details.update({
                'plan_type': self.plan_type,
                'subscription_start': self.subscription_start,
                'subscription_end': self.subscription_end,
            })
        elif self.payment_type == 'post_boost':
            details.update({
                'post_id': self.post.id if self.post else None,
                'post_title': self.post.title if self.post else None,
                'sponsored_post_id': self.sponsored_post.id if self.sponsored_post else None,
                'boost_start': self.boost_start,
                'boost_end': self.boost_end,
                'campaign_id': self.campaign.id if self.campaign else None,
            })
        
        return details