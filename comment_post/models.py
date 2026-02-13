from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from post.models import Post
User = get_user_model()

class Comment(models.Model):
    # Relations principales
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='user_comments'  # UNIQUE
    )
    
    post = models.ForeignKey(
        Post,  # Ajustez selon votre structure
        on_delete=models.CASCADE, 
        related_name='post_comments'  # UNIQUE
    )
    
    # Pour les commentaires imbriqués
    parent_comment = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='comment_replies'  # UNIQUE
    )
    
    # Contenu
    content = models.TextField(blank=True, null=True)
    
    # Médias
    image = models.ImageField(upload_to='comments/images/', null=True, blank=True)
    video = models.FileField(upload_to='comments/videos/', null=True, blank=True)
    file = models.FileField(upload_to='comments/files/', null=True, blank=True)
    
    # Mentions
    mentions = models.ManyToManyField(
        User, 
        related_name='mentioned_in_comments', 
        blank=True
    )
    
    # Likes - NOMMÉ CORRECTEMENT
    likes = models.ManyToManyField(
        User, 
        related_name='liked_comments_post',  # UNIQUE
        blank=True
    )
    
    # Compteurs
    likes_count = models.IntegerField(default=0)
    reply_count = models.IntegerField(default=0)
    
    # États
    is_edited = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    # Pour le threading
    path = models.TextField(db_index=True, blank=True)
    depth = models.IntegerField(default=0)
    
    # Metadata technique
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['post', 'parent_comment', '-created_at']),
            models.Index(fields=['path']),
        ]
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
    
    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}"
    
    def save(self, *args, **kwargs):
        # Gestion du path et depth
        if self.parent_comment:
            self.depth = self.parent_comment.depth + 1
            if self.parent_comment.path:
                self.path = f"{self.parent_comment.path}.{self.id or 'new'}"
            else:
                self.path = f"{self.parent_comment.id or 'parent'}.{self.id or 'new'}"
        else:
            self.depth = 0
            self.path = str(self.id) if self.id else "root"
        
        # Gestion de l'édition
        if self.is_edited and not self.edited_at:
            self.edited_at = timezone.now()
        
        super().save(*args, **kwargs)
        self.update_path_after_save()
    
    def update_path_after_save(self):
        """Mettre à jour le path après la sauvegarde pour inclure l'ID réel"""
        if self.id and not self.path.endswith(str(self.id)):
            if self.parent_comment:
                self.path = f"{self.parent_comment.path}.{self.id}"
            else:
                self.path = str(self.id)
            # Sauvegarder sans déclencher save() à nouveau
            Comment.objects.filter(id=self.id).update(path=self.path)
    
    def get_replies(self):
        """Récupérer les réponses"""
        return self.comment_replies.all().select_related('user')
    
    def toggle_like(self, user):
        """Basculer le like"""
        if user in self.likes.all():
            self.likes.remove(user)
            self.likes_count = max(0, self.likes_count - 1)
        else:
            self.likes.add(user)
            self.likes_count += 1
        self.save()
    
    def user_has_liked(self, user):
        """Vérifier si l'utilisateur a liké"""
        return user.is_authenticated and self.likes.filter(id=user.id).exists()
    
    def get_absolute_url(self):
        """URL absolue"""
        return f"/posts/{self.post.id}#comment-{self.id}"
    # Dans models.py, dans la classe Comment
    def get_total_comments_count(self):
        """Retourne le nombre TOTAL de commentaires (ce commentaire + toutes ses réponses)"""
        def count_all(comment):
            total = 1  # Ce commentaire
            # Pour chaque réponse
            for reply in comment.comment_replies.all():
                total += count_all(reply)  # La réponse + ses propres réponses
            return total
        return count_all(self)

    # Option optimisée avec cache
    def get_total_comments_count_optimized(self):
        """Version optimisée avec mise en cache"""
        cache_key = f'comment_total_count_{self.id}'



        def count_all(comment):
            total = 1
            replies = comment.comment_replies.all()
            for reply in replies:
                total += count_all(reply)
            return total

        result = count_all(self)
        return result

@property
def is_root(self):
    return self.parent_comment is None

@property
def has_replies(self):
    return self.comment_replies.exists()