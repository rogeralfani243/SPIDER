from django.db import models
from django.contrib.auth.models import User  
from django.conf import settings
from django.utils import timezone
# profile/models.py (ou messaging/models.py)
from django.contrib.auth import get_user_model



class GroupCategory(models.Model):
    """Catégorie pour les groupes"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Group Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Conversation(models.Model):
    GROUP_TYPE_CHOICES = [
        ('private', 'Conversation Privée'),
        ('group_private', 'Groupe Privé'),
        ('group_public', 'Groupe Public'),
    ]
    
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_group = models.BooleanField(default=False)
    group_type = models.CharField(
        max_length=20, 
        choices=GROUP_TYPE_CHOICES, 
        default='private'
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    group_photo = models.ImageField(
        upload_to='group_photos/', 
        null=True, 
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_conversations'
    )
    is_active = models.BooleanField(default=True)
    max_participants = models.IntegerField(default=100)
    can_anyone_invite = models.BooleanField(default=True)
    
    # Nouveaux champs pour le système de groupes
    category = models.ForeignKey(
        GroupCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='groups'
    )
    requires_approval = models.BooleanField(default=True)
    is_visible = models.BooleanField(default=True)
    tags = models.JSONField(default=list, blank=True)  # Pour les mots-clés
    location = models.CharField(max_length=255, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    rules = models.TextField(blank=True, null=True)
    
    # Champs pour les statistiques
    total_members_joined = models.IntegerField(default=0)
    total_members_left = models.IntegerField(default=0)
    
    def __str__(self):
        if self.is_group:
            return f"{self.get_group_type_display()}: {self.name or f'Groupe {self.id}'}"
        else:
            participants = list(self.participants.all())
            if len(participants) == 2:
                return f"{participants[0].username} - {participants[1].username}"
            return f"Conversation {self.id}"
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['is_group', 'group_type']),
            models.Index(fields=['created_by']),
            models.Index(fields=['category']),
            models.Index(fields=['is_visible']),
        ]
    
    @property
    def current_members_count(self):
        """Nombre actuel de membres"""
        return self.participants.count()
    
    @property
    def available_spots(self):
        """Nombre de places disponibles"""
        return self.max_participants - self.current_members_count
    
    @property
    def is_full(self):
        """Vérifier si le groupe est plein"""
        return self.current_members_count >= self.max_participants
    def get_display_name(self, current_user):
        """Retourne le nom à afficher pour la conversation"""
        if self.is_group and self.name:
            return self.name
        
        if self.is_group:
            other_users = self.participants.exclude(id=current_user.id)
            names = [user.username for user in other_users]
            if len(names) > 2:
                return f"{', '.join(names[:2])} et {len(names)-2} autres"
            elif len(names) == 2:
                return f"{names[0]} et {names[1]}"
            elif len(names) == 1:
                return names[0]
            return "Groupe"
        
        # Conversation privée
        other_user = self.participants.exclude(id=current_user.id).first()
        if other_user:
            return other_user.username
        return "Conversation"
    def is_user_member(self, user):
        """Vérifier si un utilisateur est membre du groupe"""
        # Vérifier dans participants
        if self.participants.filter(id=user.id).exists():
            return True
        
        # Vérifier aussi dans GroupMember si le modèle existe
        if hasattr(self, 'member_info'):
            return self.member_info.filter(user=user).exists()
        
        return False
    def can_user_join(self, user):
        """Vérifie si un utilisateur peut rejoindre le groupe"""
        if not self.is_group:
            return False
        
        if self.group_type == 'group_private':
            # Groupe privé: seulement sur invitation
            return False
        
        if self.group_type == 'group_public':
            # Groupe public: tout le monde peut rejoindre
            return not self.is_user_member(user)
        
        return False
    
    def get_members_count(self):
        """Retourne le nombre de membres"""
        return self.participants.count()

class GroupJoinRequest(models.Model):
    """Demande d'adhésion à un groupe"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('cancelled', 'Annulé'),
    ]
    
    group = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='join_requests'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_join_requests'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_requests'
    )
    review_notes = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} → {self.group.name}: {self.get_status_display()}"
    
    def approve(self, reviewed_by=None, notes=None):
        """Approuver la demande"""
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by
        self.review_notes = notes
        self.save()
        
        # Ajouter l'utilisateur au groupe
        self.group.participants.add(self.user)
        
         # Announcement message
        Message.objects.create(
            conversation=self.group,
            sender=reviewed_by,
            content=f"{self.user.username} has joined the group (request approved)"
        )
        # Mettre à jour les statistiques
        self.group.total_members_joined += 1
        self.group.save()
    
    def reject(self, reviewed_by=None, notes=None):
        """Rejeter la demande"""
        self.status = 'rejected'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by
        self.review_notes = notes
        self.save()
    
    def cancel(self):
        """Annuler la demande"""
        self.status = 'cancelled'
        self.save()

