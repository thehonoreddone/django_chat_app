import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import *


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

       
        if data.get("command") == "read":
            message_ids = data.get("message_ids", [])
            await self.mark_messages_read(message_ids)
            return

        # Typing indicator
        if data.get("type") == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_indicator",
                    "user": self.scope["user"].username,
                }
            )
            return

        
        message = data.get("message")
        if not message or not message.strip():
            return  

        user = self.scope["user"]
        type_control = data.get("type_control")
        await self.save_database(message, user, type_control, self.room_name)

        await self.channel_layer.group_send(
            self.room_group_name, {
                "type": "chat.message",
                "message": message,
                "user": user.username,
                "date": self.message_object.get_short_date(),
                "type_control": type_control,
                "message_id": self.message_object.id
            }
        )

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "user": event["user"]
        }))

    
    async def chat_message(self, event):
        message = event["message"]
        user = event["user"]
        date = event.get("date")
        type_control = event.get("type_control")
        message_id = event.get("message_id")

        await self.send(text_data=json.dumps({
            "message": message,
            "user": user,
            "date": date,
            "type_control": type_control,
            "message_id": message_id
        }))

    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        Message.objects.filter(id__in=message_ids).update(is_read=True)

    @database_sync_to_async
    def save_database(self, message, user, type_control, room):
        m = Message.objects.create(
            user=user, room_id=room, content=message, type_control=type_control
        )
        self.message_object = m
        