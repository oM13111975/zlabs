from django.db import models
from django.contrib.auth.models import User


class OpenPosition(models.Model):
    ROLE_CHOICES = [
        ('aiml_intern', 'AI/ML Intern'),
        ('bde_intern', 'Business Development Intern'),
        ('dev_intern', 'Software Development Intern'),
        ('design_intern', 'UI/UX Design Intern'),
        ('marketing_intern', 'Digital Marketing Intern'),
        ('data_intern', 'Data Analyst Intern'),
        ('content_intern', 'Content Writing Intern'),
        ('hr_intern', 'HR Intern'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    duration = models.CharField(max_length=100, default='3 months')
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['role']


class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    ROLE_CHOICES = [
        ('aiml_intern', 'AI/ML Intern'),
        ('bde_intern', 'Business Development Intern'),
        ('dev_intern', 'Software Development Intern'),
        ('design_intern', 'UI/UX Design Intern'),
        ('marketing_intern', 'Digital Marketing Intern'),
        ('data_intern', 'Data Analyst Intern'),
        ('content_intern', 'Content Writing Intern'),
        ('hr_intern', 'HR Intern'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    role_applied_for = models.CharField(
        max_length=50, choices=ROLE_CHOICES, default='dev_intern',
        help_text='Internship role the applicant is applying for'
    )
    skills = models.TextField(blank=True, help_text='Comma-separated skills')
    cover_letter = models.TextField(blank=True, help_text='Why do you want this role?')
    resume = models.FileField(upload_to='resumes/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_applications'
    )
    rejection_reason = models.TextField(blank=True)

    def __str__(self):
        return f'{self.name} — {self.role_applied_for} — {self.status}'

    class Meta:
        ordering = ['-applied_at']


class InternProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='intern_profile', 
        null=True, blank=True
    )
    application = models.OneToOneField(
        Application, on_delete=models.SET_NULL, null=True, blank=True, related_name='intern_profile'
    )
    mentor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_interns'
    )
    is_ready_for_team = models.BooleanField(default=False)
    ready_marked_at = models.DateTimeField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    domain = models.CharField(max_length=100, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    current_round = models.IntegerField(default=1, help_text='Current active round (1-5)')

    @property
    def full_name(self):
        if self.user:
            return self.user.get_full_name() or self.user.username
        return self.application.name if self.application else "Unknown Intern"

    def __str__(self):
        return f'Intern: {self.full_name}'

    class Meta:
        ordering = ['-joined_at']
