from django.urls import path
from .views import (
    TeamListCreateView, TeamDetailView,
    AssignTeamHeadView, TeamMemberAddView, TeamMemberRemoveView,
    MeetingListCreateView, MeetingDetailView,
)

urlpatterns = [
    path('', TeamListCreateView.as_view(), name='team_list_create'),
    path('<int:pk>/', TeamDetailView.as_view(), name='team_detail'),
    path('<int:pk>/assign-head/', AssignTeamHeadView.as_view(), name='assign_head'),
    path('<int:pk>/members/add/', TeamMemberAddView.as_view(), name='member_add'),
    path('<int:pk>/members/<int:user_id>/remove/', TeamMemberRemoveView.as_view(), name='member_remove'),
    path('meetings/', MeetingListCreateView.as_view(), name='meeting_list_create'),
    path('meetings/<int:pk>/', MeetingDetailView.as_view(), name='meeting_detail'),
]
