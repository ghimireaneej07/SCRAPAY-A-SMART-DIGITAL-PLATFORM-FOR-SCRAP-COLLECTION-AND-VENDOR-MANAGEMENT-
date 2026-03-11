# Scrapay

Scrapay is a full-stack scrap collection and vendor management platform built with Django REST Framework and React. It supports customer registration, vendor onboarding, order placement, admin operations, market rate management, and realtime notifications.

## Repository Structure

- `scrapay-backend/`: Django backend, REST APIs, authentication, orders, catalog, notifications
- `scrapay-frontend/`: React frontend built with Vite
- `manage.py`: root convenience wrapper for running backend Django commands through the project virtual environment
- `RUN_DEV.md`: local Windows development guide
- `start-dev.ps1`, `stop-dev.ps1`: optional PowerShell helpers for starting and stopping frontend and backend together

## Core Features

- JWT-based authentication for user, vendor, and admin roles
- Scrap category and market rate catalog
- User pickup order flow with vendor selection
- Vendor order queue and order lifecycle actions
- Admin dashboard for vendor review, account management, and operational oversight
- Notification APIs with websocket support

## Quick Start

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r .\scrapay-backend\requirements.txt
Copy-Item .\scrapay-backend\.env.example .\scrapay-backend\.env
python manage.py migrate
python manage.py runserver
```

### Frontend

```powershell
npm --prefix .\scrapay-frontend install
Set-Content -Path .\scrapay-frontend\.env -Value "VITE_API_BASE_URL=http://localhost:8000/api"
npm run dev
```

## Development Notes

- Backend configuration uses MySQL when `DB_ENGINE=mysql` is set and falls back to sqlite for local tests and simpler setup.
- `.env` files, sqlite databases, logs, caches, build output, and local process state are excluded from Git.
- Use [RUN_DEV.md](RUN_DEV.md) for the Windows-focused local development workflow.

## Existing Documentation

- [Backend README](scrapay-backend/README.md)
- [Frontend README](scrapay-frontend/README.md)
- [Run Guide](RUN_DEV.md)
