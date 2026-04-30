from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Team, TeamMembership, Meeting
from .serializers import TeamSerializer, TeamMembershipSerializer, MeetingSerializer
from users.permissions import IsAdminRole, IsAdminOrTeamHead, IsOwnerOrAdmin
from activity_logs.utils import log_activity
from django.contrib.auth.models import User


class TeamListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role if hasattr(user, 'profile') else None
        qs = Team.objects.select_related('head').prefetch_related('memberships')
        if role == 'team_head':
            head_team_ids = Team.objects.filter(head=user).values_list('id', flat=True)
            member_team_ids = TeamMembership.objects.filter(user=user).values_list('team_id', flat=True)
            all_team_ids = set(list(head_team_ids) + list(member_team_ids))
            qs = qs.filter(id__in=all_team_ids)
        elif role == 'team_member':
            member_team_ids = TeamMembership.objects.filter(user=user).values_list('team_id', flat=True)
            qs = qs.filter(id__in=member_team_ids)
        return qs

    def perform_create(self, serializer):
        team = serializer.save()
        log_activity(
            user=self.request.user,
            action_type='team_created',
            description=f'Team "{team.name}" created.',
            team=team,
        )


class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamSerializer
    queryset = Team.objects.select_related('head').prefetch_related('memberships')

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]


class AssignTeamHeadView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        team = get_object_or_404(Team, pk=pk)
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        # Update role to team_head
        profile = user.profile
        profile.role = 'team_head'
        profile.save()

        team.head = user
        team.save()

        # Add to team membership if not already
        TeamMembership.objects.get_or_create(user=user, team=team)

        return Response({'message': f'{user.get_full_name()} assigned as Team Head.'})


class TeamMemberAddView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        team = get_object_or_404(Team, pk=pk)
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        membership, created = TeamMembership.objects.get_or_create(user=user, team=team)
        if not created:
            return Response({'message': 'User already in this team.'})
        return Response({'message': f'{user.get_full_name()} added to team {team.name}.'})


class TeamMemberRemoveView(APIView):
    permission_classes = [IsAdminRole]

    def delete(self, request, pk, user_id):
        team = get_object_or_404(Team, pk=pk)
        
        # If the member being removed is the current head, unassign them
        if team.head and team.head.id == int(user_id):
            team.head = None
            team.save()
            
        TeamMembership.objects.filter(user_id=user_id, team=team).delete()
        return Response({'message': 'Member removed from team.'})


class MeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = MeetingSerializer

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role if hasattr(user, 'profile') else None
        
        if role in ('admin', 'super_admin'):
            return Meeting.objects.select_related('team', 'created_by').all()
        
        # Filter meetings belonging to the user's teams
        user_team_ids = TeamMembership.objects.filter(user=user).values_list('team_id', flat=True)
        return Meeting.objects.filter(team_id__in=user_team_ids).select_related('team', 'created_by')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [IsOwnerOrAdmin]
