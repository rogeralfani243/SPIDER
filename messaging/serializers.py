# messaging/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message, GroupCategory, GroupFeedback, GroupJoinRequest, GroupMember
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, Q
from cryptography.fernet import Fernet 


User = get_user_model()

# ==================== SERIALIZERS UTILISATEUR ====================

class BasicUserSerializer(serializers.ModelSerializer):
    """Serializer basique pour l'utilisateur (sans profile_image)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields

class UserSerializer(serializers.ModelSerializer):
    """User serializer (lightweight)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields

class UserWithProfileSerializer(serializers.ModelSerializer):
    """Serializer utilisateur AVEC image de profil, statut en ligne et statut actif"""
    profile_image = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()
    formatted_last_seen = serializers.SerializerMethodField()
    profile_id = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    is_account_active = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'profile_id', 'id', 'username', 'email', 'first_name', 'last_name', 
            'profile_image', 'is_online', 'last_seen', 'formatted_last_seen',
            'is_active', 'is_account_active'
        ]
        read_only_fields = fields
    
    def get_profile_id(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.id
        return None
    
    def get_profile_image(self, obj):
        if hasattr(obj, 'profile') and obj.profile and obj.profile.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.image.url)
            return obj.profile.image.url
        return None
    
    def get_is_online(self, obj):
        """Déterminer si l'utilisateur est en ligne"""
        if hasattr(obj, 'online_status'):
            online_status = obj.online_status
            two_minutes_ago = timezone.now() - timedelta(minutes=2)
            return online_status.last_activity > two_minutes_ago
        return False
    
    def get_last_seen(self, obj):
        """Récupérer la dernière fois vu (timestamp)"""
        if hasattr(obj, 'online_status'):
            return obj.online_status.last_activity
        return None
    
    def get_formatted_last_seen(self, obj):
        """Formater la dernière fois vu en texte"""
        if hasattr(obj, 'online_status'):
            dt = obj.online_status.last_activity
            if not dt:
                return "Never"
            
            now = timezone.now()
            diff = now - dt
            
            if diff < timedelta(minutes=1):
                return "Just now"
            elif diff < timedelta(hours=1):
                minutes = int(diff.total_seconds() / 60)
                return f"{minutes}m ago"
            elif diff < timedelta(days=1):
                hours = int(diff.total_seconds() / 3600)
                return f"{hours}h ago"
            elif diff < timedelta(days=30):
                days = diff.days
                return f"{days}d ago"
            else:
                return dt.strftime("%Y-%m-%d")
        return "Unknown"
    
    def get_is_active(self, obj):
        """
        Récupérer le statut actif de l'utilisateur Django
        Retourne True si l'utilisateur est actif, False sinon
        """
        # Vérifier d'abord le champ is_active de l'utilisateur Django
        if not obj.is_active:
            return False
        
        # Ensuite vérifier le profil (si disponible)
        if hasattr(obj, 'profile') and obj.profile:
            # Vérifier si le profil a un champ is_active
            if hasattr(obj.profile, 'is_active'):
                return obj.profile.is_active
            
            # Vérifier si le profil a un champ deleted_at
            if hasattr(obj.profile, 'deleted_at'):
                return obj.profile.deleted_at is None
        
        return True
    
    def get_is_account_active(self, obj):
        """
        Version alternative pour plus de clarté
        Retourne True si le compte est pleinement actif
        """
        return self.get_is_active(obj)

# ==================== SERIALIZERS MESSAGE ====================

class MessageSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    sender = UserWithProfileSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()
    is_system_message = serializers.BooleanField(read_only=True)
    system_message_type = serializers.CharField(read_only=True, allow_null=True)
    message_type = serializers.CharField(read_only=True, allow_null=True)
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content', 
            'image', 'file', 'timestamp', 'is_read', 
            'image_url', 'file_url', 'file_type',
            'deleted_for_sender', 'deleted_for_receiver', 'deleted_for_everyone',
            # AJOUTEZ CES CHAMPS
            'is_system_message', 'system_message_type', 'message_type'
        ]
        read_only_fields = [
            'id', 'conversation', 'sender', 'timestamp', 'is_read',
            'is_system_message', 'system_message_type', 'message_type'
        ]
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_type(self, obj):
        if obj.image:
            return 'image'
        elif obj.file:
            filename = obj.file.name.lower()
            if any(filename.endswith(ext) for ext in ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v']):
                return 'video'
            elif any(filename.endswith(ext) for ext in ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.webm', '.aac']):
                return 'audio'
            elif filename.endswith('.pdf'):
                return 'pdf'
            else:
                return 'file'
        return None
    def get_content(self, obj):
        """Décrypter le contenu si possible"""
        if not obj.encrypted_content:
            return ""
        
        try:
            # Vérifier si on a la clé de décryption dans le contexte
            decryption_key = self.context.get('decryption_key')
            if decryption_key:
                # Logique de décryption (à adapter selon votre implémentation)
                fernet = Fernet(decryption_key)
                decrypted = fernet.decrypt(
                    obj.encrypted_content.encode() if isinstance(obj.encrypted_content, str) 
                    else obj.encrypted_content
                )
                return decrypted.decode()
            else:
                # Retourner le contenu encrypté ou indiquer qu'il est encrypté
                return "[Encrypted message]"
        except Exception as e:
            print(f"Encrypted error: {e}")
            return "[Encrypted error]"
# ==================== SERIALIZERS CONVERSATION ====================

class ConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a conversation"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    
    class Meta:
        model = Conversation
        fields = ['id', 'participant_ids', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids')
        conversation = Conversation.objects.create(**validated_data)
        
        users = User.objects.filter(id__in=participant_ids)
        conversation.participants.add(*users)
        
        request = self.context.get('request')
        if request and request.user not in users:
            conversation.participants.add(request.user)
        
        return conversation

class ConversationSerializer(serializers.ModelSerializer):
    """Serializer pour lire une conversation"""
    participants = UserWithProfileSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    is_group = serializers.BooleanField(read_only=True)
    name = serializers.CharField(read_only=True, allow_null=True)
    description = serializers.CharField(read_only=True, allow_null=True)
    group_type = serializers.CharField(read_only=True)
    group_photo_url = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    can_user_join = serializers.SerializerMethodField()
    can_invite = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'created_at', 'updated_at',
            'last_message', 'unread_count', 'display_name', 'can_invite', 
            'is_group', 'name', 'description', 'group_type',
            'group_photo_url', 'created_by', 'members_count',
            'can_anyone_invite', 'can_user_join', 'max_participants'
        ]
        read_only_fields = fields
    
    def get_can_invite(self, obj):
        """Déterminer si l'utilisateur actuel peut inviter"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.can_anyone_invite:
                return True
            return obj.created_by == request.user
        return False
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
    
    def get_display_name(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_display_name(request.user)
        return ""
    
    def get_group_photo_url(self, obj):
        if obj.group_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.group_photo.url)
            return obj.group_photo.url
        return None
    
    def get_members_count(self, obj):
        return obj.participants.count()
    
    def get_can_user_join(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_user_join(request.user)
        return False

class GroupCategorySerializer(serializers.ModelSerializer):
    """Serializer pour les catégories de groupes"""
    groups_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupCategory
        fields = ['id', 'name', 'description', 'icon', 'is_active', 'groups_count']
        read_only_fields = fields
    
    def get_groups_count(self, obj):
        return obj.groups.filter(is_active=True, is_visible=True).count()

class GroupFeedbackSerializer(serializers.ModelSerializer):
    """Serializer pour les feedbacks de groupes"""
    user = serializers.SerializerMethodField(read_only=True)  # Marquer comme read_only
    user_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupFeedback
        fields = [
            'id', 'group', 'user', 'user_profile', 'rating', 'comment',
            'created_at', 'updated_at', 'is_visible'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'is_visible']
    
    def create(self, validated_data):
        # Ajouter automatiquement l'utilisateur
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # L'utilisateur ne peut pas être modifié lors d'une mise à jour
        validated_data.pop('user', None)
        return super().update(instance, validated_data)
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username
        }
    
    
    def get_user_profile(self, obj):
        if hasattr(obj.user, 'profile'):
            profile = obj.user.profile
            request = self.context.get('request')
            return {
                'id': profile.id,
                'image': request.build_absolute_uri(profile.image.url) if profile.image and request else None
            }
        return None

class GroupMemberSerializer(serializers.ModelSerializer):
    """Serializer pour les membres de groupe"""
    user = UserWithProfileSerializer(read_only=True)
    
    class Meta:
        model = GroupMember
        fields = [
            'id', 'group', 'user', 'role', 'joined_at',
            'last_active', 'is_banned', 'permissions'
        ]
        read_only_fields = fields

class GroupJoinRequestSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes d'adhésion"""
    user = UserWithProfileSerializer(read_only=True)
    group = ConversationSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = GroupJoinRequest
        fields = [
            'id', 'group', 'user', 'status', 'message',
            'created_at', 'reviewed_at', 'reviewed_by', 'review_notes'
        ]
        read_only_fields = ['id', 'created_at', 'reviewed_at', 'reviewed_by']

class GroupCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un groupe - CORRIGÉ"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )
    group_photo = serializers.ImageField(required=False, allow_null=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
   
    )
    # AJOUTER is_visible avec valeur par défaut
    is_visible = serializers.BooleanField(required=False, default=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'name', 'description', 'group_type', 
            'participant_ids', 'group_photo', 'can_anyone_invite',
            'max_participants', 'category_id', 'requires_approval',
            'is_visible', 'tags', 'location', 'website', 'rules'
        ]
    
    def validate(self, data):
        group_type = data.get('group_type', 'group_private')
        
        if group_type == 'group_public':
            if not data.get('name'):
                raise serializers.ValidationError({
                    'name': 'Un nom est requis pour un groupe public'
                })
        
        tags = data.get('tags', [])
        if len(tags) > 10:
            raise serializers.ValidationError({
                'tags': 'Maximum 10 tags autorisés'
            })
        
        return data
    def to_internal_value(self, data):
        # S'assurer que les tags vides ne deviennent pas "[]"
        if 'tags' in data and data['tags'] == []:
            data['tags'] = None
        return super().to_internal_value(data)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ne pas inclure tags s'il est null
        if data.get('tags') is None:
            data.pop('tags', None)
        return data

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        category_id = validated_data.pop('category_id', None)
        tags = validated_data.pop('tags', None)
        
        request = self.context.get('request')
        if tags == [] or tags == ["[]"] or tags == '[]':
            tags = None
        # Ensure is_visible is defined
        if 'is_visible' not in validated_data:
            validated_data['is_visible'] = True
        
        # Create the group conversation
        conversation = Conversation.objects.create(
            is_group=True,
            created_by=request.user if request else None,
            tags=tags,
            **validated_data
        )
        
        # Add category if specified
        if category_id:
            try:
                category = GroupCategory.objects.get(id=category_id)
                conversation.category = category
                conversation.save()
            except GroupCategory.DoesNotExist:
                pass
        
        # Add participants
        users = User.objects.filter(id__in=participant_ids)
        all_participants = list(users)
        
        if request and request.user not in all_participants:
            all_participants.append(request.user)
        
        conversation.participants.add(*all_participants)
        
        # Create GroupMember records
        for user in all_participants:
            role = 'owner' if user == request.user else 'member'
            GroupMember.objects.create(
                group=conversation,
                user=user,
                role=role
            )
        
        # Create a SYSTEM welcome message
        if conversation.name:
            welcome_message = f"{request.user.username} created the group \"{conversation.name}\""
        else:
            participant_names = ", ".join([user.username for user in all_participants])
            welcome_message = f"{request.user.username} created a group with {participant_names}"
        
        # Create the message as a system message
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=welcome_message,
            is_system_message=True,
            system_message_type='group_created',
            message_type='system'
        )
        
        # Create messages for each added participant (optional)
        for participant in all_participants:
            if participant.id != request.user.id:
                Message.objects.create(
                    conversation=conversation,
                    sender=request.user,
                    content=f"{request.user.username} added {participant.username} to the group",
                    is_system_message=True,
                    system_message_type='user_added',
                    message_type='system'
                )
        
        return conversation

# messaging/serializers.py - CORRIGEZ GroupDetailSerializer

class GroupDetailSerializer(ConversationSerializer):
    """Serializer détaillé pour les groupes - CORRIGÉ"""
    is_member = serializers.SerializerMethodField()
    can_invite = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()
    has_pending_request = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    rating_distribution = serializers.SerializerMethodField()
    category = GroupCategorySerializer(read_only=True)
    # CORRECTION: Modifier pour retourner TOUS les membres
    group_members = serializers.SerializerMethodField()  # Tous les membres
    pending_requests_count = serializers.SerializerMethodField()
    current_members_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()  
    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + [
            'is_member', 'can_invite', 'can_join', 'has_pending_request',
            'average_rating', 'total_reviews', 'rating_distribution',
            'category', 'group_members', 'pending_requests_count',
            'requires_approval', 'is_visible', 'tags', 'location',
            'website', 'rules', 'available_spots', 'is_full',
            'current_members_count'
        ]

    # -------------------- Permissions --------------------
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.is_user_member(request.user)
        return False

    def get_can_invite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.can_anyone_invite:
                return True
            return obj.created_by == request.user
        return False

    def get_can_join(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if not obj.is_user_member(request.user) and not obj.is_full:
                return obj.group_type == 'group_public'
        return False

    def get_has_pending_request(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.join_requests.filter(user=request.user, status='pending').exists()
        return False

    # -------------------- Ratings --------------------
    def get_average_rating(self, obj):
        avg = obj.feedbacks.filter(is_visible=True).aggregate(avg_rating=Avg('rating'))['avg_rating']
        return float(avg) if avg else 0.0

    def get_total_reviews(self, obj):
        return obj.feedbacks.filter(is_visible=True).count()

    def get_rating_distribution(self, obj):
        ratings = obj.feedbacks.filter(is_visible=True)
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating in ratings:
            distribution[rating.rating] += 1
        return distribution

    # -------------------- Members - CORRECTION --------------------
    def get_group_members(self, obj):
        """Retourne TOUS les membres du groupe (pas seulement les admins)"""
        request = self.context.get('request')
        
        # DEBUG: Vérifier les données
        print(f"🔍 DEBUG Serializer - Group {obj.id}:")
        print(f"  Total participants: {obj.participants.count()}")
        print(f"  Total GroupMember records: {obj.member_info.count()}")
        
        # Récupérer TOUS les GroupMember (pas de filtre)
        group_members = obj.member_info.all().select_related('user', 'user__profile')
        
        # DEBUG: Lister tous les membres
        members_list = list(group_members)
        print(f"  Members found in serializer: {len(members_list)}")
        for gm in members_list[:5]:  # Afficher les 5 premiers
            print(f"    - {gm.user.username} (role: {gm.role})")
        
        # Limiter à 20 pour l'aperçu
        limited_members = members_list[:20]
        
        return GroupMemberSerializer(limited_members, many=True, context=self.context).data

    # -------------------- Join Requests --------------------
    def get_pending_requests_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.created_by == request.user:
            return obj.join_requests.filter(status='pending').count()
        return 0

    # -------------------- Counts & Spots --------------------
    def get_current_members_count(self, obj):
        return obj.participants.count()

    def get_is_full(self, obj):
        return obj.participants.count() >= obj.max_participants if obj.max_participants else False

    def get_available_spots(self, obj):
        if obj.max_participants:
            return max(0, obj.max_participants - obj.participants.count())
        return None
    def get_tags(self, obj):
        """Retourne les tags sous forme de tableau"""
        print(f"🔍 DEBUG - Raw tags from model: {obj.tags}")
        print(f"🔍 DEBUG - Type of tags: {type(obj.tags)}")
        
        if obj.tags:
            # Si c'est déjà un tableau
            if isinstance(obj.tags, list):
                print(f"✅ Tags is already a list: {obj.tags}")
                return obj.tags
            
            # Si c'est une chaîne JSON
            if isinstance(obj.tags, str):
                try:
                    import json
                    parsed = json.loads(obj.tags)
                    print(f"✅ Parsed JSON tags: {parsed}")
                    
                    if isinstance(parsed, list):
                        return parsed
                    else:
                        return [str(parsed)]
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"❌ JSON parse error: {e}")
                    # Si ce n'est pas du JSON valide, retourner comme tableau
                    return [obj.tags]
            
            # Autres types
            print(f"⚠️ Unknown tags format, converting to string")
            return [str(obj.tags)]
        
        print(f"📭 No tags found")
        return []
class PublicGroupSerializer(serializers.ModelSerializer):
    """Serializer pour les groupes publics (vue non-authentifiée)"""
    category = GroupCategorySerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    group_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'name', 'description', 'group_type',
            'category', 'members_count', 'average_rating',
            'total_reviews', 'group_photo_url', 'tags',
            'location', 'created_at', 'requires_approval',
            'is_visible', 'max_participants'
        ]
        read_only_fields = fields
    
    def get_members_count(self, obj):
        return obj.participants.count()
    
    def get_average_rating(self, obj):
        avg = obj.feedbacks.filter(is_visible=True).aggregate(
            avg_rating=Avg('rating')
        )['avg_rating']
        return float(avg) if avg else 0.0
    
    def get_total_reviews(self, obj):
        return obj.feedbacks.filter(is_visible=True).count()
    
    def get_group_photo_url(self, obj):
        if obj.group_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.group_photo.url)
            return obj.group_photo.url
        return None

class ConversationDetailSerializer(ConversationSerializer):
    """Detailed serializer for conversation with messages"""
    messages = serializers.SerializerMethodField()
    
    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ['messages']
    
    def get_messages(self, obj):
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            return []
        
        # Filtrer les messages selon les permissions
        messages = obj.messages.filter(
            deleted_for_everyone=False
        )
        
        # Pour les messages personnels
        messages = messages.filter(
            Q(deleted_for_sender=False) | 
            Q(deleted_for_receiver=False)
        )
        
        # Marquer comme lus
        if request.user.is_authenticated:
            unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
            if unread_messages.exists():
                unread_messages.update(is_read=True)
        
        return MessageSerializer(messages, many=True, context=self.context).data
    