class GroupFeedback(models.Model):
    """Feedback/avis sur un groupe avec système d'étoiles"""
    RATING_CHOICES = [
        (1, '1 étoile'),
        (2, '2 étoiles'),
        (3, '3 étoiles'),
        (4, '4 étoiles'),
        (5, '5 étoiles'),
    ]
    
    group = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_feedbacks'
    )
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_visible = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.group.name}: {self.rating}★"
    
    @property
    def average_rating(self):
        """Note moyenne du groupe"""
        ratings = self.group.feedbacks.filter(is_visible=True)
        if ratings.exists():
            return ratings.aggregate(models.Avg('rating'))['rating__avg']
        return 0
    
    @property
    def total_reviews(self):
        """Nombre total d'avis"""
        return self.group.feedbacks.filter(is_visible=True).count()
    
    @property
    def rating_distribution(self):
        """Distribution des notes"""
        ratings = self.group.feedbacks.filter(is_visible=True)
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating in ratings:
            distribution[rating.rating] += 1
        return distribution

class GroupMember(models.Model):
    """Informations supplémentaires sur les membres d'un groupe"""
    ROLE_CHOICES = [
        ('member', 'Membre'),
        ('moderator', 'Modérateur'),
        ('admin', 'Administrateur'),
        ('owner', 'Propriétaire'),
    ]
    
    group = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='member_info'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    is_banned = models.BooleanField(default=False)
    ban_reason = models.TextField(blank=True, null=True)
    ban_expires = models.DateTimeField(blank=True, null=True)
    permissions = models.JSONField(default=dict, blank=True)
    
    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.group.name} ({self.role})"
    
    def promote_to_moderator(self):
        """Promouvoir en modérateur"""
        self.role = 'moderator'
        self.save()
    
    def demote_to_member(self):
        """Rétrograder en membre"""
        self.role = 'member'
        self.save()
    
    def ban(self, reason=None, duration_days=None):
        """Bannir le membre"""
        self.is_banned = True
        self.ban_reason = reason
        if duration_days:
            self.ban_expires = timezone.now() + timezone.timedelta(days=duration_days)
        self.save()
    
    def unban(self):
        """Débannir le membre"""
        self.is_banned = False
        self.ban_reason = None
        self.ban_expires = None
        self.save()

# Le reste du modèle Message reste inchangé
# ...


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,  # CORRECTION: C'est Conversation, pas User
        on_delete=models.CASCADE,
        related_name='messages'  # Changé de 'message' à 'messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    # Optionnel: ajouter pour les médias
    image = models.ImageField(upload_to='messages/images/', null=True, blank=True)
    file = models.FileField(upload_to='messages/files/', null=True, blank=True)
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('user', 'User Message'),
            ('system', 'System Message'),
        ],
        default='user'
    )
    is_system_message = models.BooleanField(default=False)
    system_message_type = models.CharField(max_length=50, null=True, blank=True)
    deleted_for_sender = models.BooleanField(default=False)
    deleted_for_receiver = models.BooleanField(default=False)
    deleted_for_everyone = models.BooleanField(default=False)
    def __str__(self):
        if self.content:
            return f"{self.sender.username}: {self.content[:30]}"
        elif self.image:
            return f"{self.sender.username}: [Image]"
        elif self.file:
            return f"{self.sender.username}: [Fichier]"
        return f"{self.sender.username}: [Message sans texte]"
    class Meta: 
        ordering = ['timestamp']  # Correction de l'orthographe
        indexes = [
            models.Index(fields=['conversation', 'timestamp']),
            models.Index(fields=['sender', 'timestamp']),
        ]
    
    def save(self, *args, **kwargs):
        # Mettre à jour updated_at de la conversation
        if self.conversation:
            self.conversation.updated_at = timezone.now()
            self.conversation.save()
        super().save(*args, **kwargs)
