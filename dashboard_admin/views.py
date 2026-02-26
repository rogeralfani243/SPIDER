from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Count, Sum, Avg, Q, F, Max, Min
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404
from django.db.models.functions import Coalesce
from django.core.paginator import Paginator
from django.http import JsonResponse
import json
from collections import defaultdict
import calendar
from comment_post.models import Comment
from app.models import Profile, Category, Tag, DeletionCode, PasswordResetCode, OpeningHours
from post.models import Post, PostImage, PostFile, PostView, UserInteraction, AdCampaign, SponsoredPost, Category as PostCategory
from feedback.models import Feedback
from report.models import Report,ContentType, ReportAction, ReportType, ReportStatus
from certfications.models import Certification, CertificationType, IDVerificationRequest, Payment
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Prefetch
from .serializers import CommentAdminSerializer, CommentDetailAdminSerializer
from .pagination import CommentPagination
import json
from django.db.models import Exists, OuterRef
from messaging.models import Message, Conversation
User = get_user_model()
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags
import traceback
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay, TruncYear, ExtractHour, ExtractWeekDay
from django.utils import timezone
from datetime import datetime, timedelta
from collections import defaultdict
import logging
from app.models import Profile
from django.db import transaction

logger = logging.getLogger(__name__)

# ==================== HELPER FUNCTIONS ====================

def get_paginated_data(request, queryset, page_size=50):
    """Helper function for pagination"""
    page = request.GET.get('page', 1)
    paginator = Paginator(queryset, page_size)
    
    try:
        page_obj = paginator.page(page)
    except:
        page_obj = paginator.page(1)
    
    return {
        'data': list(page_obj.object_list.values()),
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_items': paginator.count,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
    }

# ==================== DASHBOARD STATISTICS ====================

from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, Avg, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.contrib.auth import get_user_model
from django.conf import settings

# Importe tous les modèles nécessaires
User = get_user_model()

# Assure-toi d'importer tous tes modèles
try:
    from app.models import Profile
    from post.models import Post, Category as PostCategory, SponsoredPost
    from comment_post.models import Comment
    from feedback.models import Feedback
    from report.models import Report, ReportType
    
    # Vérifie que les modèles sont disponibles
    MODELS_AVAILABLE = True
except ImportError as e:
    MODELS_AVAILABLE = False
    print(f"Erreur d'importation des modèles: {e}")


from django.core.mail import send_mail
from django.conf import settings

