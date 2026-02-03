from django.db import models
from django.contrib.auth.models import User  
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
import hashlib
import json
import secrets

# Importez vos champs personnalisés
from .encrypted_fields import EncryptedTextField, EncryptedCharField, EncryptedJSONField

User = get_user_model()

def encrypt(field):
    """Fonction helper pour encrypter différents types de champs"""
    if isinstance(field, models.TextField):
        return EncryptedTextField(
            blank=field.blank,
            null=field.null,
            help_text=field.help_text if hasattr(field, 'help_text') else None
        )
    elif isinstance(field, models.CharField):
        return EncryptedCharField(
            max_length=field.max_length,
            blank=field.blank,
            null=field.null,
            help_text=field.help_text if hasattr(field, 'help_text') else None
        )
    elif isinstance(field, models.JSONField):
        return EncryptedJSONField(
            default=field.default,
            blank=field.blank,
            null=field.null,
            help_text=field.help_text if hasattr(field, 'help_text') else None
        )
    else:
        # Par défaut, utiliser EncryptedTextField
        return EncryptedTextField(
            blank=getattr(field, 'blank', False),
            null=getattr(field, 'null', False),
            help_text=getattr(field, 'help_text', None)
        )


class GroupCategory(models.Model):
    """Catégorie pour les groupes"""
    name = models.CharField(max_length=100, unique=True)
    description = EncryptedTextField(blank=True)  # Encrypté directement
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
    # CORRECTION: Utiliser directement les champs encryptés
    name = EncryptedCharField(max_length=255, blank=True, null=True)  # Encrypté
    description = EncryptedTextField(blank=True, null=True)  # Encrypté
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
    # CORRECTION: Pour JSONField, utiliser directement EncryptedJSONField
    tags = models.JSONField( blank=True, null=True)
    location = EncryptedCharField(max_length=255, blank=True, null=True)  # Encrypté
    website = models.URLField(blank=True, null=True)  # Pas besoin d'encrypter les URLs
    rules = EncryptedTextField(blank=True, null=True)  # Encrypté
    
    # Champs pour les statistiques (non encryptés)
    total_members_joined = models.IntegerField(default=0)
    total_members_left = models.IntegerField(default=0)
    
    # Champs d'intégrité
    content = models.CharField(max_length=64, blank=True)
    
    def __str__(self):
        if self.is_group:
            return f"{self.get_group_type_display()}: Group {self.id}"
        else:
            participants = list(self.participants.all())
            if len(participants) == 2:
                return f"Private: {participants[0].id} - {participants[1].id}"
            return f"Conversation {self.id}"
    
    def save(self, *args, **kwargs):
        """Calculate content hash for integrity verification"""
        if self.name or self.description:
            content_to_hash = f"{self.name}{self.description}{self.tags}"
            self.content = hashlib.sha256(content_to_hash.encode()).hexdigest()
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['is_group', 'group_type']),
            models.Index(fields=['created_by']),
            models.Index(fields=['category']),
            models.Index(fields=['is_visible']),
        ]
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
    @property
    def current_members_count(self):
        return self.participants.count()
    
    @property
    def available_spots(self):
        return self.max_participants - self.current_members_count
    
    @property
    def is_full(self):
        return self.current_members_count >= self.max_participants
    
    def get_display_name(self, current_user):
        """Decrypt name for display"""
        try:
            if self.is_group and self.name:
                return str(self.name)  # Le champ encrypté se décrypte automatiquement
        except:
            pass
        
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
        
        other_user = self.participants.exclude(id=current_user.id).first()
        if other_user:
            return other_user.username
        return "Conversation"


import secrets

def default_encryption_nonce():
    """Fonction pour générer un nonce par défaut"""
    return secrets.token_hex(16)


