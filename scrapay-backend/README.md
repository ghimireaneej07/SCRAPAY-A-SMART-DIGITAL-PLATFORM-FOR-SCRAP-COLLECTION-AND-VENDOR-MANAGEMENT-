# Scrapay Backend

## Stack
- Django + Django REST Framework
- JWT auth (`djangorestframework-simplejwt`)
- MySQL (XAMPP) ready config, sqlite fallback
- Realtime events via Django Channels (Redis or in-memory channel layer)

## Setup (XAMPP MySQL)
```powershell
cd scrapay-backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` for XAMPP:
- `DB_ENGINE=mysql`
- `DB_NAME=scrapay_db` (or your chosen DB)
- `DB_USER=root`
- `DB_PASSWORD=` (default empty in XAMPP)
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `CHANNEL_LAYER_BACKEND=inmemory` (if Redis is not running)

Then run:
```powershell
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py createsuperuser
.\.venv\Scripts\python manage.py runserver
```

## API Base
- `api/auth/`
- `api/catalog/`
- `api/orders/`
- `api/notifications/`

## Realtime
- WebSocket endpoint: `ws/events/?token=<access_token>`
