"""Floor-price provider.

FLOOR_PROVIDER=sim     -> lokal simulyatsiya (drift bilan) — API'siz test uchun
FLOOR_PROVIDER=getgems -> GetGems'ga real so'rov (muvaffaqiyatsizlikda sim'ga qaytadi)

Eslatma: GetGems'ning ochiq API'si barqaror hujjatlanmagan; endpoint o'zgarsa
shu fayl ichidagi GET_GEMS_* konstantalarini yangilang. Live trading qo'shilganda
bu qatlam shunchaki "narx manbai" bo'lib qoladi.
"""
from __future__ import annotations

import asyncio
import math
import random
import time

import httpx

GET_GEMS_BASE = "https://api.getgems.io"
HTTP_TIMEOUT = 6.0


class SimProvider:
    """Kolleksiya nomidan barqaror 'flooor' + sekin sinusoidal drift + noise."""

    BASE = {"Fantonverse": 12.4, "TON Diamonds": 3.1, "TON Punks": 27.8,
            "Notcoin Names": 8.9, "Durger King": 4.6, "Hamster Badges": 1.8}

    def __init__(self, collections: list[str]):
        self.collections = collections
        self._seed = {c: random.Random(hash(c) & 0xFFFF).uniform(0, math.tau) for c in collections}

    async def floors(self) -> dict[str, float]:
        t = time.time() / 600  # ~10 daqiqalik sikl
        out: dict[str, float] = {}
        for c in self.collections:
            base = self.BASE.get(c, 5.0)
            drift = math.sin(t + self._seed[c]) * 0.04 + random.uniform(-0.01, 0.012)
            out[c] = round(base * (1 + drift), 3)
        return out


class GetGemsProvider:
    """Haqiqiy GetGems so'rovi — xatoda SimProvider'ga avtomatik qaytadi."""

    def __init__(self, collections: list[str]):
        self.collections = collections
        self._fallback = SimProvider(collections)

    async def _floor_for(self, client: httpx.AsyncClient, collection: str) -> float | None:
        # GetGems collection slugi: nomdagi bo'shliqlar '-' ga
        slug = collection.lower().replace(" ", "-")
        for path in (f"/collections/{slug}", f"/collection/{slug}"):
            try:
                r = await client.get(f"{GET_GEMS_BASE}{path}", params={"sort": "price", "direction": "asc", "limit": 1})
                if r.status_code != 200:
                    continue
                data = r.json()
                # javob shakli o'zgaruvchan — bir nechta variantni uramiz
                for getter in (
                    lambda d: float(d["floorPrice"] or d["floor_price"]),
                    lambda d: float(d["items"][0]["price"]),
                    lambda d: float(d["data"]["collection"]["stats"]["floorPrice"]),
                ):
                    try:
                        v = getter(data)
                        if v and v > 0:
                            return round(v, 4)
                    except Exception:
                        continue
            except Exception:
                continue
        return None

    async def floors(self) -> dict[str, float]:
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                results = await asyncio.gather(*(self._floor_for(client, c) for c in self.collections))
            fetched = {c: v for c, v in zip(self.collections, results) if v}
            if fetched:
                return fetched
        except Exception:
            pass
        return await self._fallback.floors()  # tarmoq yo'q/xato -> sim


def make_provider(kind: str, collections: list[str]):
    return GetGemsProvider(collections) if kind == "getgems" else SimProvider(collections)
