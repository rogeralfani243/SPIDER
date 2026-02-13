from django.shortcuts import render
# views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import timedelta

from .models import Report, ReportAction, ReportStatus, ReportType, ContentType
from .serializers import (
    ReportSerializer, ReportActionSerializer, 
    ReportStatsSerializer, QuickReportSerializer, MyReportsSerializer
)

class IsModerator(permissions.BasePermission):
    """Permission personnalisée pour les modérateurs"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False 
        return request.user.groups.filter(name='Moderators').exists() or request.user.is_staff

class IsOwnerOrModerator(permissions.BasePermission):
    """Permission pour propriétaire ou modérateur"""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.groups.filter(name='Moderators').exists():
            return True
        return obj.reporter == request.user

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'report_type', 'content_type']
    search_fields = ['reason', 'moderator_notes', 'reporter__username']
    ordering_fields = ['created_at', 'updated_at', 'id']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """Permissions selon l'action"""
        if self.action in ['create', 'my_reports', 'check']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['destroy', 'update', 'partial_update']:
            permission_classes = [IsOwnerOrModerator]
        else:
            permission_classes = [IsModerator]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filtre le queryset selon les permissions"""
        user = self.request.user
        
        if not user.is_authenticated:
            return Report.objects.none()
        
        # Modérateurs voient tout
        if user.groups.filter(name='Moderators').exists() or user.is_staff:
            queryset = Report.objects.all()
        else:
            # Utilisateurs normaux voient seulement leurs signalements
            queryset = Report.objects.filter(reporter=user)
        
        # Préchargement pour optimisation
        queryset = queryset.select_related(
            'reporter', 'reviewed_by',
            'message', 'post', 'comment', 'profile', 'feedback'
        ).prefetch_related('actions')
        
        return queryset
    
    def perform_create(self, serializer):
        """Sauvegarde avec l'utilisateur courant"""
        serializer.save()
    

    def get_serializer_class(self):
        """Utilise différents serializers selon l'action"""
        if self.action == 'my_reports':
            return MyReportsSerializer  # <-- Utilisez le serializer simplifié
        return ReportSerializer
    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Signalements de l'utilisateur courant - version simplifiée"""
        try:
            # Utilisez select_related pour optimiser les requêtes
            reports = Report.objects.filter(
                reporter=request.user
            ).select_related('reviewed_by').order_by('-created_at')
            
            # Pagination
            page = self.paginate_queryset(reports)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(reports, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error in my_reports: {str(e)}")
            return Response(
                {'error': 'Failed to load reports', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsModerator])
    def stats(self, request):
        """Statistiques pour le tableau de bord"""
        # Comptes totaux
        total = Report.objects.count()
        pending = Report.objects.filter(status=ReportStatus.PENDING).count()
        under_review = Report.objects.filter(status=ReportStatus.UNDER_REVIEW).count()
        resolved = Report.objects.filter(status=ReportStatus.RESOLVED).count()
        dismissed = Report.objects.filter(status=ReportStatus.DISMISSED).count()
        
        # Par type de signalement
        by_type = Report.objects.values('report_type').annotate(
            count=Count('id')
        ).order_by('-count')
        by_type_dict = {item['report_type']: item['count'] for item in by_type}
        
        # Par type de contenu
        by_content = Report.objects.values('content_type').annotate(
            count=Count('id')
        ).order_by('-count')
        by_content_dict = {item['content_type']: item['count'] for item in by_content}
        
        # Activité récente
        now = timezone.now()
        recent_week = Report.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count()
        recent_day = Report.objects.filter(
            created_at__gte=now - timedelta(days=1)
        ).count()
        
        stats = {
            'total': total,
            'pending': pending,
            'under_review': under_review,
            'resolved': resolved,
            'dismissed': dismissed,
            'by_type': by_type_dict,
            'by_content': by_content_dict,
            'recent_week': recent_week,
            'recent_day': recent_day,
        }
        
        serializer = ReportStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsModerator])
    def update_status(self, request, pk=None):
        """Mettre à jour le statut d'un signalement"""
        report = self.get_object()
        serializer = ReportSerializer(report, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Si le statut est résolu ou rejeté, enregistrer le modérateur
            new_status = serializer.validated_data.get('status')
            if new_status in [ReportStatus.RESOLVED, ReportStatus.DISMISSED]:
                serializer.validated_data['reviewed_by'] = request.user
                serializer.validated_data['reviewed_at'] = timezone.now()
            
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsModerator])
    def take_action(self, request, pk=None):
        """Prendre une action sur un signalement"""
        report = self.get_object()
        
        # Créer l'action
        action_data = {
            'report_id': report.id,
            'action_type': request.data.get('action_type'),
            'description': request.data.get('description'),
            'duration_days': request.data.get('duration_days'),
        }
        
        action_serializer = ReportActionSerializer(
            data=action_data,
            context={'request': request}
        )
        
        if action_serializer.is_valid():
            action = action_serializer.save(moderator=request.user)
            
            # Mettre à jour le statut du report
            report.status = ReportStatus.RESOLVED
            report.action_taken = action.description
            report.reviewed_by = request.user
            report.reviewed_at = timezone.now()
            report.save()
            
            # Appliquer l'action sur le contenu
            self._apply_content_action(report, action)
            
            return Response({
                'report': ReportSerializer(report, context={'request': request}).data,
                'action': action_serializer.data
            })
        
        return Response(action_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _apply_content_action(self, report, action):
        """Appliquer l'action sur le contenu signalé"""
        content = report.get_reported_content()
        if not content:
            return
        
        if action.action_type == 'delete':
            content.delete()
        elif action.action_type == 'edit':
            # Marquer comme édité par modération
            if hasattr(content, 'moderated'):
                content.moderated = True
                content.save()
        elif action.action_type in ['warn', 'suspend', 'ban']:
            author = report.get_content_author()
            if author:
                # Ici vous pourriez créer un système d'avertissements
                pass
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Vérifier si un contenu a déjà été signalé par l'utilisateur"""
        content_type = request.query_params.get('content_type')
        content_id = request.query_params.get('content_id')
        
        if not content_type or not content_id:
            return Response(
                {'error': 'Les paramètres content_type et content_id sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exists = Report.objects.filter(
            reporter=request.user,
            content_type=content_type,
            content_id=content_id
        ).exists()
        
        return Response({'exists': exists})

class ReportActionViewSet(viewsets.ModelViewSet):
    serializer_class = ReportActionSerializer
    permission_classes = [IsModerator]
    queryset = ReportAction.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        report_id = self.request.query_params.get('report_id')
        
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        
        return queryset.select_related('moderator', 'report')

# views.py - QuickReportAPIView corrigée
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class QuickReportAPIView(APIView):
    """API for quick reporting"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = QuickReportSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            data = serializer.validated_data
            content_type = data['content_type']
            content_id = data['content_id']
            report_type = data['report_type']
            content = data['content']
            
            # Check if report already exists
            existing = Report.objects.filter(
                reporter=request.user,
                content_type=content_type,
                content_id=content_id
            ).first()
            
            if existing:
                # Update existing report
                existing.report_type = report_type
                existing.status = ReportStatus.PENDING
                existing.save()
                
                # Return simplified response
                return Response({
                    'id': existing.id,
                    'message': 'Report updated successfully',
                    'content_type': content_type,
                    'content_id': content_id,
                    'report_type': report_type,
                    'status': existing.status,
                    'created_at': existing.created_at,
                }, status=status.HTTP_200_OK)
            
            # Create new report - version simplifiée sans ForeignKey
            report_data = {
                'reporter': request.user,
                'content_type': content_type,
                'content_id': content_id,
                'report_type': report_type,
                'status': ReportStatus.PENDING,
            }
            
            # Assign the appropriate content object based on type
            if content_type == ContentType.MESSAGE:
                report_data['message_id'] = content_id
            elif content_type == ContentType.POST:
                report_data['post_id'] = content_id
            elif content_type == ContentType.COMMENT:
                report_data['comment_id'] = content_id
            elif content_type == ContentType.PROFILE:
                report_data['profile_id'] = content_id
            elif content_type == ContentType.FEEDBACK:
                report_data['feedback_id'] = content_id
            elif content_type == ContentType.CONVERSATION:
                report_data['conversation_id'] = content_id
            
            
            report = Report.objects.create(**report_data)
            
            # Return simplified response
            return Response({
                'id': report.id,
                'message': 'Report created successfully',
                'content_type': content_type,
                'content_id': content_id,
                'report_type': report_type,
                'status': report.status,
                'created_at': report.created_at,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
# Dans views.py
class CheckReportAPIView(APIView):
    """API dédiée pour vérifier les signalements"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            content_type = request.query_params.get('content_type')
            content_id = request.query_params.get('content_id')
            
            if not content_type or not content_id:
                return Response(
                    {'error': 'content_type and content_id are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valider le content_type
            valid_types = [choice[0] for choice in ContentType.choices]
            if content_type not in valid_types:
                return Response(
                    {'error': f'Invalid content_type. Valid: {valid_types}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valider le content_id
            try:
                content_id = int(content_id)
                if content_id <= 0:
                    raise ValueError
            except ValueError:
                return Response(
                    {'error': 'content_id must be a positive integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier l'existence
            exists = Report.objects.filter(
                reporter=request.user,
                content_type=content_type,
                content_id=content_id
            ).exists()
            
            return Response({
                'exists': exists,
                'content_type': content_type,
                'content_id': content_id
            })
            
        except Exception as e:
            return Response(
                {'error': f'Server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class CreateReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print("=== CREATE REPORT API ===")
        print(f"User: {request.user}")
        print(f"Data: {request.data}")
        
        try:
            data = request.data
            
            # Données requises
            content_type = data.get('content_type')
            content_id = data.get('content_id')
            report_type = data.get('report_type')
            
            if not all([content_type, content_id, report_type]):
                return Response(
                    {'error': 'content_type, content_id, and report_type are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Processing: {content_type} #{content_id}, type: {report_type}")
            
            # VÉRIFIER SI L'OBJET CONTENT EXISTE
            content_exists = self._check_content_exists(content_type, content_id)
            if not content_exists:
                return Response(
                    {'error': f'{content_type} with id {content_id} does not exist'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier si un report existe déjà
            existing_report = Report.objects.filter(
                reporter=request.user,
                content_type=content_type,
                content_id=content_id
            ).first()
            
            if existing_report:
                # Mettre à jour le report existant
                existing_report.report_type = report_type
                existing_report.reason = data.get('reason', '')
                existing_report.status = ReportStatus.PENDING
                existing_report.save()
                
                print(f"Updated existing report: {existing_report.id}")
                
                return Response({
                    'success': True,
                    'message': 'Report updated successfully',
                    'report_id': existing_report.id,
                }, status=status.HTTP_200_OK)
            
            # Créer un nouveau report
            report_data = {
                'reporter': request.user,
                'content_type': content_type,
                'content_id': content_id,
                'report_type': report_type,
                'reason': data.get('reason', ''),
                'status': ReportStatus.PENDING,
            }
            
            # Assigner la ForeignKey uniquement si l'objet existe
            # Utilisez la méthode sécurisée pour éviter l'erreur
            if content_type == 'feedback':
                try:
                    from feedback.models import Feedback
                    feedback_obj = Feedback.objects.get(id=content_id)
                    report_data['feedback'] = feedback_obj
                    print(f"Assigned feedback object: {feedback_obj.id}")
                except Feedback.DoesNotExist:
                    # Ne pas assigner la ForeignKey si l'objet n'existe pas
                    print(f"Warning: Feedback {content_id} does not exist, skipping ForeignKey")
            
            # Même chose pour les autres types
            elif content_type == 'post':
                try:
                    from post.models import Post
                    post_obj = Post.objects.get(id=content_id)
                    report_data['post'] = post_obj
                except Post.DoesNotExist:
                    print(f"Warning: Post {content_id} does not exist")
            
            # Créer le report
            report = Report.objects.create(**report_data)
            
            print(f"Created new report: {report.id}")
            
            return Response({
                'success': True,
                'message': 'Report created successfully',
                'report_id': report.id,
                'content_type': report.content_type,
                'content_id': report.content_id,
                'report_type': report.report_type,
                'created_at': report.created_at.isoformat() if report.created_at else None,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response({
                'error': str(e),
                'detail': 'An error occurred while creating the report'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _check_content_exists(self, content_type, content_id):
        """Vérifie si le contenu signalé existe réellement"""
        try:
            if content_type == 'feedback':
                from feedback.models import Feedback
                return Feedback.objects.filter(id=content_id).exists()
            elif content_type == 'post':
                from post.models import Post
                return Post.objects.filter(id=content_id).exists()
            elif content_type == 'comment':
                from comment_post.models import Comment
                return Comment.objects.filter(id=content_id).exists()
            elif content_type == 'message':
                from messaging.models import Message
                return Message.objects.filter(id=content_id).exists()
            elif content_type == 'profile':
                from app.models import Profile
                return Profile.objects.filter(id=content_id).exists()
            return True  # Pour les types non vérifiés, assume qu'ils existent
        except ImportError:
            print(f"Warning: Could not import model for {content_type}")
            return True  # Assume qu'il existe pour éviter de bloquer