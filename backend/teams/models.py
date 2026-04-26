from django.db import models
from django.contrib.auth.models import User


class Team(models.Model):
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=100, help_text='e.g. Development, Design, Marketing')
    description = models.TextField(blank=True)
    head = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='headed_teams'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class TeamMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'team')
        ordering = ['-joined_at']

    def __str__(self):
        return f'{self.user.username} in {self.team.name}'


class Meeting(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    meeting_link = models.URLField(blank=True)
    scheduled_at = models.DateTimeField()
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='meetings')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_meetings')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title} ({self.team.name})'

    class Meta:
        ordering = ['-scheduled_at']
