import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { Trade } from '../types'
import { fmtPct, fmtTon, isUp, marketLabel, timeAgo } from '../lib/format'
import { CollectionBadge, MarketLink, NftTile } from './CollectionBadge'
import { Card } from './ui'

/**
 * Savdo qatori. `live=true` bo'lsa hozirgi narx = xarid narxi deb
 * ko'rsatiladi (open pozitsiyalar uchun).
 */
export function TradeRow({ trade, live = false }: { trade: Trade; live?: boolean }) {
  const open = trade.status === 'open'
  const profit = trade.profit_ton
  const up = isUp(profit)
  const Arrow = up ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="flex items-center gap-3 p-3">
      <NftTile name={trade.nft_name} collection={trade.collection} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-bold">{trade.nft_name}</p>
          {open && (
            <span className="shrink-0 rounded-md border border-warn/40 bg-warn/10 px-1.5 py-px text-[9px] font-bold uppercase text-warn">
              Ochiq
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <CollectionBadge name={trade.collection} />
          <span className="text-[10px] text-muted">
            {marketLabel(trade.marketplace)} · {timeAgo(open ? trade.bought_at : trade.sold_at ?? trade.bought_at)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {open ? (
          <>
            <span className="num text-[13px] font-extrabold text-neon" title="Hozirgi floor narx (yoki xarid narxi)">
              {fmtTon(trade.current_price_ton ?? trade.buy_price_ton)}
            </span>
            {trade.current_price_ton != null && trade.current_price_ton !== trade.buy_price_ton ? (
              <span className={`num text-[10px] font-bold ${isUp(trade.current_price_ton - trade.buy_price_ton) ? 'text-up' : 'text-down'}`}>
                {fmtPct(((trade.current_price_ton - trade.buy_price_ton) / (trade.buy_price_ton || 1)) * 100)} unreal.
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted">
                {live ? 'buy price' : 'open'}
              </span>
            )}
          </>
        ) : (
          <>
            <span className={`num flex items-center gap-0.5 text-[13px] font-extrabold ${up ? 'text-up' : 'text-down'}`}>
              <Arrow size={13} strokeWidth={2.5} />
              {up ? '+' : '−'}
              {fmtTon(Math.abs(profit ?? 0))}
            </span>
            <span className={`num text-[10px] font-bold ${up ? 'text-up/70' : 'text-down/70'}`}>
              {fmtPct(trade.profit_percent)}
            </span>
          </>
        )}
        {trade.marketplace_url && <MarketLink url={trade.marketplace_url} />}
      </div>
    </Card>
  )
}
