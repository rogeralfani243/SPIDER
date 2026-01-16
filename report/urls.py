# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, ReportActionViewSet, QuickReportAPIView,CreateReportAPIView,CheckReportAPIView

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'report-actions', ReportActionViewSet, basename='report-action')

urlpatterns = [
      path('reports/', CreateReportAPIView.as_view(), name='create-report'),
    path('reports/quick/', QuickReportAPIView.as_view(), name='quick-report'),
    path('reports/check/', CheckReportAPIView.as_view(), name='check-report'),
    path('reports/my_reports/', ReportViewSet.as_view({'get': 'my_reports'}), name='my-reports'),
]