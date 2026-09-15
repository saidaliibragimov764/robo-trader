# NFT Trader — Telegram Mini App (frontend)

Python NFT trading userbotingiz natijalarini Telegram ichida ko'rish uchun **faqat ko'rsatuvchi** dashboard.
Savdo qilmaydi — botning o'zi Python backendda (FastAPI :8765).

## 🚀 Ishga tushirish

```bash
npm install
npm run dev            # http://localhost:5173
```

Backend yo'q bo'lsa, dev uchun mock API ni ishga tushiring:

```bash
python3 mock-server/server.py   # http://localhost:8765 (fake, lekin real kontrakt bo'yicha)
```

## ⚙️ Konfiguratsiya (`.env`)

| Vars | Default | Izoh |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8765` | FastAPI bazasi. **Bo'sh qoldirsangiz** frontend nisbiy `/api` ga yuboradi va Vite proxy uni `127.0.0.1:8765` ga o'tkazadi (CORS/mixed-content yo'qoladi — Telegram HTTPS ichida shu rejim tavsiya etiladi). |
| `VITE_USERBOT_CONFIG_URL` | — | Settings'dagi "Open Userbot Config" tugmasi havolasi (VPS panel/Portainer va h.k.) |

VPS'da: frontend build'ini nginx ortida servis qilsangiz, `location /api/ { proxy_pass http://127.0.0.1:8765; }` yetarli — `VITE_API_URL` bo'sh qolsa hammasi avtomatik ishlaydi.

## 🧱 Tuzilma

```
src/
  lib/api.ts          # barcha API chaqiruvlar (timeout, error, normalize)
  lib/format.ts       # TON/%/sana formatterlari
  lib/telegram.ts     # @twa-dev/sdk: expand, themeColors -> CSS vars, openLink
  hooks/useApi.ts     # useSummary/useTrades/usePnl/useBotStatus/... (TanStack Query, 30s refresh)
  pages/              # Dashboard, Portfolio, History, Settings
  components/         # KPICard, PnLChart, TradeRow, CollectionBadge, ui.tsx (skeleton/empty/error)
backend/              # Python: userbot + FastAPI + SQLite (dashboard ma'lumot manbai)
  config.py           # barcha sozlamalar backend/.env dan
  db.py               # SQLite (WAL): trades/signals/manual_holdings + aggregatsiyalar
  api.py              # FastAPI :8765 — frontend kontrakti + /api/ingest (token bilan)
  main.py             # yagona process: API + scanner + (TG bo'lsa) userbot
  userbot.py          # Telethon: SIGNAL_CHANNELS tinglash, parse -> engine.handle_signal
  engine.py           # paper-trading: floor skan, virual open/close, unrealized P&L
  markets/getgems.py  # floor provider: FLOOR_PROVIDER=sim|getgems
  seed.py             # demo/test tarixi (python3 backend/seed.py --demo)
  Dockerfile
mock-server/server.py # frontend-only dev uchun fake (backend yo'q bo'lsa)
```

## 🤖 Backend (userbot + API) ni ishga tushirish

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env      # TG_API_ID/HASH, SIGNAL_CHANNELS, INGEST_TOKEN...
python3 backend/main.py                   # :8765 — dashboard shu bilan to'liq jonli ishlaydi

# demo tarix (ixtiyoriy):
python3 backend/seed.py --demo --closed 70 --open 8
```

**Rejimlar** (`BOT_MODE`): `signal` — signallar faqat DB'ga yoziladi; `paper` — virual
savdo (floor skaner, min-profit bilan avto-close) — dashboard real data bilan; `live` —
on-chain savdo (wallet executor hali yozilmoqda, interface tayyor).

**Telegram'siz ham ishlaydi**: TG_API_ID bo'lmasa scanner+API+dashboard o'zi yuklanadi.

🔐 **Xavfsizlik**: `backend/.env` (session, api_hash, keylar) gitignore'da — hech qachon
chatlarga/repo'larga tashlamang. Userbot Telegram akkountingiz nomidan ishlaydi:
burner (alohida) akkounta yurgizgani xavfsizroq — spam-ban xavfi bor.

## 📡 API kontrakti (kutiladigan)

- `GET /api/summary` · `GET /api/trades?limit&offset&status=open|closed&collection`
- `GET /api/trades/open` · `GET /api/pnl?period=day|week|month|year`
- `GET /api/portfolio` · `GET /api/bot/status` · `GET /api/collections`

Frontend `trades`/`portfolio` javoblarini ham oddiy **array**, ham `{trades:[...]}` ko'rinishida qabul qiladi — ikkalasi ham ishlaydi.

## 🎨 Dizayn

Qora `#0a0e13` fon + neon cyan `#22d3ee`, yashil/qizil P&L ranglari, glassmorphism kartalar, `tabular-nums` sonlar. Telegram Dark tema ranglari (`themeParams`) aniqlansa — fon/aksent moslashadi.

## ✅ Build / Deploy

```bash
npm run build     # dist/
```

`dist/` ni istalgan statik serverga (nginx, Cloudflare Pages...) tashlang va BotFather → `/newapp` orqali Mini App URL ga ulang.
