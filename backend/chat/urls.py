from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatGroupViewSet

router = DefaultRouter()
router.register(r'groups', ChatGroupViewSet, basename='chatgroup')

urlpatterns = [
    path('', include(router.urls)),
]
