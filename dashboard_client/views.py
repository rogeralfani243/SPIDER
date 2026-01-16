# dashboard_client/views.py
from django.db.models import Q, Count, Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from app.models import Profile 
from comment_post.models import Comment
from post.models import Post
from feedback.models import Feedback
from report.models import Report, ReportStatus,ContentType,ReportType,ReportAction
from messaging.models import Message

from app.serializers import ProfileSerializer
from post.serializers import PostSerializer
from comment_post.serializers import CommentSerializer
from .serializers import FeedbackSerializer
from report.serializers import ReportSerializer
from .serializers import DashboardReportSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from .serializers import DashboardReportSerializer
from feedback_post.serializers import RatingSerializer
from feedback_post.models import Rating
# views_profile.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q,Prefetch
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from post.models import Post
from comment_post.models import Comment
from app.models import Profile
import json
import math
from django.conf import settings
User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_data(request):
    """Données du profil utilisateur avec sérialiseur"""
    try:
        user = request.user
        
        # Récupérer le profil complet
        try:
            user_profile = Profile.objects.get(user=user)
            # Utiliser le sérialiseur ProfileSerializer
            serializer = ProfileSerializer(user_profile, context={'request': request})
            profile_data = serializer.data
        except Profile.DoesNotExist:
            profile_data = {}
        
        # Informations de base de l'utilisateur
        data = {
            'welcome_message': f'Welcome to your profile, {user.username}!',
            'last_updated': timezone.now().isoformat(),
            'user_info': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
            },
            'profile': profile_data,
        }
        
        return Response(data)
        
    except Exception as e:
        print(f"Profile data error: {str(e)}")
        return Response({
            'error': 'Unable to load profile data',
            'user_info': {
                'username': request.user.username,
            }
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_stats(request):
    """Statistiques du profil utilisateur"""
    try:
        user = request.user
        now = timezone.now()
        one_week_ago = now - timedelta(days=7)
        one_month_ago = now - timedelta(days=30)
        
        # Compter les posts de l'utilisateur
        user_posts = Post.objects.filter(user=user)
        posts_count = user_posts.count()
        posts_this_week = user_posts.filter(created_at__gte=one_week_ago).count()
        posts_this_month = user_posts.filter(created_at__gte=one_month_ago).count()
        
        # Compter les commentaires de l'utilisateur
        user_comments = Comment.objects.filter(user=user)
        comments_count = user_comments.count()
        comments_this_week = user_comments.filter(created_at__gte=one_week_ago).count()
        comments_this_month = user_comments.filter(created_at__gte=one_month_ago).count()
        
        # Statistiques d'engagement (exemple - à adapter selon vos modèles)
        average_rating = user_posts.aggregate(Avg('average_rating'))['average_rating__avg'] or 0
        total_ratings = sum(post.total_ratings or 0 for post in user_posts)
        
        # Nombre de commentaires reçus sur les posts
        comments_received = Comment.objects.filter(post__user=user).count()
        engagement_rate = 0

        # Complétion du profil
        profile_completion = 50  # Valeur par défaut
        try:
            user_profile = Profile.objects.get(user=user)
            filled_fields = 0
            total_fields = 5  # bio, location, website, birth_date, profile_picture
            
            if user_profile.bio:
                filled_fields += 1
            if user_profile.location:
                filled_fields += 1
            if user_profile.website:
                filled_fields += 1
            if user_profile.birth_date:
                filled_fields += 1
            if user_profile.image:
                filled_fields += 1
            
            profile_completion = (filled_fields / total_fields) * 100
        except Profile.DoesNotExist:
            profile_completion = 20
        
        stats = {
            'user': {
                'username': user.username,
                'account_age_days': (now - user.date_joined).days if user.date_joined else 0,
            },
            'posts': {
                'total': posts_count,
                'this_week': posts_this_week,
                'this_month': posts_this_month,
                'today': user_posts.filter(created_at__date=now.date()).count(),
                'average_rating': round(average_rating, 2),
                'total_ratings': total_ratings,
            },
            'comments': {
                'total': comments_count,
                'this_week': comments_this_week,
                'this_month': comments_this_month,
                'today': user_comments.filter(created_at__date=now.date()).count(),
            },
            'engagement': {
                'likes_received': total_ratings,
                'engagement_rate': round(engagement_rate, 1),
                'profile_views': 0,  # À implémenter si vous suivez les vues de profil
                'shares_count': 0,   # À implémenter si vous suivez les partages
            },
            'profile': {
                'completion': round(profile_completion, 1),
                'badges_count': 0,   # À implémenter si vous avez un système de badges
            },
            'timestamps': {
                'generated_at': now.isoformat(),
                'last_post': user_posts.order_by('-created_at').first().created_at.isoformat() if user_posts.exists() else None,
                'last_comment': user_comments.order_by('-created_at').first().created_at.isoformat() if user_comments.exists() else None,
            }
        }
        
        return Response(stats)
        
    except Exception as e:
        print(f"Profile stats error: {str(e)}")
        return Response({
            'user': {
                'username': request.user.username,
                'account_age_days': 0,
            },
            'posts': {
                'total': 0,
                'this_week': 0,
                'this_month': 0,
                'today': 0,
            },
            'comments': {
                'total': 0,
                'this_week': 0,
                'this_month': 0,
                'today': 0,
            },
            'engagement': {
                'likes_received': 0,
                'engagement_rate': 0,
                'profile_views': 0,
                'shares_count': 0,
            },
            'profile': {
                'completion': 0,
                'badges_count': 0,
            },
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_posts(request):
    """Posts de l'utilisateur avec sérialiseur"""
    try:
        user = request.user
        limit = request.GET.get('limit', 10)
        
        # Récupérer les posts de l'utilisateur
        user_posts = Post.objects.filter(user=user).order_by('-created_at')
        
        # Utiliser le sérialiseur PostSerializer
        serializer = PostSerializer(user_posts, many=True, context={'request': request})
        
        return Response({
            'posts': serializer.data,
            'count': len(serializer.data),
            'total': Post.objects.filter(user=user).count()
        })
        
    except Exception as e:
        print(f"Profile posts error: {str(e)}")
        return Response({
            'posts': [],
            'count': 0,
            'total': 0,
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_comments(request):
    """Commentaires de l'utilisateur avec sérialiseur"""
    try:
        user = request.user
        limit = request.GET.get('limit', 10)
        
        # Récupérer les commentaires de l'utilisateur
        user_comments = Comment.objects.filter(user=user).select_related('post').order_by('-created_at')
        
        # Utiliser le sérialiseur CommentSerializer
        serializer = CommentSerializer(user_comments, many=True, context={'request': request})
        
        return Response({
            'comments': serializer.data,
            'count': len(serializer.data),
            'total': Comment.objects.filter(user=user).count()
        })
        
    except Exception as e:
        print(f"Profile comments error: {str(e)}")
        return Response({
            'comments': [],
            'count': 0,
            'total': 0,
        }, status=200)




# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Prefetch
from django.utils.timezone import now, timedelta
import math
import traceback

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_report(request):
    """Return user reports with pagination and statistics"""
    try:
        user = request.user
        
        # Query parameters with default values
        try:
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
        except ValueError:
            page = 1
            per_page = 10
        
        # Ensure page and per_page are valid
        page = max(1, page)
        per_page = min(max(1, per_page), 100)  # Limit to 100 max
        
        # Filters
        status_filter = request.GET.get('status', '')
        report_type_filter = request.GET.get('report_type', '')
        content_type_filter = request.GET.get('content_type', '')
        
        # Build base queryset with proper related fields selection
        reports_qs = Report.objects.filter(reporter=user).order_by('-created_at')
        
        # Apply filters
        if status_filter:
            reports_qs = reports_qs.filter(status=status_filter)
        
        if report_type_filter:
            reports_qs = reports_qs.filter(report_type=report_type_filter)
        
        if content_type_filter:
            reports_qs = reports_qs.filter(content_type=content_type_filter)
        
        # Manually handle related objects to avoid serializer issues
        # First, get all reports with their actions
        total_count = reports_qs.count()
        
        # Calculate pagination
        total_pages = math.ceil(total_count / per_page) if per_page > 0 else 1
        offset = (page - 1) * per_page
        
        # Get paginated reports with related data
        paginated_reports = list(reports_qs[offset:offset + per_page])
        
        # Prepare reports data with custom serialization
        serialized_reports = []
        
        for report in paginated_reports:
            try:
                # Use the serializer but catch any errors
                serializer = ReportSerializer(report, context={'request': request})
                serialized_reports.append(serializer.data)
            except Exception as e:
                # If serializer fails, create a minimal version manually
                print(f"Serializer error for report {report.id}: {str(e)}")
                
                report_data = {
                    'id': report.id,
                    'content_type': report.content_type,
                    'content_type_display': report.get_content_type_display(),
                    'content_id': report.content_id,
                    'report_type': report.report_type,
                    'report_type_display': report.get_report_type_display(),
                    'reason': report.reason,
                    'status': report.status,
                    'status_display': report.get_status_display(),
                    'reviewed_at': report.reviewed_at,
                    'moderator_notes': report.moderator_notes,
                    'action_taken': report.action_taken,
                    'created_at': report.created_at,
                    'updated_at': report.updated_at,
                }
                
                # Add reporter info
                if report.reporter:
                    report_data['reporter'] = {
                        'id': report.reporter.id,
                        'username': report.reporter.username,
                    }
                
                # Add reviewer info if exists
                if report.reviewed_by:
                    report_data['reviewer'] = {
                        'id': report.reviewed_by.id,
                        'username': report.reviewed_by.username,
                    }
                
                # Try to get reported content manually
                try:
                    content = report.get_reported_content()
                    if content:
                        report_data['reported_content'] = {
                            'id': content.id,
                            'type': report.content_type,
                            'preview': str(content)[:100] if str(content) else '',
                        }
                        
                        # Try to get author
                        try:
                            author = report.get_content_author()
                            if author:
                                report_data['reported_content']['author'] = {
                                    'id': author.id,
                                    'username': author.username
                                }
                        except:
                            pass
                except:
                    report_data['reported_content'] = None
                
                # Try to get actions
                try:
                    actions = report.actions.all().order_by('-performed_at')
                    report_data['actions'] = [
                        {
                            'id': action.id,
                            'action_type': action.action_type,
                            'description': action.description,
                            'performed_at': action.performed_at,
                            'duration_days': action.duration_days,
                        }
                        for action in actions
                    ]
                except:
                    report_data['actions'] = []
                
                serialized_reports.append(report_data)
        
        # Calculate statistics
        all_reports = Report.objects.filter(reporter=user)
        
        # Basic stats
        stats_summary = {
            'total': all_reports.count(),
            'pending': all_reports.filter(status='pending').count(),
            'under_review': all_reports.filter(status='under_review').count(),
            'resolved': all_reports.filter(status='resolved').count(),
            'dismissed': all_reports.filter(status='dismissed').count(),
        }
        
        # Report type statistics
        report_type_stats = {}
        for report_type, label in ReportType.choices:
            count = all_reports.filter(report_type=report_type).count()
            if count > 0:
                report_type_stats[report_type] = {
                    'count': count,
                    'label': label,
                    'percentage': round((count / stats_summary['total'] * 100), 1) if stats_summary['total'] > 0 else 0
                }
        
        # Content type statistics
        content_type_stats = {}
        for content_type, label in ContentType.choices:
            count = all_reports.filter(content_type=content_type).count()
            if count > 0:
                content_type_stats[content_type] = {
                    'count': count,
                    'label': label,
                    'percentage': round((count / stats_summary['total'] * 100), 1) if stats_summary['total'] > 0 else 0
                }
        
        # Recent activity
        recent_activity = {
            'last_30_days': all_reports.filter(created_at__gte=now() - timedelta(days=30)).count(),
            'last_7_days': all_reports.filter(created_at__gte=now() - timedelta(days=7)).count(),
            'today': all_reports.filter(created_at__date=now().date()).count(),
        }
        
        # Prepare filter options
        status_options = [{'value': value, 'label': label} for value, label in ReportStatus.choices]
        report_type_options = [{'value': value, 'label': label} for value, label in ReportType.choices]
        content_type_options = [{'value': value, 'label': label} for value, label in ContentType.choices]
        
        # Prepare response
        response_data = {
            'success': True,
            'reports': serialized_reports,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1,
                'next_page': page + 1 if page < total_pages else None,
                'previous_page': page - 1 if page > 1 else None,
                'offset': offset,
                'count': len(serialized_reports),
            },
            'filters': {
                'applied': {
                    'status': status_filter,
                    'report_type': report_type_filter,
                    'content_type': content_type_filter,
                },
                'available': {
                    'status': status_options,
                    'report_type': report_type_options,
                    'content_type': content_type_options,
                }
            },
            'stats': {
                'summary': stats_summary,
                'by_report_type': report_type_stats,
                'by_content_type': content_type_stats,
                'recent_activity': recent_activity,
            },
            'metadata': {
                'user_id': user.id,
                'username': user.username,
                'timestamp': now().isoformat(),
            }
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"ERROR in profile_report: {str(e)}")
        traceback.print_exc()
        
        # Return clean error response
        return Response({
            'success': False,
            'error': 'An error occurred while loading reports',
            'reports': [],
            'pagination': {
                'current_page': 1,
                'per_page': 10,
                'total_count': 0,
                'total_pages': 0,
                'has_next': False,
                'has_previous': False,
                'count': 0,
            },
            'filters': {
                'applied': {},
                'available': {
                    'status': [],
                    'report_type': [],
                    'content_type': [],
                }
            },
            'stats': {
                'summary': {
                    'total': 0,
                    'pending': 0,
                    'under_review': 0,
                    'resolved': 0,
                    'dismissed': 0,
                },
                'by_report_type': {},
                'by_content_type': {},
                'recent_activity': {
                    'last_30_days': 0,
                    'last_7_days': 0,
                    'today': 0,
                }
            }
        }, status=status.HTTP_200_OK)  # Toujours 200 pour le frontend
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_activity(request):
    """Complete user activity with corrected feedback handling"""
    try:
        user = request.user
        now = timezone.now()
        one_month_ago = now - timedelta(days=30)
        profile = Profile.objects.get(user=user)
        activities = []
        
        print(f"\n{'='*50}")
        print(f"PROFILE ACTIVITY for {user.username} (User ID: {user.id})")
        print(f"{'='*50}")
        
        # ==================== DEBUG COMPLET ====================
        print(f"\n🔍 [DEBUG COMPLET - VÉRIFICATION DES FEEDBACKS]")
        
        # 1. Tous les feedbacks dans la base
        all_feedbacks = Feedback.objects.all().select_related('user', 'professional')
        print(f"Total feedbacks dans la base: {all_feedbacks.count()}")
        
        if all_feedbacks.count() > 0:
            print("Détail de chaque feedback:")
            for fb in all_feedbacks:
                print(f"  ID {fb.id}: {fb.user.username} (ID:{fb.user.id}) -> {fb.professional.username} (ID:{fb.professional.id})")
        
        # 2. Feedbacks que CET utilisateur a reçus
        received_by_this_user = Feedback.objects.filter(professional=user)
        print(f"\nFeedbacks reçus par {user.username} (professional={user.id}): {received_by_this_user.count()}")
        
        # 3. Feedbacks que CET utilisateur a donnés
        given_by_this_user = Feedback.objects.filter(user=user)
        print(f"Feedbacks donnés par {user.username} (user={user.id}): {given_by_this_user.count()}")
        
        # ==================== 1. YOUR POSTS ====================
        recent_posts = Post.objects.filter(user=user, created_at__gte=one_month_ago)
        print(f"\n✓ Your posts created: {recent_posts.count()}")
        
        for post in recent_posts:
            try:
                post_serializer = PostSerializer(post, context={'request': request})
                activities.append({
                    'id': f"post_{post.id}",
                    'type': 'post',
                    'title': 'New post created',
                    'description': post.title,
                    'timestamp': post.created_at.isoformat() if post.created_at else None,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    },
                    'post_data': post_serializer.data,
                    'metadata': {'post_id': post.id}
                })
            except Exception as e:
                print(f"  ✗ Error post {post.id}: {str(e)}")
        
        # ==================== 2. YOUR COMMENTS ====================
        your_comments = Comment.objects.filter(user=user, created_at__gte=one_month_ago)
        print(f"✓ Your comments posted: {your_comments.count()}")
        
        for comment in your_comments:
            try:
                comment_serializer = CommentSerializer(comment, context={'request': request})
                activities.append({
                    'id': f"comment_{comment.id}",
                    'type': 'comment',
                    'title': 'You commented',
                    'description': comment.content[:100] if comment.content else '',
                    'timestamp': comment.created_at.isoformat() if comment.created_at else None,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                    },
                    'comment_data': comment_serializer.data,
                    'metadata': {
                        'comment_id': comment.id,
                        'post_id': comment.post.id if comment.post else None,
                        'post_title': comment.post.title if comment.post else 'Post',
                    }
                })
            except Exception as e:
                print(f"  ✗ Error comment {comment.id}: {str(e)}")
        
        # ==================== 3. COMMENTS RECEIVED ====================
        received_comments = Comment.objects.filter(
            post__user=user,
            created_at__gte=one_month_ago
        ).exclude(user=user)
        
        print(f"✓ Comments received on your posts: {received_comments.count()}")
        
        for comment in received_comments:
            try:
                comment_serializer = CommentSerializer(comment, context={'request': request})
                comment_user = comment.user
                
                activities.append({
                    'id': f"comment_received_{comment.id}",
                    'type': 'comment_received',
                    'title': 'New comment on your post',
                    'description': comment.content[:100] if comment.content else '',
                    'timestamp': comment.created_at.isoformat() if comment.created_at else None,
                    'user': {
                        'id': comment_user.id,
                        'username': comment_user.username,
                        'first_name': comment_user.first_name,
                        'last_name': comment_user.last_name,
                    },
                    'comment_data': comment_serializer.data,
                    'metadata': {
                        'comment_id': comment.id,
                        'post_id': comment.post.id,
                        'post_title': comment.post.title if comment.post else 'Your post',
                    }
                })
            except Exception as e:
                print(f"  ✗ Error received comment {comment.id}: {str(e)}")
        
        # ==================== 4. RATINGS RECEIVED ====================
        try:
            received_ratings = Rating.objects.filter(
                post__user=user,
                created_at__gte=one_month_ago
            ).select_related('user', 'post')
            
            print(f"✓ Ratings received on your posts: {received_ratings.count()}")
            
            for rating in received_ratings:
                try:
                    rating_serializer = RatingSerializer(rating, context={'request': request})
                    rating_user = rating.user
                    
                    activities.append({
                        'id': f"rating_received_{rating.id}",
                        'type': 'rating_received',
                        'title': 'New rating on your post',
                        'description': f'Rated {rating.stars}/5 stars',
                        'timestamp': rating.created_at.isoformat() if rating.created_at else None,
                        'user': {
                            'id': rating_user.id,
                            'username': rating_user.username,
                            'first_name': rating_user.first_name,
                            'last_name': rating_user.last_name,
                        },
                        'rating_data': rating_serializer.data,
                        'metadata': {
                            'rating_id': rating.id,
                            'post_id': rating.post.id,
                            'post_title': rating.post.title if rating.post else 'Your post',
                            'stars': rating.stars,
                        }
                    })
                except Exception as e:
                    print(f"  ✗ Error rating received {rating.id}: {str(e)}")
        except Exception as e:
            print(f"✗ Error fetching ratings: {str(e)}")
        
        # ==================== 5. RATINGS GIVEN ====================
        try:
            given_ratings = Rating.objects.filter(
                user=user,
                created_at__gte=one_month_ago
            ).select_related('post', 'post__user')
            
            print(f"✓ Ratings you gave: {given_ratings.count()}")
            
            for rating in given_ratings:
                try:
                    rating_serializer = RatingSerializer(rating, context={'request': request})
                    post_owner = rating.post.user if rating.post else None
                    
                    activities.append({
                        'id': f"rating_given_{rating.id}",
                        'type': 'rating_given',
                        'title': 'You rated a post',
                        'description': f'You rated {rating.stars}/5 stars',
                        'timestamp': rating.created_at.isoformat() if rating.created_at else None,
                        'user': {
                            'id': user.id,
                            'username': user.username,
                        },
                        'target_user': {
                            'id': post_owner.id if post_owner else None,
                            'username': post_owner.username if post_owner else 'User',
                        },
                        'rating_data': rating_serializer.data,
                        'metadata': {
                            'rating_id': rating.id,
                            'post_id': rating.post.id if rating.post else None,
                            'post_title': rating.post.title if rating.post else 'Post',
                            'stars': rating.stars,
                        }
                    })
                except Exception as e:
                    print(f"  ✗ Error rating given {rating.id}: {str(e)}")
        except Exception as e:
            print(f"✗ Error fetching given ratings: {str(e)}")
        
        # ==================== 6. FEEDBACKS RECEIVED ====================
        # IMPORTANT: Votre modèle utilise User IDs, pas Profile IDs
        print(f"\n🔍 [FEEDBACKS RECEIVED - FILTRE PAR USER ID]")
        print(f"Filtre: professional={user.id} ({user.username})")
        
        received_feedbacks = Feedback.objects.filter(
            professional=user,  # ← C'EST BON, utilise User ID
            created_at__gte=one_month_ago
        ).select_related('user')
        
        print(f"Résultats SQL: {received_feedbacks.count()} feedbacks")
        
        # Vérifiez si la requête retourne quelque chose
        if received_feedbacks.count() == 0:
            print("⚠️  ATTENTION: Aucun feedback trouvé avec professional={user.id}")
            print("   Vérifiez que les feedbacks ont bien 'professional' = cet user")
            
            # Test: Vérifiez tous les feedbacks pour cet user
            test_feedbacks = Feedback.objects.filter(professional=user)
            print(f"   Tous les feedbacks (sans filtre date): {test_feedbacks.count()}")
        
        for idx, feedback in enumerate(received_feedbacks):
            try:
                feedback_serializer = FeedbackSerializer(feedback, context={'request': request})
                feedback_giver = feedback.user
                
                print(f"  ✓ Processing feedback {idx + 1}: ID {feedback.id}")
                print(f"     De: {feedback_giver.username} (ID: {feedback_giver.id})")
                print(f"     À: {feedback.professional.username} (ID: {feedback.professional.id})")
                print(f"     Date: {feedback.created_at}")
                
                activities.append({
                    'id': f"feedback_received_{feedback.id}",
                    'type': 'feedback_received',
                    'title': 'New feedback received',
                    'description': feedback.comment[:150] if feedback.comment else f'Rated {feedback.rating}/5',
                    'timestamp': feedback.created_at.isoformat() if feedback.created_at else None,
                    'user': {
                        'id': feedback_giver.id,
                        'username': feedback_giver.username,
                        'first_name': feedback_giver.first_name,
                        'last_name': feedback_giver.last_name,
                    },
                    'feedback_data': feedback_serializer.data,
                    'metadata': {
                        'feedback_id': feedback.id,
                        'rating': feedback.rating,
                        'is_positive': feedback.rating >= 3,
                        'helpful_count': feedback.helpful_count,
                    }
                })
                
            except Exception as e:
                print(f"  ✗ Error feedback received {feedback.id}: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # ==================== 7. FEEDBACKS GIVEN ====================
        print(f"\n🔍 [FEEDBACKS GIVEN - FILTRE PAR USER ID]")
        print(f"Filtre: user={user.id} ({user.username})")
        
        given_feedbacks = Feedback.objects.filter(
            user=user,  # ← C'EST BON, utilise User ID
            created_at__gte=one_month_ago
        ).select_related('professional')
        
        print(f"Résultats: {given_feedbacks.count()} feedbacks")
        
        for feedback in given_feedbacks:
            try:
                feedback_serializer = FeedbackSerializer(feedback, context={'request': request})
                feedback_receiver = feedback.professional
                profile = Profile.objects.get(user=feedback_receiver)
                activities.append({
                    'id': f"feedback_given_{feedback.id}",
                    'type': 'feedback_given',
                    'title': 'You gave feedback',
                    'description': feedback.comment[:150] if feedback.comment else f'Rated {feedback.rating}/5',
                    'timestamp': feedback.created_at.isoformat() if feedback.created_at else None,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                    },
                    'target_user': {
                        'id': feedback_serializer.data.get('profile_id'),
                       # 'username': feedback_serializer.data.get('profile_name'),
                      #  'first_name': feedback_receiver.first_name,
                      #  'last_name': feedback_receiver.last_name, 
                    },
                    'feedback_data': feedback_serializer.data,
                    'metadata': {
                        'feedback_id': feedback.id,
                        'rating': feedback.rating,
                        'is_positive': feedback.rating >= 3,
                        'helpful_count': feedback.helpful_count,
               
                    }
                })
                
            except Exception as e:
                print(f"  ✗ Error feedback given {feedback.id}: {str(e)}")
        
        # ==================== SORT AND RESPONSE ====================
        # Sort by date (most recent first)
        activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        
        total_activities = len(activities)
        print(f"\n{'='*50}")
        print(f"TOTAL ACTIVITIES FOUND: {total_activities}")
        print(f"  - Your posts: {recent_posts.count()}")
        print(f"  - Your comments: {your_comments.count()}")
        print(f"  - Comments received: {received_comments.count()}")
        print(f"  - Ratings received: {received_ratings.count() if 'received_ratings' in locals() else 0}")
        print(f"  - Ratings given: {given_ratings.count() if 'given_ratings' in locals() else 0}")
        print(f"  - Feedbacks received: {received_feedbacks.count()}")
        print(f"  - Feedbacks given: {given_feedbacks.count()}")
        print(f"{'='*50}\n")
        
        # Détail des types pour debug
        type_counts = {}
        for activity in activities:
            activity_type = activity.get('type', 'unknown')
            type_counts[activity_type] = type_counts.get(activity_type, 0) + 1
        
        print("📊 Détail par type:")
        for activity_type, count in type_counts.items():
            print(f"  - {activity_type}: {count}")
        
        # If no activities, add welcome message
        if total_activities == 0:
            activities.append({
                'id': 'welcome_1',
                'type': 'welcome',
                'title': 'Welcome to your dashboard!',
                'description': 'Start creating content to see your activities here.',
                'timestamp': now.isoformat(),
                'user': {
                    'id': user.id,
                    'username': user.username,
                },
                'metadata': {
                    'is_welcome': True,
                    'suggestions': [
                        'Create your first post',
                        'Comment on interesting posts',
                        'Rate posts you like',
                        'Give feedback to other users'
                    ]
                }
            })
        
        return Response({
            'activities': activities[:30],
            'count': len(activities),
            'time_range': '30_days',
            'summary': {
                'your_posts': recent_posts.count(),
                'your_comments': your_comments.count(),
                'received_comments': received_comments.count(),
                'received_ratings': received_ratings.count() if 'received_ratings' in locals() else 0,
                'given_ratings': given_ratings.count() if 'given_ratings' in locals() else 0,
                'received_feedbacks': received_feedbacks.count(),
                'given_feedbacks': given_feedbacks.count(),
            },
            'debug_info': {
                'user_id': user.id,
                'username': user.username,
                'feedback_received_count': received_feedbacks.count(),
                'feedback_given_count': given_feedbacks.count(),
                'activity_types': type_counts
            }
        })
        
    except Exception as e:
        print(f"ERROR in profile_activity: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'activities': [],
            'count': 0,
            'time_range': 'error',
            'error': str(e),
        }, status=200)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Mettre à jour le profil utilisateur avec sérialiseur"""
    try:
        user = request.user
        data = request.data
        
        # Mettre à jour les champs de base de l'utilisateur
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        user.save()
        
        # Mettre à jour ou créer le profil avec sérialiseur
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            profile = Profile(user=user)
        
        # Utiliser ProfileSerializer pour la mise à jour
        profile_serializer = ProfileSerializer(profile, data=data, partial=True)
        
        if profile_serializer.is_valid():
            profile_serializer.save()
            
            # Gérer l'image de profil séparément si envoyée
            if 'profile_picture' in request.FILES:
                profile.image = request.FILES['profile_picture']
                profile.save()
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': {
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                },
                'profile': profile_serializer.data
            })
        else:
            return Response({
                'success': False,
                'error': profile_serializer.errors
            }, status=400)
        
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    """Données du dashboard spécifiques à l'utilisateur connecté"""
    try:
        user = request.user
        now = timezone.now()
        
        # FILTRER par l'utilisateur connecté
        user_reports = Report.objects.filter(reporter=user)
        
        # Utiliser DashboardReportSerializer pour les rapports
        recent_user_reports = user_reports.order_by('-created_at')[:5]
        report_serializer = DashboardReportSerializer(recent_user_reports, many=True)
        
        # Activité récente de l'utilisateur
        user_activity = []
        for report in recent_user_reports:
            user_activity.append({
                'id': report.id,
                'type': 'report',
                'title': f"Vous avez signalé: {report.get_report_type_display()}",
                'description': f"Contenu: {report.get_content_type_display()}",
                'timestamp': report.created_at.isoformat() if report.created_at else None,
                'metadata': {
                    'content_type': report.get_content_type_display(),
                    'status': report.get_status_display(),
                    'report_data': DashboardReportSerializer(report).data  # Données sérialisées
                }
            })
        
        # Données spécifiques à l'utilisateur
        data = {
            'welcome_message': f'Bonjour {user.username} !',
            'last_updated': now.isoformat(),
            'user_info': {
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            },
            'my_stats': {
                'total_reports': user_reports.count(),
                'unresolved_reports': user_reports.filter(
                    status__in=['pending', 'under_review']
                ).count(),
                'resolved_reports': user_reports.filter(status='resolved').count(),
                'dismissed_reports': user_reports.filter(status='dismissed').count(),
            },
            'my_recent_reports': report_serializer.data,  # Données sérialisées
            'my_activity': user_activity,
        }
        
        return Response(data)
        
    except Exception as e:
        print(f"Dashboard data error: {str(e)}")
        return Response({
            'welcome_message': 'Bonjour !',
            'last_updated': timezone.now().isoformat(),
            'my_stats': {
                'total_reports': 0,
                'unresolved_reports': 0,
                'resolved_reports': 0,
                'dismissed_reports': 0,
            },
            'my_recent_reports': [],
            'my_activity': [],
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Statistiques spécifiques à l'utilisateur"""
    try:
        user = request.user
        now = timezone.now()
        one_week_ago = now - timedelta(days=7)
        one_month_ago = now - timedelta(days=30)
        
        # FILTRER par l'utilisateur connecté
        user_reports = Report.objects.filter(reporter=user)
        
        # Compter par type pour cet utilisateur
        reports_by_type = {}
        for report_type_value, report_type_label in Report.ReportType.choices:
            count = user_reports.filter(report_type=report_type_value).count()
            if count > 0:
                reports_by_type[report_type_value] = {
                    'count': count,
                    'label': report_type_label
                }
        
        # Compter par status pour cet utilisateur
        reports_by_status = {
            'pending': user_reports.filter(status='pending').count(),
            'under_review': user_reports.filter(status='under_review').count(),
            'resolved': user_reports.filter(status='resolved').count(),
            'dismissed': user_reports.filter(status='dismissed').count(),
        }
        
        stats = {
            'user': {
                'username': user.username,
                'reports_count': user_reports.count(),
                'account_age_days': (now - user.date_joined).days if user.date_joined else 0,
            },
            'my_reports': {
                'total': user_reports.count(),
                'this_week': user_reports.filter(created_at__gte=one_week_ago).count(),
                'this_month': user_reports.filter(created_at__gte=one_month_ago).count(),
                'today': user_reports.filter(created_at__date=now.date()).count(),
            },
            'my_reports_by_status': reports_by_status,
            'my_reports_by_type': reports_by_type,
            'success_rate': {
                'resolved_percentage': (reports_by_status['resolved'] / user_reports.count() * 100) if user_reports.count() > 0 else 0,
                'average_resolution_time': '24h',  # À calculer si vous avez les données
            },
            'timestamps': {
                'generated_at': now.isoformat(),
                'last_report': user_reports.order_by('-created_at').first().created_at.isoformat() if user_reports.exists() else None,
            }
        }
        
        return Response(stats)
        
    except Exception as e:
        print(f"Stats error: {str(e)}")
        return Response({
            'user': {
                'username': request.user.username,
                'reports_count': 0,
                'account_age_days': 0,
            },
            'my_reports': {
                'total': 0,
                'this_week': 0,
                'this_month': 0,
                'today': 0,
            },
            'my_reports_by_status': {
                'pending': 0,
                'under_review': 0,
                'resolved': 0,
                'dismissed': 0,
            },
            'my_reports_by_type': {},
            'success_rate': {
                'resolved_percentage': 0,
                'average_resolution_time': 'N/A',
            },
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_feed(request):
    """Activité spécifique à l'utilisateur avec sérialiseur"""
    try:
        user = request.user
        
        # FILTRER par l'utilisateur connecté
        user_reports = Report.objects.filter(reporter=user).order_by('-created_at')[:10]
        
        activities = []
        for report in user_reports:
            # Utiliser DashboardReportSerializer pour chaque rapport
            report_serializer = DashboardReportSerializer(report)
            
            status_color = 'default'
            if report.status == 'resolved':
                status_color = 'success'
            elif report.status == 'pending':
                status_color = 'warning'
            elif report.status == 'dismissed':
                status_color = 'error'
            
            activities.append({
                'id': report.id,
                'type': 'report',
                'title': f"Signalement: {report.get_report_type_display()}",
                'description': report.reason[:100] if report.reason else 'Sans description',
                'timestamp': report.created_at.isoformat() if report.created_at else None,
                'status': report.status,
                'status_display': report.get_status_display(),
                'status_color': status_color,
                'content_type': report.get_content_type_display(),
                'metadata': {
                    'content_id': report.content_id,
                    'reviewed': report.reviewed_at is not None,
                    'has_action': bool(report.action_taken),
                    'report_data': report_serializer.data  # Données sérialisées
                }
            })
        
        return Response({
            'activities': activities,
            'count': len(activities),
            'total_reports': user_reports.count()
        })
        
    except Exception as e:
        print(f"Activity feed error: {str(e)}")
        return Response({
            'activities': [],
            'count': 0,
            'total_reports': 0,
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chart_data(request):
    """Données de graphiques pour l'utilisateur"""
    try:
        user = request.user
        now = timezone.now()
        
        # FILTRER par l'utilisateur connecté
        user_reports = Report.objects.filter(reporter=user)
        
        # Données pour le graphique des signalements par jour (30 derniers jours)
        report_data = []
        for i in range(29, -1, -1):
            date = now - timedelta(days=i)
            count = user_reports.filter(
                created_at__date=date.date()
            ).count()
            report_data.append({
                'date': date.date().isoformat(),
                'count': count
            })
        
        # Compter par type pour le graphique circulaire
        reports_by_type = {}
        for report_type_value, report_type_label in Report.ReportType.choices:
            count = user_reports.filter(report_type=report_type_value).count()
            if count > 0:
                reports_by_type[report_type_value] = {
                    'count': count,
                    'label': report_type_label
                }
        
        # Compter par status
        reports_by_status = {}
        for status_value, status_label in Report.ReportStatus.choices:
            count = user_reports.filter(status=status_value).count()
            if count > 0:
                reports_by_status[status_value] = {
                    'count': count,
                    'label': status_label
                }
        
        return Response({
            'my_reports_per_day': report_data,
            'my_reports_by_type': reports_by_type,
            'my_reports_by_status': reports_by_status,
            'time_range': '30_days',
            'total_reports': user_reports.count()
        })
        
    except Exception as e:
        print(f"Chart data error: {str(e)}")
        return Response({
            'my_reports_per_day': [],
            'my_reports_by_type': {},
            'my_reports_by_status': {},
            'time_range': '30_days',
            'total_reports': 0,
        }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_post(request, pk):
    """Récupérer les posts d'un profil spécifique avec sérialiseur"""
    try:
        profile = Profile.objects.get(id=pk)
        posts = Post.objects.filter(user=profile.user).order_by('-created_at')
        serializer = PostSerializer(posts, many=True)
        return Response({
            'profile_id': profile.id,
            'username': profile.user.username,
            'posts': serializer.data,
            'count': len(serializer.data)
        })
    except Profile.DoesNotExist:
        return Response({
            'error': 'Profile not found'
        }, status=404)
    except Exception as e:
        print(f"Profile post error: {str(e)}")
        return Response({
            'error': 'Unable to load profile posts'
        }, status=500)