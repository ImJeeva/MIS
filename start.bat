@echo off
title MIS - Chest X-ray Platform
cd /d "%~dp0"

echo Checking setup...
node scripts\setup.mjs
if errorlevel 1 (
  echo.
  echo Setup hit a problem - see the messages above.
  pause
  exit /b 1
)

echo.
echo Starting MIS (server + client + AI service)...
echo Do not close this window while using the app.
echo.

start "MIS" cmd /k "npm run dev"

echo Waiting for the app to boot...
timeout /t 12 /nobreak >nul

start "" "http://localhost:5173"
