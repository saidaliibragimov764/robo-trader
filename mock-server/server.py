#!/usr/bin/env python3
"""
NFT Trader — dev-only mock API server (frontend testlash uchun).

REAL production'da kerak EMAS: o'zingizning FastAPI backend'ingiz
8765-portda turadi. Bu skript shu kontraktni takrorlaydi:

    python3 mock-server/server.py            # http://0.0.0.0:8765

Endpoints:
    /api/summary  /api/trades  /api/trades/open  /api/pnl
    /api/portfolio  /api/bot/status  /api/collections
"""
import json
import random
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

PORT = 8765
random.seed(7)

COLLECTIONS = ["Fantonverse", "TON Diamonds", "TON Punks", "Notcoin Names", "Durger King", "Hamster Badges"]
MARKETS = ["getgems", "fragment", "ton_diamonds"]
MARKET_URL = {
    "getgems": "https://getgems.io/collection/",
    "fragment": "https://fragment.com/telegramnft/",
    "ton_diamonds": "https://ton.diamonds/auction/",
}

NOW = datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def make_trades():
    trades = []
    tid = 0
    # 88 ta yopilgan savdo (oxirgi ~85 kun ichida)
    for i in range(88):
        tid += 1
        coll = random.choice(COLLECTIONS)
        market = random.choice(MARKETS)
        bought = NOW - timedelta(days=random.randint(1, 84), hours=random.randint(0, 23), minutes=random.randint(0, 59))
        hold = timedelta(hours=random.randint(2, 120))
        sold = min(bought + hold, NOW - timedelta(minutes=random.randint(2, 90)))
        buy = round(random.uniform(1.8, 42.0), 2)
        win = random.random() < 0.63
        pct = round(random.uniform(2.5, 28.0), 2) if win else -round(random.uniform(1.5, 17.0), 2)
        sell = round(buy * (1 + pct / 100), 4)
        trades.append({
            "id": tid,
            "nft_address": f"EQ{''.join(random.choices('0123456789abcdefABCDEF', k=44))}",
            "nft_name": f"{coll} #{random.randint(1, 9999)}",
            "collection": coll,
            "buy_price_ton": buy,
            "sell_price_ton": sell,
            "profit_ton": round(sell - buy, 4),
            "profit_percent": pct,
            "marketplace": market,
            "status": "closed",
            "bought_at": iso(bought),
            "sold_at": iso(sold),
            "marketplace_url": f"{MARKET_URL[market]}{coll.replace(' ', '-').lower()}/{tid}",
        })
    # 7 ta ochiq pozitsiya
    for i in range(7):
        tid += 1
        coll = random.choice(COLLECTIONS)
        market = random.choice(MARKETS)
        bought = NOW - timedelta(days=random.randint(0, 6), hours=random.randint(0, 20))
        buy = round(random.uniform(2.0, 30.0), 2)
        trades.append({
            "id": tid,
            "nft_address": f"EQ{''.join(random.choices('0123456789abcdefABCDEF', k=44))}",
            "nft_name": f"{coll} #{random.randint(1, 9999)}",
            "collection": coll,
            "buy_price_ton": buy,
            "sell_price_ton": None,
            "profit_ton": None,
            "profit_percent": None,
            "marketplace": market,
            "status": "open",
            "bought_at": iso(bought),
            "sold_at": None,
            "marketplace_url": f"{MARKET_URL[market]}{coll.replace(' ', '-').lower()}/{tid}",
        })
    trades.sort(key=lambda t: t["bought_at"], reverse=True)
    return trades


TRADES = make_trades()
CLOSED = [t for t in TRADES if t["status"] == "closed"]
OPENED = [t for t in TRADES if t["status"] == "open"]


def summary():
    profits = [t["profit_ton"] for t in CLOSED]
    wins = [p for p in profits if p > 0]

    def parse_dt(s):
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)

    def period_profit(days):
        since = NOW - timedelta(days=days)
        return sum(t["profit_ton"] for t in CLOSED if parse_dt(t["sold_at"]) >= since)

    return {
        "total_profit_ton": round(sum(profits), 2),
        "total_trades": len(CLOSED),
        "open_trades": len(OPENED),
        "win_rate": round(len(wins) / max(1, len(profits)) * 100, 1),
        "avg_profit_percent": round(sum(t["profit_percent"] for t in CLOSED) / max(1, len(CLOSED)), 2),
        "best_trade_profit": round(max(profits), 2),
        "worst_trade_profit": round(min(profits), 2),
        "current_balance_ton": 147.32,
        "period_profits": {"day": round(period_profit(1), 2), "week": round(period_profit(7), 2), "month": round(period_profit(30), 2)},
    }


