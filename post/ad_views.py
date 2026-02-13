# ad_views.py - Advertising system views (function-based)

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import logging
from django.contrib.auth import get_user_model
from certfications.views import handle_checkout_session_completed

logger = logging.getLogger(__name__)
from certfications.models import Payment 
from .models import AdCampaign, SponsoredPost, Post
from .serializers import (
    AdCampaignSerializer, SponsoredPostSerializer,
    SponsoredPostCreateSerializer, PaymentSerializer, PostListSerializer
)

# Stripe Configuration
stripe.api_key = settings.STRIPE_SECRET_KEY

# ==============================================
# AD CAMPAIGN FUNCTIONS
# ==============================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ad_campaign_list(request):
    """
    List or create advertising campaigns
    """
    if request.method == 'GET':
        # List user's campaigns
        campaigns = AdCampaign.objects.filter(user=request.user)
        serializer = AdCampaignSerializer(campaigns, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create a new campaign
        serializer = AdCampaignSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def ad_campaign_detail(request, pk):
    """
    Get, update or delete a campaign
    """
    campaign = get_object_or_404(AdCampaign, pk=pk, user=request.user)
    
    if request.method == 'GET':
        serializer = AdCampaignSerializer(campaign, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = AdCampaignSerializer(campaign, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        campaign.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ad_campaign_activate(request, pk):
    """
    Activate a campaign
    """
    campaign = get_object_or_404(AdCampaign, pk=pk, user=request.user)
    
    if campaign.status == 'draft':
        # Check budget
        if campaign.budget <= 0:
            return Response(
                {"error": "Budget must be greater than 0"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        campaign.status = 'active'
        campaign.save()
        return Response({"message": "Campaign activated"})
    
    return Response(
        {"error": "Campaign cannot be activated"},
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ad_campaign_pause(request, pk):
    """
    Pause a campaign
    """
    campaign = get_object_or_404(AdCampaign, pk=pk, user=request.user)
    
    campaign.status = 'paused'
    campaign.save()
    return Response({"message": "Campaign paused"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ad_campaign_stats(request, pk):
    """
    Get detailed campaign statistics
    """
    campaign = get_object_or_404(AdCampaign, pk=pk, user=request.user)
    
    # Calculate statistics
    sponsored_posts = campaign.sponsored_posts.all()
    
    stats = {
        'campaign': AdCampaignSerializer(campaign, context={'request': request}).data,
        'sponsored_posts_count': sponsored_posts.count(),
        'active_sponsored_posts': sponsored_posts.filter(
            payment_status='paid',
            boost_end__gte=timezone.now()
        ).count(),
        'total_spent': float(campaign.spent),
        'remaining_budget': float(campaign.remaining_budget()),
        'ctr': campaign.clicks / campaign.impressions if campaign.impressions > 0 else 0,
        'conversion_rate': campaign.conversions / campaign.clicks if campaign.clicks > 0 else 0,
        'sponsored_posts': SponsoredPostSerializer(sponsored_posts, many=True, context={'request': request}).data
    }
    
    return Response(stats)

# ==============================================
# SPONSORED POST FUNCTIONS
# ==============================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sponsored_post_list(request):
    """
    List or create sponsored posts
    """
    if request.method == 'GET':
        # Determine which posts to show
        user = request.user
        
        if user.is_staff or user.is_superuser:
            # Admins see everything
            sponsored_posts = SponsoredPost.objects.all()
        else:
            # Regular users see their own sponsored posts
            sponsored_posts = SponsoredPost.objects.filter(
                Q(original_post__user=user) | Q(campaign__user=user)
            ).distinct()
        
        serializer = SponsoredPostSerializer(sponsored_posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create a new sponsored post
        serializer = SponsoredPostCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            sponsored_post = serializer.save()
            return Response(
                SponsoredPostSerializer(sponsored_post, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def sponsored_post_detail(request, pk):
    """
    Get, update or delete a sponsored post
    """
    user = request.user
    
    if user.is_staff or user.is_superuser:
        sponsored_post = get_object_or_404(SponsoredPost, pk=pk)
    else:
        sponsored_post = get_object_or_404(
            SponsoredPost,
            Q(original_post__user=user) | Q(campaign__user=user),
            pk=pk
        )
    
    if request.method == 'GET':
        serializer = SponsoredPostSerializer(sponsored_post, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SponsoredPostSerializer(sponsored_post, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        sponsored_post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sponsored_post_process_payment(request, pk):
    """
    Process payment for a sponsored post
    """
    sponsored_post = get_object_or_404(SponsoredPost, pk=pk)
    
    # Verify user can pay
    if sponsored_post.original_post.user != request.user:
        return Response(
            {"error": "You are not authorized to pay for this post"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check status
    if sponsored_post.payment_status != 'pending':
        return Response(
            {"error": f"Payment is already {sponsored_post.get_payment_status_display()}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create Stripe PaymentIntent
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(sponsored_post.price * 100),  # Convert to cents
            currency='eur',
            metadata={
                'sponsored_post_id': sponsored_post.id,
                'user_id': request.user.id,
                'post_id': sponsored_post.original_post.id,
                'post_type': sponsored_post.post_type
            },
            description=f"Sponsored post: {sponsored_post.original_post.title}"
        )
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            sponsored_post=sponsored_post,
            campaign=sponsored_post.campaign,
            amount=sponsored_post.price,
            currency='EUR',
            payment_method='stripe',
            payment_intent_id=payment_intent.id,
            metadata={
                'client_secret': payment_intent.client_secret,
                'payment_intent': payment_intent.id
            }
        )
        
        return Response({
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id,
            "payment_id": payment.id,
            "amount": sponsored_post.price,
            "currency": "eur"
        })
        
    except stripe.error.StripeError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sponsored_post_active(request):
    """
    List active sponsored posts
    """
    active_posts = SponsoredPost.objects.filter(
        payment_status='paid',
        boost_start__lte=timezone.now(),
        boost_end__gte=timezone.now(),
        campaign__status='active'
    ).order_by('-boost_multiplier', '-created_at')
    
    serializer = SponsoredPostSerializer(active_posts, many=True, context={'request': request})
    return Response(serializer.data)

# ==============================================
# PAYMENT FUNCTIONS
# ==============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_list(request):
    """
    List user payments
    """
    payments = Payment.objects.filter(user=request.user)
    serializer = PaymentSerializer(payments, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, pk):
    """
    Get payment details
    """
    payment = get_object_or_404(Payment, pk=pk, user=request.user)
    serializer = PaymentSerializer(payment, context={'request': request})
    return Response(serializer.data)

# ==============================================
# BOOST POST FUNCTIONS
# ==============================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def boost_post(request, post_id):
    """
    API to boost an existing post
    """
    try:
        post = Post.objects.get(id=post_id, user=request.user)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if post is already sponsored
    if hasattr(post, 'sponsored_post') and post.sponsored_post.is_active():
        return Response(
            {"error": "This post is already sponsored"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get request data
    boost_type = request.data.get('boost_type', 'standard')
    boost_days = int(request.data.get('boost_days', 7))
    always_on_top = request.data.get('always_on_top', False)
    
    # Prices by type
    prices = {
        'standard': 10.00,
        'premium': 25.00,
        'featured': 50.00,
        'spotlight': 100.00,
    }
    
    price = prices.get(boost_type, 10.00)
    boost_multiplier = {
        'standard': 1.5,
        'premium': 2.0,
        'featured': 3.0,
        'spotlight': 5.0,
    }.get(boost_type, 1.5)
    
    # Create a default campaign
    campaign, created = AdCampaign.objects.get_or_create(
        user=request.user,
        name=f"Auto Boost - Post {post.id}",
        defaults={
            'budget': 100.00,
            'start_date': timezone.now(),
            'end_date': timezone.now() + timedelta(days=30),
            'status': 'active'
        }
    )
    
    # Create the sponsored post
    sponsored_post = SponsoredPost.objects.create(
        original_post=post,
        campaign=campaign,
        post_type=boost_type,
        price=price,
        boost_start=timezone.now(),
        boost_end=timezone.now() + timedelta(days=boost_days),
        boost_multiplier=boost_multiplier,
        always_on_top=always_on_top,
        featured_in_feed=True,
        payment_status='pending'
    )
    
    # CORRECTION: Créer le payment record initial sans stripe_payment_intent_id
    payment = Payment.objects.create(
        user=request.user,
        payment_type='post_boost',
        sponsored_post=sponsored_post,
        post=post,
        campaign=campaign,
        amount=price,
        currency='USD',
        status='pending',
        boost_start=sponsored_post.boost_start,
        boost_end=sponsored_post.boost_end,
        metadata={
            'boost_type': boost_type,
            'boost_days': boost_days,
            'always_on_top': always_on_top,
            'multiplier': boost_multiplier
        }
    )
    
    return Response({
        "message": "Post ready to be boosted",
        "sponsored_post_id": sponsored_post.id,
        "payment_id": payment.id,  # IMPORTANT: Inclure payment_id
        "price": price,
        "boost_days": boost_days,
        "boost_type": boost_type
    })
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def boost_post_options(request, post_id):
    """
    Get boost options for a post
    """
    try:
        post = Post.objects.get(id=post_id, user=request.user)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Available boost options
    options = [
        {
            "type": "standard",
            "name": "Standard Boost",
            "description": "50% increased visibility for 7 days",
            "price": 10.00,
            "duration_days": 7,
            "multiplier": 1.5,
            "features": [
                "More frequent appearance in feeds",
                "'Sponsored' badge",
                "Detailed statistics"
            ]
        },
        {
            "type": "premium",
            "name": "Premium Boost",
            "description": "Double visibility for 14 days",
            "price": 25.00,
            "duration_days": 14,
            "multiplier": 2.0,
            "features": [
                "All Standard features",
                "Featured in category",
                "Notification to followers"
            ]
        },
        {
            "type": "featured",
            "name": "Featured Boost",
            "description": "Triple visibility and priority position",
            "price": 50.00,
            "duration_days": 7,
            "multiplier": 3.0,
            "features": [
                "All Premium features",
                "Always on top of category",
                "Promotional email",
                "'Featured' badge"
            ]
        },
        {
            "type": "spotlight",
            "name": "Spotlight Boost",
            "description": "Maximum visibility and exclusive promotion",
            "price": 100.00,
            "duration_days": 7,
            "multiplier": 5.0,
            "features": [
                "All Featured features",
                "Top of all feeds",
                "Homepage promotion",
                "Dedicated email campaign",
                "Golden 'Spotlight' badge"
            ]
        }
    ]
    
    post_serializer = PostListSerializer(post, context={'request': request})
    
    # Check if already boosted
    is_boosted = hasattr(post, 'sponsored_post') and post.sponsored_post.is_active()
    current_boost = None
    if is_boosted:
        sp = post.sponsored_post
        current_boost = {
            'type': sp.post_type,
            'boost_until': sp.boost_end,
            'multiplier': sp.boost_multiplier,
            'days_remaining': sp.days_remaining()
        }
    
    return Response({
        "post": post_serializer.data,
        "options": options,
        "is_boosted": is_boosted,
        "current_boost": current_boost
    })
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_boost_payment_intent(request, sponsored_post_id):
    """
    Create Stripe PaymentIntent for a sponsored post
    """
    try:
        sponsored_post = SponsoredPost.objects.get(
            id=sponsored_post_id,
            original_post__user=request.user
        )
    except SponsoredPost.DoesNotExist:
        return Response(
            {"error": "Sponsored post not found or unauthorized"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already paid
    if sponsored_post.payment_status == 'paid':
        return Response(
            {"error": "This post boost is already paid"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create Stripe PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=int(sponsored_post.price * 100),  # Convert to cents
            currency='usd',
            metadata={
                'user_id': str(request.user.id),
                'post_id': str(sponsored_post.original_post.id),
                'sponsored_post_id': str(sponsored_post.id),
                'boost_type': sponsored_post.post_type,
                'payment_type': 'post_boost'
            },
            description=f"Post boost: {sponsored_post.original_post.title} - {sponsored_post.post_type}"
        )
        
        # Vérifier/Créer le payment record CORRECTEMENT
        payment, created = Payment.objects.get_or_create(
            user=request.user,
            payment_type='post_boost',
            sponsored_post=sponsored_post,
            defaults={
                'post': sponsored_post.original_post,
                'campaign': sponsored_post.campaign,
                'amount': sponsored_post.price,
                'currency': 'USD',
                'stripe_payment_intent_id': payment_intent.id,
                'status': 'pending',
                'boost_start': sponsored_post.boost_start,
                'boost_end': sponsored_post.boost_end,
                'metadata': {  # CORRECTION: utiliser le champ metadata
                    'stripe_client_secret': payment_intent.client_secret,
                    'boost_type': sponsored_post.post_type,
                    'boost_days': (sponsored_post.boost_end - sponsored_post.boost_start).days
                }
            }
        )
        
        # Si le payment existe déjà, le mettre à jour
        if not created:
            payment.stripe_payment_intent_id = payment_intent.id
            payment.metadata = {
                **payment.metadata,
                'stripe_client_secret': payment_intent.client_secret,
                'boost_type': sponsored_post.post_type,
                'boost_days': (sponsored_post.boost_end - sponsored_post.boost_start).days
            }
            payment.save()
        
        return Response({
            'client_secret': payment_intent.client_secret,
            'payment_intent_id': payment_intent.id,
            'amount': sponsored_post.price,
            'currency': 'usd',
            'sponsored_post_id': sponsored_post.id,
            'post_title': sponsored_post.original_post.title,
            'payment_id': payment.id  # Important pour le frontend
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return Response(
            {"error": f"Payment processing error: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_boost_payment(request, post_id):
    """
    Confirm boost payment and activate sponsored post
    """
    try:
        post = Post.objects.get(id=post_id, user=request.user)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    payment_intent_id = request.data.get('payment_intent_id')
    
    if not payment_intent_id:
        return Response(
            {"error": "Payment intent ID is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Retrieve payment intent
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Verify payment succeeded
        if payment_intent.status != 'succeeded':
            return Response(
                {"error": f"Payment status is {payment_intent.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get metadata
        metadata = payment_intent.metadata
        sponsored_post_id = metadata.get('sponsored_post_id')
        
        if not sponsored_post_id:
            return Response(
                {"error": "Invalid payment metadata"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get sponsored post
        sponsored_post = SponsoredPost.objects.get(id=sponsored_post_id)
        
        # Verify ownership
        if sponsored_post.original_post.user != request.user:
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update sponsored post
        sponsored_post.payment_status = 'paid'
        sponsored_post.paid_at = timezone.now()
        sponsored_post.save()
        
        # Update payment record
        try:
            payment = Payment.objects.get(payment_intent_id=payment_intent_id)
            payment.status = 'paid'
            payment.save()
        except Payment.DoesNotExist:
            # Create payment record if not exists
            Payment.objects.create(
                user=request.user,
                sponsored_post=sponsored_post,
                campaign=sponsored_post.campaign,
                amount=sponsored_post.price,
                currency='EUR',
                payment_method='stripe',
                payment_intent_id=payment_intent_id,
                status='paid'
            )
        
        return Response({
            "success": True,
            "message": "Post boosted successfully",
            "sponsored_post": SponsoredPostSerializer(sponsored_post, context={'request': request}).data
        })
        
    except stripe.error.StripeError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except SponsoredPost.DoesNotExist:
        return Response(
            {"error": "Sponsored post not found"},
            status=status.HTTP_404_NOT_FOUND
        )

# ==============================================
# STRIPE WEBHOOK
# ==============================================

@csrf_exempt
@api_view(['POST'])
def stripe_webhook(request):
    """
    Webhook to receive Stripe events
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    
    if not endpoint_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        return Response({"error": "Webhook secret not configured"}, status=400)
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        # Invalid payload
        logger.error(f"Invalid payload: {e}")
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        logger.error(f"Invalid signature: {e}")
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle different Stripe events
    # Dans stripe_webhook(), ajoutez ce cas :
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
    
    # Vérifier s'il s'agit d'un boost
        metadata = session.get('metadata', {})
        action = metadata.get('action')
    
        if action == 'post_boost':
            logger.info(f"🎯 Processing boost checkout session")
            handle_boost_checkout_session_completed(session)
        else:
        # Votre logique existante pour les certifications
            handle_boost_checkout_session_completed(session)
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        
        try:
            payment = Payment.objects.get(payment_intent_id=payment_intent['id'])
            payment.status = 'failed'
            payment.save()
            
            logger.info(f"Payment failed: {payment.id}")
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found: {payment_intent['id']}")
    
    return Response({"status": "success"})

# ==============================================
# HELPER FUNCTION FOR MIXING POSTS IN FEED
# ==============================================

def mix_sponsored_with_regular_posts(regular_posts_queryset, request):
    """
    Mix active sponsored posts with regular posts
    """
    # Get active sponsored posts
    active_sponsored = SponsoredPost.objects.filter(
        payment_status='paid',
        boost_start__lte=timezone.now(),
        boost_end__gte=timezone.now(),
        campaign__status='active',
        featured_in_feed=True
    ).select_related('original_post').order_by('-boost_multiplier', '-created_at')
    
    # Convert to lists
    regular_posts = list(regular_posts_queryset)
    sponsored_posts = list(active_sponsored)
    
    if not sponsored_posts:
        return regular_posts
    
    final_list = []
    
    # Separate "always_on_top" posts
    top_sponsored = [sp for sp in sponsored_posts if sp.always_on_top]
    other_sponsored = [sp for sp in sponsored_posts if not sp.always_on_top]
    
    # Add tops first
    final_list.extend([sp.original_post for sp in top_sponsored])
    
    # Mix others with ratio
    sponsored_index = 0
    regular_index = 0
    
    # Ratio: 1 sponsored post for 5 regular posts
    while regular_index < len(regular_posts) or sponsored_index < len(other_sponsored):
        # Add 5 regular posts
        for _ in range(5):
            if regular_index < len(regular_posts):
                final_list.append(regular_posts[regular_index])
                regular_index += 1
        
        # Add 1 sponsored post
        if sponsored_index < len(other_sponsored):
            final_list.append(other_sponsored[sponsored_index].original_post)
            sponsored_index += 1
    
    return final_list

# ==============================================
# ADDITIONAL UTILITY ENDPOINTS
# ==============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_post_boost_status(request, post_id):
    """
    Check if a post is boosted and get details
    Improved version with better error handling and logging
    """
    logger.info(f"🔍 Checking boost status for post {post_id}, user: {request.user.id}")
    
    try:
        # Get the post
        try:
            post = Post.objects.get(id=post_id)
            logger.info(f"✅ Post found: {post.id}, title: {post.title[:50]}...")
        except Post.DoesNotExist:
            logger.error(f"❌ Post {post_id} not found")
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user owns the post (optional, depending on your requirements)
        # If you want to allow anyone to check boost status, remove this check
        if post.user != request.user:
            logger.warning(f"⚠️ User {request.user.id} checking boost status for post owned by {post.user.id}")
            # You might want to still return limited info or raise 403
        
        # Initialize response data
        is_boosted = False
        boost_details = None
        sponsored_post = None
        
        # METHOD 1: Check using the related_name (most reliable)
        try:
            # Check if post has a sponsored_post relationship
            if hasattr(post, 'sponsored_post'):
                sponsored_post = post.sponsored_post
                logger.info(f"✅ Found sponsored_post: {sponsored_post.id}, status: {sponsored_post.payment_status}")
                
                # Check if active
                is_boosted = sponsored_post.is_active()
                logger.info(f"📊 Boost active: {is_boosted}")
                
                if is_boosted:
                    # Calculate days remaining
                    now = timezone.now()
                    if sponsored_post.boost_end:
                        days_remaining = max(0, (sponsored_post.boost_end - now).days)
                    else:
                        days_remaining = 0
                    
                    boost_details = {
                        'id': sponsored_post.id,
                        'type': sponsored_post.post_type,
                        'type_display': sponsored_post.get_post_type_display(),
                        'boost_until': sponsored_post.boost_end,
                        'boost_start': sponsored_post.boost_start,
                        'multiplier': float(sponsored_post.boost_multiplier),
                        'days_remaining': days_remaining,
                        'hours_remaining': max(0, int((sponsored_post.boost_end - now).total_seconds() / 3600)) if sponsored_post.boost_end else 0,
                        'always_on_top': sponsored_post.always_on_top,
                        'featured_in_feed': sponsored_post.featured_in_feed,
                        'price': float(sponsored_post.price),
                        'currency': 'EUR',
                        'payment_status': sponsored_post.payment_status,
                        'payment_status_display': sponsored_post.get_payment_status_display(),
                        'campaign_id': sponsored_post.campaign.id if sponsored_post.campaign else None,
                        'created_at': sponsored_post.created_at,
                    }
                    logger.info(f"📋 Boost details: type={sponsored_post.post_type}, days_remaining={days_remaining}")
                    
        except Exception as e:
            logger.error(f"❌ Error checking sponsored_post relationship: {str(e)}", exc_info=True)
        
        # METHOD 2: Fallback - Direct query to SponsoredPost
        if not sponsored_post:
            try:
                sponsored_post = SponsoredPost.objects.filter(
                    original_post=post
                ).first()
                
                if sponsored_post:
                    logger.info(f"🔄 Fallback: Found sponsored_post via direct query: {sponsored_post.id}")
                    is_boosted = sponsored_post.is_active()
                    
                    if is_boosted:
                        days_remaining = max(0, (sponsored_post.boost_end - timezone.now()).days)
                        boost_details = {
                            'id': sponsored_post.id,
                            'type': sponsored_post.post_type,
                            'boost_until': sponsored_post.boost_end,
                            'multiplier': float(sponsored_post.boost_multiplier),
                            'days_remaining': days_remaining,
                            'always_on_top': sponsored_post.always_on_top,
                            'price': float(sponsored_post.price),
                            'payment_status': sponsored_post.payment_status,
                        }
            except Exception as e:
                logger.error(f"❌ Error in fallback query: {str(e)}")
        
        # METHOD 3: Check via Payment model
        if not is_boosted:
            try:
                # Check if there's an active payment for this post
                active_payment = Payment.objects.filter(
                    Q(post=post) | Q(sponsored_post__original_post=post),
                    user=post.user,
                    payment_type='post_boost',
                    status='completed',
                    boost_end__gt=timezone.now()
                ).order_by('-created_at').first()
                
                if active_payment:
                    logger.info(f"💰 Found active payment for boost: {active_payment.id}")
                    is_boosted = True
                    boost_details = {
                        'type': active_payment.metadata.get('boost_type', 'standard'),
                        'boost_until': active_payment.boost_end,
                        'multiplier': float(active_payment.metadata.get('multiplier', 1.5)),
                        'days_remaining': max(0, (active_payment.boost_end - timezone.now()).days),
                        'price': float(active_payment.amount),
                        'currency': active_payment.currency,
                        'via_payment': True,
                        'payment_id': active_payment.id
                    }
            except Exception as e:
                logger.error(f"❌ Error checking payments: {str(e)}")
        
        # Prepare response
        response_data = {
            'post_id': post_id,
            'post_title': post.title[:100],  # Limit title length
            'user_id': post.user.id,
            'is_boosted': is_boosted,
            'boost_details': boost_details,
            'timestamp': timezone.now().isoformat(),
        }
        
        # Add additional info if debug mode
        if settings.DEBUG:
            response_data['debug'] = {
                'has_sponsored_post_attr': hasattr(post, 'sponsored_post'),
                'sponsored_post_id': sponsored_post.id if sponsored_post else None,
                'sponsored_post_active': sponsored_post.is_active() if sponsored_post else False,
                'post_owner_id': post.user.id,
                'request_user_id': request.user.id,
            }
        
        logger.info(f"✅ Boost status check complete: is_boosted={is_boosted}")
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"❌ Unexpected error in check_post_boost_status: {str(e)}", exc_info=True)
        return Response(
            {
                'error': 'Internal server error',
                'message': str(e) if settings.DEBUG else 'Please try again later',
                'post_id': post_id
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_active_boosts(request):
    """
    Get all active boosted posts (public endpoint)
    """
    active_posts = SponsoredPost.objects.filter(
        payment_status='paid',
        boost_start__lte=timezone.now(),
        boost_end__gte=timezone.now(),
        campaign__status='active'
    ).select_related('original_post').order_by('-boost_multiplier', '-created_at')
    
    data = []
    for sp in active_posts:
        data.append({
            'post_id': sp.original_post.id,
            'title': sp.original_post.title,
            'boost_type': sp.post_type,
            'boost_multiplier': sp.boost_multiplier,
            'boost_until': sp.boost_end,
            'always_on_top': sp.always_on_top
        })
    
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_boost_checkout_session(request, post_id):
    """Créer une session de checkout Stripe pour booster un post"""
    try:
        # 1. Vérifier le post
        try:
            post = Post.objects.get(id=post_id, user=request.user)
        except Post.DoesNotExist:
            logger.error(f"❌ Post {post_id} not found or unauthorized")
            return Response(
                {"error": "Post non trouvé ou non autorisé"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 2. VÉRIFIER ET GÉRER LE SPONSOREDPOST EXISTANT
        sponsored_post = None
        
        if hasattr(post, 'sponsored_post'):
            sponsored_post = post.sponsored_post
            logger.info(f"📌 SponsoredPost existant trouvé: {sponsored_post.id}")
            
            # Vérifier s'il est actif
            if sponsored_post.is_active():
                logger.warning(f"⚠️ Post {post_id} déjà boosté et actif")
                return Response(
                    {
                        "error": "Ce post est déjà boosté",
                        "boost_until": sponsored_post.boost_end,
                        "current_type": sponsored_post.post_type
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # S'il est expiré, on peut le réutiliser
                logger.info(f"🔄 SponsoredPost expiré, réutilisation: {sponsored_post.id}")
        
        # 3. Récupérer le type de boost
        data = request.data
        boost_type = data.get('boost_type', 'standard_7')
        
        logger.info(f"🛒 Creating boost checkout for post {post_id}, type: {boost_type}")
        
        # 4. Vérifier le plan
        boost_config = settings.STRIPE_BOOST_PLANS.get(boost_type)
        if not boost_config:
            logger.error(f"❌ Boost type not found: {boost_type}")
            return Response(
                {"error": "Type de boost non trouvé"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 5. Créer ou récupérer le client Stripe
        customer = None
        try:
            existing_payment = Payment.objects.filter(
                user=request.user,
                stripe_customer_id__isnull=False
            ).first()
            
            if existing_payment and existing_payment.stripe_customer_id:
                customer = stripe.Customer.retrieve(existing_payment.stripe_customer_id)
                logger.info(f"✅ Client Stripe existant: {customer.id}")
            else:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=request.user.get_full_name() or request.user.username,
                    metadata={
                        'user_id': request.user.id,
                        'username': request.user.username,
                    }
                )
                logger.info(f"✅ Nouveau client Stripe créé: {customer.id}")
        except Exception as e:
            logger.error(f"❌ Erreur client Stripe: {str(e)}")
            return Response(
                {"error": f"Erreur client: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # 6. Créer la session de checkout
        try:
            checkout_session = stripe.checkout.Session.create(
                customer=customer.id,
                payment_method_types=['card'],
                line_items=[{
                    'price': boost_config['price_id'],
                    'quantity': 1,
                }],
                mode='payment',  # Paiement unique
                success_url=(
                    f"{settings.FRONTEND_URL}/posts/{post_id}/boost/success?"
                    f"session_id={{CHECKOUT_SESSION_ID}}&post_id={post_id}"
                ),
                cancel_url=(
                    f"{settings.FRONTEND_URL}/posts/{post_id}/boost/cancel?"
                    f"session_id={{CHECKOUT_SESSION_ID}}"
                ),
                metadata={
                    'user_id': request.user.id,
                    'post_id': post_id,
                    'boost_type': boost_type,
                    'post_title': post.title[:100],
                    'username': request.user.username,
                    'action': 'post_boost',
                },
                billing_address_collection='auto',
                allow_promotion_codes=True,
            )
            
            logger.info(f"✅ Session checkout créée: {checkout_session.id}")
            
        except Exception as e:
            logger.error(f"❌ Erreur création session Stripe: {str(e)}")
            return Response(
                {"error": f"Erreur passerelle de paiement: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # 7. CRÉER OU METTRE À JOUR LE SPONSOREDPOST
        try:
            # Créer une campagne par défaut
            campaign, created = AdCampaign.objects.get_or_create(
                user=request.user,
                name=f"Boost Auto - Post {post.id}",
                defaults={
                    'budget': 100.00,
                    'start_date': timezone.now(),
                    'end_date': timezone.now() + timedelta(days=30),
                    'status': 'active'
                }
            )
            
            # Calculer la date de fin
            boost_end = timezone.now() + timedelta(days=boost_config['duration_days'])
            
            if sponsored_post:
                # METTRE À JOUR le sponsored post existant
                sponsored_post.campaign = campaign
                sponsored_post.post_type = boost_type.replace('_', ' ').title()
                sponsored_post.price = boost_config['amount'] / 100
                sponsored_post.boost_start = timezone.now()
                sponsored_post.boost_end = boost_end
                sponsored_post.boost_multiplier = boost_config['multiplier']
                sponsored_post.always_on_top = boost_config.get('always_on_top', False)
                sponsored_post.featured_in_feed = True
                sponsored_post.payment_status = 'pending'
                sponsored_post.save()
                
                logger.info(f"✅ SponsoredPost mis à jour: {sponsored_post.id}")
            else:
                # CRÉER un nouveau sponsored post
                sponsored_post = SponsoredPost.objects.create(
                    original_post=post,
                    campaign=campaign,
                    post_type=boost_type.replace('_', ' ').title(),
                    price=boost_config['amount'] / 100,
                    boost_start=timezone.now(),
                    boost_end=boost_end,
                    boost_multiplier=boost_config['multiplier'],
                    always_on_top=boost_config.get('always_on_top', False),
                    featured_in_feed=True,
                    payment_status='pending'
                )
                
                logger.info(f"✅ Nouveau SponsoredPost créé: {sponsored_post.id}")
            
        except Exception as e:
            logger.error(f"❌ Erreur gestion SponsoredPost: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Erreur base de données: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # 8. Enregistrer le paiement en attente
        try:
            payment = Payment.objects.create(
                user=request.user,
                stripe_customer_id=customer.id,
                stripe_checkout_session_id=checkout_session.id,
                payment_type='post_boost',
                sponsored_post=sponsored_post,
                post=post,
                campaign=campaign,
                amount=boost_config['amount'] / 100,
                currency=boost_config['currency'].upper(),
                status='pending',
                boost_start=timezone.now(),
                boost_end=boost_end,
                metadata={
                    'boost_type': boost_type,
                    'boost_config': boost_config,
                    'post_title': post.title,
                    'post_id': post_id,
                    'duration_days': boost_config['duration_days'],
                    'multiplier': boost_config['multiplier'],
                    'always_on_top': boost_config.get('always_on_top', False),
                    'features': boost_config.get('features', []),
                    'frontend_url': settings.FRONTEND_URL,
                    'created_at': timezone.now().isoformat(),
                    'sponsored_post_updated': sponsored_post is not None
                }
            )
            
            logger.info(f"💰 Enregistrement paiement créé: {payment.id}")
            
        except Exception as e:
            logger.error(f"❌ Erreur enregistrement paiement: {str(e)}")
            return Response(
                {"error": f"Erreur enregistrement: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'status': 'success',
            'session_id': checkout_session.id,
            'checkout_url': checkout_session.url,
            'amount': boost_config['amount'] / 100,
            'currency': boost_config['currency'].upper(),
            'boost_type': boost_type,
            'boost_name': boost_config['name'],
            'duration_days': boost_config['duration_days'],
            'multiplier': boost_config['multiplier'],
            'payment_id': payment.id,
            'sponsored_post_id': sponsored_post.id,
            'customer_id': customer.id,
            'sponsored_post_action': 'updated' if hasattr(post, 'sponsored_post') else 'created'
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur création session boost: {str(e)}", exc_info=True)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def boost_checkout_success(request):
    """Vérifier le succès d'un paiement de boost"""
    try:
        session_id = request.GET.get('session_id')
        post_id = request.GET.get('post_id')
        
        if not session_id:
            logger.error("❌ Session ID manquant")
            return Response({
                'status': 'error',
                'message': 'Session ID requis'
            }, status=400)
        
        logger.info(f"🎉 Vérification succès boost - Session: {session_id}, Post: {post_id}")
        
        # 1. Trouver le paiement
        payment = Payment.objects.filter(
            stripe_checkout_session_id=session_id,
            user=request.user
        ).first()
        
        if not payment:
            logger.error(f"❌ Paiement non trouvé pour session: {session_id}")
            return Response({
                'status': 'error',
                'message': 'Paiement non trouvé'
            }, status=404)
        
        logger.info(f"✅ Paiement trouvé: {payment.id}, statut: {payment.status}")
        
        # 2. Si déjà complété
        if payment.status == 'completed':
            logger.info(f"✅ Paiement déjà traité")
            
            # Vérifier si le post est boosté
            if payment.sponsored_post and payment.sponsored_post.is_active():
                return Response({
                    'status': 'already_completed',
                    'message': 'Boost déjà activé',
                    'payment': PaymentSerializer(payment, context={'request': request}).data,
                    'sponsored_post': SponsoredPostSerializer(
                        payment.sponsored_post, 
                        context={'request': request}
                    ).data,
                    'boost_until': payment.sponsored_post.boost_end.isoformat(),
                    'redirect_url': f"{settings.FRONTEND_URL}/posts/{payment.post.id}?boosted=true"
                })
        
        # 3. Vérifier la session Stripe
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            logger.info(f"📊 Statut session Stripe: {session.payment_status}")
        except Exception as e:
            logger.error(f"❌ Erreur récupération session Stripe: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Impossible de vérifier le paiement Stripe: {str(e)}'
            }, status=500)
        
        # 4. Traiter selon le statut
        if session.payment_status == 'paid':
            logger.info(f"✅ Paiement confirmé, activation du boost...")
            
            # Mettre à jour le paiement
            old_status = payment.status
            payment.status = 'completed'
            payment.payment_date = timezone.now()
            
            # Mettre à jour les métadonnées
            if not payment.metadata:
                payment.metadata = {}
            
            payment.metadata.update({
                'stripe_session': {
                    'id': session.id,
                    'payment_status': session.payment_status,
                    'customer': session.customer,
                },
                'completed_at': timezone.now().isoformat(),
                'completed_via': 'checkout_success',
            })
            
            payment.save()
            logger.info(f"✅ Paiement mis à jour: {payment.id} ({old_status} → {payment.status})")
            
            # 5. Activer le boost
            logger.info("🚀 Activation du boost...")
            activated_boost = payment.process_payment_success()
            
            if not activated_boost:
                logger.error(f"❌ Échec activation boost pour paiement {payment.id}")
                return Response({
                    'status': 'error',
                    'message': 'Échec activation du boost'
                }, status=500)
            
            logger.info(f"✅ Boost activé: {activated_boost.id}")
            
            return Response({
                'status': 'success',
                'message': 'Post boosté avec succès !',
                'payment': PaymentSerializer(payment, context={'request': request}).data,
                'sponsored_post': SponsoredPostSerializer(
                    payment.sponsored_post, 
                    context={'request': request}
                ).data,
                'boost_details': {
                    'type': payment.sponsored_post.post_type,
                    'multiplier': payment.sponsored_post.boost_multiplier,
                    'until': payment.sponsored_post.boost_end,
                    'days_remaining': payment.sponsored_post.days_remaining()
                },
                'redirect_url': f"{settings.FRONTEND_URL}/posts/{payment.post.id}?boosted=true"
            })
        
        elif session.payment_status == 'unpaid':
            logger.warning(f"⚠️ Paiement non effectué pour session: {session_id}")
            payment.status = 'failed'
            payment.save()
            
            return Response({
                'status': 'failed',
                'message': 'Paiement échoué ou non complété'
            }, status=400)
        
        else:
            logger.info(f"⏳ Paiement en cours: {session.payment_status}")
            
            return Response({
                'status': 'processing',
                'message': 'Paiement en cours de traitement',
                'payment_status': session.payment_status,
                'suggestion': 'Actualisez cette page dans 30 secondes',
                'check_again_url': f"{request.path}?session_id={session_id}&post_id={post_id}&t={int(timezone.now().timestamp())}"
            })
        
    except Exception as e:
        logger.error(f"❌ Erreur vérification succès boost: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def boost_checkout_cancel(request):
    """Annulation d'un boost"""
    session_id = request.GET.get('session_id')
    
    payment = Payment.objects.filter(
        stripe_checkout_session_id=session_id,
        user=request.user
    ).first()
    
    if payment and payment.status == 'pending':
        payment.status = 'canceled'
        payment.save()
        
        # Supprimer le post sponsorisé en attente
        if payment.sponsored_post:
            payment.sponsored_post.delete()
    
    return Response({
        'status': 'canceled',
        'message': 'Boost annulé',
        'session_id': session_id,
        'redirect_url': f"{settings.FRONTEND_URL}/posts/{payment.post.id if payment and payment.post else ''}"
    })


def handle_boost_checkout_session_completed(session):
    """Gérer la session de checkout de boost complétée (pour webhook)"""
    try:
        logger.info(f"🛒 Processing boost checkout.session.completed: {session.get('id')}")
        
        metadata = session.get('metadata', {})
        user_id = metadata.get('user_id')
        post_id = metadata.get('post_id')
        
        if not user_id or not post_id:
            logger.error(f"❌ Metadata incomplète: {metadata}")
            return
        
        # Récupérer l'utilisateur et le post
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            post = Post.objects.get(id=post_id)
        except (User.DoesNotExist, Post.DoesNotExist) as e:
            logger.error(f"❌ User/Post not found: {str(e)}")
            return
        
        # Trouver le paiement
        payment = Payment.objects.filter(
            stripe_checkout_session_id=session.get('id'),
            user=user
        ).first()
        
        if not payment:
            logger.warning(f"⚠️ Payment not found, creating from webhook...")
            
            # Créer le paiement depuis le webhook
            boost_type = metadata.get('boost_type', 'standard_7')
            boost_config = settings.STRIPE_BOOST_PLANS.get(boost_type, {})
            
            if not boost_config:
                logger.error(f"❌ Boost config not found: {boost_type}")
                return
            
            # Créer une campagne
            campaign, _ = AdCampaign.objects.get_or_create(
                user=user,
                name=f"Boost Webhook - Post {post.id}",
                defaults={
                    'budget': 100.00,
                    'start_date': timezone.now(),
                    'end_date': timezone.now() + timedelta(days=30),
                    'status': 'active'
                }
            )
            
            # Créer le post sponsorisé
            boost_end = timezone.now() + timedelta(days=boost_config.get('duration_days', 7))
            
            sponsored_post = SponsoredPost.objects.create(
                original_post=post,
                campaign=campaign,
                post_type=boost_type.replace('_', ' ').title(),
                price=boost_config.get('amount', 1000) / 100,
                boost_start=timezone.now(),
                boost_end=boost_end,
                boost_multiplier=boost_config.get('multiplier', 1.5),
                always_on_top=boost_config.get('always_on_top', False),
                featured_in_feed=True,
                payment_status='pending'
            )
            
            # Créer le paiement
            payment = Payment.objects.create(
                user=user,
                stripe_customer_id=session.get('customer'),
                stripe_checkout_session_id=session.get('id'),
                payment_type='post_boost',
                sponsored_post=sponsored_post,
                post=post,
                campaign=campaign,
                amount=boost_config.get('amount', 1000) / 100,
                currency='EUR',
                status='completed',
                payment_date=timezone.now(),
                boost_start=timezone.now(),
                boost_end=boost_end,
                metadata=metadata
            )
            
            logger.info(f"💰 Payment créé depuis webhook: {payment.id}")
        
        # Mettre à jour et activer
        if payment.status != 'completed':
            payment.status = 'completed'
            payment.payment_date = timezone.now()
            payment.save()
        
        # Activer le boost
        payment.process_payment_success()
        logger.info(f"✅ Boost activé depuis webhook pour payment {payment.id}")
        
    except Exception as e:
        logger.error(f"❌ Error in handle_boost_checkout_session_completed: {str(e)}", exc_info=True)