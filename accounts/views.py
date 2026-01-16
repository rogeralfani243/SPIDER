from rest_framework import status
from rest_framework.decorators import api_view, permission_classes 
from rest_framework.response import Response 
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout ,authenticate
from .serializers import UserSerializer, LoginSerializer
from .models import User,UnverifiedUser, EmailVerificationCode
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from app.models import Profile
User = get_user_model()
# views.py
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import json
import smtplib
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Étape 1: Créer un compte non vérifié et envoyer un code par email
    """
    try:
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()  # Mot de passe en clair
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        
        # Validation
        if not username or not email or not password:
            return Response({
                'error': 'Username, email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'utilisateur existe déjà (vérifié ou non)
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si un utilisateur non vérifié existe déjà
        if UnverifiedUser.objects.filter(username=username).exists():
            # Supprimer l'ancien enregistrement
            UnverifiedUser.objects.filter(username=username).delete()
        
        if UnverifiedUser.objects.filter(email=email).exists():
            UnverifiedUser.objects.filter(email=email).delete()
        
        # Générer un code de vérification
        verification_code = get_random_string(6, '0123456789')
        expires_at = timezone.now() + timedelta(hours=24)  # 24 heures pour vérifier
        
        # CRITIQUE: Stocker le mot de passe en clair dans UnverifiedUser
        unverified_user = UnverifiedUser.objects.create(
            username=username,
            email=email,
            password=password,  # Stocker le mot de passe en clair temporairement
            first_name=first_name,
            last_name=last_name,
            verification_code=verification_code,
            expires_at=expires_at
        )
        
        # Récupérer le nom du site
        try:
            site_name = settings.SITE_NAME
        except AttributeError:
            site_name = 'Our Application'
        
        # Envoyer l'email de vérification
        subject = 'Verify Your Email Address'
        message = f'''
        Welcome {username}!

        Thank you for registering on {site_name}.

        Your verification code is: {verification_code}

        Please enter this code on the verification page to activate your account.

        This code will expire in 24 hours.

        If you did not create this account, please ignore this email.

        Best regards,
        {site_name} Team
        '''
        
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]
        
        if not email or '@' not in email:
            print(f"❌ Email invalide: {email}")
            raise ValueError("Invalid email address")
        
        # Envoyer l'email avec gestion d'erreurs appropriée
        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
            print(f"✅ Email envoyé à {email}")
            
        
        
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {email_error}")
            if settings.DEBUG:
                print(f"📧 Code de vérification (DEBUG): {verification_code}")
                # Continuer en mode DEBUG
                return Response({
                    'success': True,
                    'message': 'A verification code has been sent to your email.',
                    'email': email,
                    'expires_in': 24,
                    'debug_code': verification_code
                }, status=status.HTTP_201_CREATED)
            else:
                raise
        
        return Response({
            'success': True,
            'message': 'A verification code has been sent to your email.',
            'email': email,
            'expires_in': 24,  # heures
            'debug_code': verification_code if settings.DEBUG else None
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"💥 Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Registration failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_view(request):
    """
    Étape 2: Vérifier l'email avec le code et créer le compte final
    """
    try:
        email = request.data.get('email', '').strip()
        code = request.data.get('code', '').strip()
        
        if not email or not code:
            return Response({
                'error': 'Email and verification code are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rechercher l'utilisateur non vérifié
        try:
            unverified_user = UnverifiedUser.objects.get(
                email=email,
                verification_code=code
            )
        except UnverifiedUser.DoesNotExist:
            # Incrémenter les tentatives échouées
            try:
                user = UnverifiedUser.objects.get(email=email)
                user.attempts += 1
                user.save()
                
                if user.attempts >= 3:
                    user.delete()
                    return Response({
                        'error': 'Too many failed attempts. Please register again.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                remaining = 3 - user.attempts
                return Response({
                    'error': f'Invalid verification code. {remaining} attempts remaining.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            except UnverifiedUser.DoesNotExist:
                return Response({
                    'error': 'No pending registration found for this email.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier l'expiration
        if unverified_user.is_expired():
            unverified_user.delete()
            return Response({
                'error': 'Verification code has expired. Please register again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'utilisateur existe déjà (au cas où)
        if User.objects.filter(username=unverified_user.username).exists():
            unverified_user.delete()
            return Response({
                'error': 'Username already taken. Please register with a different username.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=unverified_user.email).exists():
            unverified_user.delete()
            return Response({
                'error': 'Email already registered.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer l'utilisateur réel avec create_user (qui hash le mot de passe)
        try:
            user = User.objects.create_user(
                username=unverified_user.username,
                email=unverified_user.email,
                password=unverified_user.password,  # Mot de passe en clair, sera hashé
                first_name=unverified_user.first_name,
                last_name=unverified_user.last_name
            )
            print(f"✅ User created with ID: {user.id}, email: {user.email}")
            
            # Créer le EmailVerificationCode MAINTENANT que nous avons un utilisateur
            # Cela enregistre l'historique de vérification
            EmailVerificationCode.objects.create(
                user=user,  # Maintenant nous avons un utilisateur
                code=code,
                expires_at=unverified_user.expires_at,
                is_used=True,
                purpose='email_verification'
            )
            
            # Vérifier si le mot de passe fonctionne
            test_auth = authenticate(
                username=unverified_user.username, 
                password=unverified_user.password
            )
            print(f"🔐 Authentication test: {'SUCCESS' if test_auth else 'FAILED'}")
            
            if not test_auth:
                print(f"⚠️ WARNING: Password authentication failed for {unverified_user.username}")
                print(f"   Stored password in UnverifiedUser: {unverified_user.password[:50] if unverified_user.password else 'None'}")
            
            # Créer le profil
            try:
                # Vérifier si le profil existe déjà
                existing_profile = Profile.objects.filter(user=user).exists()
                if existing_profile:
                    print(f"⚠️ Profile already exists for user: {user.username}")
                else:
                    Profile.objects.create(user=user)
                    print(f"✅ Profile created for user: {user.username}")
            except Exception as profile_error:
                print(f"⚠️ Profile creation error: {profile_error}")
                # Ne pas échouer à cause du profil
            
            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Supprimer l'utilisateur non vérifié
            username_to_delete = unverified_user.username
            unverified_user.delete()
            
            # Supprimer d'autres enregistrements non vérifiés pour le même email
            UnverifiedUser.objects.filter(email=email).delete()
            
            # Envoyer un email de bienvenue
            try:
                site_name = getattr(settings, 'SITE_NAME', 'Our Application')
                
                send_mail(
                    'Welcome to Our Application!',
                    f'Hello {user.username},\n\nYour account has been successfully verified and activated!\n\nWelcome aboard!\n\nBest regards,\n{site_name} Team',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=True,
                )
                from rest_framework.authtoken.models import Token
                token, created = Token.objects.get_or_create(user=user)
            
            # Garder aussi les tokens JWT si nécessaire
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
            except Exception as email_error:
                print(f"⚠️ Welcome email failed: {email_error}")
            
            print(f"✅ User verified and created: {user.username}")
            
            return Response({
                'success': True,
                'message': 'Account verified and created successfully!',
                'user': UserSerializer(user).data,
                'access': access_token,
                'refresh': refresh_token,
                 'token': token.key, 
            }, status=status.HTTP_201_CREATED)
            
        except Exception as create_error:
            print(f"💥 User creation error: {str(create_error)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Failed to create user account',
                'details': str(create_error)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        print(f"💥 Verification error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Verification failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_code(request):
    """
    Renvoyer le code de vérification
    """
    try:
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response({
                'error': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rechercher l'utilisateur non vérifié
        try:
            unverified_user = UnverifiedUser.objects.get(email=email)
        except UnverifiedUser.DoesNotExist:
            return Response({
                'error': 'No pending registration found for this email.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier l'expiration
        if unverified_user.is_expired():
            unverified_user.delete()
            return Response({
                'error': 'Registration has expired. Please register again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Générer un nouveau code
        new_code = get_random_string(6, '0123456789')
        unverified_user.verification_code = new_code
        unverified_user.expires_at = timezone.now() + timedelta(hours=24)
        unverified_user.attempts = 0  # Réinitialiser les tentatives
        unverified_user.save()
        
        # Récupérer le nom du site
        try:
            site_name = settings.SITE_NAME
        except AttributeError:
            site_name = 'Our Application'
        
        # Envoyer le nouvel email
        subject = 'New Verification Code'
        message = f'''
        Hello {unverified_user.username},

        As requested, here is your new verification code: {new_code}

        Please enter this code on the verification page to activate your account.

        This code will expire in 24 hours.

        If you did not request this, please ignore this email.

        Best regards,
        {site_name} Team
        '''
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            print(f"📧 New verification code sent to {email}: {new_code}")
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {email_error}")
        
        return Response({
            'success': True,
            'message': 'A new verification code has been sent to your email.',
            'expires_in': 24,
            'debug_code': new_code if settings.DEBUG else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"💥 Resend verification error: {str(e)}")
        return Response({
            'error': 'Failed to resend verification code'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_registration(request):
    """
    Annuler l'inscription en cours
    """
    try:
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response({
                'error': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Supprimer l'utilisateur non vérifié
        deleted_count, _ = UnverifiedUser.objects.filter(email=email).delete()
        
        if deleted_count > 0:
            return Response({
                'success': True,
                'message': 'Registration cancelled successfully.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'No pending registration found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"💥 Cancel registration error: {str(e)}")
        return Response({
            'error': 'Failed to cancel registration'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
print(User.USERNAME_FIELD)

#for user login
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"🔐 Login attempt for: {username}")
    
    if not username or not password:
        return Response(
            {'error': 'Le nom d\'utilisateur et le mot de passe sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authentifier l'utilisateur
    user = authenticate(username=username, password=password)
    
    if user is not None:
        if user.is_active:
            # Obtenir ou créer le token
            token, created = Token.objects.get_or_create(user=user)
            
            print(f"✅ Login successful for: {user.username}")
            
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            })
        else:
            return Response(
                {'error': 'Compte utilisateur désactivé'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    else:
        print(f"❌ Login failed for: {username}")
        return Response(
            {'error': 'Nom d\'utilisateur ou mot de passe incorrect'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
#for user logout
@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """ Handle user Logout 
    """
    # If DRF authtoken is present, try to delete it. Otherwise just logout session.
    try:
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
    except Exception:
        # ignore if token backend not configured
        pass
    #logout session
    logout(request)
    return Response({ 'message': 'Logout successful' }, status=status.HTTP_200_OK)

#for checking the user auth
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    """ Check if the user is authenticated 
    """
    user = request.user
    return Response({
        "authenticated": True,
        "user": UserSerializer(user).data
    })


