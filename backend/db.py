"""SQLite qatlami — userbot yozadi, FastAPI o'qiydi (bitta jarayon, WAL rejimi).

Barcha vaqtlar UTC ISO string: '2026-09-15T00:00:00+00:00' (browser new Date() uchun xavfsiz).
"""
from __future__ import annotations

import os
import sqlite3
import threading
from datetime import datetime, timedelta, timezone

from config import settings

_LOCK = threading.Lock()
_CONN: sqlite3.Connection | None = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS trades (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nft_address      TEXT,
  nft_name         TEXT NOT NULL,
  collection       TEXT NOT NULL,
  buy_price_ton    REAL NOT NULL,
  sell_price_ton   REAL,
  current_price_ton REAL,
  profit_ton       REAL,
  profit_percent   REAL,
  marketplace      TEXT DEFAULT 'getgems',
  status           TEXT DEFAULT 'open',          -- open | closed
  source           TEXT DEFAULT 'signal',        -- signal | scan | manual | api
  tx_buy           TEXT,
  tx_sell          TEXT,
  marketplace_url  TEXT,
  bought_at        TEXT,
  sold_at          TEXT,
  updated_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_trades_status     ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_collection ON trades(collection);
CREATE INDEX IF NOT EXISTS idx_trades_sold_at    ON trades(sold_at);

CREATE TABLE IF NOT EXISTS signals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  channel     TEXT,
  message_id  INTEGER,
  text        TEXT,
  collection  TEXT,
  floor_ton   REAL,
  received_at TEXT,
  handled     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS manual_holdings (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nft_address       TEXT,
  nft_name          TEXT NOT NULL,
  collection        TEXT NOT NULL,
  buy_price_ton     REAL,
  current_value_ton REAL,
  quantity          INTEGER DEFAULT 1,
  marketplace_url   TEXT,
  acquired_at       TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def conn() -> sqlite3.Connection:
    global _CONN
    if _CONN is None:
        os.makedirs(os.path.dirname(settings.db_path), exist_ok=True)
        _CONN = sqlite3.connect(settings.db_path, check_same_thread=False, timeout=15)
        _CONN.row_factory = sqlite3.Row
        _CONN.execute("PRAGMA journal_mode=WAL")
        _CONN.execute("PRAGMA synchronous=NORMAL")
    return _CONN


def init() -> None:
    with _LOCK:
        conn().executescript(SCHEMA)
        conn().commit()


def set_meta(key: str, value: str) -> None:
    with _LOCK:
        conn().execute(
            "INSERT INTO meta(key,value) VALUES(?,?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value),
        )
        conn().commit()


def get_meta(key: str, default: str = "") -> str:
    row = conn().execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
    return row["value"] if row else default


_TRADE_FIELDS = [
    "id", "nft_address", "nft_name", "collection", "buy_price_ton", "sell_price_ton",
    "current_price_ton", "profit_ton", "profit_percent", "marketplace", "status",
    "source", "tx_buy", "tx_sell", "marketplace_url", "bought_at", "sold_at", "updated_at",
]


def _trade_dict(row: sqlite3.Row) -> dict:
    return {k: row[k] for k in _TRADE_FIELDS if k in row.keys()}


def insert_trade(**t) -> dict:
    """Yangi pozitsiya ochish. Kalit maydonlarni to'ldirib beramiz."""
    t.setdefault("status", "open")
    t.setdefault("bought_at", now_iso())
    t["updated_at"] = now_iso()
    if t.get("buy_price_ton") is not None and t.get("current_price_ton") is None:
        t["current_price_ton"] = t["buy_price_ton"]
    cols = [k for k in t if k in _TRADE_FIELDS]
    with _LOCK:
        cur = conn().execute(
            f"INSERT INTO trades ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})",
            [t[k] for k in cols],
        )
        conn().commit()
        row = conn().execute("SELECT * FROM trades WHERE id=?", (cur.lastrowid,)).fetchone()
    return _trade_dict(row)


def close_trade(trade_id: int, sell_price: float, tx_sell: str | None = None) -> dict | None:
    """Pozitsiyani yopish — foydani avtomatik hisoblaymiz."""
    row = conn().execute("SELECT * FROM trades WHERE id=?", (trade_id,)).fetchone()
    if not row or row["status"] != "open":
        return None
    buy = row["buy_price_ton"] or 0.0
    profit = round(sell_price - buy, 4)
    pct = round((profit / buy * 100), 2) if buy else 0.0
    with _LOCK:
        conn().execute(
            "UPDATE trades SET status='closed', sell_price_ton=?, profit_ton=?, profit_percent=?, "
            "sold_at=?, updated_at=?, tx_sell=COALESCE(?, tx_sell) WHERE id=?",
            (sell_price, profit, pct, now_iso(), now_iso(), tx_sell, trade_id),
        )
        conn().commit()
        row = conn().execute("SELECT * FROM trades WHERE id=?", (trade_id,)).fetchone()
    return _trade_dict(row)


def update_trade(trade_id: int, **fields) -> dict | None:
    fields = {k: v for k, v in fields.items() if k in _TRADE_FIELDS and k != "id"}
    if not fields:
        return None
    fields["updated_at"] = now_iso()
    sets = ",".join(f"{k}=?" for k in fields)
    with _LOCK:
        conn().execute(f"UPDATE trades SET {sets} WHERE id=?", [*fields.values(), trade_id])
        conn().commit()
    return get_trade(trade_id)


def get_trade(trade_id: int) -> dict | None:
    row = conn().execute("SELECT * FROM trades WHERE id=?", (trade_id,)).fetchone()
    return _trade_dict(row) if row else None


def query_trades(status: str | None = None, collection: str | None = None,
                 limit: int = 50, offset: int = 0) -> tuple[list[dict], int]:
    where, args = [], []
    if status:
        where.append("status=?")
        args.append(status)
    if collection:
        where.append("collection=?")
        args.append(collection)
    w = ("WHERE " + " AND ".join(where)) if where else ""
    total = conn().execute(f"SELECT COUNT(*) c FROM trades {w}", args).fetchone()["c"]
    rows = conn().execute(
        f"SELECT * FROM trades {w} ORDER BY COALESCE(sold_at, bought_at) DESC LIMIT ? OFFSET ?",
        [*args, limit, offset],
    ).fetchall()
    return [_trade_dict(r) for r in rows], total


def open_trades() -> list[dict]:
    rows = conn().execute(
        "SELECT * FROM trades WHERE status='open' ORDER BY bought_at ASC"
    ).fetchall()
    return [_trade_dict(r) for r in rows]


def record_signal(**s) -> int:
    s.setdefault("received_at", now_iso())
    cols = [k for k in ("channel", "message_id", "text", "collection", "floor_ton", "received_at") if k in s]
    with _LOCK:
        cur = conn().execute(
            f"INSERT INTO signals ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})",
            [s[k] for k in cols],
        )
        conn().commit()
        return int(cur.lastrowid)


def portfolio_manual() -> list[dict]:
    rows = conn().execute("SELECT * FROM manual_holdings ORDER BY id").fetchall()
    return [dict(r) for r in rows]


# ------------------------------------------------------------------
# Aggregatsiyalar (dashboard endpointlari shu yerdan oladi)
# ------------------------------------------------------------------

def summary() -> dict:
    c = conn()
    closed = c.execute(
        "SELECT COUNT(*) n, COALESCE(SUM(profit_ton),0) p, "
        "SUM(CASE WHEN profit_ton>0 THEN 1 ELSE 0 END) w, "
        "COALESCE(AVG(profit_percent),0) ap, COALESCE(MAX(profit_ton),0) best, "
        "COALESCE(MIN(profit_ton),0) worst FROM trades WHERE status='closed'"
    ).fetchone()
    open_n = c.execute("SELECT COUNT(*) n FROM trades WHERE status='open'").fetchone()["n"]

    def period(days: float) -> float:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
        r = c.execute(
            "SELECT COALESCE(SUM(profit_ton),0) p FROM trades WHERE status='closed' AND sold_at>=?",
            (since,),
        ).fetchone()
        return round(r["p"], 2)

    n = max(1, closed["n"])
    return {
        "total_profit_ton": round(closed["p"], 2),
        "total_trades": closed["n"],
        "open_trades": open_n,
        "win_rate": round((closed["w"] or 0) / n * 100, 1),
        "avg_profit_percent": round(closed["ap"], 2),
        "best_trade_profit": round(closed["best"], 2),
        "worst_trade_profit": round(closed["worst"], 2),
        "current_balance_ton": settings.wallet_balance_ton,
        "period_profits": {"day": period(1), "week": period(7), "month": period(30)},
    }


def collections_stats() -> list[dict]:
    rows = conn().execute(
        "SELECT collection, COUNT(*) trades, "
        "SUM(CASE WHEN profit_ton>0 THEN 1 ELSE 0 END) wins, "
        "COALESCE(SUM(profit_ton),0) total_profit, COALESCE(AVG(profit_ton),0) avg_profit "
        "FROM trades WHERE status='closed' GROUP BY collection "
        "ORDER BY total_profit DESC"
    ).fetchall()
    return [
        {
            "collection": r["collection"],
            "trades": r["trades"],
            "wins": r["wins"] or 0,
            "win_rate": round((r["wins"] or 0) / r["trades"] * 100, 1),
            "total_profit_ton": round(r["total_profit"], 2),
            "avg_profit_ton": round(r["avg_profit"], 3),
        }
        for r in rows
    ]


def pnl(period: str) -> dict:
    """Kunlik (year uchun oylik) bucket'lar."""
    span_days = {"day": 14, "week": 56, "month": 90}.get(period, 365)
    bucket = 30 if period == "year" else 1
    since = (datetime.now(timezone.utc) - timedelta(days=span_days)).date()
    rows = conn().execute(
        "SELECT sold_at, profit_ton FROM trades WHERE status='closed' AND sold_at>=?",
        (since.isoformat(),),
    ).fetchall()

    points_map: dict[str, tuple[float, int]] = {}
    for r in rows:
        d = datetime.fromisoformat(r["sold_at"]).date()
        key = (d - timedelta(days=(d - since).days % bucket)).isoformat()
        p, n = points_map.get(key, (0.0, 0))
        points_map[key] = (p + (r["profit_ton"] or 0.0), n + 1)

    points = [
        {"date": f"{key}T00:00:00+00:00", "profit_ton": round(p, 4), "trades_count": n}
        for key, (p, n) in sorted(points_map.items())
    ]
    if not points:
        today = datetime.now(timezone.utc).date().isoformat()
        points = [{"date": f"{today}T00:00:00+00:00", "profit_ton": 0.0, "trades_count": 0}]
    return {"points": points, "total": round(sum(p["profit_ton"] for p in points), 4)}
