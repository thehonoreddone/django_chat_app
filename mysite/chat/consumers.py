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

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        user=self.scope["user"]
        type_control = text_data_json.get("type_control")
        await self.save_database(message, user, type_control, self.room_name)
         

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat.message",
                                   "message": message,
                                   "user": user.username,
                                   "date": self.message_object.get_short_date(),
                                   "type_control": type_control}
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        user= event["user"]
        date = event["date"]
        type_control = event["type_control"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message,
                                        "user": user, 
                                        "date": date,
                                        "type_control": type_control}))
    @database_sync_to_async
    def save_database(self,message,user,type_control,room):
        m = Message.objects.create(
            user=user, room_id=room, content=message, type_control=type_control
        )
        self.message_object = m
        