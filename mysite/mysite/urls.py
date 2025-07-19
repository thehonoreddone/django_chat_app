from django.contrib import admin
from django.urls import include, path
from chat.views import *

urlpatterns = [
    path("chat/", include("chat.urls")),
    path("login/", Login, name="Login"),
    path("register/", Register, name="Register"),
    path("admin/", admin.site.urls),
]