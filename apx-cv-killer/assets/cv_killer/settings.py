import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key-change-in-production')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'sourcing',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cv_killer.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cv_killer.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==========================================
# CUSTOM APPLICATION SETTINGS
# ==========================================

# 1. SSH Configuration (For remote Mac Mini access)
SSH_HOST = os.getenv('SSH_HOST', '192.168.0.25')
SSH_USER = os.getenv('SSH_USER', 'hackathon-team2')
SSH_PASSWORD = os.getenv('SSH_PASSWORD', '')

# 2. OpenClaw Configuration
OPENCLAW_REMOTE_PORT = int(os.getenv('OPENCLAW_REMOTE_PORT', '18789'))
OPENCLAW_GATEWAY_TOKEN = os.getenv('OPENCLAW_GATEWAY_TOKEN', '')
OPENCLAW_API_KEY = os.getenv('OPENCLAW_API_KEY', '')
OPENCLAW_BASE_URL = os.getenv('OPENCLAW_BASE_URL', '')

# 3. HrFlow.ai Configuration
HRFLOW_API_KEY = os.getenv('HRFLOW_API_KEY', '')
HRFLOW_SOURCE_KEY = os.getenv('HRFLOW_SOURCE_KEY', '')
HRFLOW_BOARD_KEY = os.getenv('HRFLOW_BOARD_KEY', '') # Critical for the Scoring API
HRFLOW_BASE_URL = os.getenv('HRFLOW_BASE_URL', 'https://api.hrflow.ai/v1')
HRFLOW_USER_EMAIL = os.getenv('HRFLOW_USER_EMAIL', '')
HRFLOW_ALGORITHM_KEY = os.getenv('HRFLOW_ALGORITHM_KEY', '')

# 4. App Limits & File Handling
MAX_RESULTS = int(os.getenv('MAX_RESULTS', '10'))
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# 5. Background Tasks (Celery)
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
# Recommended Celery settings for Django:
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'