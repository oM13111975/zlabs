from django.contrib import admin
from .models import Team, TeamMembership

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'domain', 'head', 'created_at']

admin.site.register(TeamMembership)
