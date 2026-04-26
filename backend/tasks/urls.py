from django.urls import path
from .views import (
    TaskListCreateView, TaskDetailView, TaskStatusUpdateView,
    PublicTaskSubmitView, TaskFeedbackView, TaskReminderView, WorkLogCreateView,
    InternalTaskSubmitView
)

urlpatterns = [
    path('', TaskListCreateView.as_view(), name='task_list_create'),
    path('<int:pk>/', TaskDetailView.as_view(), name='task_detail'),
    path('<int:pk>/status/', TaskStatusUpdateView.as_view(), name='task_status'),
    path('<int:pk>/feedback/', TaskFeedbackView.as_view(), name='task_feedback'),
    path('<int:pk>/reminder/', TaskReminderView.as_view(), name='task_reminder'),
    path('<int:pk>/logs/', WorkLogCreateView.as_view(), name='work_log_create'),
    path('<int:pk>/submit/', InternalTaskSubmitView.as_view(), name='internal_submit'),
    path('submit/<uuid:token>/', PublicTaskSubmitView.as_view(), name='public_submit'),
]
