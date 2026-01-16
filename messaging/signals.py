# messaging/signals.py
from django.contrib.auth.signals import user_logged_out
from django.dispatch import receiver
from django.utils import timezone
from .models import UserOnlineStatus

@receiver(user_logged_out)
def update_status_on_logout(sender, request, user, **kwargs):
    """Mettre à jour le statut quand l'utilisateur se déconnecte"""
    try:
        online_status = UserOnlineStatus.objects.filter(user=user).first()
        if online_status:
            online_status.is_online = False
            online_status.last_seen = timezone.now()
            online_status.save()
    except Exception as e:
        print(f"Error updating online status on logout: {e}")