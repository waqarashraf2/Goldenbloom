@echo off
title Golden Bloom CRM - Startup Launcher
echo ========================================================
echo        GOLDEN BLOOM CRM - LAUNCHING SYSTEM
echo ========================================================
echo.

echo [1/2] Starting Laravel Backend API on http://127.0.0.1:8000 ...
start "Golden Bloom CRM Backend" cmd /k "cd /d C:\xampp\htdocs\Clients Projects\goldenbloom\backend && php artisan serve --port=8000"

echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
start "Golden Bloom CRM Frontend" cmd /k "cd /d C:\xampp\htdocs\Clients Projects\goldenbloom\frontend && npm run dev"

timeout /t 3 >nul
echo.
echo Opening Golden Bloom CRM in your browser...
start http://localhost:3000

echo ========================================================
echo Golden Bloom CRM is now running!
echo Backend:  http://127.0.0.1:8000/api
echo Frontend: http://localhost:3000
echo ========================================================
pause
