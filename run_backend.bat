@echo off
title Kabadiwala Connect AI - Backend Server
echo ========================================================
echo   Starting Kabadiwala Connect AI - FastAPI Backend API
echo   URL: http://localhost:8000 (Swagger Docs: /docs)
echo ========================================================
cd /d "%~dp0backend"

echo Checking database seed data...
python seed_data.py

echo Starting Uvicorn server on port 8000...
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
