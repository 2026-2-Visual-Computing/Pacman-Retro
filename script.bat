@echo off

rem "Init backend"
start "Backend" cmd /k "python -m backend.app"

rem "Init frontend"
start "Frontend" cmd /k "python -m http.server 8000 --directory frontend"

rem "Open frontend"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000"