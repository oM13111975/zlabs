from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Application, InternProfile, OpenPosition
from users.serializers import UserSerializer


class OpenPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenPosition
        fields = ['id', 'role', 'title', 'description', 'requirements', 'duration', 'is_open', 'created_at']


class ApplicationSerializer(serializers.ModelSerializer):
    role_applied_for_display = serializers.CharField(source='get_role_applied_for_display', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'name', 'email', 'phone', 'role_applied_for', 'role_applied_for_display',
            'skills', 'cover_letter', 'resume',
            'status', 'applied_at', 'reviewed_at', 'rejection_reason'
        ]
        read_only_fields = ['status', 'applied_at', 'reviewed_at']

    def validate_resume(self, value):
        max_size = 5 * 1024 * 1024  # 5 MB
        if value.size > max_size:
            raise serializers.ValidationError('Resume file must be under 5MB.')
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('Resume must be a PDF file.')
        return value


class InternProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    mentor = UserSerializer(read_only=True)
    mentor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='mentor', write_only=True, required=False
    )
    application = ApplicationSerializer(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()

    class Meta:
        model = InternProfile
        fields = [
            'id', 'user', 'application', 'mentor', 'mentor_id',
            'is_ready_for_team', 'ready_marked_at', 'converted_at',
            'domain', 'joined_at', 'current_round', 'tasks_count', 'completed_tasks'
        ]

    def get_tasks_count(self, obj):
        from tasks.models import Task
        from django.db.models import Q
        q = Q(assigned_intern=obj)
        if obj.user:
            q |= Q(assigned_to=obj.user)
        return Task.objects.filter(q).count()

    def get_completed_tasks(self, obj):
        from tasks.models import Task
        from django.db.models import Q
        q = Q(assigned_intern=obj)
        if obj.user:
            q |= Q(assigned_to=obj.user)
        return Task.objects.filter(q, status__in=['reviewed', 'completed']).count()
