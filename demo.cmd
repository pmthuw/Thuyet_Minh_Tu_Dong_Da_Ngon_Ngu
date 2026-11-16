@echo off
cd /d "%~dp0"
docker compose -f compose.yaml -f compose.admin.yaml up -d
if errorlevel 1 (
    pause
    exit /b 1
)
start "AURALIS Frontend" cmd /k "npm run dev -- --open /admin"
start "AURALIS QR" cmd /k "ngrok http http://127.0.0.1:5180 --host-header=rewrite"