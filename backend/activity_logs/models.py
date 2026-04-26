from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_submitted', 'Task Submitted'),
        ('feedback_given', 'Feedback Given'),
        ('role_converted', 'Role Converted'),
        ('application_submitted', 'Application Submitted'),
        ('application_accepted', 'Application Accepted'),
        ('application_rejected', 'Application Rejected'),
        ('intern_ready', 'Intern Marked Ready'),
        ('team_created', 'Team Created'),
        ('project_created', 'Project Created'),
        ('mentor_assigned', 'Mentor Assigned'),
    ]

    user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='activity_logs'
    )
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    team = models.ForeignKey(
        'teams.Team', null=True, blank=True, on_delete=models.SET_NULL, related_name='activity_logs'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'[{self.action_type}] {self.description[:60]}'

    class Meta:
        ordering = ['-timestamp']
