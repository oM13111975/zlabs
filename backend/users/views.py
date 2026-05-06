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
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from rest_framework.parsers import MultiPartParser, FormParser
from .utils import extract_metadata_from_resume
from internships.models import InternProfile

def get_role(user):
    if hasattr(user, 'profile'):
        return user.profile.role
    return 'intern'

def generate_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for i in range(length))

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        
        is_direct = self.request.query_params.get('is_direct_enroll')
        if is_direct == 'true':
            qs = qs.filter(profile__is_direct_enroll=True)
            
        return qs.order_by('-profile__created_at')


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

        # Monthly trend (Last 6 Months)
        from django.utils import timezone
        from datetime import timedelta
        monthly_tasks = []
        curr = timezone.now()
        for i in range(5, -1, -1):
            # Calculate start and end of month
            first_day = (curr.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
            # This is a bit rough but works for trend visualization
            month_label = first_day.strftime('%b')
            count = Task.objects.filter(created_at__year=first_day.year, created_at__month=first_day.month).count()
            monthly_tasks.append({'month': month_label, 'count': count})

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
            'monthly_tasks': monthly_tasks
        }

        return Response(data)


class EnrollView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        role = request.data.get('role', 'intern')
        phone = request.data.get('phone', '')
        resume = request.FILES.get('resume')
        domain = request.data.get('domain', '')
        bio = request.data.get('bio', '')
        skills = request.data.get('skills', '')

        if not email or not first_name:
            return Response({"error": "Email and first name are required"}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "User with this email already exists"}, status=400)

        # Generate username from email/name
        username = email.split('@')[0].replace('.', '')
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        password = generate_password()
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone,
            resume=resume,
            bio=bio,
            skills=skills,
            is_direct_enroll=True
        )

        # If it's an intern, also create an InternProfile so they appear in Interns Directory
        if role == 'intern':
            InternProfile.objects.create(
                user=user,
                domain=domain or 'General'
            )

        # Send Email
        subject = 'Welcome to ZLabs - Your Account Credentials'
        message = f"Hi {first_name},\n\nWelcome to ZLabs! Your account has been created by the administrator.\n\nHere are your login credentials:\nUsername: {username}\nPassword: {password}\n\nYou can login at: {settings.FRONTEND_URL}/login\n\nPlease change your password after your first login.\n\nBest regards,\nZLabs Team"
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as e:
            email_sent = False

        return Response({
            "status": "success",
            "user": UserSerializer(user).data,
            "username": username,
            "password": password,
            "email_sent": email_sent
        })

class EnrollScanView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('resume')
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)
        
        # Simple extraction for PDF only
        if file_obj.name.lower().endswith('.pdf'):
            data = extract_metadata_from_resume(file_obj)
            # Add raw text for debugging if needed (frontend can log it)
            # data['raw_text'] = extract_text(file_obj)[:500] 
            return Response(data)
            
        return Response({"email": "", "phone": ""})
