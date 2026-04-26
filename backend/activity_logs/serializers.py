from rest_framework import serializers
from .models import ActivityLog
from users.serializers import UserSerializer


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'action_type', 'description', 'team', 'timestamp']
