from django.db import models
from django.contrib.auth.models import User
import uuid

class Room(models.Model):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4,)
    first_user=models.ForeignKey(User, verbose_name=("first_user"),on_delete=models.CASCADE, related_name='first_user')
    second_user=models.ForeignKey(User, verbose_name=("second_user"), on_delete=models.CASCADE, related_name='second_user')


    
class Message(models.Model):
   user = models.ForeignKey(User, on_delete=models.CASCADE,verbose_name=("user"))
   room=models.ForeignKey(Room, on_delete=models.CASCADE,verbose_name=("room"))
   content=models.TextField(verbose_name=("content"))
   date=models.DateTimeField(auto_now_add=True, verbose_name=("date"))
   type_control=models.CharField(max_length=50,null=True)
   is_read = models.BooleanField(default=False)  
   
   def get_short_date(self):
       return str(self.date.hour) + ":" + str(self.date.minute)