def pnl(period: str):
    if period == "day":
        days, span = 14, 1
    elif period == "week":
        days, span = 56, 1
    elif period == "year":
        days, span = 365, 30
    else:  # month
        days, span = 90, 1
    points, total = [], 0.0
    for i in range(days - 1, -1, -span):
        d0 = (NOW - timedelta(days=i)).date()
        d1 = d0 + timedelta(days=span)
        day_trades = [t for t in CLOSED if d0 <= datetime.strptime(t["sold_at"], "%Y-%m-%dT%H:%M:%SZ").date() < d1]
        p = round(sum(t["profit_ton"] for t in day_trades), 4)
        total += p
        points.append({"date": iso(datetime.combine(d0, datetime.min.time()).replace(tzinfo=timezone.utc)), "profit_ton": p, "trades_count": len(day_trades)})
    return {"points": points, "total": round(total, 4)}


def collections_stats():
    out = {}
    for t in CLOSED:
        c = out.setdefault(t["collection"], {"trades": 0, "wins": 0, "profit": 0.0})
        c["trades"] += 1
        c["wins"] += 1 if t["profit_ton"] > 0 else 0
        c["profit"] += t["profit_ton"]
    return [
        {
            "collection": name,
            "trades": v["trades"],
            "wins": v["wins"],
            "win_rate": round(v["wins"] / max(1, v["trades"]) * 100, 1),
            "total_profit_ton": round(v["profit"], 2),
            "avg_profit_ton": round(v["profit"] / max(1, v["trades"]), 3),
        }
        for name, v in sorted(out.items(), key=lambda kv: -kv[1]["profit"])
    ]


PORTFOLIO = [
    {"id": 9001, "nft_name": "TON Diamonds #777", "collection": "TON Diamonds", "buy_price_ton": 55.0, "current_value_ton": 55.0, "quantity": 1, "acquired_at": iso(NOW - timedelta(days=41)), "marketplace_url": "https://getgems.io/collection/ton-diamonds/777"},
    {"id": 9002, "nft_name": "Fantonverse #1042", "collection": "Fantonverse", "buy_price_ton": 18.75, "current_value_ton": 18.75, "quantity": 2, "acquired_at": iso(NOW - timedelta(days=22)), "marketplace_url": "https://getgems.io/collection/fantonverse/1042"},
    {"id": 9003, "nft_name": "durov", "collection": "Notcoin Names", "buy_price_ton": 300.0, "current_value_ton": 300.0, "quantity": 1, "acquired_at": iso(NOW - timedelta(days=120)), "marketplace_url": "https://fragment.com/username/durov"},
]

BOT_STATUS = {
    "is_running": True,
    "allowed_collections": ["Fantonverse", "TON Diamonds", "TON Punks", "Notcoin Names"],
    "max_buy_price_ton": 45.0,
    "min_profit_percent": 5.0,
    "last_scan_at": iso(NOW - timedelta(minutes=random.randint(1, 9))),
    "marketplaces_enabled": ["getgems", "fragment", "ton_diamonds"],
}


class Handler(BaseHTTPRequestHandler):
    def _send(self, obj):
        body = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):  # CORS preflight
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        path = u.path.rstrip("/")

        if path == "/api/summary":
            self._send(summary())
        elif path == "/api/trades":
            status = (q.get("status") or [None])[0]
            coll = (q.get("collection") or [None])[0]
            limit = int((q.get("limit") or ["50"])[0])
            offset = int((q.get("offset") or ["0"])[0])
            rows = [t for t in TRADES if (not status or t["status"] == status) and (not coll or t["collection"] == coll)]
            self._send({"trades": rows[offset: offset + limit], "total": len(rows)})
        elif path == "/api/trades/open":
            coll = (q.get("collection") or [None])[0]
            rows = [t for t in OPENED if not coll or t["collection"] == coll]
            self._send({"trades": rows, "total": len(rows)})
        elif path == "/api/pnl":
            self._send(pnl((q.get("period") or ["month"])[0]))
        elif path == "/api/portfolio":
            self._send(PORTFOLIO)
        elif path == "/api/bot/status":
            BOT_STATUS["last_scan_at"] = iso(NOW - timedelta(minutes=random.randint(1, 9)))
            self._send(BOT_STATUS)
        elif path == "/api/collections":
            self._send(collections_stats())
        else:
            self._send({"ok": True, "service": "nft-trader-mock", "endpoints": ["/api/summary", "/api/trades", "/api/trades/open", "/api/pnl", "/api/portfolio", "/api/bot/status", "/api/collections"]})

    def log_message(self, *args):
        pass  # jimgina


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"[mock] NFT Trader mock API: http://0.0.0.0:{PORT}  ({len(TRADES)} trades)")
    srv.serve_forever()
