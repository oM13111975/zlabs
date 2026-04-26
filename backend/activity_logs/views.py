from rest_framework import generics, permissions
from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role if hasattr(user, 'profile') else None
        qs = ActivityLog.objects.select_related('user', 'team').all()

        if role == 'mentor':
            qs = qs.filter(user=user) | ActivityLog.objects.filter(
                action_type__in=['task_created', 'task_submitted', 'feedback_given'],
                user__profile__role='intern'
            )
        elif role in ('team_head', 'team_member'):
            from teams.models import TeamMembership
            team_ids = TeamMembership.objects.filter(user=user).values_list('team_id', flat=True)
            qs = qs.filter(team_id__in=team_ids)
        elif role not in ('admin', 'super_admin'):
            qs = qs.filter(user=user)

        team_filter = self.request.query_params.get('team')
        if team_filter:
            qs = qs.filter(team_id=team_filter)

        user_filter = self.request.query_params.get('user')
        if user_filter:
            qs = qs.filter(user_id=user_filter)

        return qs.order_by('-timestamp')[:100]
