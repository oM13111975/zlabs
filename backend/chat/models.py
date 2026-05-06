from django.db import models
from django.contrib.auth import get_user_model
from teams.models import Team
from projects.models import Project

User = get_user_model()

class ChatGroup(models.Model):
    name = models.CharField(max_length=255, blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_groups')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='chat_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.team:
            return f"Team Chat: {self.team.name}"
        if self.project:
            return f"Project Chat: {self.project.name}"
        return self.name or f"Group {self.id}"

class ChatMessage(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_edited = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.sender.username} in {self.group}: {self.content[:20]}"

class UserChatState(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_states')
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name='user_states')
    last_read_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'group')

    def __str__(self):
        return f"{self.user.username} read {self.group} at {self.last_read_timestamp}"
