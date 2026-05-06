from django.db.models.signals import post_save
from django.dispatch import receiver
from teams.models import Team
from projects.models import Project
from .models import ChatGroup

@receiver(post_save, sender=Team)
def create_team_chat_group(sender, instance, created, **kwargs):
    if created:
        ChatGroup.objects.get_or_create(team=instance)

@receiver(post_save, sender=Project)
def create_project_chat_group(sender, instance, created, **kwargs):
    if created:
        ChatGroup.objects.get_or_create(project=instance)
