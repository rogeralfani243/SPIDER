from django.db import models
from django.conf import settings

class Feedback(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_feedback')
    professional = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='professional_feedbacks', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(default=1)
    comment = models.TextField(blank=True)
    helpful_count = models.PositiveIntegerField(default=0)  # ← Champ de compteur
    helpful_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='helpful_feedbacks',
        blank=True
    )  # ← Champ pour suivre qui a marqué comme utile
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'professional')
    
    def __str__(self):
        return f"Feedback from {self.user} to {self.professional} - {self.rating} stars"
    
    def mark_as_helpful(self, user):
        """Marquer le feedback comme utile par un utilisateur"""
        if not self.helpful_users.filter(id=user.id).exists():
            self.helpful_users.add(user)
            self.helpful_count = self.helpful_users.count()
            self.save()
            return True
        return False
    
    def unmark_as_helpful(self, user):
        """Retirer le marquage utile par un utilisateur"""
        if self.helpful_users.filter(id=user.id).exists():
            self.helpful_users.remove(user)
            self.helpful_count = self.helpful_users.count()
            self.save()
            return True
        return False
    
    def is_helpful_by_user(self, user):
        """Vérifier si un utilisateur a marqué ce feedback comme utile"""
        if user.is_authenticated:
            return self.helpful_users.filter(id=user.id).exists()
        return False