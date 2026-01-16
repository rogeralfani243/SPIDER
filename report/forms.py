# forms.py
from django import forms
from django.core.exceptions import ValidationError
from .models import Report, ReportType, ReportAction

class ReportForm(forms.ModelForm):
    class Meta:
        model = Report
        fields = ['report_type', 'reason']
        widgets = {
            'report_type': forms.Select(attrs={
                'class': 'form-select',
                'id': 'report-type'
            }),
            'reason': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Décrivez la raison de votre signalement...',
                'id': 'report-reason'
            }),
        }
        labels = {
            'report_type': 'Type de signalement',
            'reason': 'Raison détaillée',
        }
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        self.content_object = kwargs.pop('content_object', None)
        super().__init__(*args, **kwargs)
        
        # Personnaliser les choix de type de signalement selon le contenu
        if self.content_object:
            if hasattr(self.content_object, 'user'):
                # C'est un profil
                self.fields['report_type'].choices = [
                    (ReportType.HARASSMENT, 'Harcèlement'),
                    (ReportType.INAPPROPRIATE, 'Profil inapproprié'),
                    (ReportType.FALSE_INFO, 'Fausse identité'),
                    (ReportType.OTHER, 'Autre'),
                ]

class ModeratorReportForm(forms.ModelForm):
    class Meta:
        model = Report
        fields = ['status', 'moderator_notes', 'action_taken']
        widgets = {
            'status': forms.Select(attrs={'class': 'form-select'}),
            'moderator_notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3
            }),
            'action_taken': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Décrivez les actions prises...'
            }),
        }

class ReportActionForm(forms.ModelForm):
    class Meta:
        model = ReportAction
        fields = ['action_type', 'description', 'duration_days']
        widgets = {
            'action_type': forms.Select(attrs={'class': 'form-select'}),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3
            }),
            'duration_days': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Durée en jours (optionnel)'
            }),
        }