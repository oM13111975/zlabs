from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, TaskSubmission, TaskFeedback, WorkLog
from internships.models import InternProfile
from users.serializers import UserSerializer


class TaskFeedbackSerializer(serializers.ModelSerializer):
    given_by = UserSerializer(read_only=True)

    class Meta:
        model = TaskFeedback
        fields = ['id', 'feedback_text', 'given_by', 'given_at', 'rating']
        read_only_fields = ['given_by', 'given_at']


class TaskSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSubmission
        fields = ['id', 'text_response', 'file_upload', 'submitted_at', 'submitter_email']
        read_only_fields = ['submitted_at']


class WorkLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = WorkLog
        fields = ['id', 'log_text', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_by = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assigned_to', write_only=True, required=False
    )
    assigned_intern_id = serializers.PrimaryKeyRelatedField(
        queryset=InternProfile.objects.all(), source='assigned_intern', write_only=True, required=False
    )
    submission = TaskSubmissionSerializer(read_only=True)
    feedback = TaskFeedbackSerializer(read_only=True)
    work_logs = WorkLogSerializer(many=True, read_only=True)
    submission_url = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    assignee_name = serializers.SerializerMethodField()
    assignee_email = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'deadline', 'attachment',
            'assigned_to', 'assigned_to_id', 'assigned_intern', 'assigned_intern_id', 'assigned_by',
            'team', 'team_name', 'project', 'project_name',
            'status', 'task_type', 'submission_token', 'round_number',
            'submission_url', 'submission', 'feedback', 'work_logs',
            'assignee_name', 'assignee_email',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['assigned_by', 'submission_token', 'created_at', 'updated_at']

    def get_submission_url(self, obj):
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/submit/{obj.submission_token}"

    def get_team_name(self, obj):
        return obj.team.name if obj.team else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_assignee_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        if obj.assigned_intern:
            return obj.assigned_intern.full_name
        return "Unassigned"

    def get_assignee_email(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.email
        if obj.assigned_intern:
            return obj.assigned_intern.application.email
        return None
