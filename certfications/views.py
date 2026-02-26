from django.utils import timezone
from django.db.models import Count, Q, Avg
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Profile, Certification, CertificationType, IDVerificationRequest
from .serializers import CertificationSerializer, IDVerificationRequestSerializer
from datetime import timedelta
import logging
from app.models import Profile
from post.models import Post
from feedback.models import Feedback
import uuid
logger = logging.getLogger(__name__)
from django.contrib.auth import get_user_model
from comment_post.models import Comment
from datetime import datetime


# views.py
import stripe
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

from .models import Payment, Profile, Certification, CertificationType
from .serializers import PaymentSerializer
User = get_user_model()
# Vous devrez implémenter cette fonction selon votre système d'abonnement
# Dans votre views.py ou un fichier utils.py
from django.utils import timezone
from datetime import timedelta
from .models import Payment

def check_user_subscription(user):
    """Vérifie si l'utilisateur a un abonnement actif via Stripe"""
    try:
        # Vérifier d'abord s'il y a des paiements actifs dans notre base
        active_payments = Payment.objects.filter(
            user=user,
            status='completed',
            subscription_end__gt=timezone.now()
        )
        
        if active_payments.exists():
            return True
        
        # Si pas de paiement en base, vérifier auprès de Stripe
        # (pour les cas où le webhook n'a pas encore traité le paiement)
        from django.conf import settings
        import stripe
        
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Chercher le dernier paiement de l'utilisateur
        last_payment = Payment.objects.filter(
            user=user,
            stripe_checkout_session_id__isnull=False
        ).order_by('-created_at').first()
        
        if last_payment and last_payment.stripe_checkout_session_id:
            # Vérifier le statut de la session Stripe
            session = stripe.checkout.Session.retrieve(
                last_payment.stripe_checkout_session_id
            )
            
            if session.payment_status == 'paid':
                # Mettre à jour le statut du paiement
                last_payment.status = 'completed'
                last_payment.payment_date = timezone.now()
                
                # Calculer les dates d'abonnement
                plan_config = settings.STRIPE_PLANS.get(last_payment.plan_type, {})
                duration_days = plan_config.get('duration_days', 30)
                last_payment.subscription_start = timezone.now()
                last_payment.subscription_end = timezone.now() + timedelta(days=duration_days)
                
                last_payment.save()
                
                # Créer la certification
                last_payment.create_or_update_certification()
                
                return True
        
        return False
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error checking user subscription: {str(e)}")
        return False

# ============================
# VUES PUBLIQUES / UTILISATEUR
# ============================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_certifications(request):
    """Récupérer les certifications de l'utilisateur connecté"""
    if request.user.is_staff:
        certifications = Certification.objects.all()
    else:
        certifications = Certification.objects.filter(profile__user=request.user)
    
    serializer = CertificationSerializer(certifications, many=True)
    return Response(serializer.data)
from rest_framework.permissions import AllowAny
@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def check_premium_eligibility(request):
    """Vérifier et attribuer la certification premium - CORRIGÉ"""
    try:
        user = request.user
        
        # 1. Vérifier si l'utilisateur a un profil
        if not hasattr(user, 'profile'):
            return Response({
                'status': 'error',
                'message': 'Profile not found'
            }, status=404)
        
        profile = user.profile
        
        # 2. Vérifier d'abord si l'utilisateur a déjà une certification premium active
        existing_premium = Certification.objects.filter(
            profile=profile,
            certification_type__name='premium',
            status='active'
        ).exclude(subscription_end__isnull=True) \
         .filter(subscription_end__gt=timezone.now()) \
         .first()
        
        if existing_premium:
            days_remaining = max(0, (existing_premium.subscription_end - timezone.now()).days)
            serializer = CertificationSerializer(existing_premium)
            return Response({
                'status': 'success',
                'message': 'Active premium subscription found',
                'certification': serializer.data,
                'days_remaining': days_remaining
            })
        
        # 3. Vérifier si l'utilisateur a un paiement actif
        active_payment = Payment.objects.filter(
            user=user,
            status='completed'
        ).exclude(subscription_end__isnull=True) \
         .filter(subscription_end__gt=timezone.now()) \
         .order_by('-created_at').first()
        
        if active_payment:
            # Récupérer ou créer le type de certification
            certification_type, _ = CertificationType.objects.get_or_create(
                name='premium',
                defaults={
                    'description': 'Active premium subscription',
                    'icon': 'premium',
                    'color': '#FFD700'
                }
            )
            
            # Déterminer les dates
            start_date = active_payment.subscription_start or timezone.now()
            end_date = active_payment.subscription_end or (start_date + timedelta(days=30))
            
            # Vérifier si une certification existe déjà
            cert = Certification.objects.filter(
                profile=profile,
                certification_type=certification_type
            ).first()
            
            if cert:
                # Mettre à jour la certification existante
                cert.status = 'active'
                cert.subscription_start = start_date
                cert.subscription_end = end_date
                # Mettre à jour les metadata sans écraser
                if not cert.metadata:
                    cert.metadata = {}
                cert.metadata.update({
                    'payment_id': active_payment.id,
                    'updated_via': 'eligibility_check',
                    'updated_at': timezone.now().isoformat()
                })
                cert.save()
                cert_created = False
            else:
                # Créer une nouvelle certification
                cert = Certification.objects.create(
                    profile=profile,
                    certification_type=certification_type,
                    status='active',
                    subscription_start=start_date,
                    subscription_end=end_date
                )
                # Ajouter les metadata
                cert.metadata = {
                    'payment_id': active_payment.id,
                    'plan_type': active_payment.plan_type,
                    'stripe_subscription_id': active_payment.stripe_subscription_id,
                    'created_via': 'eligibility_check',
                    'created_at': timezone.now().isoformat()
                }
                cert.save()
                cert_created = True
            
            days_remaining = max(0, (end_date - timezone.now()).days)
            serializer = CertificationSerializer(cert)
            
            return Response({
                'status': 'success',
                'message': 'Premium certification activated!' if cert_created else 'Premium certification updated',
                'certification': serializer.data,
                'created': cert_created,
                'days_remaining': days_remaining
            })
        
        # 4. Vérifier les paiements en attente
        pending_payments = Payment.objects.filter(
            user=user,
            status='pending'
        ).exists()
        
        if pending_payments:
            return Response({
                'status': 'pending',
                'message': 'Payment is being processed. Please wait a few moments.'
            }, status=202)
        
        return Response({
            'status': 'error',
            'message': 'No active subscription found'
        }, status=400)
        
    except Exception as e:
        logger.error(f"Error in check_premium_eligibility: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Certification, CertificationType

from .serializers import CertificationSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_fire_eligibility(request):
    user = request.user

    try:
        profile = user.profile
    except Profile.DoesNotExist:
        return Response({
            "status": "error",
            "message": "Profil non trouvé"
        }, status=404)

    week_ago = timezone.now() - timedelta(days=7)

    post_count = Post.objects.filter(
        user=user,
        created_at__gte=week_ago
    ).count()

    comment_count = Comment.objects.filter(
        user=user,
        created_at__gte=week_ago
    ).count()

    avg_rating = Feedback.objects.filter(
        user=user,
        created_at__gte=week_ago
    ).aggregate(avg=Avg("rating"))["avg"] or 0

    activity_score = (
        post_count * 10 +
        comment_count * 5 +
        avg_rating * 20
    )

    qualifies = (
        post_count >= 3 and
        comment_count >= 10 and
        activity_score >= 100
    )

    if not qualifies:
        return Response({
            "status": "not_eligible",
            "message": "Conditions non remplies",
            "score": activity_score,
            "posts": post_count,
            "comments": comment_count
        }, status=200)

    certification_type, _ = CertificationType.objects.get_or_create(
        name="fire",
        defaults={
            "description": "Utilisateur très actif et engagé",
            "icon": "whatshot",
            "color": "#FF5722"
        }
    )

    certification, created = Certification.objects.update_or_create(
        profile=profile,
        certification_type=certification_type,
        defaults={
            "status": "active",
            "activity_score": activity_score,
            "last_activity_check": timezone.now()
        }
    )

    return Response({
        "status": "success",
        "message": "Certification FIRE attribuée",
        "score": activity_score,
        "posts": post_count,
        "comments": comment_count,
        "certification": CertificationSerializer(certification).data,
        "created": created
    }, status=200)


# views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_id_verification(request):
    """Soumettre une demande de vérification d'identité"""
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Profil non trouvé'
        }, status=404)
    
    # Vérifier si une demande existe déjà
    existing_request = IDVerificationRequest.objects.filter(
        profile=profile,
        status='pending'
    ).first()
    
    if existing_request:
        return Response({
            'status': 'error',
            'message': 'Une demande est déjà en cours de traitement'
        }, status=400)
    
    # Debug: Afficher ce qui est reçu
    print("=== Debug ID Verification ===")
    print("Method:", request.method)
    print("Content-Type:", request.content_type)
    print("Data keys:", request.data.keys())
    print("Files keys:", request.FILES.keys())
    
    for key, value in request.FILES.items():
        print(f"File {key}: {value.name} ({value.size} bytes)")
    
    # Créer le serializer avec les données et le contexte
    serializer = IDVerificationRequestSerializer(
        data=request.data,
        context={'profile': profile}  # Passer le profile dans le contexte
    )
    
    if serializer.is_valid():
        try:
            verification_request = serializer.save()
            
            response_serializer = IDVerificationRequestSerializer(verification_request)
            return Response({
                'status': 'success',
                'message': 'Demande envoyée avec succès',
                'request': response_serializer.data
            }, status=201)
        except Exception as e:
            print(f"Error saving verification request: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Erreur lors de la création: {str(e)}'
            }, status=500)
    
    # Log des erreurs détaillées
    print("=== Validation Errors ===")
    for field, errors in serializer.errors.items():
        print(f"{field}: {errors}")
    
    return Response({
        'status': 'error',
        'message': 'Données invalides',
        'errors': serializer.errors
    }, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_verification_status(request):
    """Obtenir le statut de vérification d'identité de l'utilisateur"""
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Profile not found'
        }, status=404)
    
    verification_request = IDVerificationRequest.objects.filter(
        profile=profile
    ).first()
    
    if verification_request:
        serializer = IDVerificationRequestSerializer(verification_request)
        return Response(serializer.data)
    
    return Response({
        'status': 'not_found',
        'message': 'Aucune demande de vérification trouvée'
    })

