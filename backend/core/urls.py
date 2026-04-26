from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/internships/', include('internships.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/teams/', include('teams.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/activity-logs/', include('activity_logs.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
