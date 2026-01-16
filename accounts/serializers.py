import django
from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate 
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = serializers.CharField(write_only=True)

        if username and password :
            user = authenticate(username=username, password=password)
            if user :
                if user.is_active :
                    data['user'] = user
                else :
                    raise serializers.ValidationError("User account is disabled.")
            else :
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else :
            raise serializers.ValidationError("Must include 'username' and 'password'. ")
        return data
from django.contrib.auth import get_user_model
User = get_user_model()
print(User.USERNAME_FIELD)
