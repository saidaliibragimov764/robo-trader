"""Paper-trading dvigatel — live executor ulanganchoq asosiy 'savdo' mantiqi.

Har SCAN_INTERVAL_SEC da:
  1. Barcha collection'lar floor narxini oladi (FLOOR_PROVIDER)
  2. Ochiq pozitsiyalarning current_price_ton'ini yangilaydi
  3. min_profit chegara + min_hold -> pozitsiyani VIRUAL yopadi (profit hisoblanadi)
  4. Bo'sh 'slot'lar va signal bo'yicha virual OPEN (source='scan')

BOT_MODE=live bo'lganda executor.execute_buy/sell chaqiriladi (hozirca NotImplementedError).
"""
from __future__ import annotations

import asyncio
import random
from datetime import datetime, timedelta, timezone

import db
from config import settings
from markets.getgems import make_provider

RUNNING = False  # api.py /api/bot/status shu flanni ko'rsatadi


def _hours_since(iso_str: str | None) -> float:
    if not iso_str:
        return 9e9
    try:
        d = datetime.fromisoformat(iso_str)
    except ValueError:
        return 9e9
    return (datetime.now(timezone.utc) - d).total_seconds() / 3600


async def _maybe_open_new(floors: dict[str, float]) -> None:
    open_list = db.open_trades()
    slots = settings.max_open_positions - len(open_list)
    held = {t["nft_address"] for t in open_list}
    # Har siklda ko'pi bilan 1-2 ta kirish (spam bo'lmasin)
    candidates = [c for c, f in floors.items() if c in settings.allowed_collections and f <= settings.max_buy_price_ton]
    if not candidates or slots <= 0:
        return
    if random.random() < 0.45:  # har skan savdo ochmaydi — bozor sekin
        return
    coll = random.choice(candidates)
    floor = floors[coll]
    price = round(floor * random.uniform(0.95, 1.0), 3)  # "flip uchun arzon listing"
    if price > settings.max_buy_price_ton:
        return
    token_id = random.randint(100, 9999)
    addr = f"EQ{random.getrandbits(160):040x}"
    if addr in held:
        return
    db.insert_trade(
        nft_address=addr,
        nft_name=f"{coll} #{token_id}",
        collection=coll,
        buy_price_ton=price,
        marketplace="getgems",
        source="scan",
        marketplace_url=f"https://getgems.io/collection/{coll.lower().replace(' ', '-')}/{token_id}",
    )


async def scan_once(provider) -> int:
    floors = await provider.floors()
    db.set_meta("last_scan_at", db.now_iso())
    closed = 0
    for t in db.open_trades():
        price = floors.get(t["collection"]) or t["buy_price_ton"]
        db.update_trade(t["id"], current_price_ton=price)
        buy = t["buy_price_ton"] or 0
        if buy <= 0:
            continue
        pct = (price - buy) / buy * 100
        if pct >= settings.min_profit_percent and _hours_since(t["bought_at"]) >= settings.min_hold_hours:
            db.close_trade(t["id"], price)
            closed += 1
    return closed


async def scanner_loop(stop: asyncio.Event) -> None:
    global RUNNING
    provider = make_provider(settings.floor_provider, settings.allowed_collections)
    RUNNING = True
    try:
        while not stop.is_set():
            try:
                await scan_once(provider)
                await _maybe_open_new(await provider.floors())
            except Exception as e:  # noqa: BLE001 — bot o'lib qolmasligi kerak
                print(f"[engine] xato: {e}")
            try:
                await asyncio.wait_for(stop.wait(), timeout=settings.scan_interval_sec)
            except asyncio.TimeoutError:
                pass
    finally:
        RUNNING = False


# ---------------------------------------------------------------
# Signal -> pozitsiya ochish (userbot.py bu funksiyani chaqiradi)
# ---------------------------------------------------------------

async def handle_signal(collection: str, floor_ton: float | None, text: str,
                        channel: str = "", message_id: int | None = None) -> dict | None:
    sig_id = db.record_signal(channel=channel, message_id=message_id, text=text[:400],
                              collection=collection, floor_ton=floor_ton)
    if settings.mode == "signal":
        return None  # faqat log
    if collection not in settings.allowed_collections:
        return None
    price = floor_ton or 0.0
    if price <= 0 or price > settings.max_buy_price_ton:
        return None
    if len(db.open_trades()) >= settings.max_open_positions:
        return None

    if settings.mode == "live":
        raise NotImplementedError(
            "Live buy hali yoqilmagan: markets/live_executor.py ni TON wallet bilan to'ldiring"
        )

    token_id = random.randint(100, 9999)
    trade = db.insert_trade(
        nft_address=f"EQ{random.getrandbits(160):040x}",
        nft_name=f"{collection} #{token_id}",
        collection=collection,
        buy_price_ton=round(price, 3),
        marketplace="getgems",
        source="signal",
        marketplace_url=f"https://getgems.io/collection/{collection.lower().replace(' ', '-')}/{token_id}",
    )
    db.conn().execute("UPDATE signals SET handled=1 WHERE id=?", (sig_id,))
    db.conn().commit()
    return trade
