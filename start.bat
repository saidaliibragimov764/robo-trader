@echo off
setlocal
cd /d %~dp0
echo ==================================
echo        N F T   T R A D E R
echo ==================================

where node >nul 2>nul || (echo [!] Node.js yoq: https://nodejs.org LTS o'rnating & pause & exit /b 1)
where python >nul 2>nul || (echo [!] Python yoq: https://python.org - "Add to PATH" belgilab o'rnating & pause & exit /b 1)

if not exist node_modules (echo [1/3] npm install ... & call npm install --no-audit --no-fund)

if not exist backend\.venv (
  echo [2/3] Python muhit + paketlar + demo data ...
  python -m venv backend\.venv
  backend\.venv\Scripts\pip install -r backend\requirements.txt
  backend\.venv\Scripts\python backend\seed.py --demo --closed 70 --open 10
)

(echo VITE_API_URL=)>.env
echo [3/3] Serverlar ishga tushmoqda ...
start "NFT-Trader-API" cmd /k "backend\.venv\Scripts\python backend\main.py"
start "NFT-Trader-SITE" cmd /k "npx vite --host 0.0.0.0 --port 5173"
if exist cloudflared.exe start "NFT-Trader-TUNNEL" cmd /k ".\cloudflared.exe tunnel --url http://localhost:5173"
timeout /t 6 /nobreak >nul
start http://localhost:5173
echo.
echo  LOCAL  : http://localhost:5173
echo  TELEFON: same Wi-Fi da http://(PC IP):5173  - IP: ipconfig
echo  TOXTASH: ochilgan qora oynalarni yopish
echo.
pause
