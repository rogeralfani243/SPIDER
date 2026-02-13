from django.db import models
from django.contrib.auth.models import User
from app.models import Post
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings 
class Rating(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stars = models.IntegerField(
        validators= [ MinValueValidator(1),MaxValueValidator(5)],
        help_text='Note from 1 to 5 starts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    upload_at = models.DateTimeField(auto_now_add=True)

    class Meta :
        unique_together = ['post', 'user'] # an user can let only one review 