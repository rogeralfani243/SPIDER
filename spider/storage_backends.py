# myapp/storage_backends.py
from storages.backends.s3boto3 import S3Boto3Storage

class StaticStorage(S3Boto3Storage):
    location = 'static'
    default_acl = 'public-read'

class MediaStorage(S3Boto3Storage):
    location = 'media'
    default_acl = 'public-read'
    file_overwrite = False

# Puis dans settings.py:
# DEFAULT_FILE_STORAGE = 'myapp.storage_backends.MediaStorage'
# STATICFILES_STORAGE = 'myapp.storage_backends.StaticStorage'