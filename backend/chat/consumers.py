import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatGroup, ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'chat_{self.group_id}'
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        # Check permission
        has_access = await self.check_user_access(self.user, self.group_id)
        if not has_access:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json.get('message', '').strip()
        
        if not message_content:
            return

        # Save message to database
        message = await self.save_message(self.user, self.group_id, message_content)
        
        # Get avatar for broadcast
        sender_avatar = await self.get_user_avatar(self.user)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'message': message_content,
                'sender': self.user.username,
                'sender_id': self.user.id,
                'sender_avatar': sender_avatar,
                'attachment': None, # WebSockets only sends text messages for now
                'timestamp': message.timestamp.isoformat()
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'id': event.get('id'),
            'message': event['message'],
            'sender': event['sender'],
            'sender_id': event['sender_id'],
            'sender_avatar': event.get('sender_avatar'),
            'attachment': event.get('attachment'),
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def get_user_avatar(self, user):
        if hasattr(user, 'profile') and user.profile.avatar:
            return user.profile.avatar.url
        return None

    @database_sync_to_async
    def check_user_access(self, user, group_id):
        try:
            group = ChatGroup.objects.get(id=group_id)
            if hasattr(user, 'profile') and user.profile.role in ['admin', 'super_admin']:
                return True
            if group.team:
                return group.team.memberships.filter(user=user).exists() or group.team.head == user
            if group.project:
                return group.project.members.filter(id=user.id).exists() or (group.project.team and group.project.team.memberships.filter(user=user).exists()) or (group.project.team and group.project.team.head == user)
        except Exception:
            pass
        return False

    @database_sync_to_async
    def save_message(self, user, group_id, content):
        group = ChatGroup.objects.get(id=group_id)
        return ChatMessage.objects.create(group=group, sender=user, content=content)
