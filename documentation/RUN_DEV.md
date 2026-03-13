# Run Frontend + Backend (Windows PowerShell)

## First-time setup (only once)
```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r .\scrapay-backend\requirements.txt
npm --prefix .\scrapay-frontend install
```

## Daily run (two commands, from project root)
```powershell
python manage.py runserver
npm run dev
```

## URLs after start
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Optional: managed start/stop scripts
```powershell
.\start-dev.ps1 -Force
.\stop-dev.ps1
```

## If startup fails
1. Check ports:
```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 8000,5173 }
```
2. If occupied, stop the process IDs shown:
```powershell
Stop-Process -Id <PID> -Force
```
3. Start again with the two standard commands:
```powershell
python manage.py runserver
npm run dev
```
