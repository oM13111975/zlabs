from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer
from .permissions import IsAdminRole, IsAdminOrTeamHead


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow login by email or username
        identifier = attrs.get('username')
        if identifier and '@' in identifier:
            # Try to find user by email (case-insensitive)
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                attrs['username'] = user.username
                
        try:
            data = super().validate(attrs)
        except Exception as e:
            # Fallback for better error messaging if needed
            raise e
            
        user = self.user
        data['user'] = UserSerializer(user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=400)


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('id')
    permission_classes = [IsAdminOrTeamHead]
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = User.objects.select_related('profile').all()
        role = self.request.query_params.get('role')
        if role:
            if ',' in role:
                qs = qs.filter(profile__role__in=role.split(','))
            else:
                qs = qs.filter(profile__role=role)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(username__icontains=search) | qs.filter(email__icontains=search)
        return qs


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = UserSerializer
    queryset = User.objects.select_related('profile').all()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        
        # Logic: Only super_admin can modify/delete other super_admins or admins
        if request.method in ('PUT', 'PATCH', 'DELETE'):
            target_role = get_role(obj)
            current_user_role = get_role(request.user)
            
            if target_role in ('admin', 'super_admin') and current_user_role != 'super_admin':
                 self.permission_denied(request, message="Only a Super Admin can manage administrative accounts.")
            
            # Also prevent normal admin from promoting someone to admin/super_admin
            new_role = request.data.get('role')
            if new_role in ('admin', 'super_admin') and current_user_role != 'super_admin':
                 self.permission_denied(request, message="Only a Super Admin can assign administrative roles.")


class MentorListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(profile__role__in=['mentor', 'team_member', 'team_head']).select_related('profile')


class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from tasks.models import Task
        from internships.models import InternProfile, Application
        from teams.models import Team
        from projects.models import Project
        from django.db.models import Count

        data = {
            'total_users': User.objects.count(),
            'total_interns': InternProfile.objects.count(),
            'active_tasks': Task.objects.exclude(status__in=['completed', 'reviewed']).count(),
            'total_teams': Team.objects.count(),
            'total_projects': Project.objects.count(),
            'pending_applications': Application.objects.filter(status='pending').count(),
            'accepted_applications': Application.objects.filter(status='accepted').count(),
            'rejected_applications': Application.objects.filter(status='rejected').count(),
            'ready_for_team': InternProfile.objects.filter(is_ready_for_team=True, converted_at__isnull=True).count(),
            'converted_interns': InternProfile.objects.filter(converted_at__isnull=False).count(),
            'users_by_role': {x['profile__role']: x['count'] for x in User.objects.values('profile__role').annotate(count=Count('id'))},
        }

        # Monthly task data for chart (last 6 months)
        from django.utils import timezone
        from django.db.models.functions import TruncMonth
        import datetime

        six_months_ago = timezone.now() - datetime.timedelta(days=180)
        monthly = (
            Task.objects.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        data['monthly_tasks'] = [
            {'month': m['month'].strftime('%b %Y'), 'count': m['count']}
            for m in monthly
        ]

        return Response(data)
