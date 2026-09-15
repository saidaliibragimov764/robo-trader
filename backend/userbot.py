"""Telethon userbot — signal kanallarini tinglaydi.

Sizning vazifangiz (VPS'da, .env ichida):
  TG_API_ID / TG_API_HASH  -> https://my.telegram.org/apps
  TG_SESSION               -> StringSession yoki sessiya fayli nomi
  SIGNAL_CHANNELS          -> @nom yoki -100xxxxxxxxxx (CSV)

Yangi NFT/signallar keladigan kanallardan xabar kelganda:
  1) matn parse qilinadi (collection nomi + TON narxi)
  2) engine.handle_signal() -> DB'ga signal logi va (paper rejimda) virual pozitsiya

Telegram session/API hisob ma'lumotlaringiz HECH QAYERGA yuborilmaydi —
fayl faqat shu serverda, .env'ichida saqlanadi.
"""
from __future__ import annotations

import asyncio
import re

from config import settings

# Matndan collection + narx ajratish (kanal formatlari uchun keng qamrovli)
_PRICE_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:ton|TON)", re.IGNORECASE)


def parse_signal(text: str) -> tuple[str | None, float | None]:
    """'Fantonverse floor 12.5 TON' -> ('Fantonverse', 12.5)"""
    coll = None
    for c in settings.allowed_collections:
        if re.search(re.escape(c), text, re.IGNORECASE):
            coll = c
            break
    price = None
    m = _PRICE_RE.search(text)
    if m:
        try:
            price = float(m.group(1).replace(",", "."))
        except ValueError:
            price = None
    return coll, price


async def run(stop: asyncio.Event) -> None:
    try:
        from telethon import TelegramClient, events
    except ImportError:
        print("[userbot] telethon o'rnatilmagan — pip install telethon")
        return

    if not settings.telegram_enabled:
        print("[userbot] TG_API_ID/TG_API_HASH/SIGNAL_CHANNELS to'liq emas — signal tinglash O'CHIQ")
        return

    from engine import handle_signal

    client = TelegramClient(settings.tg_session, settings.tg_api_id, settings.tg_api_hash)

    @client.on(events.NewMessage(chats=settings.signal_channels))
    async def _on_msg(event):  # type: ignore[no-untyped-def]
        text = event.raw_text or ""
        coll, price = parse_signal(text)
        if not coll:
            return
        chat = getattr(event.chat, "username", None) or str(event.chat_id)
        try:
            await handle_signal(coll, price, text, channel=chat, message_id=event.id)
        except NotImplementedError as e:
            print(f"[userbot] {e}")
        except Exception as e:  # noqa: BLE001
            print(f"[userbot] signal xatosi: {e}")

    print(f"[userbot] ulanmoqda... kanallar: {settings.signal_channels}")
    try:
        await client.start()
    except Exception as e:  # noqa: BLE001
        print(f"[userbot] ulanib bo'lmadi: {e} — API ID/HASH va 2FA ni tekshiring")
        return
    print("[userbot] ONLINE ✅")

    # To'xtaguncha ushlab turamiz
    while not stop.is_set():
        await asyncio.sleep(1)
    await client.disconnect()
