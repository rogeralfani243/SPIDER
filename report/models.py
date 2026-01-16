# models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ValidationError
from messaging.models import Message,Conversation
from post.models import Post
from comment_post.models import Comment
from app.models import Profile
from feedback.models import Feedback

# Use get_user_model() to get the User model
User = get_user_model()

class ReportType(models.TextChoices):
    SPAM = 'spam', 'Spam'
    HARASSMENT = 'harassment', 'Harassment'
    HATE_SPEECH = 'hate_speech', 'Hate Speech'
    INAPPROPRIATE = 'inappropriate', 'Inappropriate Content'
    COPYRIGHT = 'copyright', 'Copyright Infringement'
    FALSE_INFO = 'false_info', 'False Information'
    NUDITY = 'nudity_content', 'Nudity Content'
    OTHER = 'other', 'Other'

class ReportStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    UNDER_REVIEW = 'under_review', 'Under Review'
    RESOLVED = 'resolved', 'Resolved'
    DISMISSED = 'dismissed', 'Dismissed'

class ContentType(models.TextChoices):
    MESSAGE = 'message', 'Message'
    POST = 'post', 'Post'
    COMMENT = 'comment', 'Comment'
    PROFILE = 'profile', 'Profile'
    FEEDBACK = 'feedback', 'Feedback'
    CONVERSATION = 'conversation', 'Conversation'

class Report(models.Model):
    """Model for reports"""
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Use settings.AUTH_USER_MODEL here
        on_delete=models.CASCADE, 
        related_name='reports_made',
        verbose_name='Reporter'
    )
    
    # Generic fields to reference any type of content
    content_type = models.CharField(
        max_length=20,
        choices=ContentType.choices,
        verbose_name='Content Type'
    )
    content_id = models.PositiveIntegerField(verbose_name='Content ID')
    
    # Specific fields for each content type
    message = models.ForeignKey(
        Message, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='reports'
    )
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='reports'
    )
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='reports'
    )
    comment = models.ForeignKey(
        Comment, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='reports'
    )
    profile = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='reports'
    )
    feedback = models.ForeignKey(
        Feedback, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='reports'
    )
    
    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices,
        verbose_name='Report Type'
    )
    reason = models.TextField(
        verbose_name='Detailed Reason',
        blank=True,
        null=True
    )
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING,
        verbose_name='Status'
    )
    
    # Moderation information
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Use settings.AUTH_USER_MODEL here
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reports_reviewed',
        verbose_name='Moderator'
    )
    reviewed_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name='Reviewed At'
    )
    moderator_notes = models.TextField(
        verbose_name='Moderator Notes',
        blank=True,
        null=True
    )
    action_taken = models.TextField(
        verbose_name='Action Taken',
        blank=True,
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['reporter', 'content_type', 'content_id']
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        indexes = [
            models.Index(fields=['content_type', 'content_id']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Report #{self.id} - {self.get_report_type_display()}"
    
    def clean(self):
        """Validation to ensure only one content field is set"""
        content_fields = ['message', 'post', 'comment', 'profile', 'feedback','conversation']
        filled_fields = [field for field in content_fields if getattr(self, field)]
        
        if len(filled_fields) > 1:
            raise ValidationError("Only one content field should be set.")
    
    def save(self, *args, **kwargs):
        # Automatically fill content_type and content_id
        if self.message:
            self.content_type = ContentType.MESSAGE
            self.content_id = self.message.id
        elif self.post:
            self.content_type = ContentType.POST
            self.content_id = self.post.id
        elif self.comment:
            self.content_type = ContentType.COMMENT
            self.content_id = self.comment.id
        elif self.profile:
            self.content_type = ContentType.PROFILE
            self.content_id = self.profile.id
        elif self.feedback:
            self.content_type = ContentType.FEEDBACK
            self.content_id = self.feedback.id
        elif self.conversation:
            self.content_type = ContentType.CONVERSATION
            self.content_id = self.conversation.id
        self.clean()
        super().save(*args, **kwargs)
    
    def get_reported_content(self):
        """Retrieve the reported content"""
        if self.message:
            return self.message
        elif self.post:
            return self.post
        elif self.comment:
            return self.comment
        elif self.profile:
            return self.profile
        elif self.feedback:
            return self.feedback
        elif self.conversation:
            return self.conversation
        return None
    
    def get_content_author(self):
        """Retrieve the content author"""
        content = self.get_reported_content()
        if not content:
            return None
            
        if hasattr(content, 'user'):
            return content.user
        elif hasattr(content, 'author'):
            return content.author
        elif hasattr(content, 'sender'):
            return content.sender
        return None

class ReportAction(models.Model):
    """History of actions on reports"""
    ACTION_CHOICES = [
        ('delete', 'Delete Content'),
        ('warn', 'Warn User'),
        ('suspend', 'Suspend User'),
        ('ban', 'Ban User'),
        ('ignore', 'Ignore Report'),
        ('edit', 'Edit Content'),
    ]
    
    report = models.ForeignKey(
        Report, 
        on_delete=models.CASCADE, 
        related_name='actions'
    )
    action_type = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES
    )
    description = models.TextField(verbose_name='Action Description')
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Use settings.AUTH_USER_MODEL here
        on_delete=models.SET_NULL, 
        null=True,
        verbose_name='Moderator'
    )
    performed_at = models.DateTimeField(auto_now_add=True)
    
    # For suspensions/bans
    duration_days = models.PositiveIntegerField(
        null=True, 
        blank=True,
        verbose_name='Duration (days)'
    )
    
    class Meta:
        ordering = ['-performed_at']
        verbose_name = 'Moderation Action'
        verbose_name_plural = 'Moderation Actions'
    
    def __str__(self):
        return f"{self.get_action_type_display()} on Report #{self.report.id}"