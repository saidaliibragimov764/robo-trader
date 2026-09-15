import { useState } from 'react'
import { ChevronDown, ListFilter, Loader2 } from 'lucide-react'
import { TradeRow } from '../components/TradeRow'
import { Card, EmptyState, ErrorState, SkeletonRow } from '../components/ui'
import { useCollections, useTradesPage } from '../hooks/useApi'
import type { Trade, TradeStatus } from '../types'

const LIMIT = 20

type StatusFilter = 'all' | TradeStatus

const TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Hammasi' },
  { id: 'open', label: 'Ochiq' },
  { id: 'closed', label: 'Yopilgan' },
]

export default function History() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [collection, setCollection] = useState('')
  const [pages, setPages] = useState(1)

  const collections = useCollections()
  const query = useTradesPage({
    status: status === 'all' ? undefined : status,
    collection: collection || undefined,
    page: pages - 1,
    limit: LIMIT,
  })

  const list = query.data ?? []
  const shown = list.length
  const canLoadMore = shown >= LIMIT && !query.isPlaceholderData
  const collectionOptions = (collections.data ?? []).map((c) => c.collection)

  return (
    <div className="space-y-3">
      {/* Filtrlar */}
      <div className="flex gap-2">
        <div className="flex flex-1 rounded-xl border border-line bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setStatus(t.id)
                setPages(1)
              }}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-bold ${
                status === t.id
                  ? 'bg-neon/15 text-neon shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35),0_0_14px_rgba(34,211,238,0.15)]'
                  : 'text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <select
            value={collection}
            onChange={(e) => {
              setCollection(e.target.value)
              setPages(1)
            }}
            className="h-full appearance-none rounded-xl border border-line bg-surface py-1.5 pl-3 pr-8 text-[12px] font-bold text-[var(--tg-text)] outline-none focus:border-neon/50"
          >
            <option value="">Barcha collection</option>
            {collectionOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      </div>

      {/* Natijalar */}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isPlaceholderData ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : list.length === 0 && !query.isLoading ? (
        <EmptyState
          icon={ListFilter}
          title="Savdolar topilmadi"
          desc="Tanlangan filtrlar bo‘yicha tarix bo‘sh. Filtrlarni o‘zgartirib ko‘ring."
        />
      ) : (
        <>
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-muted">
            <span className="num">1–{shown} ta ko‘rsatilgan</span>
            {query.isFetching && !query.isPlaceholderData && <Loader2 size={12} className="animate-spin text-neon" />}
          </div>

          <div className="space-y-2">
            {(query.isLoading ? Array.from({ length: 5 }) : list).map((t, i) =>
              query.isLoading ? (
                <SkeletonRow key={i} />
              ) : (
                <TradeRow key={String((t as Trade).id)} trade={t as Trade} />
              ),
            )}
          </div>
        </>
      )}

      {/* Load more */}
      {!query.isError && (canLoadMore || query.isPlaceholderData) && (
        <Card className="p-1.5">
          <button
            onClick={() => setPages((p) => p + 1)}
            disabled={query.isFetching}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] py-2.5 text-[12px] font-bold text-neon disabled:text-muted"
          >
            {query.isFetching ? <Loader2 size={14} className="animate-spin" /> : <ListFilter size={14} />}
            Yana yuklash
          </button>
        </Card>
      )}
    </div>
  )
}
