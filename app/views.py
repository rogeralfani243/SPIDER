# rest framework module 
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token 
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view , permission_classes, authentication_classes
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView

#HTTTP module 
from django.http import JsonResponse
import traceback

#Model 
from .models import Category, Comment, Tag, PasswordResetCode,Profile, DeletionCode
from post.models import Post
from messaging.models import Block
#Serializer 
from .serializers import CategorySerializer, PostSerializer, CommentSerializer, TagSerializer, ProfileSerializer, ProfileUpdateSerializer,  UserUpdateSerializer, RegisterSerializer
from post.serializers import PostDetailSerializer, PostSerializer
#Json
import json

#django.views.decorators.csrf
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

#django.contrib.auth 
from django.contrib.auth.models import User
from django.db.models import Avg, Count
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model  #
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.shortcuts import get_object_or_404
from accounts.serializers import UserSerializer
from feedback.models import Feedback


from django.utils import timezone
from django.contrib.auth import logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Profile

# views.py - Django
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import json

from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.hashers import make_password
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json
import logging
import smtplib
logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_posts(request):
    posts = Post.objects.all()
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_comments(request):
    comments = Comment.objects.all()
    serializer = CommentSerializer(comments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_tags(request):
    tags = Tag.objects.all()
    serializer = TagSerializer(tags, many=True)
    return Response(serializer.data )



@api_view(['GET'])
def main(request):
    posts = Post.objects.all().order_by('-created_at')[:10]
    
    # ✅ CORRECTION : Ajoutez context={'request': request}
    serializer = PostSerializer(posts, many=True, context={'request': request})
    
   
    return Response({'posts': serializer.data})

@csrf_exempt
@require_http_methods(["GET"])
def user_suggestions(request):
    """
    Version temporaire utilisant User directement
    """
    try:
        # Vérifier si la table Profile existe en testant son import
        try:
            from .models import Profile
            # Si on arrive ici, le modèle existe, on peut l'utiliser
            if request.user.is_authenticated:
                profiles = Profile.objects.exclude(user=request.user)[:10]
                suggestions = [
                    {
                        'id': profile.id,
                        'username': profile.user.username,
                        'avatar': profile.image.url if profile.image else '/static/default-avatar.png',
                        'bio': profile.bio or ''
                    }
                    for profile in profiles
                ]
            else:
                profiles = Profile.objects.all()[:10]
                suggestions = [
                    {
                        'id': profile.id,
                        'username': profile.user.username,
                        'avatar': profile.image.url if profile.image else '/static/default-avatar.png',
                        'bio': profile.bio or ''
                    }
                    for profile in profiles
                ]
                
        except Exception as profile_error:
            print(f"Profile model not available: {profile_error}")
            # Fallback: utiliser User directement
            if request.user.is_authenticated:
                users = User.objects.exclude(id=request.user.id)[:10]
            else:
                users = User.objects.all()[:10]
            
            suggestions = [
                {
                    'id': user.id,
                    'username': user.username,
                    'avatar': f'https://ui-avatars.com/api/?name={user.username}&background=007bff&color=fff',
                    'bio': f'Utilisateur depuis {user.date_joined.year}'
                }
                for user in users
            ]
        
        return JsonResponse({
            'users': suggestions,
            'count': len(suggestions),
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error in user_suggestions: {str(e)}")
        # Fallback ultime avec des données basiques
        fallback_users = [
            {
                'id': 1,
                'username': 'admin',
                'avatar': 'https://ui-avatars.com/api/?name=Admin&background=007bff&color=fff',
                'bio': 'Administrateur'
            }
        ]
        return JsonResponse({'users': fallback_users})

@csrf_exempt
@require_http_methods(["GET"])
def subscription_status(request):
    """
    Version temporaire du statut d'abonnement
    """
    try:
        # Pour l'instant, toujours retourner False
        is_subscribed = False
        
        return JsonResponse({
            'is_subscribed': is_subscribed,
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error in subscription_status: {str(e)}")
        return JsonResponse({
            'is_subscribed': False,
            'status': 'error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def subscribe(request):
    """
    Version temporaire de l'abonnement
    """
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        
        print(f"Subscription request for user {user_id}")
        
        # Simuler le succès pour le moment
        return JsonResponse({
            'status': 'success',
            'message': f'Subscribed to user {user_id} (simulation)'
        })
        
    except Exception as e:
        print(f"Error in subscribe: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Subscription failed'
        }, status=500)
    



#the way to create a  new user
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    To create a new user
    """
    try :
        print("Registration attemp received")
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            #sign up a new user
            user =  serializer.save()

            #create new token 
            token = Token.objects.create(user=user)

            #Fetch automatically the profile made 
            profile = user.profile

            #Making an answer 
            user_data = {
                "id" : user.id,
                "username" : user.username ,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
            print(f"✅ User created successfully: {user.username}")
            return Response({
                'token': token.key,
                'user': user_data,
                'message': 'Compte créé avec succès'
            }, status=status.HTTP_201_CREATED)
        else :
            print(f"❌ Registration validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e :
        print (f" registration erreir: {str(e)}")
        return Response ({ 'error': 'Error while the process for registration '})
@api_view(['GET','PUT'])
@permission_classes([AllowAny])
def profile_detail_public(request, profile_id):
    """
    Public profile detail - accessible without authentication
    AVEC vérification des blocages utilisant votre modèle Block
    """
    try:
        profile = get_object_or_404(Profile, id=profile_id, user__is_active=True)
        profile_user = profile.user
        
        # VÉRIFICATION DES BLOCAGES si l'utilisateur est authentifié
        if request.user.is_authenticated:
            current_user = request.user
            
            # Vérifier les blocages actifs dans les deux sens avec votre modèle
            # 1. Vérifier si l'utilisateur courant a bloqué ce profil
            user_has_blocked = Block.objects.filter(
                blocker=current_user,
                blocked=profile_user,
                is_active=True
            ).exists()
            
            # 2. Vérifier si ce profil a bloqué l'utilisateur courant
            is_blocked_by_user = Block.objects.filter(
                blocker=profile_user,
                blocked=current_user,
                is_active=True
            ).exists()
            
            # 3. Vérifier les blocages expirés
            if user_has_blocked:
                # Vérifier si le blocage a expiré
                active_blocks = Block.objects.filter(
                    blocker=current_user,
                    blocked=profile_user,
                    is_active=True
                )
                for block in active_blocks:
                    if block.is_expired:
                        block.is_active = False
                        block.save()
                        user_has_blocked = False
            
            if is_blocked_by_user:
                # Vérifier si le blocage a expiré
                active_blocks = Block.objects.filter(
                    blocker=profile_user,
                    blocked=current_user,
                    is_active=True
                )
                for block in active_blocks:
                    if block.is_expired:
                        block.is_active = False
                        block.save()
                        is_blocked_by_user = False
            
            # Si l'utilisateur a bloqué ce profil OU est bloqué par ce profil
            if user_has_blocked or is_blocked_by_user:
                # Déterminer le type de blocage
                block_type = None
                if user_has_blocked:
                    block = Block.objects.filter(
                        blocker=current_user,
                        blocked=profile_user,
                        is_active=True
                    ).first()
                    block_type = block.block_type if block else 'both'
                elif is_blocked_by_user:
                    block = Block.objects.filter(
                        blocker=profile_user,
                        blocked=current_user,
                        is_active=True
                    ).first()
                    block_type = block.block_type if block else 'both'
                
                # Selon le type de blocage, déterminer ce qui est accessible
                if block_type == 'both' or block_type == 'profile':
                    # Blocage complet ou du profil - accès limité
                    if request.method == 'GET':
                        return Response({
                            'error': 'Access denied',
                            'message': 'This profile is not accessible due to blocking restrictions',
                            'block_type': block_type,
                            'profile_id': profile_id,
                            'username': profile_user.username,
                            'limited_info': True,
                            # Informations minimales uniquement
                            'id': profile.id,
                            'username': profile_user.username,
                            'first_name': profile_user.first_name,
                            'last_name': profile_user.last_name,
                            'is_blocked': True,
                            'block_reason': block.reason if block else None
                        }, status=status.HTTP_403_FORBIDDEN)
                    elif request.method == 'PUT':
                        return Response({
                            'error': 'Access denied',
                            'message': 'You cannot modify this profile due to blocking restrictions'
                        }, status=status.HTTP_403_FORBIDDEN)
                elif block_type == 'user':
                    # Blocage utilisateur seulement - le profil reste visible
                    # Mais certaines interactions sont bloquées
                    pass
        
        # Initialiser les variables d'images
        image_url = None
        image_bio_url = None
        
        # Construire les URLs des images avec gestion d'erreurs
        if profile.image:
            try:
                image_url = request.build_absolute_uri(profile.image.url)
            except Exception as e:
                print(f"❌ Error building image URL: {e}")
                image_url = None
        
        if profile.image_bio:
            try:
                image_bio_url = request.build_absolute_uri(profile.image_bio.url)
            except Exception as e:
                print(f"❌ Error building image_bio URL: {e}")
                image_bio_url = None
        
        # Gestion sécurisée des feedbacks
        try:
            # Calculer le rating moyen et le nombre de feedbacks
            avg_rating_result = Feedback.objects.filter(professional=profile_id).aggregate(
                Avg('rating')
            )
            avg_rating = avg_rating_result['rating__avg'] or 0.0
            
            # Récupérer les feedbacks (avec filtrage des blocages)
            feedbacks_query = Feedback.objects.filter(
                professional=profile_id
            ).select_related('user')
            
            # Si l'utilisateur est authentifié, filtrer les feedbacks des utilisateurs bloqués
            if request.user.is_authenticated:
                current_user = request.user
                
                # Récupérer les IDs des utilisateurs que j'ai bloqués
                blocked_users_ids = Block.objects.filter(
                    blocker=current_user,
                    is_active=True
                ).values_list('blocked', flat=True)
                
                # Récupérer les IDs des utilisateurs qui m'ont bloqué
                blocking_users_ids = Block.objects.filter(
                    blocked=current_user,
                    is_active=True
                ).values_list('blocker', flat=True)
                
                # Combiner les deux listes
                all_blocked_ids = set(blocked_users_ids) | set(blocking_users_ids)
                
                # Exclure les feedbacks des utilisateurs bloqués/bloquants
                feedbacks_query = feedbacks_query.exclude(user__in=all_blocked_ids)
            
            feedback_count = feedbacks_query.count()
            recent_feedbacks = feedbacks_query.order_by('-created_at')[:10]
            
            feedbacks_data = []
            for feedback in recent_feedbacks:
                try:
                    user_image_url = None
                    if feedback.user.profile.image:
                        user_image_url = request.build_absolute_uri(feedback.user.profile.image.url)
                    
                    feedbacks_data.append({
                        'id': feedback.id,
                        'user_name': f"{feedback.user.first_name} {feedback.user.last_name}".strip() or feedback.user.username,
                        'user_image': user_image_url,
                        'rating': feedback.rating,
                        'comment': feedback.comment,
                        'created_at': feedback.created_at
                    })
                except Exception as e:
                    print(f"❌ Error processing feedback {feedback.id}: {e}")
                    continue
                    
        except Exception as e:
            print(f"❌ Error with feedbacks query: {e}")
            avg_rating = 0.0
            feedback_count = 0
            feedbacks_data = []
        
        # Calcul des statistiques de followers/following avec filtrage des blocages
        try:
            # Compter les followers (avec filtrage des blocages)
            followers_query = profile.followers.all()
            
            if request.user.is_authenticated:
                current_user = request.user
                # Récupérer les IDs des utilisateurs bloqués dans les deux sens
                blocked_ids = Block.objects.filter(
                    blocker=current_user,
                    is_active=True
                ).values_list('blocked', flat=True)
                
                blocking_ids = Block.objects.filter(
                    blocked=current_user,
                    is_active=True
                ).values_list('blocker', flat=True)
                
                all_blocked_ids = set(blocked_ids) | set(blocking_ids)
                followers_query = followers_query.exclude(id__in=all_blocked_ids)
            
            followers_count = followers_query.count()
            
            # Compter les following
            following_query = profile.following.all()
            
            if request.user.is_authenticated:
                following_query = following_query.exclude(id__in=all_blocked_ids)
            
            following_count = following_query.count()
            
        except Exception as e:
            print(f"❌ Error calculating followers/following: {e}")
            followers_count = profile.followers.count()
            following_count = profile.following.count()
        
        # Déterminer si l'email doit être masqué
        show_email = True
        if request.user.is_authenticated:
            current_user = request.user
            
            # Vérifier s'il y a un blocage actif
            has_block_relationship = Block.objects.filter(
                Q(blocker=current_user, blocked=profile_user, is_active=True) |
                Q(blocker=profile_user, blocked=current_user, is_active=True)
            ).exists()
            
            show_email = not has_block_relationship
        
        # Construction des données du profil
        profile_data = {
            'id': profile.id,
            'user_id': profile_user.id,
            'username': profile_user.username,
            'first_name': profile_user.first_name,
            'last_name': profile_user.last_name,
            'email': profile_user.email if show_email else None,
            'image': image_url,
            'image_bio': image_bio_url,
            'bio': profile.bio,
            'social_links': profile.social_links,
            'city': profile.city,
            "zip_code": profile.zip_code,
            'state': profile.state,
            'country': profile.country,
            'address': profile.address,
            'location': profile.location,
            'website': profile.website,
            'birth_date': profile.birth_date,
            'category_name': profile.category.name if profile.category else None,
            'avg_rating': float(avg_rating),
            'feedback_count': feedback_count,
            'followers_count': followers_count,
            'following_count': following_count,
            'created_at': profile.created_at,
            'feedbacks': feedbacks_data,
            # Informations sur le statut de blocage
            'block_status': {
                'is_blocked': False,  # Par défaut
                'can_interact': True,  # Par défaut
                'block_type': None
            }
        }
        
        # Ajouter les informations de blocage si l'utilisateur est authentifié
        if request.user.is_authenticated:
            current_user = request.user
            
            # Vérifier les blocages
            user_blocked_profile = Block.objects.filter(
                blocker=current_user,
                blocked=profile_user,
                is_active=True
            ).first()
            
            profile_blocked_user = Block.objects.filter(
                blocker=profile_user,
                blocked=current_user,
                is_active=True
            ).first()
            
            is_blocked = user_blocked_profile or profile_blocked_user
            
            profile_data['block_status'] = {
                'is_blocked': bool(is_blocked),
                'can_interact': not bool(is_blocked),
                'block_type': user_blocked_profile.block_type if user_blocked_profile else 
                             profile_blocked_user.block_type if profile_blocked_user else None,
                'user_blocked_profile': bool(user_blocked_profile),
                'profile_blocked_user': bool(profile_blocked_user),
                'block_reason': user_blocked_profile.reason if user_blocked_profile else 
                              profile_blocked_user.reason if profile_blocked_user else None
            }
        
        print(f"✅ Profile data successfully built for profile {profile_id}")
        return Response(profile_data, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response({
            'error': 'Profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"💥 Unexpected error in profile_detail_public: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Internal server error',
            'details': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_profile_id(request):
    """
    Return the current user's profile ID
    """
    try:
        profile = Profile.objects.get(user=request.user)
        return Response({
            'profile_id': profile.id,
            'user_id': request.user.id,
            'username': request.user.username
        })
    except Profile.DoesNotExist:
        # Créer un profil s'il n'existe pas
        profile = Profile.objects.create(user=request.user)
        return Response({
            'profile_id': profile.id,
            'user_id': request.user.id,
            'username': request.user.username,
            'message': 'New profile created'
        }, status=status.HTTP_201_CREATED)
    
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_image(request):
    """
    Uploader une image de profil
    """
    try:
        profile = request.user.profile
        
        if 'image' not in request.FILES:
            return Response({
                'error': 'Aucune image fournie'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validation de l'image
        if not image_file.content_type.startswith('image/'):
            return Response({
                'error': 'Le fichier doit être une image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if image_file.size > 5 * 1024 * 1024:  # 5MB max
            return Response({
                'error': 'L\'image ne doit pas dépasser 5MB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sauvegarder l'image
        profile.image = image_file
        profile.save()
        
        serializer = ProfileSerializer(profile)
        return Response({
            'profile': serializer.data,
            'message': 'Image de profil mise à jour avec succès'
        })
        
    except Profile.DoesNotExist:
        return Response({
            'error': 'Profil non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)
User = get_user_model()
@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile_detail(request, username):
    """
    Récupérer le profil d'un utilisateur par son username
    """
    try:
        user = User.objects.get(username=username)
        profile = user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)
        
    except User.DoesNotExist:
        return Response({
            'error': 'Utilisateur non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request, profile_id):
    """
    Update profile with manual save
    """
    try:
        print(f"🔍 UPDATE_PROFILE - Profile ID: {profile_id}")
        print(f"👤 User: {request.user.username}")
        print(f"📦 Request data keys: {list(request.data.keys())}")
        print(f"📁 Files: {list(request.FILES.keys())}")
        
        # DEBUG: Afficher toutes les données
        print(f"📊 All POST data:")
        for key, value in request.data.items():
            print(f"   {key}: {value}")
        
        profile = get_object_or_404(Profile, id=profile_id)
        
        # Check permissions
        if profile.user != request.user:
            return Response(
                {'error': 'You can only update your own profile'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Sauvegarde manuelle des données
        updated_fields = []

        # Update user fields
        if 'first_name' in request.data:
            profile.user.first_name = request.data['first_name']
            updated_fields.append('first_name')
            print(f"✏️ Updated first_name: {request.data['first_name']}")
        
        if 'last_name' in request.data:
            profile.user.last_name = request.data['last_name']
            updated_fields.append('last_name')
            print(f"✏️ Updated last_name: {request.data['last_name']}")
        
        if 'email' in request.data:
            profile.user.email = request.data['email']
            updated_fields.append('email')
            print(f"✏️ Updated email: {request.data['email']}")

        # Update profile fields
        if 'bio' in request.data:
            profile.bio = request.data['bio']
            updated_fields.append('bio')
            print(f"✏️ Updated bio: {request.data['bio']}")
        
        # Update profile fields
        if 'social_links' in request.data:
            profile.social_links = request.data['social_links']
            updated_fields.append('social_links')
            print(f"✏️ Updated social_links: {request.data['social_links']}") 


        if 'location' in request.data:
            profile.location = request.data['location']
            updated_fields.append('location')
            print(f"✏️ Updated location: {request.data['location']}")
        
        if 'website' in request.data:
            profile.website = request.data['website']
            updated_fields.append('website')
            print(f"✏️ Updated website: {request.data['website']}")
        
        if 'birth_date' in request.data:
            profile.birth_date = request.data['birth_date']
            updated_fields.append('birth_date')
            print(f"✏️ Updated birth_date: {request.data['birth_date']}")

        # AJOUTEZ CE BLOC POUR LA CATÉGORIE
        if 'category' in request.data:
            category_value = request.data['category']
            print(f"🎯 Processing category value: {category_value} (type: {type(category_value)})")
            
            if category_value:  # Si ce n'est pas vide
                try:
                    # Essayer de convertir en entier
                    category_id = int(category_value)
                    category = Category.objects.get(id=category_id)
                    profile.category = category
                    updated_fields.append('category')
                    print(f"✏️ Updated category to ID: {category_id} (Name: {category.name})")
                except (ValueError, Category.DoesNotExist) as e:
                    print(f"⚠️ Could not find category with ID {category_value}: {e}")
                    # Essayer par nom
                    try:
                        category = Category.objects.get(name=category_value)
                        profile.category = category
                        updated_fields.append('category')
                        print(f"✏️ Updated category to Name: {category_value} (ID: {category.id})")
                    except Category.DoesNotExist:
                        print(f"❌ Category '{category_value}' not found")
                        profile.category = None
                        updated_fields.append('category')
                        print(f"✏️ Set category to None (not found)")
            else:
                # Si category est vide, mettre à None
                profile.category = None
                updated_fields.append('category')
                print(f"✏️ Set category to None (empty value)")
        
        # Ajoutez aussi pour 'category_id' au cas où
        elif 'category_id' in request.data:
            category_id_value = request.data['category_id']
            print(f"🎯 Processing category_id value: {category_id_value}")
            
            if category_id_value and category_id_value != 'null' and category_id_value != '':
                try:
                    category_id = int(category_id_value)
                    category = Category.objects.get(id=category_id)
                    profile.category = category
                    updated_fields.append('category')
                    print(f"✏️ Updated category via category_id to ID: {category_id}")
                except (ValueError, Category.DoesNotExist) as e:
                    print(f"❌ Invalid category_id {category_id_value}: {e}")
                    profile.category = None
            else:
                profile.category = None
                updated_fields.append('category')
                print(f"✏️ Set category to None (empty category_id)")

        # Gérer les champs d'adresse si présents
        if 'address' in request.data:
            profile.address = request.data['address']
            updated_fields.append('address')
            print(f"✏️ Updated address: {request.data['address']}")
        
        if 'city' in request.data:
            profile.city = request.data['city']
            updated_fields.append('city')
            print(f"✏️ Updated city: {request.data['city']}")
        
        if 'state' in request.data:
            profile.state = request.data['state']
            updated_fields.append('state')
            print(f"✏️ Updated state: {request.data['state']}")
        
        if 'zip_code' in request.data:
            profile.zip_code = request.data['zip_code']
            updated_fields.append('zip_code')
            print(f"✏️ Updated zip_code: {request.data['zip_code']}")
        
        if 'country' in request.data:
            profile.country = request.data['country']
            updated_fields.append('country')
            print(f"✏️ Updated country: {request.data['country']}")

        # Handle image upload
        if 'image' in request.FILES:
            profile.image = request.FILES['image']
            updated_fields.append('image')
            print(f"🖼️ Updated image: {request.FILES['image'].name}")
        if 'image' in request.FILES:
            profile.image_bio = request.FILES['image']
            updated_fields.append('image_bio')
            print(f"🖼️ Updated image: {request.FILES['image'].name}")

        print(f"💾 Saving {len(updated_fields)} fields: {updated_fields}")
        
        # Afficher l'état de la catégorie avant sauvegarde
        print(f"🔍 Category before save: {profile.category}")
        
        # Save changes
        profile.user.save()
        profile.save()
        
        print("✅ All changes saved to database")
        print(f"✅ Category after save: {profile.category}")

        # Return updated data
        serializer = ProfileSerializer(profile)
        return Response({
            'profile': serializer.data,
            'updated_fields': updated_fields,
            'message': f'Profile updated successfully. Updated: {", ".join(updated_fields)}'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"💥 Exception in update_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to update profile',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        print(f"💥 Exception in update_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to update profile',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile_id(request):
    """
    Get the current user's profile ID
    """
    try:
        # Récupérer ou créer le profil
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        return Response({
            'profile_id': profile.id,
            'user_id': request.user.id,
            'username': request.user.username,
     
        })
        
    except Exception as e:
        return Response({
            'error': f'Error getting profile: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
 #Get profiles by category with average rating
@api_view(['GET'])
@permission_classes([AllowAny])
def profiles_by_category(request, category_id=None):
    """
    Get profiles by category with average rating and feedbacks
    - Exact same feedback handling logic as profile_detail_public
    """
    try:
        print(f"Profiles by category endpoint hit! Category ID: {category_id}")
        
        # Si aucun category_id n'est fourni, retourner toutes les catégories avec leurs profils
        if category_id is None:
            all_categories = Category.objects.all()
            result = []
            
            for category in all_categories:
                profiles_in_category = Profile.objects.filter(category=category)
                
                if not profiles_in_category.exists():
                    continue
                
                profiles = profiles_in_category[:10]
                category_profiles = []
                
                for profile in profiles:
                    # MÊME LOGIQUE IMAGES que profile_detail_public
                    image_url = None
                    if profile.image:
                        try:
                            image_url = request.build_absolute_uri(profile.image.url)
                        except Exception as e:
                            print(f"❌ Error building image URL: {e}")
                            image_url = None
                    
                    # MÊME LOGIQUE FEEDBACKS que profile_detail_public
                    try:
                        # CORRECTION : Utilisation de profile.id comme dans profile_detail_public
                        avg_rating_result = Feedback.objects.filter(professional=profile.id).aggregate(Avg('rating'))
                        avg_rating = avg_rating_result['rating__avg'] or 0.0
                        feedback_count = Feedback.objects.filter(professional=profile.id).count()
                    except Exception as e:
                        print(f"❌ Error with feedbacks query: {e}")
                        avg_rating = 0.0
                        feedback_count = 0
                    
                    category_profiles.append({
                        'id': profile.id,
                        'user_id': profile.user.id,
                        'username': profile.user.username,
                        'first_name': profile.user.first_name or '',
                        'last_name': profile.user.last_name or '',
                        'image': image_url,
                        'bio': profile.bio or '',
                        'avg_rating': float(avg_rating),
                        'feedback_count': feedback_count,
                        'category_name': category.name
                    })
                
                result.append({
                    'category_id': category.id,
                    'category_name': category.name,
                    'profiles': category_profiles
                })
            
            return Response(result, status=status.HTTP_200_OK)
        
        # Si category_id est fourni
        else:
            try:
                category = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
            
            profiles = Profile.objects.filter(category=category)
            profile_data = []
            
            for profile in profiles:
                # MÊME LOGIQUE IMAGES
                image_url = None
                if profile.image:
                    try:
                        image_url = request.build_absolute_uri(profile.image.url)
                    except Exception as e:
                        print(f"❌ Error building image URL: {e}")
                        image_url = None
                
                # MÊME LOGIQUE FEEDBACKS
                try:
                    # CORRECTION : Utilisation de profile.id comme dans profile_detail_public
                    avg_rating_result = Feedback.objects.filter(professional=profile.id).aggregate(Avg('rating'))
                    avg_rating = avg_rating_result['rating__avg'] or 0.0
                    feedback_count = Feedback.objects.filter(professional=profile.id).count()
                except Exception as e:
                    print(f"❌ Error with feedbacks query: {e}")
                    avg_rating = 0.0
                    feedback_count = 0
                
                profile_data.append({
                    'id': profile.id,
                    'user_id': profile.user.id,
                    'username': profile.user.username,
                    'first_name': profile.user.first_name or '',
                    'last_name': profile.user.last_name or '',
                    'image': image_url,
                    'bio': profile.bio or '',
                    'avg_rating': float(avg_rating),
                    'feedback_count': feedback_count,
                    'category_name': category.name
                })
            
            return Response({
                'category_id': int(category_id),
                'category_name': category.name,
                'profiles': profile_data
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print(f"💥 Unexpected error in profiles_by_category: {e}")
        return Response({
            'error': 'Internal server error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def profile_feedbacks(request, profile_id):
    """
    Get all feedbacks for a profile
    """
    try:
        profile = get_object_or_404(Profile, id=profile_id)
        
        feedbacks = Feedback.objects.filter(
            professional=profile.user
        ).select_related('user').order_by('-created_at')
        
        feedbacks_data = []
        for feedback in feedbacks:
            feedbacks_data.append({
                'id': feedback.id,
                'user_name': f"{feedback.user.first_name} {feedback.user.last_name}".strip() or feedback.user.username,
                'user_image': feedback.user.profile.image.url if feedback.user.profile.image else None,
                'rating': feedback.rating,
                'comment': feedback.comment,
                'created_at': feedback.created_at
            })
        
        return Response(feedbacks_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Unable to fetch feedbacks',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def top_profiles(request):
    """
    Get top 100 profiles by rating
    """
    try:
        # Profils avec au moins 5 feedbacks, triés par rating
        top_profiles = Profile.objects.annotate(
            avg_rating=Avg('user__professional_feedbacks__rating'),
            feedback_count=Count('user__professional_feedbacks')
        ).filter(
            feedback_count__gte=5  # Au moins 5 avis
        ).order_by('-avg_rating')[:100]
        
        top_profiles_data = []
        for profile in top_profiles:
            image_url = None
            if profile.image:
                try:
                    image_url = request.build_absolute_uri(profile.image.url)
                except:
                    image_url = None
            
            top_profiles_data.append({
                'id': profile.id,
                'username': profile.user.username,
                'first_name': profile.user.first_name,
                'last_name': profile.user.last_name,
                'image': image_url,
                'avg_rating': float(profile.avg_rating) if profile.avg_rating else 0.0,
                'feedback_count': profile.feedback_count,
                'category_name': profile.category.name if profile.category else None
            })
        
        return Response(top_profiles_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Unable to fetch top profiles',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes({AllowAny})
def category_list(request):
    """
    Get all categories
    """
    try:
        categories = Category.objects.all()
        categories_data = []
        for category in categories :
            categories_data.append({
                'id': category.id,
                'name':category.name,
             
            })
        return Response(categories_data, status=status.HTTP_200_OK)
    except Exception as e :
        return Response ({
            'error' : 'Unable to fetch categories',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

from django.db.models import Q

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_follow(request, profile_id):
    """
    Follow/Unfollow a profile
    """
    try:
        target_profile = get_object_or_404(Profile, id=profile_id)
        current_profile = request.user.profile
        
        # Cannot follow yourself
        if target_profile == current_profile:
            return Response({
                'error': 'You cannot follow yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already following
        is_following = current_profile.is_following(target_profile)
        
        if is_following:
            # Unfollow
            current_profile.unfollow(target_profile)
            action = 'unfollowed'
        else:
            # Follow
            current_profile.follow(target_profile)
            action = 'followed'
        
        return Response({
            'status': 'success',
            'action': action,
            'is_following': not is_following,
            'followers_count': target_profile.get_followers_count(),
            'following_count': current_profile.get_following_count()
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to toggle follow',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def profile_followers(request, profile_id):
    """
    Get followers list for a profile
    """
    try:
        profile = get_object_or_404(Profile, id=profile_id)
        
        # Get followers with their profile data
        followers_profiles = profile.followers.all()
        
        followers_data = []
        for follower_profile in followers_profiles:
            image_url = None
            if follower_profile.image:
                try:
                    image_url = request.build_absolute_uri(follower_profile.image.url)
                except:
                    image_url = None
            
            followers_data.append({
                'id': follower_profile.id,
                'user_id': follower_profile.user.id,
                'username': follower_profile.user.username,
                'first_name': follower_profile.user.first_name or '',
                'last_name': follower_profile.user.last_name or '',
                'image': image_url,
                'bio': follower_profile.bio or '',
                'is_following_back': profile.is_following(follower_profile) if request.user.is_authenticated else False
            })
        
        return Response({
            'followers': followers_data,
            'count': len(followers_data)
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch followers',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def profile_following(request, profile_id):
    """
    Get following list for a profile
    """
    try:
        profile = get_object_or_404(Profile, id=profile_id)
        
        # Get profiles that this profile is following
        following_profiles = profile.following.all()
        
        following_data = []
        for following_profile in following_profiles:
            image_url = None
            if following_profile.image:
                try:
                    image_url = request.build_absolute_uri(following_profile.image.url)
                except:
                    image_url = None
            
            following_data.append({
                'id': following_profile.id,
                'user_id': following_profile.user.id,
                'username': following_profile.user.username,
                'first_name': following_profile.user.first_name or '',
                'last_name': following_profile.user.last_name or '',
                'image': image_url,
                'bio': following_profile.bio or '',
                'is_following_you': following_profile.is_following(profile) if request.user.is_authenticated else False
            })
        
        return Response({
            'following': following_data,
            'count': len(following_data)
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch following',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_follow_status(request, profile_id):
    """
    Check if current user is following a profile
    """
    try:
        target_profile = get_object_or_404(Profile, id=profile_id)
        current_profile = request.user.profile
        
        is_following = current_profile.is_following(target_profile)
        
        return Response({
            'is_following': is_following,
            'followers_count': target_profile.get_followers_count(),
            'following_count': target_profile.get_following_count()
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to check follow status',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user info"""
    user = request.user
    
    # Vérifier si l'utilisateur est authentifié
    if not user.is_authenticated:
        return Response(
            {"error": "User not authenticated"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Serializer l'utilisateur
    serializer = UserSerializer(user, context={'request': request})
    
    return Response({
        "user": serializer.data,
        "is_authenticated": True,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_profile(request):
    """
    Vue pour récupérer le profil de l'utilisateur connecté
    GET /profile/me/
    """
    try:
        logger.info(f"Fetching profile for current user: {request.user.id} - {request.user.username}")
        
        # Chercher le profil associé à l'utilisateur courant
        # Puisque Profile a une relation OneToOne avec User
        try:
            profile = Profile.objects.get(user=request.user)
            logger.info(f"Profile found for user {request.user.id}: Profile ID {profile.id}")
        except Profile.DoesNotExist:
            logger.warning(f"No profile found for user {request.user.id}")
            return Response(
                {
                    "success": False,
                    "message": "No profile found for this user",
                    "user_id": request.user.id,
                    "username": request.user.username
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response({
            "success": True,
            "profile": serializer.data,
            "user_id": request.user.id,
            "username": request.user.username
        })
        
    except Exception as e:
        logger.error(f"Error fetching current user profile: {str(e)}")
        return Response(
            {
                "success": False,
                "message": "Internal server error",
                "error": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# views.py
@api_view(['GET'])
@permission_classes([AllowAny])
def get_profile_by_user(request, user_id):
    """
    Récupère le profile_id pour un user_id donné
    GET /api/user/<user_id>/get-profile-id/
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Récupérer le profil associé
        try:
            profile = Profile.objects.get(user=user)
            return Response({
                'user_id': user.id,
                'profile_id': profile.id,
                'username': user.username
            })
        except Profile.DoesNotExist:
            return Response({
                'error': 'Profile not found for this user',
                'user_id': user.id,
                'username': user.username
            }, status=status.HTTP_404_NOT_FOUND)
            
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    


# Modèle temporaire pour stocker les codes (ou utilisez votre modèle existant)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_deletion_code(request):
    """
    Demander un code de suppression par email
    """
    try:
        user = request.user
        
        # Générer un code à 6 chiffres
        code = get_random_string(6, '0123456789')
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Sauvegarder le code (supprime les anciens codes)
        DeletionCode.objects.filter(user=user).delete()
        deletion_code = DeletionCode.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )
        
        # Envoyer l'email
        subject = 'Account Deletion Confirmation Code'
        message = f'''
        Hello {user.username},
        
        You have requested to delete your account.
        
        Your confirmation code is: {code}
        
        This code will expire in 15 minutes.
        
        If you did not request this, please ignore this email.
        
        Best regards,
        Your App Team
        '''
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        print(f"📧 Deletion code sent to {user.email}: {code}")
        
        return Response({
            'success': True,
            'message': 'A confirmation code has been sent to your email.',
            'expires_in': 15,  # minutes
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Error sending deletion code: {str(e)}")
        return Response({
            'error': 'Failed to send confirmation code'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_deletion_code(request):
    """
    Vérifier le code de suppression
    """
    try:
        user = request.user
        code = request.data.get('code', '').strip()
        
        # Vérifier si le code existe et est valide
        try:
            deletion_code = DeletionCode.objects.get(
                user=user,
                code=code,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except DeletionCode.DoesNotExist:
            return Response({
                'error': 'Invalid or expired confirmation code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Marquer le code comme utilisé
        deletion_code.is_used = True
        deletion_code.save()
        
        # Créer un token de session pour confirmer la suppression
        request.session['deletion_confirmed'] = True
        request.session['deletion_confirmed_at'] = timezone.now().isoformat()
        request.session['deletion_user_id'] = user.id
        
        return Response({
            'success': True,
            'message': 'Code verified successfully. You can now delete your account.',
            'token': deletion_code.id  # Optionnel: retourner un token
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Failed to verify code'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# views.py - Version corrigée
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def delete_account(request):
    """
    Supprimer le compte après vérification du code
    """
    try:
        user = request.user
        
        # Parse le body JSON
        import json
        body = json.loads(request.body)
        confirmation = body.get('confirmation', '').strip().lower()
        
        print(f"🔄 Delete request from: {user.username}")
        print(f"🔍 Confirmation text: {confirmation}")
        
        # Vérifier la phrase de confirmation
        if confirmation != 'delete my account':
            return Response({
                'error': 'Please type exactly "delete my account" to confirm'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'utilisateur a un code vérifié
        try:
            # Chercher un code vérifié pour cet utilisateur
            verified_code = DeletionCode.objects.filter(
                user=user,
                is_used=True,
                expires_at__gt=timezone.now() - timedelta(hours=1)  # Valide pendant 1h après vérification
            ).first()
            
            if not verified_code:
                return Response({
                    'error': 'Please verify your email with a confirmation code first'
                }, status=status.HTTP_403_FORBIDDEN)
                
            print(f"✅ User {user.username} has verified code: {verified_code.code}")
            
        except DeletionCode.DoesNotExist:
            return Response({
                'error': 'Please verify your email with a confirmation code first'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Logique de suppression (suppression douce)
        try:
            profile = Profile.objects.get(user=user)
            profile.is_active = False
            profile.deleted_at = timezone.now()
            profile.save()
            
            # Désactiver l'utilisateur
            user.is_active = False
            user.save()
            
            # Supprimer le code utilisé
            verified_code.delete()
            
            # Nettoyer les autres codes de l'utilisateur
            DeletionCode.objects.filter(user=user).delete()
            
            print(f"✅ Account deleted: {user.username}")
            
            return Response({
                'success': True,
                'message': 'Your account has been successfully deleted.'
            }, status=status.HTTP_200_OK)
            
        except Profile.DoesNotExist:
            return Response({
                'error': 'Profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"💥 Error deleting account: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to delete account',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_account_deletion(request):
    """
    Demander la suppression du compte (envoie un email de confirmation)
    """
    try:
        user = request.user
        email = user.email
        
        # Générer un token de suppression
        from django.utils.crypto import get_random_string
        deletion_token = get_random_string(50)
        
        # Sauvegarder le token dans la session ou un modèle temporaire
        request.session['deletion_token'] = deletion_token
        request.session['deletion_requested_at'] = timezone.now().isoformat()
        
        # Ici, vous enverriez normalement un email
        # avec un lien contenant le token
        # delete_url = f"{request.build_absolute_uri('/')}api/account/confirm-delete/{deletion_token}/"
        
        print(f"📧 Demande de suppression pour {user.username}")
        print(f"🔑 Token généré: {deletion_token}")
        
        return Response({
            'success': True,
            'message': 'Un email de confirmation a été envoyé à votre adresse.',
            'note': 'En développement, le token est affiché dans la console'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Erreur: {str(e)}")
        return Response({
            'error': 'Impossible de traiter la demande'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_account_deletion(request):
    """
    Annuler la suppression du compte (si suppression douce)
    """
    try:
        user = request.user
        profile = get_object_or_404(Profile, user=user)
        
        if not profile.is_active:
            # Réactiver le compte
            profile.is_active = True
            profile.deleted_at = None
            profile.save()
            
            user.is_active = True
            user.save()
            
            print(f"🔄 Compte réactivé: {user.username}")
            
            return Response({
                'success': True,
                'message': 'Votre compte a été réactivé avec succès.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Votre compte est déjà actif'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"💥 Erreur: {str(e)}")
        return Response({
            'error': 'Impossible de réactiver le compte'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
def confirm_delete_account(request, token):
    """
    Confirmer la suppression avec token
    """
    try:
        # Récupérer le token stocké
        stored_token = request.session.get('deletion_token')
        stored_time = request.session.get('deletion_requested_at')
        
        if not stored_token or stored_token != token:
            return Response({
                'error': 'Token invalide ou expiré'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier l'expiration (24 heures)
        if stored_time:
            requested_at = timezone.datetime.fromisoformat(stored_time)
            if timezone.now() - requested_at > timezone.timedelta(hours=24):
                return Response({
                    'error': 'Le lien de confirmation a expiré'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Supprimer le compte
        user_id = request.session.get('deletion_user_id')
        if user_id:
            user = User.objects.get(id=user_id)
            profile = Profile.objects.get(user=user)
            profile.soft_delete()
            
            # Nettoyer la session
            request.session.pop('deletion_token', None)
            request.session.pop('deletion_requested_at', None)
            request.session.pop('deletion_user_id', None)
            
            return Response({
                'success': True,
                'message': 'Votre compte a été supprimé avec succès.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Session invalide'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"💥 Erreur: {str(e)}")
        return Response({
            'error': 'Impossible de confirmer la suppression'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_password_change_code(request):
    """
    Demander un code pour changer le mot de passe
    """
    try:
        user = request.user
        
        # Vérifier si l'utilisateur a déjà un email
        if not user.email:
            return Response({
                'error': 'No email address associated with your account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier le format de l'email
        if '@' not in user.email:
            return Response({
                'error': 'Invalid email format in your account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Générer un code à 6 chiffres
        code = get_random_string(6, '0123456789')
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Supprimer les anciens codes
        PasswordResetCode.objects.filter(user=user, purpose='password_change').delete()
        
        # Sauvegarder le nouveau code
        reset_code = PasswordResetCode.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
            purpose='password_change'
        )
        
        # Récupérer le nom du site
        try:
            site_name = settings.SITE_NAME
        except AttributeError:
            site_name = 'Our Application'
        
        # Envoyer l'email
        subject = f'Password Change Verification Code - {site_name}'
        message = f'''
        Hello {user.username},
        
        You have requested to change your password.
        
        Your verification code is: {code}
        
        This code will expire in 15 minutes.
        
        If you did not request this, please ignore this email or contact support.
        
        Best regards,
        {site_name} Team
        '''
        
        # Gestion robuste de l'envoi d'email
        email_sent = False
        email_error_msg = None
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            print(f"✅ Password change code sent to {user.email}")
            email_sent = True
            
        except smtplib.SMTPAuthenticationError as e:
            email_error_msg = f"SMTP Authentication Error: {e}"
            print(f"❌ SMTP Auth Error: {e}")
            
        except smtplib.SMTPException as e:
            email_error_msg = f"SMTP Error: {e}"
            print(f"❌ SMTP Error: {e}")
            
        except ConnectionRefusedError as e:
            email_error_msg = f"Connection Refused: {e}"
            print(f"❌ Connection Refused: {e}")
            
        except TimeoutError as e:
            email_error_msg = f"Timeout Error: {e}"
            print(f"❌ Timeout Error: {e}")
            
        except Exception as e:
            email_error_msg = f"Email sending failed: {e}"
            print(f"⚠️ Email sending failed: {e}")
        
        # En mode DEBUG, on peut continuer même si l'email échoue
        if settings.DEBUG and not email_sent:
            print(f"📧 Code de changement de mot de passe (DEBUG): {code}")
            # On retourne le code en debug pour faciliter les tests
            return Response({
                'success': True,
                'message': 'A verification code has been generated. (Email failed in DEBUG mode)',
                'email': user.email,
                'expires_in': 15,
                'debug_code': code,
                'warning': f'Email sending failed: {email_error_msg}' if email_error_msg else None
            }, status=status.HTTP_200_OK)
        
        # En mode production, on échoue si l'email n'est pas envoyé
        elif not email_sent:
            # Supprimer le code créé car l'email a échoué
            reset_code.delete()
            return Response({
                'error': 'Failed to send verification email',
                'details': email_error_msg or 'Unknown email error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Succès - email envoyé
        return Response({
            'success': True,
            'message': 'A verification code has been sent to your email.',
            'email': user.email,  # Retourner l'email pour confirmation
            'expires_in': 15,  # minutes
            'debug_code': code if settings.DEBUG else None  # En développement seulement
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Error in password change request: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to process password change request',
            'details': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_password_change_code(request):
    """
    Vérifier le code pour changer le mot de passe
    """
    try:
        user = request.user
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '').strip()
        
        if not code:
            return Response({
                'error': 'Verification code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not new_password:
            return Response({
                'error': 'New password is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation du mot de passe
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rechercher le code
        try:
            reset_code = PasswordResetCode.objects.get(
                user=user,
                code=code,
                purpose='password_change',
                is_used=False
            )
        except PasswordResetCode.DoesNotExist:
            return Response({
                'error': 'Invalid or expired verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier l'expiration
        if reset_code.is_expired():
            reset_code.delete()
            return Response({
                'error': 'Verification code has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Changer le mot de passe
        user.set_password(new_password)
        user.save()
        
        # Marquer le code comme utilisé
        reset_code.is_used = True
        reset_code.used_at = timezone.now()
        reset_code.save()
        
        # Supprimer tous les tokens existants pour forcer une nouvelle connexion
        Token.objects.filter(user=user).delete()
        
        # Envoyer un email de confirmation
        try:
            site_name = getattr(settings, 'SITE_NAME', 'Our Application')
            subject = f'Password Changed Successfully - {site_name}'
            message = f'''
            Hello {user.username},
            
            Your password has been successfully changed.
            
            If you did not make this change, please contact our support team immediately.
            
            For security reasons, you have been logged out from all devices.
            
            Best regards,
            {site_name} Team
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,  # Silent pour ne pas bloquer la réponse
            )
            print(f"✅ Password change confirmation sent to {user.email}")
            
        except Exception as email_error:
            print(f"⚠️ Confirmation email failed: {email_error}")
            # Ne pas échouer si l'email de confirmation échoue
        
        return Response({
            'success': True,
            'message': 'Password changed successfully. Please log in again with your new password.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Error in password change verification: {str(e)}")
        return Response({
            'error': 'Failed to change password',
            'details': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Dans votre views.py backend
@api_view(['POST'])
@authentication_classes([TokenAuthentication])  # AJOUTEZ CETTE LIGNE
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Changer le mot de passe après vérification du code
    """
    try:
        user = request.user
        
        # TEMPORAIRE: Commenter la vérification de session pour testing
        # password_change_verified = request.session.get('password_change_verified', False)
        # password_change_user_id = request.session.get('password_change_user_id')
        
        # if not password_change_verified or password_change_user_id != user.id:
        #     print(f"❌ Verification failed for user {user.id}")
        #     print(f"  password_change_verified: {password_change_verified}")
        #     print(f"  password_change_user_id: {password_change_user_id}")
        #     return Response({
        #         'error': 'Please verify your email with a verification code first'
        #     }, status=status.HTTP_403_FORBIDDEN)
        
        print(f"✅ TEMPORARY: Bypassing email verification for user {user.username}")
        
        # Vérifier l'expiration de la vérification (1 heure)
        # verified_at_str = request.session.get('password_change_verified_at')
        # if verified_at_str:
        #     verified_at = timezone.datetime.fromisoformat(verified_at_str)
        #     if timezone.now() - verified_at > timedelta(hours=1):
        #         # Nettoyer la session
        #         request.session.pop('password_change_verified', None)
        #         request.session.pop('password_change_verified_at', None)
        #         request.session.pop('password_change_user_id', None)
        #         request.session.pop('password_change_code_id', None)
                
        #         return Response({
        #             'error': 'Verification has expired. Please request a new code.'
        #         }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer les données
        old_password = request.data.get('old_password', '').strip()
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()
        
        print(f"📦 Received data for user {user.username}:")
        print(f"  old_password length: {len(old_password)}")
        print(f"  new_password length: {len(new_password)}")
        print(f"  confirm_password length: {len(confirm_password)}")
        
        # Validation
        if not old_password or not new_password or not confirm_password:
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'New passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier l'ancien mot de passe
        if not user.check_password(old_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier que le nouveau mot de passe est différent
        if user.check_password(new_password):
            return Response({
                'error': 'New password must be different from current password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Changer le mot de passe
        user.set_password(new_password)
        user.save()
        
        # Mettre à jour la session (même si temporairement désactivé)
        from django.contrib.auth import update_session_auth_hash
        update_session_auth_hash(request, user)
        
        # Nettoyer les codes
        PasswordResetCode.objects.filter(user=user, purpose='password_change').delete()
        
        # Nettoyer la session (même si temporairement désactivé)
        # request.session.pop('password_change_verified', None)
        # request.session.pop('password_change_verified_at', None)
        # request.session.pop('password_change_user_id', None)
        # request.session.pop('password_change_code_id', None)
        
        # Envoyer un email de confirmation
        try:
            send_mail(
                'Password Changed Successfully',
                f'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
              settings.EMAIL_HOST_USER,

                [user.email],
                fail_silently=True,
            )
        except Exception as email_error:
            print(f"⚠️ Confirmation email failed: {email_error}")
        
        print(f"✅ Password changed successfully for user: {user.username}")
        
        return Response({
            'success': True,
            'message': 'Your password has been changed successfully.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Error changing password: {str(e)}")
        print(f"💥 Traceback: {traceback.format_exc()}")
        return Response({
            'error': 'Failed to change password',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_password_change(request):
    """
    Annuler le processus de changement de mot de passe
    """
    try:
        # Nettoyer la session
        request.session.pop('password_change_verified', None)
        request.session.pop('password_change_verified_at', None)
        request.session.pop('password_change_user_id', None)
        request.session.pop('password_change_code_id', None)
        request.session.pop('password_change_attempts', None)
        
        # Nettoyer les codes non utilisés
        PasswordResetCode.objects.filter(
            user=request.user, 
            purpose='password_change',
            is_used=False
        ).delete()
        
        return Response({
            'success': True,
            'message': 'Password change process cancelled.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Failed to cancel password change'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


# views.py - Vues pour la réinitialisation de mot de passe
@api_view(['POST'])
def request_password_reset_code(request):
    """
    Demander un code pour réinitialiser le mot de passe
    """
    try:
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe
            return Response({
                'success': True,
                'message': 'If an account exists with this email, a verification code has been sent.'
            }, status=status.HTTP_200_OK)
        
        # Générer un code à 6 chiffres
        code = get_random_string(6, '0123456789')
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Supprimer les anciens codes
        PasswordResetCode.objects.filter(user=user, purpose='password_reset').delete()
        
        # Sauvegarder le nouveau code
        reset_code = PasswordResetCode.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
            purpose='password_reset'
        )
        
        # Envoyer l'email
        subject = 'Password Reset Verification Code'
        message = f'''
        Hello {user.username},
        
        You have requested to reset your password.
        
        Your verification code is: {code}
        
        This code will expire in 15 minutes.
        
        If you did not request this, please ignore this email.
        
        Best regards,
        {settings.SITE_NAME} Team
        '''
        
        try:
            send_mail(
                subject,
                message,
            settings.EMAIL_HOST_USER,

                [user.email],
                fail_silently=False,
            )
            print(f"📧 Password reset code sent to {user.email}: {code}")
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {email_error}")
        
        return Response({
            'success': True,
            'message': 'If an account exists with this email, a verification code has been sent.',
            'debug_code': code if settings.DEBUG else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Error sending password reset code: {str(e)}")
        return Response({
            'error': 'Failed to send verification code'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_password_reset_code(request):
    """
    Vérifier le code pour réinitialiser le mot de passe
    """
    try:
        email = request.data.get('email', '').strip()
        code = request.data.get('code', '').strip()
        
        if not email or not code:
            return Response({
                'error': 'Email and code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid email or code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si le code existe et est valide
        try:
            reset_code = PasswordResetCode.objects.get(
                user=user,
                code=code,
                is_used=False,
                purpose='password_reset',
                expires_at__gt=timezone.now()
            )
        except PasswordResetCode.DoesNotExist:
            return Response({
                'error': 'Invalid or expired verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Marquer le code comme utilisé
        reset_code.is_used = True
        reset_code.save()
        
        # Créer un token de session
        request.session['password_reset_verified'] = True
        request.session['password_reset_user_id'] = user.id
        request.session['password_reset_code_id'] = reset_code.id
        
        return Response({
            'success': True,
            'message': 'Code verified successfully. You can now reset your password.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Error verifying password reset code: {str(e)}")
        return Response({
            'error': 'Failed to verify code'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def reset_password(request):
    """
    Réinitialiser le mot de passe après vérification du code
    """
    try:
        email = request.data.get('email', '').strip()
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()
        
        # Validation
        if not email or not code or not new_password or not confirm_password:
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si le code est valide
        try:
            reset_code = PasswordResetCode.objects.get(
                user=user,
                code=code,
                is_used=True,
                purpose='password_reset',
                expires_at__gt=timezone.now() - timedelta(hours=1)  # Valide pendant 1h après vérification
            )
        except PasswordResetCode.DoesNotExist:
            return Response({
                'error': 'Invalid or expired verification. Please start over.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Changer le mot de passe
        user.set_password(new_password)
        user.save()
        
        # Supprimer le code utilisé
        reset_code.delete()
        
        # Nettoyer les autres codes
        PasswordResetCode.objects.filter(user=user, purpose='password_reset').delete()
        
        # Envoyer un email de confirmation
        try:
            send_mail(
                'Password Reset Successful',
                f'Your password has been successfully reset. If you did not make this change, please contact support immediately.',
               settings.EMAIL_HOST_USER,

                [user.email],
                fail_silently=True,
            )
        except Exception as email_error:
            print(f"⚠️ Confirmation email failed: {email_error}")
        
        print(f"✅ Password reset for user: {user.username}")
        
        return Response({
            'success': True,
            'message': 'Your password has been reset successfully.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Error resetting password: {str(e)}")
        return Response({
            'error': 'Failed to reset password',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)