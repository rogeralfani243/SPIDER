# posts/utils.py (ou advertising/utils.py)
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg, F, Case, When, Value, FloatField, IntegerField
from .models import SponsoredPost

logger = logging.getLogger(__name__)

class BoostMixer:
    """
    Utility class to mix boosted posts with regular posts in feed
    """
    
    @staticmethod
    def get_active_boosted_posts():
        """
        Get all active boosted posts ordered by boost strength
        """
        try:
            active_boosts = SponsoredPost.objects.filter(
                payment_status='paid',
                boost_start__lte=timezone.now(),
                boost_end__gte=timezone.now(),
                featured_in_feed=True,
                campaign__status='active'
            ).select_related('original_post').order_by(
                '-boost_multiplier',  # Highest multiplier first
                '-created_at'
            )
            
            logger.info(f"🎯 Found {active_boosts.count()} active boosted posts")
            return active_boosts
            
        except Exception as e:
            logger.error(f"❌ Error fetching boosted posts: {str(e)}")
            return SponsoredPost.objects.none()
    
    @staticmethod
    def calculate_boost_priority(boosted_post):
        """
        Calculate priority score for boosted posts
        Higher score = higher priority in feed
        """
        try:
            # Base priority based on boost multiplier
            priority = boosted_post.boost_multiplier * 10
            
            # Bonus for 'always_on_top' posts
            if boosted_post.always_on_top:
                priority += 30
            
            # Bonus for recently started boosts
            hours_since_start = (timezone.now() - boosted_post.boost_start).total_seconds() / 3600
            if hours_since_start < 24:  # Within first 24 hours
                priority += 20
            elif hours_since_start < 72:  # Within first 3 days
                priority += 10
            
            # Bonus for high-value boosts (higher price)
            if boosted_post.price >= 50:
                priority += 15
            elif boosted_post.price >= 25:
                priority += 10
            
            # Malus for expiring soon (within 24 hours)
            hours_to_end = (boosted_post.boost_end - timezone.now()).total_seconds() / 3600
            if hours_to_end < 24:
                priority -= 5
            
            return max(1, priority)  # Ensure at least priority 1
            
        except Exception as e:
            logger.error(f"Error calculating boost priority: {str(e)}")
            return 1
    
    @staticmethod
    def get_boost_insertion_positions(boosted_posts, total_regular_posts, positions_per_boost_type=None):
        """
        Determine optimal positions to insert boosted posts in feed
        
        Args:
            boosted_posts: List of SponsoredPost objects
            total_regular_posts: Number of regular posts in feed
            positions_per_boost_type: Custom insertion rules
            
        Returns:
            dict: {boosted_post: position_in_feed}
        """
        if positions_per_boost_type is None:
            positions_per_boost_type = {
                'spotlight': {'min_interval': 3, 'max_count': 2},
                'featured': {'min_interval': 4, 'max_count': 3},
                'premium': {'min_interval': 6, 'max_count': 4},
                'standard': {'min_interval': 8, 'max_count': 5}
            }
        
        insertion_positions = {}
        
        # Group boosted posts by type
        boosted_by_type = {}
        for boost in boosted_posts:
            boost_type = boost.post_type.lower()
            if 'spotlight' in boost_type:
                type_key = 'spotlight'
            elif 'featured' in boost_type:
                type_key = 'featured'
            elif 'premium' in boost_type:
                type_key = 'premium'
            else:
                type_key = 'standard'
            
            if type_key not in boosted_by_type:
                boosted_by_type[type_key] = []
            boosted_by_type[type_key].append(boost)
        
        # Calculate insertion positions
        current_position = 0
        used_positions = set()
        
        # Process by priority (spotlight -> featured -> premium -> standard)
        for boost_type in ['spotlight', 'featured', 'premium', 'standard']:
            if boost_type not in boosted_by_type:
                continue
                
            boost_list = boosted_by_type[boost_type]
            config = positions_per_boost_type[boost_type]
            
            # Sort by priority
            boost_list.sort(key=lambda x: BoostMixer.calculate_boost_priority(x), reverse=True)
            
            # Limit to max_count
            boost_list = boost_list[:config['max_count']]
            
            for boost in boost_list:
                # Find next available position
                while (current_position in used_positions or 
                       current_position < config['min_interval']):
                    current_position += 1
                
                # Ensure position is within bounds
                if current_position >= total_regular_posts + len(used_positions):
                    # If we've run out of positions, place at end
                    insertion_positions[boost] = total_regular_posts + len(used_positions)
                else:
                    insertion_positions[boost] = current_position
                
                used_positions.add(insertion_positions[boost])
                current_position += config['min_interval']
        
        return insertion_positions
    
    @staticmethod
    def mix_boosts_with_posts(regular_posts, boosted_posts):
        """
        Mix boosted posts with regular posts
        
        Args:
            regular_posts: List of regular Post objects
            boosted_posts: List of SponsoredPost objects
            
        Returns:
            list: Mixed list of posts (regular + boosted)
        """
        if not boosted_posts:
            return regular_posts
        
        total_regular = len(regular_posts)
        
        # Get insertion positions
        insertion_positions = BoostMixer.get_boost_insertion_positions(
            boosted_posts, 
            total_regular
        )
        
        # Create mixed list
        mixed_posts = []
        regular_index = 0
        current_position = 0
        
        # Sort insertion positions
        sorted_insertions = sorted(insertion_positions.items(), key=lambda x: x[1])
        
        for boost, position in sorted_insertions:
            # Add regular posts until we reach the boost position
            while regular_index < total_regular and len(mixed_posts) < position:
                mixed_posts.append(regular_posts[regular_index])
                regular_index += 1
            
            # Add the boosted post
            if boost.original_post not in mixed_posts:  # Avoid duplicates
                mixed_posts.append(boost.original_post)
        
        # Add remaining regular posts
        while regular_index < total_regular:
            mixed_posts.append(regular_posts[regular_index])
            regular_index += 1
        
        logger.info(f"🔀 Mixed {len(boosted_posts)} boosted posts with {len(regular_posts)} regular posts")
        return mixed_posts
    
    @staticmethod
    def annotate_posts_with_boost_info(posts_queryset):
        """
        Annotate posts with boost information
        """
        try:
            # Get post IDs
            post_ids = list(posts_queryset.values_list('id', flat=True))
            
            if not post_ids:
                return posts_queryset
            
            # Get active boosts for these posts
            active_boosts = SponsoredPost.objects.filter(
                original_post_id__in=post_ids,
                payment_status='paid',
                boost_start__lte=timezone.now(),
                boost_end__gte=timezone.now(),
                campaign__status='active'
            ).select_related('original_post')
            
            # Create boost info mapping
            boost_info_map = {}
            for boost in active_boosts:
                boost_info_map[boost.original_post_id] = {
                    'is_boosted': True,
                    'boost_type': boost.post_type,
                    'boost_multiplier': boost.boost_multiplier,
                    'boost_until': boost.boost_end,
                    'always_on_top': boost.always_on_top,
                    'sponsored_post_id': boost.id
                }
            
            # Annotate queryset (conceptual - you'd need to handle this differently)
            # Since Django doesn't support dynamic annotations easily, 
            # we'll handle this in the serializer
            
            return posts_queryset, boost_info_map
            
        except Exception as e:
            logger.error(f"Error annotating posts with boost info: {str(e)}")
            return posts_queryset, {}