# utils/message_utils.py
from django.utils import timezone
from .models import Message
def create_system_message(conversation, user, message_type, extra_data=None):
    """
    Créer un message système
    """
    message_content = None
    system_message_type = None
    
    # Déterminer le contenu selon le type
    if message_type == 'user_removed':
        removed_user = extra_data.get('removed_user')
        admin = user
        message_content = f"{admin.username} removed {removed_user.username} from the group"
        system_message_type = 'user_removed'
    
    elif message_type == 'group_photo_changed':
        message_content = f"{user.username} changed the group photo"
        system_message_type = 'group_photo_changed'
    
    elif message_type == 'user_joined':
        message_content = f"{user.username} joined the group"
        system_message_type = 'user_joined'
    
    elif message_type == 'user_left':
        message_content = f"{user.username} left the group"
        system_message_type = 'user_left'
    
    elif message_type == 'user_invited':
        invited_user = extra_data.get('invited_user')
        message_content = f"{user.username} invited {invited_user.username} to the group"
        system_message_type = 'user_invited'
    
    elif message_type == 'group_name_changed':
        old_name = extra_data.get('old_name')
        new_name = extra_data.get('new_name')
        message_content = f"{user.username} changed the group name from '{old_name}' to '{new_name}'"
        system_message_type = 'group_name_changed'
    
    # Créer le message
    if message_content:
        message = Message.objects.create(
            conversation=conversation,
            sender=user,
            content=message_content,
            is_system_message=True,
            system_message_type=system_message_type,
            message_type='system',  # Alternative
            timestamp=timezone.now()
        )
        return message
    
    return None