from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q

from .models import Task, TaskSubmission, TaskFeedback, WorkLog
from .serializers import TaskSerializer, TaskSubmissionSerializer, TaskFeedbackSerializer, WorkLogSerializer
from users.permissions import IsAdminRole, IsAdminOrMentor, CanManageTasks
from activity_logs.utils import log_activity
from users.emails import send_task_assignment_email, send_feedback_email, send_reminder_email, send_task_submission_notification


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [CanManageTasks()]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role if hasattr(user, 'profile') else None
        qs = Task.objects.select_related(
            'assigned_to', 'assigned_by', 'team', 'project'
        ).prefetch_related('work_logs')

        if role in ('admin', 'super_admin'):
            pass  # sees all
        elif role in ('mentor', 'team_member'):
            # Members/Mentors see:
            # 1. Any task they created/assigned (assigned_by=user)
            # 2. Project tasks assigned specifically to them (assigned_to=user AND task_type='team')
            # They should NOT see tasks where they are the 'assigned_to' if it's an 'intern' task (remnants of their own internship)
            qs = qs.filter(
                Q(assigned_by=user) | 
                (Q(assigned_to=user) & Q(task_type='team'))
            ).distinct()
        elif role == 'team_head':
            from teams.models import TeamMembership
            team_ids = TeamMembership.objects.filter(user=user).values_list('team_id', flat=True)
            qs = qs.filter(
                Q(assigned_by=user) | Q(team_id__in=team_ids)
            ).distinct()
        else:
            # For interns, they might not have a user yet, so they only see tasks via token.
            # But if they are logged in, they see tasks where they are assigned_to OR assigned_intern__user.
            qs = qs.filter(Q(assigned_to=user) | Q(assigned_intern__user=user))

        # Filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        team_filter = self.request.query_params.get('team')
        if team_filter:
            qs = qs.filter(team_id=team_filter)
        # Specific filter for a single intern's history (User ID + Profile ID)
        target_intern = self.request.query_params.get('target_intern')
        if target_intern:
            from internships.models import InternProfile
            try:
                prof = InternProfile.objects.get(id=target_intern)
                q = Q(assigned_intern_id=target_intern)
                if prof.user_id:
                    q |= Q(assigned_to_id=prof.user_id)
                qs = qs.filter(q)
            except InternProfile.DoesNotExist:
                qs = qs.none()

        # Restored standard filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        project_filter = self.request.query_params.get('project')
        if project_filter:
            qs = qs.filter(project_id=project_filter)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)
        task_type_filter = self.request.query_params.get('task_type')
        if task_type_filter:
            qs = qs.filter(task_type=task_type_filter)

        return qs.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        role = user.profile.role if hasattr(user, 'profile') else None
        
        # Validation for Team Heads
        if role == 'team_head':
            team = serializer.validated_data.get('team')
            if team and team.head != user:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("You can only create tasks for teams you head.")
            
            project = serializer.validated_data.get('project')
            if project and project.team and project.team.head != user:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("You can only create tasks for projects in your team.")

        task = serializer.save(assigned_by=user)
        
        assigned_name = "Unassigned"
        if task.assigned_to:
            assigned_name = task.assigned_to.get_full_name() or task.assigned_to.username
        elif task.assigned_intern:
            assigned_name = task.assigned_intern.full_name

        log_activity(
            user=user,
            action_type='task_created',
            description=f'Task "{task.title}" assigned to {assigned_name}',
            content_object=task,
            team=task.team,
        )
        # Send email
        try:
            intern_name = "User"
            intern_email = None
            
            if task.assigned_to:
                intern_name = task.assigned_to.get_full_name() or task.assigned_to.username
                intern_email = task.assigned_to.email
            elif task.assigned_intern:
                intern_name = task.assigned_intern.full_name
                intern_email = task.assigned_intern.application.email
            
            if intern_email:
                email_subject = self.request.data.get('email_subject')
                email_body = self.request.data.get('email_body')
                from django.conf import settings
                send_task_assignment_email(
                    intern_name=intern_name,
                    intern_email=intern_email,
                    task_title=task.title,
                    task_description=task.description,
                    deadline=task.deadline,
                    mentor_name=self.request.user.get_full_name() or self.request.user.username,
                    login_url=f"{settings.FRONTEND_URL}/login",
                    custom_subject=email_subject,
                    custom_body=email_body,
                )
        except Exception:
            pass


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [CanManageTasks()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Task.objects.select_related(
            'assigned_to', 'assigned_by', 'team', 'project'
        ).prefetch_related('work_logs')

    def perform_update(self, serializer):
        task = serializer.save()
        log_activity(
            user=self.request.user,
            action_type='task_updated',
            description=f'Task "{task.title}" updated. Status: {task.status}',
            content_object=task,
            team=task.team,
        )


class TaskStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        new_status = request.data.get('status')
        if new_status not in dict(Task.STATUS_CHOICES):
            return Response({'error': 'Invalid status.'}, status=400)
        task.status = new_status
        task.save()
        log_activity(
            user=request.user,
            action_type='task_updated',
            description=f'Task "{task.title}" status changed to {new_status}',
            content_object=task,
            team=task.team,
        )
        return Response({'status': new_status, 'message': 'Status updated.'})


class PublicTaskSubmitView(APIView):
    """Public endpoint — verified via submission_token in URL."""
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, token):
        task = get_object_or_404(Task, submission_token=token)
        
        email_provided = request.query_params.get('email', '').strip().lower()
        target_email = ""
        if task.assigned_to:
            target_email = task.assigned_to.email
        elif task.assigned_intern and task.assigned_intern.application:
            target_email = task.assigned_intern.application.email
        target_email = target_email.lower()
        
        history = []
        if email_provided == target_email:
            # Find all tasks for this same intern to show history
            q = Q()
            intern_prof = task.assigned_intern
            user = task.assigned_to
            
            if not intern_prof and user and hasattr(user, 'intern_profile'):
                intern_prof = user.intern_profile
                
            if intern_prof:
                q |= Q(assigned_intern=intern_prof)
                if intern_prof.user:
                    q |= Q(assigned_to=intern_prof.user)
            if user:
                q |= Q(assigned_to=user)
                
            history_qs = Task.objects.filter(q).exclude(id=task.id).order_by('-created_at')
            history = TaskSerializer(history_qs, many=True).data

        assignee_name = "Unassigned"
        if task.assigned_to:
            assignee_name = task.assigned_to.get_full_name() or task.assigned_to.username
        elif task.assigned_intern:
            assignee_name = task.assigned_intern.full_name

        return Response({
            'task_id': task.id,
            'title': task.title,
            'description': task.description,
            'deadline': task.deadline,
            'assigned_to': assignee_name,
            'already_submitted': hasattr(task, 'submission'),
            'history': history,
            'is_verified': email_provided == target_email,
        })

    def post(self, request, token):
        task = get_object_or_404(Task, submission_token=token)

        if hasattr(task, 'submission'):
            return Response({'error': 'This task has already been submitted.'}, status=400)

        # Basic email verification (intern must provide their email)
        submitter_email = request.data.get('email', '')
        target_email = task.assigned_to.email if task.assigned_to else task.assigned_intern.application.email
        if submitter_email and submitter_email.lower() != target_email.lower():
            return Response({'error': 'Email does not match the assigned intern.'}, status=400)

        submission = TaskSubmission.objects.create(
            task=task,
            text_response=request.data.get('text_response', ''),
            file_upload=request.FILES.get('file_upload'),
            submitter_email=submitter_email,
        )

        task.status = 'submitted'
        task.save()

        # Notify mentor
        try:
            from django.conf import settings
            mentor = task.assigned_by
            if task.assigned_to:
                intern_name = task.assigned_to.get_full_name() or task.assigned_to.username
                intern_email = task.assigned_to.email
            elif task.assigned_intern:
                intern_name = task.assigned_intern.full_name
                intern_email = task.assigned_intern.application.email
            else:
                intern_name = "User"
                intern_email = None

            if mentor and intern_email:
                send_task_submission_notification(
                    mentor_email=mentor.email,
                    mentor_name=mentor.get_full_name() or mentor.username,
                    intern_name=intern_name,
                    task_title=task.title,
                    portal_url=f"{settings.FRONTEND_URL}/login",
                    attachment=submission.file_upload
                )
        except Exception:
            pass

        log_activity(
            user=task.assigned_to, # may be None for interns
            action_type='task_submitted',
            description=f'Task "{task.title}" submitted by {task.assigned_to.get_full_name() if task.assigned_to else task.assigned_intern.full_name}',
            content_object=task,
            team=task.team,
        )

        return Response({'message': 'Task submitted successfully!'}, status=201)


class InternalTaskSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        
        # Permission check: Assigned user OR a project member
        is_assignee = task.assigned_to == request.user
        is_project_member = task.project and task.project.members.filter(id=request.user.id).exists()
        
        if not (is_assignee or is_project_member):
            return Response({"error": "You do not have permission to submit this task."}, status=403)

        if hasattr(task, 'submission'):
            return Response({'error': 'This task has already been submitted.'}, status=400)

        submission = TaskSubmission.objects.create(
            task=task,
            text_response=request.data.get('text_response', ''),
            file_upload=request.FILES.get('file_upload'),
            submitter_email=request.user.email,
        )

        task.status = 'submitted'
        task.save()

        # Activity log
        log_activity(
            user=request.user,
            action_type='task_submitted',
            description=f'Task "{task.title}" submitted via portal by {request.user.get_full_name() or request.user.username}',
            content_object=task,
            team=task.team,
        )

        return Response({'message': 'Task submitted successfully!'}, status=201)


class TaskFeedbackView(APIView):
    permission_classes = [CanManageTasks]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        if hasattr(task, 'feedback'):
            # Update existing
            task.feedback.feedback_text = request.data.get('feedback_text', task.feedback.feedback_text)
            task.feedback.rating = request.data.get('rating', task.feedback.rating)
            task.feedback.save()
            feedback = task.feedback
        else:
            feedback = TaskFeedback.objects.create(
                task=task,
                feedback_text=request.data.get('feedback_text', ''),
                given_by=request.user,
                rating=request.data.get('rating'),
            )

        task.status = 'reviewed'
        task.save()

        # Update intern round progression if applicable
        if task.assigned_intern and task.round_number == task.assigned_intern.current_round:
            if task.assigned_intern.current_round < 5:
                task.assigned_intern.current_round += 1
                task.assigned_intern.save()
                log_activity(
                    user=request.user,
                    action_type='round_unlocked',
                    description=f'Round {task.assigned_intern.current_round} unlocked for intern {task.assigned_intern.full_name}',
                    content_object=task.assigned_intern
                )

        # Send feedback email
        try:
            if task.assigned_to:
                intern_name = task.assigned_to.get_full_name() or task.assigned_to.username
                intern_email = task.assigned_to.email
            elif task.assigned_intern:
                intern_name = task.assigned_intern.full_name
                intern_email = task.assigned_intern.application.email
            else:
                intern_name = "User"
                intern_email = None

            if intern_email:
                send_feedback_email(
                    intern_name=intern_name,
                    intern_email=intern_email,
                    task_title=task.title,
                    feedback_text=feedback.feedback_text,
                    rating=feedback.rating,
                    mentor_name=request.user.get_full_name() or request.user.username,
                )
        except Exception:
            pass

        log_activity(
            user=request.user,
            action_type='feedback_given',
            description=f'Feedback given for task "{task.title}"',
            content_object=task,
            team=task.team,
        )

        return Response({'message': 'Feedback saved.'})


class TaskReminderView(APIView):
    permission_classes = [CanManageTasks]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        try:
            intern_name = task.assigned_to.get_full_name() if task.assigned_to else task.assigned_intern.full_name
            intern_email = task.assigned_to.email if task.assigned_to else task.assigned_intern.application.email
            from django.conf import settings
            if intern_email:
                send_reminder_email(
                    intern_name=intern_name,
                    intern_email=intern_email,
                    task_title=task.title,
                    deadline=task.deadline,
                    login_url=f"{settings.FRONTEND_URL}/login",
                )
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        return Response({'message': 'Reminder sent.'})


class WorkLogCreateView(generics.CreateAPIView):
    serializer_class = WorkLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        task = get_object_or_404(Task, pk=self.kwargs['pk'])
        serializer.save(user=self.request.user, task=task)
