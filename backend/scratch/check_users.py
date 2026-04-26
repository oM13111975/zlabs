import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

def check_users():
    users = User.objects.all()
    print("Listing all users in database:")
    for u in users:
        role = "No Profile"
        if hasattr(u, 'profile'):
            role = u.profile.role
        print(f"- Username: {u.username}, Email: {u.email}, Role: {role}, Active: {u.is_active}")

if __name__ == '__main__':
    check_users()
