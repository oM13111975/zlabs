from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Team, TeamMembership, Meeting
from users.serializers import UserSerializer


class TeamMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeamMembership
        fields = ['id', 'user', 'team', 'joined_at']


class TeamSerializer(serializers.ModelSerializer):
    head = UserSerializer(read_only=True)
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='head', write_only=True, required=False, allow_null=True
    )
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'id', 'name', 'domain', 'description',
            'head', 'head_id', 'member_count', 'members', 'project_count', 'projects', 'created_at'
        ]

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_members(self, obj):
        memberships = obj.memberships.select_related('user', 'user__profile').all()
        return [{
            'id': m.user.id,
            'username': m.user.username,
            'full_name': m.user.get_full_name() or m.user.username,
            'role': m.user.profile.role if hasattr(m.user, 'profile') else 'unknown',
            'joined_at': m.joined_at,
        } for m in memberships]

    def get_project_count(self, obj):
        return obj.projects.count()

    def get_projects(self, obj):
        return [{
            'id': p.id,
            'name': p.name,
            'status': p.status,
            'description': p.description,
            'members': [{
                'id': m.id,
                'full_name': m.get_full_name() or m.username,
                'role': m.profile.role if hasattr(m, 'profile') else 'team_member'
            } for m in p.members.all()]
        } for p in obj.projects.all()]


class MeetingSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    team_name = serializers.SlugRelatedField(source='team', slug_field='name', read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'description', 'meeting_link', 
            'scheduled_at', 'team', 'team_name', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']
