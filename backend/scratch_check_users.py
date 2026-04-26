import os
import django
import sys

# Setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.append(os.getcwd())
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

print("--- User List ---")
for user in User.objects.all():
    profile = getattr(user, 'profile', None)
    role = profile.role if profile else "No Profile"
    print(f"ID: {user.id} | User: {user.username} | Email: {user.email} | Role: {role} | Active: {user.is_active}")
print("--- End ---")
