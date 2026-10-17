@echo off
setlocal
cd /d %~dp0
echo ==================================
echo        N F T   T R A D E R
echo   http://localhost  (port 80)
echo ==================================

where node >nul 2>nul || (echo [!] Node.js yoq: https://nodejs.org LTS o'rnating & pause & exit /b 1)
where python >nul 2>nul || (echo [!] Python yoq: https://python.org - "Add to PATH" belgilab o'rnating & pause & exit /b 1)

if not exist node_modules (echo [1/4] npm install ... & call npm install --no-audit --no-fund)

if not exist backend\.venv (
  echo [2/4] Python muhit + paketlar + demo data ...
  python -m venv backend\.venv
  backend\.venv\Scripts\pip install -r backend\requirements.txt
  backend\.venv\Scripts\python backend\seed.py --demo --closed 70 --open 10
)

echo [3/4] Frontend build (dist/) ...
call npm run build

(echo VITE_API_URL=)>.env
echo [4/4] Sayt ishga tushmoqda (port 8000) ...
start "NFT-Trader" cmd /k "set API_PORT=8000&& backend\.venv\Scripts\python backend\main.py"
timeout /t 4 /nobreak >nul
start http://localhost:8000/

echo.
echo  SAYT    : http://localhost:8000/
echo  TELEFON : same Wi-Fi da  http://(PC IP):8000/   - IP: ipconfig
echo  TOXTASH : ochilgan qora oynani yopish
echo.
echo  [!] Port 8000 band bo'lsa: API_PORT=8080 qilib o'zgartiring
echo.
pause
