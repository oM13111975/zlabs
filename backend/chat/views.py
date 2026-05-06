from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ChatGroup, ChatMessage, UserChatState
from .serializers import ChatGroupSerializer, ChatMessageSerializer
from django.db.models import Q, OuterRef, Subquery, Max, Count
from django.db.models.functions import Coalesce
from django.utils import timezone
import datetime
from teams.models import Team
from projects.models import Project

class ChatGroupViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChatGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ChatGroup.objects.select_related('team', 'project', 'project__team').prefetch_related(
            'team__head', 'team__memberships__user',
            'project__members', 'project__team__head', 'project__team__memberships__user'
        )
        
        if not (hasattr(user, 'profile') and getattr(user.profile, 'role', '') in ['admin', 'super_admin']):
            user_teams = user.team_memberships.values_list('team_id', flat=True)
            head_teams = Team.objects.filter(head=user).values_list('id', flat=True)
            all_teams = list(user_teams) + list(head_teams)

            user_projects = user.assigned_projects.values_list('id', flat=True)
            
            qs = qs.filter(
                Q(team_id__in=all_teams) | 
                Q(project_id__in=user_projects) |
                Q(project__team_id__in=all_teams)
            )

        latest_msg = ChatMessage.objects.filter(group=OuterRef('pk')).order_by('-timestamp')
        
        last_read_sq = UserChatState.objects.filter(
            user=user, group=OuterRef('pk')
        ).values('last_read_timestamp')[:1]

        # Use an old date if no read state exists so all messages count as unread
        old_date = timezone.make_aware(datetime.datetime(2000, 1, 1))
        
        return qs.annotate(
            latest_message_time=Max('messages__timestamp'),
            latest_message_content=Subquery(latest_msg.values('content')[:1]),
            unread_count=Count(
                'messages',
                filter=Q(messages__timestamp__gt=Coalesce(Subquery(last_read_sq), old_date))
            )
        ).order_by('-latest_message_time', '-created_at')

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        group = self.get_object()
        
        if request.method == 'POST':
            content = request.data.get('content', '')
            attachment = request.FILES.get('attachment')
            
            if not content and not attachment:
                return Response({'error': 'Message content or attachment is required'}, status=400)
                
            msg = ChatMessage.objects.create(
                group=group,
                sender=request.user,
                content=content,
                attachment=attachment
            )
            
            # Broadcast the message using Channels
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            room_group_name = f'chat_{group.id}'
            
            attachment_url = request.build_absolute_uri(msg.attachment.url) if msg.attachment else None
            sender_avatar = request.build_absolute_uri(msg.sender.profile.avatar.url) if hasattr(msg.sender, 'profile') and msg.sender.profile.avatar else None

            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'chat_message',
                    'id': msg.id,
                    'message': msg.content,
                    'sender': msg.sender.username,
                    'sender_id': msg.sender.id,
                    'sender_avatar': sender_avatar,
                    'attachment': attachment_url,
                    'timestamp': msg.timestamp.isoformat()
                }
            )
            
            serializer = ChatMessageSerializer(msg, context={'request': request})
            return Response(serializer.data, status=201)

        messages = group.messages.all().select_related('sender', 'sender__profile').order_by('-timestamp')
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = ChatMessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        group = self.get_object()
        UserChatState.objects.update_or_create(
            user=request.user, group=group,
            defaults={'last_read_timestamp': timezone.now()}
        )
        return Response({'status': 'read'})

    @action(detail=False, methods=['post'])
    def get_or_create(self, request):
        team_id = request.data.get('team_id')
        project_id = request.data.get('project_id')
        
        # Check permissions for creation
        user = request.user
        is_admin = hasattr(user, 'profile') and getattr(user.profile, 'role', '') in ['admin', 'super_admin']

        if team_id:
            if not is_admin and not (user.team_memberships.filter(team_id=team_id).exists() or Team.objects.filter(id=team_id, head=user).exists()):
                return Response({"error": "Not permitted"}, status=403)
            group, created = ChatGroup.objects.get_or_create(team_id=team_id)
            return Response(ChatGroupSerializer(group).data)
        elif project_id:
            if not is_admin and not (user.assigned_projects.filter(id=project_id).exists() or Project.objects.filter(id=project_id, team__head=user).exists() or Project.objects.filter(id=project_id, team__memberships__user=user).exists()):
                return Response({"error": "Not permitted"}, status=403)
            group, created = ChatGroup.objects.get_or_create(project_id=project_id)
            return Response(ChatGroupSerializer(group).data)
            
        return Response({"error": "Provide team_id or project_id"}, status=400)
