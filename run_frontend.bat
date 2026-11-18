@echo off
title Kabadiwala Connect AI - Frontend Web App
echo ========================================================
echo   Starting Kabadiwala Connect AI - React Vite Frontend
echo   URL: http://localhost:5173
echo ========================================================
cd /d "%~dp0frontend"

echo Launching frontend server...
call pnpm dev
pause
