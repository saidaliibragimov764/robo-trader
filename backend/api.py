"""FastAPI server — NFT Trader Mini App dashboard API (frontend shu kontraktni kutadi).

O'qish endpointlari ochiq (CORS *), yozish endpointlari INGEST_TOKEN bilan himoyalangan
(userbot/external yozuvlar uchun).

GET  /api/summary | /api/trades | /api/trades/open | /api/pnl | /api/portfolio
GET  /api/bot/status | /api/collections
POST /api/ingest/trade            (yangi savdo yozish — token kerak)
POST /api/ingest/trade/close      (yopish — token kerak)
POST /api/ingest/signal           (signal logi — token kerak)

REZHIM "sayt + API bitta serverda":
    npm run build  ->  dist/  paydo bo'lsa, FastAPI uni ham serv qiladi:
    http://localhost/  = butun sayt (port 80'da), /api/* = ma'lumotlar.
    Alohida Vite/nginx kerak emas.
"""
from __future__ import annotations

import os
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import db
from config import settings

DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")

app = FastAPI(title="robo-trader API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_token(x_ingest_token: str | None = Header(default=None)):
    if not settings.ingest_token:
        raise HTTPException(403, "INGEST_TOKEN sozlanmagan — yozishlar o'chirilgan")
    if x_ingest_token != settings.ingest_token:
        raise HTTPException(401, "Noto'g'ri INGEST_TOKEN")


@app.get("/api/summary")
def summary():
    return db.summary()


@app.get("/api/trades")
def trades(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status: Literal["open", "closed"] | None = None,
    collection: str | None = None,
):
    rows, total = db.query_trades(status=status, collection=collection, limit=limit, offset=offset)
    return {"trades": rows, "total": total}


@app.get("/api/trades/open")
def trades_open(collection: str | None = None):
    rows, total = db.query_trades(status="open", collection=collection, limit=500, offset=0)
    return {"trades": rows, "total": total}


@app.get("/api/pnl")
def pnl(period: Literal["day", "week", "month", "year"] = "month"):
    return db.pnl(period)


@app.get("/api/portfolio")
def portfolio():
    return db.portfolio_manual()


@app.get("/api/bot/status")
def bot_status():
    import engine

    return {
        "is_running": engine.RUNNING,
        "allowed_collections": settings.allowed_collections,
        "max_buy_price_ton": settings.max_buy_price_ton,
        "min_profit_percent": settings.min_profit_percent,
        "last_scan_at": db.get_meta("last_scan_at") or None,
        "marketplaces_enabled": settings.marketplaces,
    }


@app.get("/api/collections")
def collections():
    return db.collections_stats()


# ------------------------------------------------------------------
# Ingest: userbot -> DB (kelajakda live trader shu API orqali yozadi)
# ------------------------------------------------------------------

class TradeIn(BaseModel):
    nft_name: str
    collection: str
    buy_price_ton: float = Field(gt=0)
    nft_address: str | None = None
    marketplace: str = "getgems"
    marketplace_url: str | None = None
    tx_buy: str | None = None
    bought_at: str | None = None
    source: str = "api"


class TradeCloseIn(BaseModel):
    trade_id: int
    sell_price_ton: float = Field(gt=0)
    tx_sell: str | None = None
    sold_at: str | None = None


class SignalIn(BaseModel):
    channel: str | None = None
    message_id: int | None = None
    text: str = ""
    collection: str | None = None
    floor_ton: float | None = None


@app.post("/api/ingest/trade", dependencies=[Depends(require_token)])
def ingest_trade(body: TradeIn):
    t = body.model_dump(exclude_none=True)
    return db.insert_trade(**t)


@app.post("/api/ingest/trade/close", dependencies=[Depends(require_token)])
def ingest_close(body: TradeCloseIn):
    row = db.close_trade(body.trade_id, body.sell_price_ton, tx_sell=body.tx_sell)
    if not row:
        raise HTTPException(404, "Ochiq trade topilmadi")
    return row


@app.post("/api/ingest/signal", dependencies=[Depends(require_token)])
def ingest_signal(body: SignalIn):
    sig_id = db.record_signal(**body.model_dump(exclude_none=True))
    return {"id": sig_id}


@app.get("/health")
def health():
    return {"ok": True, "mode": settings.mode}


# ------------------------------------------------------------------
# Statik sayt: dist/ mavjud bo'lsa, frontend'ni ham shu server beradi
# (http://localhost/ — Vite/nginx shart emas). Catch-all ENG OXIRDA bo'lishi shart.
# ------------------------------------------------------------------
if os.path.isdir(DIST_DIR):
    _assets = os.path.join(DIST_DIR, "assets")
    if os.path.isdir(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        if full_path.startswith(("api/", "assets/")) or full_path in ("health", "docs", "openapi.json"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = os.path.normpath(os.path.join(DIST_DIR, full_path))
        if full_path and candidate.startswith(DIST_DIR) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
