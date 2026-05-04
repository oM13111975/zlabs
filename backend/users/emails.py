from django.core.mail import send_mail, EmailMessage
from django.conf import settings


def send_intern_welcome_email(name, email, username, password, login_url):
    subject = '🎉 Welcome to the ZLabs Internship Program!'
    message = f"""
Dear {name},

We are thrilled to inform you that your application has been ACCEPTED!

Welcome to ZLabs Internship Program. Your intern account has been created, and you can now access your dashboard to view and submit your tasks.

Your login credentials:
━━━━━━━━━━━━━━━━━━━━━━
Username: {username}
Password: {password}
━━━━━━━━━━━━━━━━━━━━━━

Login here: {login_url}

Best regards,
ZLabs Team
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])


def send_conversion_email(name, email, role, username, password, login_url, custom_subject=None, custom_body=None):
    subject = custom_subject or f'🚀 Welcome to the team! Your account for ZLabs is ready'
    
    if custom_body:
        message = custom_body.replace('[[NAME]]', name).replace('[[ROLE]]', role.replace('_', ' ').title()) \
                            .replace('[[USERNAME]]', username).replace('[[PASSWORD]]', password) \
                            .replace('[[LOGIN_URL]]', login_url)
    else:
        message = f"""
Dear {name},

Congratulations! Based on your excellent performance, you have been converted to a {role.replace('_', ' ').title()}.

Your internal portal account has been created.

Your login credentials:
━━━━━━━━━━━━━━━━━━━━━━
Username: {username}
Password: {password}
━━━━━━━━━━━━━━━━━━━━━━

Login here: {login_url}

Best regards,
ZLabs Team
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])


def send_task_assignment_email(intern_name, intern_email, task_title, task_description, deadline, mentor_name, login_url, custom_subject=None, custom_body=None):
    subject = custom_subject or f'📋 New Task Assigned: {task_title}'
    
    if custom_body:
        message = custom_body.replace('[[NAME]]', intern_name) \
                            .replace('[[DESCRIPTION]]', task_description) \
                            .replace('[[DEADLINE]]', deadline.strftime('%B %d, %Y %I:%M %p') if deadline else 'N/A') \
                            .replace('[[SENDER]]', mentor_name) \
                            .replace('[[LOGIN_URL]]', login_url)
    else:
        message = f"""
Dear {intern_name},

Your mentor {mentor_name} has assigned you a new task.

Task Details:
━━━━━━━━━━━━━━━━━━━━━━
Title: {task_title}
Description: {task_description}
Deadline: {deadline.strftime('%B %d, %Y %I:%M %p') if deadline else 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━

You can view more details and submit your work through the ZLabs Portal:
{login_url}

Good luck!

Best regards,
ZLabs Team
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [intern_email])


def send_feedback_email(intern_name, intern_email, task_title, feedback_text, rating, mentor_name):
    subject = f'💬 Feedback Received for: {task_title}'
    message = f"""
Dear {intern_name},

Your mentor {mentor_name} has reviewed your submission for "{task_title}".

Feedback:
━━━━━━━━━━━━━━━━━━━━━━
{feedback_text}

Rating: {'⭐' * (rating or 0)} ({rating}/5)
━━━━━━━━━━━━━━━━━━━━━━

Keep up the great work!

Best regards,
ZLabs Team
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [intern_email])


def send_reminder_email(intern_name, intern_email, task_title, deadline, login_url):
    subject = f'⏰ Reminder: Task deadline approaching — {task_title}'
    message = f"""
Dear {intern_name},

This is a reminder that your task is due soon.

Task: {task_title}
Deadline: {deadline.strftime('%B %d, %Y %I:%M %p') if deadline else 'N/A'}

Login to the portal to submit your work:
{login_url}

Best regards,
ZLabs Team
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [intern_email])


def send_task_submission_notification(mentor_email, mentor_name, intern_name, task_title, portal_url, attachment=None):
    subject = f'📥 New Submission: {intern_name} — {task_title}'
    message = f"""
Dear {mentor_name},

{intern_name} has just submitted their work for the task: "{task_title}".

You can review the submission and provide feedback in the portal:
{portal_url}

Best regards,
ZLabs System
"""
    email = EmailMessage(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [mentor_email],
    )
    
    if attachment:
        # attachment is a file field or path
        try:
            email.attach(attachment.name, attachment.read(), attachment.content_type)
        except Exception:
            pass
            
    email.send()
