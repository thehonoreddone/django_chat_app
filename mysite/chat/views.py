from django.shortcuts import render
from django.contrib.auth import authenticate, login
from django.shortcuts import redirect
from django.contrib.auth.models import User
from .models import *
from django.contrib.auth.decorators import login_required
from django.contrib import messages

@login_required(login_url='login')
def index(request):
    users=User.objects.all().exclude(username=request.user)
    return render(request, "chat/index.html",{
    "users": users,
    })

@login_required(login_url='login')
def room(request, room_name):
    users=User.objects.all().exclude(username=request.user)
    room=Room.objects.get(id=room_name)
    messages= Message.objects.filter(room=room)
    
    if request.user != room.first_user:
        if request.user != room.second_user:
            return redirect('index')
    return render(request, "chat/rooms.html", {"room_name": room_name, "users": users,"room": room, "messages": messages})

@login_required(login_url="login")
def video(request, room_name):
    room = Room.objects.get(id=room_name)
    if request.user != room.first_user:
        if request.user != room.second_user:
            return redirect('index')
    return render(request, 'chat/video_chat.html',{'room':room})

@login_required(login_url='login')
def start_chat(request,username):
    second_user = User.objects.get(username=username)
    try:
        room= Room.objects.get(first_user=request.user, second_user=second_user)
    except Room.DoesNotExist:
        try:
            room = Room.objects.get(first_user=second_user, second_user=request.user)
        except:   
            Room.objects.create(first_user=request.user, second_user=second_user)
    return redirect("room",room.id)
        

def Login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)  
            return redirect("index")
        else:
            return redirect("Login")
            
            
    return render(request, "chat/login.html")

from django.contrib import messages

def Register(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Bu kullanıcı adı zaten alınmış.")
            return redirect("Register")

        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return redirect("index")

    return render(request, "chat/register.html")