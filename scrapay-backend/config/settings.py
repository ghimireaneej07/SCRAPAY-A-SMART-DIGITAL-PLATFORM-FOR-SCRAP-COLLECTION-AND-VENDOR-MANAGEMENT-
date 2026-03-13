import os
import sys
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


DEFAULT_DEV_SECRET_KEY = "dev-only-change-me-replace-this-with-a-secure-secret"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", DEFAULT_DEV_SECRET_KEY)

DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"

if not DEBUG and (SECRET_KEY == DEFAULT_DEV_SECRET_KEY or len(SECRET_KEY) < 50):
    raise ImproperlyConfigured(
        "Set a long, random DJANGO_SECRET_KEY before running with DJANGO_DEBUG=0."
    )

ALLOWED_HOSTS = [host for host in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host]


INSTALLED_APPS = [
    "daphne",
    "channels",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "accounts",
    "catalog",
    "orders",
    "notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },

        
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


RUNNING_TESTS = "test" in sys.argv
DB_ENGINE = os.getenv("DB_ENGINE", "sqlite").lower()
if RUNNING_TESTS:
    DB_ENGINE = os.getenv("TEST_DB_ENGINE", "sqlite").lower()

if DB_ENGINE == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("DB_NAME", "scrapay"),
            "USER": os.getenv("DB_USER", "root"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "3306"),
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}


CHANNEL_LAYER_BACKEND = os.getenv("CHANNEL_LAYER_BACKEND", "redis").lower()
if CHANNEL_LAYER_BACKEND == "inmemory":
    CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [
                    (
                        os.getenv("REDIS_HOST", "127.0.0.1"),
                        int(os.getenv("REDIS_PORT", "6379")),
                    )
                ]
            },
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


AUTH_USER_MODEL = "accounts.User"

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

EMAIL_BACKEND = os.getenv(
    "DJANGO_EMAIL_BACKEND",
    "django.core.mail.backends.locmem.EmailBackend" if RUNNING_TESTS else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
EMAIL_PORT = int(os.getenv("BREVO_SMTP_PORT", "587"))
EMAIL_HOST_USER = os.getenv("BREVO_SMTP_USERNAME", "")
EMAIL_HOST_PASSWORD = os.getenv("BREVO_SMTP_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("BREVO_SMTP_USE_TLS", "1") == "1"
EMAIL_USE_SSL = os.getenv("BREVO_SMTP_USE_SSL", "0") == "1"
DEFAULT_FROM_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "noreply@scrapay.local")
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

if DEBUG:
    # Dev-friendly: allow frontend from any localhost/127.0.0.1 port.
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        origin
        for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if origin
    ]
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "1") == "1"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", "1") == "1"
    SECURE_HSTS_PRELOAD = os.getenv("DJANGO_SECURE_HSTS_PRELOAD", "1") == "1"
    SECURE_REFERRER_POLICY = "same-origin"
    X_FRAME_OPTIONS = "DENY"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CSRF_TRUSTED_ORIGINS = [
    origin
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
    ).split(",")
    if origin
]
