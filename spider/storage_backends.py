# spider/storage_backends.py
from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings

class StaticStorage(S3Boto3Storage):
    location = 'static'
    default_acl = None
    file_overwrite = True
    object_parameters = {}
# RENOMMEZ PublicMediaStorage EN MediaStorage
class MediaStorage(S3Boto3Storage):  # ← CHANGÉ ICI
    location = 'media'
    default_acl = None
    file_overwrite = False
    custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
    object_parameters = {}
class PrivateMediaStorage(S3Boto3Storage):
    location = 'private'
    default_acl = None
    file_overwrite = False
    custom_domain = False
    object_parameters = {}