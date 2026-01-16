from django.contrib.auth.models import AbstractUser
from django.db import models 

# models.py
from django.utils import timezone
from datetime import timedelta
from django.db import models


#here's the model for custom user 
class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'client'),
        ('admin','admin'),
    )
    role = models.CharField(max_length=10, choices = ROLE_CHOICES, default='client') 

class EmailVerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    purpose = models.CharField(max_length=20, default='email_verification')
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    class Meta:
        ordering = ['-created_at']

class UnverifiedUser(models.Model):
    """Stockage temporaire des utilisateurs non vérifiés"""
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Mot de passe hashé
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    verification_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    class Meta:
        ordering = ['-created_at']