def send_warning_email(to_email, from_email, message, report):
    """Send warning email to user"""
    subject = f"Warning: Your content has been reported - Report #{report.id}"
    
    email_body = f"""
    Dear User,
    
    Your content on our platform has been reported by other users and reviewed by our moderation team.
    
    Report Details:
    - Report ID: #{report.id}
    - Report Type: {report.get_report_type_display()}
    - Content Type: {report.content_type}
    
    Moderator Message:
    {message}
    
    Please review our community guidelines and ensure your future contributions comply with our policies.
    
    If you believe this is a mistake, you can contact our support team.
    
    Best regards,
    The Moderation Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=email_body,
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_custom_email(to_email, from_email, subject, message, report):
    """Send custom email to user"""
    
    email_body = f"""
    Dear User,
    
    Regarding Report #{report.id} about your content:
    
    {message}
    
    Report Details:
    - Report Type: {report.get_report_type_display()}
    - Content Type: {report.content_type}
    
    Best regards,
    The Moderation Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=email_body,
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_dashboard_stats(request):
    """Get comprehensive dashboard statistics"""
    try:
        # Vérifie si les modèles sont disponibles
        if not MODELS_AVAILABLE:
            return Response({
                'status': 'error',
                'message': 'Les modèles ne sont pas disponibles. Vérifiez les imports.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Periods
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        year_ago = today - timedelta(days=365)
        
        # Users statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_week = User.objects.filter(date_joined__date__gte=week_ago).count()
        new_users_month = User.objects.filter(date_joined__date__gte=month_ago).count()
        
        # Profiles statistics
        total_profiles = Profile.objects.count()
        active_profiles = Profile.objects.filter(is_active=True).count()
        profiles_with_bio = Profile.objects.filter(
            Q(bio__isnull=False) & ~Q(bio='')
        ).count()
        profiles_with_image = Profile.objects.filter(image__isnull=False).count()
        
        # Posts statistics
        total_posts = Post.objects.count()
        posts_today = Post.objects.filter(created_at__date=today).count()
        posts_week = Post.objects.filter(created_at__date__gte=week_ago).count()
        posts_month = Post.objects.filter(created_at__date__gte=month_ago).count()
        
        # Comments statistics
        total_comments = Comment.objects.count()
        comments_today = Comment.objects.filter(created_at__date=today).count()
        comments_week = Comment.objects.filter(created_at__date__gte=week_ago).count()
        comments_month = Comment.objects.filter(created_at__date__gte=month_ago).count()
        
        # Feedback statistics
        total_feedbacks = Feedback.objects.count()
        avg_rating = Feedback.objects.aggregate(avg=Avg('rating'))['avg'] or 0
        feedbacks_today = Feedback.objects.filter(created_at__date=today).count()
        
        # Reports statistics
        total_reports = Report.objects.count()
        pending_reports = Report.objects.filter(status='pending').count()
        resolved_reports = Report.objects.filter(status='resolved').count()
        
        # Certifications statistics
        total_certifications = Certification.objects.count()
        active_certifications = Certification.objects.filter(status='active').count()
        premium_certifications = Certification.objects.filter(
            certification_type__name='premium',
            status='active'
        ).count()
        
        # Payments statistics
        total_payments = Payment.objects.count()
        completed_payments = Payment.objects.filter(status='completed').count()
        total_revenue = Payment.objects.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Sponsored posts statistics
        active_sponsored = SponsoredPost.objects.filter(
            boost_end__gte=today,
            payment_status='paid'
        ).count()
        total_sponsored = SponsoredPost.objects.count()
        
        # Categories statistics - VERSION CORRIGÉE
        try:
            top_categories = PostCategory.objects.annotate(
                post_count=Count('post_categorie')
            ).order_by('-post_count')[:5].values('name', 'post_count')
        except Exception as e:
            print(f"Erreur avec top_categories: {e}")
            top_categories = []
        
        # Daily registrations for chart (last 30 days)
        daily_registrations = []
        for i in range(30, -1, -1):
            date = today - timedelta(days=i)
            count = User.objects.filter(date_joined__date=date).count()
            daily_registrations.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        
        # Monthly posts for chart (last 12 months)
        monthly_posts = []
        for i in range(12, -1, -1):
            month_start = today.replace(day=1) - timedelta(days=i*30)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            count = Post.objects.filter(
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).count()
            
            monthly_posts.append({
                'month': month_start.strftime('%b %Y'),
                'count': count
            })
        
        # Report types distribution
        report_types = []
        if hasattr(ReportType, 'values'):
            for report_type in ReportType.values:
                count = Report.objects.filter(report_type=report_type).count()
                if count > 0:
                    report_types.append({
                        'type': report_type,
                        'label': ReportType.labels[ReportType.values.index(report_type)],
                        'count': count
                    })
        else:
            # Fallback si ReportType n'a pas de values
            unique_types = Report.objects.values_list('report_type', flat=True).distinct()
            for report_type in unique_types:
                count = Report.objects.filter(report_type=report_type).count()
                report_types.append({
                    'type': report_type,
                    'label': report_type,
                    'count': count
                })
        
        # Platform growth metrics
        current_month = today.replace(day=1)
        previous_month = (current_month - timedelta(days=1)).replace(day=1)
        
        # User growth rate
        current_month_users = User.objects.filter(date_joined__date__gte=current_month).count()
        previous_month_users = User.objects.filter(
            date_joined__date__gte=previous_month,
            date_joined__date__lt=current_month
        ).count()
        
        user_growth_rate = 0
        if previous_month_users > 0:
            user_growth_rate = ((current_month_users - previous_month_users) / previous_month_users) * 100
        
        # Post growth rate
        current_month_posts = Post.objects.filter(created_at__date__gte=current_month).count()
        previous_month_posts = Post.objects.filter(
            created_at__date__gte=previous_month,
            created_at__date__lt=current_month
        ).count()
        
        post_growth_rate = 0
        if previous_month_posts > 0:
            post_growth_rate = ((current_month_posts - previous_month_posts) / previous_month_posts) * 100
        
        # Engagement metrics
        avg_comments_per_post = 0
        if total_posts > 0:
            avg_comments_per_post = total_comments / total_posts
        
        avg_feedback_per_user = 0
        if total_users > 0:
            avg_feedback_per_user = total_feedbacks / total_users
        
        # Top performing posts (by comments)
        try:
            top_posts = Post.objects.annotate(
                comment_count=Count('comments')
            ).order_by('-comment_count')[:10].values(
                'id', 'title', 'user__username', 'comment_count', 'created_at'
            )
        except Exception as e:
            print(f"Erreur avec top_posts: {e}")
            top_posts = []
        
        return Response({
            'status': 'success',
            'data': {
                'overview': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'total_posts': total_posts,
                    'total_comments': total_comments,
                    'total_reports': total_reports,
                    'total_revenue': float(total_revenue),
                    'active_certifications': active_certifications,
                    'active_sponsored_posts': active_sponsored
                },
                'today_stats': {
                    'new_users': new_users_today,
                    'new_posts': posts_today,
                    'new_comments': comments_today,
                    'new_feedbacks': feedbacks_today
                },
                'period_stats': {
                    'week': {
                        'new_users': new_users_week,
                        'new_posts': posts_week,
                        'new_comments': comments_week
                    },
                    'month': {
                        'new_users': new_users_month,
                        'new_posts': posts_month,
                        'new_comments': comments_month
                    }
                },
                'growth_metrics': {
                    'user_growth_rate': round(user_growth_rate, 2),
                    'post_growth_rate': round(post_growth_rate, 2),
                    'avg_comments_per_post': round(avg_comments_per_post, 2),
                    'avg_feedback_per_user': round(avg_feedback_per_user, 2),
                    'avg_rating': round(avg_rating, 2)
                },
                'charts_data': {
                    'daily_registrations': daily_registrations,
                    'monthly_posts': monthly_posts,
                    'report_types': report_types,
                    'top_categories': list(top_categories)
                },
                'top_content': {
                    'top_posts': list(top_posts)
                },
                'reports_summary': {
                    'pending': pending_reports,
                    'resolved': resolved_reports,
                    'total': total_reports
                },
                'financial': {
                    'total_payments': total_payments,
                    'completed_payments': completed_payments,
                    'total_revenue': float(total_revenue),
                    'premium_users': premium_certifications
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erreur détaillée dans get_dashboard_stats: {error_details}")
        
        return Response({
            'status': 'error',
            'message': str(e),
            'details': error_details if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# ==================== USER MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_users_list(request):
    """Get paginated list of users"""
    try:
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        queryset = User.objects.all().select_related('profile')
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)
        
        if date_from:
            queryset = queryset.filter(date_joined__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(date_joined__date__lte=date_to)
        
        # Order by latest
        queryset = queryset.order_by('-date_joined')
        
        # Get paginated data
        paginated_data = get_paginated_data(request, queryset)
        
        # Add additional data
        for user in paginated_data['data']:
            try:
                profile = Profile.objects.get(user_id=user['id'])
                user['profile_info'] = {
                    'bio': profile.bio,
                    'location': profile.location,
                    'followers_count': profile.followers.count(),
                    'is_active': profile.is_active
                }
            except:
                user['profile_info'] = {}
            
            # Add stats
            user['post_count'] = Post.objects.filter(user_id=user['id']).count()
            user['comment_count'] = Comment.objects.filter(user_id=user['id']).count()
            user['report_count'] = Report.objects.filter(reporter_id=user['id']).count()
        
        return Response({
            'status': 'success',
            'data': paginated_data
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_users_analytics(request):
    """Get analytics data for users by time and location"""
    try:
        time_range = request.GET.get('time_range', 'week')
        geo_type = request.GET.get('geo_type', 'country')
        
        # Base queryset
        base_qs = User.objects.all()
        
        # Time-based analytics (user registrations)
        now = timezone.now()
        
        if time_range == 'day':
            trunc_func = TruncDay
            date_filter = now - timedelta(days=7)
            date_format = '%Y-%m-%d'
            period_name = 'Day'
        elif time_range == 'week':
            trunc_func = TruncWeek
            date_filter = now - timedelta(weeks=12)
            date_format = '%Y-W%W'
            period_name = 'Week'
        elif time_range == 'month':
            trunc_func = TruncMonth
            date_filter = now - timedelta(days=365)
            date_format = '%Y-%m'
            period_name = 'Month'
        elif time_range == 'year':
            trunc_func = TruncYear
            date_filter = now - timedelta(days=365*5)
            date_format = '%Y'
            period_name = 'Year'
        else:
            trunc_func = TruncDay
            date_filter = now - timedelta(days=30)
            date_format = '%Y-%m-%d'
            period_name = 'Day'
        
        # User registrations over time
        time_analytics = base_qs.filter(
            date_joined__gte=date_filter
        ).annotate(
            period=trunc_func('date_joined')
        ).values('period').annotate(
            total_users=Count('id'),
            active_users=Count('id', filter=Q(is_active=True)),
            inactive_users=Count('id', filter=Q(is_active=False)),
            staff_users=Count('id', filter=Q(is_staff=True)),
            superuser_users=Count('id', filter=Q(is_superuser=True))
        ).order_by('period')
        
        # Format period for display
        time_analytics_list = []
        for item in time_analytics:
            time_analytics_list.append({
                'period': item['period'].strftime(date_format),
                'total': item['total_users'],
                'active': item['active_users'],
                'inactive': item['inactive_users'],
                'staff': item['staff_users'],
                'superuser': item['superuser_users']
            })
        
        # User status distribution
        total_users = base_qs.count()
        active_users = base_qs.filter(is_active=True).count()
        inactive_users = base_qs.filter(is_active=False).count()
        staff_users = base_qs.filter(is_staff=True).count()
        superuser_users = base_qs.filter(is_superuser=True).count()
        
        status_data = [
            {'name': 'Active', 'value': active_users},
            {'name': 'Inactive', 'value': inactive_users},
            {'name': 'Staff', 'value': staff_users},
            {'name': 'Superuser', 'value': superuser_users}
        ]
        
        # Users by join month (year overview)
        users_by_month = base_qs.filter(
            date_joined__gte=now - timedelta(days=365)
        ).annotate(
            month=TruncMonth('date_joined')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        users_by_month_list = []
        for item in users_by_month:
            users_by_month_list.append({
                'month': item['month'].strftime('%Y-%m'),
                'count': item['count']
            })
        
        # Geographic analytics (based on user's profile location)
        if geo_type == 'country':
            geo_analytics = Profile.objects.filter(
                user__isnull=False,
                country__isnull=False
            ).exclude(
                country=''
            ).values('country').annotate(
                value=Count('user', distinct=True)
            ).order_by('-value')
            
            geo_analytics_list = []
            for g in geo_analytics:
                geo_analytics_list.append({
                    'name': g['country'],
                    'value': g['value']
                })
        else:  # city
            geo_analytics = Profile.objects.filter(
                user__isnull=False,
                city__isnull=False
            ).exclude(
                city=''
            ).values('city').annotate(
                value=Count('user', distinct=True)
            ).order_by('-value')
            
            geo_analytics_list = []
            for g in geo_analytics:
                geo_analytics_list.append({
                    'name': g['city'],
                    'value': g['value']
                })
        
        # User activity analytics
        
        # Users with posts
        users_with_posts = User.objects.filter(
            id__in=Post.objects.values('user_id').distinct()
        ).count()
        
        # Users with comments
        users_with_comments = User.objects.filter(
            id__in=Comment.objects.values('user_id').distinct()
        ).count()
        
        # Users with reports made (as reporter)
        users_with_reports = User.objects.filter(
            id__in=Report.objects.values('reporter_id').distinct()
        ).count()
        
        # Users with reports received (their content was reported)
        # CORRECTION: Collecter tous les IDs sans union()
        user_ids_with_reports_received = set()
        
        # Posts
        post_user_ids = Report.objects.filter(
            post__isnull=False,
            post__user__isnull=False
        ).values_list('post__user_id', flat=True).distinct()
        user_ids_with_reports_received.update(post_user_ids)
        
        # Comments
        comment_user_ids = Report.objects.filter(
            comment__isnull=False,
            comment__user__isnull=False
        ).values_list('comment__user_id', flat=True).distinct()
        user_ids_with_reports_received.update(comment_user_ids)
        
        # Messages
        message_user_ids = Report.objects.filter(
            message__isnull=False,
            message__sender__isnull=False
        ).values_list('message__sender_id', flat=True).distinct()
        user_ids_with_reports_received.update(message_user_ids)
        
        # Conversations
        conversation_reports = Report.objects.filter(
            conversation__isnull=False
        ).select_related('conversation')
        
        for report in conversation_reports:
            if report.conversation:
                participants = report.conversation.participants.all()
                for participant in participants:
                    user_ids_with_reports_received.add(participant.id)
        
        # Profiles
        profile_user_ids = Report.objects.filter(
            profile__isnull=False,
            profile__user__isnull=False
        ).values_list('profile__user_id', flat=True).distinct()
        user_ids_with_reports_received.update(profile_user_ids)
        
        # Feedback
        feedback_user_ids = Report.objects.filter(
            feedback__isnull=False,
            feedback__user__isnull=False
        ).values_list('feedback__user_id', flat=True).distinct()
        user_ids_with_reports_received.update(feedback_user_ids)
        
        # Enlever les None
        user_ids_with_reports_received.discard(None)
        
        users_with_reports_received = len(user_ids_with_reports_received)
        
        activity_data = [
            {'name': 'Have Posts', 'value': users_with_posts},
            {'name': 'Have Comments', 'value': users_with_comments},
            {'name': 'Made Reports', 'value': users_with_reports},
            {'name': 'Received Reports', 'value': users_with_reports_received}
        ]
        
        # Top users by posts
        top_users_by_posts = User.objects.annotate(
            post_count=Count('post')
        ).order_by('-post_count').exclude(post_count=0)[:5]
        
        top_users_by_posts_list = []
        for user in top_users_by_posts:
            top_users_by_posts_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'count': user.post_count
            })
        
        # Top users by comments
        top_users_by_comments = User.objects.annotate(
            comment_count=Count('comment')
        ).order_by('-comment_count').exclude(comment_count=0)[:5]
        
        top_users_by_comments_list = []
        for user in top_users_by_comments:
            top_users_by_comments_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'count': user.comment_count
            })
        
        # Top users by reports made
        top_users_by_reports = User.objects.annotate(
            report_count=Count('reports_made')
        ).order_by('-report_count').exclude(report_count=0)[:5]
        
        top_users_by_reports_list = []
        for user in top_users_by_reports:
            top_users_by_reports_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'count': user.report_count
            })
        
        # Top users by reports received
        # CORRECTION: Utiliser les IDs collectés
        report_counts = {}
        
        # Posts
        post_reports = Report.objects.filter(
            post__isnull=False,
            post__user__isnull=False
        ).values('post__user_id').annotate(
            count=Count('id')
        )
        
        for item in post_reports:
            user_id = item['post__user_id']
            if user_id:
                report_counts[user_id] = report_counts.get(user_id, 0) + item['count']
        
        # Comments
        comment_reports = Report.objects.filter(
            comment__isnull=False,
            comment__user__isnull=False
        ).values('comment__user_id').annotate(
            count=Count('id')
        )
        
        for item in comment_reports:
            user_id = item['comment__user_id']
            if user_id:
                report_counts[user_id] = report_counts.get(user_id, 0) + item['count']
        
        # Messages
        message_reports = Report.objects.filter(
            message__isnull=False,
            message__sender__isnull=False
        ).values('message__sender_id').annotate(
            count=Count('id')
        )
        
        for item in message_reports:
            user_id = item['message__sender_id']
            if user_id:
                report_counts[user_id] = report_counts.get(user_id, 0) + item['count']
        
        # Conversations
        conversation_reports = Report.objects.filter(
            conversation__isnull=False
        ).select_related('conversation')
        
        for report in conversation_reports:
            if report.conversation:
                participants = report.conversation.participants.all()
                for participant in participants:
                    report_counts[participant.id] = report_counts.get(participant.id, 0) + 1
        
        # Profiles
        profile_reports = Report.objects.filter(
            profile__isnull=False,
            profile__user__isnull=False
        ).values('profile__user_id').annotate(
            count=Count('id')
        )
        
        for item in profile_reports:
            user_id = item['profile__user_id']
            if user_id:
                report_counts[user_id] = report_counts.get(user_id, 0) + item['count']
        
        # Feedback
        feedback_reports = Report.objects.filter(
            feedback__isnull=False,
            feedback__user__isnull=False
        ).values('feedback__user_id').annotate(
            count=Count('id')
        )
        
        for item in feedback_reports:
            user_id = item['feedback__user_id']
            if user_id:
                report_counts[user_id] = report_counts.get(user_id, 0) + item['count']
        
        # Trier et prendre les top 5
        sorted_users = sorted(report_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        top_users_by_reports_received_list = []
        for user_id, count in sorted_users:
            try:
                user = User.objects.get(id=user_id)
                top_users_by_reports_received_list.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'count': count
                })
            except User.DoesNotExist:
                continue
        
        # User trends
        last_month = now - timedelta(days=30)
        previous_month = now - timedelta(days=60)
        
        users_last_month = base_qs.filter(date_joined__gte=last_month).count()
        users_previous_month = base_qs.filter(
            date_joined__gte=previous_month,
            date_joined__lt=last_month
        ).count()
        
        trend_percentage = 0
        trend_direction = 'stable'
        
        if users_previous_month > 0:
            trend_percentage = round(
                ((users_last_month - users_previous_month) / users_previous_month) * 100,
                1
            )
            trend_direction = 'up' if trend_percentage > 0 else 'down' if trend_percentage < 0 else 'stable'
        elif users_last_month > 0:
            trend_percentage = 100
            trend_direction = 'up'
        
        # Most active day for registrations
        most_active_day = base_qs.values('date_joined__date').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        # Top country and city
        top_country = None
        if geo_analytics_list:
            top_country = geo_analytics_list[0]['name']
        
        top_city = None
        if geo_type == 'city' and geo_analytics_list:
            top_city = geo_analytics_list[0]['name']
        else:
            top_city_data = Profile.objects.filter(
                user__isnull=False,
                city__isnull=False
            ).exclude(city='').values('city').annotate(
                count=Count('user', distinct=True)
            ).order_by('-count').first()
            
            if top_city_data:
                top_city = top_city_data['city']
        
        # User retention (users who joined in last 30 days and are still active)
        joined_last_30_days = base_qs.filter(date_joined__gte=last_month)
        active_joined_last_30_days = joined_last_30_days.filter(is_active=True).count()
        retention_rate = 0
        if joined_last_30_days.count() > 0:
            retention_rate = round((active_joined_last_30_days / joined_last_30_days.count()) * 100, 1)
        
        summary = {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'staff_users': staff_users,
            'superuser_users': superuser_users,
            'users_with_posts': users_with_posts,
            'users_with_comments': users_with_comments,
            'users_with_reports': users_with_reports,
            'users_with_reports_received': users_with_reports_received,
            'activity_rate': round((active_users / total_users) * 100, 1) if total_users > 0 else 0,
            'retention_rate': retention_rate,
            'trend': {
                'percentage': trend_percentage,
                'direction': trend_direction,
                'last_month': users_last_month,
                'previous_month': users_previous_month
            },
            'most_active_date': most_active_day['date_joined__date'].strftime('%Y-%m-%d') if most_active_day and most_active_day['date_joined__date'] else None,
            'top_country': top_country,
            'top_city': top_city,
            'period': period_name,
            'avg_users_per_day': round(total_users / 30, 1) if total_users > 0 else 0
        }
        
        return Response({
            'status': 'success',
            'data': {
                'time_analytics': time_analytics_list,
                'status_analytics': status_data,
                'monthly_analytics': users_by_month_list,
                'activity_analytics': activity_data,
                'geo_analytics': geo_analytics_list,
                'top_users': {
                    'by_posts': top_users_by_posts_list,
                    'by_comments': top_users_by_comments_list,
                    'by_reports': top_users_by_reports_list,
                    'by_reports_received': top_users_by_reports_received_list
                },
                'summary': summary
            }
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_users_analytics: {error_details}")
        
        return Response({
            'status': 'error',
            'message': 'Failed to fetch users analytics',
            'error': str(e)
        }, status=500) 

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_user_detail(request, user_id):
    """Get detailed user information"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Get user profile
        try:
            profile = Profile.objects.get(user=user)
            profile_data = {
                'bio': profile.bio,
                'location': profile.location,
                'website': profile.website,
                'phone': profile.phone,
                'image': profile.image.url if profile.image else None,
                'followers_count': profile.followers.count(),
                'following_count': profile.following.count(),
                'is_active': profile.is_active,
                'created_at': profile.created_at,
                'category': str(profile.category) if profile.category else None
            }
        except Profile.DoesNotExist:
            profile_data = {}
        
        # Get user statistics
        user_stats = {
            'total_posts': Post.objects.filter(user=user).count(),
            'total_comments': Comment.objects.filter(user=user).count(),
            'total_feedbacks_given': Feedback.objects.filter(user=user).count(),
            'total_feedbacks_received': Feedback.objects.filter(professional=user).count(),
            'total_reports_made': Report.objects.filter(reporter=user).count(),
            'total_reports_against': Report.objects.filter(
                Q(message__sender=user) |
                Q(post__user=user) |
                Q(comment__user=user) |
                Q(profile__user=user) |
                Q(feedback__user=user)
            ).count(),
            'certifications': list(Certification.objects.filter(
                profile=profile
            ).values(
                'certification_type__name',
                'status',
                'created_at',
                'expires_at'
            )) if profile_data else [],
            'payments': list(Payment.objects.filter(user=user).values(
                'id',
                'payment_type',
                'amount',
                'status',
                'created_at'
            ))
        }
        
        # Get recent activity
        recent_posts = Post.objects.filter(user=user).order_by('-created_at')[:5].values(
            'id', 'title', 'created_at', 'category__name'
        )
        
        recent_comments = Comment.objects.filter(user=user).order_by('-created_at')[:5].values(
            'id', 'content', 'post__title', 'created_at'
        )
        
        return Response({
            'status': 'success',
            'data': {
                'user_info': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined,
                    'last_login': user.last_login
                },
                'profile': profile_data,
                'statistics': user_stats,
                'recent_activity': {
                    'posts': list(recent_posts),
                    'comments': list(recent_comments)
                }
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_user_status(request, user_id):
    """Update user active status"""
    try:
        user = get_object_or_404(User, id=user_id)
        action = request.data.get('action', '')
        
        if action == 'activate':
            user.is_active = True
            user.save()
            message = 'User activated successfully'
        elif action == 'deactivate':
            user.is_active = False
            user.save()
            message = 'User deactivated successfully'
        elif action == 'promote_to_staff':
            user.is_staff = True
            user.save()
            message = 'User promoted to staff'
        elif action == 'demote_from_staff':
            user.is_staff = False
            user.save()
            message = 'User demoted from staff'
        else:
            return Response({
                'status': 'error',
                'message': 'Invalid action'
            }, status=400)
        
        return Response({
            'status': 'success',
            'message': message
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

# ==================== ADMIN COMMENT MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_admin_comments_list(request):
    """Get paginated list of all comments for admin dashboard"""
    try:
        # Get filter parameters
        search = request.GET.get('search', '')
        post_id = request.GET.get('post_id', '')
        user_id = request.GET.get('user_id', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        is_hidden = request.GET.get('is_hidden', '')
        is_spam = request.GET.get('is_spam', '')
        has_media = request.GET.get('has_media', '')
        ordering = request.GET.get('ordering', '-created_at')
        
        # Base queryset with optimizations
        queryset = Comment.objects.all().select_related(
            'user',
            'post',
            'parent_comment'
        ).prefetch_related(
            'likes',
            'mentions',
            'comment_replies'
        ).annotate(
            replies_count=Count('comment_replies', distinct=True),
            likes_count_annotated=Count('likes', distinct=True)
        )
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(post__title__icontains=search)
            )
        
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        if is_hidden.lower() == 'true':
            queryset = queryset.filter(is_hidden=True)
        elif is_hidden.lower() == 'false':
            queryset = queryset.filter(is_hidden=False)
        
        if is_spam.lower() == 'true':
            queryset = queryset.filter(is_spam=True)
        elif is_spam.lower() == 'false':
            queryset = queryset.filter(is_spam=False)
        
        if has_media.lower() == 'true':
            queryset = queryset.filter(
                Q(image__isnull=False) | 
                Q(video__isnull=False) | 
                Q(file__isnull=False)
            )
        elif has_media.lower() == 'false':
            queryset = queryset.filter(
                image__isnull=True,
                video__isnull=True,
                file__isnull=True
            )
        
        # Apply ordering
        if ordering == 'created_at':
            queryset = queryset.order_by('created_at')
        elif ordering == '-created_at':
            queryset = queryset.order_by('-created_at')
        elif ordering == 'likes_count':
            queryset = queryset.order_by('likes_count_annotated')
        elif ordering == '-likes_count':
            queryset = queryset.order_by('-likes_count_annotated')
        elif ordering == 'replies_count':
            queryset = queryset.order_by('replies_count')
        elif ordering == '-replies_count':
            queryset = queryset.order_by('-replies_count')
        elif ordering == 'user__username':
            queryset = queryset.order_by('user__username')
        elif ordering == '-user__username':
            queryset = queryset.order_by('-user__username')
        else:
            queryset = queryset.order_by('-created_at')
        
        # Get paginated data
        paginator = CommentPagination()
        paginated_comments = paginator.paginate_queryset(queryset, request)
        
        # Serialize data
        serializer = CommentAdminSerializer(paginated_comments, many=True)
        data = serializer.data
        
        # Add additional computed fields
        for comment_data, comment_obj in zip(data, paginated_comments):
            # Total comments count (including all replies)
            comment_data['total_comments_count'] = comment_obj.get_total_comments_count_optimized()
            
            # Check if user has liked (if user is authenticated)
            if request.user.is_authenticated:
                comment_data['user_has_liked'] = comment_obj.user_has_liked(request.user)
            else:
                comment_data['user_has_liked'] = False
            
            # Add post title
            comment_data['user_id'] = Comment.objects.filter(id=comment_obj.id).values_list('user_id', flat=True).first()
            comment_data['post_title'] = comment_obj.post.title if comment_obj.post else None
            comment_data['post_id'] = Comment.objects.filter(id=comment_obj.id).values_list('post_id', flat=True).first()
            # Add parent comment info
            if comment_obj.parent_comment:
                comment_data['parent_comment'] = {
                    'id': comment_obj.parent_comment.id,
                    'content': comment_obj.parent_comment.content[:100],
                    'user__username': comment_obj.parent_comment.user.username
                }
            
            # Format media URLs
            if comment_obj.image:
                comment_data['image_url'] = comment_obj.image.url
            if comment_obj.video:
                comment_data['video_url'] = comment_obj.video.url
            if comment_obj.file:
                comment_data['file_url'] = comment_obj.file.url
        
        return Response({
            'status': 'success',
            'data': data,
            'pagination': {
                'page': paginator.page.number,
                'page_size': paginator.page_size,
                'total_count': paginator.page.paginator.count,
                'total_pages': paginator.page.paginator.num_pages
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# views.py - À AJOUTER DANS VOTRE BACKEND
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_comments_analytics(request):
    """Get comments analytics data with geographic distribution"""
    try:
        # Récupérer les paramètres
        range_type = request.GET.get('range', 'month')  # day, week, month, year
        
        # Définir la période en fonction du range_type
        now = timezone.now()
        if range_type == 'day':
            start_date = now - timedelta(days=1)
            trunc = 'hour'
        elif range_type == 'week':
            start_date = now - timedelta(days=7)
            trunc = 'day'
        elif range_type == 'month':
            start_date = now - timedelta(days=30)
            trunc = 'day'
        elif range_type == 'year':
            start_date = now - timedelta(days=365)
            trunc = 'month'
        else:
            start_date = now - timedelta(days=30)
            trunc = 'day'
        
        # 1. DONNÉES TEMPORELLES
        # Utiliser TruncDate/TruncHour pour grouper par période
        from django.db.models.functions import TruncDate, TruncHour, TruncMonth
        from django.db.models import Count
        
        time_data = Comment.objects.filter(
            created_at__gte=start_date
        ).annotate(
            period=TruncHour('created_at') if trunc == 'hour' else 
                   TruncDate('created_at') if trunc == 'day' else 
                   TruncMonth('created_at')
        ).values('period').annotate(
            comments=Count('id'),
            users=Count('user', distinct=True)
        ).order_by('period')
        
        # 2. DONNÉES PAR PAYS (via Profile)
        country_data = Profile.objects.filter(
            user__user_comments__created_at__gte=start_date
        ).values('country').annotate(
            comments=Count('user__user_comments'),
            users=Count('user', distinct=True)
        ).order_by('-comments')[:20]
        
        # 3. DONNÉES PAR VILLE (via Profile)
        city_data = Profile.objects.filter(
            user__user_comments__created_at__gte=start_date,
            city__isnull=False
        ).exclude(
            city=''
        ).values('city', 'country').annotate(
            comments=Count('user__user_comments'),
            users=Count('user', distinct=True)
        ).order_by('-comments')[:20]
        
        # 4. CALCULER LE TAUX DE CROISSANCE
        previous_period_start = start_date - (now - start_date)
        previous_count = Comment.objects.filter(
            created_at__range=[previous_period_start, start_date]
        ).count()
        current_count = Comment.objects.filter(created_at__gte=start_date).count()
        
        growth_rate = 0
        if previous_count > 0:
            growth_rate = round(((current_count - previous_count) / previous_count) * 100, 1)
        
        # 5. SOMMAIRE
        summary = {
            'total_comments': current_count,
            'avg_per_day': round(current_count / 30, 1) if range_type == 'month' else 0,
            'peak_day': time_data.order_by('-comments').first()['period'] if time_data else None,
            'peak_day_count': time_data.order_by('-comments').first()['comments'] if time_data else 0,
            'most_active_country': country_data[0]['country'] if country_data else None,
            'most_active_city': city_data[0]['city'] if city_data else None,
            'growth_rate': growth_rate
        }
        
        return Response({
            'status': 'success',
            'data': {
                'timeData': time_data,
                'countryData': country_data,
                'cityData': city_data,
                'summary': summary
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_admin_comment_detail(request, comment_id):
    """Get detailed information about a specific comment for admin"""
    try:
        # Get comment with all related data
        comment = get_object_or_404(
            Comment.objects.select_related(
                'user',
                'post',
                'post__user',
                'post__category',
                'parent_comment',
                'parent_comment__user'
            ).prefetch_related(
                'likes',
                'mentions',
                Prefetch(
                    'comment_replies',
                    queryset=Comment.objects.select_related('user').order_by('created_at')
                )
            ),
            id=comment_id
        )
        
        # Serialize
        serializer = CommentDetailAdminSerializer(comment)
        data = serializer.data
        
        # Add computed fields
        data['total_comments_count'] = comment.get_total_comments_count_optimized()
        data['replies'] = []
        
        # Add replies data
        for reply in comment.comment_replies.all():
            reply_data = {
                'id': reply.id,
                'content': reply.content,
                'created_at': reply.created_at,
                'user__username': reply.user.username,
                'user__id': reply.user.id,
                'likes_count': reply.likes_count,
                'is_edited': reply.is_edited,
                'is_hidden': reply.is_hidden,
                'has_media': bool(reply.image or reply.video or reply.file)
            }
            if reply.image:
                reply_data['image_url'] = reply.image.url
            if reply.video:
                reply_data['video_url'] = reply.video.url
            if reply.file:
                reply_data['file_url'] = reply.file.url
            data['replies'].append(reply_data)
        
        # Post information
        data['post'] = {
            'id': comment.post.id,
            'title': comment.post.title,
            'content': comment.post.content[:200],
            'user__username': comment.post.user.username,
            'category__name': comment.post.category.name if comment.post.category else None,
            'created_at': comment.post.created_at
        }
        
        # User information
        data['user'] = {
            'id': comment.user.id,
            'username': comment.user.username,
            'email': comment.user.email,
            'is_active': comment.user.is_active,
            'is_staff': comment.user.is_staff,
            'date_joined': comment.user.date_joined
        }
        
        # Parent comment information
        if comment.parent_comment:
            data['parent_comment'] = {
                'id': comment.parent_comment.id,
                'content': comment.parent_comment.content[:200],
                'user__username': comment.parent_comment.user.username,
                'created_at': comment.parent_comment.created_at
            }
        
        # Media URLs
        if comment.image:
            data['image_url'] = comment.image.url
        if comment.video:
            data['video_url'] = comment.video.url
        if comment.file:
            data['file_url'] = comment.file.url
        
        # Path information
        data['path_hierarchy'] = comment.path.split('.') if comment.path else []
        data['depth'] = comment.depth
        data['is_root'] = comment.is_root
        data['has_replies'] = comment.has_replies
        
        return Response({
            'status': 'success',
            'data': data
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_admin_comment(request, comment_id):
    """Delete a comment (admin only - hard delete)"""
    try:
        comment = get_object_or_404(Comment, id=comment_id)
        
        # Store info for response
        comment_info = {
            'id': comment.id,
            'user_id': comment.user.id,
            'user_username': comment.user.username,
            'post_id': comment.post.id,
            'post_title': comment.post.title,
            'content_preview': comment.content[:100] if comment.content else '',
            'has_replies': comment.comment_replies.exists()
        }
        
        # Hard delete (admin only)
        comment.delete()
        
        return Response({
            'status': 'success',
            'message': 'Comment deleted successfully',
            'data': comment_info
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_delete_admin_comments(request):
    """Delete multiple comments at once (admin only)"""
    try:
        comment_ids = request.data.get('comment_ids', [])
        
        if not comment_ids:
            return Response({
                'status': 'error',
                'message': 'No comment IDs provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get comments with their info before deletion
        comments = Comment.objects.filter(id__in=comment_ids)
        deleted_count = comments.count()
        
        # Store info for response
        deleted_comments = []
        for comment in comments:
            deleted_comments.append({
                'id': comment.id,
                'user_id': comment.user.id,
                'post_id': comment.post.id,
                'content_preview': comment.content[:50] if comment.content else ''
            })
        
        # Hard delete
        comments.delete()
        
        return Response({
            'status': 'success',
            'message': f'{deleted_count} comments deleted successfully',
            'data': {
                'deleted_count': deleted_count,
                'deleted_comments': deleted_comments
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def toggle_hide_admin_comment(request, comment_id):
    """Toggle hide/unhide a comment (admin only)"""
    try:
        comment = get_object_or_404(Comment, id=comment_id)
        
        # Toggle is_hidden
        comment.is_hidden = not comment.is_hidden
        comment.save()
        
        return Response({
            'status': 'success',
            'message': f'Comment {"hidden" if comment.is_hidden else "unhidden"} successfully',
            'data': {
                'id': comment.id,
                'is_hidden': comment.is_hidden,
                'content_preview': comment.content[:100] if comment.content else ''
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def toggle_spam_admin_comment(request, comment_id):
    """Toggle spam/not spam a comment (admin only)"""
    try:
        comment = get_object_or_404(Comment, id=comment_id)
        
        # Toggle is_spam
        comment.is_spam = not comment.is_spam
        
        # If marking as spam, also hide it
        if comment.is_spam:
            comment.is_hidden = True
        
        comment.save()
        
        return Response({
            'status': 'success',
            'message': f'Comment marked as {"spam" if comment.is_spam else "not spam"}',
            'data': {
                'id': comment.id,
                'is_spam': comment.is_spam,
                'is_hidden': comment.is_hidden
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def toggle_pin_admin_comment(request, comment_id):
    """Toggle pin/unpin a comment (admin only)"""
    try:
        comment = get_object_or_404(Comment, id=comment_id)
        
        # Toggle is_pinned
        comment.is_pinned = not comment.is_pinned
        comment.save()
        
        return Response({
            'status': 'success',
            'message': f'Comment {"pinned" if comment.is_pinned else "unpinned"} successfully',
            'data': {
                'id': comment.id,
                'is_pinned': comment.is_pinned
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_admin_comments_stats(request):
    """Get statistics about comments for admin dashboard"""
    try:
        # Base queryset
        all_comments = Comment.objects.all()
        
        # Statistics
        total_comments = all_comments.count()
        total_replies = Comment.objects.filter(parent_comment__isnull=False).count()
        total_root_comments = Comment.objects.filter(parent_comment__isnull=True).count()
        
        # Hidden and spam
        hidden_comments = all_comments.filter(is_hidden=True).count()
        spam_comments = all_comments.filter(is_spam=True).count()
        pinned_comments = all_comments.filter(is_pinned=True).count()
        
        # Media
        comments_with_images = all_comments.filter(image__isnull=False).count()
        comments_with_videos = all_comments.filter(video__isnull=False).count()
        comments_with_files = all_comments.filter(file__isnull=False).count()
        
        # Today's comments
        today = timezone.now().date()
        comments_today = all_comments.filter(created_at__date=today).count()
        
        # Top users by comments
        top_users = all_comments.values(
            'user__id', 'user__username'
        ).annotate(
            comment_count=Count('id')
        ).order_by('-comment_count')[:10]
        
        # Top posts by comments
        top_posts = all_comments.values(
            'post__id', 'post__title'
        ).annotate(
            comment_count=Count('id')
        ).order_by('-comment_count')[:10]
        
        return Response({
            'status': 'success',
            'data': {
                'total': {
                    'comments': total_comments,
                    'root_comments': total_root_comments,
                    'replies': total_replies
                },
                'status': {
                    'hidden': hidden_comments,
                    'spam': spam_comments,
                    'pinned': pinned_comments
                },
                'media': {
                    'images': comments_with_images,
                    'videos': comments_with_videos,
                    'files': comments_with_files
                },
                'today': comments_today,
                'top_users': top_users,
                'top_posts': top_posts
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_admin_comment_replies(request, comment_id):
    """Get all replies of a specific comment for admin"""
    try:
        comment = get_object_or_404(Comment, id=comment_id)
        
        # Get all replies (recursive)
        replies = comment.comment_replies.all().select_related(
            'user'
        ).prefetch_related(
            'likes'
        ).annotate(
            likes_count_annotated=Count('likes', distinct=True)
        ).order_by('created_at')
        
        # Serialize
        data = []
        for reply in replies:
            reply_data = {
                'id': reply.id,
                'content': reply.content,
                'created_at': reply.created_at,
                'updated_at': reply.updated_at,
                'user': {
                    'id': reply.user.id,
                    'username': reply.user.username
                },
                'likes_count': reply.likes_count,
                'is_edited': reply.is_edited,
                'is_hidden': reply.is_hidden,
                'is_spam': reply.is_spam,
                'depth': reply.depth,
                'path': reply.path,
                'has_media': bool(reply.image or reply.video or reply.file)
            }
            
            if reply.image:
                reply_data['image_url'] = reply.image.url
            if reply.video:
                reply_data['video_url'] = reply.video.url
            if reply.file:
                reply_data['file_url'] = reply.file.url
                
            data.append(reply_data)
        
        return Response({
            'status': 'success',
            'data': data,
            'total_count': len(data)
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== POSTS MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_posts_list(request):
    """Get paginated list of posts"""
    try:
        search = request.GET.get('search', '')
        category_id = request.GET.get('category_id', '')
        user_id = request.GET.get('user_id', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        queryset = Post.objects.all().select_related('user', 'category')
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        # Order by latest
        queryset = queryset.order_by('-created_at')
        
        # Get paginated data
        paginated_data = get_paginated_data(request, queryset)
        
        # Add additional data
        for post in paginated_data['data']:
            post['comment_count'] = Comment.objects.filter(post_id=post['id']).count()
            post['like_count'] = UserInteraction.objects.filter(
                post_id=post['id'],
                interaction_type='like'
            ).count()
            post['all_comment']=Comment.objects.filter(post_id=post['id']).values('id','content','created_at','user__username','image','file','video')
            post['category_name'] = Post.objects.get(id=post['id']).category.name if post['category_id'] else None
            post['user_id'] = Post.objects.get(id=post['id']).user_id
            post['user_username']= Post.objects.get(id=post['id']).user.username
            post['view_count'] = PostView.objects.filter(post_id=post['id']).count()
            profile = Profile.objects.filter(user__id=Post.objects.get(id=post['id']).user_id).first()
            post['profile_id']= profile.id if profile else None
            post['image_profile'] = profile.image.url if profile.image else None
# Check if sponsored
            try:
                sponsored = SponsoredPost.objects.get(original_post_id=post['id'])
                post['is_sponsored'] = True
                post['is_sponsored_count'] = SponsoredPost.objects.filter(original_post_id=post['id']).count()
                post['sponsored_info'] = {
                    'campaign_id': sponsored.campaign_id,
                    'boost_end': sponsored.boost_end,
                    'is_active': sponsored.is_active()
                }
            except:
                post['is_sponsored'] = False
        
        return Response({
            'status': 'success',
            'data': paginated_data
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


# views.py - Add this new view
from django.db.models import Count, Q
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_posts_analytics(request):
    """Get analytics data for posts by time and location"""
    try:
        time_range = request.GET.get('time_range', 'week')
        geo_type = request.GET.get('geo_type', 'country')
        
        # Base queryset
        base_qs = Post.objects.all()
        
        # Time-based analytics
        now = timezone.now()
        
        if time_range == 'day':
            trunc_func = TruncDay
            date_filter = now - timedelta(days=7)
            date_format = '%Y-%m-%d'
        elif time_range == 'week':
            trunc_func = TruncWeek
            date_filter = now - timedelta(weeks=12)
            date_format = '%Y-W%W'
        elif time_range == 'month':
            trunc_func = TruncMonth
            date_filter = now - timedelta(days=365)
            date_format = '%Y-%m'
        elif time_range == 'year':
            trunc_func = TruncYear
            date_filter = now - timedelta(days=365*5)
            date_format = '%Y'
        else:
            trunc_func = TruncDay
            date_filter = now - timedelta(days=30)
            date_format = '%Y-%m-%d'
        
        time_analytics = base_qs.filter(
            created_at__gte=date_filter
        ).annotate(
            period=trunc_func('created_at')
        ).values('period').annotate(
            posts=Count('id')
        ).order_by('period')
        
        # Format period for display
        for item in time_analytics:
            item['period'] = item['period'].strftime(date_format)
        
        # Geographic analytics
        if geo_type == 'country':
            geo_analytics = Profile.objects.filter(
                user__post__isnull=False
            ).values('country').annotate(
                value=Count('user__post', distinct=True)
            ).order_by('-value')
            
            # Clean up null/empty countries
            geo_analytics = [g for g in geo_analytics if g.get('country')]
            
        else:  # city
            geo_analytics = Profile.objects.filter(
                user__post__isnull=False,
                city__isnull=False
            ).exclude(
                city=''
            ).values('city').annotate(
                value=Count('user__post', distinct=True)
            ).order_by('-value')
            
            # Rename city to name for consistency
            for g in geo_analytics:
                g['name'] = g.pop('city')
        
        # Rename country/city to name for chart component
        if geo_type == 'country':
            for g in geo_analytics:
                g['name'] = g.pop('country')
        
        # Summary statistics
        total_posts = base_qs.count()
        total_boosted = SponsoredPost.objects.filter(
            original_post__isnull=False
        ).values('original_post').distinct().count()
        
        # Most active date
        most_active = base_qs.values('created_at__date')\
            .annotate(count=Count('id'))\
            .order_by('-count')\
            .first()
        
        # Top country and city
        top_country = Profile.objects.filter(
            user__post__isnull=False,
            country__isnull=False
        ).exclude(country='')\
        .values('country')\
        .annotate(count=Count('user__post', distinct=True))\
        .order_by('-count')\
        .first()
        
        top_city = Profile.objects.filter(
            user__post__isnull=False,
            city__isnull=False
        ).exclude(city='')\
        .values('city')\
        .annotate(count=Count('user__post', distinct=True))\
        .order_by('-count')\
        .first()
        
        summary = {
            'total_posts': total_posts,
            'total_boosted': total_boosted,
            'avg_per_day': round(total_posts / 30, 1) if total_posts > 0 else 0,
            'most_active_date': most_active['created_at__date'] if most_active else None,
            'top_country': top_country['country'] if top_country else None,
            'top_city': top_city['city'] if top_city else None
        }
        
        return Response({
            'status': 'success',
            'data': {
                'time_analytics': time_analytics,
                'geo_analytics': geo_analytics,
                'summary': summary
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_post_detail(request, post_id):
    """Get detailed post information"""
    try:
        post = get_object_or_404(Post, id=post_id)
        
        # Get post details
        post_data = {
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'user': {
                'id': post.user.id,
                'username': post.user.username,
                'email': post.user.email
            },
            'category': {
                'id': post.category.id,
                'name': post.category.name
            } if post.category else None,
            'average_rating': post.average_rating,
            'total_ratings': post.total_ratings,
            'created_at': post.created_at,
            'updated_at': post.updated_at,
            'image': post.image.url if post.image else None
        }
        
        # Get post statistics
        stats = {
            'comments': Comment.objects.filter(post=post).count(),
            'views': PostView.objects.filter(post=post).count(),
            'likes': UserInteraction.objects.filter(
                post=post,
                interaction_type='like'
            ).count(),
            'shares': UserInteraction.objects.filter(
                post=post,
                interaction_type='share'
            ).count(),
            'saves': UserInteraction.objects.filter(
                post=post,
                interaction_type='save'
            ).count()
        }
        
        # Get recent comments
        recent_comments = Comment.objects.filter(post=post).order_by('-created_at')[:10].values(
            'id', 'user__username', 'content', 'created_at'
        )
        
        # Check if sponsored
        sponsored_info = None
        try:
            sponsored = SponsoredPost.objects.get(original_post=post)
            sponsored_info = {
                'campaign_id': sponsored.campaign_id,
                'campaign_name': sponsored.campaign.name,
                'boost_start': sponsored.boost_start,
                'boost_end': sponsored.boost_end,
                'price': float(sponsored.price),
                'payment_status': sponsored.payment_status,
                'is_active': sponsored.is_active()
            }
        except:
            pass
        
        # Get reports on this post
        post_reports = Report.objects.filter(post=post).values(
            'id', 'report_type', 'reporter__username', 'status', 'created_at'
        )
        
        return Response({
            'status': 'success',
            'data': {
                'post': post_data,
                'statistics': stats,
                'recent_comments': list(recent_comments),
                'sponsored_info': sponsored_info,
                'reports': list(post_reports)
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_post(request, post_id):
    """Delete a post"""
    try:
        post = get_object_or_404(Post, id=post_id)
        post_title = post.title
        
        # Delete associated data
        PostImage.objects.filter(post=post).delete()
        PostFile.objects.filter(post=post).delete()
        PostView.objects.filter(post=post).delete()
        UserInteraction.objects.filter(post=post).delete()
        
        # Delete post
        post.delete()
        
        return Response({
            'status': 'success',
            'message': f'Post "{post_title}" deleted successfully'
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

# ==================== REPORTS MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_reports_list(request):
    """Get paginated list of reports"""
    try:
        # Récupère les paramètres de filtre
        status_filter = request.GET.get('status', '')
        report_type = request.GET.get('report_type', '')
        content_type = request.GET.get('content_type', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 30)
        
        # Base queryset - N'utilise pas select_related avec des champs nullable
        queryset = Report.objects.all().select_related('reporter', 'reviewed_by')
        
        # Applique les filtres
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        # Trie par date de création
        queryset = queryset.order_by('-created_at')
        
        # Pagination
        try:
            page_size = int(page_size)
            page = int(page)
        except (ValueError, TypeError):
            page_size = 30
            page = 1
        
        paginator = Paginator(queryset, page_size)
        
        try:
            reports_page = paginator.page(page)
        except PageNotAnInteger:
            reports_page = paginator.page(1)
        except EmptyPage:
            reports_page = paginator.page(paginator.num_pages)
        
        # Prépare les données de réponse
        reports_data = []
        for report in reports_page.object_list:
            report_dict = {
                'id': report.id,
                'report_type': report.report_type,
                'report_type_display': report.get_report_type_display(),
                'status': report.status,
                'status_display': report.get_status_display(),
                'reason': report.reason,
                'reporter': {
                    'id': report.reporter.id,
                    'username': report.reporter.username,
                    'email': report.reporter.email if hasattr(report.reporter, 'email') else None
                } if report.reporter else None,
                'reviewed_by': {
                    'id': report.reviewed_by.id,
                    'username': report.reviewed_by.username
                } if report.reviewed_by else None,
                'content_type': report.content_type,
                'content_id': report.content_id,
                'created_at': report.created_at,
                'updated_at': report.updated_at,
                'moderator_notes': report.moderator_notes,
                'action_taken': report.action_taken,
                'reviewed_at': report.reviewed_at,
            }
            
            # Ajoute le contenu spécifique en fonction du type
            content_info = {}
            if report.message:
                content_info = {
                    'type': 'message',
                    'id': report.message.id,
                    'content': report.message.content[:200] if report.message.content else '',
                }
            elif report.post:
                content_info = {
                    'type': 'post',
                    'id': report.post.id,
                    'title': report.post.title,
                    'content': report.post.content[:200] if report.post.content else '',
                }
            elif report.comment:
                content_info = {
                    'type': 'comment',
                    'id': report.comment.id,
                    'content': report.comment.content[:200] if report.comment.content else '',
                }
            elif report.profile:
                content_info = {
                    'type': 'profile',
                    'id': report.profile.id,
                    'username': report.profile.user.username if report.profile.user else None,
                    'bio': report.profile.bio[:200] if report.profile.bio else '',
                }
            elif report.feedback:
                content_info = {
                    'type': 'feedback',
                    'id': report.feedback.id,
                    'rating': report.feedback.rating,
                    'comment': report.feedback.comment[:200] if report.feedback.comment else '',
                }
            elif report.conversation:
                content_info = {
                    'type': 'conversation',
                    'id': report.conversation.id,
                }
            
            report_dict['content_info'] = content_info
            
            # Récupère l'auteur du contenu
            content_author = report.get_content_author()
            if content_author:
                report_dict['content_author'] = {
                    'id': content_author.id,
                    'username': content_author.username
                }
            
            # Compte les actions
            try:
                report_dict['action_count'] = ReportAction.objects.filter(report_id=report.id).count()
            except Exception as e:
                report_dict['action_count'] = 0
            
            reports_data.append(report_dict)
        
        return Response({
            'status': 'success',
            'data': {
                'reports': reports_data,
                'pagination': {
                    'current_page': reports_page.number,
                    'total_pages': paginator.num_pages,
                    'total_items': paginator.count,
                    'page_size': page_size,
                    'has_next': reports_page.has_next(),
                    'has_previous': reports_page.has_previous(),
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_reports_list: {error_details}")
        
        return Response({
            'status': 'error',
            'message': 'Failed to fetch reports',
            'error': str(e),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_report_detail(request, report_id):
    """Get detailed report information"""
    try:
        report = get_object_or_404(Report, id=report_id)
        
        # Get content details
        content = report.get_reported_content()
        content_data = None
        if content:
            content_data = {
                'type': report.content_type,
                'object': str(content),
                'author': report.get_content_author().username if report.get_content_author() else None,
                'created_at': content.created_at if hasattr(content, 'created_at') else None
            }
        
        # Get report actions history
        actions = ReportAction.objects.filter(report=report).order_by('-performed_at').values(
            'action_type', 'description', 'moderator__username', 'performed_at'
        )
        
        # Get similar reports
        similar_reports = Report.objects.filter(
            content_type=report.content_type,
            content_id=report.content_id
        ).exclude(id=report.id).values(
            'id', 'report_type', 'reporter__username', 'created_at'
        )
        
        return Response({
            'status': 'success',
            'data': {
                'report': {
                    'id': report.id,
                    'report_type': report.report_type,
                    'report_type_display': report.get_report_type_display(),
                    'status': report.status,
                    'status_display': report.get_status_display(),
                    'reason': report.reason,
                    'reporter': {
                        'id': report.reporter.id,
                        'username': report.reporter.username
                    },
                    'reviewed_by': {
                        'id': report.reviewed_by.id,
                        'username': report.reviewed_by.username
                    } if report.reviewed_by else None,
                    'reviewed_at': report.reviewed_at,
                    'moderator_notes': report.moderator_notes,
                    'action_taken': report.action_taken,
                    'created_at': report.created_at,
                    'updated_at': report.updated_at
                },
                'content': content_data,
                'actions_history': list(actions),
                'similar_reports': list(similar_reports)
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)



@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_report_status(request, report_id):
    """Update report status and take action"""
    try:
        report = get_object_or_404(Report, id=report_id)
        data = request.data
        action = data.get('action', '')
        notes = data.get('notes', '')
        
        print(f"DEBUG: Action: {action}")
        print(f"DEBUG: Notes: {notes}")
        print(f"DEBUG: Full data: {data}")
        
        if action == 'resolve':
            report.status = 'resolved'
            report.reviewed_by = request.user
            report.reviewed_at = timezone.now()
            report.moderator_notes = notes
            
            # Create action record
            ReportAction.objects.create(
                report=report,
                action_type='ignore',
                description='Report resolved by moderator',
                moderator=request.user
            )
            
            report.save()
            message = 'Report resolved successfully'
            
        elif action == 'dismiss':
            report.status = 'dismissed'
            report.reviewed_by = request.user
            report.reviewed_at = timezone.now()
            report.moderator_notes = notes
            
            # Create action record
            ReportAction.objects.create(
                report=report,
                action_type='ignore',
                description='Report dismissed by moderator',
                moderator=request.user
            )
            
            report.save()
            message = 'Report dismissed successfully'
            
        elif action == 'delete_content':
            content = report.get_reported_content()
            
            if content:
                content_type = report.content_type
                content_id = report.content_id
                
                try:
                    content.delete()
                    
                    report.action_taken = f'{content_type} (ID: {content_id}) deleted'
                    report.status = 'resolved'
                    report.reviewed_by = request.user
                    report.reviewed_at = timezone.now()
                    report.moderator_notes = notes
                    
                    # Create action record - utilisez description au lieu de details
                    ReportAction.objects.create(
                        report=report,
                        action_type='delete',
                        description=f'{content_type} deleted by moderator (Content ID: {content_id})',
                        moderator=request.user
                    )
                    
                    report.save()
                    message = f'{content_type} deleted successfully'
                    
                except Exception as delete_error:
                    print(f"Error deleting content: {str(delete_error)}")
                    
                    report.action_taken = f'Failed to delete {content_type}, marked as resolved'
                    report.status = 'resolved'
                    report.reviewed_by = request.user
                    report.reviewed_at = timezone.now()
                    report.moderator_notes = f"{notes}\nDelete error: {str(delete_error)}"
                    report.save()
                    
                    message = f'Error deleting content but report marked as resolved: {str(delete_error)}'
            else:
                report.action_taken = 'Content already deleted'
                report.status = 'resolved'
                report.reviewed_by = request.user
                report.reviewed_at = timezone.now()
                report.moderator_notes = f"{notes}\nContent was already deleted"
                report.save()
                
                message = 'Content was already deleted, report marked as resolved'
                
        elif action == 'warn_user':
            user = report.get_content_author()
            if user:
                # Envoyer un email d'avertissement simple
                admin_email = request.user.email
                user_email = user.email
                
                # Créer le message d'avertissement
                warning_subject = f"Warning: Your content has been reported - Report #{report.id}"
                warning_message = f"""
Hello {user.username},

Your content on our platform has been reported by other users and reviewed by our moderation team.

Report Details:
- Report ID: #{report.id}
- Report Type: {report.get_report_type_display()}
- Content Type: {report.content_type}

Please review our community guidelines and ensure your future contributions comply with our policies.

If you believe this is a mistake, you can contact our support team.

Best regards,
{request.user.username} (Moderation Team)
"""
                
                # Envoyer l'email
                try:
                    send_mail(
                        subject=warning_subject,
                        message=strip_tags(warning_message),
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=[user_email],
                        fail_silently=False,
                    )
                    print(f"📧 Warning email sent to {user_email}")
                except Exception as email_error:
                    print(f"⚠️ Warning email sending failed: {email_error}")
                    # Continuer même si l'email échoue
                
                report.action_taken = f'User {user.username} warned'
                report.status = 'resolved'
                report.reviewed_by = request.user
                report.reviewed_at = timezone.now()
                report.moderator_notes = notes
                
                # Create action record
                ReportAction.objects.create(
                    report=report,
                    action_type='warn',
                    description='User warned for reported content',
                    moderator=request.user,
                    duration_days=0
                )
                
                report.save()
                message = f'User {user.username} warned successfully'
            else:
                return Response({
                    'status': 'error',
                    'message': 'User not found'
                }, status=404)
        
        elif action == 'send_email':
            # Action pour envoyer un email personnalisé
            user = report.get_content_author()
            if user:
                email_message = data.get('email_message', '')
                email_subject = data.get('email_subject', 'Warning regarding reported content')
                
                if email_message:
                    # Préparer l'email complet
                    full_email_subject = f"{email_subject} - Report #{report.id}"
                    
                    full_email_message = f"""
Hello {user.username},

{email_message}

Report Details:
- Report ID: #{report.id}
- Report Type: {report.get_report_type_display()}
- Content Type: {report.content_type}
- Reported by: {report.reporter.username if report.reporter else 'Anonymous'}

If you have any questions or believe this is a mistake, please contact our support team.

Best regards,
{request.user.username} (Moderation Team)
"""
                    
                    # Envoyer l'email réellement
                    try:
                        send_mail(
                            subject=full_email_subject,
                            message=strip_tags(full_email_message),
                            from_email=settings.EMAIL_HOST_USER,
                            recipient_list=[user.email],
                            fail_silently=False,
                        )
                        print(f"📧 Custom email sent to {user.email}")
                        print(f"📧 Subject: {full_email_subject}")
                        email_sent = True
                    except Exception as email_error:
                        print(f"⚠️ Custom email sending failed: {email_error}")
                        traceback.print_exc()
                        # On continue quand même mais on note l'erreur
                        email_sent = False
                        notes = f"{notes}\nEmail sending failed: {str(email_error)}"
                    
                    # Mettre à jour le report
                    if email_sent:
                        report.action_taken = f'Email sent to {user.username}'
                        email_status_note = 'Email sent successfully'
                    else:
                        report.action_taken = f'Email failed to send to {user.username}'
                        email_status_note = 'Email sending failed'
                    
                    report.status = 'resolved'
                    report.reviewed_by = request.user
                    report.reviewed_at = timezone.now()
                    report.moderator_notes = f"{notes}\n{email_status_note}: {email_subject}"
                    
                    # Create action record - utilisez description au lieu de details
                    ReportAction.objects.create(
                        report=report,
                        action_type='email',
                        description=f'Email sent to user: {email_subject}',
                        moderator=request.user
                    )
                    
                    report.save()
                    
                    if email_sent:
                        message = f'Email sent to {user.username} successfully'
                    else:
                        message = f'Email failed to send to {user.username} but report marked as resolved'
                        
                else:
                    return Response({
                        'status': 'error',
                        'message': 'Email message is required'
                    }, status=400)
            else:
                return Response({
                    'status': 'error',
                    'message': 'User not found'
                }, status=404)
        
        elif action == 'delete_report':
            report_id_val = report.id
            
            # Log l'action avant suppression
            ReportAction.objects.create(
                report=report,
                action_type='delete_report',
                description='Report deleted by moderator',
                moderator=request.user
            )
            
            report.delete()
            
            message = 'Report deleted successfully'
            
            return Response({
                'status': 'success',
                'message': message,
                'data': {
                    'deleted_report_id': report_id_val
                }
            })
                
        else:
            return Response({
                'status': 'error',
                'message': f'Invalid action: {action}'
            }, status=400)
        
        return Response({
            'status': 'success',
            'message': message,
            'data': {
                'report_id': report.id,
                'status': report.status,
                'reviewed_by': request.user.username,
                'reviewed_at': report.reviewed_at
            }
        })
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in update_report_status: {error_details}")
        
        return Response({
            'status': 'error',
            'message': str(e),
            'details': error_details
        }, status=500)


# views.py - Ajoutez cette nouvelle vue pour Reports Analytics

# views.py - Version corrigée de get_reports_analytics

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_reports_analytics(request):
    """Get analytics data for reports by time and location"""
    try:
        time_range = request.GET.get('time_range', 'week')
        geo_type = request.GET.get('geo_type', 'country')
        
        # Base queryset
        base_qs = Report.objects.all()
        
        # Time-based analytics
        now = timezone.now()
        
        if time_range == 'day':
            trunc_func = TruncDay
            date_filter = now - timedelta(days=7)
            date_format = '%Y-%m-%d'
            period_name = 'Day'
        elif time_range == 'week':
            trunc_func = TruncWeek
            date_filter = now - timedelta(weeks=12)
            date_format = '%Y-W%W'
            period_name = 'Week'
        elif time_range == 'month':
            trunc_func = TruncMonth
            date_filter = now - timedelta(days=365)
            date_format = '%Y-%m'
            period_name = 'Month'
        elif time_range == 'year':
            trunc_func = TruncYear
            date_filter = now - timedelta(days=365*5)
            date_format = '%Y'
            period_name = 'Year'
        else:
            trunc_func = TruncDay
            date_filter = now - timedelta(days=30)
            date_format = '%Y-%m-%d'
            period_name = 'Day'
        
        # Reports over time
        time_analytics = base_qs.filter(
            created_at__gte=date_filter
        ).annotate(
            period=trunc_func('created_at')
        ).values('period').annotate(
            total_reports=Count('id'),
            pending_reports=Count('id', filter=Q(status='pending')),
            resolved_reports=Count('id', filter=Q(status='resolved')),
            dismissed_reports=Count('id', filter=Q(status='dismissed')),
            under_review_reports=Count('id', filter=Q(status='under_review'))
        ).order_by('period')
        
        # Format period for display
        time_analytics_list = []
        for item in time_analytics:
            time_analytics_list.append({
                'period': item['period'].strftime(date_format),
                'total': item['total_reports'],
                'pending': item['pending_reports'],
                'resolved': item['resolved_reports'],
                'dismissed': item['dismissed_reports'],
                'under_review': item['under_review_reports']
            })
        
        # Reports by type - CORRECTION ICI
        reports_by_type = base_qs.values('report_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        reports_by_type_list = []
        for item in reports_by_type:
            # Utiliser get_report_type_display() ou le dictionnaire ReportType.choices
            report_type_value = item['report_type']
            # Obtenir le libellé affichable
            report_type_display = dict(ReportType.choices).get(report_type_value, report_type_value)
            reports_by_type_list.append({
                'name': report_type_display,
                'value': item['count']
            })
        
        # Reports by status - CORRECTION ICI
        reports_by_status = base_qs.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        reports_by_status_list = []
        for item in reports_by_status:
            status_value = item['status']
            # Obtenir le libellé affichable
            status_display = dict(ReportStatus.choices).get(status_value, status_value)
            reports_by_status_list.append({
                'name': status_display,
                'value': item['count']
            })
        
        # Reports by content type - CORRECTION ICI
        reports_by_content = base_qs.values('content_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        reports_by_content_list = []
        for item in reports_by_content:
            if item['content_type']:  # Filter out null
                content_type_value = item['content_type']
                # Obtenir le libellé affichable
                content_type_display = dict(ContentType.choices).get(content_type_value, content_type_value)
                reports_by_content_list.append({
                    'name': content_type_display,
                    'value': item['count']
                })
        
        # Geographic analytics (based on reporter's location)
        if geo_type == 'country':
            geo_analytics = Profile.objects.filter(
                user__reports_made__isnull=False,
                country__isnull=False
            ).exclude(
                country=''
            ).values('country').annotate(
                value=Count('user__reports_made', distinct=True)
            ).order_by('-value')
            
            geo_analytics_list = []
            for g in geo_analytics:
                geo_analytics_list.append({
                    'name': g['country'],
                    'value': g['value']
                })
        else:  # city
            geo_analytics = Profile.objects.filter(
                user__reports_made__isnull=False,
                city__isnull=False
            ).exclude(
                city=''
            ).values('city').annotate(
                value=Count('user__reports_made', distinct=True)
            ).order_by('-value')
            
            geo_analytics_list = []
            for g in geo_analytics:
                geo_analytics_list.append({
                    'name': g['city'],
                    'value': g['value']
                })
        
        # Summary statistics
        total_reports = base_qs.count()
        pending_reports = base_qs.filter(status='pending').count()
        resolved_reports = base_qs.filter(status='resolved').count()
        dismissed_reports = base_qs.filter(status='dismissed').count()
        under_review_reports = base_qs.filter(status='under_review').count()
        
        # Resolution rate
        resolution_rate = 0
        if total_reports > 0:
            resolved_dismissed = resolved_reports + dismissed_reports
            resolution_rate = round((resolved_dismissed / total_reports) * 100, 1)
        
        # Average resolution time
        resolved_reports_with_time = base_qs.filter(
            status__in=['resolved', 'dismissed'],
            reviewed_at__isnull=False,
            created_at__isnull=False
        )
        
        avg_resolution_time = None
        if resolved_reports_with_time.exists():
            total_seconds = 0
            count = 0
            for report in resolved_reports_with_time:
                if report.reviewed_at and report.created_at:
                    delta = report.reviewed_at - report.created_at
                    total_seconds += delta.total_seconds()
                    count += 1
            
            if count > 0:
                avg_hours = round(total_seconds / count / 3600, 1)
                avg_resolution_time = f"{avg_hours}h"
        
        # Most reported content type
        most_reported_content = None
        if reports_by_content_list:
            most_reported_content = reports_by_content_list[0]['name']
        
        # Most common report reason
        most_common_reason = base_qs.values('reason').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        # Most active reporter
        most_active_reporter = User.objects.filter(
            reports_made__isnull=False
        ).annotate(
            report_count=Count('reports_made')
        ).order_by('-report_count').first()
        
        # Reports trend (increase/decrease)
        last_month = now - timedelta(days=30)
        previous_month = now - timedelta(days=60)
        
        reports_last_month = base_qs.filter(created_at__gte=last_month).count()
        reports_previous_month = base_qs.filter(
            created_at__gte=previous_month,
            created_at__lt=last_month
        ).count()
        
        trend_percentage = 0
        trend_direction = 'stable'
        
        if reports_previous_month > 0:
            trend_percentage = round(
                ((reports_last_month - reports_previous_month) / reports_previous_month) * 100,
                1
            )
            trend_direction = 'up' if trend_percentage > 0 else 'down' if trend_percentage < 0 else 'stable'
        elif reports_last_month > 0:
            trend_percentage = 100
            trend_direction = 'up'
        
        # Most active day
        most_active_day = base_qs.values('created_at__date').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        # Top country and city
        top_country = None
        if geo_analytics_list:
            top_country = geo_analytics_list[0]['name']
        
        top_city = None
        if geo_type == 'city' and geo_analytics_list:
            top_city = geo_analytics_list[0]['name']
        else:
            # Get top city separately
            top_city_data = Profile.objects.filter(
                user__reports_made__isnull=False,
                city__isnull=False
            ).exclude(city='').values('city').annotate(
                count=Count('user__reports_made', distinct=True)
            ).order_by('-count').first()
            
            if top_city_data:
                top_city = top_city_data['city']
        
        summary = {
            'total_reports': total_reports,
            'pending_reports': pending_reports,
            'resolved_reports': resolved_reports,
            'dismissed_reports': dismissed_reports,
            'under_review_reports': under_review_reports,
            'resolution_rate': resolution_rate,
            'avg_resolution_time': avg_resolution_time,
            'most_reported_content': most_reported_content,
            'most_common_reason': most_common_reason['reason'] if most_common_reason else None,
            'most_active_reporter': most_active_reporter.username if most_active_reporter else None,
            'most_active_reporter_count': most_active_reporter.report_count if most_active_reporter else 0,
            'trend': {
                'percentage': trend_percentage,
                'direction': trend_direction,
                'last_month': reports_last_month,
                'previous_month': reports_previous_month
            },
            'most_active_date': most_active_day['created_at__date'].strftime('%Y-%m-%d') if most_active_day and most_active_day['created_at__date'] else None,
            'top_country': top_country,
            'top_city': top_city,
            'period': period_name
        }
        
        return Response({
            'status': 'success',
            'data': {
                'time_analytics': time_analytics_list,
                'type_analytics': reports_by_type_list,
                'status_analytics': reports_by_status_list,
                'content_analytics': reports_by_content_list,
                'geo_analytics': geo_analytics_list,
                'summary': summary
            }
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_reports_analytics: {error_details}")
        
        return Response({
            'status': 'error',
            'message': 'Failed to fetch reports analytics',
            'error': str(e)
        }, status=500)
from django.utils import timezone
from datetime import datetime, timedelta
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_certifications_list(request):
    """Get paginated list of certifications"""
    try:
        # Récupère les paramètres
        type_filter = request.GET.get('type', '')
        status_filter = request.GET.get('status', '')
        user_id = request.GET.get('user_id', '')
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 50)
        
        # Base queryset
        queryset = Certification.objects.all().select_related(
            'profile__user', 'certification_type'
        )
        
        # Applique les filtres
        if type_filter:
            queryset = queryset.filter(certification_type__name=type_filter)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if user_id:
            queryset = queryset.filter(profile__user_id=user_id)
        
        # Trie par date
        queryset = queryset.order_by('-created_at')
        
        # Pagination
        try:
            page_size = int(page_size)
            page = int(page)
        except (ValueError, TypeError):
            page_size = 50
            page = 1
        
        paginator = Paginator(queryset, page_size)
        
        try:
            certs_page = paginator.page(page)
        except PageNotAnInteger:
            certs_page = paginator.page(1)
        except EmptyPage:
            certs_page = paginator.page(paginator.num_pages)
        
        # Prépare les données
        certifications_data = []
        for cert in certs_page.object_list:
            cert_dict = {
                'id': cert.id,
                  
                'user': {
                    'id': cert.profile.user.id if cert.profile and cert.profile.user else None,
                    'username': cert.profile.user.username if cert.profile and cert.profile.user else 'Unknown',
    'profile_image': Profile.objects.filter(user__id=cert.profile.user.id).first().image.url if cert.profile and cert.profile.user and Profile.objects.filter(user_id=cert.profile.user.id).exists() and Profile.objects.filter(user_id=cert.profile.user.id).first().image else None,  
                    'email' : cert.profile.user.email
                 
               
                },
                'certification_type': {
                    'id': cert.certification_type.id if cert.certification_type else None,
                    'name': cert.certification_type.name if cert.certification_type else 'Unknown',
                    'display_name': cert.certification_type.get_name_display() if cert.certification_type and hasattr(cert.certification_type, 'get_name_display') else cert.certification_type.name if cert.certification_type else 'Unknown',
                },
                'status': cert.status,
                'status_display': cert.get_status_display() if hasattr(cert, 'get_status_display') else cert.status,
                'activity_score': cert.activity_score,
                'created_at': cert.created_at,
                'updated_at': cert.updated_at,
                'verified_at': cert.verified_at,
                'verified_by': cert.verified_by.username if cert.verified_by else None,
                'subscription_start': cert.subscription_start,
                'subscription_end': cert.subscription_end,
                'expires_at': cert.expires_at,
                'metadata': cert.metadata,
            }
            
            # Calcule les jours restants
            if cert.expires_at:
                try:
                    # Gère différentes façons dont expires_at peut être stocké
                    if isinstance(cert.expires_at, str):
                        expires_date = datetime.fromisoformat(cert.expires_at.replace('Z', '+00:00'))
                    else:
                        expires_date = cert.expires_at
                    
                    remaining = expires_date - timezone.now()
                    cert_dict['days_remaining'] = max(0, remaining.days)
                    cert_dict['is_expired'] = remaining.days < 0
                except Exception as date_error:
                    cert_dict['days_remaining'] = None
                    cert_dict['date_error'] = str(date_error)
            else:
                cert_dict['days_remaining'] = None
                cert_dict['is_expired'] = False
            
            # Vérifie si premium est actif
            if cert.certification_type and cert.certification_type.name == 'premium':
                if cert.subscription_end:
                    cert_dict['premium_active'] = cert.subscription_end > timezone.now()
                else:
                    cert_dict['premium_active'] = False
            
            certifications_data.append(cert_dict)
        
        return Response({
            'status': 'success',
            'data': {
                'certifications': certifications_data,
                'pagination': {
                    'current_page': certs_page.number,
                    'total_pages': paginator.num_pages,
                    'total_items': paginator.count,
                    'page_size': page_size,
                    'has_next': certs_page.has_next(),
                    'has_previous': certs_page.has_previous(),
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_certifications_list: {error_details}")
        
        return Response({
            'status': 'error',
            'message': 'Failed to fetch certifications',
            'error': str(e),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsAdminUser])
def manage_certification(request, cert_id):
    """Manage certification (grant/revoke/update)"""
    try:
        cert = get_object_or_404(Certification, id=cert_id)
        action = request.data.get('action', '')
        
        if action == 'grant':
            cert.status = 'active'
            cert.verified_by = request.user
            cert.verified_at = timezone.now()
            
            # Set expiration if applicable
            if cert.certification_type.duration_days:
                cert.expires_at = timezone.now() + timedelta(days=cert.certification_type.duration_days)
            
            cert.save()
            message = 'Certification granted successfully'
            
        elif action == 'revoke':
            cert.status = 'revoked'
            cert.save()
            message = 'Certification revoked successfully'
            
        elif action == 'extend':
            days = request.data.get('days', 30)
            if cert.expires_at:
                cert.expires_at += timedelta(days=int(days))
            else:
                cert.expires_at = timezone.now() + timedelta(days=int(days))
            cert.save()
            message = f'Certification extended by {days} days'
            
        elif action == 'update':
            # Update certification data
            status = request.data.get('status', cert.status)
            expires_at = request.data.get('expires_at')
            notes = request.data.get('notes', '')
            
            cert.status = status
            if expires_at:
                cert.expires_at = expires_at
            
            # Update metadata
            if notes:
                metadata = cert.metadata or {}
                metadata['admin_notes'] = notes
                cert.metadata = metadata
            
            cert.save()
            message = 'Certification updated successfully'
            
        else:
            return Response({
                'status': 'error',
                'message': 'Invalid action'
            }, status=400)
        
        return Response({
            'status': 'success',
            'message': message,
            'data': {
                'certification_id': cert.id,
                'status': cert.status,
                'expires_at': cert.expires_at,
                'updated_at': cert.updated_at
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)



@api_view(['GET'])
@permission_classes([IsAdminUser])
def certification_analyst(request):
    """
    Certification analytics view for frontend charts
    Supports filters: month, day, week, year, country, city, state
    Returns data formatted for Chart.js / Plotly
    """
    try:
        # ===========================================
        # 1. FILTER PARAMETERS
        # ===========================================
        time_range = request.GET.get('time_range', 'month')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        country = request.GET.get('country', '')
        city = request.GET.get('city', '')
        state = request.GET.get('state', '')
        certification_type = request.GET.get('certification_type', '')
        status_filter = request.GET.get('status', '')
        group_by = request.GET.get('group_by', 'time')
        chart_type = request.GET.get('chart_type', 'line')
        
        # ===========================================
        # 2. BASE QUERY CONSTRUCTION
        # ===========================================
        queryset = Certification.objects.select_related(
            'profile', 
            'certification_type',
            'profile__user'
        ).all()
        
        # Date filtering
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=start_date_obj)
            except:
                pass
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                end_date_obj = end_date_obj + timedelta(days=1)
                queryset = queryset.filter(created_at__lte=end_date_obj)
            except:
                pass
        
        # Default date range based on time_range
        if not start_date and not end_date:
            now = timezone.now()
            if time_range == 'day':
                start_date_obj = now - timedelta(days=1)
                queryset = queryset.filter(created_at__gte=start_date_obj)
            elif time_range == 'week':
                start_date_obj = now - timedelta(days=7)
                queryset = queryset.filter(created_at__gte=start_date_obj)
            elif time_range == 'month':
                start_date_obj = now - timedelta(days=30)
                queryset = queryset.filter(created_at__gte=start_date_obj)
            elif time_range == 'year':
                start_date_obj = now - timedelta(days=365)
                queryset = queryset.filter(created_at__gte=start_date_obj)
        
        # ===========================================
        # 3. GEOGRAPHIC FILTERS - CORRIGÉ !
        # ===========================================
        if country:
            queryset = queryset.filter(profile__country__icontains=country)
        
        if state:
            queryset = queryset.filter(profile__state__icontains=state)
        
        if city:
            queryset = queryset.filter(profile__city__icontains=city)
        
        # Other filters
        if certification_type:
            queryset = queryset.filter(certification_type__name=certification_type)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # ===========================================
        # 4. SUMMARY STATISTICS
        # ===========================================
        total_certifications = queryset.count()
        
        active_certifications = queryset.filter(status='active').count()
        expired_certifications = queryset.filter(status='expired').count()
        pending_certifications = queryset.filter(status='pending').count()
        revoked_certifications = queryset.filter(status='revoked').count()
        
        # Certifications by type
        certs_by_type = queryset.values(
            'certification_type__name',
            'certification_type__color',
            'certification_type__icon'
        ).annotate(
            count=Count('id'),
            active_count=Count('id', filter=Q(status='active'))
        ).order_by('-count')
        
        # New certifications (last 24 hours)
        last_24h = timezone.now() - timedelta(hours=24)
        new_certifications = queryset.filter(created_at__gte=last_24h).count()
        
        # Top users by certification count
        top_users = queryset.values(
            'profile__user__username',
            'profile__user__id',
            'profile__city',
            'profile__country',
            'profile__state',
            'profile__image'
        ).annotate(
            cert_count=Count('id')
        ).order_by('-cert_count')[:10]
        
        response_data = {
            'status': 'success',
            'filters_applied': {
                'time_range': time_range,
                'start_date': start_date,
                'end_date': end_date,
                'country': country,
                'state': state,
                'city': city,
                'certification_type': certification_type,
                'status': status_filter,
                'group_by': group_by,
                'chart_type': chart_type,
            },
            'summary': {
                'total': total_certifications,
                'active': active_certifications,
                'expired': expired_certifications,
                'pending': pending_certifications,
                'revoked': revoked_certifications,
                'new_last_24h': new_certifications,
                'active_percentage': round((active_certifications / total_certifications * 100), 2) if total_certifications > 0 else 0,
                'by_type': list(certs_by_type),
                'top_users': [
                    {
                    'profile__image': Profile.objects.filter(user_id=item['profile__user__id']).first().image.url if Profile.objects.filter(user_id=item['profile__user__id']).exists() and Profile.objects.filter(user_id=item['profile__user__id']).first().image else None,  

                        'username': item['profile__user__username'],
                        'user_id': item['profile__user__id'],
                        'certification_count': item['cert_count'],
                        'location': f"{item['profile__city'] or ''}, {item['profile__state'] or ''}, {item['profile__country'] or ''}".strip(', ')
                    } for item in top_users if item['profile__user__username']
                ]
            },
            'download_options': {
                'formats': ['png', 'jpg', 'pdf', 'svg'],
                'filename_prefix': f'certification_analytics_{time_range}_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                'html2canvas_config': {
                    'scale': 2,
                    'backgroundColor': '#ffffff',
                    'allowTaint': True,
                    'useCORS': True,
                    'logging': False,
                }
            }
        }
        
        # ===========================================
        # 5. TIME SERIES DATA
        # ===========================================
        if group_by in ['time', 'all']:
            # Monthly data
            monthly_data = queryset.annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                total=Count('id'),
                active=Count('id', filter=Q(status='active')),
                expired=Count('id', filter=Q(status='expired')),
                premium=Count('id', filter=Q(certification_type__name='premium')),
                fire=Count('id', filter=Q(certification_type__name='fire')),
                verified=Count('id', filter=Q(certification_type__name='verified')),
                influencer=Count('id', filter=Q(certification_type__name='influencer'))
            ).order_by('month')
            
            # Daily data (last 30 days)
            daily_data = queryset.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).annotate(
                day=TruncDay('created_at')
            ).values('day').annotate(
                total=Count('id')
            ).order_by('day')
            
            # Weekly data
            weekly_data = queryset.annotate(
                week=TruncWeek('created_at')
            ).values('week').annotate(
                total=Count('id')
            ).order_by('-week')[:12]
            
            # Yearly data
            yearly_data = queryset.annotate(
                year=TruncYear('created_at')
            ).values('year').annotate(
                total=Count('id')
            ).order_by('year')
            
            # Hourly distribution
            hourly_distribution = queryset.annotate(
                hour=ExtractHour('created_at')
            ).values('hour').annotate(
                count=Count('id')
            ).order_by('hour')
            
            # Weekday distribution
            weekday_distribution = queryset.annotate(
                weekday=ExtractWeekDay('created_at')
            ).values('weekday').annotate(
                count=Count('id')
            ).order_by('weekday')
            
            weekday_map = {
                1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 
                4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday'
            }
            
            response_data['charts'] = {
                'time_series': {
                    'monthly': {
                        'labels': [item['month'].strftime('%B %Y') if item['month'] else 'N/A' for item in monthly_data],
                        'datasets': [
                            {
                                'label': 'Total',
                                'data': [item['total'] for item in monthly_data],
                                'borderColor': '#4F46E5',
                                'backgroundColor': 'rgba(79, 70, 229, 0.1)',
                            },
                            {
                                'label': 'Premium',
                                'data': [item['premium'] for item in monthly_data],
                                'borderColor': '#FFD700',
                                'backgroundColor': 'rgba(255, 215, 0, 0.1)',
                            },
                            {
                                'label': 'Fire',
                                'data': [item['fire'] for item in monthly_data],
                                'borderColor': '#FF5722',
                                'backgroundColor': 'rgba(255, 87, 34, 0.1)',
                            },
                            {
                                'label': 'Verified',
                                'data': [item['verified'] for item in monthly_data],
                                'borderColor': '#1DA1F2',
                                'backgroundColor': 'rgba(29, 161, 242, 0.1)',
                            },
                            {
                                'label': 'Influencer',
                                'data': [item['influencer'] for item in monthly_data],
                                'borderColor': '#9C27B0',
                                'backgroundColor': 'rgba(156, 39, 176, 0.1)',
                            }
                        ]
                    },
                    'daily': {
                        'labels': [item['day'].strftime('%d/%m') if item['day'] else 'N/A' for item in daily_data],
                        'data': [item['total'] for item in daily_data],
                        'backgroundColor': 'rgba(79, 70, 229, 0.7)',
                    },
                    'weekly': {
                        'labels': [item['week'].strftime('Week %W') if item['week'] else 'N/A' for item in weekly_data],
                        'data': [item['total'] for item in weekly_data],
                    },
                    'yearly': {
                        'labels': [item['year'].strftime('%Y') if item['year'] else 'N/A' for item in yearly_data],
                        'data': [item['total'] for item in yearly_data],
                    },
                    'hourly': {
                        'labels': [f'{h}:00' for h in range(24)],
                        'data': [next((item['count'] for item in hourly_distribution if item['hour'] == h), 0) for h in range(24)]
                    },
                    'weekday': {
                        'labels': [weekday_map.get(i, f'Day {i}') for i in range(1, 8)],
                        'data': [next((item['count'] for item in weekday_distribution if item['weekday'] == day), 0) for day in range(1, 8)]
                    }
                }
            }
            
            # Calculate growth trends
            if monthly_data:
                monthly_counts = [item['total'] for item in monthly_data]
                if len(monthly_counts) > 1:
                    growth_rate = ((monthly_counts[-1] - monthly_counts[-2]) / monthly_counts[-2]) * 100 if monthly_counts[-2] > 0 else 0
                else:
                    growth_rate = 0
                
                peak_month = max(monthly_data, key=lambda x: x['total']) if monthly_data else None
                
                response_data['trends'] = {
                    'growth_rate': round(growth_rate, 2),
                    'growth_direction': 'up' if growth_rate > 0 else 'down' if growth_rate < 0 else 'stable',
                    'peak_month': peak_month['month'].strftime('%B %Y') if peak_month and peak_month['month'] else None,
                    'peak_value': peak_month['total'] if peak_month else 0,
                    'average_monthly': round(sum(monthly_counts) / len(monthly_counts), 2) if monthly_counts else 0
                }
        
        # ===========================================
        # 6. GEOGRAPHIC DATA - CORRIGÉ POUR BAR CHART
        # ===========================================
        if group_by in ['country', 'city', 'state', 'all']:
            # TOP COUNTRIES - Version simplifiée pour Bar Chart
            top_countries = queryset.values(
                'profile__country'
            ).annotate(
                count=Count('id')
            ).exclude(
                profile__country__isnull=True
            ).exclude(
                profile__country=''
            ).order_by('-count')[:10]
            
            # TOP CITIES - Version simplifiée pour Bar Chart
            top_cities = queryset.values(
                'profile__city',
                'profile__country'
            ).annotate(
                count=Count('id')
            ).exclude(
                profile__city__isnull=True
            ).exclude(
                profile__city=''
            ).order_by('-count')[:10]
            
            # Continent mapping
            continent_mapping = {
                'USA': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
                'France': 'Europe', 'Germany': 'Europe', 'UK': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe',
                'China': 'Asia', 'Japan': 'Asia', 'India': 'Asia', 'South Korea': 'Asia',
                'Brazil': 'South America', 'Argentina': 'South America',
                'Australia': 'Oceania', 'New Zealand': 'Oceania',
                'South Africa': 'Africa', 'Egypt': 'Africa', 'Nigeria': 'Africa',
            }
            
            continent_data = defaultdict(int)
            for item in top_countries:
                country_name = item['profile__country']
                continent = continent_mapping.get(country_name, 'Other')
                continent_data[continent] += item['count']
            
            # Format data for Chart.js
            response_data['geographic'] = {
                'countries': {
                    'labels': [item['profile__country'] for item in top_countries if item['profile__country']],
                    'data': [item['count'] for item in top_countries if item['profile__country']]
                },
                'cities': {
                    'labels': [f"{item['profile__city']}, {item['profile__country']}" for item in top_cities if item['profile__city']],
                    'data': [item['count'] for item in top_cities if item['profile__city']]
                },
                'continents': {
                    'labels': list(continent_data.keys()),
                    'data': list(continent_data.values())
                }
            }
            
            # Add detailed data for table
            detailed_countries = queryset.values(
                'profile__country'
            ).annotate(
                count=Count('id'),
                active_count=Count('id', filter=Q(status='active')),
                premium_count=Count('id', filter=Q(certification_type__name='premium')),
                fire_count=Count('id', filter=Q(certification_type__name='fire'))
            ).exclude(
                profile__country__isnull=True
            ).exclude(
                profile__country=''
            ).order_by('-count')[:20]
            
            response_data['geographic']['map_data'] = [
                {
                    'country': item['profile__country'],
                    'value': item['count'],
                    'active': item['active_count'],
                    'premium': item['premium_count'],
                    'fire': item['fire_count']
                } for item in detailed_countries if item['profile__country']
            ]
        
        # ===========================================
        # 7. DISTRIBUTION CHARTS
        # ===========================================
        if chart_type in ['pie', 'doughnut', 'radar'] or group_by in ['type', 'status', 'all']:
            
            type_distribution = queryset.values(
                'certification_type__name'
            ).annotate(
                count=Count('id')
            ).order_by('-count')
            
            status_distribution = [
                {'status': 'active', 'count': active_certifications, 'label': 'Active', 'color': '#10B981'},
                {'status': 'expired', 'count': expired_certifications, 'label': 'Expired', 'color': '#EF4444'},
                {'status': 'pending', 'count': pending_certifications, 'label': 'Pending', 'color': '#F59E0B'},
                {'status': 'revoked', 'count': revoked_certifications, 'label': 'Revoked', 'color': '#6B7280'}
            ]
            
            type_colors = {
                'premium': '#FFD700',
                'fire': '#FF5722',
                'verified': '#1DA1F2',
                'influencer': '#9C27B0'
            }
            
            if 'charts' not in response_data:
                response_data['charts'] = {}
            
            response_data['charts']['distribution'] = {
                'by_type': {
                    'labels': [item['certification_type__name'].capitalize() for item in type_distribution],
                    'data': [item['count'] for item in type_distribution],
                    'colors': [type_colors.get(item['certification_type__name'], '#808080') for item in type_distribution]
                },
                'by_status': {
                    'labels': [item['label'] for item in status_distribution],
                    'data': [item['count'] for item in status_distribution],
                    'colors': [item['color'] for item in status_distribution]
                }
            }
        
        # ===========================================
        # 8. RAW DATA FOR CSV EXPORT
        # ===========================================
        if request.GET.get('export_data') == 'true':
            export_queryset = queryset[:1000]
            export_data = []
            for cert in export_queryset:
                export_data.append({
                    'certification_id': cert.id,
                    'user': cert.profile.user.username if cert.profile and cert.profile.user else 'N/A',
                    'user_id': cert.profile.user.id if cert.profile and cert.profile.user else None,
                    'certification_type': cert.certification_type.name if cert.certification_type else 'N/A',
                    'status': cert.status,
                    'created_at': cert.created_at.isoformat() if cert.created_at else None,
                    'expires_at': cert.expires_at.isoformat() if cert.expires_at else None,
                    'country': cert.profile.country if cert.profile else None,
                    'state': cert.profile.state if cert.profile else None,
                    'city': cert.profile.city if cert.profile else None,
                    'activity_score': cert.activity_score,
                    'verification_method': cert.verification_method,
                })
            
            response_data['export'] = export_data
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in certification_analyst: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': 'Error fetching certification analytics data',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def certification_analyst_download(request):
    """
    Dedicated endpoint for downloading analytics data
    """
    try:
        # Reuse the same logic with export_data=true
        request.GET = request.GET.copy()
        request.GET['export_data'] = 'true'
        
        # Call the main view
        response = certification_analyst(request)
        
        if response.status_code == 200:
            data = response.data
            
            # CSV format
            if request.GET.get('format') == 'csv':
                import csv
                from django.http import HttpResponse
                
                csv_response = HttpResponse(content_type='text/csv')
                csv_response['Content-Disposition'] = f'attachment; filename="certification_analytics_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
                
                writer = csv.writer(csv_response)
                if data.get('export'):
                    # Write header
                    if data['export']:
                        writer.writerow(data['export'][0].keys())
                        # Write data
                        for row in data['export']:
                            writer.writerow(row.values())
                
                return csv_response
            
            # JSON format
            elif request.GET.get('format') == 'json':
                from django.http import JsonResponse
                
                json_response = JsonResponse(data.get('export', data) if data.get('export') else data, safe=False)
                json_response['Content-Disposition'] = f'attachment; filename="certification_analytics_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
                return json_response
        
        return response
        
    except Exception as e:
        logger.error(f"Error in certification_analyst_download: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': 'Error downloading analytics data',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def certification_analyst_geo(request):
    """
    Specialized endpoint for geographic data (for maps)
    Returns GeoJSON format for Leaflet/Mapbox/Google Maps
    """
    try:
        # Active certifications only for map visualization
        certifications = Certification.objects.filter(status='active').select_related('profile')
        
        # Get profiles with geographic coordinates
        # Note: You need to add latitude/longitude fields to Profile model for precise mapping
        # For now, we'll use country/city level aggregation
        
        # Country-level aggregation
        country_data = certifications.values(
            'profile__country'
        ).annotate(
            count=Count('id'),
            premium_count=Count('id', filter=Q(certification_type__name='premium')),
            fire_count=Count('id', filter=Q(certification_type__name='fire')),
            verified_count=Count('id', filter=Q(certification_type__name='verified'))
        ).exclude(
            profile__country__isnull=True
        ).exclude(
            profile__country=''
        ).order_by('-count')
        
        # Country coordinates (simplified - in production use a proper geocoding service)
        country_coords = {
            'USA': [-95.7129, 37.0902],
            'Canada': [-106.3468, 56.1304],
            'France': [2.2137, 46.2276],
            'Germany': [10.4515, 51.1657],
            'UK': [-3.4359, 55.3781],
            # Add more countries as needed
        }
        
        features = []
        for item in country_data:
            country = item['profile__country']
            coordinates = country_coords.get(country, [0, 0])
            
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': coordinates
                },
                'properties': {
                    'country': country,
                    'certification_count': item['count'],
                    'premium_count': item['premium_count'],
                    'fire_count': item['fire_count'],
                    'verified_count': item['verified_count'],
                    'intensity': min(item['count'] * 5, 100)  # For heatmap
                }
            })
        
        return Response({
            'status': 'success',
            'data': {
                'type': 'FeatureCollection',
                'features': features,
                'total_countries': len(features),
                'total_certifications': certifications.count()
            }
        })
        
    except Exception as e:
        logger.error(f"Error in certification_analyst_geo: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': 'Error fetching geographic data',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['PUT', 'PATCH','POST'])
@permission_classes([IsAdminUser])
def update_certification(request, pk):
    """
    Update an existing certification.
    Admin only endpoint.
    
    PUT:  Full update
    PATCH: Partial update
    
    Editable fields:
    - status: active/pending/expired/revoked
    - expires_at: expiration date
    - subscription_start: subscription start date
    - subscription_end: subscription end date
    - activity_score: activity score (0-1000)
    - verification_method: verification method
    - moderator_notes: moderator notes (stored in metadata)
    """
    try:
        # Get certification with all necessary relations
        certification = get_object_or_404(
            Certification.objects.select_related(
                'profile',
                'profile__user',
                'certification_type'
            ),
            pk=pk
        )
        
        data = request.data
        
        # Double-check admin status
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {'error': 'Only administrators can modify certifications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Log admin action
        logger.info(
            f"Admin {request.user.username} is modifying certification {certification.id} "
            f"for {certification.profile.user.username}"
        )
        
        # Update status
        if 'status' in data:
            new_status = data['status']
            valid_statuses = ['active', 'pending', 'expired', 'revoked']
            
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Invalid status. Choose from: {", ".join(valid_statuses)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            certification.status = new_status
            
            # If activating, set subscription start if not set
            if new_status == 'active' and not certification.subscription_start:
                certification.subscription_start = timezone.now()
        
        # Update expiration date
        from django.utils.dateparse import parse_datetime

# Update expiration date
        if 'expires_at' in data:
            expires_at = data['expires_at']

            if expires_at:
                expires_at = parse_datetime(expires_at)

                if not expires_at:
                    return Response(
                {'error': 'Invalid date format for expires_at'},
                status=status.HTTP_400_BAD_REQUEST
            )

                if timezone.is_naive(expires_at):
                    expires_at = timezone.make_aware(expires_at)

                certification.expires_at = expires_at
        else:
            certification.expires_at = None

        
        # Update subscription dates (for premium)
        if 'subscription_start' in data:
            sub_start = data['subscription_start']
            if sub_start:
                try:
                    if isinstance(sub_start, str):
                        sub_start = datetime.fromisoformat(sub_start.replace('Z', '+00:00'))
                    certification.subscription_start = sub_start
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format for subscription_start'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        if 'subscription_end' in data:
            sub_end = data['subscription_end']
            if sub_end:
                try:
                    if isinstance(sub_end, str):
                        sub_end = datetime.fromisoformat(sub_end.replace('Z', '+00:00'))
                    certification.subscription_end = sub_end
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format for subscription_end'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        # Update activity score (for fire certification)
        if 'activity_score' in data:
            try:
                score = int(data['activity_score'])
                if 0 <= score <= 1000:
                    certification.activity_score = score
                    certification.last_activity_check = timezone.now()
                else:
                    return Response(
                        {'error': 'Activity score must be between 0 and 1000'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {'error': 'Activity score must be an integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update verification method (for verified certification)
        if 'verification_method' in data:
            certification.verification_method = data['verification_method']
        
        # Update moderator notes (stored in metadata)
        if 'moderator_notes' in data:
            if not certification.metadata:
                certification.metadata = {}
            certification.metadata['moderator_notes'] = data['moderator_notes']
            certification.metadata['last_modified_by'] = request.user.username
            certification.metadata['last_modified_at'] = timezone.now().isoformat()
        
        # Add audit trail
        if not certification.metadata:
            certification.metadata = {}
        
        if 'audit_trail' not in certification.metadata:
            certification.metadata['audit_trail'] = []
        
        certification.metadata['audit_trail'].append({
            'action': 'updated',
            'by': request.user.username,
            'at': timezone.now().isoformat(),
            'changes': {k: v for k, v in data.items() if k in [
                'status', 'expires_at', 'subscription_start', 'subscription_end',
                'activity_score', 'verification_method', 'moderator_notes'
            ]}
        })
        
        # Keep only last 10 audit entries
        if len(certification.metadata['audit_trail']) > 10:
            certification.metadata['audit_trail'] = certification.metadata['audit_trail'][-10:]
        
        # Save changes
        certification.save()
        
        # Prepare response with updated data
        response_data = {
            'id': certification.id,
            'status': certification.status,
            'certification_type': {
                'id': certification.certification_type.id,
                'name': certification.certification_type.name,
                'display_name': certification.certification_type.get_name_display(),
                'icon': certification.certification_type.icon,
                'color': certification.certification_type.color
            },
            'user': {
                'id': certification.profile.user.id,
                'username': certification.profile.user.username,
                'email': certification.profile.user.email,
                'avatar': certification.profile.profile_image.url if hasattr(certification.profile, 'profile_image') and certification.profile.profile_image else None
            },
            'expires_at': certification.expires_at.isoformat() if certification.expires_at else None,
            'subscription_start': certification.subscription_start.isoformat() if certification.subscription_start else None,
            'subscription_end': certification.subscription_end.isoformat() if certification.subscription_end else None,
            'activity_score': certification.activity_score,
            'verification_method': certification.verification_method,
            'verified_at': certification.verified_at.isoformat() if certification.verified_at else None,
            'moderator_notes': certification.metadata.get('moderator_notes') if certification.metadata else None,
            'created_at': certification.created_at.isoformat(),
            'updated_at': certification.updated_at.isoformat(),
            'days_remaining': certification.days_remaining,
            'is_expired': certification.is_expired,
            'last_modified_by': certification.metadata.get('last_modified_by') if certification.metadata else None,
            'last_modified_at': certification.metadata.get('last_modified_at') if certification.metadata else None
        }
        
        logger.info(
            f"✅ Certification {certification.id} successfully updated by {request.user.username}"
        )
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Certification.DoesNotExist:
        return Response(
            {'error': 'Certification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating certification {pk}: {str(e)}")
        return Response(
            {'error': f'Error updating certification: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )





# ==================== PAYMENTS MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_payments_list(request):
    """Get paginated list of payments"""
    try:
        status_filter = request.GET.get('status', '')
        payment_type = request.GET.get('payment_type', '')
        user_id = request.GET.get('user_id', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        queryset = Payment.objects.all().select_related('user')
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if payment_type:
            queryset = queryset.filter(payment_type=payment_type)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        # Order by latest
        queryset = queryset.order_by('-created_at')
        
        # Get paginated data
        paginated_data = get_paginated_data(request, queryset)
        
        return Response({
            'status': 'success',
            'data': paginated_data
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_revenue_stats(request):
    """Get revenue statistics"""
    try:
        period = request.GET.get('period', 'month')  # day, week, month, year
        
        today = timezone.now().date()
        
        if period == 'day':
            start_date = today
            end_date = today
            payments = Payment.objects.filter(
                status='completed',
                payment_date__date=today
            )
            
        elif period == 'week':
            start_date = today - timedelta(days=7)
            end_date = today
            payments = Payment.objects.filter(
                status='completed',
                payment_date__date__gte=start_date,
                payment_date__date__lte=end_date
            )
            
        elif period == 'month':
            start_date = today.replace(day=1)
            end_date = today
            payments = Payment.objects.filter(
                status='completed',
                payment_date__date__gte=start_date,
                payment_date__date__lte=end_date
            )
            
        else:  # year
            start_date = today.replace(month=1, day=1)
            end_date = today
            payments = Payment.objects.filter(
                status='completed',
                payment_date__date__gte=start_date,
                payment_date__date__lte=end_date
            )
        
        # Calculate statistics
        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
        total_payments = payments.count()
        avg_payment = total_revenue / total_payments if total_payments > 0 else 0
        
        # Group by payment type
        by_type = payments.values('payment_type').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Daily revenue for chart (last 30 days)
        daily_revenue = []
        for i in range(30, -1, -1):
            date = today - timedelta(days=i)
            daily_total = Payment.objects.filter(
                status='completed',
                payment_date__date=date
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            daily_revenue.append({
                'date': date.strftime('%Y-%m-%d'),
                'revenue': float(daily_total)
            })
        
        # Top users by spending
        top_users = payments.values(
            'user__id',
            'user__username',
            'user__email'
        ).annotate(
            total_spent=Sum('amount'),
            payment_count=Count('id')
        ).order_by('-total_spent')[:10]
        
        return Response({
            'status': 'success',
            'data': {
                'period': period,
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d')
                },
                'summary': {
                    'total_revenue': float(total_revenue),
                    'total_payments': total_payments,
                    'average_payment': float(avg_payment)
                },
                'by_payment_type': list(by_type),
                'daily_revenue': daily_revenue,
                'top_users': list(top_users)
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

# src/certifications/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear
from django.utils import timezone
from datetime import timedelta
import logging
from django.db import models


logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_payment_analytics(request):
    """
    Get comprehensive payment analytics with multiple time periods and dimensions.
    Admin only endpoint.
    
    Query Parameters:
    - period: day/week/month/year (default: month)
    - start_date: YYYY-MM-DD (default: 30 days ago)
    - end_date: YYYY-MM-DD (default: today)
    - payment_type: certification/post_boost/other (optional)
    - country: filter by country (optional)
    - city: filter by city (optional)
    """
    try:
        # Get query parameters
        period = request.GET.get('period', 'month').lower()
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        payment_type_filter = request.GET.get('payment_type')
        country_filter = request.GET.get('country')
        city_filter = request.GET.get('city')
        
        # Set default date range (last 30 days)
        if not end_date:
            end_date = timezone.now().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        if not start_date:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        # Base queryset
        queryset = Payment.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related('user', 'user__profile')
        
        # Apply filters
        if payment_type_filter:
            queryset = queryset.filter(payment_type=payment_type_filter)
        
        if country_filter or city_filter:
            from app.models import Profile
            profile_filter = Q()
            if country_filter:
                profile_filter &= Q(user__profile__country__icontains=country_filter)
            if city_filter:
                profile_filter &= Q(user__profile__city__icontains=city_filter)
            queryset = queryset.filter(profile_filter)
        
        # Get trunc function based on period
        trunc_map = {
            'day': TruncDay,
            'week': TruncWeek,
            'month': TruncMonth,
            'year': TruncYear
        }
        trunc_func = trunc_map.get(period, TruncMonth)
        
        # ===========================================
        # 1. TIME SERIES ANALYTICS
        # ===========================================
        time_series = queryset.annotate(
            period_date=trunc_func('created_at')
        ).values('period_date').annotate(
            total_payments=Count('id'),
            total_amount=Sum('amount'),
            completed_payments=Count('id', filter=Q(status='completed')),
            pending_payments=Count('id', filter=Q(status='pending')),
            failed_payments=Count('id', filter=Q(status='failed')),
            refunded_payments=Count('id', filter=Q(status='refunded')),
            avg_amount=Avg('amount')
        ).order_by('period_date')
        
        # ===========================================
        # 2. PAYMENT TYPE DISTRIBUTION
        # ===========================================
        payment_type_stats = queryset.values('payment_type').annotate(
            count=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount'),
            completed_count=Count('id', filter=Q(status='completed')),
            completion_rate=Count('id', filter=Q(status='completed')) * 100.0 / Count('id')
        ).order_by('-total_amount')
        
        # Add display names
        payment_type_display = dict(Payment.PAYMENT_TYPE_CHOICES)
        for stat in payment_type_stats:
            stat['display_name'] = payment_type_display.get(stat['payment_type'], stat['payment_type'])
        
        # ===========================================
        # 3. STATUS DISTRIBUTION
        # ===========================================
        status_stats = queryset.values('status').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')
        
        status_display = dict(Payment.STATUS_CHOICES)
        for stat in status_stats:
            stat['display_name'] = status_display.get(stat['status'], stat['status'])
        
        # ===========================================
        # 4. GEOGRAPHIC ANALYTICS (Country)
        # ===========================================
        country_stats = queryset.values('user__profile__country').annotate(
            country_name=models.F('user__profile__country'),
            total_payments=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount'),
            unique_users=Count('user', distinct=True)
        ).exclude(
            user__profile__country__isnull=True
        ).exclude(
            user__profile__country=''
        ).order_by('-total_amount')[:20]
        
        # Clean country stats
        for stat in country_stats:
            stat['country'] = stat.pop('user__profile__country')
        
        # ===========================================
        # 5. CITY ANALYTICS
        # ===========================================
        city_stats = queryset.values('user__profile__city').annotate(
            city_name=models.F('user__profile__city'),
            country=models.F('user__profile__country'),
            total_payments=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount'),
            unique_users=Count('user', distinct=True)
        ).exclude(
            user__profile__city__isnull=True
        ).exclude(
            user__profile__city=''
        ).order_by('-total_amount')[:20]
        
        # Clean city stats
        for stat in city_stats:
            stat['city'] = stat.pop('user__profile__city')
        
        # ===========================================
        # 6. PAYMENT METHOD/PLAN ANALYTICS
        # ===========================================
        # For certification payments
        certification_plan_stats = queryset.filter(
            payment_type='certification'
        ).values('plan_type').annotate(
            count=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount')
        ).order_by('-count')
        
        # ===========================================
        # 7. USER SEGMENT ANALYTICS
        # ===========================================
        # New vs Returning customers
        from django.db.models import Subquery, OuterRef
        
        first_payment = Payment.objects.filter(
            user=OuterRef('user')
        ).order_by('created_at').values('id')[:1]
        
        user_segments = queryset.annotate(
            is_first_payment=Q(id=Subquery(first_payment))
        ).values('is_first_payment').annotate(
            user_count=Count('user', distinct=True),
            payment_count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # ===========================================
        # 8. DAILY/PERIOD SUMMARY
        # ===========================================
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        this_week_start = today - timedelta(days=today.weekday())
        this_month_start = today.replace(day=1)
        this_year_start = today.replace(month=1, day=1)
        
        period_summary = {
            'today': {
                'payments': queryset.filter(created_at__date=today).count(),
                'amount': queryset.filter(created_at__date=today).aggregate(Sum('amount'))['amount__sum'] or 0,
                'completed': queryset.filter(created_at__date=today, status='completed').count()
            },
            'yesterday': {
                'payments': queryset.filter(created_at__date=yesterday).count(),
                'amount': queryset.filter(created_at__date=yesterday).aggregate(Sum('amount'))['amount__sum'] or 0
            },
            'this_week': {
                'payments': queryset.filter(created_at__date__gte=this_week_start).count(),
                'amount': queryset.filter(created_at__date__gte=this_week_start).aggregate(Sum('amount'))['amount__sum'] or 0
            },
            'this_month': {
                'payments': queryset.filter(created_at__date__gte=this_month_start).count(),
                'amount': queryset.filter(created_at__date__gte=this_month_start).aggregate(Sum('amount'))['amount__sum'] or 0
            },
            'this_year': {
                'payments': queryset.filter(created_at__date__gte=this_year_start).count(),
                'amount': queryset.filter(created_at__date__gte=this_year_start).aggregate(Sum('amount'))['amount__sum'] or 0
            }
        }
        
        # ===========================================
        # 9. KPI METRICS
        # ===========================================
        total_payments = queryset.count()
        completed_payments = queryset.filter(status='completed').count()
        total_revenue = queryset.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
        avg_payment_value = queryset.filter(status='completed').aggregate(Avg('amount'))['amount__avg'] or 0
        unique_customers = queryset.values('user').distinct().count()
        
        # Conversion rate (completed vs total)
        conversion_rate = (completed_payments / total_payments * 100) if total_payments > 0 else 0
        
        # Revenue per customer
        revenue_per_customer = total_revenue / unique_customers if unique_customers > 0 else 0
        
        # ===========================================
        # 10. TRENDS (vs previous period)
        # ===========================================
        previous_start = start_date - (end_date - start_date)
        previous_period_queryset = Payment.objects.filter(
            created_at__date__gte=previous_start,
            created_at__date__lt=start_date
        )
        
        previous_revenue = previous_period_queryset.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
        revenue_growth = ((total_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
        
        # ===========================================
        # 11. PREMIUM SUBSCRIPTION METRICS
        # ===========================================
        premium_stats = {
            'active_subscriptions': Certification.objects.filter(
                certification_type__name='premium',
                status='active'
            ).count(),
            'expired_subscriptions': Certification.objects.filter(
                certification_type__name='premium',
                status='expired'
            ).count(),
            'renewals': queryset.filter(
                payment_type='certification',
                metadata__has_key='subscription_renewal'
            ).count()
        }
        
        # ===========================================
        # 12. BOOST PURCHASE ANALYTICS
        # ===========================================
        boost_stats = UserInteraction.objects.filter(
            interaction_type='boost_purchase',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).aggregate(
            total_boosts=Count('id'),
            avg_boost_value=Avg('value'),
            total_boost_revenue=Sum('value')
        )
        
        # Build complete response
        response_data = {
            'status': 'success',
            'date_range': {
                'start_date': start_date,
                'end_date': end_date,
                'period': period
            },
            'summary': {
                'total_payments': total_payments,
                'completed_payments': completed_payments,
                'total_revenue': float(total_revenue),
                'avg_payment_value': float(avg_payment_value),
                'unique_customers': unique_customers,
                'conversion_rate': round(conversion_rate, 2),
                'revenue_per_customer': float(revenue_per_customer),
                'revenue_growth': round(revenue_growth, 2)
            },
            'time_series': [
                {
                    'period': item['period_date'].strftime('%Y-%m-%d'),
                    'payments': item['total_payments'],
                    'amount': float(item['total_amount']),
                    'completed': item['completed_payments'],
                    'pending': item['pending_payments'],
                    'failed': item['failed_payments'],
                    'refunded': item['refunded_payments'],
                    'average': float(item['avg_amount']) if item['avg_amount'] else 0
                }
                for item in time_series
            ],
            'by_payment_type': [
                {
                    'type': item['payment_type'],
                    'display_name': item['display_name'],
                    'count': item['count'],
                    'total_amount': float(item['total_amount']),
                    'avg_amount': float(item['avg_amount']) if item['avg_amount'] else 0,
                    'completion_rate': round(item['completion_rate'], 2) if item['completion_rate'] else 0
                }
                for item in payment_type_stats
            ],
            'by_status': [
                {
                    'status': item['status'],
                    'display_name': item['display_name'],
                    'count': item['count'],
                    'total_amount': float(item['total_amount'])
                }
                for item in status_stats
            ],
            'by_country': [
                {
                    'country': item['country'],
                    'payments': item['total_payments'],
                    'total_amount': float(item['total_amount']),
                    'avg_amount': float(item['avg_amount']),
                    'unique_users': item['unique_users']
                }
                for item in country_stats
            ],
            'by_city': [
                {
                    'city': item['city'],
                    'country': item['country'],
                    'payments': item['total_payments'],
                    'total_amount': float(item['total_amount']),
                    'avg_amount': float(item['avg_amount']),
                    'unique_users': item['unique_users']
                }
                for item in city_stats
            ],
            'certification_plans': [
                {
                    'plan': item['plan_type'] or 'default',
                    'count': item['count'],
                    'total_amount': float(item['total_amount']),
                    'avg_amount': float(item['avg_amount'])
                }
                for item in certification_plan_stats
            ],
            'period_summary': {
                'today': {
                    'payments': period_summary['today']['payments'],
                    'amount': float(period_summary['today']['amount'])
                },
                'yesterday': {
                    'payments': period_summary['yesterday']['payments'],
                    'amount': float(period_summary['yesterday']['amount'])
                },
                'this_week': {
                    'payments': period_summary['this_week']['payments'],
                    'amount': float(period_summary['this_week']['amount'])
                },
                'this_month': {
                    'payments': period_summary['this_month']['payments'],
                    'amount': float(period_summary['this_month']['amount'])
                },
                'this_year': {
                    'payments': period_summary['this_year']['payments'],
                    'amount': float(period_summary['this_year']['amount'])
                }
            },
            'premium_metrics': {
                'active_subscriptions': premium_stats['active_subscriptions'],
                'expired_subscriptions': premium_stats['expired_subscriptions'],
                'renewals': premium_stats['renewals']
            },
            'boost_metrics': {
                'total_boosts': boost_stats['total_boosts'] or 0,
                'total_boost_revenue': float(boost_stats['total_boost_revenue'] or 0),
                'avg_boost_value': float(boost_stats['avg_boost_value'] or 0)
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error generating payment analytics: {str(e)}")
        return Response(
            {
                'status': 'error',
                'message': f'Error generating payment analytics: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



# ==================== SEARCH FUNCTION ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def search_admin(request):
    """Global search function for admin"""
    try:
        query = request.GET.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({
                'status': 'error',
                'message': 'Search query must be at least 2 characters'
            }, status=400)
        
        results = {
            'users': [],
            'posts': [],
            'reports': [],
            'certifications': [],
            'payments': []
        }
        
        # Search users
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:10]
        
        for user in users:
            results['users'].append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'type': 'user',
                'url': f'/admin/users/{user.id}'
            })
        
        # Search posts
        posts = Post.objects.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query)
        ).select_related('user')[:10]
        
        for post in posts:
            results['posts'].append({
                'id': post.id,
                'title': post.title,
                'author': post.user.username,
                'created_at': post.created_at,
                'type': 'post',
                'url': f'/admin/posts/{post.id}'
            })
        
        # Search reports
        reports = Report.objects.filter(
            Q(reason__icontains=query) |
            Q(moderator_notes__icontains=query)
        ).select_related('reporter')[:10]
        
        for report in reports:
            results['reports'].append({
                'id': report.id,
                'type': report.report_type,
                'reporter': report.reporter.username,
                'status': report.status,
                'created_at': report.created_at,
                'type_label': 'report',
                'url': f'/admin/reports/{report.id}'
            })
        
        # Search certifications
        certifications = Certification.objects.filter(
            Q(profile__user__username__icontains=query) |
            Q(certification_type__name__icontains=query)
        ).select_related('profile__user', 'certification_type')[:10]
        
        for cert in certifications:
            results['certifications'].append({
                'id': cert.id,
                'user': cert.profile.user.username,
                'cert_type': cert.certification_type.name,
                'status': cert.status,
                'created_at': cert.created_at,
                'type_label': 'certification',
                'url': f'/admin/certifications/{cert.id}'
            })
        
        # Search payments
        payments = Payment.objects.filter(
            Q(user__username__icontains=query) |
            Q(stripe_payment_intent_id__icontains=query) |
            Q(plan_type__icontains=query)
        ).select_related('user')[:10]
        
        for payment in payments:
            results['payments'].append({
                'id': payment.id,
                'user': payment.user.username,
                'amount': float(payment.amount),
                'status': payment.status,
                'type': payment.payment_type,
                'created_at': payment.created_at,
                'type_label': 'payment',
                'url': f'/admin/payments/{payment.id}'
            })
        
        return Response({
            'status': 'success',
            'data': results
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

# ==================== SYSTEM HEALTH CHECK ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_health(request):
    """Check system health and performance"""
    try:
        # Database connection check
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_ok = cursor.fetchone()[0] == 1
        
        # Check queue/worker status (if using Celery)
        try:
            # If using Celery
            from celery import current_app
            insp = current_app.control.inspect()
            active_workers = insp.active() or {}
            celery_ok = len(active_workers) > 0
        except:
            celery_ok = True  # Not using Celery
        
        # Storage check
        import os
        from django.conf import settings
        storage_ok = os.access(settings.MEDIA_ROOT, os.W_OK) if hasattr(settings, 'MEDIA_ROOT') else True
        
        # Cache check
        from django.core.cache import cache
        cache_ok = False
        try:
            cache.set('health_check', 'ok', 1)
            cache_ok = cache.get('health_check') == 'ok'
        except:
            cache_ok = False
        
        # Get system statistics
        stats = {
            'database': {
                'status': 'OK' if db_ok else 'ERROR',
                'connection': 'Connected' if db_ok else 'Disconnected'
            },
            'cache': {
                'status': 'OK' if cache_ok else 'ERROR',
                'backend': str(cache.__class__.__name__) if cache_ok else 'Unknown'
            },
            'storage': {
                'status': 'OK' if storage_ok else 'ERROR',
                'media_root': settings.MEDIA_ROOT if hasattr(settings, 'MEDIA_ROOT') else 'Not set'
            },
            'celery': {
                'status': 'OK' if celery_ok else 'WARNING',
                'workers': len(active_workers) if celery_ok else 0
            },
            'server_time': timezone.now().isoformat(),
            'uptime': 'N/A',  # Would need psutil or similar
            'memory_usage': 'N/A',  # Would need psutil
            'cpu_usage': 'N/A'  # Would need psutil
        }
        
        return Response({
            'status': 'success',
            'data': stats
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

# ==================== EXPORT FUNCTIONS ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_data(request):

    
    """Export data in various formats"""
    try:
        data_type = request.GET.get('type', 'users')
        format_type = request.GET.get('format', 'json')
        
        if data_type == 'users':
            data = list(User.objects.all().values(
                'id', 'username', 'email', 'is_active', 
                'date_joined', 'last_login'
            ))
        elif data_type == 'posts':
            data = list(Post.objects.all().values(
                'id', 'title', 'user__username', 'category__name',
                'created_at', 'average_rating', 'total_ratings'
            ))
        elif data_type == 'reports':
            data = list(Report.objects.all().values(
                'id', 'report_type', 'status', 'reporter__username',
                'created_at', 'reviewed_at'
            ))
        elif data_type == 'payments':
            data = list(Payment.objects.all().values(
                'id', 'user__username', 'payment_type', 'amount',
                'status', 'created_at'
            ))
        else:
            return Response({
                'status': 'error',
                'message': 'Invalid data type'
            }, status=400)
        
        if format_type == 'csv':
            # Convert to CSV
            import csv
            from django.http import HttpResponse
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            if data:
                # Write headers
                writer.writerow(data[0].keys())
                # Write data
                for row in data:
                    writer.writerow(row.values())
            
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{data_type}_{timezone.now().date()}.csv"'
            return response
            
        else:  # JSON format
            return Response({
                'status': 'success',
                'data': data,
                'count': len(data),
                'exported_at': timezone.now().isoformat()
            })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


# src/messaging/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Q, Avg, Max, Min, F, Sum, Value, IntegerField
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear, Coalesce
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction
from datetime import timedelta, datetime
import logging

from messaging.models import Conversation, GroupMember, Message, GroupJoinRequest, GroupFeedback, GroupCategory, User
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


# ===========================================
# 1. GROUP LIST - Liste complète des groupes
# ===========================================
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_groups_list(request):
    """
    Get paginated list of all chat groups with filters.
    Admin only endpoint.
    
    Query Parameters:
    - search: search by name or description
    - group_type: group_private/group_public
    - status: is_active boolean
    - created_from: date filter
    - created_to: date filter
    - min_members: minimum members count
    - max_members: maximum members count
    - country: filter by location
    - category: filter by category id
    - sort_by: created_at/name/member_count (default: -created_at)
    """
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        group_type = request.GET.get('group_type', '')
        is_active = request.GET.get('is_active', '')
        created_from = request.GET.get('created_from', '')
        created_to = request.GET.get('created_to', '')
        min_members = request.GET.get('min_members', '')
        max_members = request.GET.get('max_members', '')
        country = request.GET.get('country', '')
        category = request.GET.get('category', '')
        sort_by = request.GET.get('sort_by', '-created_at')
        
        # Base queryset - uniquement les groupes, pas les conversations privées
        queryset = Conversation.objects.filter(
            is_group=True
        ).select_related(
            'created_by',
            'category'
        ).prefetch_related(
            'participants',
            'member_info',
            'messages'
        ).annotate(
            member_count=Count('participants', distinct=True),
            admin_count=Count('member_info', filter=Q(member_info__role__in=['admin', 'owner']), distinct=True),
            moderator_count=Count('member_info', filter=Q(member_info__role='moderator'), distinct=True),
            message_count=Count('messages', distinct=True),
            last_message_at=Max('messages__timestamp'),
            join_requests_count=Count('join_requests', filter=Q(join_requests__status='pending'), distinct=True),
            average_rating=Coalesce(Avg('feedbacks__rating'), 0.0, output_field=IntegerField()),
            reviews_count=Count('feedbacks', distinct=True)
        )
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(created_by__username__icontains=search) |
                Q(location__icontains=search)
            )
        
        if group_type:
            queryset = queryset.filter(group_type=group_type)
        
        if is_active != '':
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        if created_from:
            queryset = queryset.filter(created_at__date__gte=created_from)
        
        if created_to:
            queryset = queryset.filter(created_at__date__lte=created_to)
        
        if min_members:
            queryset = queryset.annotate(
                member_count=Count('participants')
            ).filter(member_count__gte=int(min_members))
        
        if max_members:
            queryset = queryset.annotate(
                member_count=Count('participants')
            ).filter(member_count__lte=int(max_members))
        
        if country:
            queryset = queryset.filter(location__icontains=country)
        
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Apply sorting
        if sort_by.startswith('-'):
            queryset = queryset.order_by(f'-{sort_by[1:]}')
        else:
            queryset = queryset.order_by(sort_by)
        
        # Pagination
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        from django.core.paginator import Paginator
        paginator = Paginator(queryset, page_size)
        current_page = paginator.page(page)
        
        groups_data = []
        for group in current_page.object_list:
            # Get member roles distribution
            roles_distribution = group.member_info.values('role').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Get recent join requests
            recent_requests = group.join_requests.filter(
                status='pending'
            ).select_related('user').order_by('-created_at')[:5]
            
            groups_data.append({
                'id': group.id,
                'name': str(group.name) if group.name else f"Group {group.id}",
                'description': str(group.description) if group.description else '',
                'group_type': group.group_type,
                'group_type_display': dict(Conversation.GROUP_TYPE_CHOICES).get(group.group_type, group.group_type),
                'is_active': group.is_active,
                'is_visible': group.is_visible,
                'avatar': group.group_photo.url if group.group_photo else None,
                'created_by': {
                    'id': group.created_by.id if group.created_by else None,
                    'username': group.created_by.username if group.created_by else 'Unknown',
                    'email': group.created_by.email if group.created_by else None,
                },
                'category': {
                    'id': group.category.id if group.category else None,
                    'name': group.category.name if group.category else None,
                    'icon': group.category.icon if group.category else None,
                } if group.category else None,
                'member_count': group.member_count,
                'admin_count': group.admin_count,
                'moderator_count': group.moderator_count,
                'message_count': group.message_count,
                'join_requests_count': group.join_requests_count,
                'average_rating': round(group.average_rating, 1),
                'reviews_count': group.reviews_count,
                'location': str(group.location) if group.location else None,
                'website': group.website,
                'requires_approval': group.requires_approval,
                'can_anyone_invite': group.can_anyone_invite,
                'max_participants': group.max_participants,
                'available_spots': group.max_participants - group.member_count,
                'is_full': group.member_count >= group.max_participants,
                'created_at': group.created_at,
                'updated_at': group.updated_at,
                'last_message_at': group.last_message_at,
                'tags': group.tags,
                'rules': str(group.rules) if group.rules else None,
                'roles_distribution': [
                    {'role': item['role'], 'count': item['count']}
                    for item in roles_distribution
                ],
                'recent_requests': [
                    {
                        'id': req.id,
                        'user': {
                            'id': req.user.id,
                            'username': req.user.username,
                            'email': req.user.email,
                        },
                        'message': str(req.message) if req.message else None,
                        'created_at': req.created_at
                    }
                    for req in recent_requests
                ]
            })
        
        return Response({
            'status': 'success',
            'data': {
                'items': groups_data,
                'pagination': {
                    'current_page': current_page.number,
                    'total_pages': paginator.num_pages,
                    'total_items': paginator.count,
                    'page_size': page_size,
                    'has_next': current_page.has_next(),
                    'has_previous': current_page.has_previous()
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching groups list: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error fetching groups: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================
# 2. GROUP UPDATE/CRUD - Modifier, supprimer, désactiver
# ===========================================
@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def manage_group(request, pk):
    """
    Manage a chat group (update, delete, deactivate/activate).
    Admin only endpoint.
    """
    try:
        group = get_object_or_404(
            Conversation.objects.filter(is_group=True).select_related('created_by', 'category'),
            pk=pk
        )
        
        # Log admin action
        logger.info(
            f"Admin {request.user.username} is managing group {group.id} - {group.name}"
        )
        
        # ===== DELETE =====
        if request.method == 'DELETE':
            # Store info before deletion
            group_info = {
                'id': group.id,
                'name': str(group.name) if group.name else f"Group {group.id}",
                'type': group.group_type,
                'created_by': group.created_by.username if group.created_by else 'Unknown',
                'member_count': group.participants.count(),
                'message_count': group.messages.count(),
                'created_at': group.created_at,
                'deleted_at': timezone.now(),
                'deleted_by': request.user.username
            }
            
            group.delete()
            
            logger.warning(
                f"⚠️ Admin {request.user.username} deleted group {group_info['id']} - {group_info['name']}"
            )
            
            return Response({
                'status': 'success',
                'message': 'Group deleted successfully',
                'deleted_group': group_info
            }, status=status.HTTP_200_OK)
        
        # ===== UPDATE =====
        data = request.data
        
        # Check if user is admin
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({
                'error': 'Only administrators can modify groups'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Track changes for audit
        changes = {}
        
        # Update name
        if 'name' in data and data['name'] != str(group.name):
            changes['name'] = {'from': str(group.name), 'to': data['name']}
            group.name = data['name']
        
        # Update description
        if 'description' in data and data['description'] != str(group.description):
            changes['description'] = {'from': str(group.description), 'to': data['description']}
            group.description = data['description']
        
        # Update group type
        if 'group_type' in data:
            valid_types = ['group_private', 'group_public']
            if data['group_type'] in valid_types:
                if data['group_type'] != group.group_type:
                    changes['group_type'] = {'from': group.group_type, 'to': data['group_type']}
                    group.group_type = data['group_type']
            else:
                return Response({
                    'error': f'Invalid group type. Choose from: {", ".join(valid_types)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status (activate/deactivate)
        if 'is_active' in data:
            is_active = data['is_active']
            if isinstance(is_active, str):
                is_active = is_active.lower() == 'true'
            
            if is_active != group.is_active:
                changes['is_active'] = {'from': group.is_active, 'to': is_active}
                group.is_active = is_active
                
                logger.info(
                    f"Admin {request.user.username} changed group {group.id} active status from "
                    f"{changes['is_active']['from']} to {changes['is_active']['to']}"
                )
        
        # Update visibility
        if 'is_visible' in data:
            is_visible = data['is_visible']
            if isinstance(is_visible, str):
                is_visible = is_visible.lower() == 'true'
            
            if is_visible != group.is_visible:
                changes['is_visible'] = {'from': group.is_visible, 'to': is_visible}
                group.is_visible = is_visible
        
        # Update max participants
        if 'max_participants' in data:
            try:
                max_participants = int(data['max_participants'])
                if max_participants > 0:
                    if max_participants != group.max_participants:
                        changes['max_participants'] = {'from': group.max_participants, 'to': max_participants}
                        group.max_participants = max_participants
            except ValueError:
                return Response({
                    'error': 'max_participants must be a positive integer'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update requires approval
        if 'requires_approval' in data:
            requires_approval = data['requires_approval']
            if isinstance(requires_approval, str):
                requires_approval = requires_approval.lower() == 'true'
            
            if requires_approval != group.requires_approval:
                changes['requires_approval'] = {'from': group.requires_approval, 'to': requires_approval}
                group.requires_approval = requires_approval
        
        # Update can anyone invite
        if 'can_anyone_invite' in data:
            can_anyone_invite = data['can_anyone_invite']
            if isinstance(can_anyone_invite, str):
                can_anyone_invite = can_anyone_invite.lower() == 'true'
            
            if can_anyone_invite != group.can_anyone_invite:
                changes['can_anyone_invite'] = {'from': group.can_anyone_invite, 'to': can_anyone_invite}
                group.can_anyone_invite = can_anyone_invite
        
        # Update category
        if 'category_id' in data:
            try:
                category = GroupCategory.objects.get(id=int(data['category_id']))
                if category != group.category:
                    changes['category'] = {'from': group.category.name if group.category else None, 'to': category.name}
                    group.category = category
            except (ValueError, GroupCategory.DoesNotExist):
                return Response({
                    'error': 'Invalid category ID'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update location
        if 'location' in data:
            if data['location'] != str(group.location):
                changes['location'] = {'from': str(group.location), 'to': data['location']}
                group.location = data['location']
        
        # Update website
        if 'website' in data:
            if data['website'] != group.website:
                changes['website'] = {'from': group.website, 'to': data['website']}
                group.website = data['website']
        
        # Update tags
        if 'tags' in data:
            if data['tags'] != group.tags:
                changes['tags'] = {'from': group.tags, 'to': data['tags']}
                group.tags = data['tags']
        
        # Update rules
        if 'rules' in data:
            if data['rules'] != str(group.rules):
                changes['rules'] = {'from': str(group.rules), 'to': data['rules']}
                group.rules = data['rules']
        
        # Add audit trail to metadata
        if not hasattr(group, 'metadata') or not group.metadata:
            group.metadata = {}
        
        if 'audit_trail' not in group.metadata:
            group.metadata['audit_trail'] = []
        
        if changes:
            group.metadata['audit_trail'].append({
                'action': 'updated_by_admin',
                'admin': request.user.username,
                'admin_id': request.user.id,
                'timestamp': timezone.now().isoformat(),
                'changes': changes
            })
            
            # Keep only last 20 audit entries
            if len(group.metadata['audit_trail']) > 20:
                group.metadata['audit_trail'] = group.metadata['audit_trail'][-20:]
        
        group.save()
        
        # Get updated member count
        member_count = group.participants.count()
        
        # Prepare response
        response_data = {
            'id': group.id,
            'name': str(group.name) if group.name else f"Group {group.id}",
            'description': str(group.description) if group.description else '',
            'group_type': group.group_type,
            'group_type_display': dict(Conversation.GROUP_TYPE_CHOICES).get(group.group_type, group.group_type),
            'is_active': group.is_active,
            'is_visible': group.is_visible,
            'max_participants': group.max_participants,
            'member_count': member_count,
            'requires_approval': group.requires_approval,
            'can_anyone_invite': group.can_anyone_invite,
            'category': {
                'id': group.category.id,
                'name': group.category.name
            } if group.category else None,
            'location': str(group.location) if group.location else None,
            'website': group.website,
            'tags': group.tags,
            'rules': str(group.rules) if group.rules else None,
            'created_by': {
                'id': group.created_by.id if group.created_by else None,
                'username': group.created_by.username if group.created_by else None
            },
            'created_at': group.created_at,
            'updated_at': group.updated_at,
            'changes_applied': changes,
            'last_modified_by': request.user.username,
            'last_modified_at': timezone.now()
        }
        
        logger.info(
            f"✅ Group {group.id} - {group.name} updated successfully by {request.user.username}"
        )
        
        return Response({
            'status': 'success',
            'message': 'Group updated successfully',
            'data': response_data
        }, status=status.HTTP_200_OK)
        
    except Conversation.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Group not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error managing group {pk}: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error managing group: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_manage_groups(request):
    """
    Bulk operations on multiple groups.
    Admin only endpoint.
    
    Expected format:
    {
        "group_ids": [1, 2, 3],
        "action": "activate" | "deactivate" | "archive" | "delete",
        "data": {} // Optional data for the action
    }
    """
    try:
        data = request.data
        group_ids = data.get('group_ids', [])
        action = data.get('action')
        
        if not group_ids:
            return Response({
                'error': 'No group IDs provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not action:
            return Response({
                'error': 'No action specified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        results = {
            'success': [],
            'failed': []
        }
        
        with transaction.atomic():
            for group_id in group_ids:
                try:
                    group = Conversation.objects.get(pk=group_id, is_group=True)
                    
                    if action == 'activate':
                        group.is_active = True
                        group.save()
                        results['success'].append({
                            'id': group.id,
                            'name': str(group.name) if group.name else f"Group {group.id}",
                            'status': 'active'
                        })
                    
                    elif action == 'deactivate':
                        group.is_active = False
                        group.save()
                        results['success'].append({
                            'id': group.id,
                            'name': str(group.name) if group.name else f"Group {group.id}",
                            'status': 'inactive'
                        })
                    
                    elif action == 'archive':
                        group.is_active = False
                        group.is_visible = False
                        group.save()
                        results['success'].append({
                            'id': group.id,
                            'name': str(group.name) if group.name else f"Group {group.id}",
                            'status': 'archived'
                        })
                    
                    elif action == 'delete':
                        group_info = {
                            'id': group.id,
                            'name': str(group.name) if group.name else f"Group {group.id}",
                            'deleted_by': request.user.username
                        }
                        group.delete()
                        results['success'].append(group_info)
                    
                    else:
                        results['failed'].append({
                            'id': group_id,
                            'error': f'Unknown action: {action}'
                        })
                    
                except Conversation.DoesNotExist:
                    results['failed'].append({
                        'id': group_id,
                        'error': 'Group not found'
                    })
                except Exception as e:
                    results['failed'].append({
                        'id': group_id,
                        'error': str(e)
                    })
        
        return Response({
            'status': 'success',
            'message': f"{len(results['success'])} groups processed",
            'results': results
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in bulk group management: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Error in bulk operation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===========================================
# 3. GROUP ANALYTICS - Graphiques et statistiques
# ===========================================
# src/messaging/views.py - Partie GROUP ANALYTICS corrigée

# src/messaging/views.py - Version corrigée pour les statistiques géographiques

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_group_analytics(request):
    """
    Get comprehensive group analytics with multiple dimensions.
    Admin only endpoint.
    """
    try:
        # Get query parameters
        period = request.GET.get('period', 'month').lower()
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        group_type_filter = request.GET.get('group_type')
        country_filter = request.GET.get('country')
        category_filter = request.GET.get('category')
        
        # Set default date range (last 30 days)
        if not end_date:
            end_date = timezone.now().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        if not start_date:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        # Base queryset for groups - uniquement les groupes
        groups_queryset = Conversation.objects.filter(is_group=True)
        
        # Apply filters
        if group_type_filter:
            groups_queryset = groups_queryset.filter(group_type=group_type_filter)
        
        if country_filter:
            groups_queryset = groups_queryset.filter(
                participants__profile__country__icontains=country_filter
            ).distinct()
        
        if category_filter:
            groups_queryset = groups_queryset.filter(category_id=category_filter)
        
        # ===========================================
        # 1. TIME SERIES ANALYTICS - Group Creation
        # ===========================================
        trunc_map = {
            'day': TruncDay,
            'week': TruncWeek,
            'month': TruncMonth,
            'year': TruncYear
        }
        trunc_func = trunc_map.get(period, TruncMonth)
        
        creation_trends = groups_queryset.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).annotate(
            period_date=trunc_func('created_at')
        ).values('period_date').annotate(
            new_groups=Count('id'),
            public_groups=Count('id', filter=Q(group_type='group_public')),
            private_groups=Count('id', filter=Q(group_type='group_private')),
            active_groups=Count('id', filter=Q(is_active=True))
        ).order_by('period_date')
        
        # ===========================================
        # 2. GROUP TYPE DISTRIBUTION
        # ===========================================
        type_distribution = []
        for group_type in ['group_public', 'group_private']:
            groups = groups_queryset.filter(group_type=group_type)
            count = groups.count()
            if count > 0:
                # Calculer les moyennes séparément
                member_counts = groups.annotate(
                    member_count=Count('participants', distinct=True)
                ).values_list('member_count', flat=True)
                
                message_counts = groups.annotate(
                    message_count=Count('messages', distinct=True)
                ).values_list('message_count', flat=True)
                
                avg_members = sum(member_counts) / len(member_counts) if member_counts else 0
                avg_messages = sum(message_counts) / len(message_counts) if message_counts else 0
                
                type_distribution.append({
                    'group_type': group_type,
                    'display_name': dict(Conversation.GROUP_TYPE_CHOICES).get(group_type, group_type),
                    'count': count,
                    'total_members': groups.aggregate(total=Count('participants', distinct=True))['total'] or 0,
                    'total_messages': groups.aggregate(total=Count('messages', distinct=True))['total'] or 0,
                    'avg_members': round(avg_members, 2),
                    'avg_messages': round(avg_messages, 2),
                    'active_groups': groups.filter(is_active=True).count()
                })
        
        # ===========================================
        # 3. STATUS DISTRIBUTION
        # ===========================================
        status_distribution = []
        for is_active in [True, False]:
            groups = groups_queryset.filter(is_active=is_active)
            count = groups.count()
            if count > 0 or is_active:  # Inclure même si 0
                status_distribution.append({
                    'status': 'active' if is_active else 'inactive',
                    'count': count,
                    'total_members': groups.aggregate(total=Count('participants', distinct=True))['total'] or 0,
                    'total_messages': groups.aggregate(total=Count('messages', distinct=True))['total'] or 0
                })
        
        # ===========================================
        # 4. GROWTH METRICS
        # ===========================================
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        year_ago = today - timedelta(days=365)
        
        growth_metrics = {
            'today': {
                'new_groups': groups_queryset.filter(created_at__date=today).count(),
                'active_groups': groups_queryset.filter(is_active=True, created_at__date=today).count(),
                'new_members': GroupMember.objects.filter(group__in=groups_queryset, joined_at__date=today).count(),
                'new_messages': Message.objects.filter(conversation__in=groups_queryset, timestamp__date=today).count()
            },
            'yesterday': {
                'new_groups': groups_queryset.filter(created_at__date=yesterday).count(),
                'active_groups': groups_queryset.filter(is_active=True, created_at__date=yesterday).count()
            },
            'this_week': {
                'new_groups': groups_queryset.filter(created_at__date__gte=week_ago).count(),
                'active_groups': groups_queryset.filter(is_active=True, created_at__date__gte=week_ago).count()
            },
            'this_month': {
                'new_groups': groups_queryset.filter(created_at__date__gte=month_ago).count(),
                'active_groups': groups_queryset.filter(is_active=True, created_at__date__gte=month_ago).count()
            },
            'this_year': {
                'new_groups': groups_queryset.filter(created_at__date__gte=year_ago).count(),
                'active_groups': groups_queryset.filter(is_active=True, created_at__date__gte=year_ago).count()
            }
        }
        
        # ===========================================
        # 5. GEOGRAPHIC ANALYTICS - COUNTRIES
        # ===========================================
        # Récupérer tous les participants des groupes
        participants = User.objects.filter(
            group_memberships__group__in=groups_queryset
        ).distinct()
        
        # Statistiques par pays
        country_stats = participants.exclude(
            profile__country__isnull=True
        ).exclude(
            profile__country=''
        ).values('profile__country').annotate(
            country_name=F('profile__country'),
            total_users=Count('id', distinct=True),
            total_groups=Count('group_memberships__group', distinct=True),
            total_messages=Count('group_memberships__group__messages', distinct=True),
            active_users=Count('id', filter=Q(is_active=True), distinct=True)
        ).order_by('-total_users')[:20]
        
        # Nettoyer les données
        cleaned_country_stats = []
        for stat in country_stats:
            cleaned_country_stats.append({
                'country': stat['profile__country'],
                'total_users': stat['total_users'],
                'total_groups': stat['total_groups'],
                'total_messages': stat['total_messages'],
                'active_users': stat['active_users']
            })
        
        # ===========================================
        # 6. GEOGRAPHIC ANALYTICS - CITIES
        # ===========================================
        # Statistiques par ville
        city_stats = participants.exclude(
            profile__city__isnull=True
        ).exclude(
            profile__city=''
        ).values('profile__city', 'profile__country').annotate(
            city_name=F('profile__city'),
            country_name=F('profile__country'),
            total_users=Count('id', distinct=True),
            total_groups=Count('group_memberships__group', distinct=True),
            total_messages=Count('group_memberships__group__messages', distinct=True)
        ).order_by('-total_users')[:20]
        
        # Nettoyer les données
        cleaned_city_stats = []
        for stat in city_stats:
            cleaned_city_stats.append({
                'city': stat['profile__city'],
                'country': stat['profile__country'],
                'total_users': stat['total_users'],
                'total_groups': stat['total_groups'],
                'total_messages': stat['total_messages']
            })
        
        # ===========================================
        # 7. LOCATION STATS (pour la carte - basé sur le champ location du groupe)
        # ===========================================
        location_stats = groups_queryset.exclude(
            location__isnull=True
        ).exclude(
            location=''
        ).values('location').annotate(
            count=Count('id'),
            total_members=Count('participants', distinct=True),
            total_messages=Count('messages', distinct=True)
        ).order_by('-count')[:20]
        
        # ===========================================
        # 8. CATEGORY DISTRIBUTION
        # ===========================================
        category_stats = []
        categories = GroupCategory.objects.filter(
            groups__in=groups_queryset
        ).distinct()
        
        for category in categories:
            groups_in_category = groups_queryset.filter(category=category)
            count = groups_in_category.count()
            if count > 0:
                # Calculer la note moyenne
                avg_rating = GroupFeedback.objects.filter(
                    group__in=groups_in_category
                ).aggregate(avg=Coalesce(Avg('rating'), 0.0))['avg']
                
                category_stats.append({
                    'category_id': category.id,
                    'category_name': category.name,
                    'category_icon': category.icon,
                    'count': count,
                    'total_members': groups_in_category.aggregate(total=Count('participants', distinct=True))['total'] or 0,
                    'total_messages': groups_in_category.aggregate(total=Count('messages', distinct=True))['total'] or 0,
                    'avg_rating': round(avg_rating, 1)
                })
        
        category_stats = sorted(category_stats, key=lambda x: x['count'], reverse=True)[:20]
        
        # ===========================================
        # 9. ENGAGEMENT METRICS
        # ===========================================
        # Message activity over time
        message_activity = Message.objects.filter(
            conversation__in=groups_queryset,
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            conversation__is_group=True
        ).annotate(
            period_date=trunc_func('timestamp')
        ).values('period_date').annotate(
            total_messages=Count('id'),
            unique_senders=Count('sender', distinct=True),
            system_messages=Count('id', filter=Q(is_system_message=True)),
            user_messages=Count('id', filter=Q(is_system_message=False))
        ).order_by('period_date')
        
        # Member activity
        member_activity = GroupMember.objects.filter(
            group__in=groups_queryset,
            joined_at__date__gte=start_date,
            joined_at__date__lte=end_date
        ).annotate(
            period_date=trunc_func('joined_at')
        ).values('period_date').annotate(
            new_members=Count('id'),
            admins=Count('id', filter=Q(role__in=['admin', 'owner'])),
            moderators=Count('id', filter=Q(role='moderator'))
        ).order_by('period_date')
        
        # ===========================================
        # 10. TOP GROUPS
        # ===========================================
        top_groups = []
        for group in groups_queryset.annotate(
            member_count=Count('participants', distinct=True),
            message_count=Count('messages', distinct=True),
            feedback_count=Count('feedbacks', distinct=True)
        ).order_by('-member_count', '-message_count')[:10]:
            
            # Calculer la note moyenne
            avg_rating = GroupFeedback.objects.filter(
                group=group
            ).aggregate(avg=Coalesce(Avg('rating'), 0.0))['avg']
            
            # Calculer le score d'engagement
            engagement_score = (
                (group.member_count or 0) * 0.3 +
                (group.message_count or 0) * 0.4 +
                (group.feedback_count or 0) * 0.3
            )
            
            # Récupérer les top pays pour ce groupe
            group_countries = User.objects.filter(
                group_memberships__group=group
            ).exclude(
                profile__country__isnull=True
            ).exclude(
                profile__country=''
            ).values('profile__country').annotate(
                count=Count('id')
            ).order_by('-count')[:3]
            
            top_groups.append({
                'id': group.id,
                'name': str(group.name) if group.name else f"Group {group.id}",
                'group_type': group.group_type,
                'group_type_display': dict(Conversation.GROUP_TYPE_CHOICES).get(group.group_type, group.group_type),
                'member_count': group.member_count,
                'message_count': group.message_count,
                'join_requests_count': group.join_requests.filter(status='pending').count(),
                'avg_rating': round(avg_rating, 1),
                'engagement_score': round(engagement_score, 2),
                'is_active': group.is_active,
                'created_at': group.created_at,
                'top_countries': [
                    {'country': item['profile__country'], 'count': item['count']}
                    for item in group_countries
                ]
            })
        
        # ===========================================
        # 11. SUMMARY STATISTICS
        # ===========================================
        total_groups = groups_queryset.count()
        active_groups = groups_queryset.filter(is_active=True).count()
        inactive_groups = groups_queryset.filter(is_active=False).count()
        public_groups = groups_queryset.filter(group_type='group_public').count()
        private_groups = groups_queryset.filter(group_type='group_private').count()
        
        total_members = GroupMember.objects.filter(
            group__in=groups_queryset
        ).values('user').distinct().count()
        
        total_messages = Message.objects.filter(
            conversation__in=groups_queryset,
            conversation__is_group=True
        ).count()
        
        # Average members per group - calculé manuellement
        member_counts = groups_queryset.annotate(
            member_count=Count('participants', distinct=True)
        ).values_list('member_count', flat=True)
        avg_members_per_group = sum(member_counts) / len(member_counts) if member_counts else 0
        
        # Average messages per group - calculé manuellement
        message_counts = groups_queryset.annotate(
            msg_count=Count('messages', distinct=True)
        ).values_list('msg_count', flat=True)
        avg_messages_per_group = sum(message_counts) / len(message_counts) if message_counts else 0
        
        # ===========================================
        # 12. COMPARISON WITH PREVIOUS PERIOD
        # ===========================================
        previous_start = start_date - (end_date - start_date)
        
        previous_groups = Conversation.objects.filter(
            is_group=True,
            created_at__date__gte=previous_start,
            created_at__date__lt=start_date
        ).count()
        
        current_groups = groups_queryset.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).count()
        
        group_growth_rate = ((current_groups - previous_groups) / previous_groups * 100) if previous_groups > 0 else 0
        
        # ===========================================
        # 13. GROUP SIZE DISTRIBUTION
        # ===========================================
        group_sizes = []
        size_ranges = [
            {'min': 0, 'max': 10, 'label': '1-10 members'},
            {'min': 11, 'max': 50, 'label': '11-50 members'},
            {'min': 51, 'max': 100, 'label': '51-100 members'},
            {'min': 101, 'max': 500, 'label': '101-500 members'},
            {'min': 501, 'max': 1000, 'label': '501-1000 members'},
            {'min': 1001, 'max': 999999, 'label': '1000+ members'}
        ]
        
        for size_range in size_ranges:
            count = groups_queryset.annotate(
                member_count=Count('participants', distinct=True)
            ).filter(
                member_count__gte=size_range['min'],
                member_count__lte=size_range['max']
            ).count()
            
            group_sizes.append({
                'range': size_range['label'],
                'count': count,
                'percentage': (count / total_groups * 100) if total_groups > 0 else 0
            })
        
        # ===========================================
        # 14. RATING DISTRIBUTION
        # ===========================================
        rating_distribution = []
        for rating in range(1, 6):
            count = GroupFeedback.objects.filter(
                group__in=groups_queryset,
                rating=rating
            ).count()
            if count > 0:
                rating_distribution.append({
                    'rating': rating,
                    'count': count
                })
        
        # Build complete response
        response_data = {
            'status': 'success',
            'date_range': {
                'start_date': start_date,
                'end_date': end_date,
                'period': period
            },
            'summary': {
                'total_groups': total_groups,
                'active_groups': active_groups,
                'inactive_groups': inactive_groups,
                'public_groups': public_groups,
                'private_groups': private_groups,
                'total_members': total_members,
                'total_messages': total_messages,
                'avg_members_per_group': round(avg_members_per_group, 2),
                'avg_messages_per_group': round(avg_messages_per_group, 2),
                'group_growth_rate': round(group_growth_rate, 2),
                'active_rate': round((active_groups / total_groups * 100), 2) if total_groups > 0 else 0
            },
            'creation_trends': [
                {
                    'period': item['period_date'].strftime('%Y-%m-%d'),
                    'new_groups': item['new_groups'],
                    'public_groups': item['public_groups'],
                    'private_groups': item['private_groups'],
                    'active_groups': item['active_groups']
                }
                for item in creation_trends
            ],
            'message_activity': [
                {
                    'period': item['period_date'].strftime('%Y-%m-%d'),
                    'total_messages': item['total_messages'],
                    'unique_senders': item['unique_senders'],
                    'system_messages': item['system_messages'],
                    'user_messages': item['user_messages']
                }
                for item in message_activity
            ],
            'member_activity': [
                {
                    'period': item['period_date'].strftime('%Y-%m-%d'),
                    'new_members': item['new_members'],
                    'admins': item['admins'],
                    'moderators': item['moderators']
                }
                for item in member_activity
            ],
            'type_distribution': type_distribution,
            'status_distribution': status_distribution,
            'group_sizes': group_sizes,
            'country_stats': cleaned_country_stats,  # Changé de location_stats à country_stats
            'city_stats': cleaned_city_stats,        # Nouveau champ pour les villes
            'location_stats': [
                {
                    'location': item['location'],
                    'count': item['count'],
                    'total_members': item['total_members'],
                    'total_messages': item['total_messages']
                }
                for item in location_stats
            ],
            'category_stats': category_stats,
            'top_groups': top_groups,
            'rating_distribution': rating_distribution,
            'growth_metrics': growth_metrics
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error generating group analytics: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': f'Error generating group analytics: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)