import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.append(os.getcwd())
django.setup()

from teams.models import Meeting

print("--- Meetings List ---")
for m in Meeting.objects.all():
    team_name = m.team.name if m.team else "None"
    creator = m.created_by.username
    print(f"Title: {m.title} | Team: {team_name} | Created By: {creator}")
