from rest_framework import serializers
from .models import ChatGroup, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'avatar']
        
    def get_avatar(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.avatar.url)
            return obj.profile.avatar.url
        return None

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserMinimalSerializer(read_only=True)
    sender_id = serializers.PrimaryKeyRelatedField(source='sender', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'group', 'sender', 'sender_id', 'content', 'attachment', 'timestamp', 'is_edited']

class ChatGroupSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    reference_id = serializers.SerializerMethodField()
    latest_message_time = serializers.DateTimeField(read_only=True)
    latest_message_content = serializers.CharField(read_only=True)
    unread_count = serializers.IntegerField(read_only=True)
    participants = serializers.SerializerMethodField()

    class Meta:
        model = ChatGroup
        fields = ['id', 'name', 'type', 'reference_id', 'created_at', 'latest_message_time', 'latest_message_content', 'unread_count', 'participants']

    def get_name(self, obj):
        if obj.team:
            return obj.team.name
        if obj.project:
            return obj.project.name
        return obj.name

    def get_type(self, obj):
        if obj.team:
            return 'team'
        if obj.project:
            return 'project'
        return 'custom'

    def get_reference_id(self, obj):
        if obj.team:
            return obj.team.id
        if obj.project:
            return obj.project.id
        return None

    def get_participants(self, obj):
        users = set()
        
        def add_team_members(team):
            if not team: return
            if team.head:
                users.add(team.head)
            for tm in team.memberships.all():
                users.add(tm.user)

        if obj.team:
            add_team_members(obj.team)
            
        if obj.project:
            for member in obj.project.members.all():
                users.add(member)
            if obj.project.team:
                add_team_members(obj.project.team)
                
        # Include super admins / admins conceptually? No, admins implicitly have access to all, but aren't strictly "in" the specific group unless we add them. Let's just list actual team/project members.
        
        participant_list = []
        for u in users:
            name = f"{u.first_name} {u.last_name}".strip()
            
            avatar_url = None
            if hasattr(u, 'profile') and u.profile.avatar:
                request = self.context.get('request')
                if request:
                    avatar_url = request.build_absolute_uri(u.profile.avatar.url)
                else:
                    avatar_url = u.profile.avatar.url
                    
            participant_list.append({
                'id': u.id,
                'name': name or u.username,
                'initials': name[:2].upper() if name else u.username[:2].upper(),
                'avatar': avatar_url
            })
            
        return sorted(participant_list, key=lambda x: x['name'])