class Message(models.Model):
    """
    Modèle principal pour les messages avec encryption
    """
    MESSAGE_TYPES = [
        ('TEXT', 'Texte'),
        ('IMAGE', 'Image'),
        ('FILE', 'Fichier'),
        ('SYSTEM', 'Message système'),
    ]
    
    # Relations (garder les mêmes noms que l'ancien modèle)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    
    # Champ principal (anciennement 'content', maintenant encrypté)
    encrypted_content = EncryptedTextField(
        blank=True,
        null=True,
        help_text="Contenu du message encrypté"
    )
    
    # Métadonnées encryptées
    metadata = EncryptedJSONField(
        default=dict,
        help_text="Métadonnées encryptées (type, taille, etc.)"
    )
    
    # Pour l'intégrité
    content_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="Hash SHA-256 du contenu décrypté"
    )
    
    # IV/Nonce pour l'encryption (stocké en clair)
    encryption_nonce = models.CharField(
        max_length=32,
        default=default_encryption_nonce,
        help_text="Nonce utilisé pour l'encryption AES-GCM"
    )
    
    # Clé de session encryptée (pour E2E)
    encrypted_session_key = EncryptedTextField(
        blank=True,
        help_text="Clé de session encryptée avec la clé publique du destinataire"
    )
    
    # Type de message - Compatibilité avec ancien et nouveau
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('user', 'User Message'),
            ('system', 'System Message'),
            ('TEXT', 'Texte'),           # Nouveaux types
            ('IMAGE', 'Image'),
            ('FILE', 'Fichier'),
            ('SYSTEM', 'Message système'),
        ],
        default='user'
    )
    
    # Fichiers (chemins encryptés)
    encrypted_file_path = EncryptedCharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Chemin du fichier encrypté"
    )
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Statut de lecture
    is_read = models.BooleanField(default=False)
    
    # Médias (garder les mêmes champs que l'ancien modèle)
    image = models.ImageField(upload_to='messages/images/', null=True, blank=True)
    file = models.FileField(upload_to='messages/files/', null=True, blank=True)
    
    # Pour les messages système
    is_system_message = models.BooleanField(default=False)
    system_message_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Suppression (garder les mêmes noms)
    deleted_for_sender = models.BooleanField(default=False)
    deleted_for_receiver = models.BooleanField(default=False)
    deleted_for_everyone = models.BooleanField(default=False)
    
    # Pour l'audit (nouveaux champs)
    delivered = models.BooleanField(default=False)
    edited = models.BooleanField(default=False)
    edit_history = EncryptedJSONField(default=list, blank=True)
    
    class Meta: 
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['conversation', 'timestamp']),
            models.Index(fields=['sender', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        verbose_name = "Message"
        verbose_name_plural = "Messages"
    
    def __str__(self):
        """Compatibilité avec l'ancienne méthode __str__"""
        if self.encrypted_content:
            try:
                # Essayer d'afficher le contenu décrypté
                content_preview = str(self.encrypted_content)[:30]
                return f"{self.sender.username}: {content_preview}..."
            except:
                return f"{self.sender.username}: [Message encrypté]"
        elif self.image:
            return f"{self.sender.username}: [Image]"
        elif self.file:
            return f"{self.sender.username}: [Fichier]"
        return f"{self.sender.username}: [Message sans texte]"
    
    def save(self, *args, **kwargs):
        """Sauvegarde avec mise à jour de la conversation"""
        # Générer un nonce s'il n'existe pas
        if not self.encryption_nonce:
            self.encryption_nonce = default_encryption_nonce()
        
        # Calculer le hash d'intégrité
        if self.encrypted_content:
            content_str = str(self.encrypted_content) if self.encrypted_content else ""
            self.content_hash = hashlib.sha256(
                f"{content_str}{self.encryption_nonce}".encode()
            ).hexdigest()
        
        # Mettre à jour le type de message pour compatibilité
        if self.is_system_message and self.message_type == 'user':
            self.message_type = 'system'
        elif self.message_type in ['TEXT', 'IMAGE', 'FILE'] and not self.is_system_message:
            self.is_system_message = False
        
        # Mettre à jour la conversation
        if self.conversation:
            self.conversation.updated_at = timezone.now()
            self.conversation.save()
        
        super().save(*args, **kwargs)
    
    # Propriétés de compatibilité
    @property
    def content(self):
        """Compatibilité avec l'ancien champ 'content'"""
        return self.encrypted_content
    
    @content.setter
    def content(self, value):
        """Setter pour l'ancien champ 'content'"""
        self.encrypted_content = value
    
    @property
    def created_at(self):
        """Alias pour timestamp (pour certains codes)"""
        return self.timestamp
    
    @property
    def read(self):
        """Alias pour is_read (nouveau nom)"""
        return self.is_read
    
    @read.setter
    def read(self, value):
        """Setter pour read"""
        self.is_read = value
    
    @property
    def is_encrypted(self):
        """Vérifier si le message est encrypté"""
        return bool(self.encryption_nonce)
    
    def verify_integrity(self):
        """Vérifier l'intégrité du message"""
        if not self.content_hash:
            return True
        
        current_hash = hashlib.sha256(
            f"{self.encrypted_content}{self.encryption_nonce}".encode()
        ).hexdigest()
        
        return current_hash == self.content_hash

class GroupJoinRequest(models.Model):
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
    message = EncryptedTextField(blank=True, null=True)  # Encrypté
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_requests'
    )
    review_notes = EncryptedTextField(blank=True, null=True)  # Encrypté
    metadata = EncryptedJSONField(default=dict, blank=True)  # Encrypté
    
    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} → {self.group.get_display_name(self.user)}: {self.get_status_display()}"
    
    def approve(self, reviewed_by=None, notes=None):
        """Approuver la demande"""
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by
        self.review_notes = notes
        self.save()
        
        # Ajouter l'utilisateur au groupe
        self.group.participants.add(self.user)
        
        # Announcement message - CORRECTION: Utiliser le nouveau modèle Message
        Message.objects.create(
            conversation=self.group,
            sender=reviewed_by,
            encrypted_content=f"{self.user.username} a rejoint le groupe (demande approuvée)",
            message_type='SYSTEM'
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
    RATING_CHOICES = [(i, f'{i} étoile{"s" if i > 1 else ""}') for i in range(1, 6)]
    
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
    comment = EncryptedTextField(blank=True, null=True)  # Encrypté
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_visible = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.group.get_display_name(self.user)}: {self.rating}★"
    
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
    ban_reason = EncryptedTextField(blank=True, null=True)  # Encrypté
    ban_expires = models.DateTimeField(blank=True, null=True)
    permissions = EncryptedJSONField(default=dict, blank=True)  # Encrypté
    
    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.group.get_display_name(self.user)} ({self.role})"
    
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


