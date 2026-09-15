import { Clock, ExternalLink, Gem, HandCoins } from 'lucide-react'
import { CollectionBadge, NftTile } from '../components/CollectionBadge'
import { Card, EmptyState, ErrorState, SectionTitle, SkeletonRow } from '../components/ui'
import { useOpenTrades, usePortfolio } from '../hooks/useApi'
import { fmtPct, fmtTon, heldFor, marketLabel } from '../lib/format'
import { openExternal } from '../lib/telegram'
import type { PortfolioNft, Trade } from '../types'

function OpenPositionCard({ t }: { t: Trade }) {
  const cur = t.current_price_ton ?? t.buy_price_ton
  const unreal = t.buy_price_ton ? ((cur - t.buy_price_ton) / t.buy_price_ton) * 100 : 0

  return (
    <Card className="animate-rise flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <NftTile name={t.nft_name} collection={t.collection} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{t.nft_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <CollectionBadge name={t.collection} />
            <span className="text-[10px] font-semibold text-muted">{marketLabel(t.marketplace)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line/70 bg-bg/40 p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Xarid narxi</p>
          <p className="num mt-0.5 text-sm font-extrabold text-neon">{fmtTon(t.buy_price_ton)} TON</p>
        </div>
        <div className="rounded-xl border border-line/70 bg-bg/40 p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Hozirgi qiymat</p>
          <p className="num mt-0.5 text-sm font-extrabold">
            {fmtTon(cur)} TON
            <span className={`num ml-1.5 text-[10px] font-bold ${unreal >= 0 ? 'text-up' : 'text-down'}`}>
              {fmtPct(unreal)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="num flex items-center gap-1 text-[11px] font-semibold text-muted">
          <Clock size={12} className="text-warn" /> {heldFor(t.bought_at)} ushlab turibdi
        </span>
        <button
          onClick={() => t.marketplace_url && openExternal(t.marketplace_url)}
          disabled={!t.marketplace_url}
          className="flex items-center gap-1.5 rounded-xl border border-neon/30 bg-neon/10 px-3 py-1.5 text-[11px] font-bold text-neon disabled:opacity-40"
        >
          Marketplace <ExternalLink size={12} />
        </button>
      </div>
    </Card>
  )
}

function ManualNftCard({ nft }: { nft: PortfolioNft }) {
  const value = nft.current_value_ton ?? nft.buy_price_ton
  return (
    <Card className="flex items-center gap-3 p-3">
      <NftTile name={nft.nft_name} collection={nft.collection} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold">{nft.nft_name}</p>
        <div className="mt-1 flex items-center gap-2">
          <CollectionBadge name={nft.collection} />
          {nft.quantity && nft.quantity > 1 && <span className="text-[10px] font-bold text-muted">×{nft.quantity}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="num text-[13px] font-extrabold text-neon">{fmtTon(value)}</span>
        {nft.marketplace_url && (
          <a
            href={nft.marketplace_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-muted"
          >
            <ExternalLink size={11} className="inline" />
          </a>
        )}
      </div>
    </Card>
  )
}

export default function Portfolio() {
  const open = useOpenTrades()
  const manual = usePortfolio()

  const openList = open.data ?? []
  const manualList = manual.data ?? []
  const totalInvested = openList.reduce((a, t) => a + (t.buy_price_ton ?? 0), 0)

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Jami investitsiya</p>
          <p className="num mt-1 text-2xl font-extrabold text-neon text-glow-neon">
            {open.isLoading ? '…' : `${fmtTon(totalInvested)} TON`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Pozitsiyalar</p>
          <p className="num mt-1 text-2xl font-extrabold">{open.isLoading ? '…' : openList.length}</p>
        </div>
      </Card>

      <p className="px-1 text-[10px] leading-relaxed text-muted">
        Hozirgi qiymat — backend'ning oxirgi skan paytidagi floor narxi. Aniq foyda savdo yopilgach hisoblanadi.
      </p>

      <div>
        <SectionTitle icon={Gem} title="Botdagi ochiq pozitsiyalar" />
        {open.isError ? (
          <ErrorState error={open.error} onRetry={() => open.refetch()} />
        ) : open.isLoading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : openList.length === 0 ? (
          <EmptyState icon={Gem} title="Ochiq pozitsiyalar yo‘q" desc="Bot savdo topgani bilan shu yerda kartalar paydo bo‘ladi." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {openList.map((t) => (
              <OpenPositionCard key={String(t.id)} t={t} />
            ))}
          </div>
        )}
      </div>

      {manual.isError ? (
        <ErrorState error={manual.error} onRetry={() => manual.refetch()} compact />
      ) : manualList.length > 0 ? (
        <div>
          <SectionTitle icon={HandCoins} title="Qo‘lda ushlab turilgan NFT’lar" />
          <div className="space-y-2">
            {manualList.map((n, i) => (
              <ManualNftCard key={String(n.id ?? n.nft_address ?? i)} nft={n} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
