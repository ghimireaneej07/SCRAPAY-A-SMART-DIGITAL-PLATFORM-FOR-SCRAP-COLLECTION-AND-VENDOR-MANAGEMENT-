# Scrapay Backend

## Stack
- Django + Django REST Framework
- JWT auth (`djangorestframework-simplejwt`)
- MySQL-ready DB config (with sqlite fallback for local bootstrap)
- Realtime events via Django Channels + Redis

## Setup
```powershell
cd scrapay-backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python manage.py makemigrations
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver
```

## API Base
- `api/auth/`
- `api/catalog/`
- `api/orders/`
- `api/notifications/`

## Realtime
- WebSocket endpoint: `ws/events/`
