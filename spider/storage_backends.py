from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings

class StaticStorage(S3Boto3Storage):
    location = 'static'
    default_acl = None  # Changed from 'public-read'
    file_overwrite = True

class PublicMediaStorage(S3Boto3Storage):
    location = 'media'
    default_acl = None  # Changed from 'public-read' ← THIS IS CRITICAL
    file_overwrite = False
    custom_domain = settings.AWS_S3_CUSTOM_DOMAIN

class PrivateMediaStorage(S3Boto3Storage):
    location = 'private'
    default_acl = None  # Changed from 'private'
    file_overwrite = False
    custom_domain = False