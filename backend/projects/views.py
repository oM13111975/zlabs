from rest_framework import generics, permissions
from .models import Project
from .serializers import ProjectSerializer
from users.permissions import IsAdminRole, CanManageProject
from activity_logs.utils import log_activity


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [CanManageProject()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role if hasattr(user, 'profile') else None
        qs = Project.objects.select_related('team')
        if role == 'team_head':
            from teams.models import Team, TeamMembership
            head_team_ids = Team.objects.filter(head=user).values_list('id', flat=True)
            member_team_ids = TeamMembership.objects.filter(user=user).values_list('team_id', flat=True)
            all_team_ids = set(list(head_team_ids) + list(member_team_ids))
            qs = qs.filter(team_id__in=all_team_ids)
        elif role == 'team_member':
            from teams.models import TeamMembership
            team_ids = TeamMembership.objects.filter(user=user).values_list('team_id', flat=True)
            qs = qs.filter(team_id__in=team_ids)
        team_filter = self.request.query_params.get('team')
        if team_filter:
            qs = qs.filter(team_id=team_filter)
        return qs

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        log_activity(
            user=self.request.user,
            action_type='project_created',
            description=f'Project "{project.name}" created.',
            team=project.team,
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    queryset = Project.objects.select_related('team')

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [CanManageProject()]
        return [permissions.IsAuthenticated()]
