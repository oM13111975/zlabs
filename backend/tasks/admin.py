from django.contrib import admin
from .models import Task, TaskSubmission, TaskFeedback, WorkLog

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'assigned_to', 'assigned_by', 'status', 'deadline', 'created_at']
    list_filter = ['status', 'task_type']
    search_fields = ['title']

admin.site.register(TaskSubmission)
admin.site.register(TaskFeedback)
admin.site.register(WorkLog)