User = get_user_model()

class UserOnlineStatus(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='online_status'
    )
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)
    last_activity = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'User Online Status'
        verbose_name_plural = 'User Online Statuses'
    
    def __str__(self):
        return f"{self.user.username} - {'Online' if self.is_online else 'Offline'}"
    
    def update_activity(self):
        """Mettre à jour le timestamp de dernière activité"""
        self.last_activity = timezone.now()
        self.save()


# messaging/models.py
class GroupBlock(models.Model):
    """
    Prevent users from joining groups after being removed by admin
    """
    group = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='group_blocks'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='group_blocks'
    )
    blocked_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='blocked_users_group'
    )
    reason = models.TextField(blank=True, null=True)
    blocked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    can_ever_join_again = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        unique_together = ['group', 'user']
        verbose_name = 'Group Block'
        verbose_name_plural = 'Group Blocks'
    
    def __str__(self):
        return f"{self.user.username} blocked from {self.group.name}"
    
    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @property
    def is_blocked(self):
        return self.is_active and not self.is_expired
    


# models.py (ajoutez ces classes à la fin du fichier)

class Block(models.Model):
    """
    Modèle pour bloquer un utilisateur
    """
    BLOCK_TYPES = [
  ('user', 'Block User'),
        ('profile', 'Block Profile '),
        ('both', 'Block Both'),
    ]
    
    blocker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_users'
    )
    blocked = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_by_users'
    )
    block_type = models.CharField(
        max_length=20,
        choices=BLOCK_TYPES,
        default='both'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    
    # Pour les statistiques et métadonnées
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['blocker', 'blocked']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['blocker', 'blocked', 'is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.blocker.username} bloque {self.blocked.username}"
    
    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def is_blocking(self):
        """Vérifie si le blocage est actif"""
        return self.is_active and not self.is_expired


class BlockSettings(models.Model):
    """
    Paramètres de blocage pour un utilisateur
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='block_settings'
    )
    
    # Paramètres de confidentialité
    hide_profile_from_blocked = models.BooleanField(default=True)
    hide_online_status_from_blocked = models.BooleanField(default=True)
    hide_last_seen_from_blocked = models.BooleanField(default=True)
    
    # Notifications
    notify_on_block = models.BooleanField(default=True)
    notify_on_unblock = models.BooleanField(default=True)
    
    # Comportement automatique
    auto_block_spam_users = models.BooleanField(default=False)
    spam_report_threshold = models.IntegerField(default=3)
    
    # Restrictions
    max_blocks_allowed = models.IntegerField(default=100)
    block_duration_default = models.IntegerField(
        default=0,  # 0 = permanent
        help_text="Durée par défaut en jours (0 = permanent)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Paramètres de blocage pour {self.user.username}"
    
    @property
    def blocks_count(self):
        return self.user.blocked_users.filter(is_active=True).count()
    
    @property
    def blocked_by_count(self):
        return self.user.blocked_by_users.filter(is_active=True).count()
    
    def can_block_more(self):
        return self.blocks_count < self.max_blocks_allowed


class BlockHistory(models.Model):
    """
    Historique des actions de blocage/déblocage
    """
    ACTION_CHOICES = [
        ('block', 'Blocage'),
        ('unblock', 'Déblocage'),
        ('auto_block', 'Blocage Automatique'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='block_actions'
    )
    target_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='block_target_actions'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.TextField(blank=True, null=True)
    duration_days = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Métadonnées
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'action', 'created_at']),
            models.Index(fields=['target_user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} {self.action} {self.target_user.username}"