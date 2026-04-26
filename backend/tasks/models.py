from django.db import models
from django.contrib.auth.models import User
import uuid


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    TASK_TYPE_CHOICES = [
        ('intern', 'Intern Task'),
        ('team', 'Team Task'),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField()
    deadline = models.DateTimeField()
    attachment = models.FileField(upload_to='task_attachments/', blank=True, null=True)
    assigned_to = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='assigned_tasks',
        null=True, blank=True
    )
    assigned_intern = models.ForeignKey(
        'internships.InternProfile', on_delete=models.CASCADE, 
        related_name='tasks', null=True, blank=True
    )
    assigned_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_tasks'
    )
    team = models.ForeignKey(
        'teams.Team', null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks'
    )
    project = models.ForeignKey(
        'projects.Project', null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='intern')
    round_number = models.IntegerField(default=1, null=True, blank=True)
    submission_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class TaskSubmission(models.Model):
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='submission')
    text_response = models.TextField(blank=True)
    file_upload = models.FileField(upload_to='submissions/', blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    submitter_email = models.EmailField(blank=True)

    def __str__(self):
        return f'Submission for: {self.task.title}'


class TaskFeedback(models.Model):
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='feedback')
    feedback_text = models.TextField()
    given_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_feedbacks')
    given_at = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], null=True, blank=True)

    def __str__(self):
        return f'Feedback for: {self.task.title}'


class WorkLog(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='work_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='work_logs')
    log_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Log by {self.user.username} on {self.task.title}'

    class Meta:
        ordering = ['-created_at']
