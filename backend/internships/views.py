from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.utils import timezone
import secrets
import string

from .models import Application, InternProfile, OpenPosition
from .serializers import ApplicationSerializer, InternProfileSerializer, OpenPositionSerializer
from users.models import UserProfile
from users.permissions import IsAdminRole, IsAdminOrMentor
from users.emails import send_intern_welcome_email, send_conversion_email
from activity_logs.utils import log_activity


# ── Open Positions ──────────────────────────────────────────────────────────────
class OpenPositionListView(generics.ListCreateAPIView):
    """Public GET, Admin POST"""
    serializer_class = OpenPositionSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = OpenPosition.objects.all()
        open_only = self.request.query_params.get('open')
        if open_only == 'true':
            qs = qs.filter(is_open=True)
        return qs


class OpenPositionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OpenPositionSerializer
    queryset = OpenPosition.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminRole()]



def generate_password(length=10):
    chars = string.ascii_letters + string.digits + '!@#$'
    return ''.join(secrets.choice(chars) for _ in range(length))


class ApplicationCreateView(generics.CreateAPIView):
    """Public endpoint — no authentication required."""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        app = serializer.save()
        log_activity(
            user=None,
            action_type='application_submitted',
            description=f'New application from {app.name} ({app.email})',
        )


class ApplicationListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        qs = Application.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        role_filter = self.request.query_params.get('role')
        if role_filter:
            qs = qs.filter(role_applied_for=role_filter)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(email__icontains=search)
        return qs


class ApplicationAcceptView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            application = Application.objects.get(pk=pk, status='pending')
        except Application.DoesNotExist:
            return Response({'error': 'Application not found or already processed.'}, status=404)

        # 1. Update application
        application.status = 'accepted'
        application.reviewed_at = timezone.now()
        application.reviewed_by = request.user
        application.save()

        # 2. Get mentor if any
        mentor_id = request.data.get('mentor_id')
        mentor = None
        if mentor_id and str(mentor_id).isdigit():
            try:
                mentor = User.objects.get(pk=mentor_id, profile__role__in=['mentor', 'team_member', 'team_head'])
            except User.DoesNotExist:
                pass

        # 3. Create intern profile (WITHOUT user)
        intern_profile = InternProfile.objects.create(
            application=application,
            mentor=mentor
        )

        # 4. Send welcome email (no credentials yet)
        try:
            send_intern_welcome_email(
                name=application.name,
                email=application.email,
            )
        except Exception:
            pass 

        log_activity(
            user=request.user,
            action_type='application_accepted',
            description=f'Application from {application.name} accepted. Logins will be created at conversion.',
        )

        return Response({
            'message': 'Application accepted. Intern profile created.',
            'intern_id': intern_profile.id,
        }, status=201)


class ApplicationRejectView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            application = Application.objects.get(pk=pk, status='pending')
        except Application.DoesNotExist:
            return Response({'error': 'Application not found or already processed.'}, status=404)

        application.status = 'rejected'
        application.reviewed_at = timezone.now()
        application.reviewed_by = request.user
        application.rejection_reason = request.data.get('reason', '')
        application.save()

        log_activity(
            user=request.user,
            action_type='application_rejected',
            description=f'Application from {application.name} rejected.',
        )

        return Response({'message': 'Application rejected.'})


class InternListView(generics.ListAPIView):
    permission_classes = [IsAdminOrMentor]  # IsAdminOrMentor now includes team_member
    serializer_class = InternProfileSerializer

    def get_queryset(self):
        user = self.request.user
        qs = InternProfile.objects.select_related('user', 'mentor', 'application').all()
        role = user.profile.role if hasattr(user, 'profile') else None
        # team_member, mentor and team_head all have mentor duties
        if role in ('mentor', 'team_member', 'team_head'):
            qs = qs.filter(mentor=user)
        ready = self.request.query_params.get('ready')
        if ready == 'true':
            qs = qs.filter(is_ready_for_team=True, converted_at__isnull=True)
        converted = self.request.query_params.get('converted')
        if converted == 'true':
            qs = qs.filter(converted_at__isnull=False)
        return qs


class InternDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminOrMentor]
    serializer_class = InternProfileSerializer
    queryset = InternProfile.objects.select_related('user', 'mentor', 'application').all()


class AssignMentorView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            intern = InternProfile.objects.get(pk=pk)
        except InternProfile.DoesNotExist:
            return Response({'error': 'Intern not found.'}, status=404)

        mentor_id = request.data.get('mentor_id')
        try:
            mentor = User.objects.get(pk=mentor_id, profile__role__in=['mentor', 'team_member', 'team_head'])
        except User.DoesNotExist:
            return Response({'error': 'Selected user cannot be a mentor.'}, status=400)

        intern.mentor = mentor
        intern.save()

        log_activity(
            user=request.user,
            action_type='mentor_assigned',
            description=f'Mentor {mentor.get_full_name()} assigned to intern {intern.full_name}',
        )

        return Response({'message': f'Mentor assigned successfully.'})


