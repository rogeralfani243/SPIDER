# messaging/encrypted_fields.py
import json
import base64
from django.db import models
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from cryptography.fernet import Fernet
import secrets


def get_encryption_key():
    """Récupérer la clé d'encryption depuis les settings"""
    key = getattr(settings, 'FERNET_KEY', None)
    
    if not key:
        # Si pas de clé, en générer une (pour développement seulement)
        key = Fernet.generate_key().decode()
        print(f"ATTENTION: Génération d'une clé Fernet temporaire: {key[:20]}...")
        print("Ajoutez FERNET_KEY à vos settings.py pour la production")
    
    return Fernet(key.encode() if isinstance(key, str) else key)


class EncryptedFieldMixin:
    """Mixin pour les champs encryptés"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cipher_suite = get_encryption_key()
    
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        try:
            # Si c'est déjà une string decryptée, la retourner
            if isinstance(value, str) and not value.startswith('gAAAA'):
                return value
            
            # Sinon, décrypter
            decrypted = self.cipher_suite.decrypt(value.encode()).decode()
            return decrypted
        except Exception as e:
            # En cas d'erreur, retourner la valeur originale
            print(f"Erreur de décryptage: {e}")
            return value
    
    def get_prep_value(self, value):
        if value is None:
            return value
        
        # Si c'est déjà encrypté (commence par gAAAA), le retourner tel quel
        if isinstance(value, str) and value.startswith('gAAAA'):
            return value
        
        # Sinon, encrypter
        try:
            if isinstance(value, dict) or isinstance(value, list):
                value = json.dumps(value)
            return self.cipher_suite.encrypt(str(value).encode()).decode()
        except Exception as e:
            print(f"Erreur d'encryptage: {e}")
            return value


class EncryptedCharField(EncryptedFieldMixin, models.CharField):
    """CharField encrypté"""
    pass


class EncryptedTextField(EncryptedFieldMixin, models.TextField):
    """TextField encrypté"""
    pass


class EncryptedJSONField(EncryptedFieldMixin, models.JSONField):
    """JSONField encrypté"""
    
    def from_db_value(self, value, expression, connection):
        decrypted = super().from_db_value(value, expression, connection)
        
        if decrypted and isinstance(decrypted, str):
            try:
                return json.loads(decrypted)
            except:
                return decrypted
        return decrypted
    
    def get_prep_value(self, value):
        if value is None:
            return value
        
        if isinstance(value, dict) or isinstance(value, list):
            value = json.dumps(value)
        return super().get_prep_value(value)