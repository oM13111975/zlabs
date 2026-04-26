import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

def reset_passwords():
    targets = ['nitesh', 'gaurav', 'aryangiri']

    for username in targets:
        try:
            user = User.objects.get(username=username)
            user.set_password('admin@123')
            user.is_active = True
            user.save()
            print(f"Password reset to admin@123 for {username}")
            
            # Ensure profile exists and has correct role
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if username in ['nitesh', 'gaurav']:
                profile.role = 'super_admin'
            else:
                profile.role = 'admin'
            profile.save()
        except User.DoesNotExist:
            print(f"User {username} not found")

if __name__ == '__main__':
    reset_passwords()
