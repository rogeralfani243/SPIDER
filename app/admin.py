from django.contrib import admin
from .models import Category, Comment, Tag,Profile,SecurityViolation

admin.site.register(Category)        
admin.site.register(Comment)
admin.site.register(Tag)
admin.site.register(Profile)
admin.site.register(SecurityViolation)