"""Demo/test ma'lumotlari — dashboard'ni real format bilan sinash uchun.

    python3 backend/seed.py --demo --closed 70 --open 8

Diqqat: botning haqiqiy ish rejimi (engine.py) ham AYNAN shu db.funksiyalarni
ishlatadi — seed faqat tarixni tez to'ldiradi. Tozalash: --reset
"""
from __future__ import annotations

import argparse
import os
import random
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import db  # noqa: E402
from config import settings  # noqa: E402

MARKETS = ["getgems", "fragment", "ton_diamonds"]


def seed_demo(closed: int, open_n: int, days: int = 84, seed: int | None = None) -> None:
    if seed is not None:
        random.seed(seed)
    colls = settings.allowed_collections or ["Fantonverse", "TON Diamonds"]
    now = datetime.now(timezone.utc)
    for i in range(closed):
        coll = random.choice(colls)
        bought = now - timedelta(days=random.randint(1, days), hours=random.randint(0, 23),
                                  minutes=random.randint(0, 59))
        sold = min(bought + timedelta(hours=random.randint(2, 120)),
                   now - timedelta(minutes=random.randint(1, 90)))
        buy = round(random.uniform(1.5, min(settings.max_buy_price_ton, 40)), 2)
        win = random.random() < 0.62
        pct = round(random.uniform(2.5, 26), 2) if win else -round(random.uniform(1.5, 16), 2)
        sell = round(buy * (1 + pct / 100), 3)
        token = random.randint(100, 9999)
        db.conn().execute(
            "INSERT INTO trades (nft_address,nft_name,collection,buy_price_ton,sell_price_ton,"
            "current_price_ton,profit_ton,profit_percent,marketplace,status,source,marketplace_url,"
            "bought_at,sold_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                f"EQ{random.getrandbits(160):040x}",
                f"{coll} #{token}",
                coll,
                buy,
                sell,
                sell,
                round(sell - buy, 4),
                pct,
                random.choice(MARKETS),
                "closed",
                random.choice(("signal", "scan", "scan")),
                f"https://getgems.io/collection/{coll.lower().replace(' ', '-')}/{token}",
                bought.isoformat(timespec="seconds"),
                sold.isoformat(timespec="seconds"),
                sold.isoformat(timespec="seconds"),
            ),
        )
    db.conn().commit()

    for _ in range(open_n):
        coll = random.choice(colls)
        buy = round(random.uniform(2, settings.max_buy_price_ton), 2)
        cur = round(buy * random.uniform(0.88, 1.12), 3)
        bought = now - timedelta(days=random.randint(0, 6), hours=random.randint(0, 23))
        token = random.randint(100, 9999)
        db.conn().execute(
            "INSERT INTO trades (nft_address,nft_name,collection,buy_price_ton,current_price_ton,"
            "marketplace,status,source,marketplace_url,bought_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (
                f"EQ{random.getrandbits(160):040x}",
                f"{coll} #{token}",
                coll,
                buy,
                cur,
                "getgems",
                "open",
                "signal",
                f"https://getgems.io/collection/{coll.lower().replace(' ', '-')}/{token}",
                bought.isoformat(timespec="seconds"),
                bought.isoformat(timespec="seconds"),
            ),
        )
    db.conn().commit()
    print(f"[seed] {closed} yopilgan + {open_n} ochiq trade qo'shildi -> {settings.db_path}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true", help="demo tarix qo'shish")
    ap.add_argument("--closed", type=int, default=60)
    ap.add_argument("--open", dest="open_n", type=int, default=8)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--reset", action="store_true", help="trades/signals tablitsalarini tozalash")
    args = ap.parse_args()

    db.init()
    if args.reset:
        db.conn().execute("DELETE FROM trades")
        db.conn().execute("DELETE FROM signals")
        db.conn().commit()
        print("[seed] tozalandi")
    if args.demo:
        seed_demo(args.closed, args.open_n, seed=args.seed)


if __name__ == "__main__":
    main()