class MarkReadyView(APIView):
    permission_classes = [IsAdminOrMentor]

    def post(self, request, pk):
        try:
            intern = InternProfile.objects.get(pk=pk)
        except InternProfile.DoesNotExist:
            return Response({'error': 'Intern not found.'}, status=404)

        user = request.user
        role = user.profile.role if hasattr(user, 'profile') else None
        # Both mentor and team_member can mark their own assigned interns
        if role in ('mentor', 'team_member') and intern.mentor != user:
            return Response({'error': 'You can only mark your own interns.'}, status=403)

        intern.is_ready_for_team = True
        intern.ready_marked_at = timezone.now()
        intern.save()

        log_activity(
            user=request.user,
            action_type='intern_ready',
            description=f'Intern {intern.full_name} marked as ready for team conversion.',
        )

        return Response({'message': 'Intern marked as ready for team.'})


class ConvertInternView(APIView):
    permission_classes = [IsAdminOrMentor]

    def post(self, request, pk):
        try:
            intern = InternProfile.objects.get(pk=pk)
        except InternProfile.DoesNotExist:
            return Response({'error': 'Intern not found.'}, status=404)

        if not intern.is_ready_for_team:
            return Response({'error': 'Intern is not yet marked as ready for team.'}, status=400)

        target_role = request.data.get('role', 'team_member')
        if target_role not in ('team_member', 'team_head'):
             return Response({'error': 'Invalid target role.'}, status=400)

        team_id = request.data.get('team_id')
        project_id = request.data.get('project_id')

        # 1. Create User if not exists
        user = intern.user
        password = 'member@123' # Default member password
        if not user:
            # Check if email taken
            if User.objects.filter(email=intern.application.email).exists():
                 return Response({'error': 'A user with this email already exists.'}, status=400)
            
            username = intern.application.email.split('@')[0].lower().replace('.', '_')
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base_username}{counter}'
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=intern.application.email.lower(),
                first_name=intern.application.name.split()[0] if intern.application.name else '',
                last_name=' '.join(intern.application.name.split()[1:]) if len(intern.application.name.split()) > 1 else '',
            )
            user.set_password(password)
            user.is_active = True
            user.save()
            UserProfile.objects.create(user=user, role=target_role, phone=intern.application.phone)
            intern.user = user
        else:
            # Update existing user role and reset password to the conversion password
            user.set_password(password)
            user.save()
            profile = user.profile
            profile.role = target_role
            profile.save()

        # 2. Assign to team
        if team_id and str(team_id).isdigit():
            from teams.models import Team, TeamMembership
            try:
                team = Team.objects.get(pk=team_id)
                TeamMembership.objects.get_or_create(user=user, team=team)
            except Team.DoesNotExist:
                pass

        # 3. Assign to project
        if project_id:
            intern.domain = f'project:{project_id}'

        intern.converted_at = timezone.now()
        intern.save()

        # 4. Send credentials email
        from django.conf import settings
        try:
            send_conversion_email(
                name=intern.full_name,
                email=intern.application.email,
                role=target_role,
                username=user.username,
                password=password,
                login_url=settings.FRONTEND_URL + "/login",
                custom_subject=request.data.get('email_subject'),
                custom_body=request.data.get('email_body'),
            )
        except Exception:
            pass

        log_activity(
            user=request.user,
            action_type='role_converted',
            description=f'Intern {user.get_full_name()} converted to {target_role}.',
        )

        return Response({
            'message': f'Intern successfully converted to {target_role.replace("_", " ")}.',
            'username': user.username,
            'password': password
        })


class UpdateInternRoundView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            intern = InternProfile.objects.get(pk=pk)
        except InternProfile.DoesNotExist:
            return Response({'error': 'Intern not found.'}, status=404)

        new_round = request.data.get('current_round')
        if not new_round or not str(new_round).isdigit():
            return Response({'error': 'Invalid round number.'}, status=400)
        
        new_round = int(new_round)
        if new_round < 1 or new_round > 5:
            return Response({'error': 'Round must be between 1 and 5.'}, status=400)

        old_round = intern.current_round
        intern.current_round = new_round
        intern.save()

        log_activity(
            user=request.user,
            action_type='round_manually_updated',
            description=f'Intern {intern.full_name} round manually updated from {old_round} to {new_round}.',
            content_object=intern
        )

        return Response({'message': f'Round successfully updated to {new_round}.', 'current_round': new_round})
