import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

def setup_users():
    super_admins = ['nitesh', 'gaurav']
    admins = ['aryangiri']

    for username in super_admins:
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password('admin@123')
            user.email = f'{username}@example.com'
            user.save()
            print(f"Created Super Admin: {username}")
        
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = 'super_admin'
        profile.save()
        print(f"Set {username} as Super Admin")

    for username in admins:
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password('admin@123')
            user.email = f'{username}@example.com'
            user.save()
            print(f"Created Admin: {username}")
        
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = 'admin'
        profile.save()
        print(f"Set {username} as Admin")

if __name__ == '__main__':
    setup_users()
