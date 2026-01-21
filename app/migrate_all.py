# migrate_all.py
import os
import sys
import django

print("=" * 60)
print("APPLYING MIGRATIONS FOR ALL APPS")
print("=" * 60)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spider.settings')

try:
    django.setup()
    
    from django.core.management import call_command
    from django.conf import settings
    
    print("1. Checking installed apps...")
    for app in settings.INSTALLED_APPS:
        if not app.startswith('django.'):
            print(f"   📦 {app}")
    
    print("\n2. Checking migration status...")
    call_command('showmigrations', verbosity=1)
    
    print("\n3. Applying ALL migrations...")
    
    # Option 1: Toutes d'un coup
    call_command('migrate', verbosity=2)
    
    # Option 2: App par app (si besoin)
    print("\n4. Migrating each app individually...")
    
    apps_to_migrate = [
        'feedback_post',
    'accounts',
    'feedback',
    'corsheaders',
    'app',
    'post',
    'comment_post',
    'channels',
    'messaging', 
    'django_filters',
    'report',
    'dashboard_client',
    'searchs',
    ]
    
    for app_name in apps_to_migrate:
        try:
            print(f"\n   🔧 Migrating {app_name}...")
            call_command('migrate', app_name, verbosity=1)
            print(f"   ✅ {app_name} migrated")
        except Exception as e:
            print(f"   ⚠️  {app_name} error: {e}")
    
    print("\n5. Final verification...")
    call_command('showmigrations', verbosity=0)
    
    print("\n" + "=" * 60)
    print("✅ ALL APP MIGRATIONS COMPLETE!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)