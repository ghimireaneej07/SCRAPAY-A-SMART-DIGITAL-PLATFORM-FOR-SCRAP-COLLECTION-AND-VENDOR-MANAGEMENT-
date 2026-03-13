# Scrapay

Scrapay is a full-stack scrap collection and vendor management platform built with Django REST Framework and React. It supports customer registration, vendor onboarding, order placement, admin operations, market rate management, and realtime notifications.

## Repository Structure

- `scrapay-backend/`: Django backend, REST APIs, authentication, orders, catalog, notifications
- `scrapay-frontend/`: React frontend built with Vite
- `manage.py`: root convenience wrapper for running backend Django commands through the project virtual environment
- `documentation/`: project guides, implementation reports, and integration notes
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

Backend env notes:
- Set `DB_ENGINE=mysql` and your XAMPP MySQL credentials in `scrapay-backend/.env` for local MySQL usage.
- Add your Brevo SMTP credentials to `BREVO_SMTP_*` variables before testing OTP or approval emails.

### Frontend

```powershell
npm --prefix .\scrapay-frontend install
Set-Content -Path .\scrapay-frontend\.env -Value "VITE_API_BASE_URL=http://localhost:8000/api"
npm run dev
```

Frontend notes:
- The frontend now uses global `Poppins` typography from Google Fonts.
- Signup uses email OTP verification.
- User and vendor login use password authentication.
- Forgot password uses email OTP.
- Admin login uses password plus email OTP.

## Development Notes

- Backend configuration uses MySQL when `DB_ENGINE=mysql` is set and falls back to sqlite for local tests and simpler setup.
- `.env` files, sqlite databases, logs, caches, build output, and local process state are excluded from Git.
- Use [documentation/RUN_DEV.md](documentation/RUN_DEV.md) for the Windows-focused local development workflow.

## Existing Documentation

- [Backend README](scrapay-backend/README.md)
- [Frontend README](scrapay-frontend/README.md)
- [Documentation Index](documentation/README.md)
- [Run Guide](documentation/RUN_DEV.md)
