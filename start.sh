#!/usr/bin/env bash
# NFT Trader — PC (Linux/macOS) va VPS uchun bir-bosish ishga tushirish.
# Ishlatish:  ./start.sh
set -e
cd "$(dirname "$0")"

command -v node   >/dev/null || { echo "[!] Node.js kerak: https://nodejs.org"; exit 1; }
command -v python3 >/dev/null || { echo "[!] Python3 kerak"; exit 1; }

[ -d node_modules ] || { echo "[1/3] npm install ..."; npm install --no-audit --no-fund; }

if [ ! -d backend/.venv ]; then
  echo "[2/3] Python muhit + paketlar + demo data ..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -q -r backend/requirements.txt
  backend/.venv/bin/python backend/seed.py --demo --closed 70 --open 10
fi

echo "VITE_API_URL=" > .env   # nisbiy /api -> vite proxy (telefonda ham ishlaydi)
echo "[3/3] Serverlar..."

backend/.venv/bin/python backend/main.py &
BACK_PID=$!
VITE_API_URL= npx vite --host 0.0.0.0 --port 5173 &
SITE_PID=$!
[ -x ./cloudflared ] && ./cloudflared tunnel --url http://localhost:5173 &

echo ""
echo "  LOCAL  : http://localhost:5173"
echo "  TELEFON: http://$(hostname -I 2>/dev/null | awk '{print $1}'):5173 (LAN)"
echo "  To'xtash: Ctrl+C"
trap "kill $BACK_PID $SITE_PID 2>/dev/null; exit" INT TERM
wait
