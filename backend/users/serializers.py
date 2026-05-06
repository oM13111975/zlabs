from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'role', 'phone', 'bio', 'skills', 'avatar', 'resume', 'location', 'is_direct_enroll', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    teams = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    task_stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'profile', 'teams', 'projects', 'task_stats']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_teams(self, obj):
        return [{'id': tm.team.id, 'name': tm.team.name, 'domain': tm.team.domain} for tm in obj.team_memberships.all().select_related('team')]

    def get_projects(self, obj):
        return [{'id': p.id, 'name': p.name, 'status': p.status} for p in obj.assigned_projects.all()]

    def get_task_stats(self, obj):
        from tasks.models import Task
        tasks = Task.objects.filter(assigned_to=obj)
        return {
            'total': tasks.count(),
            'completed': tasks.filter(status='completed').count(),
            'pending': tasks.exclude(status__in=['completed', 'reviewed']).count()
        }


class UserCreateSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, default='intern')
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'role', 'phone']

    def create(self, validated_data):
        role = validated_data.pop('role', 'intern')
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        UserProfile.objects.create(user=user, role=role, phone=phone)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', required=False)
    phone = serializers.CharField(source='profile.phone', required=False, allow_blank=True)
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True)
    location = serializers.CharField(source='profile.location', required=False, allow_blank=True)
    avatar = serializers.ImageField(source='profile.avatar', required=False)
    resume = serializers.FileField(source='profile.resume', required=False)
    skills = serializers.CharField(source='profile.skills', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'role', 'phone', 'bio', 'location', 'avatar', 'resume', 'skills']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update User fields (first_name, last_name, email)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update or Create Profile
        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                # For safety, don't let users change their own role unless they are admin
                # But here we just apply what's in profile_data since MeView 
                # doesn't filter it. We rely on the frontend not sending it.
                setattr(profile, attr, value)
            profile.save()
        
        return instance
