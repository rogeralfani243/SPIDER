from django.db import models
from django.conf import settings 
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
import re
from django.utils import timezone   
#here's the model for categories on posts
class Category(models.Model):           
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, 
                              related_name='subcategories', 
                              blank=True, null=True,
                              verbose_name="Catégorie parente")
    
    # Champ pour l'ordre d'affichage
    order = models.IntegerField(default=0, help_text="Ordre d'affichage")
    
    # Champ pour savoir si c'est une catégorie active
    is_active = models.BooleanField(default=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True,null=True)
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    def get_full_path(self):
        """Retourne le chemin complet de la catégorie"""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name
    
    def get_image_url(self):
        """Retourne l'URL de l'image ou None"""
        if self.image and hasattr(self.image, 'url'):
            return self.image.url
        return None
    
    def has_subcategories(self):
        """Vérifie si la catégorie a des sous-catégories"""
        return self.subcategories.filter(is_active=True).exists()
    
    def get_active_subcategories(self):
        """Retourne les sous-catégories actives"""
        return self.subcategories.filter(is_active=True).order_by('order', 'name')
    
    def save(self, *args, **kwargs):
        # S'assurer que le nom est en minuscules pour l'unicité
        self.name = self.name.lower().strip()
        
        # Vérifier qu'une catégorie n'est pas sa propre parente
        if self.parent and self.parent == self:
            self.parent = None
        
        # Vérifier les cycles dans l'arborescence
        if self.parent:
            current = self.parent
            while current:
                if current == self:
                    self.parent = None
                    break
                current = current.parent
        
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['order', 'name']
        unique_together = ['name', 'parent']  # Empêche les doublons dans la même hiérarchie
# Modèle pour les tags
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, blank=True, null=True)
    def __str__(self):
        return self.name
    
#here's the model for creatingosts
class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    average_rating = models.FloatField(default=0.0)
    total_ratings = models.IntegerField(default=0)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.ForeignKey(Category, related_name='post_categorie', on_delete=models.CASCADE, blank=False)
    mentions = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='mentions_in_posts', blank=True)
    
    # ✅ AJOUTEZ CETTE RELATION MANQUANTE
    tags = models.ManyToManyField('Tag', related_name='posts', blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.extract_mentions_and_tags()

    def extract_mentions_and_tags(self):
        mention_pattern = r'@(\w+)'
        mentioned_usernames = re.findall(mention_pattern, self.content)
    
        User = get_user_model()
        users = User.objects.filter(username__in=mentioned_usernames)
        self.mentions.set(users)

        # ✅ AJOUTEZ L'EXTRACTION DES TAGS SI BESOIN
        tag_pattern = r'#(\w+)'
        tag_names = re.findall(tag_pattern, self.content)
        
        tags = []
        for tag_name in tag_names:
            tag, created = Tag.objects.get_or_create(name=tag_name.lower())
            tags.append(tag)
        
        self.tags.set(tags)
    
    def __str__(self):
        return f"{self.title} by {self.user.username} {self.id} "
    
class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_images')
    image = models.ImageField(upload_to='posts/images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'uploaded_at']
    
    def __str__(self):
        return f"Image for Post #{self.post.id}"

# Model for storing various file types
class PostFile(models.Model):
    FILE_TYPE_CHOICES = [
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('document', 'Document'),
        ('other', 'Other'),
    ]
    
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='post_files')
    file = models.FileField(upload_to='post_files/%Y/%m/%d/')
    name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='other')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.name and self.file:
            self.name = self.file.name
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_file_type_display()}: {self.name or self.file.name}"




# models.py - Ajoutez ces modèles

