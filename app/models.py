from django.utils import timezone
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings 
from django.db.models.signals import post_save
from django.dispatch import receiver
from post.models import Post
from django.db.models import JSONField
from datetime import timedelta
User = get_user_model()
#here's the model for categories on posts
class Category(models.Model):           
    name = models.CharField(max_length=50, unique=True)
    def __str__(self):
        return self.name
    class Meta:
        verbose_name_plural = "Categories"

    
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True,blank=True, null=True)
    def __str__(self):
        return self.name
    

#here's the model for comments on posts
class Comment(models.Model):
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    like = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_comments', blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Comment by { self.user.username } on { self.post.title }"





#here's the model for custom user
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE,related_name='profile')
    bio = models.TextField(blank=True, null=True)
    image =  models.ImageField(upload_to='profilea/', blank=True, null=True)
    image_bio =  models.ImageField(upload_to='profile_bio/', blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)        # "123 Main Street"
    city = models.CharField(max_length=100, blank=True, null=True)           # "Salt Lake City"
    state = models.CharField(max_length=100, blank=True, null=True)          # "UT" ou "Utah"
    zip_code = models.CharField(max_length=20, blank=True, null=True)        # "84101"
    country = models.CharField(max_length=100, blank=True, null=True)        # "USA"
    birth_date = models.DateField(blank=True, null=True)
    social_links = JSONField(default=list, blank=True)
    # ManyToManyField does not support null=True; remove it.
    # followers: users who follow this profile
    phone = models.CharField(max_length=20, blank=True, null=True)
    followers = models.ManyToManyField(
        'self',
        related_name='following',
        symmetrical=False,
        blank=True
    )
    category = models.ForeignKey(Category, related_name='profile_categorie', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"Profile of { self.user.username } {self.category} "
  
    def get_followers_count(self):
        return self.followers.count()
    
    def get_following_count(self):
        return self.following.count()
    
    def is_following(self, profile):
        return self.following.filter(id=profile.id).exists()
    
    def follow(self, profile):
        if not self.is_following(profile):
            self.following.add(profile)
            return True
        return False
    
    def unfollow(self, profile):
        if self.is_following(profile):
            self.following.remove(profile)
            return True
        return False   
    def soft_delete(self):
        """Suppression douce du compte"""
        self.is_active = False
        self.deleted_at = timezone.now()
        # Désactiver aussi l'utilisateur
        self.user.is_active = False
        self.user.save()
        self.save()
    
    def hard_delete(self):
        """Suppression définitive (après période de grâce)"""
        self.user.delete()
        super().delete()

    def can_be_viewed_by(self, viewer):
        """
        Vérifie si le profil peut être vu par un utilisateur
        """
        from messaging.block_utils import BlockManager
        
        if self.user.id == viewer.id:
            return True
        
        can_view, message = BlockManager.can_view_profile(viewer.id, self.user.id)
        return can_view
    
    def get_block_status_with(self, other_user):
        """
        Retourne le statut de blocage avec un autre utilisateur
        """
        from messaging.block_utils import BlockManager
        return BlockManager.get_block_status(self.user.id, other_user.id)
    def create_default_opening_hours(self):
        """Crée des horaires d'ouverture par défaut pour une entreprise"""
        from .models import OpeningHours

        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

        for day in days:
            OpeningHours.objects.create(
                profile=self,
                day=day,
                open_time='09:00' if day not in ['saturday', 'sunday'] else '10:00',
                close_time='18:00' if day not in ['saturday', 'sunday'] else '17:00',
                is_closed=day in ['sunday']  # Fermé le dimanche par défaut
            )
            
    def get_opening_hours_for_day(self, day_name):
        """Retourne les horaires pour un jour spécifique"""
        try:
            return self.opening_hours.get(day=day_name.lower())
        except OpeningHours.DoesNotExist:
            return None
    
    def is_open_now(self):
        """Vérifie si l'établissement est ouvert maintenant"""
        from django.utils import timezone
        
        if not self.is_business:
            return False
        
        # Récupérer le jour actuel
        now = timezone.now()
        current_day = now.strftime('%A').lower()
        
        try:
            today_hours = self.opening_hours.get(day=current_day)
            return today_hours.is_open_now()
        except OpeningHours.DoesNotExist:
            return False
    
    def get_current_opening_hours(self):
        """Retourne les horaires d'aujourd'hui"""
        from django.utils import timezone
        
        now = timezone.now()
        current_day = now.strftime('%A').lower()
        
        try:
            return self.opening_hours.get(day=current_day)
        except OpeningHours.DoesNotExist:
            return None
    
    def get_formatted_opening_hours(self):
        """Retourne tous les horaires formatés pour l'affichage"""
        hours = self.opening_hours.all().order_by('day')
        formatted = []
        
        for hour in hours:
            formatted.append(str(hour))
        
        return formatted
#signal to create automaticly    
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created , **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try :
        instance.profile.save()
    except :
        Profile.objects.create(user=instance)

class DeletionCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

# Modèle pour stocker les codes de réinitialisation
class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    purpose = models.CharField(max_length=50, default='password_reset')  # 'password_reset' ou 'password_change'




# models.py - Ajoutez à votre fichier existant

class OpeningHours(models.Model):
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]
    
    DAY_ORDER = {
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
        'sunday': 7,
    }
    
    profile = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        related_name='opening_hours'
    )
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    open_time = models.TimeField(blank=True, null=True)
    close_time = models.TimeField(blank=True, null=True)
    is_closed = models.BooleanField(default=False)
    notes = models.CharField(max_length=200, blank=True, null=True)
    
    class Meta:
        ordering = ['day']
        unique_together = ['profile', 'day']
        verbose_name = 'Opening Hour'
        verbose_name_plural = 'Opening Hours'
    
    def __str__(self):
        if self.is_closed:
            return f"{self.get_day_display()}: Closed"
        return f"{self.get_day_display()}: {self.open_time.strftime('%H:%M') if self.open_time else ''} - {self.close_time.strftime('%H:%M') if self.close_time else ''}"
    
    def get_day_order(self):
        """Retourne l'ordre numérique du jour pour le tri"""
        return self.DAY_ORDER.get(self.day, 99)
    
    def is_open_now(self):
        """Vérifie si l'établissement est ouvert maintenant pour ce jour"""
        from django.utils import timezone
        import datetime
        
        # Vérifier si fermé aujourd'hui
        if self.is_closed:
            return False
        
        # Vérifier l'heure actuelle
        now = timezone.now()
        current_time = now.time()
        
        if self.open_time and self.close_time:
            return self.open_time <= current_time <= self.close_time
        
        return False