# ========================
# VUES ADMIN
# ========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_all_certifications(request):
    """Récupérer toutes les certifications (admin)"""
    certifications = Certification.objects.all()
    serializer = CertificationSerializer(certifications, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_approve_id_verification(request, verification_id):
    """Approuver une vérification d'identité (admin)"""
    verification_request = get_object_or_404(IDVerificationRequest, pk=verification_id)
    
    if verification_request.status != 'pending':
        return Response({
            'error': 'Request has been solved'
        }, status=400)
    
    # Approuver la demande
    verification_request.status = 'approved'
    verification_request.reviewed_by = request.user
    verification_request.reviewed_at = timezone.now()
    verification_request.save()
    
    # Créer la certification verified
    certification_type, created = CertificationType.objects.get_or_create(
        name='verified',
        defaults={
            'description': 'Identité vérifiée par pièce officielle',
            'icon': 'verified_user',
            'color': '#1DA1F2'
        }
    )
    
    cert, cert_created = Certification.objects.update_or_create(
        profile=verification_request.profile,
        certification_type=certification_type,
        defaults={
            'status': 'active',
            'verified_at': timezone.now(),
            'verified_by': request.user,
            'verification_method': verification_request.id_type,
            'verification_doc_id': verification_request.id_number
        }
    )
    
    return Response({
        'status': 'success',
        'message': 'Vérification approuvée avec succès',
        'certification_id': cert.id
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_id_verification(request, verification_id):
    """Rejeter une vérification d'identité (admin)"""
    verification_request = get_object_or_404(IDVerificationRequest, pk=verification_id)
    
    if verification_request.status != 'pending':
        return Response({
            'error': 'Cette demande a déjà été traitée'
        }, status=400)
    
    verification_request.status = 'rejected'
    verification_request.reviewed_by = request.user
    verification_request.reviewed_at = timezone.now()
    verification_request.rejection_reason = request.data.get('rejection_reason', '')
    verification_request.save()
    
    return Response({
        'status': 'success',
        'message': 'Vérification rejetée avec succès'
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_pending_verifications(request):
    """Récupérer toutes les vérifications en attente (admin)"""
    pending_requests = IDVerificationRequest.objects.filter(
        status='pending'
    ).order_by('submitted_at')
    
    serializer = IDVerificationRequestSerializer(pending_requests, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_scan_all_activity(request):
    """Scanner l'activité de tous les utilisateurs pour fire certification"""
    profiles = Profile.objects.all()
    results = []
    
    for profile in profiles:
        try:
            response = check_fire_eligibility_for_profile(profile)
            results.append({
                'profile': profile.user.username,
                'profile_id': profile.id,
                'status': response.get('status'),
                'score': response.get('score'),
                'posts': response.get('posts', 0),
                'comments': response.get('comments', 0)
            })
        except Exception as e:
            logger.error(f"Erreur pour {profile.user.username}: {str(e)}")
            results.append({
                'profile': profile.user.username,
                'profile_id': profile.id,
                'status': 'error',
                'error': str(e)
            })
    
    return Response({
        'processed': len(results),
        'results': results
    })

# ========================
# FONCTIONS UTILITAIRES
# ========================

def check_fire_eligibility_for_profile(profile):
    """Logique de vérification fire pour un profil spécifique"""
    user = profile.user
    week_ago = timezone.now() - timedelta(days=7)
    
    post_count = Post.objects.filter(
        user=user,
        created_at__gte=week_ago
    ).count()
    
    comment_count = Feedback.objects.filter(
        user=user,
        created_at__gte=week_ago
    ).count()
    
    avg_rating_result = Feedback.objects.filter(
        user=user,
        created_at__gte=week_ago
    ).aggregate(avg=Avg('rating'))
    avg_rating = avg_rating_result['avg'] or 0
    
    activity_score = (post_count * 10) + (comment_count * 5) + (avg_rating * 20)
    
    qualifies = (
        post_count >= 3 and
        comment_count >= 10 and
        activity_score >= 100
    )
    
    if qualifies:
        certification_type, created = CertificationType.objects.get_or_create(
            name='fire',
            defaults={
                'description': 'Utilisateur très actif et engagé',
                'icon': 'whatshot',
                'color': '#FF5722'
            }
        )
        
        cert, cert_created = Certification.objects.update_or_create(
            profile=profile,
            certification_type=certification_type,
            defaults={
                'status': 'active',
                'activity_score': activity_score,
                'last_activity_check': timezone.now()
            }
        )
        
        return {
            'status': 'qualified',
            'score': activity_score,
            'posts': post_count,
            'comments': comment_count,
            'certification_id': cert.id
        }
    
    return {
        'status': 'not_qualified',
        'score': activity_score,
        'posts': post_count,
        'comments': comment_count
    }

def check_expired_certifications():
    """Vérifier et mettre à jour les certifications expirées"""
    expired_certifications = Certification.objects.filter(
        certification_type__name='premium',
        status='active',
        subscription_end__lt=timezone.now()
    )
    
    expired_count = 0
    for cert in expired_certifications:
        cert.status = 'expired'
        cert.save()
        expired_count += 1
    
    return expired_count

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_check_expired_certifications(request):
    """Vérifier les certifications expirées (admin)"""
    expired_count = check_expired_certifications()
    return Response({
        'status': 'success',
        'expired_count': expired_count,
        'message': f'{expired_count} certification(s) premium ont expiré'
    })




# Ajoutez cette fonction dans la section VUES PUBLIQUES
@api_view(['GET'])
def get_profile_certifications(request, profile_id):
    """Récupérer les certifications d'un profil spécifique"""
    try:
        # Récupérer le profil
        profile = get_object_or_404(Profile, id=profile_id)
        
        # Récupérer les certifications actives du profil
        certifications = Certification.objects.filter(
            profile=profile,
            status='active'
        ).select_related('certification_type')
        
        serializer = CertificationSerializer(certifications, many=True)
        
        # Calculer les flags pour faciliter l'affichage frontend
        now = timezone.now()
        has_premium = certifications.filter(
            certification_type__name='premium',
            subscription_end__gt=now
        ).exists()
        has_influencer = certifications.filter(
            certification_type__name='influencer'
        ).exists()
        has_fire = certifications.filter(
            certification_type__name='fire'
        ).exists()
        
        has_verified = certifications.filter(
            certification_type__name='verified'
        ).exists()
        
        # Compter les certifications actives
        active_count = certifications.count()
        
        # Calculer l'expiration la plus proche pour premium
        premium_expiration = None
        premium_cert = certifications.filter(
            certification_type__name='premium',
            subscription_end__gt=now
        ).first()
        if premium_cert:
            premium_expiration = premium_cert.subscription_end
        
        return Response({
            'profile_id': profile.id,
            'profile_username': profile.user.username,
            'certifications': serializer.data,
            'summary': {
                'total': active_count,
                'has_premium': has_premium,
                'has_fire': has_fire,
                'has_verified': has_verified,
                'has_influencer':has_influencer,
                'premium_expiration': premium_expiration,
                'last_activity_check': certifications.filter(
                    certification_type__name='fire'
                ).order_by('-last_activity_check').first().last_activity_check 
                if has_fire else None
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching profile certifications: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error fetching certifications: {str(e)}'
        }, status=500)
@api_view(['GET'])
def get_certification_info(request):
    """Obtenir des informations sur les certifications disponibles"""
    try:
        certification_types = CertificationType.objects.filter(is_active=True)
        
        # Compter les certifications actives
        stats = {
            'total_certified_users': Certification.objects.filter(
                status='active'
            ).values('profile').distinct().count(),
            'premium_users': Certification.objects.filter(
                certification_type__name='premium',
                status='active',
                subscription_end__gt=timezone.now()
            ).count(),
            'fire_users': Certification.objects.filter(
                certification_type__name='fire',
                status='active'
            ).count(),
            'verified_users': Certification.objects.filter(
                certification_type__name='verified',
                status='active'
            ).count(),
            'influencer_users': Certification.objects.filter(  # Ajouté
                certification_type__name='influencer',
                status='active'
            ).count()
        }
        
        # Liste des certifications avec description
        certifications_info = []
        for cert_type in certification_types:
            count = Certification.objects.filter(
                certification_type=cert_type,
                status='active'
            ).count()
            
            if cert_type.name == 'premium':
                count = Certification.objects.filter(
                    certification_type=cert_type,
                    status='active',
                    subscription_end__gt=timezone.now()
                ).count()
            
            certifications_info.append({
                'id': cert_type.id,
                'name': cert_type.name,
                'display_name': cert_type.get_name_display(),
                'description': cert_type.description,
                'icon': cert_type.icon,
                'color': cert_type.color,
                'active_count': count,
                'requirements': get_certification_requirements(cert_type.name)
            })
        
        return Response({
            'certifications': certifications_info,
            'stats': stats,
            'total_active_certifications': Certification.objects.filter(status='active').count()
        })
        
    except Exception as e:
        logger.error(f"Error getting certification info: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error getting certification info: {str(e)}'
        }, status=500)

def get_certification_requirements(cert_type_name):
    """Retourne les exigences pour chaque type de certification"""
    requirements = {
        'premium': {
            'title': 'Abonnement Premium',
            'conditions': [
                'Avoir un abonnement premium actif',
                'Paiement mensuel ou annuel'
            ],
            'how_to_get': 'Souscrire à un abonnement premium via les paramètres du compte'
        },
        'fire': {
            'title': 'Certification Fire',
            'conditions': [
                'Publier au moins 3 posts par semaine',
                'Commenter au moins 10 fois par semaine',
                'Avoir un score d\'activité minimum de 100 points'
            ],
            'points_system': {
                'post': 10,
                'comment': 5,
                'rating': 20
            },
            'how_to_get': 'Être actif sur la plateforme pendant 7 jours consécutifs'
        },
        'verified': {
            'title': 'Profil Vérifié',
            'conditions': [
                'Télécharger une pièce d\'identité valide',
                'Photo avec pièce d\'identité',
                'Vérification manuelle par l\'équipe'
            ],
            'how_to_get': 'Soumettre une demande de vérification dans les paramètres du profil'
        },
        'influencer': {  # Ajouté
            'title': 'Influenceur',
            'conditions': [
                'Avoir un grand nombre de followers',
                'Créer du contenu de qualité',
                'Être recommandé par l\'équipe'
            ],
            'how_to_get': 'Être sélectionné par l\'équipe de modération'
        }
    }
    
    return requirements.get(cert_type_name, {})



# Dans votre views.py Django, ajoutez ces vues :

# ======================
# NOUVELLES VUES POUR LE DASHBOARD
# ======================
def get_user_stats_data(user):
    """Fonction utilitaire pour récupérer les stats sans décorateur @api_view"""
    try:
        profile = user.profile.id
        
        # 1. Feedbacks donnés (feedback que l'utilisateur a donné à d'autres)
        feedbacks_given = Feedback.objects.filter(user=user).count()
        
        # 2. Feedbacks reçus (feedback que l'utilisateur a reçu en tant que professional)
        feedbacks_received = Feedback.objects.filter(professional=profile).count()
        
        # 3. Posts créés
        posts_count = Post.objects.filter(user=user).count()
        
        # 4. Comments donnés (dans ton cas, c'est la même chose que feedbacks_given)
        # Ou bien si tu as un modèle Comment séparé :
        # comments_count = Comment.objects.filter(user=user).count()
        comments_count = Comment.objects.filter(user=user).count()  # Ou 0 si pas de modèle Comment
        
        # 5. Calcul de l'âge du compte
        account_age = (timezone.now() - user.date_joined).days
        
        # 6. Vérifier si c'est une organisation (à adapter selon ta logique)
        is_organization = False
        
        # 7. Score d'engagement
        # Ajuste les poids selon l'importance de chaque métrique
        engagement_score = min(100, (
            posts_count * 3 +          # Posts sont importants
            feedbacks_given * 2 +      # Donner des feedbacks
            feedbacks_received * 4 +    # Recevoir des feedbacks est très important
            (account_age // 30) * 1    # Ancienneté du compte
        ) // 10)
        
        # 8. Calculer la note moyenne reçue
        avg_rating_result = Feedback.objects.filter(
            professional=user
        ).aggregate(avg=Avg('rating'))
        avg_rating = avg_rating_result['avg'] or 0
        
        return {
            'feedbacks_given': feedbacks_given,
            'feedbacks_received': feedbacks_received,
            'posts_count': posts_count,
            'comments_count': comments_count,
            'account_age_days': account_age,
            'is_organization': is_organization,
            'engagement_score': engagement_score,
            'average_rating': round(avg_rating, 2),
            'last_updated': timezone.now()
        }
        
    except Profile.DoesNotExist:
        logger.error(f"Profile not found for user {user.username}")
        raise Exception(f"Profile not found for user {user.username}")
    except Exception as e:
        logger.error(f"Error in get_user_stats_data: {str(e)}")
        raise

def check_influencer_eligibility_data(user):
    """Fonction utilitaire pour vérifier l'éligibilité sans décorateur @api_view"""
    try:
        profile = user.profile
        
        # Obtenir les statistiques
        stats_data = get_user_stats_data(user)
        
        # Critères pour influencer
        requirements = {
            'min_feedbacks_given': 100,
            'min_feedbacks_received': 100,
            'min_account_age': 30,
            'min_posts': 20,
            'min_engagement_score': 80
        }
        
        # Vérifier chaque critère
        meets_feedbacks_given = stats_data['feedbacks_given'] >= requirements['min_feedbacks_given']
        meets_feedbacks_received = stats_data['feedbacks_received'] >= requirements['min_feedbacks_received']
        meets_account_age = stats_data['account_age_days'] >= requirements['min_account_age']
        meets_posts = stats_data['posts_count'] >= requirements['min_posts']
        meets_engagement = stats_data['engagement_score'] >= requirements['min_engagement_score']
        
        all_requirements_met = all([
            meets_feedbacks_given,
            meets_feedbacks_received,
            meets_account_age,
            meets_posts,
            meets_engagement
        ])
        
        if all_requirements_met:
            # Attribuer automatiquement le badge influencer
            certification_type, _ = CertificationType.objects.get_or_create(
                name='influencer',
                defaults={
                    'description': 'Highly influential community member',
                    'icon': 'trending_up',
                    'color': '#9C27B0'
                }
            )
            
            cert, created = Certification.objects.update_or_create(
                profile=profile,
                certification_type=certification_type,
                defaults={
                    'status': 'active',
                    'last_activity_check': timezone.now()
                }
            )
            
            return {
                'status': 'success',
                'eligible': True,
                'message': 'Influencer badge granted!',
                'certification_id': cert.id,
                'created': created,
                'stats_data': stats_data
            }
        else:
            # Retourner ce qui manque
            missing_requirements = []
            if not meets_feedbacks_given:
                missing_requirements.append(f"{requirements['min_feedbacks_given'] - stats_data['feedbacks_given']} more feedbacks to give")
            if not meets_feedbacks_received:
                missing_requirements.append(f"{requirements['min_feedbacks_received'] - stats_data['feedbacks_received']} more feedbacks to receive")
            if not meets_account_age:
                missing_requirements.append(f"{requirements['min_account_age'] - stats_data['account_age_days']} more days")
            if not meets_posts:
                missing_requirements.append(f"{requirements['min_posts'] - stats_data['posts_count']} more posts")
            if not meets_engagement:
                missing_requirements.append(f"{requirements['min_engagement_score'] - stats_data['engagement_score']} more engagement points")
            
            return {
                'status': 'info',
                'eligible': False,
                'message': 'Requirements not met for influencer badge',
                'requirements': requirements,
                'current_stats': stats_data,
                'missing': missing_requirements
            }
            
    except Exception as e:
        logger.error(f"Error in check_influencer_eligibility_data: {str(e)}")
        raise

# ===========================================
# VUES API (avec décorateurs @api_view)
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """Obtenir les statistiques de l'utilisateur pour l'éligibilité influencer"""
    try:
        stats_data = get_user_stats_data(request.user)
        return Response(stats_data)
    except Exception as e:
        logger.error(f"Error in get_user_stats API view: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_influencer_eligibility(request):
    """Vérifier l'éligibilité au badge influencer (API view)"""
    try:
        eligibility_data = check_influencer_eligibility_data(request.user)
        return Response(eligibility_data)
    except Exception as e:
        logger.error(f"Error in check_influencer_eligibility API view: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_influencer_badge(request):
    """Soumettre une demande manuelle de badge influencer (pour examen par admin)"""
    try:
        user = request.user
        
        # Vérifier d'abord l'éligibilité automatique
        eligibility_data = check_influencer_eligibility_data(user)
        
        if eligibility_data.get('eligible'):
            # Si éligible automatiquement, badge déjà attribué
            return Response({
                'status': 'success',
                'message': 'Influencer badge granted automatically!',
                'certification_id': eligibility_data.get('certification_id')
            })
        else:
            # Sinon, créer une demande pour examen manuel
            # Note: Vous pourriez vouloir créer un modèle pour ces demandes
            return Response({
                'status': 'pending',
                'message': 'Influencer badge request submitted for manual review',
                'note': 'An administrator will review your request within 3-5 business days',
                'requirements_needed': eligibility_data.get('missing', [])
            })
            
    except Exception as e:
        logger.error(f"Error requesting influencer badge: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

# ======================
# ENDPOINTS DE PAIEMENT (SIMULATION)
# ======================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """Créer une session de paiement (ex: Stripe)"""
    try:
        data = request.data
        plan_type = data.get('plan_type', 'individual_monthly')
        user = request.user
        
        # Définir les prix selon le plan
        prices = {
            'individual_monthly': 1000,  # 10.00 USD en cents
            'individual_yearly': 10000,   # 100.00 USD en cents
            'organization_basic': 5000,   # 50.00 USD en cents
            'organization_pro': 10000,    # 100.00 USD en cents
        }
        
        amount = prices.get(plan_type, 1000)
        
        # Ici, vous intégreriez votre processeur de paiement (Stripe, PayPal, etc.)
        # Pour l'exemple, nous simulons une session
        
        session_id = f"mock_session_{uuid.uuid4()}"
        
        return Response({
            'session_id': session_id,
            'amount': amount / 100,  # Convertir en dollars
            'currency': 'usd',
            'plan_type': plan_type,
            'user_email': user.email,
            'checkout_url': f"/certifications/payment/simulate/{session_id}/",
            'note': 'This is a mock payment endpoint. Replace with real payment processor.'
        })
        
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def manage_subscription(request):
    """Gérer l'abonnement existant"""
    try:
        user = request.user
        
        # Vérifier si l'utilisateur a un abonnement premium actif
        premium_cert = Certification.objects.filter(
            profile=user.profile,
            certification_type__name='premium',
            status='active',
            subscription_end__gt=timezone.now()
        ).first()
        
        if premium_cert:
            return Response({
                'has_active_subscription': True,
                'plan_type': 'premium',
                'subscription_start': premium_cert.subscription_start,
                'subscription_end': premium_cert.subscription_end,
                'days_remaining': (premium_cert.subscription_end - timezone.now()).days,
                'manage_url': '/account/billing/',  # URL pour gérer l'abonnement
                'can_cancel': True
            })
        else:
            return Response({
                'has_active_subscription': False,
                'message': 'No active premium subscription found'
            })
            
    except Exception as e:
        logger.error(f"Error managing subscription: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)
    



logger = logging.getLogger(__name__)

# Configurez Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """Créer une session de checkout Stripe - Version corrigée"""
    try:
        user = request.user
        
        # Vérifier que l'utilisateur a un profil
        if not hasattr(user, 'profile'):
            return Response({
                'status': 'error',
                'message': 'User profile not found'
            }, status=400)
        
        profile = user.profile
        data = request.data
        plan_type = data.get('plan_type', 'individual_monthly')
        
        logger.info(f"🛒 Creating checkout session for user {user.id}, plan: {plan_type}")
        
        # Vérifier si le plan existe
        plan_config = settings.STRIPE_PLANS.get(plan_type)
        if not plan_config:
            logger.error(f"❌ Plan type not found: {plan_type}")
            return Response({
                'status': 'error',
                'message': 'Plan type not found'
            }, status=400)
        
        # Créer ou récupérer le client Stripe
        customer = None
        try:
            if hasattr(user, 'payment_set') and user.payment_set.filter(stripe_customer_id__isnull=False).exists():
                payment = user.payment_set.filter(stripe_customer_id__isnull=False).first()
                customer = stripe.Customer.retrieve(payment.stripe_customer_id)
                logger.info(f"✅ Found existing customer: {customer.id}")
            else:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.get_full_name() or user.username,
                    metadata={
                        'user_id': user.id,
                        'username': user.username,
                    }
                )
                logger.info(f"✅ Created new customer: {customer.id}")
        except Exception as e:
            logger.error(f"❌ Error with customer: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Customer error: {str(e)}'
            }, status=500)
        
        # Créer une session de checkout
        try:
            checkout_session = stripe.checkout.Session.create(
                customer=customer.id,
                payment_method_types=['card'],
                line_items=[{
                    'price': plan_config['price_id'],
                    'quantity': 1,
                }],
                mode='subscription' if plan_config['interval'] != 'one_time' else 'payment',
                success_url=f"{settings.FRONTEND_URL}/certifications/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/certifications/payment/cancel?session_id={{CHECKOUT_SESSION_ID}}",
                metadata={
                    'user_id': user.id,
                    'plan_type': plan_type,
                    'profile_id': profile.id,
                    'username': user.username,
                },
                billing_address_collection='required' if plan_type.startswith('organization') else 'auto',
                allow_promotion_codes=True,
            )
            
            logger.info(f"✅ Checkout session created: {checkout_session.id}")
            
        except Exception as e:
            logger.error(f"❌ Stripe session creation error: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Payment gateway error: {str(e)}'
            }, status=500)
        
        # Enregistrer la session dans la base de données
        try:
            payment = Payment.objects.create(
                user=user,
                stripe_customer_id=customer.id,
                stripe_checkout_session_id=checkout_session.id,
                plan_type=plan_type,
                amount=plan_config['amount'] / 100,  # Convertir en dollars
                currency=plan_config['currency'].upper(),
                status='pending',
                metadata={
                    'plan_name': plan_config['name'],
                    'plan_description': plan_config['description'],
                    'duration_days': plan_config.get('duration_days', 30),
                    'interval': plan_config['interval'],
                    'frontend_url': settings.FRONTEND_URL,
                    'created_at': timezone.now().isoformat(),
                }
            )
            
            logger.info(f"💰 Payment record created: {payment.id}")
            
        except Exception as e:
            logger.error(f"❌ Error saving payment: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Database error: {str(e)}'
            }, status=500)
        
        return Response({
            'status': 'success',
            'session_id': checkout_session.id,
            'checkout_url': checkout_session.url,
            'amount': plan_config['amount'] / 100,
            'currency': plan_config['currency'].upper(),
            'plan_type': plan_type,
            'plan_name': plan_config['name'],
            'payment_id': payment.id,
            'customer_id': customer.id,
        })
        
    except Exception as e:
        logger.error(f"❌ Error creating checkout session: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkout_success(request):
    """Page de succès après paiement - Version corrigée"""
    try:
        session_id = request.GET.get('session_id')
        
        if not session_id:
            logger.error("❌ No session_id provided")
            return Response({
                'status': 'error',
                'message': 'Session ID is required'
            }, status=400)
        
        logger.info(f"🎉 Checkout success for session: {session_id}")
        
        # 1. Vérifier d'abord si le paiement existe
        payment = Payment.objects.filter(
            stripe_checkout_session_id=session_id,
            user=request.user
        ).first()
        
        if not payment:
            logger.error(f"❌ Payment not found for session: {session_id}")
            return Response({
                'status': 'error',
                'message': 'Payment not found'
            }, status=404)
        
        logger.info(f"✅ Payment found: {payment.id}, status: {payment.status}")
        
        # 2. Si déjà complété, retourner les infos
        if payment.status == 'completed':
            logger.info(f"✅ Payment already completed")
            
            # Vérifier si une certification existe
            certification = Certification.objects.filter(
                profile=request.user.profile,
                certification_type__name='premium',
                status='active'
            ).first()
            
            return Response({
                'status': 'already_completed',
                'message': 'Payment already processed',
                'payment': PaymentSerializer(payment).data,
                'certification_id': certification.id if certification else None,
                'subscription_end': payment.subscription_end.isoformat() if payment.subscription_end else None,
                'redirect_url': f"{settings.FRONTEND_URL}/certifications?premium=active"
            })
        
        # 3. Récupérer la session Stripe
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            logger.info(f"📊 Stripe session status: {session.payment_status}")
        except Exception as e:
            logger.error(f"❌ Error retrieving Stripe session: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Could not verify payment with Stripe: {str(e)}'
            }, status=500)
        
        # 4. Vérifier si le paiement a réussi
        if session.payment_status == 'paid':
            logger.info(f"✅ Payment is paid, updating database")
            
            # Mettre à jour le paiement
            payment.status = 'completed'
            payment.payment_date = timezone.now()
            payment.stripe_subscription_id = session.subscription
            
            # Calculer les dates d'abonnement
            plan_config = settings.STRIPE_PLANS.get(payment.plan_type, {})
            
            # Gérer duration_days de manière sécurisée
            duration_days = 30  # valeur par défaut
            if plan_config:
                duration_days = plan_config.get('duration_days', 30)
            elif isinstance(payment.metadata, dict):
                duration_days = payment.metadata.get('duration_days', 30)
            
            payment.subscription_start = timezone.now()
            payment.subscription_end = timezone.now() + timedelta(days=duration_days)
            
            # Mettre à jour les métadonnées
            if not payment.metadata:
                payment.metadata = {}
            payment.metadata.update({
                'stripe_session': {
                    'id': session.id,
                    'payment_status': session.payment_status,
                    'subscription': session.subscription,
                    'customer': session.customer,
                },
                'completed_at': timezone.now().isoformat(),
                'completed_via': 'checkout_success',
            })
            
            payment.save()
            logger.info(f"✅ Payment updated: {payment.id}")
            logger.info(f"   Subscription end: {payment.subscription_end}")
            
            # 5. Créer ou mettre à jour la certification premium
            logger.info("🏗️ Creating/updating certification...")
            
            try:
                # Créer la certification directement
                cert_type, _ = CertificationType.objects.get_or_create(
                    name='premium',
                    defaults={
                        'description': 'Premium subscription',
                        'icon': 'star',
                        'color': '#FFD700'
                    }
                )
                
                certification, created = Certification.objects.update_or_create(
                    profile=request.user.profile,
                    certification_type=cert_type,
                    defaults={
                        'status': 'active',
                        'subscription_start': payment.subscription_start,
                        'subscription_end': payment.subscription_end,
                        'metadata': {
                            'payment_id': payment.id,
                            'plan_type': payment.plan_type,
                            'stripe_subscription_id': payment.stripe_subscription_id,
                            'created_via': 'checkout_success',
                            'created_at': timezone.now().isoformat()
                        }
                    }
                )
                
                logger.info(f"✅ Certification {'created' if created else 'updated'}: {certification.id}")
                
            except Exception as e:
                logger.error(f"❌ Error creating certification: {str(e)}")
                certification = None
            
            return Response({
                'status': 'success',
                'message': 'Payment completed successfully!',
                'payment': PaymentSerializer(payment).data,
                'certification': {
                    'id': certification.id if certification else None,
                    'status': certification.status if certification else None,
                    'subscription_end': certification.subscription_end.isoformat() if certification and certification.subscription_end else None,
                } if certification else None,
                'subscription_end': payment.subscription_end.isoformat(),
                'redirect_url': f"{settings.FRONTEND_URL}/certifications?premium=active&session_id={session_id}"
            })
        
        elif session.payment_status == 'unpaid':
            logger.warning(f"⚠️ Payment unpaid for session: {session_id}")
            payment.status = 'failed'
            payment.save()
            
            return Response({
                'status': 'failed',
                'message': 'Payment failed or was not completed'
            }, status=400)
        
        else:
            logger.info(f"⏳ Payment still processing: {session.payment_status}")
            
            return Response({
                'status': 'processing',
                'message': 'Payment is still being processed',
                'payment_status': session.payment_status,
                'suggestion': 'Refresh this page in 30 seconds or check your email for confirmation',
                'check_again_url': f"{request.path}?session_id={session_id}&t={int(timezone.now().timestamp())}"
            })
        
    except Exception as e:
        logger.error(f"❌ Error in checkout success: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkout_cancel(request):
    """Page d'annulation"""
    session_id = request.GET.get('session_id')
    
    payment = Payment.objects.filter(
        stripe_checkout_session_id=session_id
    ).first()
    
    if payment and payment.status == 'pending':
        payment.status = 'canceled'
        payment.save()
    
    return Response({
        'status': 'canceled',
        'message': 'Payment was cancelled',
        'session_id': session_id,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, session_id):
    """Vérifier le statut d'un paiement"""
    try:
        payment = get_object_or_404(Payment, stripe_checkout_session_id=session_id)
        
        # Si le paiement est toujours en attente, vérifier auprès de Stripe
        if payment.status == 'pending':
            try:
                session = stripe.checkout.Session.retrieve(session_id)
                
                if session.payment_status == 'paid':
                    payment.status = 'completed'
                    payment.payment_date = timezone.now()
                    payment.stripe_subscription_id = session.subscription
                    
                    # Calculer les dates d'abonnement
                    duration_days = payment.metadata.get('duration_days', 30)
                    payment.subscription_start = timezone.now()
                    payment.subscription_end = timezone.now() + timedelta(days=duration_days)
                    
                    payment.save()
                    
                    # Créer la certification
                    payment.create_or_update_certification()
                
                elif session.payment_status == 'unpaid':
                    payment.status = 'failed'
                    payment.save()
                    
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error checking payment status: {str(e)}")
        
        return Response({
            'payment_status': payment.status,
            'has_premium': payment.is_active,
            'subscription_end': payment.subscription_end.isoformat() if payment.subscription_end else None,
            'payment': PaymentSerializer(payment).data,
        })
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def manage_subscription(request):
    """Gérer l'abonnement existant"""
    try:
        user = request.user
        
        # Récupérer le dernier paiement actif
        payment = Payment.objects.filter(
            user=user,
            status='completed',
            subscription_end__gt=timezone.now()
        ).order_by('-created_at').first()
        
        if not payment:
            return Response({
                'has_active_subscription': False,
                'message': 'No active subscription found'
            })
        
        # Récupérer les informations de l'abonnement Stripe
        subscription_info = {}
        if payment.stripe_subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(payment.stripe_subscription_id)
                
                # Créer un portail de gestion client
                portal_session = stripe.billing_portal.Session.create(
                    customer=payment.stripe_customer_id,
                    return_url=f"{settings.FRONTEND_URL}/certifications",
                )
                
                subscription_info = {
                    'stripe_subscription_id': subscription.id,
                    'current_period_start': subscription.current_period_start,
                    'current_period_end': subscription.current_period_end,
                    'status': subscription.status,
                    'cancel_at_period_end': subscription.cancel_at_period_end,
                    'portal_url': portal_session.url,
                }
            except stripe.error.StripeError as e:
                logger.error(f"Error retrieving Stripe subscription: {str(e)}")
        
        return Response({
            'has_active_subscription': True,
            'plan_type': payment.plan_type,
            'plan_name': payment.metadata.get('plan_name', 'Premium'),
            'subscription_start': payment.subscription_start,
            'subscription_end': payment.subscription_end,
            'days_remaining': (payment.subscription_end - timezone.now()).days if payment.subscription_end else 0,
            'payment': PaymentSerializer(payment).data,
            'stripe_info': subscription_info,
        })
        
    except Exception as e:
        logger.error(f"Error managing subscription: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Webhook Stripe pour les événements - Version améliorée avec logging"""
    
    # Log de début
    logger.info("=" * 80)
    logger.info("🎯 STRIPE WEBHOOK RECEIVED")
    logger.info(f"📦 Request method: {request.method}")
    logger.info(f"📦 Content-Type: {request.content_type}")
    logger.info(f"📦 Headers keys: {list(request.headers.keys())}")
    
    # Vérifier la présence de la signature
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    if not sig_header:
        logger.error("❌ NO SIGNATURE HEADER - Missing HTTP_STRIPE_SIGNATURE")
        logger.error(f"Available headers: {dict(request.headers)}")
        return Response({'error': 'Missing signature header'}, status=400)
    
    logger.info(f"✅ Signature header found: {sig_header[:50]}...")
    
    # Lire le payload
    payload = request.body
    payload_str = payload.decode('utf-8')
    
    logger.info(f"📄 Payload length: {len(payload)} bytes")
    logger.info(f"📄 Payload preview: {payload_str[:200]}...")
    
    try:
        # Vérifier la clé secrète
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        if not webhook_secret:
            logger.error("❌ STRIPE_WEBHOOK_SECRET is not set in settings")
            return Response({'error': 'Webhook secret not configured'}, status=500)
        
        logger.info(f"✅ Webhook secret configured: {webhook_secret[:10]}...")
        
        # Construire l'événement
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        
        logger.info(f"✅ Event constructed successfully")
        logger.info(f"📋 Event ID: {event.get('id')}")
        logger.info(f"📋 Event type: {event.get('type')}")
        logger.info(f"📋 Event created: {event.get('created')}")
        
    except ValueError as e:
        # Payload invalide
        logger.error(f"❌ Invalid payload: {str(e)}")
        logger.error(f"Payload dump: {payload_str[:500]}")
        return Response({'error': 'Invalid payload'}, status=400)
    
    except stripe.error.SignatureVerificationError as e:
        # Signature invalide
        logger.error(f"❌ Invalid signature: {str(e)}")
        logger.error(f"Signature provided: {sig_header}")
        logger.error(f"Payload: {payload_str[:200]}...")
        return Response({'error': 'Invalid signature'}, status=400)
    
    except Exception as e:
        logger.error(f"❌ Unexpected error constructing event: {str(e)}")
        return Response({'error': str(e)}, status=500)
    
    # Traiter l'événement
    event_type = event['type']
    event_data = event['data']['object']
    
    logger.info("=" * 80)
    logger.info(f"🔄 PROCESSING EVENT: {event_type}")
    logger.info(f"📊 Event data keys: {list(event_data.keys())}")
    
    try:
        # Afficher plus de détails selon le type d'événement
        if event_type == 'checkout.session.completed':
            session = event_data
            logger.info(f"🛒 Checkout Session Completed:")
            logger.info(f"   Session ID: {session.get('id')}")
            logger.info(f"   Payment status: {session.get('payment_status')}")
            logger.info(f"   Subscription: {session.get('subscription')}")
            logger.info(f"   Customer: {session.get('customer')}")
            logger.info(f"   Amount: {session.get('amount_total')}")
            logger.info(f"   Metadata: {session.get('metadata')}")
            
            # Chercher le paiement
            payment = Payment.objects.filter(
                stripe_checkout_session_id=session.get('id')
            ).first()
            
            if payment:
                logger.info(f"   ✅ Payment found: {payment.id}, status: {payment.status}")
            else:
                logger.warning(f"   ⚠️ No payment found for session {session.get('id')}")
                
                # Essayer de trouver par metadata
                metadata = session.get('metadata', {})
                user_id = metadata.get('user_id')
                if user_id:
                    logger.info(f"   👤 Trying to find by user_id: {user_id}")
                    try:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        user = User.objects.get(id=user_id)
                        payment = Payment.objects.filter(
                            user=user,
                            plan_type=metadata.get('plan_type')
                        ).order_by('-created_at').first()
                        if payment:
                            logger.info(f"   ✅ Found payment by user: {payment.id}")
                    except:
                        pass
        
        # Votre logique de traitement existante...
        if event_type == 'checkout.session.completed':
            session = event_data
            
            # Recherche améliorée du paiement
            payment = Payment.objects.filter(
                stripe_checkout_session_id=session.get('id')
            ).first()
            
            if not payment:
                # Essayer de trouver via metadata
                metadata = session.get('metadata', {})
                user_id = metadata.get('user_id')
                if user_id:
                    try:
                        User = get_user_model()
                        user = User.objects.get(id=user_id)
                        payment = Payment.objects.filter(
                            user=user,
                            plan_type=metadata.get('plan_type', '')
                        ).order_by('-created_at').first()
                    except Exception as e:
                        logger.error(f"Error finding user for webhook: {str(e)}")
                        payment = None
            
            if payment:
                logger.info(f"🎯 Processing payment {payment.id}")
                
                old_status = payment.status
                payment.status = 'completed'
                payment.payment_date = timezone.now()
                payment.stripe_subscription_id = session.get('subscription')
                
                # Calculer les dates d'abonnement
                plan_config = settings.STRIPE_PLANS.get(payment.plan_type, {})
                duration_days = plan_config.get('duration_days', 30)
                payment.subscription_start = timezone.now()
                payment.subscription_end = timezone.now() + timedelta(days=duration_days)
                
                # Mettre à jour les métadonnées
                if not payment.metadata:
                    payment.metadata = {}
                
                payment.metadata.update({
                    'webhook_processed': True,
                    'webhook_event_id': event.get('id'),
                    'webhook_processed_at': timezone.now().isoformat(),
                    'stripe_session_data': {
                        'id': session.get('id'),
                        'payment_status': session.get('payment_status'),
                        'customer': session.get('customer'),
                        'amount': session.get('amount_total'),
                    }
                })
                
                payment.save()
                
                logger.info(f"✅ Payment updated: {payment.id}")
                logger.info(f"   Status: {old_status} -> {payment.status}")
                logger.info(f"   Subscription start: {payment.subscription_start}")
                logger.info(f"   Subscription end: {payment.subscription_end}")
                
                # Créer la certification
                logger.info("🏗️ Creating certification...")
                certification = payment.create_or_update_certification()
                
                if certification:
                    logger.info(f"✅ Certification created: {certification.id}")
                    logger.info(f"   Profile: {certification.profile.id}")
                    logger.info(f"   End date: {certification.subscription_end}")
                else:
                    logger.error(f"❌ Failed to create certification for payment {payment.id}")
                    
                    # Fallback: créer manuellement
                    try:
                        from .models import Certification, CertificationType
                        profile = payment.user.profile
                        cert_type, _ = CertificationType.objects.get_or_create(
                            name='premium',
                            defaults={'description': 'Premium', 'icon': 'star', 'color': '#FFD700'}
                        )
                        cert = Certification.objects.create(
                            profile=profile,
                            certification_type=cert_type,
                            status='active',
                            subscription_start=payment.subscription_start,
                            subscription_end=payment.subscription_end,
                            metadata={'payment_id': payment.id, 'created_via': 'webhook_fallback'}
                        )
                        logger.info(f"🔄 Fallback certification created: {cert.id}")
                    except Exception as e:
                        logger.error(f"❌ Fallback also failed: {str(e)}")
            else:
                logger.error(f"❌ No payment found for session {session.get('id')}")
                logger.error(f"   Session metadata: {session.get('metadata')}")
                
                # Créer un paiement si possible
                metadata = session.get('metadata', {})
                user_id = metadata.get('user_id')
                if user_id:
                    try:
                        User = get_user_model()
                        user = User.objects.get(id=user_id)
                        
                        # Créer un nouveau paiement
                        new_payment = Payment.objects.create(
                            user=user,
                            stripe_checkout_session_id=session.get('id'),
                            stripe_customer_id=session.get('customer'),
                            stripe_subscription_id=session.get('subscription'),
                            plan_type=metadata.get('plan_type', 'individual_monthly'),
                            amount=session.get('amount_total', 0) / 100,
                            currency=session.get('currency', 'usd').upper(),
                            status='completed',
                            payment_date=timezone.now(),
                            subscription_start=timezone.now(),
                            subscription_end=timezone.now() + timedelta(days=30),
                            metadata=metadata
                        )
                        
                        logger.info(f"🆕 Created new payment: {new_payment.id}")
                        new_payment.create_or_update_certification()
                        
                    except Exception as e:
                        logger.error(f"❌ Could not create payment: {str(e)}")
        
        # Traitement des autres événements...
        elif event_type == 'invoice.payment_succeeded':
            invoice = event_data
            logger.info(f"💰 Invoice payment succeeded: {invoice.get('id')}")
            # ... votre code existant ...
        
        elif event_type == 'customer.subscription.deleted':
            subscription = event_data
            logger.info(f"🗑️ Subscription deleted: {subscription.get('id')}")
            # ... votre code existant ...
        
        elif event_type == 'invoice.payment_failed':
            invoice = event_data
            logger.info(f"❌ Invoice payment failed: {invoice.get('id')}")
            # ... votre code existant ...
        
        else:
            logger.info(f"ℹ️ Unhandled event type: {event_type}")
        
        logger.info("=" * 80)
        logger.info(f"✅ EVENT PROCESSED SUCCESSFULLY: {event_type}")
        logger.info("=" * 80)
        
        return Response({'status': 'success', 'event_type': event_type})
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ ERROR PROCESSING EVENT: {event_type}")
        logger.error(f"Error: {str(e)}", exc_info=True)
        logger.error("=" * 80)
        return Response({'error': str(e)}, status=500)

def handle_checkout_session_completed(session):
    """Gérer la session de checkout complétée"""
    try:
        logger.info(f"🛒 Processing checkout.session.completed: {session.get('id')}")
        
        # Récupérer l'ID utilisateur depuis les metadata
        user_id = session.get('metadata', {}).get('user_id')
        
        if not user_id:
            logger.error(f"❌ No user_id in session metadata")
            # Essayer de trouver l'utilisateur par email
            customer_email = session.get('customer_details', {}).get('email')
            if customer_email:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    user = User.objects.get(email=customer_email)
                    user_id = user.id
                    logger.info(f"✅ Found user by email: {user.username}")
                except User.DoesNotExist:
                    logger.error(f"❌ User with email {customer_email} not found")
                    return Response({'error': 'User not found'}, status=400)
            else:
                return Response({'error': 'No user identifier'}, status=400)
        
        # Récupérer l'utilisateur
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.error(f"❌ User {user_id} not found")
            return Response({'error': 'User not found'}, status=400)
        
        # Vérifier que l'utilisateur a un profil
        if not hasattr(user, 'profile'):
            logger.error(f"❌ User {user.username} has no profile")
            # Créer un profil si nécessaire
            from app.models import Profile
            Profile.objects.create(user=user)
            logger.info(f"✅ Created profile for user {user.username}")
        
        # 1. Chercher le paiement existant
        payment = Payment.objects.filter(
            stripe_checkout_session_id=session.get('id')
        ).first()
        
        # 2. Si pas de paiement existant, en créer un
        if not payment:
            logger.info(f"➕ Creating new payment for session {session.get('id')}")
            
            # Récupérer plus d'informations sur la session
            expanded_session = stripe.checkout.Session.retrieve(
                session.get('id'),
                expand=['subscription', 'line_items']
            )
            
            # Déterminer le montant
            amount_total = session.get('amount_total', 0)  # en centimes
            amount = amount_total / 100 if amount_total > 0 else 9.99  # en dollars/euros
            
            # Déterminer le type de plan
            plan_type = session.get('metadata', {}).get('plan_type', 'premium_monthly')
            
            # Créer le paiement
            payment = Payment.objects.create(
                user=user,
                stripe_customer_id=session.get('customer'),
                stripe_subscription_id=session.get('subscription'),
                stripe_checkout_session_id=session.get('id'),
                plan_type=plan_type,
                amount=amount,
                currency=session.get('currency', 'usd').upper(),
                status='completed',
                payment_date=timezone.now(),
                metadata=dict(session.get('metadata', {})),
            )
            
            logger.info(f"💰 Payment created: {payment.id}")
        
        # 3. Si paiement existait mais était en pending, le mettre à jour
        elif payment.status != 'completed':
            logger.info(f"🔄 Updating payment {payment.id} from {payment.status} to completed")
            payment.status = 'completed'
            payment.payment_date = timezone.now()
            payment.stripe_customer_id = session.get('customer')
            payment.stripe_subscription_id = session.get('subscription')
        
        # 4. Définir les dates d'abonnement
        subscription_id = session.get('subscription')
        if subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(subscription_id)
                payment.subscription_start = timezone.fromtimestamp(subscription.current_period_start)
                payment.subscription_end = timezone.fromtimestamp(subscription.current_period_end)
                logger.info(f"📅 Subscription dates: {payment.subscription_start} to {payment.subscription_end}")
            except Exception as e:
                logger.error(f"⚠️ Error getting subscription dates: {str(e)}")
                # Dates par défaut
                payment.subscription_start = timezone.now()
                payment.subscription_end = timezone.now() + timedelta(days=30)
        else:
            # Paiement unique
            payment.subscription_start = timezone.now()
            payment.subscription_end = timezone.now() + timedelta(days=30)
        
        payment.save()
        
        # 5. FORCER la création de la certification
        logger.info(f"🏗️ Creating certification for payment {payment.id}...")
        
        # Méthode 1: Utiliser votre fonction
        certification = payment.create_or_update_certification()
        
        if not certification:
            # Méthode 2: Créer manuellement
            logger.warning(f"⚠️ create_or_update_certification returned None, creating manually...")
            certification = create_certification_manually_for_webhook(payment, user)
        
        if certification:
            logger.info(f"✅ Certification created: {certification.id}")
            logger.info(f"   User: {user.username}")
            logger.info(f"   Type: premium")
            logger.info(f"   End date: {certification.subscription_end}")
        else:
            logger.error(f"❌ FAILED to create certification for payment {payment.id}")
        
        return Response({'status': 'processed', 'payment_id': payment.id, 'certification_created': certification is not None})
        
    except Exception as e:
        logger.error(f"❌ Error in handle_checkout_session_completed: {str(e)}", exc_info=True)
        raise


def create_certification_manually_for_webhook(payment, user):
    """Créer une certification manuellement pour le webhook"""
    try:
        from .models import Certification, CertificationType
        
        profile = user.profile
        
        # Créer le type de certification s'il n'existe pas
        cert_type, _ = CertificationType.objects.get_or_create(
            name='premium',
            defaults={
                'description': 'Premium subscription plan',
                'icon': 'star',
                'color': '#FFD700',
            }
        )
        
        # Vérifier si une certification existe déjà
        existing_cert = Certification.objects.filter(
            profile=profile,
            certification_type=cert_type,
            status='active'
        ).first()
        
        if existing_cert:
            # Mettre à jour la date de fin
            existing_cert.subscription_end = payment.subscription_end
            existing_cert.metadata['payment_id'] = payment.id
            existing_cert.metadata['updated_via'] = 'webhook'
            existing_cert.save()
            return existing_cert
        
        # Créer une nouvelle certification
        cert = Certification.objects.create(
            profile=profile,
            certification_type=cert_type,
            status='active',
            subscription_start=payment.subscription_start or timezone.now(),
            subscription_end=payment.subscription_end or (timezone.now() + timedelta(days=30)),
            metadata={
                'payment_id': payment.id,
                'plan_type': payment.plan_type,
                'stripe_subscription_id': payment.stripe_subscription_id,
                'stripe_session_id': payment.stripe_checkout_session_id,
                'created_via': 'webhook',
            }
        )
        
        return cert
        
    except Exception as e:
        logger.error(f"❌ Error in manual certification creation: {str(e)}")
        return None


def handle_subscription_created(subscription):
    """Gérer la création d'un abonnement"""
    try:
        logger.info(f"🆕 Subscription created: {subscription.get('id')}")
        
        # Trouver le paiement correspondant
        payment = Payment.objects.filter(
            stripe_subscription_id=subscription.get('id')
        ).first()
        
        if payment:
            # Mettre à jour les dates
            payment.subscription_start = timezone.fromtimestamp(subscription.get('current_period_start'))
            payment.subscription_end = timezone.fromtimestamp(subscription.get('current_period_end'))
            payment.save()
            
            logger.info(f"📅 Updated payment {payment.id} dates")
        
        return Response({'status': 'processed'})
        
    except Exception as e:
        logger.error(f"Error handling subscription created: {str(e)}")
        return Response({'status': 'error', 'error': str(e)})


def handle_invoice_payment_succeeded(invoice):
    """Gérer un paiement de facture réussi (renouvellement)"""
    try:
        logger.info(f"💰 Invoice payment succeeded: {invoice.get('id')}")
        
        subscription_id = invoice.get('subscription')
        
        if not subscription_id:
            return Response({'status': 'ignored', 'reason': 'No subscription'})
        
        # Trouver le paiement original
        original_payment = Payment.objects.filter(
            stripe_subscription_id=subscription_id,
            status='completed'
        ).order_by('-created_at').first()
        
        if original_payment:
            # Créer un nouveau paiement pour le renouvellement
            new_payment = Payment.objects.create(
                user=original_payment.user,
                stripe_customer_id=original_payment.stripe_customer_id,
                stripe_subscription_id=subscription_id,
                stripe_payment_intent_id=invoice.get('payment_intent'),
                plan_type=original_payment.plan_type,
                amount=invoice.get('amount_paid', 0) / 100,
                currency=invoice.get('currency', 'usd').upper(),
                status='completed',
                payment_date=timezone.fromtimestamp(invoice.get('created')),
                subscription_start=timezone.now(),
                subscription_end=timezone.now() + timedelta(days=30),  # Par défaut
                metadata={
                    **original_payment.metadata,
                    'invoice_id': invoice.get('id'),
                    'billing_reason': invoice.get('billing_reason'),
                    'is_renewal': True,
                }
            )
            
            # Mettre à jour les dates si on peut récupérer l'abonnement
            try:
                subscription = stripe.Subscription.retrieve(subscription_id)
                new_payment.subscription_start = timezone.fromtimestamp(subscription.current_period_start)
                new_payment.subscription_end = timezone.fromtimestamp(subscription.current_period_end)
                new_payment.save()
            except:
                pass
            
            # Étendre la certification
            new_payment.create_or_update_certification()
            
            logger.info(f"🔄 Renewal payment created: {new_payment.id}")
        
        return Response({'status': 'processed'})
        
    except Exception as e:
        logger.error(f"Error handling invoice payment: {str(e)}")
        return Response({'status': 'error', 'error': str(e)})


def handle_subscription_deleted(subscription):
    """Gérer la suppression d'un abonnement"""
    try:
        logger.info(f"🗑️ Subscription deleted: {subscription.get('id')}")
        
        # Marquer les paiements comme annulés
        Payment.objects.filter(
            stripe_subscription_id=subscription.get('id')
        ).update(
            status='canceled',
            subscription_end=timezone.now()
        )
        
        return Response({'status': 'processed'})
        
    except Exception as e:
        logger.error(f"Error handling subscription deleted: {str(e)}")
        return Response({'status': 'error', 'error': str(e)})


def handle_invoice_payment_failed(invoice):
    """Gérer un échec de paiement"""
    try:
        logger.warning(f"⚠️ Invoice payment failed: {invoice.get('id')}")
        
        payment = Payment.objects.filter(
            stripe_payment_intent_id=invoice.get('payment_intent')
        ).first()
        
        if payment:
            payment.status = 'failed'
            payment.save()
        
        return Response({'status': 'processed'})
        
    except Exception as e:
        logger.error(f"Error handling payment failed: {str(e)}")
        return Response({'status': 'error', 'error': str(e)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subscription_details(request):
    """Obtenir les détails de l'abonnement - Version sans metadata"""
    try:
        user = request.user
        
        # 1. Vérifier si l'utilisateur a un profil
        if not hasattr(user, 'profile'):
            return Response({
                'has_active_subscription': False,
                'message': 'Profile not found',
                'status': 'no_profile'
            }, status=200)
        
        profile = user.profile
        now = timezone.now()
        
        # 2. Vérifier d'abord les certifications premium actives
        existing_premium = Certification.objects.filter(
            profile=profile,
            certification_type__name='premium',
            status='active'
        ).exclude(subscription_end__isnull=True) \
         .filter(subscription_end__gt=now) \
         .first()
        
        if existing_premium:
            # Calculer les jours restants
            days_remaining = max(0, (existing_premium.subscription_end - now).days)
            
            # Trouver le paiement associé (par date ou ID si stocké ailleurs)
            associated_payment = None
            
            # Essayer de trouver par date correspondante
            if existing_premium.subscription_end:
                associated_payment = Payment.objects.filter(
                    user=user,
                    status='completed',
                    subscription_end=existing_premium.subscription_end
                ).first()
            
            # Sinon, prendre le paiement le plus récent
            if not associated_payment:
                associated_payment = Payment.objects.filter(
                    user=user,
                    status='completed'
                ).exclude(subscription_end__isnull=True) \
                 .filter(subscription_end__gt=now) \
                 .order_by('-created_at').first()
            
            # Préparer la réponse
            response_data = {
                'has_active_subscription': True,
                'status': 'active',
                'source': 'existing_certification',
                'certification': {
                    'id': existing_premium.id,
                    'status': existing_premium.status,
                    'subscription_start': existing_premium.subscription_start.isoformat() if existing_premium.subscription_start else None,
                    'subscription_end': existing_premium.subscription_end.isoformat(),
                    'days_remaining': days_remaining,
                    'is_active': True,
                    'created_at': existing_premium.created_at.isoformat(),
                },
                'payment': {
                    'id': associated_payment.id if associated_payment else None,
                    'plan_type': associated_payment.plan_type if associated_payment else None,
                    'amount': float(associated_payment.amount) if associated_payment else None,
                    'currency': associated_payment.currency if associated_payment else None,
                    'status': associated_payment.status if associated_payment else None,
                    'subscription_start': associated_payment.subscription_start.isoformat() if associated_payment and associated_payment.subscription_start else None,
                    'subscription_end': associated_payment.subscription_end.isoformat() if associated_payment and associated_payment.subscription_end else None,
                    'stripe_subscription_id': associated_payment.stripe_subscription_id if associated_payment else None,
                    'stripe_customer_id': associated_payment.stripe_customer_id if associated_payment else None,
                } if associated_payment else None,
                'subscription_summary': {
                    'plan_type': associated_payment.plan_type if associated_payment else 'premium',
                    'amount': float(associated_payment.amount) if associated_payment else 0,
                    'currency': associated_payment.currency if associated_payment else 'USD',
                    'start_date': existing_premium.subscription_start.isoformat() if existing_premium.subscription_start else None,
                    'end_date': existing_premium.subscription_end.isoformat(),
                    'days_remaining': days_remaining,
                    'is_active': True,
                },
                'can_cancel': associated_payment is not None and associated_payment.stripe_subscription_id is not None,
                'last_updated': now.isoformat(),
            }
            
            return Response(response_data)
        
        # 3. Si pas de certification, vérifier les paiements actifs
        active_payment = Payment.objects.filter(
            user=user,
            status='completed'
        ).exclude(subscription_end__isnull=True) \
         .filter(subscription_end__gt=now) \
         .order_by('-created_at').first()
        
        if active_payment:
            # Calculer les jours restants
            days_remaining = max(0, (active_payment.subscription_end - now).days)
            
            # Vérifier s'il existe une certification (peut être inactive)
            existing_cert = Certification.objects.filter(
                profile=profile,
                certification_type__name='premium'
            ).first()
            
            if existing_cert:
                # Mettre à jour la certification existante
                existing_cert.status = 'active'
                existing_cert.subscription_start = active_payment.subscription_start or now
                existing_cert.subscription_end = active_payment.subscription_end
                existing_cert.save()
                
                certification_data = {
                    'id': existing_cert.id,
                    'status': existing_cert.status,
                    'subscription_start': existing_cert.subscription_start.isoformat(),
                    'subscription_end': existing_cert.subscription_end.isoformat(),
                    'days_remaining': days_remaining,
                    'is_active': True,
                    'updated': True,
                }
            else:
                # Créer une nouvelle certification
                cert_type, _ = CertificationType.objects.get_or_create(
                    name='premium',
                    defaults={
                        'description': 'Premium subscription',
                        'icon': 'star',
                        'color': '#FFD700'
                    }
                )
                
                new_cert = Certification.objects.create(
                    profile=profile,
                    certification_type=cert_type,
                    status='active',
                    subscription_start=active_payment.subscription_start or now,
                    subscription_end=active_payment.subscription_end
                )
                
                certification_data = {
                    'id': new_cert.id,
                    'status': new_cert.status,
                    'subscription_start': new_cert.subscription_start.isoformat(),
                    'subscription_end': new_cert.subscription_end.isoformat(),
                    'days_remaining': days_remaining,
                    'is_active': True,
                    'created': True,
                }
            
            # Récupérer les infos Stripe si disponible
            stripe_info = {}
            if active_payment.stripe_subscription_id:
                try:
                    subscription = stripe.Subscription.retrieve(active_payment.stripe_subscription_id)
                    stripe_info = {
                        'id': subscription.id,
                        'status': subscription.status,
                        'current_period_start': timezone.fromtimestamp(subscription.current_period_start).isoformat() if subscription.current_period_start else None,
                        'current_period_end': timezone.fromtimestamp(subscription.current_period_end).isoformat() if subscription.current_period_end else None,
                        'cancel_at_period_end': subscription.cancel_at_period_end,
                    }
                except Exception as e:
                    stripe_info = {'error': 'Stripe retrieval failed'}
            
            response_data = {
                'has_active_subscription': True,
                'status': 'active',
                'source': 'active_payment',
                'certification': certification_data,
                'payment': {
                    'id': active_payment.id,
                    'plan_type': active_payment.plan_type,
                    'amount': float(active_payment.amount),
                    'currency': active_payment.currency,
                    'status': active_payment.status,
                    'subscription_start': active_payment.subscription_start.isoformat() if active_payment.subscription_start else None,
                    'subscription_end': active_payment.subscription_end.isoformat(),
                    'stripe_subscription_id': active_payment.stripe_subscription_id,
                    'stripe_customer_id': active_payment.stripe_customer_id,
                    'stripe_checkout_session_id': active_payment.stripe_checkout_session_id,
                    'created_at': active_payment.created_at.isoformat(),
                },
                'stripe_subscription': stripe_info,
                'subscription_summary': {
                    'plan_type': active_payment.plan_type,
                    'amount': float(active_payment.amount),
                    'currency': active_payment.currency,
                    'start_date': active_payment.subscription_start.isoformat() if active_payment.subscription_start else None,
                    'end_date': active_payment.subscription_end.isoformat(),
                    'days_remaining': days_remaining,
                    'is_active': True,
                },
                'can_cancel': active_payment.stripe_subscription_id is not None,
                'cancel_options': [
                    {
                        'type': 'immediate',
                        'label': 'Cancel Immediately',
                        'description': 'Cancel now and lose access immediately.',
                        'warning': 'You will lose access to premium features immediately.'
                    },
                    {
                        'type': 'end_of_period',
                        'label': 'Cancel at Period End',
                        'description': 'Continue until the end of your billing period.',
                        'warning': 'You will keep premium access until your subscription ends.'
                    }
                ],
                'last_updated': now.isoformat(),
            }
            
            return Response(response_data)
        
        # 4. Vérifier les paiements en attente
        pending_payments = Payment.objects.filter(
            user=user,
            status='pending'
        ).exists()
        
        if pending_payments:
            return Response({
                'has_active_subscription': False,
                'status': 'pending',
                'message': 'Payment is being processed. Please wait a few moments.',
                'next_step': 'Try again in 30 seconds or check payment status.'
            }, status=200)
        
        # 5. Aucun abonnement trouvé
        return Response({
            'has_active_subscription': False,
            'status': 'not_found',
            'message': 'No active subscription found',
            'suggestion': 'Subscribe to a premium plan to unlock this feature.',
            'debug_info': {
                'user_id': user.id,
                'username': user.username,
                'has_profile': True,
                'profile_id': profile.id,
                'payments_total': Payment.objects.filter(user=user).count(),
                'certifications_total': Certification.objects.filter(profile=profile).count(),
                'current_time': now.isoformat(),
            } if settings.DEBUG else None,
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error in get_subscription_details: {str(e)}", exc_info=True)
        
        return Response({
            'has_active_subscription': False,
            'status': 'error',
            'message': 'An error occurred while retrieving subscription details',
            'error': str(e) if settings.DEBUG else None,
        }, status=500)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    """Annuler l'abonnement Stripe"""
    try:
        user = request.user
        cancel_type = request.data.get('type', 'end_of_period')  # 'immediate' ou 'end_of_period'
        
        # Vérifier que l'utilisateur a un abonnement actif
        active_payment = Payment.objects.filter(
            user=user,
            status='completed',
            subscription_end__gt=timezone.now()
        ).order_by('-created_at').first()
        
        if not active_payment:
            return Response({
                'success': False,
                'message': 'No active subscription found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier d'abord si l'ID Stripe est valide
        stripe_subscription_id = active_payment.stripe_subscription_id
        stripe_available = False
        
        if stripe_subscription_id:
            try:
                # Tester la connexion à Stripe avec une requête simple
                test_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
                stripe_available = True
                logger.info(f"Stripe subscription {stripe_subscription_id} is valid")
            except stripe.error.InvalidRequestError as e:
                # ID Stripe invalide ou n'existe pas
                logger.warning(f"Stripe subscription ID {stripe_subscription_id} is invalid: {str(e)}")
                stripe_available = False
                stripe_subscription_id = None
            except stripe.error.AuthenticationError as e:
                # Erreur d'authentification Stripe
                logger.error(f"Stripe authentication error: {str(e)}")
                stripe_available = False
        
        # Si pas d'ID d'abonnement Stripe valide, annuler localement
        if not stripe_available:
            logger.info(f"Cancelling subscription locally for user {user.id} (Stripe unavailable or invalid ID)")
            return cancel_subscription_locally(active_payment, cancel_type)
        
        # Annuler via Stripe
        try:
            if cancel_type == 'immediate':
                # Annulation immédiate avec remboursement pro rata
                try:
                    cancelled_subscription = stripe.Subscription.delete(
                        stripe_subscription_id,
                        invoice_now=True,  # Facturer immédiatement pour la période en cours
                        prorate=True       # Remboursement au prorata
                    )
                    
                    # Mettre à jour le paiement
                    active_payment.status = 'canceled'
                    active_payment.subscription_end = timezone.now()
                    active_payment.metadata['stripe_cancellation'] = {
                        'type': 'immediate',
                        'date': timezone.now().isoformat(),
                        'status': cancelled_subscription.status,
                        'id': cancelled_subscription.id
                    }
                    active_payment.save()
                    
                    # Mettre à jour la certification IMMÉDIATEMENT
                    update_certification_after_cancellation(user, active_payment, 'immediate')
                    
                    message = "Subscription cancelled immediately. You no longer have premium access."
                    
                except stripe.error.InvalidRequestError as e:
                    # Si l'annulation immédiate échoue, essayer l'annulation à la fin de la période
                    logger.warning(f"Immediate cancellation failed, trying end-of-period: {str(e)}")
                    return cancel_at_period_end(stripe_subscription_id, user, active_payment)
                
            else:  # 'end_of_period'
                return cancel_at_period_end(stripe_subscription_id, user, active_payment)
            
            # Journaliser l'annulation
            logger.info(f"Subscription cancelled for user {user.id}: {cancel_type}")
            
            return Response({
                'success': True,
                'message': message,
                'cancellation_type': cancel_type,
                'subscription_end': active_payment.subscription_end.isoformat() if active_payment.subscription_end else None,
                'stripe_subscription_id': active_payment.stripe_subscription_id,
            })
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error cancelling subscription: {str(e)}")
            
            # Fallback: annulation locale
            return cancel_subscription_locally(active_payment, cancel_type)
        
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error cancelling subscription: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def cancel_at_period_end(stripe_subscription_id, user, payment):
    """Annuler l'abonnement à la fin de la période"""
    try:
        # Annulation à la fin de la période
        subscription = stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        # Calculer la date de fin
        end_date = datetime.fromtimestamp(subscription.current_period_end, timezone.get_current_timezone())
        
        # Mettre à jour le paiement
        payment.metadata['stripe_cancellation'] = {
            'type': 'end_of_period',
            'scheduled_date': end_date.isoformat(),
            'status': subscription.status,
            'cancel_at_period_end': subscription.cancel_at_period_end,
            'current_period_end': subscription.current_period_end
        }
        payment.save()
        
        # Mettre à jour la certification pour expiration future
        update_certification_after_cancellation(user, payment, 'end_of_period')
        
        message = f"Subscription will cancel at the end of your billing period on {end_date.strftime('%B %d, %Y')}. You will keep premium access until then."
        
        return Response({
            'success': True,
            'message': message,
            'cancellation_type': 'end_of_period',
            'subscription_end': end_date.isoformat(),
            'stripe_subscription_id': payment.stripe_subscription_id,
        })
        
    except Exception as e:
        logger.error(f"Error in cancel_at_period_end: {str(e)}")
        raise


def cancel_subscription_locally(payment, cancel_type):
    """Annuler l'abonnement localement (fallback)"""
    try:
        user = payment.user
        
        if cancel_type == 'immediate':
            payment.status = 'canceled'
            payment.subscription_end = timezone.now()
            payment.metadata['cancellation'] = {
                'type': 'immediate_local',
                'date': timezone.now().isoformat(),
                'note': 'Cancelled locally (Stripe integration failed)'
            }
            payment.save()
            
            # Mettre à jour la certification immédiatement
            update_certification_after_cancellation(user, payment, 'immediate')
            
            message = "Subscription cancelled immediately (local). You no longer have premium access."
            
        else:  # 'end_of_period'
            # Si pas de date de fin, utiliser 30 jours à partir de maintenant
            if not payment.subscription_end:
                payment.subscription_end = timezone.now() + timedelta(days=30)
            
            payment.metadata['cancellation'] = {
                'type': 'end_of_period_local',
                'date': timezone.now().isoformat(),
                'scheduled_end': payment.subscription_end.isoformat() if payment.subscription_end else None,
                'note': 'Scheduled for cancellation at period end (Stripe integration failed)'
            }
            payment.save()
            
            # Mettre à jour la certification pour expiration future
            update_certification_after_cancellation(user, payment, 'end_of_period')
            
            message = f"Subscription will cancel at the end of your billing period on {payment.subscription_end.strftime('%B %d, %Y') if payment.subscription_end else 'unknown date'}."
        
        return Response({
            'success': True,
            'message': message,
            'cancellation_type': cancel_type,
            'note': 'Cancelled locally (Stripe unavailable)',
            'subscription_end': payment.subscription_end.isoformat() if payment.subscription_end else None,
        })
        
    except Exception as e:
        logger.error(f"Error in local cancellation: {str(e)}")
        raise
def update_certification_after_cancellation(user, payment, cancel_type):
    """
    Met à jour la certification premium après annulation
    Retourne True si la certification a été mise à jour
    """
    try:
        profile = user.profile
        
        # Trouver la certification premium active
        premium_cert = Certification.objects.filter(
            profile=profile,
            certification_type__name='premium',
            status='active'
        ).first()
        
        if not premium_cert:
            logger.warning(f"⚠️ No active premium certification found for user {user.id}")
            
            # Vérifier s'il y a une certification inactive
            inactive_cert = Certification.objects.filter(
                profile=profile,
                certification_type__name='premium'
            ).first()
            
            if inactive_cert:
                logger.info(f"ℹ️ Found inactive premium certification: {inactive_cert.id}, status: {inactive_cert.status}")
                # Mettre à jour quand même
                premium_cert = inactive_cert
            else:
                return False
        
        logger.info(f"🎯 Updating certification {premium_cert.id} for user {user.id}, cancel type: {cancel_type}")
        
        # S'assurer que les métadonnées existent
        if not premium_cert.metadata:
            premium_cert.metadata = {}
        
        # Préparer les données de cancellation
        cancellation_data = {
            'payment_id': payment.id,
            'cancel_type': cancel_type,
            'canceled_at': timezone.now().isoformat(),
            'payment_plan': payment.plan_type,
            'updated_at': timezone.now().isoformat(),
        }
        
        if cancel_type == 'immediate':
            # Annulation immédiate : expirer immédiatement
            premium_cert.status = 'expired'
            premium_cert.subscription_end = timezone.now()
            
            cancellation_data.update({
                'action': 'immediate_expiration',
                'effective_date': timezone.now().isoformat(),
            })
            
            premium_cert.metadata['cancellation'] = cancellation_data
            premium_cert.save()
            
            logger.info(f"✅ Premium certification immediately expired for user {user.id}")
            logger.info(f"   Certification ID: {premium_cert.id}")
            logger.info(f"   New status: {premium_cert.status}")
            logger.info(f"   New end date: {premium_cert.subscription_end}")
            
        else:  # 'end_of_period'
            # Annulation à la fin de la période
            
            # Si le paiement a une date de fin, l'utiliser
            if payment.subscription_end:
                new_end_date = payment.subscription_end
            elif premium_cert.subscription_end:
                new_end_date = premium_cert.subscription_end
            else:
                # Défaut : 30 jours à partir de maintenant
                new_end_date = timezone.now() + timedelta(days=30)
            
            # Mettre à jour la date de fin
            premium_cert.subscription_end = new_end_date
            
            # Changer le statut pour indiquer qu'il expirera bientôt
            # Vous pouvez ajouter ce statut à vos choix
            if 'pending_expiration' in dict(Certification.STATUS_CHOICES):
                premium_cert.status = 'pending_expiration'
            else:
                premium_cert.status = 'active'  # Reste actif mais avec date de fin
            
            cancellation_data.update({
                'action': 'scheduled_expiration',
                'scheduled_end': new_end_date.isoformat(),
                'original_end_date': premium_cert.subscription_end.isoformat() if premium_cert.subscription_end else None,
            })
            
            premium_cert.metadata['cancellation'] = cancellation_data
            premium_cert.save()
            
            logger.info(f"✅ Premium certification scheduled for end of period for user {user.id}")
            logger.info(f"   Certification ID: {premium_cert.id}")
            logger.info(f"   New status: {premium_cert.status}")
            logger.info(f"   Scheduled end date: {premium_cert.subscription_end}")
            logger.info(f"   Days remaining: {(premium_cert.subscription_end - timezone.now()).days if premium_cert.subscription_end else 0}")
        
        # Vérifier que la sauvegarde a fonctionné
        premium_cert.refresh_from_db()
        logger.info(f"🔍 Certification after update:")
        logger.info(f"   Status: {premium_cert.status}")
        logger.info(f"   Subscription end: {premium_cert.subscription_end}")
        logger.info(f"   Metadata: {premium_cert.metadata}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error updating certification after cancellation: {str(e)}", exc_info=True)
        
        # Fallback: essayer une méthode plus simple
        try:
            logger.info("🔄 Trying fallback update method...")
            
            profile = user.profile
            cert = Certification.objects.filter(
                profile=profile,
                certification_type__name='premium'
            ).first()
            
            if cert:
                if cancel_type == 'immediate':
                    cert.status = 'expired'
                    cert.subscription_end = timezone.now()
                else:
                    cert.status = 'active'
                    if payment.subscription_end:
                        cert.subscription_end = payment.subscription_end
                
                # Créer des métadonnées simples
                cert.metadata = {
                    'cancellation_fallback': {
                        'cancel_type': cancel_type,
                        'updated_at': timezone.now().isoformat(),
                        'note': 'Updated via fallback method'
                    }
                }
                
                cert.save()
                logger.info(f"✅ Fallback update successful for certification {cert.id}")
                return True
                
        except Exception as fallback_error:
            logger.error(f"❌ Fallback also failed: {str(fallback_error)}")
        
        return False
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reactivate_subscription(request):
    """Réactiver un abonnement annulé"""
    try:
        user = request.user
        
        # Trouver un abonnement annulé mais pas encore expiré
        cancelled_payment = Payment.objects.filter(
            user=user,
            status='canceled',
            subscription_end__gt=timezone.now()  # Pas encore expiré
        ).order_by('-created_at').first()
        
        if not cancelled_payment:
            return Response({
                'success': False,
                'message': 'No cancellable subscription found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Si c'est un abonnement Stripe
        if cancelled_payment.stripe_subscription_id:
            try:
                # Réactiver dans Stripe
                subscription = stripe.Subscription.modify(
                    cancelled_payment.stripe_subscription_id,
                    cancel_at_period_end=False
                )
                
                # Mettre à jour le paiement
                cancelled_payment.status = 'completed'
                cancelled_payment.metadata['reactivated'] = {
                    'date': timezone.now().isoformat(),
                    'stripe_status': subscription.status
                }
                cancelled_payment.save()
                
                # Réactiver la certification
                reactivate_certification(user, cancelled_payment)
                
                message = "Subscription reactivated successfully!"
                
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error reactivating subscription: {str(e)}")
                return Response({
                    'success': False,
                    'message': f'Error reactivating with Stripe: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Réactiver localement
            cancelled_payment.status = 'completed'
            cancelled_payment.metadata['reactivated'] = {
                'date': timezone.now().isoformat(),
                'note': 'Reactivated locally'
            }
            cancelled_payment.save()
            
            reactivate_certification(user, cancelled_payment)
            
            message = "Subscription reactivated locally!"
        
        return Response({
            'success': True,
            'message': message,
            'subscription_end': cancelled_payment.subscription_end.isoformat() if cancelled_payment.subscription_end else None,
        })
        
    except Exception as e:
        logger.error(f"Error reactivating subscription: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error reactivating subscription: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def reactivate_certification(user, payment):
    """Réactiver la certification"""
    try:
        profile = user.profile
        
        certification = Certification.objects.filter(
            profile=profile,
            certification_type__name='premium'
        ).order_by('-subscription_end').first()
        
        if certification:
            certification.status = 'active'
            certification.metadata['reactivated'] = {
                'date': timezone.now().isoformat(),
                'payment_id': payment.id
            }
            certification.save()
            
            logger.info(f"Certification {certification.id} reactivated for user {user.id}")
            
    except Exception as e:
        logger.error(f"Error reactivating certification: {str(e)}")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cancellation_history(request):
    """Obtenir l'historique des annulations"""
    try:
        user = request.user
        
        cancelled_payments = Payment.objects.filter(
            user=user,
            metadata__has_key='cancellation'
        ).order_by('-created_at')
        
        history = []
        for payment in cancelled_payments:
            cancellation_data = payment.metadata.get('cancellation', {})
            history.append({
                'date': cancellation_data.get('date'),
                'type': cancellation_data.get('type'),
                'subscription_end': payment.subscription_end,
                'plan_type': payment.plan_type,
                'amount': payment.amount,
                'stripe_subscription_id': payment.stripe_subscription_id,
            })
        
        return Response({
            'history': history,
            'total_cancellations': len(history)
        })
        
    except Exception as e:
        logger.error(f"Error getting cancellation history: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)