class PostView(models.Model):
    """
    Suivi des vues des posts par les utilisateurs
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_views')
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'post']
        ordering = ['-viewed_at']

class UserInteraction(models.Model):
    """
    Stockage des interactions utilisateur pour l'algorithme
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(
        max_length=20,
        choices=[
            ('view', 'Vue'),
            ('user_rating', 'User_rating'),
            ('comment', 'Commentaire'),
            ('rating', 'Note'),
            ('share', 'Partage'),
            ('save', 'Sauvegarde')
        ]
    )
    value = models.FloatField(null=True, blank=True)  # Pour les notes, durée de vue, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'interaction_type']),
            models.Index(fields=['post', 'interaction_type']),
        ]




# models.py - Modèles pour le système de publicité

class AdCampaign(models.Model):
    """
    Campagne publicitaire pour un utilisateur
    """
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('active', 'Active'),
        ('paused', 'En pause'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ad_campaigns')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Durée de la campagne
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Paramètres de ciblage
    target_categories = models.ManyToManyField(Category, blank=True, related_name='ad_campaigns')
    target_tags = models.ManyToManyField(Tag, blank=True, related_name='ad_campaigns')
    
    # Priorité (plus élevé = plus prioritaire)
    priority = models.IntegerField(default=1, choices=[
        (1, 'Normal'),
        (2, 'Élevée'),
        (3, 'Très élevée'),
    ])
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Métriques
    impressions = models.IntegerField(default=0)  # Nombre de fois affiché
    clicks = models.IntegerField(default=0)       # Nombre de clics
    conversions = models.IntegerField(default=0)  # Interactions (likes, commentaires, etc.)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"
    
    def is_active(self):
        now = timezone.now()
        return (
            self.status == 'active' and 
            self.start_date <= now <= self.end_date and
            self.budget > self.spent
        )
    
    def remaining_budget(self):
        return self.budget - self.spent
    
    def update_spent(self, amount):
        """Mettre à jour le budget dépensé"""
        self.spent += amount
        self.save(update_fields=['spent', 'updated_at'])


class SponsoredPost(models.Model):
    """
    Post sponsorisé (publicité)
    """
    POST_TYPE_CHOICES = [
        ('standard', 'Post standard'),
        ('premium', 'Post premium'),
        ('featured', 'Post en vedette'),
        ('spotlight', 'Post spotlight'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('failed', 'Échoué'),
        ('refunded', 'Remboursé'),
    ]
    
    # Référence au post original
    original_post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='sponsored_post')
    
    # Référence à la campagne
    campaign = models.ForeignKey(AdCampaign, on_delete=models.CASCADE, related_name='sponsored_posts')
    
    # Type de post sponsorisé
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES, default='standard')
    
    # Prix et paiement
    price = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Durée de la promotion
    boost_start = models.DateTimeField()
    boost_end = models.DateTimeField()
    
    # Paramètres de boost
    boost_multiplier = models.FloatField(default=1.0, help_text="Multiplicateur de visibilité")
    always_on_top = models.BooleanField(default=False, help_text="Toujours afficher en haut")
    featured_in_feed = models.BooleanField(default=True, help_text="Afficher dans le flux principal")
    featured_in_category = models.BooleanField(default=False, help_text="Afficher en vedette dans la catégorie")
    
    # Statistiques
    boosted_views = models.IntegerField(default=0)
    boosted_clicks = models.IntegerField(default=0)
    boosted_engagement = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-boost_multiplier', '-created_at']
    
    def __str__(self):
        return f"Sponsored: {self.original_post.title}"
    
    def is_active(self):
        now = timezone.now()
        return (
            self.payment_status == 'paid' and
            self.boost_start <= now <= self.boost_end and
            self.campaign.is_active()
        )
    
    def days_remaining(self):
        if not self.is_active():
            return 0
        remaining = self.boost_end - timezone.now()
        return max(0, remaining.days)
    
    def record_view(self, user):
        """Enregistrer une vue boostée"""
        if self.is_active():
            self.boosted_views += 1
            self.campaign.impressions += 1
            self.save(update_fields=['boosted_views', 'updated_at'])
            self.campaign.save(update_fields=['impressions'])
