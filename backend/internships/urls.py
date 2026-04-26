from django.urls import path
from .views import (
    ApplicationCreateView, ApplicationListView,
    ApplicationAcceptView, ApplicationRejectView,
    InternListView, InternDetailView,
    AssignMentorView, MarkReadyView, ConvertInternView, UpdateInternRoundView,
    OpenPositionListView, OpenPositionDetailView,
)

urlpatterns = [
    # Open Positions (public)
    path('positions/', OpenPositionListView.as_view(), name='position_list'),
    path('positions/<int:pk>/', OpenPositionDetailView.as_view(), name='position_detail'),
    # Applications
    path('apply/', ApplicationCreateView.as_view(), name='apply'),
    path('applications/', ApplicationListView.as_view(), name='application_list'),
    path('applications/<int:pk>/accept/', ApplicationAcceptView.as_view(), name='application_accept'),
    path('applications/<int:pk>/reject/', ApplicationRejectView.as_view(), name='application_reject'),
    # Interns
    path('interns/', InternListView.as_view(), name='intern_list'),
    path('interns/<int:pk>/', InternDetailView.as_view(), name='intern_detail'),
    path('interns/<int:pk>/assign-mentor/', AssignMentorView.as_view(), name='assign_mentor'),
    path('interns/<int:pk>/mark-ready/', MarkReadyView.as_view(), name='mark_ready'),
    path('interns/<int:pk>/convert/', ConvertInternView.as_view(), name='convert_intern'),
    path('interns/<int:pk>/round/', UpdateInternRoundView.as_view(), name='update_round'),
]
