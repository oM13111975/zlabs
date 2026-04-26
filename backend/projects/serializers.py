from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project
from teams.models import TeamMembership
from tasks.models import Task


from users.serializers import UserSerializer


class ProjectMemberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'role', 'email']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Exception:
            return 'team_member'


class ProjectTaskSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    status = serializers.CharField()
    deadline = serializers.DateTimeField()
    assigned_to_name = serializers.SerializerMethodField()
    submission_token = serializers.UUIDField()

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        if obj.assigned_intern:
            return obj.assigned_intern.full_name
        return "Unassigned"


class ProjectSerializer(serializers.ModelSerializer):
    team_name = serializers.SerializerMethodField()
    members = ProjectMemberSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), source='members', write_only=True, required=False
    )
    task_list = serializers.SerializerMethodField()
    task_counts = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'team', 'team_name',
            'status', 'created_by', 'created_at', 'updated_at',
            'members', 'member_ids', 'task_list', 'task_counts',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_team_name(self, obj):
        return obj.team.name if obj.team else None

    # Removed get_members SerializerMethodField as it's now a direct field

    def get_task_list(self, obj):
        tasks = Task.objects.filter(project=obj).select_related('assigned_to')
        return ProjectTaskSerializer(tasks, many=True).data

    def get_task_counts(self, obj):
        tasks = Task.objects.filter(project=obj)
        return {
            'total': tasks.count(),
            'pending': tasks.filter(status='pending').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'completed': tasks.filter(status__in=['reviewed', 'completed']).count(),
        }
