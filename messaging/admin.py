from django.contrib import admin
from .models import Message, Conversation,GroupCategory,Block,BlockHistory

admin.site.register(Message)
admin.site.register(Conversation)
admin.site.register(GroupCategory)
admin.site.register(Block)
admin.site.register(BlockHistory)