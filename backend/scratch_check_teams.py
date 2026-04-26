import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.append(os.getcwd())
django.setup()

from teams.models import Team, TeamMembership

print("--- Teams & Heads ---")
for t in Team.objects.all():
    head = t.head.username if t.head else "None"
    print(f"Team: {t.name} (ID: {t.id}) | Head: {head}")

print("\n--- Memberships ---")
for m in TeamMembership.objects.all():
    print(f"User: {m.user.username} | Team: {m.team.name}")
