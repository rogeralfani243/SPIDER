from django.contrib import admin
from .models import Post,Category,PostImage,PostFile


admin.site.register(Post)
admin.site.register(Category)
admin.site.register(PostImage)
admin.site.register(PostFile)