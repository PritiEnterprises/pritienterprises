@echo off
title Priti Enterprises
cd /d "%~dp0"
echo.
echo  Starting Priti Enterprises on http://localhost:3002
echo  Keep this window open. Press Ctrl+C to stop.
echo.
npm run dev
pause
