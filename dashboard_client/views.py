# Django
from datetime import datetime, timedelta
import json
import math
from collections import defaultdict

from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType as DjangoContentType

from django.db.models import (
    Q, Count, Avg, Sum, F, Value,
    FloatField, IntegerField, DateField,
    Max, Min, Prefetch
)

from django.db.models.functions import (
    TruncDate, TruncWeek, TruncMonth, Coalesce
)

# Django REST Framework
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# App Models
from app.models import Profile
from post.models import Post
from comment_post.models import Comment
from feedback.models import Feedback
from feedback_post.models import Rating
from report.models import (
    Report, ReportStatus, ReportType, ReportAction, ContentType
)
from messaging.models import (
    Message, Conversation, Block,
    GroupBlock, GroupJoinRequest,
    GroupFeedback, GroupMember
)
from certfications.models import Certification, CertificationType, Payment

# Serializers
from app.serializers import ProfileSerializer
from post.serializers import PostSerializer
from comment_post.serializers import CommentSerializer
from feedback_post.serializers import RatingSerializer
from report.serializers import ReportSerializer
from .serializers import FeedbackSerializer, DashboardReportSerializer

User = get_user_model()

user = User
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
        user_comments = Comment.objects.filter(post__user=user)
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
        user_comments = Comment.objects.filter(post__user=user).select_related('post').order_by('-created_at')
        
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
    'id': 'profile_setup_1',
    'type': 'profile_setup',
    'title': 'Complete your profile',
    'description': 'Update your profile and choose a category so other users can easily find you.',
    'timestamp': now.isoformat(),
    'user': {
        'id': user.id,
        'username': user.username,
    },
    'metadata': {
        'is_profile_setup': True,
        'suggestions': [
            'Add a profile picture',
            'Write a short bio about yourself',
            'Choose a category that fits you',
            'Highlight your skills or interests'
        ]
    }
})

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_analytics(request):
    """
    Comprehensive analytics for user profile
    Returns all data needed for frontend charts and statistics
    """
    try:
        user = request.user
        
        has_premium = Certification.objects.filter (
            profile__user=user,
            certification_type__name = 'premium',
            status = 'active',
            subscription_end__gte = timezone.now()
        ).exists()
        if not has_premium:
            return Response({
                'success': False,
                'error': 'Premium subscription required',
                'message': 'Analytics dashboard is only available for Premium users',
                'upgrade_url': '/certifications/',  # URL pour upgrade
                'code': 'premium_required'
            }, status=status.HTTP_403_FORBIDDEN)
        now = timezone.now()
        # ============ TIME PERIODS ============
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)
        last_90_days = now - timedelta(days=90)
        last_365_days = now - timedelta(days=365)
        
        # ============ 1. PROFILE INFORMATION ============
        try:
            profile = Profile.objects.get(user=user)
            profile_data = {
                'id': profile.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'account_age_days': (now - user.date_joined).days if user.date_joined else 0,
                'bio': profile.bio,
                'location': profile.location,
                'city': profile.city,
                'country': profile.country,
                'website': profile.website,
                'image_url': profile.image.url if profile.image else None,
                'is_verified': getattr(profile, 'is_verified', False),
                'completion_percentage': _calculate_profile_completion(profile),
                'badges': _get_user_badges(user, profile),
                'social_links': getattr(profile, 'social_links', []),
            }
        except Profile.DoesNotExist:
            profile_data = {
                'id': None,
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined,
                'account_age_days': (now - user.date_joined).days if user.date_joined else 0,
                'completion_percentage': 0,
                'badges': []
            }
        
        # ============ 2. POSTS STATISTICS ============
        user_posts = Post.objects.filter(user=user)
        all_posts = Post.objects.all()
        
        posts_stats = {
            'overview': {
                'total_posts': user_posts.count(),
                'posts_this_week': user_posts.filter(created_at__gte=last_7_days).count(),
                'posts_this_month': user_posts.filter(created_at__gte=last_30_days).count(),
                'posts_this_year': user_posts.filter(created_at__gte=last_365_days).count(),
                'last_post_date': user_posts.order_by('-created_at').first().created_at if user_posts.exists() else None,
                'percentage_of_total': (user_posts.count() / all_posts.count() * 100) if all_posts.count() > 0 else 0,
            },
            'by_day': _get_posts_by_period(user_posts, TruncDate, last_30_days),
            'by_week': _get_posts_by_period(user_posts, TruncWeek, last_90_days),
            'by_month': _get_posts_by_period(user_posts, TruncMonth, last_365_days),
            'by_category': _get_posts_by_category(user_posts),
            'by_tag': _get_posts_by_tag(user_posts),
            'top_posts': _get_top_posts(user_posts),
        }
        
        # ============ 3. COMMENTS RECEIVED ============
        comments_received = Comment.objects.filter(post__user=user).exclude(user=user)
        comments_given = Comment.objects.filter(user=user)
        
        comments_stats = {
            'overview': {
                'total_comments_received': comments_received.count(),
                'total_comments_given': comments_given.count(),
                'unique_commenters': comments_received.values('user').distinct().count(),
                'comments_this_week': comments_received.filter(created_at__gte=last_7_days).count(),
                'comments_this_month': comments_received.filter(created_at__gte=last_30_days).count(),
                'avg_comments_per_post': comments_received.count() / user_posts.count() if user_posts.count() > 0 else 0,
                'last_comment_date': comments_received.order_by('-created_at').first().created_at if comments_received.exists() else None,
            },
            'by_day': _get_comments_by_period(comments_received, TruncDate, last_30_days),
            'by_week': _get_comments_by_period(comments_received, TruncWeek, last_90_days),
            'by_month': _get_comments_by_period(comments_received, TruncMonth, last_365_days),
            'by_country': _get_comments_by_country(comments_received),
            'by_city': _get_comments_by_city(comments_received),
            'by_post': _get_comments_by_post(comments_received),
            'top_commenters': _get_top_commenters(comments_received),
            'sentiment_analysis': _analyze_comment_sentiment(comments_received),
        }
        
        # ============ 4. RATINGS RECEIVED ============
        ratings_received = Rating.objects.filter(post__user=user)
        ratings_given = Rating.objects.filter(user=user)
        
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating in ratings_received:
            rating_distribution[rating.stars] = rating_distribution.get(rating.stars, 0) + 1
        
        total_ratings = ratings_received.count()
        avg_rating = ratings_received.aggregate(avg=Avg('stars'))['avg'] or 0
        
        ratings_stats = {
            'overview': {
                'total_ratings_received': total_ratings,
                'total_ratings_given': ratings_given.count(),
                'unique_raters': ratings_received.values('user').distinct().count(),
                'average_rating': round(avg_rating, 2),
                'average_rating_this_week': _get_average_rating_by_period(ratings_received, last_7_days),
                'average_rating_this_month': _get_average_rating_by_period(ratings_received, last_30_days),
                'median_rating': _calculate_median_rating(ratings_received),
                'mode_rating': max(rating_distribution, key=rating_distribution.get) if rating_distribution else 0,
                'standard_deviation': _calculate_rating_std_dev(ratings_received, avg_rating),
            },
            'distribution': {
                '1_star': rating_distribution[1],
                '2_stars': rating_distribution[2],
                '3_stars': rating_distribution[3],
                '4_stars': rating_distribution[4],
                '5_stars': rating_distribution[5],
                'percentage_1': round(rating_distribution[1] / total_ratings * 100, 1) if total_ratings > 0 else 0,
                'percentage_2': round(rating_distribution[2] / total_ratings * 100, 1) if total_ratings > 0 else 0,
                'percentage_3': round(rating_distribution[3] / total_ratings * 100, 1) if total_ratings > 0 else 0,
                'percentage_4': round(rating_distribution[4] / total_ratings * 100, 1) if total_ratings > 0 else 0,
                'percentage_5': round(rating_distribution[5] / total_ratings * 100, 1) if total_ratings > 0 else 0,
            },
            'by_day': _get_ratings_by_period(ratings_received, TruncDate, last_30_days),
            'by_week': _get_ratings_by_period(ratings_received, TruncWeek, last_90_days),
            'by_month': _get_ratings_by_period(ratings_received, TruncMonth, last_365_days),
            'by_country': _get_ratings_by_country(ratings_received),
            'by_city': _get_ratings_by_city(ratings_received),
            'by_post': _get_ratings_by_post(ratings_received),
            'top_rated_posts': _get_top_rated_posts(user_posts),
            'trend': _calculate_rating_trend(ratings_received, last_90_days),
        }
        
        # ============ 5. FEEDBACK RECEIVED ============
        feedback_received = Feedback.objects.filter(professional=user)
        feedback_given = Feedback.objects.filter(user=user)
        
        feedback_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for fb in feedback_received:
            feedback_distribution[fb.rating] = feedback_distribution.get(fb.rating, 0) + 1
        
        total_feedback = feedback_received.count()
        avg_feedback_rating = feedback_received.aggregate(avg=Avg('rating'))['avg'] or 0
        
        feedback_stats = {
            'overview': {
                'total_feedback_received': total_feedback,
                'total_feedback_given': feedback_given.count(),
                'unique_feedback_givers': feedback_received.values('user').distinct().count(),
                'average_rating': round(avg_feedback_rating, 2),
                'average_rating_this_week': _get_average_feedback_by_period(feedback_received, last_7_days),
                'average_rating_this_month': _get_average_feedback_by_period(feedback_received, last_30_days),
                'positive_feedback': feedback_received.filter(rating__gte=4).count(),
                'neutral_feedback': feedback_received.filter(rating=3).count(),
                'negative_feedback': feedback_received.filter(rating__lte=2).count(),
                'positive_percentage': round(feedback_received.filter(rating__gte=4).count() / total_feedback * 100, 1) if total_feedback > 0 else 0,
            },
            'distribution': {
                '1_star': feedback_distribution[1],
                '2_stars': feedback_distribution[2],
                '3_stars': feedback_distribution[3],
                '4_stars': feedback_distribution[4],
                '5_stars': feedback_distribution[5],
                'percentage_1': round(feedback_distribution[1] / total_feedback * 100, 1) if total_feedback > 0 else 0,
                'percentage_2': round(feedback_distribution[2] / total_feedback * 100, 1) if total_feedback > 0 else 0,
                'percentage_3': round(feedback_distribution[3] / total_feedback * 100, 1) if total_feedback > 0 else 0,
                'percentage_4': round(feedback_distribution[4] / total_feedback * 100, 1) if total_feedback > 0 else 0,
                'percentage_5': round(feedback_distribution[5] / total_feedback * 100, 1) if total_feedback > 0 else 0,
            },
            'by_day': _get_feedback_by_period(feedback_received, TruncDate, last_30_days),
            'by_week': _get_feedback_by_period(feedback_received, TruncWeek, last_90_days),
            'by_month': _get_feedback_by_period(feedback_received, TruncMonth, last_365_days),
            'by_country': _get_feedback_by_country(feedback_received),
            'by_city': _get_feedback_by_city(feedback_received),
            'common_keywords': _extract_feedback_keywords(feedback_received),
            'recent_feedback': _get_recent_feedback(feedback_received, 10),
        }
        
        # ============ 6. GROUPS STATISTICS ============
        # User's groups (Conversations where is_group=True and user is participant)
        user_groups = Conversation.objects.filter(
            participants=user,
            is_group=True,
            is_active=True
        ).distinct()
        
        # Groups where user is creator/admin
        groups_admin = user_groups.filter(created_by=user)
        
        # Groups where user is member (not admin)
        groups_member = user_groups.exclude(created_by=user)
        
        # Get group member info for role statistics
        group_memberships = GroupMember.objects.filter(user=user, group__in=user_groups)
        admin_groups_count = group_memberships.filter(role__in=['admin', 'owner']).count()
        moderator_groups_count = group_memberships.filter(role='moderator').count()
        
        groups_stats = {
            'overview': {
                'total_groups': user_groups.count(),
                'groups_as_admin': groups_admin.count(),
                'groups_as_member': groups_member.count(),
                'groups_as_admin_by_role': admin_groups_count,
                'groups_as_moderator': moderator_groups_count,
                'total_group_messages': Message.objects.filter(conversation__in=user_groups).count(),
                'user_group_messages': Message.objects.filter(conversation__in=user_groups, sender=user).count(),
                'pending_join_requests': GroupJoinRequest.objects.filter(group__in=groups_admin, status='pending').count(),
                'total_group_feedbacks': GroupFeedback.objects.filter(group__in=user_groups).count(),
            },
            'groups_managed': _get_groups_details(groups_admin, user),
            'groups_joined': _get_groups_details(groups_member, user),
            'activity_by_month': _get_group_activity_by_period(user, TruncMonth, last_365_days),
            'top_groups': _get_top_groups(user_groups),
            'group_feedbacks': _get_group_feedbacks(user, user_groups),
            'role_distribution': {
                'admin': admin_groups_count,
                'moderator': moderator_groups_count,
                'member': groups_member.count() - moderator_groups_count,
            }
        }
        
        # ============ 7. REPORTS STATISTICS ============
        reports_made = Report.objects.filter(reporter=user)
        
        # Get content types for different models
        post_ct = DjangoContentType.objects.get_for_model(Post)
        comment_ct = DjangoContentType.objects.get_for_model(Comment)
        message_ct = DjangoContentType.objects.get_for_model(Message)
        feedback_ct = DjangoContentType.objects.get_for_model(Feedback)
        conversation_ct = DjangoContentType.objects.get_for_model(Conversation)
        
        # Reports received on user's content
        reports_received = Report.objects.filter(
            Q(content_type=post_ct, content_id__in=user_posts.values_list('id', flat=True)) |
            Q(content_type=comment_ct, content_id__in=comments_given.values_list('id', flat=True)) |
            Q(content_type=message_ct, content_id__in=Message.objects.filter(sender=user).values_list('id', flat=True)) |
            Q(content_type=feedback_ct, content_id__in=feedback_given.values_list('id', flat=True)) |
            Q(content_type=conversation_ct, content_id__in=user_groups.values_list('id', flat=True))
        )
        
        reports_stats = {
            'overview': {
                'reports_made': reports_made.count(),
                'reports_received': reports_received.count(),
                'pending_reports_made': reports_made.filter(status='pending').count(),
                'resolved_reports_made': reports_made.filter(status='resolved').count(),
                'dismissed_reports_made': reports_made.filter(status='dismissed').count(),
                'pending_reports_received': reports_received.filter(status='pending').count(),
                'resolved_reports_received': reports_received.filter(status='resolved').count(),
                'dismissed_reports_received': reports_received.filter(status='dismissed').count(),
            },
            'made': {
                'by_type': _get_reports_by_type(reports_made),
                'by_status': _get_reports_by_status(reports_made),
                'by_month': _get_reports_by_period(reports_made, TruncMonth, last_365_days),
            },
            'received': {
                'by_type': _get_reports_by_type(reports_received),
                'by_status': _get_reports_by_status(reports_received),
                'by_month': _get_reports_by_period(reports_received, TruncMonth, last_365_days),
                'by_content': _get_reports_by_content_type(reports_received),
            },
        }
        
        # ============ 8. MESSAGING STATISTICS ============
        messages_sent = Message.objects.filter(sender=user)
        private_conversations = Conversation.objects.filter(
            participants=user,
            is_group=False
        ).distinct()
        
        messaging_stats = {
            'overview': {
                'total_messages_sent': messages_sent.count(),
                'total_messages_received': Message.objects.filter(conversation__participants=user).exclude(sender=user).count(),
                'private_conversations': private_conversations.count(),
                'group_conversations': user_groups.count(),
                'messages_this_week': messages_sent.filter(timestamp__gte=last_7_days).count(),
                'messages_this_month': messages_sent.filter(timestamp__gte=last_30_days).count(),
                'avg_messages_per_day': messages_sent.filter(timestamp__gte=last_30_days).count() / 30,
                'unread_messages': Message.objects.filter(conversation__participants=user, is_read=False).exclude(sender=user).count(),
            },
            'by_day': _get_messages_by_period(messages_sent, TruncDate, last_30_days),
            'by_week': _get_messages_by_period(messages_sent, TruncWeek, last_90_days),
            'by_month': _get_messages_by_period(messages_sent, TruncMonth, last_365_days),
            'top_conversations': _get_top_conversations(user, private_conversations),
            'response_time': _calculate_avg_response_time(user),
        }
        
        # ============ 9. BLOCK STATISTICS ============
        blocks_made = Block.objects.filter(blocker=user, is_active=True)
        blocks_received = Block.objects.filter(blocked=user, is_active=True)
        
        block_stats = {
            'overview': {
                'blocks_made': blocks_made.count(),
                'blocks_received': blocks_received.count(),
                'group_blocks_made': GroupBlock.objects.filter(blocked_by=user, is_active=True).count(),
                'group_blocks_received': GroupBlock.objects.filter(user=user, is_active=True).count(),
            },
            'by_month': _get_blocks_by_period(Block.objects.filter(blocker=user), TruncMonth, last_365_days),
        }
        
        # ============ 10. GEOGRAPHICAL STATISTICS ============
        geo_stats = {
            'comments_by_country': _get_comments_by_country_detailed(comments_received),
            'comments_by_city': _get_comments_by_city_detailed(comments_received),
            'ratings_by_country': _get_ratings_by_country_detailed(ratings_received),
            'ratings_by_city': _get_ratings_by_city_detailed(ratings_received),
            'feedback_by_country': _get_feedback_by_country_detailed(feedback_received),
            'feedback_by_city': _get_feedback_by_city_detailed(feedback_received),
            'world_map_data': _prepare_world_map_data(comments_received, ratings_received, feedback_received),
        }
        
        # ============ 11. ENGAGEMENT SCORES ============
        engagement_stats = {
            'overall_score': _calculate_engagement_score(
                user, user_posts, comments_received, comments_given, 
                ratings_received, ratings_given, feedback_received, 
                feedback_given, user_groups, messages_sent
            ),
            'post_engagement': _calculate_post_engagement(user_posts),
            'comment_engagement': _calculate_comment_engagement(comments_received, comments_given),
            'rating_engagement': _calculate_rating_engagement(ratings_received, ratings_given, avg_rating),
            'feedback_engagement': _calculate_feedback_engagement(feedback_received, feedback_given, avg_feedback_rating),
            'group_engagement': _calculate_group_engagement(user, user_groups),
            'messaging_engagement': _calculate_messaging_engagement(messages_sent, private_conversations, user_groups),
            'daily_active_score': _calculate_daily_active_score(user, last_7_days),
            'weekly_active_score': _calculate_weekly_active_score(user, last_30_days),
            'monthly_active_score': _calculate_monthly_active_score(user, last_90_days),
            'percentiles': _calculate_user_percentiles(
                user, 
                user_posts.count(), 
                ratings_received.count(), 
                feedback_received.count(),
                user_groups.count(),
                messages_sent.count()
            ),
        }
        
        # ============ 12. TRENDS AND FORECASTS ============
        trends_stats = {
            'posts_trend': _calculate_trend(user_posts, last_90_days),
            'comments_trend': _calculate_trend(comments_received, last_90_days),
            'ratings_trend': _calculate_rating_trend(ratings_received, last_90_days),
            'feedback_trend': _calculate_feedback_trend(feedback_received, last_90_days),
            'messages_trend': _calculate_trend(messages_sent, last_90_days),
            'forecast_next_30_days': _forecast_activity(
                user, user_posts, comments_received, 
                ratings_received, feedback_received, messages_sent, last_30_days
            ),
            'peak_activity_hours': _analyze_peak_hours(user),
            'peak_activity_days': _analyze_peak_days(user),
        }
        
        # ============ 13. COMPARATIVE STATISTICS ============
        comparative_stats = {
            'vs_previous_period': _compare_with_previous_period(
                user, user_posts, comments_received, 
                ratings_received, feedback_received, messages_sent, last_30_days
            ),
            'vs_average': _compare_with_average(
                user, 
                user_posts.count(), 
                comments_received.count(), 
                avg_rating, 
                feedback_received.count(),
                user_groups.count(),
                messages_sent.count()
            ),
        }
        
        # ============ 14. HIGHLIGHTS ============
        highlights = _generate_highlights(user, {
            'posts': posts_stats,
            'comments': comments_stats,
            'ratings': ratings_stats,
            'feedback': feedback_stats,
            'groups': groups_stats,
            'messaging': messaging_stats,
            'engagement': engagement_stats,
        })
        
        # ============ FINAL RESPONSE ============
        response_data = {
            'success': True,
            'timestamp': now.isoformat(),
            'user_id': user.id,
            'username': user.username,
            
            'profile': profile_data,
            'posts': posts_stats,
            'comments': comments_stats,
            'ratings': ratings_stats,
            'feedback': feedback_stats,
            'groups': groups_stats,
            'messaging': messaging_stats,
            'blocks': block_stats,
            'reports': reports_stats,
            'geographical': geo_stats,
            'engagement': engagement_stats,
            'trends': trends_stats,
            'comparative': comparative_stats,
            'highlights': highlights,
            
            'metadata': {
                'time_range': {
                    'last_7_days': last_7_days.isoformat(),
                    'last_30_days': last_30_days.isoformat(),
                    'last_90_days': last_90_days.isoformat(),
                    'last_365_days': last_365_days.isoformat(),
                },
                'generated_at': now.isoformat(),
            }
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"❌ ERROR in client_analytics: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'success': False,
            'error': str(e),
            'timestamp': timezone.now().isoformat(),
            'user_id': request.user.id,
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_premium_status(request):
    """Vérifie si l'utilisateur a un abonnement premium actif"""
    user = request.user
    
    # Vérifier via Certification
    premium_cert = Certification.objects.filter(
        profile__user=user,
        certification_type__name='premium',
        status='active',
        subscription_end__gte=timezone.now()
    ).first()
    
    if premium_cert:
        days_remaining = (premium_cert.subscription_end - timezone.now()).days
        return Response({
            'is_premium': True,  # ✅ AJOUTEZ CE CHAMP
            'status': 'success',
            'message': 'Active premium subscription found',
            'certification': {
                'id': premium_cert.id,
                'subscription_end': premium_cert.subscription_end,
                'subscription_start': premium_cert.subscription_start,
                'plan_type': premium_cert.metadata.get('plan_type', 'monthly') if premium_cert.metadata else 'monthly'
            },
            'days_remaining': days_remaining
        })
    
    # Pas de premium
    return Response({
        'is_premium': False,  # ✅ AJOUTEZ CE CHAMP
        'status': 'inactive',
        'message': 'No active premium subscription',
        'certification': None,
        'days_remaining': 0
    })


# ============================================================================
# HELPER FUNCTIONS - CORRECTED FOR YOUR MODELS
# ============================================================================

def _calculate_profile_completion(profile):
    """Calculate profile completion percentage"""
    if not profile:
        return 0
    
    fields = [
        profile.bio,
        profile.location,
        profile.city,
        profile.country,
        profile.website,
        profile.image,
        getattr(profile, 'birth_date', None),
    ]
    
    filled = sum(1 for field in fields if field)
    return round((filled / len(fields)) * 100, 1) if fields else 0


def _get_user_badges(user, profile):
    """Get user badges based on achievements"""
    badges = []
    
    # Post badges
    post_count = Post.objects.filter(user=user).count()
    if post_count >= 100:
        badges.append({'id': 'posts_100', 'name': '100+ Posts', 'icon': '📝', 'level': 'gold'})
    elif post_count >= 50:
        badges.append({'id': 'posts_50', 'name': '50+ Posts', 'icon': '📝', 'level': 'silver'})
    elif post_count >= 10:
        badges.append({'id': 'posts_10', 'name': '10+ Posts', 'icon': '📝', 'level': 'bronze'})
    
    # Rating badges
    avg_rating = Rating.objects.filter(post__user=user).aggregate(avg=Avg('stars'))['avg'] or 0
    rating_count = Rating.objects.filter(post__user=user).count()
    if avg_rating >= 4.5 and rating_count >= 10:
        badges.append({'id': 'rating_45', 'name': 'Top Rated', 'icon': '⭐', 'level': 'gold'})
    elif avg_rating >= 4.0 and rating_count >= 5:
        badges.append({'id': 'rating_40', 'name': 'Highly Rated', 'icon': '⭐', 'level': 'silver'})
    
    # Feedback badges
    feedback_count = Feedback.objects.filter(professional=user).count()
    if feedback_count >= 50:
        badges.append({'id': 'feedback_50', 'name': '50+ Feedbacks', 'icon': '💬', 'level': 'gold'})
    elif feedback_count >= 20:
        badges.append({'id': 'feedback_20', 'name': '20+ Feedbacks', 'icon': '💬', 'level': 'silver'})
    elif feedback_count >= 5:
        badges.append({'id': 'feedback_5', 'name': '5+ Feedbacks', 'icon': '💬', 'level': 'bronze'})
    
    # Comment badges
    comments_received = Comment.objects.filter(post__user=user).exclude(user=user).count()
    if comments_received >= 500:
        badges.append({'id': 'comments_500', 'name': '500+ Comments', 'icon': '💭', 'level': 'gold'})
    elif comments_received >= 100:
        badges.append({'id': 'comments_100', 'name': '100+ Comments', 'icon': '💭', 'level': 'silver'})
    elif comments_received >= 50:
        badges.append({'id': 'comments_50', 'name': '50+ Comments', 'icon': '💭', 'level': 'bronze'})
    
    # Group badges
    groups_count = Conversation.objects.filter(participants=user, is_group=True).count()
    if groups_count >= 20:
        badges.append({'id': 'groups_20', 'name': '20+ Groups', 'icon': '👥', 'level': 'gold'})
    elif groups_count >= 10:
        badges.append({'id': 'groups_10', 'name': '10+ Groups', 'icon': '👥', 'level': 'silver'})
    elif groups_count >= 5:
        badges.append({'id': 'groups_5', 'name': '5+ Groups', 'icon': '👥', 'level': 'bronze'})
    
    # Message badges
    messages_count = Message.objects.filter(sender=user).count()
    if messages_count >= 1000:
        badges.append({'id': 'messages_1000', 'name': '1000+ Messages', 'icon': '💬', 'level': 'gold'})
    elif messages_count >= 500:
        badges.append({'id': 'messages_500', 'name': '500+ Messages', 'icon': '💬', 'level': 'silver'})
    elif messages_count >= 100:
        badges.append({'id': 'messages_100', 'name': '100+ Messages', 'icon': '💬', 'level': 'bronze'})
    
    # Profile completion badge
    completion = _calculate_profile_completion(profile)
    if completion >= 90:
        badges.append({'id': 'profile_100', 'name': 'Complete Profile', 'icon': '👤', 'level': 'gold'})
    elif completion >= 70:
        badges.append({'id': 'profile_75', 'name': 'Well Detailed', 'icon': '👤', 'level': 'silver'})
    
    # Account age badges
    days_since_joined = (timezone.now() - user.date_joined).days if user.date_joined else 0
    if days_since_joined >= 365:
        badges.append({'id': 'year_1', 'name': '1 Year Member', 'icon': '🎂', 'level': 'gold'})
    elif days_since_joined >= 180:
        badges.append({'id': 'months_6', 'name': '6 Month Member', 'icon': '🎂', 'level': 'silver'})
    elif days_since_joined >= 30:
        badges.append({'id': 'month_1', 'name': '1 Month Member', 'icon': '🎂', 'level': 'bronze'})
    
    return badges[:10]  # Limit to 10 badges


def _get_posts_by_period(queryset, trunc_func, since):
    """Get posts grouped by time period"""
    return list(
        queryset.filter(created_at__gte=since)
        .annotate(period=trunc_func('created_at'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )


def _get_posts_by_category(queryset):
    """Get posts grouped by category"""
    return list(
        queryset.filter(category__isnull=False)
        .values('category__id', 'category__name')
        .annotate(count=Count('id'))
        .order_by('-count')
    )


def _get_posts_by_tag(queryset):
    """Get posts grouped by tag"""
    return list(
        queryset.filter(tags__isnull=False)
        .values('tags__id', 'tags__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:20]
    )


def _get_top_posts(queryset):
    """Get top posts by engagement"""
    return list(
        queryset.annotate(
            comments_count_annotated=Count('post_comments', distinct=True),
            ratings_count_annotated=Count('ratings', distinct=True),
            avg_rating_annotated=Coalesce(Avg('ratings__stars'), Value(0.0)),
            engagement_score=F('comments_count_annotated') * 2 + 
                             F('ratings_count_annotated') * 1.5 + 
                             F('avg_rating_annotated') * 3
        )
        .order_by('-engagement_score')[:10]
        .values(
            'id', 
            'title', 
            'comments_count_annotated',  # ✅ Utiliser le nom exact de l'annotation
            'ratings_count_annotated',   # ✅ Utiliser le nom exact de l'annotation
            'avg_rating_annotated',      # ✅ Utiliser le nom exact de l'annotation
            'engagement_score', 
            'created_at'
        )
    )
def _get_comments_by_period(queryset, trunc_func, since):
    """Get comments grouped by time period"""
    return list(
        queryset.filter(created_at__gte=since)
        .annotate(period=trunc_func('created_at'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )


def _get_comments_by_country(queryset):
    """Get comments grouped by country"""
    return list(
        queryset.filter(user__profile__country__isnull=False)
        .values('user__profile__country')
        .annotate(count=Count('id'))
        .order_by('-count')[:20]
    )


def _get_comments_by_country_detailed(queryset):
    """Get detailed comments by country with engagement metrics"""
    return list(
        queryset.filter(user__profile__country__isnull=False)
        .values('user__profile__country')
        .annotate(
            count=Count('id'),
            unique_users=Count('user', distinct=True),
            last_activity=Max('created_at')
        )
        .order_by('-count')
    )


def _get_comments_by_city(queryset):
    """Get comments grouped by city"""
    return list(
        queryset.filter(user__profile__city__isnull=False)
        .values('user__profile__city')
        .annotate(count=Count('id'))
        .order_by('-count')[:20]
    )


def _get_comments_by_city_detailed(queryset):
    """Get detailed comments by city"""
    return list(
        queryset.filter(user__profile__city__isnull=False)
        .values('user__profile__city')
        .annotate(
            count=Count('id'),
            unique_users=Count('user', distinct=True),
            last_activity=Max('created_at')
        )
        .order_by('-count')
    )


def _get_comments_by_post(queryset):
    """Get comments grouped by post"""
    return list(
        queryset.values('post__id', 'post__title')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )


def _get_top_commenters(queryset):
    """Get top commenters on user's posts"""
    return list(
        queryset.exclude(user=queryset.first().post.user if queryset.exists() else None)
        .values('user__id', 'user__username')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )


def _analyze_comment_sentiment(queryset):
    """Basic sentiment analysis based on content keywords"""
    positive_keywords = ['good', 'great', 'excellent', 'amazing', 'love', 'thanks', 'helpful', 'best', 'awesome', 'perfect']
    negative_keywords = ['bad', 'poor', 'terrible', 'hate', 'worst', 'useless', 'disappointing', 'awful', 'horrible']
    
    positive_count = 0
    negative_count = 0
    neutral_count = 0
    
    for comment in queryset[:500]:
        if comment.content:
            content_lower = comment.content.lower()
            if any(word in content_lower for word in positive_keywords):
                positive_count += 1
            elif any(word in content_lower for word in negative_keywords):
                negative_count += 1
            else:
                neutral_count += 1
    
    total = positive_count + negative_count + neutral_count
    
    return {
        'positive': positive_count,
        'positive_percentage': round(positive_count / total * 100, 1) if total > 0 else 0,
        'negative': negative_count,
        'negative_percentage': round(negative_count / total * 100, 1) if total > 0 else 0,
        'neutral': neutral_count,
        'neutral_percentage': round(neutral_count / total * 100, 1) if total > 0 else 0,
        'sentiment_score': round((positive_count - negative_count) / total * 100, 1) if total > 0 else 0,
    }


def _get_average_rating_by_period(queryset, since):
    """Get average rating for a period"""
    filtered = queryset.filter(created_at__gte=since)
    return filtered.aggregate(avg=Avg('stars'))['avg'] or 0


def _calculate_median_rating(queryset):
    """Calculate median rating"""
    ratings = list(queryset.values_list('stars', flat=True))
    if not ratings:
        return 0
    
    ratings.sort()
    n = len(ratings)
    mid = n // 2
    
    if n % 2 == 0:
        return (ratings[mid - 1] + ratings[mid]) / 2
    else:
        return ratings[mid]


def _calculate_rating_std_dev(queryset, mean):
    """Calculate standard deviation of ratings"""
    ratings = list(queryset.values_list('stars', flat=True))
    if not ratings:
        return 0
    
    variance = sum((r - mean) ** 2 for r in ratings) / len(ratings)
    return round(variance ** 0.5, 2)


def _get_ratings_by_period(queryset, trunc_func, since):
    """Get ratings grouped by time period"""
    return list(
        queryset.filter(created_at__gte=since)
        .annotate(period=trunc_func('created_at'))
        .values('period')
        .annotate(
            count=Count('id'),
            average=Avg('stars')
        )
        .order_by('period')
    )


def _get_ratings_by_country(queryset):
    """Get ratings grouped by country"""
    return list(
        queryset.filter(user__profile__country__isnull=False)
        .values('user__profile__country')
        .annotate(
            count=Count('id'),
            average=Avg('stars')
        )
        .order_by('-count')[:20]
    )


def _get_ratings_by_country_detailed(queryset):
    """Get detailed ratings by country"""
    return list(
        queryset.filter(user__profile__country__isnull=False)
        .values('user__profile__country')
        .annotate(
            count=Count('id'),
            average=Avg('stars'),
            unique_users=Count('user', distinct=True),
            distribution_5=Count('id', filter=Q(stars=5)),
            distribution_4=Count('id', filter=Q(stars=4)),
            distribution_3=Count('id', filter=Q(stars=3)),
            distribution_2=Count('id', filter=Q(stars=2)),
            distribution_1=Count('id', filter=Q(stars=1)),
        )
        .order_by('-count')
    )


def _get_ratings_by_city(queryset):
    """Get ratings grouped by city"""
    return list(
        queryset.filter(user__profile__city__isnull=False)
        .values('user__profile__city')
        .annotate(
            count=Count('id'),
            average=Avg('stars')
        )
        .order_by('-count')[:20]
    )


def _get_ratings_by_city_detailed(queryset):
    """Get detailed ratings by city"""
    return list(
        queryset.filter(user__profile__city__isnull=False)
        .values('user__profile__city')
        .annotate(
            count=Count('id'),
            average=Avg('stars'),
            unique_users=Count('user', distinct=True)
        )
        .order_by('-count')
    )


def _get_ratings_by_post(queryset):
    """Get ratings grouped by post"""
    return list(
        queryset.values('post__id', 'post__title')
        .annotate(
            rating_count=Count('id'),
            rating_average=Avg('stars')
        )
        .order_by('-rating_count')[:10]
    )



def _get_top_rated_posts(queryset):
    """Get top rated posts"""
    return list(
        queryset.annotate(
            avg_rating_annotated=Coalesce(Avg('ratings__stars'), Value(0.0)),
            rating_count_annotated=Count('ratings', distinct=True)
        )
        .filter(rating_count_annotated__gte=3)
        .order_by('-avg_rating_annotated', '-rating_count_annotated')[:10]
        .values(
            'id', 
            'title', 
              'created_at',
            avg_rating=F('avg_rating_annotated'), 
            rating_count=F('rating_count_annotated'), 
          
        )
    )


def _calculate_rating_trend(queryset, since):
    """Calculate rating trend over time"""
    by_week = list(
        queryset.filter(created_at__gte=since)
        .annotate(week=TruncWeek('created_at'))
        .values('week')
        .annotate(avg_rating=Avg('stars'))
        .order_by('week')
    )
    
    if len(by_week) >= 2:
        first_avg = by_week[0]['avg_rating'] or 0
        last_avg = by_week[-1]['avg_rating'] or 0
        trend = last_avg - first_avg
        direction = 'up' if trend > 0.1 else 'down' if trend < -0.1 else 'stable'
        percentage = round((trend / first_avg * 100), 1) if first_avg > 0 else 0
    else:
        trend = 0
        direction = 'stable'
        percentage = 0
    
    return {
        'by_week': by_week,
        'trend': round(trend, 2),
        'direction': direction,
        'percentage': percentage,
    }


def _get_average_feedback_by_period(queryset, since):
    """Get average feedback rating for a period"""
    filtered = queryset.filter(created_at__gte=since)
    return filtered.aggregate(avg=Avg('rating'))['avg'] or 0


def _get_feedback_by_period(queryset, trunc_func, since):
    """Get feedback grouped by time period"""
    return list(
        queryset.filter(created_at__gte=since)
        .annotate(period=trunc_func('created_at'))
        .values('period')
        .annotate(
            count=Count('id'),
            average=Avg('rating')
        )
        .order_by('period')
    )


def _get_feedback_by_country(queryset):
    """Get feedback grouped by country"""
    return list(
        queryset.filter(user__profile__country__isnull=False)
        .values('user__profile__country')
        .annotate(
            count=Count('id'),
            average=Avg('rating')
        )
        .order_by('-count')[:20]
    )


def _get_feedback_by_country_detailed(queryset):
    """Get detailed feedback by country"""
    return list(
        queryset.filter(user__profile__country__isnull=False)
        .values('user__profile__country')
        .annotate(
            count=Count('id'),
            average=Avg('rating'),
            unique_users=Count('user', distinct=True),
            distribution_5=Count('id', filter=Q(rating=5)),
            distribution_4=Count('id', filter=Q(rating=4)),
            distribution_3=Count('id', filter=Q(rating=3)),
            distribution_2=Count('id', filter=Q(rating=2)),
            distribution_1=Count('id', filter=Q(rating=1)),
        )
        .order_by('-count')
    )


def _get_feedback_by_city(queryset):
    """Get feedback grouped by city"""
    return list(
        queryset.filter(user__profile__city__isnull=False)
        .values('user__profile__city')
        .annotate(
            count=Count('id'),
            average=Avg('rating')
        )
        .order_by('-count')[:20]
    )


def _get_feedback_by_city_detailed(queryset):
    """Get detailed feedback by city"""
    return list(
        queryset.filter(user__profile__city__isnull=False)
        .values('user__profile__city')
        .annotate(
            count=Count('id'),
            average=Avg('rating'),
            unique_users=Count('user', distinct=True)
        )
        .order_by('-count')
    )


def _extract_feedback_keywords(queryset):
    """Extract common keywords from feedback comments"""
    from collections import Counter
    import re
    
    words = []
    for feedback in queryset.exclude(comment__isnull=True).exclude(comment='')[:200]:
        if feedback.comment:
            clean_words = re.findall(r'\b[a-zA-Z]{4,}\b', feedback.comment.lower())
            words.extend(clean_words)
    
    stop_words = {'this', 'that', 'with', 'from', 'have', 'were', 'they', 'will', 'their', 
                  'what', 'about', 'there', 'would', 'could', 'should', 'very', 'really',
                  'your', 'said', 'them', 'than', 'then', 'than', 'just', 'like'}
    
    word_counts = Counter([w for w in words if w not in stop_words])
    return word_counts.most_common(20)


def _get_recent_feedback(queryset, limit):
    """Get most recent feedback"""
    return list(
        queryset.order_by('-created_at')[:limit]
        .values('id', 'rating', 'comment', 'created_at', 'user__username')
    )


def _get_groups_details(groups_queryset, user):
    """Get detailed information about groups"""
    groups_data = []
    
    for group in groups_queryset[:20]:
        members_count = group.participants.count()
        messages_count = Message.objects.filter(conversation=group).count()
        
        # Get user's role in this group
        user_role = 'member'
        try:
            membership = GroupMember.objects.get(group=group, user=user)
            user_role = membership.role
        except GroupMember.DoesNotExist:
            if group.created_by == user:
                user_role = 'owner'
        
        groups_data.append({
            'id': group.id,
            'name': str(group.name) if group.name else 'Unnamed Group',
            'description': str(group.description) if group.description else '',
            'created_at': group.created_at,
            'members_count': members_count,
            'messages_count': messages_count,
            'user_role': user_role,
            'is_admin': user_role in ['admin', 'owner'],
            'group_type': group.group_type,
            'is_full': group.is_full,
            'available_spots': group.available_spots,
            'category': group.category.name if group.category else None,
            'requires_approval': group.requires_approval,
        })
    
    return groups_data


def _get_group_activity_by_period(user, trunc_func, since):
    """Get group activity grouped by time period"""
    return list(
        Message.objects.filter(
            conversation__participants=user,
            conversation__is_group=True,
            timestamp__gte=since
        )
        .annotate(period=trunc_func('timestamp'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )


def _get_top_groups(groups_queryset):
    """Get top groups by activity"""
    groups_data = []
    
    for group in groups_queryset.annotate(
        message_count=Count('messages', distinct=True)
    ).order_by('-message_count')[:10]:
        
        groups_data.append({
            'id': group.id,
            'name': str(group.name) if group.name else 'Unnamed Group',
            'message_count': group.message_count,
            'members_count': group.participants.count(),
            'created_at': group.created_at,
        })
    
    return groups_data


def _get_group_feedbacks(user, groups_queryset):
    """Get feedback statistics for user's groups"""
    feedbacks_received = GroupFeedback.objects.filter(group__in=groups_queryset)
    feedbacks_given = GroupFeedback.objects.filter(user=user)
    
    return {
        'received': {
            'total': feedbacks_received.count(),
            'average': feedbacks_received.aggregate(avg=Avg('rating'))['avg'] or 0,
            'distribution': {
                1: feedbacks_received.filter(rating=1).count(),
                2: feedbacks_received.filter(rating=2).count(),
                3: feedbacks_received.filter(rating=3).count(),
                4: feedbacks_received.filter(rating=4).count(),
                5: feedbacks_received.filter(rating=5).count(),
            }
        },
        'given': {
            'total': feedbacks_given.count(),
            'average': feedbacks_given.aggregate(avg=Avg('rating'))['avg'] or 0,
        }
    }


def _get_messages_by_period(queryset, trunc_func, since):
    """Get messages grouped by time period"""
    return list(
        queryset.filter(timestamp__gte=since)
        .annotate(period=trunc_func('timestamp'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )


def _get_top_conversations(user, private_conversations):
    """Get top conversations by message count"""
    conversations_data = []
    
    for conv in private_conversations.annotate(
        message_count=Count('messages', distinct=True)
    ).order_by('-message_count')[:10]:
        
        other_user = conv.participants.exclude(id=user.id).first()
        
        conversations_data.append({
            'id': conv.id,
            'with_user': other_user.username if other_user else 'Unknown',
            'message_count': conv.message_count,
            'last_message': Message.objects.filter(conversation=conv).order_by('-timestamp').first().timestamp if Message.objects.filter(conversation=conv).exists() else None,
        })
    
    return conversations_data


def _calculate_avg_response_time(user):
    """Calculate average response time in private conversations"""
    total_response_time = 0
    response_count = 0
    
    private_convs = Conversation.objects.filter(
        participants=user,
        is_group=False
    ).distinct()
    
    for conv in private_convs:
        messages = list(Message.objects.filter(conversation=conv).order_by('timestamp'))
        
        for i in range(1, len(messages)):
            if messages[i].sender != messages[i-1].sender:
                response_time = (messages[i].timestamp - messages[i-1].timestamp).total_seconds() / 60  # in minutes
                if response_time < 1440:  # Only consider responses within 24 hours
                    total_response_time += response_time
                    response_count += 1
    
    avg_response_time = total_response_time / response_count if response_count > 0 else 0
    
    return {
        'avg_minutes': round(avg_response_time, 1),
        'avg_hours': round(avg_response_time / 60, 1),
        'sample_size': response_count,
    }


def _get_reports_by_type(queryset):
    """Get reports grouped by report type"""
    return list(
        queryset.values('report_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )


def _get_reports_by_status(queryset):
    """Get reports grouped by status"""
    return list(
        queryset.values('status')
        .annotate(count=Count('id'))
        .order_by('-count')
    )


def _get_reports_by_period(queryset, trunc_func, since):
    """Get reports grouped by time period"""
    return list(
        queryset.filter(created_at__gte=since)
        .annotate(period=trunc_func('created_at'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )


def _get_reports_by_content_type(queryset):
    """Get reports grouped by content type"""
    return list(
        queryset.values('content_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )


def _get_blocks_by_period(queryset, trunc_func, since):
    """Get blocks grouped by time period"""
    return list(
        queryset.filter(created_at__gte=since)
        .annotate(period=trunc_func('created_at'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )


def _prepare_world_map_data(comments, ratings, feedback):
    """Prepare data for world map visualization"""
    from collections import defaultdict
    
    map_data = defaultdict(lambda: {
        'value': 0,
        'comments': 0,
        'ratings': 0,
        'feedback': 0,
    })
    
    country_coords = {
        'USA': {'lat': 37.0902, 'lon': -95.7129},
        'Canada': {'lat': 56.1304, 'lon': -106.3468},
        'UK': {'lat': 55.3781, 'lon': -3.4360},
        'France': {'lat': 46.6034, 'lon': 1.8883},
        'Germany': {'lat': 51.1657, 'lon': 10.4515},
        'Spain': {'lat': 40.4637, 'lon': -3.7492},
        'Italy': {'lat': 41.8719, 'lon': 12.5674},
        'Australia': {'lat': -25.2744, 'lon': 133.7751},
        'Japan': {'lat': 36.2048, 'lon': 138.2529},
        'Brazil': {'lat': -14.2350, 'lon': -51.9253},
        'India': {'lat': 20.5937, 'lon': 78.9629},
        'China': {'lat': 35.8617, 'lon': 104.1954},
        'Russia': {'lat': 61.5240, 'lon': 105.3188},
        'Mexico': {'lat': 23.6345, 'lon': -102.5528},
        'South Africa': {'lat': -30.5595, 'lon': 22.9375},
    }
    
    for item in comments.filter(user__profile__country__isnull=False).values('user__profile__country').annotate(count=Count('id')):
        country = item['user__profile__country']
        map_data[country]['value'] += item['count']
        map_data[country]['comments'] = item['count']
    
    for item in ratings.filter(user__profile__country__isnull=False).values('user__profile__country').annotate(count=Count('id')):
        country = item['user__profile__country']
        map_data[country]['value'] += item['count']
        map_data[country]['ratings'] = item['count']
    
    for item in feedback.filter(user__profile__country__isnull=False).values('user__profile__country').annotate(count=Count('id')):
        country = item['user__profile__country']
        map_data[country]['value'] += item['count']
        map_data[country]['feedback'] = item['count']
    
    result = []
    for country, data in map_data.items():
        result.append({
            'country': country,
            'value': data['value'],
            'coordinates': country_coords.get(country, {'lat': 0, 'lon': 0}),
            'details': {
                'comments': data['comments'],
                'ratings': data['ratings'],
                'feedback': data['feedback'],
            }
        })
    
    return sorted(result, key=lambda x: x['value'], reverse=True)[:20]


def _calculate_engagement_score(user, user_posts, comments_received, comments_given, 
                                ratings_received, ratings_given, feedback_received, 
                                feedback_given, user_groups, messages_sent):
    """Calculate overall engagement score"""
    posts = user_posts.count()
    comments_rec = comments_received.count()
    comments_giv = comments_given.count()
    ratings_rec = ratings_received.count()
    ratings_giv = ratings_given.count()
    feedback_rec = feedback_received.count()
    feedback_giv = feedback_given.count()
    groups = user_groups.count()
    messages = messages_sent.count()
    
    score = (
        posts * 5 +
        comments_rec * 2 +
        comments_giv * 3 +
        ratings_rec * 1 +
        ratings_giv * 1 +
        feedback_rec * 4 +
        feedback_giv * 2 +
        groups * 3 +
        messages * 0.5
    )
    
    normalized_score = min(100, score / 12)
    return round(normalized_score, 1)


def _calculate_post_engagement(posts_queryset):
    """Calculate post engagement metrics"""
    total_posts = posts_queryset.count()
    if total_posts == 0:
        return 0
    
    total_comments = Comment.objects.filter(post__in=posts_queryset).exclude(user=posts_queryset.first().user).count()
    total_ratings_count = Rating.objects.filter(post__in=posts_queryset).count()
    
    avg_comments_per_post = total_comments / total_posts if total_posts > 0 else 0
    avg_ratings_per_post = total_ratings_count / total_posts if total_posts > 0 else 0
    
    score = (avg_comments_per_post * 3 + avg_ratings_per_post * 2) * 10
    return round(min(100, score), 1)

def _calculate_comment_engagement(comments_received, comments_given):
    """Calculate comment engagement score"""
    received_count = comments_received.count()
    given_count = comments_given.count()
    
    if received_count == 0 and given_count == 0:
        return 0
    
    score = (received_count * 2 + given_count) * 0.5
    return round(min(100, score), 1)


def _calculate_rating_engagement(ratings_received, ratings_given, avg_rating):
    """Calculate rating engagement score"""
    received_count = ratings_received.count()
    given_count = ratings_given.count()
    
    if received_count == 0 and given_count == 0:
        return 0
    
    score = (received_count + given_count) * (avg_rating / 5) * 2
    return round(min(100, score), 1)


def _calculate_feedback_engagement(feedback_received, feedback_given, avg_rating):
    """Calculate feedback engagement score"""
    received_count = feedback_received.count()
    given_count = feedback_given.count()
    
    if received_count == 0 and given_count == 0:
        return 0
    
    score = (received_count * 3 + given_count) * (avg_rating / 5) * 2
    return round(min(100, score), 1)


def _calculate_group_engagement(user, groups_queryset):
    """Calculate group engagement score"""
    groups_count = groups_queryset.count()
    if groups_count == 0:
        return 0
    
    messages_count = Message.objects.filter(conversation__in=groups_queryset, sender=user).count()
    
    score = groups_count * 2 + messages_count * 0.5
    return round(min(100, score), 1)


def _calculate_messaging_engagement(messages_sent, private_conversations, groups_queryset):
    """Calculate messaging engagement score"""
    messages_count = messages_sent.count()
    private_count = private_conversations.count()
    groups_count = groups_queryset.count()
    
    if messages_count == 0:
        return 0
    
    score = messages_count * 0.3 + private_count * 2 + groups_count * 1
    return round(min(100, score), 1)


def _calculate_daily_active_score(user, last_7_days):
    """Calculate daily active score (0-100)"""
    today = timezone.now().date()
    
    has_posted_today = Post.objects.filter(user=user, created_at__date=today).exists()
    has_commented_today = Comment.objects.filter(user=user, created_at__date=today).exists()
    has_rated_today = Rating.objects.filter(user=user, created_at__date=today).exists()
    has_feedback_today = Feedback.objects.filter(user=user, created_at__date=today).exists()
    has_messaged_today = Message.objects.filter(sender=user, timestamp__date=today).exists()
    
    posts_week = Post.objects.filter(user=user, created_at__gte=last_7_days).count()
    comments_week = Comment.objects.filter(user=user, created_at__gte=last_7_days).count()
    messages_week = Message.objects.filter(sender=user, timestamp__gte=last_7_days).count()
    
    score = 0
    if has_posted_today:
        score += 25
    if has_commented_today:
        score += 15
    if has_rated_today:
        score += 10
    if has_feedback_today:
        score += 15
    if has_messaged_today:
        score += 15
    
    # Bonus for consistency
    if posts_week >= 3:
        score += 10
    if comments_week >= 5:
        score += 5
    if messages_week >= 10:
        score += 5
    
    return min(100, score)


def _calculate_weekly_active_score(user, last_30_days):
    """Calculate weekly active score (0-100)"""
    last_7_days = timezone.now() - timedelta(days=7)
    
    posts_count = Post.objects.filter(user=user, created_at__gte=last_7_days).count()
    comments_count = Comment.objects.filter(user=user, created_at__gte=last_7_days).count()
    ratings_count = Rating.objects.filter(user=user, created_at__gte=last_7_days).count()
    feedback_count = Feedback.objects.filter(user=user, created_at__gte=last_7_days).count()
    messages_count = Message.objects.filter(sender=user, timestamp__gte=last_7_days).count()
    
    score = min(100, posts_count * 10 + comments_count * 4 + ratings_count * 2 + feedback_count * 3 + messages_count * 1)
    return score


def _calculate_monthly_active_score(user, last_90_days):
    """Calculate monthly active score (0-100)"""
    last_30_days = timezone.now() - timedelta(days=30)
    
    posts_count = Post.objects.filter(user=user, created_at__gte=last_30_days).count()
    comments_count = Comment.objects.filter(user=user, created_at__gte=last_30_days).count()
    ratings_count = Rating.objects.filter(user=user, created_at__gte=last_30_days).count()
    feedback_count = Feedback.objects.filter(user=user, created_at__gte=last_30_days).count()
    messages_count = Message.objects.filter(sender=user, timestamp__gte=last_30_days).count()
    
    score = min(100, posts_count * 8 + comments_count * 3 + ratings_count * 1.5 + feedback_count * 2.5 + messages_count * 0.5)
    return round(score, 1)


def _calculate_user_percentiles(user, post_count, rating_count, feedback_count, groups_count, messages_count):
    """Calculate user percentiles for various metrics"""
    from django.db.models import Count, Avg
    
    all_users = User.objects.filter(is_active=True)
    total_users = all_users.count()
    
    if total_users == 0:
        return {'posts': 50, 'rating': 50, 'feedback': 50, 'groups': 50, 'messages': 50, 'overall': 50}
    
    # Posts percentile
    users_with_less_posts = User.objects.annotate(
        post_count=Count('post')  # ou 'post_set' selon votre version
    ).filter(post_count__lt=post_count).count()
    post_percentile = (users_with_less_posts / total_users * 100) if total_users > 0 else 50
    
    # Ratings percentile
    user_avg_rating = Rating.objects.filter(post__user=user).aggregate(avg=Avg('stars'))['avg'] or 0
    users_with_lower_rating = User.objects.annotate(
        avg_rating=Avg('post__ratings__stars')
    ).filter(avg_rating__lt=user_avg_rating).count()
    rating_percentile = (users_with_lower_rating / total_users * 100) if total_users > 0 else 50
    
    # ✅ CORRECTION: Utiliser 'professional_feedbacks' au lieu de 'feedback_received'
    users_with_less_feedback = User.objects.annotate(
        feedback_count=Count('professional_feedbacks')  # ✅ C'est le bon related_name
    ).filter(feedback_count__lt=feedback_count).count()
    feedback_percentile = (users_with_less_feedback / total_users * 100) if total_users > 0 else 50
    
    # Groups percentile
    users_with_less_groups = User.objects.annotate(
        groups_count=Count('conversations', filter=Q(conversations__is_group=True))
    ).filter(groups_count__lt=groups_count).count()
    groups_percentile = (users_with_less_groups / total_users * 100) if total_users > 0 else 50
    
    # Messages percentile
    users_with_less_messages = User.objects.annotate(
        messages_count=Count('sent_messages')
    ).filter(messages_count__lt=messages_count).count()
    messages_percentile = (users_with_less_messages / total_users * 100) if total_users > 0 else 50
    
    return {
        'posts': round(post_percentile, 1),
        'rating': round(rating_percentile, 1),
        'feedback': round(feedback_percentile, 1),
        'groups': round(groups_percentile, 1),
        'messages': round(messages_percentile, 1),
        'overall': round((post_percentile + rating_percentile + feedback_percentile + groups_percentile + messages_percentile) / 5, 1),
    }

def _calculate_trend(queryset, since):
    """Calculate trend over time - FIXED for Message model"""
    # Vérifier le type du queryset pour utiliser le bon champ de date
    model = queryset.model
    
    # Déterminer le champ de date à utiliser
    date_field = 'created_at'  # Par défaut pour Post, Comment, etc.
    
    if model == Message:
        date_field = 'timestamp'  # Message utilise timestamp au lieu de created_at
    elif model == Rating:
        date_field = 'created_at'
    elif model == Feedback:
        date_field = 'created_at'
    elif model == Comment:
        date_field = 'created_at'
    elif model == Post:
        date_field = 'created_at'
    elif model == Report:
        date_field = 'created_at'
    
    filter_kwargs = {f'{date_field}__gte': since}
    
    by_month = list(
        queryset.filter(**filter_kwargs)
        .annotate(month=TruncMonth(date_field))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    
    if len(by_month) < 2:
        return {'direction': 'stable', 'percentage': 0, 'by_month': by_month}
    
    first_month = by_month[0]['count'] or 0
    last_month = by_month[-1]['count'] or 0
    
    if first_month == 0:
        direction = 'up' if last_month > 0 else 'stable'
        percentage = 100 if last_month > 0 else 0
    else:
        percentage = ((last_month - first_month) / first_month) * 100
        direction = 'up' if percentage > 10 else 'down' if percentage < -10 else 'stable'
    
    return {
        'direction': direction,
        'percentage': round(percentage, 1),
        'by_month': by_month
    }

def _calculate_feedback_trend(queryset, since):
    """Calculate feedback rating trend"""
    by_month = list(
        queryset.filter(created_at__gte=since)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(
            count=Count('id'),
            avg_rating=Avg('rating')
        )
        .order_by('month')
    )
    
    if len(by_month) < 2:
        return {'direction': 'stable', 'percentage': 0, 'by_month': by_month}
    
    first_avg = by_month[0]['avg_rating'] or 0
    last_avg = by_month[-1]['avg_rating'] or 0
    
    if first_avg == 0:
        direction = 'up' if last_avg > 0 else 'stable'
        percentage = 100 if last_avg > 0 else 0
    else:
        percentage = ((last_avg - first_avg) / first_avg) * 100
        direction = 'up' if percentage > 5 else 'down' if percentage < -5 else 'stable'
    
    return {
        'direction': direction,
        'percentage': round(percentage, 1),
        'by_month': by_month
    }


def _forecast_activity(user, user_posts, comments_received, ratings_received, feedback_received, messages_sent, last_30_days):
    """Simple forecast for next 30 days based on historical data"""
    posts_last_30 = user_posts.filter(created_at__gte=last_30_days).count()
    comments_last_30 = comments_received.filter(created_at__gte=last_30_days).count()
    ratings_last_30 = ratings_received.filter(created_at__gte=last_30_days).count()
    feedback_last_30 = feedback_received.filter(created_at__gte=last_30_days).count()
    messages_last_30 = messages_sent.filter(timestamp__gte=last_30_days).count()
    
    # Simple linear projection with slight growth
    forecast = {
        'posts': max(0, int(posts_last_30 * 1.1)),
        'comments': max(0, int(comments_last_30 * 1.1)),
        'ratings': max(0, int(ratings_last_30 * 1.1)),
        'feedback': max(0, int(feedback_last_30 * 1.1)),
        'messages': max(0, int(messages_last_30 * 1.1)),
        'confidence': 'high' if posts_last_30 > 10 else 'medium' if posts_last_30 > 5 else 'low',
    }
    
    return forecast


def _analyze_peak_hours(user):
    """Analyze peak activity hours"""
    from django.db.models.functions import ExtractHour
    
    post_hours = Post.objects.filter(user=user).annotate(
        hour=ExtractHour('created_at')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    comment_hours = Comment.objects.filter(user=user).annotate(
        hour=ExtractHour('created_at')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    message_hours = Message.objects.filter(sender=user).annotate(
        hour=ExtractHour('timestamp')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    return {
        'posts': list(post_hours),
        'comments': list(comment_hours),
        'messages': list(message_hours),
    }


def _analyze_peak_days(user):
    """Analyze peak activity days"""
    from django.db.models.functions import ExtractWeekDay
    
    post_days = Post.objects.filter(user=user).annotate(
        day=ExtractWeekDay('created_at')
    ).values('day').annotate(
        count=Count('id')
    ).order_by('-count')
    
    comment_days = Comment.objects.filter(user=user).annotate(
        day=ExtractWeekDay('created_at')
    ).values('day').annotate(
        count=Count('id')
    ).order_by('-count')
    
    message_days = Message.objects.filter(sender=user).annotate(
        day=ExtractWeekDay('timestamp')
    ).values('day').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return {
        'posts': list(post_days),
        'comments': list(comment_days),
        'messages': list(message_days),
    }


def _compare_with_previous_period(user, user_posts, comments_received, ratings_received, feedback_received, messages_sent, last_30_days):
    """Compare current period with previous period"""
    now = timezone.now()
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)
    previous_end = now - timedelta(days=30)
    
    posts_current = user_posts.filter(created_at__gte=current_start).count()
    posts_previous = user_posts.filter(created_at__range=[previous_start, previous_end]).count()
    
    comments_current = comments_received.filter(created_at__gte=current_start).count()
    comments_previous = comments_received.filter(created_at__range=[previous_start, previous_end]).count()
    
    ratings_current = ratings_received.filter(created_at__gte=current_start).count()
    ratings_previous = ratings_received.filter(created_at__range=[previous_start, previous_end]).count()
    
    feedback_current = feedback_received.filter(created_at__gte=current_start).count()
    feedback_previous = feedback_received.filter(created_at__range=[previous_start, previous_end]).count()
    
    messages_current = messages_sent.filter(timestamp__gte=current_start).count()
    messages_previous = messages_sent.filter(timestamp__range=[previous_start, previous_end]).count()
    
    return {
        'posts': {
            'current': posts_current,
            'previous': posts_previous,
            'change': posts_current - posts_previous,
            'change_percentage': round(((posts_current - posts_previous) / posts_previous * 100), 1) if posts_previous > 0 else (100 if posts_current > 0 else 0),
        },
        'comments': {
            'current': comments_current,
            'previous': comments_previous,
            'change': comments_current - comments_previous,
            'change_percentage': round(((comments_current - comments_previous) / comments_previous * 100), 1) if comments_previous > 0 else (100 if comments_current > 0 else 0),
        },
        'ratings': {
            'current': ratings_current,
            'previous': ratings_previous,
            'change': ratings_current - ratings_previous,
            'change_percentage': round(((ratings_current - ratings_previous) / ratings_previous * 100), 1) if ratings_previous > 0 else (100 if ratings_current > 0 else 0),
        },
        'feedback': {
            'current': feedback_current,
            'previous': feedback_previous,
            'change': feedback_current - feedback_previous,
            'change_percentage': round(((feedback_current - feedback_previous) / feedback_previous * 100), 1) if feedback_previous > 0 else (100 if feedback_current > 0 else 0),
        },
        'messages': {
            'current': messages_current,
            'previous': messages_previous,
            'change': messages_current - messages_previous,
            'change_percentage': round(((messages_current - messages_previous) / messages_previous * 100), 1) if messages_previous > 0 else (100 if messages_current > 0 else 0),
        },
    }


def _compare_with_average(user, post_count, comment_count, avg_rating, feedback_count, groups_count, messages_count):
    """Compare user metrics to platform average"""
    all_users = User.objects.filter(is_active=True)
    total_users = all_users.count()
    
    if total_users == 0:
        platform_avg_posts = 15
        platform_avg_comments = 50
        platform_avg_rating = 4.2
        platform_avg_feedback = 10
        platform_avg_groups = 3
        platform_avg_messages = 200
    else:
        platform_avg_posts = Post.objects.count() / total_users
        platform_avg_comments = Comment.objects.filter(post__user__in=all_users).exclude(user__in=all_users).count() / total_users
        platform_avg_rating = Rating.objects.aggregate(avg=Avg('stars'))['avg'] or 4.0
        platform_avg_feedback = Feedback.objects.count() / total_users
        platform_avg_groups = Conversation.objects.filter(is_group=True).count() / total_users
        platform_avg_messages = Message.objects.count() / total_users
    
    return {
        'posts': {
            'user': post_count,
            'average': round(platform_avg_posts, 1),
            'difference': post_count - platform_avg_posts,
            'percentage': round((post_count / platform_avg_posts * 100), 1) if platform_avg_posts > 0 else 0,
        },
        'comments': {
            'user': comment_count,
            'average': round(platform_avg_comments, 1),
            'difference': comment_count - platform_avg_comments,
            'percentage': round((comment_count / platform_avg_comments * 100), 1) if platform_avg_comments > 0 else 0,
        },
        'rating': {
            'user': round(avg_rating, 1),
            'average': round(platform_avg_rating, 1),
            'difference': round(avg_rating - platform_avg_rating, 1),
            'percentage': round((avg_rating / platform_avg_rating * 100), 1) if platform_avg_rating > 0 else 0,
        },
        'feedback': {
            'user': feedback_count,
            'average': round(platform_avg_feedback, 1),
            'difference': feedback_count - platform_avg_feedback,
            'percentage': round((feedback_count / platform_avg_feedback * 100), 1) if platform_avg_feedback > 0 else 0,
        },
        'groups': {
            'user': groups_count,
            'average': round(platform_avg_groups, 1),
            'difference': groups_count - platform_avg_groups,
            'percentage': round((groups_count / platform_avg_groups * 100), 1) if platform_avg_groups > 0 else 0,
        },
        'messages': {
            'user': messages_count,
            'average': round(platform_avg_messages, 1),
            'difference': messages_count - platform_avg_messages,
            'percentage': round((messages_count / platform_avg_messages * 100), 1) if platform_avg_messages > 0 else 0,
        },
    }


def _generate_highlights(user, stats):
    """Generate key highlights and insights"""
    highlights = []
    
    # Post highlights
    if stats['posts']['overview']['total_posts'] == 0:
        highlights.append({
            'type': 'tip',
            'title': 'Create your first post',
            'description': 'Start sharing content to build your presence.',
            'icon': '📝',
            'priority': 'high'
        })
    elif stats['posts']['overview']['posts_this_week'] > stats['posts']['overview']['posts_this_month'] / 4 * 1.3:
        highlights.append({
            'type': 'achievement',
            'title': 'Increased posting activity',
            'description': f"You've posted {stats['posts']['overview']['posts_this_week']} times this week, above your average!",
            'icon': '🔥',
            'priority': 'high'
        })
    
    # Rating highlights
    if stats['ratings']['overview']['total_ratings_received'] > 0:
        avg_rating = stats['ratings']['overview']['average_rating']
        if avg_rating >= 4.5:
            highlights.append({
                'type': 'achievement',
                'title': 'Excellent rating!',
                'description': f'Your average rating of {avg_rating}/5 is outstanding.',
                'icon': '⭐',
                'priority': 'high'
            })
        elif avg_rating <= 3.0 and stats['ratings']['overview']['total_ratings_received'] > 5:
            highlights.append({
                'type': 'insight',
                'title': 'Room for improvement',
                'description': 'Consider engaging more with commenters to improve your ratings.',
                'icon': '💡',
                'priority': 'medium'
            })
    
    # Feedback highlights
    if stats['feedback']['overview']['total_feedback_received'] > 0:
        positive = stats['feedback']['overview']['positive_percentage']
        if positive > 80:
            highlights.append({
                'type': 'achievement',
                'title': 'Highly recommended!',
                'description': f"{positive}% of your feedback is positive.",
                'icon': '👍',
                'priority': 'high'
            })
        elif positive < 50 and stats['feedback']['overview']['total_feedback_received'] > 5:
            highlights.append({
                'type': 'warning',
                'title': 'Feedback needs attention',
                'description': 'Your positive feedback rate is below 50%. Consider addressing concerns.',
                'icon': '⚠️',
                'priority': 'high'
            })
    
    # Group highlights
    if stats['groups']['overview']['total_groups'] > 0:
        highlights.append({
            'type': 'info',
            'title': 'Active in groups',
            'description': f"You're active in {stats['groups']['overview']['total_groups']} groups.",
            'icon': '👥',
            'priority': 'low'
        })
    
    # Messaging highlights
    if stats['messaging']['overview']['total_messages_sent'] > 1000:
        highlights.append({
            'type': 'achievement',
            'title': 'Messaging pro!',
            'description': f"You've sent over {stats['messaging']['overview']['total_messages_sent']} messages!",
            'icon': '💬',
            'priority': 'medium'
        })
    
    # Engagement highlights
    if stats['engagement']['overall_score'] > 70:
        highlights.append({
            'type': 'achievement',
            'title': 'Highly engaged user',
            'description': f"Your engagement score of {stats['engagement']['overall_score']} is excellent!",
            'icon': '🏆',
            'priority': 'high'
        })
    elif stats['engagement']['overall_score'] < 20:
        highlights.append({
            'type': 'tip',
            'title': 'Boost your engagement',
            'description': 'Post regularly and interact with others to increase your engagement score.',
            'icon': '📊',
            'priority': 'medium'
        })
    
    # Milestone highlights
    post_count = stats['posts']['overview']['total_posts']
    if post_count >= 100:
        highlights.append({
            'type': 'milestone',
            'title': '100+ Posts',
            'description': 'Congratulations on reaching 100 posts!',
            'icon': '🏅',
            'priority': 'high'
        })
    elif post_count >= 50:
        highlights.append({
            'type': 'milestone',
            'title': '50+ Posts',
            'description': f"You've created {post_count} posts. Keep going!",
            'icon': '🏅',
            'priority': 'medium'
        })
    
    # Message milestone
    messages_count = stats['messaging']['overview']['total_messages_sent']
    if messages_count >= 1000:
        highlights.append({
            'type': 'milestone',
            'title': '1000+ Messages',
            'description': 'You have sent over 1000 messages!',
            'icon': '💬',
            'priority': 'high'
        })
    
    return sorted(highlights, key=lambda x: {'high': 0, 'medium': 1, 'low': 2}[x['priority']])[:10]