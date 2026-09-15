"""Yagona kirish nuqtasi: FastAPI + (ixtiyoriy) userbot + scanner dvigateli.

    python3 backend/main.py          # http://0.0.0.0:8765

Va
BOT_MODE=signal : signallar faqat DB'ga yoziladi (savdo yo'q)
BOT_MODE=paper  : virual savdo — dashboard testlash uchun (default)
BOT_MODE=live   : executor bilan haqiqiy on-chain savdo (tayyorlanmoqda)

TG hisob ma'lumotlari bo'lmasa ham ishlayveradi (scanner + API + dashboard).
"""
from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # `import db` ishlashi uchun

import uvicorn

import db
from api import app
from config import settings


from contextlib import asynccontextmanager

@asynccontextmanager
async def _lifespan(stop: asyncio.Event):
    db.init()
    tasks = []
    if settings.scanner_enabled and settings.mode in ("paper", "signal"):
        import engine
        tasks.append(asyncio.create_task(engine.scanner_loop(stop)))
    if settings.telegram_enabled:
        import userbot
        tasks.append(asyncio.create_task(userbot.run(stop)))
    print(
        f"[main] mode={settings.mode} scanner={settings.scanner_enabled} "
        f"telegram={'on' if settings.telegram_enabled else 'off (faqat signal yozishni kutmoqda)'}"
    )
    yield
    stop.set()
    for t in tasks:
        t.cancel()


def main() -> None:
    stop = asyncio.Event()
    server = uvicorn.Server(
        uvicorn.Config(
            app,
            host=settings.api_host,
            port=settings.api_port,
            lifespan="on",
            log_level="info",
            # lifespan'ni oddiy qilish: userbot/scan tasklarini alohida boshqaramiz
        )
    )

    async def run():
        async with _lifespan(stop):
            await server.serve()

    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("\n[main] to'xtatildi")


if __name__ == "__main__":
    main()
