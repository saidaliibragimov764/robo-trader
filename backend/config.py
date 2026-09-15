"""Bitta konfiguratsiya manbasi — backend/.env faylidan o'qiydi.

HECH QACHON .env ni gitga kirmang! (api_hash, session, wallet seed — hammasi shu yerda)
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

try:  # .env ni yuklash (yo'q bo'lsa jimgina o'tamiz)
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass


def _f(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, "") or default)
    except ValueError:
        return default


def _csv(name: str, default: str = "") -> list[str]:
    raw = os.environ.get(name) or default
    return [x.strip() for x in raw.split(",") if x.strip()]


@dataclass
class Settings:
    # --- Telegram userbot (ixtiyoriy: yo'q bo'lsa headless paper-mode ishlaydi) ---
    tg_api_id: int = int(os.environ.get("TG_API_ID") or 0)
    tg_api_hash: str = os.environ.get("TG_API_HASH", "")
    tg_session: str = os.environ.get("TG_SESSION", "robo-trader")  # robo-trader.session
    signal_channels: list[str] = field(default_factory=lambda: _csv("SIGNAL_CHANNELS"))

    # --- Strategiya ---
    allowed_collections: list[str] = field(
        default_factory=lambda: _csv(
            "ALLOWED_COLLECTIONS",
            "Fantonverse,TON Diamonds,TON Punks,Notcoin Names",
        )
    )
    max_buy_price_ton: float = field(default_factory=lambda: _f("MAX_BUY_TON", 45.0))
    min_profit_percent: float = field(default_factory=lambda: _f("MIN_PROFIT_PCT", 5.0))
    max_open_positions: int = int(os.environ.get("MAX_OPEN_POSITIONS") or 10)
    min_hold_hours: float = field(default_factory=lambda: _f("MIN_HOLD_HOURS", 1.0))
    marketplaces: list[str] = field(
        default_factory=lambda: _csv("MARKETPLACES_ENABLED", "getgems,fragment,ton_diamonds")
    )
    wallet_balance_ton: float = field(default_factory=lambda: _f("WALLET_BALANCE_TON", 150.0))

    # --- Rejim ---
    # signal : signallarni DB yozadi, savdo qilmaydi
    # paper  : signal+skaner asosida VIRUAL savdo (dashboard test uchun)
    # live   : haqiqiy on-chain buy/sell (executor talab qilinadi)
    mode: str = os.environ.get("BOT_MODE", "paper")
    scanner_enabled: bool = (os.environ.get("SCANNER_ENABLED") or "1") == "1"
    scan_interval_sec: int = int(os.environ.get("SCAN_INTERVAL_SEC") or 120)
    floor_provider: str = os.environ.get("FLOOR_PROVIDER", "sim")  # sim | getgems

    # --- API ---
    api_host: str = os.environ.get("API_HOST", "0.0.0.0")
    api_port: int = int(os.environ.get("API_PORT") or 8765)
    ingest_token: str = os.environ.get("INGEST_TOKEN", "")  # bo'sh bo'lsa POSTlar yopiq

    @property
    def telegram_enabled(self) -> bool:
        return bool(self.tg_api_id and self.tg_api_hash and self.signal_channels)

    @property
    def db_path(self) -> str:
        return os.environ.get(
            "DB_PATH", os.path.join(os.path.dirname(__file__), "data", "robo.db")
        )


settings = Settings()
