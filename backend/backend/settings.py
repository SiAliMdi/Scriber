from datetime import datetime
from pathlib import Path
from os import getenv
from os.path import join
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(join(str(BASE_DIR),"local.env"))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = getenv('SECRET_KEY')
JWT_SECRET = getenv('JWT_SECRET')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = getenv('DEBUG') == 'True'

ALLOWED_HOSTS = getenv('ALLOWED_HOSTS', 'localhost').split(',')
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = (a for a in getenv('SECURE_PROXY_SSL_HEADER', '').split(',') if a)
    SECURE_SSL_REDIRECT = getenv('SECURE_SSL_REDIRECT') == 'True'
    CSRF_COOKIE_SECURE= getenv('CSRF_COOKIE_SECURE',) == 'True'
    SESSION_COOKIE_SECURE= getenv('SESSION_COOKIE_SECURE',) == 'True'
    SECURE_BROWSER_XSS_FILTER= getenv('SECURE_BROWSER_XSS_FILTER',) == 'True'
    SECURE_CONTENT_TYPE_NOSNIFF= getenv('SECURE_CONTENT_TYPE_NOSNIFF',) == 'True'


# Application definition

INSTALLED_APPS = [
    'channels',
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
    'ai_models',
    'annotations',
    'categories',
    'datasets',
    'decisions',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.services.ScriberUserAuthentication',
    ),
}

DEFAULT_AUTHENTICATION_CLASSES = ( 
    'users.services.ScriberUserAuthentication',
)

AUTHENTICATION_BACKENDS = [
    #  'django.contrib.auth.backends.ModelBackend',
    'users.services.ScriberUserAuthentication',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'backend.settings.LogMiddleware'
]

ASGI_APPLICATION = "backend.asgi.application"

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': getenv('DB_ENGINE'),
        'NAME': getenv('DB_NAME'),
        'USER': getenv('DB_USER'),
        'PASSWORD': getenv('DB_PASSWORD'),
        'HOST': getenv('DB_HOST'),
        'PORT': getenv('DB_PORT')
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'fr-FR'

AUTH_USER_MODEL = "users.ScriberUsers"
TIME_ZONE = getenv('TIME_ZONE')

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
DJANGO_COLORS = "error=red;warning=yellow;success=green;notice=magenta;link=blue,underscore;sql_table=cyan,bold;sql_field=cyan,bold"
# Some useful commands: py manage check --deploy
# CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOWED_ORIGINS = [
    getenv('FRONTEND_URL'),
    getenv('DEV_FRONTEND_URL'),
]
CORS_ALLOW_CREDENTIALS = True

class LogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(f"Request Method: {request.method},\n \
              Path: {request.path},\n \
              Headers: {request.headers} \n \
              Body: {request.body}")
        response = self.get_response(request)
        print(f"Response Status Code: {response.status_code}")
        return response

# CELERY
""" CELERY_BROKER_URL = getenv('CELERY_BROKER_URL')
CELERY_RESULT_BACKEND = getenv('CELERY_RESULT_BACKEND')
CELERY_ROOT_LOG_PATH = getenv('CELERY_ROOT_LOG_PATH') """

# JUDILIBRE API
JUDILIBRE_OAUTH_URL = getenv('JUDILIBRE_OAUTH_URL')
JUDILIBRE_CLIENT_ID = getenv('JUDILIBRE_CLIENT_ID')
JUDILIBRE_CLIENT_SECRET = getenv('JUDILIBRE_CLIENT_SECRET')
JUDILIBRE_SCOPE = getenv('JUDILIBRE_SCOPE')
JUDILIBRE_URL = getenv('JUDILIBRE_URL')
JUDILIBRE_ROOT_LOG_PATH = getenv('JUDILIBRE_ROOT_LOG_PATH')
JUDILIBRE_EXPORT_HOUR = getenv('JUDILIBRE_EXPORT_HOUR')
JUDILIBRE_EXPORT_MINUTE = getenv('JUDILIBRE_EXPORT_MINUTE')

# TYPESENSE API
TYPESENSE_HOST = getenv('TYPESENSE_HOST')
TYPESENSE_PORT = getenv('TYPESENSE_PORT')
TYPESENSE_API_KEY = getenv('TYPESENSE_API_KEY')
TYPESENSE_COLLECTION_NAME = getenv('TYPESENSE_COLLECTION_NAME')


# LLMs APIs
MISTRAL_API_URL = getenv('MISTRAL_API_URL')
LLAMA_API_URL = getenv('LLAMA_API_URL')
MISTRAL_TAG = getenv('MISTRAL_TAG')
LLAMA_TAG = getenv('LLAMA_TAG')
LLM_API_KEY = getenv('LLM_API_KEY')

# LOGGING setup
DJANGO_ROOT_LOG_PATH = getenv('DJANGO_ROOT_LOG_PATH')
current_date = datetime.now()
day = current_date.strftime("%d")
month = current_date.strftime("%m")
year = current_date.strftime("%Y")

LOG_DIR = join(DJANGO_ROOT_LOG_PATH, year, month)
Path(LOG_DIR).mkdir(parents=True, exist_ok=True)
LOG_FILE = join(LOG_DIR, f"{day}.log")

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(asctime)s [%(levelname)s] %(name)s function %(funcName)s %(pathname)s at line %(lineno)s:\n\t %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '%(levelname)s %(message)s',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': LOG_FILE,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG', # if DEBUG else 'INFO',
            'propagate': True,
        },
        'backend': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django.utils.autoreload': {
            'level': 'INFO',
            'handlers': ['console'],
            'propagate': False,
        },
    },
}
