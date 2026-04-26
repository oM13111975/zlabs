from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
    ]

    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    team = models.ForeignKey(
        'teams.Team', null=True, blank=True, on_delete=models.SET_NULL, related_name='projects'
    )
    members = models.ManyToManyField(
        User, blank=True, related_name='assigned_projects'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    created_by = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name='created_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']
