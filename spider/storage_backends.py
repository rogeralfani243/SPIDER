# spider/storage_backends.py - VERSION CORRIGÉE
from storages.backends.s3boto3 import S3Boto3Storage
import os

class StaticStorage(S3Boto3Storage):
    location = 'static'
    default_acl = None
    file_overwrite = True
    
    def __init__(self, *args, **kwargs):
        # FORCER les variables d'environnement
        kwargs['bucket_name'] = os.environ.get('AWS_STORAGE_BUCKET_NAME')
        kwargs['access_key'] = os.environ.get('AWS_ACCESS_KEY_ID')
        kwargs['secret_key'] = os.environ.get('AWS_SECRET_ACCESS_KEY')
        kwargs['region_name'] = os.environ.get('AWS_S3_REGION_NAME', 'eu-north-1')
        kwargs['default_acl'] = None
        super().__init__(*args, **kwargs)

class MediaStorage(S3Boto3Storage):
    location = 'media'
    default_acl = None
    file_overwrite = False
    
    def __init__(self, *args, **kwargs):
        # FORCER les variables d'environnement
        kwargs['bucket_name'] = os.environ.get('AWS_STORAGE_BUCKET_NAME')
        kwargs['access_key'] = os.environ.get('AWS_ACCESS_KEY_ID')
        kwargs['secret_key'] = os.environ.get('AWS_SECRET_ACCESS_KEY')
        kwargs['region_name'] = os.environ.get('AWS_S3_REGION_NAME', 'eu-north-1')
        kwargs['default_acl'] = None
        super().__init__(*args, **kwargs)
        print(f"MediaStorage initialisé - Bucket: {self.bucket_name}")