from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
import datetime


class Command(BaseCommand):
    help = 'Seed demo data: admin, mentors, interns, teams, projects, tasks'

    def handle(self, *args, **options):
        from users.models import UserProfile
        from internships.models import InternProfile, Application
        from teams.models import Team, TeamMembership
        from projects.models import Project
        from tasks.models import Task, TaskFeedback, TaskSubmission

        self.stdout.write('[*] Seeding demo data...')

        # ── Admin ──────────────────────────────────────────────────────────
        admin_user, _ = User.objects.get_or_create(username='admin')
        admin_user.set_password('admin@123')
        admin_user.email = 'admin@zlabs.com'
        admin_user.first_name = 'Super'
        admin_user.last_name = 'Admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        UserProfile.objects.update_or_create(user=admin_user, defaults={'role': 'admin'})
        self.stdout.write('  [OK] Admin: admin / admin@123')

        # ── Mentors ────────────────────────────────────────────────────────
        mentor1, _ = User.objects.get_or_create(username='mentor_sara')
        mentor1.set_password('mentor@123')
        mentor1.email = 'sara@zlabs.com'
        mentor1.first_name = 'Sara'
        mentor1.last_name = 'Khan'
        mentor1.save()
        UserProfile.objects.update_or_create(user=mentor1, defaults={'role': 'mentor', 'phone': '9876543210'})

        mentor2, _ = User.objects.get_or_create(username='mentor_raj')
        mentor2.set_password('mentor@123')
        mentor2.email = 'raj@zlabs.com'
        mentor2.first_name = 'Raj'
        mentor2.last_name = 'Patel'
        mentor2.save()
        UserProfile.objects.update_or_create(user=mentor2, defaults={'role': 'mentor', 'phone': '9876543211'})
        self.stdout.write('  [OK] Mentors: mentor_sara, mentor_raj / mentor@123')

        # ── Teams ──────────────────────────────────────────────────────────
        team_dev, _ = Team.objects.get_or_create(name='Development', defaults={'domain': 'Tech', 'description': 'Full-stack development team'})
        team_design, _ = Team.objects.get_or_create(name='Design', defaults={'domain': 'Creative', 'description': 'UI/UX design team'})
        self.stdout.write('  [OK] Teams: Development, Design')

        # ── Team Head ──────────────────────────────────────────────────────
        th, _ = User.objects.get_or_create(username='teamhead_ali')
        th.set_password('teamhead@123')
        th.email = 'ali@zlabs.com'
        th.first_name = 'Ali'
        th.last_name = 'Hassan'
        th.save()
        UserProfile.objects.update_or_create(user=th, defaults={'role': 'team_head'})
        team_dev.head = th
        team_dev.save()
        TeamMembership.objects.get_or_create(user=th, team=team_dev)
        self.stdout.write('  [OK] Team Head: teamhead_ali / teamhead@123')

        # ── Projects ───────────────────────────────────────────────────────
        proj1, _ = Project.objects.get_or_create(
            name='ZLabs Portal v2',
            defaults={'description': 'Internship management portal rebuild', 'team': team_dev, 'status': 'active', 'created_by': admin_user}
        )
        proj2, _ = Project.objects.get_or_create(
            name='Brand Identity 2025',
            defaults={'description': 'New company brand design', 'team': team_design, 'status': 'planning', 'created_by': admin_user}
        )
        self.stdout.write('  [OK] Projects: ZLabs Portal v2, Brand Identity 2025')

        # ── Interns ────────────────────────────────────────────────────────
        interns_data = [
            ('intern_priya', 'priya@gmail.com', 'Priya', 'Sharma', mentor1),
            ('intern_john', 'john@gmail.com', 'John', 'Doe', mentor1),
            ('intern_mia', 'mia@gmail.com', 'Mia', 'Chen', mentor2),
        ]

        intern_users = []
        for username, email, first, last, mentor in interns_data:
            u, _ = User.objects.get_or_create(username=username)
            u.set_password('intern@123')
            u.email = email
            u.first_name = first
            u.last_name = last
            u.save()
            UserProfile.objects.update_or_create(user=u, defaults={'role': 'intern'})
            InternProfile.objects.get_or_create(user=u, defaults={'mentor': mentor})
            intern_users.append(u)

        self.stdout.write('  [OK] Interns: intern_priya, intern_john, intern_mia / intern@123')

        # ── Converted Team Member ──────────────────────────────────────────
        tm, _ = User.objects.get_or_create(username='member_alex')
        tm.set_password('member@123')
        tm.email = 'alex@gmail.com'
        tm.first_name = 'Alex'
        tm.last_name = 'Brown'
        tm.save()
        UserProfile.objects.update_or_create(user=tm, defaults={'role': 'team_member'})
        TeamMembership.objects.get_or_create(user=tm, team=team_dev)
        self.stdout.write('  [OK] Team Member: member_alex / member@123')

        # ── Tasks ──────────────────────────────────────────────────────────
        deadline_future = timezone.now() + datetime.timedelta(days=7)
        deadline_past = timezone.now() - datetime.timedelta(days=2)

        tasks_data = [
            {
                'title': 'Build REST API for User Auth',
                'description': 'Create login, register and token refresh endpoints using DRF and SimpleJWT.',
                'assigned_to': intern_users[0],
                'assigned_by': mentor1,
                'deadline': deadline_future,
                'status': 'pending',
                'task_type': 'intern',
            },
            {
                'title': 'Design Wireframes for Dashboard',
                'description': 'Create Figma wireframes for admin and mentor dashboards.',
                'assigned_to': intern_users[1],
                'assigned_by': mentor1,
                'deadline': deadline_past,
                'status': 'submitted',
                'task_type': 'intern',
            },
            {
                'title': 'Write Unit Tests for Models',
                'description': 'Write Django unit tests covering all core model methods.',
                'assigned_to': intern_users[2],
                'assigned_by': mentor2,
                'deadline': deadline_future,
                'status': 'reviewed',
                'task_type': 'intern',
            },
            {
                'title': 'Setup CI/CD Pipeline',
                'description': 'Configure GitHub Actions for automated testing and deployment.',
                'assigned_to': tm,
                'assigned_by': admin_user,
                'deadline': deadline_future,
                'status': 'in_progress',
                'task_type': 'team',
                'team': team_dev,
                'project': proj1,
            },
            {
                'title': 'Create Brand Color Palette',
                'description': 'Research and define the 2025 brand colors, fonts, and design tokens.',
                'assigned_to': tm,
                'assigned_by': admin_user,
                'deadline': deadline_future,
                'status': 'pending',
                'task_type': 'team',
                'team': team_design,
                'project': proj2,
            },
        ]

        for t_data in tasks_data:
            Task.objects.get_or_create(title=t_data['title'], defaults=t_data)

        # Add submission + feedback to reviewed task
        reviewed_task = Task.objects.filter(status='reviewed').first()
        if reviewed_task:
            if not hasattr(reviewed_task, 'submission') or not TaskSubmission.objects.filter(task=reviewed_task).exists():
                TaskSubmission.objects.create(
                    task=reviewed_task,
                    text_response='I have completed all unit tests. Coverage is at 87%.',
                    submitter_email=reviewed_task.assigned_to.email,
                )
            if not hasattr(reviewed_task, 'feedback') or not TaskFeedback.objects.filter(task=reviewed_task).exists():
                TaskFeedback.objects.create(
                    task=reviewed_task,
                    feedback_text='Excellent work! Tests are well-structured and cover edge cases.',
                    given_by=mentor2,
                    rating=5,
                )

        # Add submission to submitted task
        submitted_task = Task.objects.filter(status='submitted').first()
        if submitted_task:
            if not TaskSubmission.objects.filter(task=submitted_task).exists():
                TaskSubmission.objects.create(
                    task=submitted_task,
                    text_response='Wireframes are done. Attached the Figma link in description.',
                    submitter_email=submitted_task.assigned_to.email,
                )

        self.stdout.write('  [OK] Tasks: 5 tasks with various statuses')

        self.stdout.write(self.style.SUCCESS(
            '\n[DONE] Seed data loaded successfully!\n'
            'Admin:       admin / admin@123\n'
            'Mentors:     mentor_sara, mentor_raj / mentor@123\n'
            'Team Head:   teamhead_ali / teamhead@123\n'
            'Team Member: member_alex / member@123\n'
            'Interns:     intern_priya, intern_john, intern_mia / intern@123\n'
        ))