class GroupBlock(models.Model):
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
    reason = EncryptedTextField(blank=True, null=True)  # Encrypté
    blocked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    can_ever_join_again = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    metadata = EncryptedJSONField(default=dict, blank=True)  # Encrypté
    
    class Meta:
        unique_together = ['group', 'user']
        verbose_name = 'Group Block'
    
    def __str__(self):
        return f"{self.user.username} bloqué dans {self.group.get_display_name(self.user)}"


class Block(models.Model):
    BLOCK_TYPES = [
        ('user', 'Block User'),
        ('profile', 'Block Profile'),
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
    reason = EncryptedTextField(blank=True, null=True)  # Encrypté
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['blocker', 'blocked']
        ordering = ['-created_at']
    
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
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='block_settings'
    )
    hide_profile_from_blocked = models.BooleanField(default=True)
    hide_online_status_from_blocked = models.BooleanField(default=True)
    hide_last_seen_from_blocked = models.BooleanField(default=True)
    notify_on_block = models.BooleanField(default=True)
    notify_on_unblock = models.BooleanField(default=True)
    auto_block_spam_users = models.BooleanField(default=False)
    spam_report_threshold = models.IntegerField(default=3)
    max_blocks_allowed = models.IntegerField(default=100)
    block_duration_default = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class BlockHistory(models.Model):
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
    reason = EncryptedTextField(blank=True, null=True)  # Encrypté
    duration_days = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    metadata = EncryptedJSONField(default=dict, blank=True)  # Encrypté
    
    class Meta:
        ordering = ['-created_at']