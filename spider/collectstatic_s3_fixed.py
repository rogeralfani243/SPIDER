# collectstatic_s3_fixed.py
import os
import sys
import django
from pathlib import Path

# IMPORTANT: Définir le module settings AVANT d'importer django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spider.settings')

# Ajouter le répertoire courant au path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))

try:
    django.setup()
except Exception as e:
    print(f"❌ Erreur setup Django: {e}")
    sys.exit(1)

from django.conf import settings
import boto3
from django.contrib.staticfiles.finders import get_finders

print("=" * 50)
print("🔄 COLLECTSTATIC VERS S3")
print("=" * 50)

# Vérifier les variables S3
aws_vars = {
    'AWS_ACCESS_KEY_ID': getattr(settings, 'AWS_ACCESS_KEY_ID', None),
    'AWS_SECRET_ACCESS_KEY': getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
    'AWS_STORAGE_BUCKET_NAME': getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None),
}

print("Configuration S3:")
for key, value in aws_vars.items():
    status = "✅" if value else "❌"
    masked = "****" + str(value)[-4:] if value and "SECRET" in key or "KEY" in key else value
    print(f"  {status} {key}: {masked}")

# Vérifier que tout est configuré
if not all(aws_vars.values()):
    print("\n❌ ERREUR: Variables S3 manquantes!")
    print("Vérifiez que vous avez configuré sur Heroku:")
    print("  heroku config:set AWS_ACCESS_KEY_ID=your_key")
    print("  heroku config:set AWS_SECRET_ACCESS_KEY=your_secret")
    print("  heroku config:set AWS_STORAGE_BUCKET_NAME=amz-spider-app")
    sys.exit(1)

bucket_name = settings.AWS_STORAGE_BUCKET_NAME
print(f"\n📦 Destination: S3 Bucket '{bucket_name}'")

# Créer client S3
try:
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    
    # Vérifier que le bucket existe
    s3.head_bucket(Bucket=bucket_name)
    print(f"✅ Bucket accessible: {bucket_name}")
    
except Exception as e:
    print(f"❌ Erreur connexion S3: {e}")
    sys.exit(1)

# Trouver tous les fichiers statiques
print("\n🔍 Recherche des fichiers statiques...")
all_static_files = []

for finder in get_finders():
    try:
        for path, storage in finder.list([]):
            # Obtenir le chemin complet
            if hasattr(storage, 'path'):
                full_path = storage.path(path)
                if os.path.exists(full_path):
                    all_static_files.append({
                        's3_key': f'static/{path}',
                        'local_path': full_path,
                        'size': os.path.getsize(full_path)
                    })
    except Exception as e:
        print(f"  ⚠️  Erreur avec finder: {e}")

print(f"📁 {len(all_static_files)} fichiers statiques trouvés")

# Uploader vers S3
print("\n⬆️  Upload vers S3...")
uploaded = 0
failed = 0

for file_info in all_static_files:
    s3_key = file_info['s3_key']
    local_path = file_info['local_path']
    
    try:
        # Déterminer le content-type
        import mimetypes
        content_type, encoding = mimetypes.guess_type(local_path)
        if not content_type:
            if local_path.endswith('.css'):
                content_type = 'text/css'
            elif local_path.endswith('.js'):
                content_type = 'application/javascript'
            elif local_path.endswith('.png'):
                content_type = 'image/png'
            elif local_path.endswith('.jpg') or local_path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            else:
                content_type = 'application/octet-stream'
        
        # Upload
        with open(local_path, 'rb') as f:
            s3.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=f,
                ContentType=content_type,
                CacheControl='max-age=86400'
                # Note: Pas d'ACL si le bucket ne les supporte pas
            )
        
        uploaded += 1
        if uploaded <= 10:  # Afficher les 10 premiers
            print(f"  ✅ {s3_key} ({file_info['size']} octets)")
        elif uploaded == 11:
            print(f"  ... et {len(all_static_files) - 10} autres fichiers")
            
    except Exception as e:
        failed += 1
        print(f"  ❌ {s3_key}: {e}")

# Résumé
print("\n" + "=" * 50)
print("📊 RÉSULTAT")
print("=" * 50)
print(f"✅ Réussis: {uploaded}")
print(f"❌ Échoués: {failed}")
print(f"📁 Total: {len(all_static_files)}")

if uploaded > 0:
    print(f"\n🎉 {uploaded} fichiers uploadés sur S3!")
    
    # Vérifier quelques fichiers
    print("\n🔍 Vérification rapide...")
    try:
        response = s3.list_objects_v2(
            Bucket=bucket_name,
            Prefix='static/',
            MaxKeys=5
        )
        
        if 'Contents' in response:
            print("Derniers fichiers uploadés:")
            for obj in response['Contents']:
                print(f"  • {obj['Key']}")
        else:
            print("⚠️  Aucun fichier trouvé (vérifiez dans la console AWS)")
            
    except Exception as e:
        print(f"⚠️  Erreur vérification: {e}")
else:
    print("\n😔 Aucun fichier uploadé")

print("\n🌐 URL de test:")
print(f"  https://{bucket_name}.s3.amazonaws.com/static/admin/css/base.css")