# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackUpdateSerializer

User = get_user_model()

# Vue pour créer un feedback
# views.py - AVEC SERIALIZER SIMPLIFIÉ
# views.py
# views.py - CORRECTION de create_feedback
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_feedback(request):
    print("🎯 CREATE_FEEDBACK function called")
    print("📦 Request data:", request.data)
    print("👤 User:", request.user.username)
    print("🔐 User ID:", request.user.id)
    
    try:
        # Vérifier les données requises
        required_fields = ['profile', 'rating']
        for field in required_fields:
            if field not in request.data:
                return Response(
                    {"error": f"{field} is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Vérifier le rating
        rating = request.data.get('rating')
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return Response(
                    {"error": "Rating must be between 1 and 5"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Rating must be a number"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que le professional existe
        profile_id = request.data.get('profile')
        try:
            profile_id = int(profile_id)
            professional = User.objects.get(id=profile_id)
            print(f"✅ Professional found: {professional.username} (ID: {professional.id})")
        except (ValueError, TypeError):
            return Response(
                {"error": "Profile ID must be a valid number"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Professional not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier si un feedback existe déjà
        existing_feedback = Feedback.objects.filter(
            user=request.user, 
            professional=professional
        ).first()
        
        if existing_feedback:
            return Response(
                {"error": "You have already submitted feedback for this professional"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Utiliser le serializer directement
        serializer = FeedbackSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            print("✅ Data is valid")
            # Sauvegarder le feedback
            feedback = serializer.save()
            print("💾 Feedback saved with ID:", feedback.id)
            
            # Retourner la réponse avec TOUTES les données incluant is_owner
            response_serializer = FeedbackSerializer(feedback, context={'request': request})
            response_data = response_serializer.data
            print("📤 Response data:", response_data)
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            print("❌ Validation errors:", serializer.errors)
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        print("💥 Exception in create_feedback:", str(e))
        import traceback
        print("🔍 Stack trace:", traceback.format_exc())
        return Response(
            {"error": f"Server error: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# Vue pour lister les feedbacks d'un professional
# views.py - CORRIGER la vue list_feedbacks

# Vue pour lister les feedbacks - AMÉLIORER
# views.py - CORRECTION COMPLÈTE de list_feedbacks
# views.py - Vérifiez que list_feedbacks fonctionne
# views.py - AMÉLIORATION de list_feedbacks
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_feedbacks(request, profile_id=None):
    print("🎯 [BACKEND DEBUG] LIST_FEEDBACKS called")
    print(f"🔍 [BACKEND DEBUG] Profile ID requested: {profile_id}")
    print(f"👤 [BACKEND DEBUG] User making request: {request.user}")
    
    try:
        if profile_id:
            try:
                professional = User.objects.get(id=profile_id)
                print(f"✅ [BACKEND DEBUG] Professional found: {professional.username} (ID: {professional.id})")
                
                feedbacks = Feedback.objects.filter(professional=professional).select_related('user')
                print(f"📊 [BACKEND DEBUG] Found {feedbacks.count()} feedbacks")
                
                # DEBUG DÉTAILLÉ des feedbacks
                for fb in feedbacks:
                    print(f"   - Feedback ID: {fb.id}, User: {fb.user.username} (ID: {fb.user.id}), Professional: {fb.professional.username} (ID: {fb.professional.id}), Rating: {fb.rating}")
                
                serializer = FeedbackSerializer(feedbacks, many=True, context={'request': request})
                
                # DEBUG du serializer
                serialized_data = serializer.data
                print(f"📤 [BACKEND DEBUG] Serialized data contains {len(serialized_data)} items")
                for item in serialized_data:
                    print(f"   - Serialized: ID: {item['id']}, User: {item['user_name']}, is_owner: {item['is_owner']}")
                
                return Response(serialized_data)
                
            except User.DoesNotExist:
                print(f"❌ [BACKEND DEBUG] Professional with ID {profile_id} not found")
                return Response(
                    {"error": "Professional not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            feedbacks = Feedback.objects.all().select_related('user')
            serializer = FeedbackSerializer(feedbacks, many=True, context={'request': request})
            return Response(serializer.data)
        
    except Exception as e:
        print("💥 [BACKEND DEBUG] Exception in list_feedbacks:", str(e))
        import traceback
        print("🔍 [BACKEND DEBUG] Stack trace:", traceback.format_exc())
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# Vue pour récupérer un feedback spécifique - AMÉLIORER
# views.py - CORRECTION de get_feedback
@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # ← Changer en AllowAny pour la consultation
def get_feedback(request, feedback_id):
    print("🔍 GET_FEEDBACK function called")
    
    try:
        feedback = Feedback.objects.get(id=feedback_id)
        
        serializer = FeedbackSerializer(feedback, context={'request': request})
        return Response(serializer.data)  # ← Le serializer gère déjà is_owner
        
    except Feedback.DoesNotExist:
        return Response(
            {"error": "Feedback not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print("💥 Exception in get_feedback:", str(e))
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# Vue pour mettre à jour un feedback - AMÉLIORER
@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_feedback(request, feedback_id):
    print("✏️ UPDATE_FEEDBACK function called")
    
    try:
        feedback = Feedback.objects.get(id=feedback_id)
        
        # Vérifier que l'utilisateur est le propriétaire du feedback
        if feedback.user != request.user:
            return Response(
                {"error": "Not authorized to update this feedback"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Utiliser le nouveau serializer pour la mise à jour
        serializer = FeedbackUpdateSerializer(
            feedback, 
            data=request.data, 
            partial=(request.method == 'PATCH')
        )
        
        if serializer.is_valid():
            updated_feedback = serializer.save()
            
            # Retourner les données complètes avec le serializer de lecture
            response_serializer = FeedbackSerializer(updated_feedback, context={'request': request})
            response_data = response_serializer.data
            response_data['is_owner'] = True
            
            return Response(response_data)
        else:
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Feedback.DoesNotExist:
        return Response(
            {"error": "Feedback not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print("💥 Exception in update_feedback:", str(e))
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vue pour supprimer un feedback - AMÉLIORER
@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_feedback(request, feedback_id):
    print("🗑️ DELETE_FEEDBACK function called")
    
    try:
        feedback = Feedback.objects.get(id=feedback_id)
        
        # Vérifier que l'utilisateur est le propriétaire du feedback
        if feedback.user != request.user:
            return Response(
                {"error": "Not authorized to delete this feedback"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedback.delete()
        return Response(
            {"message": "Feedback deleted successfully"}, 
            status=status.HTTP_200_OK  # Changer en 200 pour plus de compatibilité
        )
            
    except Feedback.DoesNotExist:
        return Response(
            {"error": "Feedback not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print("💥 Exception in delete_feedback:", str(e))
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# Vue de test
@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def test_feedback(request):
    print(f"🧪 TEST endpoint called with method: {request.method}")
    print(f"👤 User: {request.user.username}")
    print(f"🔐 Authenticated: {request.user.is_authenticated}")
    print(f"📦 Data: {request.data}")
    
    if request.method == 'GET':
        return Response({
            "message": "GET works!",
            "user": request.user.username,
            "endpoint": "/api/test-feedback/",
            "status": "success"
        })
    
    elif request.method == 'POST':
        return Response({
            "message": "POST works!",
            "user": request.user.username,
            "received_data": request.data,
            "status": "success"
        }, status=status.HTTP_201_CREATED)

# Vue de debug URLs
from django.http import JsonResponse
from django.urls import get_resolver

def debug_urls(request):
    url_list = []
    resolver = get_resolver()
    
    def extract_urls(patterns, prefix=''):
        for pattern in patterns:
            if hasattr(pattern, 'url_patterns'):
                # Include pattern
                extract_urls(pattern.url_patterns, prefix + str(pattern.pattern))
            else:
                # Regular pattern
                url_list.append({
                    'pattern': prefix + str(pattern.pattern),
                    'name': getattr(pattern, 'name', 'No name'),
                    'callback': str(getattr(pattern, 'callback', 'No callback'))
                })
    
    extract_urls(resolver.url_patterns)
    return JsonResponse({'urls': url_list})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_helpful(request, feedback_id):
    """"  Put a feedback as useful  """
    try :
        feedback = Feedback.objects.get(id=feedback_id)
        #check that the user can't put is own feedback useful 
        if feedback.user == request.user :
            return Response (
                { "error": "You cannot mark your own feedback as helpful "},
                status = status.HTTP_400_BAD_REQUEST
            )
        
        #Mark as useful 
        if feedback.mark_as_helpful(request.user):
            serializer = FeedbackSerializer(feedback, context= {'request':request})

            return Response (
                {
                    "message" : "  feedback marked as helpful",
                    "feedback" : serializer.data
                }
            )
        else :
            return Response (
                {"error": "Already marked as helpful"},
                status = status.HTTP_400_BAD_REQUEST
            )
    except Feedback.DoesNotExist :
        return Response (
            {"error": " Feedback Not found"},
            status = status.HTTP_404_NOT_FOUND
        )
    except Exception as e :
        return Response (
            {"error":str(e)},
            status = status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unmark_as_helpful(request, feedback_id):
    """Remove the mark useful in the feedback """
    try :
        feedback = Feedback.objects.get(id=feedback_id)

        #Remove the markness 
        if feedback.unmark_as_helpful(request.user):
            serializer = FeedbackSerializer(feedback, context ={'request' : request})
            return Response ({
                "meddage":"Feedback unmarked as helpful",
                "feedback" : serializer.data 
            })
        else :
            return Response ({
                "error" : "Not marked as helpful"
            }, 
                status = status.HTTP_400_BAD_REQUEST
            )
        
    except Feedback.DoesNotExist :
        return Response (
            {"error" : "Feedback not fund "},
            status = status.HTTP_404_NOT_FOUND
            )
    except Exception as e :
        return Response (
            {'error' : str(e)},
            status = status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
# views.py - Modifiez toggle_helpful
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_helpful(request, feedback_id):
    """Basculer l'état "utile" d'un feedback"""
    print(f"🔍 [HELPFUL DEBUG] ======== NOUVELLE REQUÊTE ========")
    print(f"🔍 [HELPFUL DEBUG] User: {request.user.username} (ID: {request.user.id})")
    print(f"🔍 [HELPFUL DEBUG] Feedback ID: {feedback_id}")
    print(f"🔍 [HELPFUL DEBUG] Auth headers: {request.headers.get('Authorization')}")
    
    if not request.user.is_authenticated:
        print("❌ [HELPFUL DEBUG] User not authenticated")
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        feedback = Feedback.objects.get(id=feedback_id)
        
        print(f"🔍 [HELPFUL DEBUG] Feedback owner: {feedback.user.username} (ID: {feedback.user.id})")
        print(f"🔍 [HELPFUL DEBUG] Current helpful users: {list(feedback.helpful_users.values_list('username', flat=True))}")
        print(f"🔍 [HELPFUL DEBUG] Current helpful count: {feedback.helpful_count}")
        
        # Vérifier que l'utilisateur ne peut pas marquer son propre feedback
        if feedback.user == request.user:
            print(f"⚠️ [HELPFUL DEBUG] User trying to mark own feedback")
            return Response(
                {"error": "You cannot mark your own feedback as helpful"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier l'état actuel
        is_currently_helpful = feedback.is_helpful_by_user(request.user)
        print(f"🔍 [HELPFUL DEBUG] Is currently marked as helpful: {is_currently_helpful}")
        
        # Basculer l'état
        if is_currently_helpful:
            print(f"➖ [HELPFUL DEBUG] Unmarking as helpful")
            success = feedback.unmark_as_helpful(request.user)
            action = "unmarked"
        else:
            print(f"➕ [HELPFUL DEBUG] Marking as helpful")
            success = feedback.mark_as_helpful(request.user)
            action = "marked"
        
        print(f"🔍 [HELPFUL DEBUG] Operation success: {success}")
        print(f"🔍 [HELPFUL DEBUG] New helpful users: {list(feedback.helpful_users.values_list('username', flat=True))}")
        print(f"🔍 [HELPFUL DEBUG] New helpful count: {feedback.helpful_count}")
        
        # Recharger le feedback depuis la base de données
        feedback.refresh_from_db()
        
        serializer = FeedbackSerializer(feedback, context={'request': request})
        print(f"✅ [HELPFUL DEBUG] Successfully {action} feedback as helpful")
        
        return Response({
            "message": f"Feedback {action} as helpful",
            "feedback": serializer.data
        })
            
    except Feedback.DoesNotExist:
        print(f"❌ [HELPFUL DEBUG] Feedback not found")
        return Response(
            {"error": "Feedback not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"💥 [HELPFUL DEBUG] Error: {str(e)}")
        import traceback
        print(f"🔍 [HELPFUL DEBUG] Traceback: {traceback.format_exc()}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )