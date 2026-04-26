from django.contrib import admin
from .models import Application, InternProfile, OpenPosition

@admin.register(OpenPosition)
class OpenPositionAdmin(admin.ModelAdmin):
    list_display = ['title', 'role', 'duration', 'is_open', 'created_at']
    list_filter = ['is_open', 'role']

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'role_applied_for', 'status', 'applied_at']
    list_filter = ['status', 'role_applied_for']
    search_fields = ['name', 'email']

@admin.register(InternProfile)
class InternProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'mentor', 'is_ready_for_team', 'joined_at']
    list_filter = ['is_ready_for_team']
