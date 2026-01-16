# messaging/block_utils.py
from django.db.models import Q
from django.utils import timezone
from .models import Block, BlockSettings

class BlockManager:
    """
    Centralized manager for blocking functionalities
    """
    
    @staticmethod
    def is_blocked(blocker_id, blocked_id):
        """
        Check if blocker has blocked blocked
        """
        try:
            block = Block.objects.get(
                blocker_id=blocker_id,
                blocked_id=blocked_id,
                is_active=True
            )
            if block.expires_at and block.expires_at < timezone.now():
                block.is_active = False
                block.save()
                return False
            return True
        except Block.DoesNotExist:
            return False
    
    @staticmethod
    def get_block_status(user1_id, user2_id):
        """
        Return blocking status between two users
        """
        user1_blocks_user2 = BlockManager.is_blocked(user1_id, user2_id)
        user2_blocks_user1 = BlockManager.is_blocked(user2_id, user1_id)
        
        return {
            'user1_blocks_user2': user1_blocks_user2,
            'user2_blocks_user1': user2_blocks_user1,
            'is_mutual_block': user1_blocks_user2 and user2_blocks_user1,
            'can_communicate': not (user1_blocks_user2 or user2_blocks_user1)
        }
    
    @staticmethod
    def can_send_message(sender_id, receiver_id):
        """
        Check if sender can send a message to receiver
        """
        # Has the sender blocked the receiver?
        if BlockManager.is_blocked(sender_id, receiver_id):
            return False, "You have blocked this user"
        
        # Has the receiver blocked the sender?
        if BlockManager.is_blocked(receiver_id, sender_id):
            return False, "This user has blocked you"
        
        return True, "OK"
    
    @staticmethod
    def can_view_profile(viewer_id, profile_owner_id):
        """
        Check if viewer can see profile_owner's profile
        """
        # User can always see their own profile
        if viewer_id == profile_owner_id:
            return True, "Own profile"
        
        # Has the viewer blocked the profile_owner?
        if BlockManager.is_blocked(viewer_id, profile_owner_id):
            try:
                settings = BlockSettings.objects.get(user_id=viewer_id)
                if settings.hide_profile_from_blocked:
                    return False, "You have blocked this user"
            except BlockSettings.DoesNotExist:
                return False, "You have blocked this user"
        
        # Has the profile_owner blocked the viewer?
        if BlockManager.is_blocked(profile_owner_id, viewer_id):
            return False, "This user has blocked you"
        
        return True, "OK"
    
    @staticmethod
    def block_user(blocker_id, blocked_id, block_type='both', reason='', duration_days=0):
        """
        Block a user
        """
        from .models import Block, BlockHistory
        
        # Check if there isn't already an active block
        try:
            existing_block = Block.objects.get(
                blocker_id=blocker_id,
                blocked_id=blocked_id
            )
            if existing_block.is_active and not existing_block.is_expired:
                return False, "This user is already blocked"
            
            # Reactivate existing block
            existing_block.block_type = block_type
            existing_block.reason = reason
            existing_block.is_active = True
            if duration_days > 0:
                existing_block.expires_at = timezone.now() + timezone.timedelta(days=duration_days)
            else:
                existing_block.expires_at = None
            existing_block.save()
            block = existing_block
        except Block.DoesNotExist:
            # Create a new block
            expires_at = None
            if duration_days > 0:
                expires_at = timezone.now() + timezone.timedelta(days=duration_days)
            
            block = Block.objects.create(
                blocker_id=blocker_id,
                blocked_id=blocked_id,
                block_type=block_type,
                reason=reason,
                expires_at=expires_at
            )
        
        # Record in history
        BlockHistory.objects.create(
            user_id=blocker_id,
            target_user_id=blocked_id,
            action='block',
            reason=reason,
            duration_days=duration_days
        )
        
        return True, "User blocked successfully"
    
    @staticmethod
    def unblock_user(blocker_id, blocked_id):
        """
        Unblock a user
        """
        from .models import Block, BlockHistory
        
        try:
            block = Block.objects.get(
                blocker_id=blocker_id,
                blocked_id=blocked_id,
                is_active=True
            )
            block.is_active = False
            block.save()
            
            # Record in history
            BlockHistory.objects.create(
                user_id=blocker_id,
                target_user_id=blocked_id,
                action='unblock'
            )
            
            return True, "User unblocked successfully"
        except Block.DoesNotExist:
            return False, "No active block found"
    
    @staticmethod
    def get_blocked_users(user_id):
        """
        Return list of users blocked by a user
        """
        blocks = Block.objects.filter(
            blocker_id=user_id,
            is_active=True
        ).select_related('blocked')
        
        # Filter expired blocks
        active_blocks = []
        for block in blocks:
            if not block.is_expired:
                active_blocks.append(block)
            else:
                block.is_active = False
                block.save()
        
        return active_blocks
    
    @staticmethod
    def get_users_who_blocked(user_id):
        """
        Return list of users who have blocked a user
        """
        blocks = Block.objects.filter(
            blocked_id=user_id,
            is_active=True
        ).select_related('blocker')
        
        # Filter expired blocks
        active_blocks = []
        for block in blocks:
            if not block.is_expired:
                active_blocks.append(block)
            else:
                block.is_active = False
                block.save()
        
        return active_blocks