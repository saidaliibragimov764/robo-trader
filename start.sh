#!/usr/bin/env bash
# NFT Trader — bitta buyruqda to'liq sayt: http://localhost/ (yoki VPS IP)
# Ishlatish:  ./start.sh          (port 80 uchun root/sudo kerak bo'lishi mumkin)
#              API_PORT=8080 ./start.sh   (agar 80 band/taqiqlangan bo'lsa)
set -e
cd "$(dirname "$0")"

command -v node    >/dev/null || { echo "[!] Node.js kerak: https://nodejs.org"; exit 1; }
command -v python3 >/dev/null || { echo "[!] Python3 kerak"; exit 1; }

[ -d node_modules ] || { echo "[1/4] npm install ..."; npm install --no-audit --no-fund; }

if [ ! -d backend/.venv ]; then
  echo "[2/4] Python muhit + paketlar + demo data ..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -q -r backend/requirements.txt
  backend/.venv/bin/python backend/seed.py --demo --closed 70 --open 10
fi

echo "[3/4] Frontend build (dist/) ..."
npm run build

echo "VITE_API_URL=" > .env   # sayt va API bitta manzilda (/api avtomatik shu serverga)
PORT="${API_PORT:-8000}"
echo "[4/4] SAYT: http://localhost:$PORT/  (to'xtash: Ctrl+C)"
echo "      Telefon (LAN): http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo "<IP>"):${PORT}/"
API_PORT="$PORT" exec backend/.venv/bin/python backend/main.py
