import { useState } from 'react'
import { Activity, ArrowRight, Flame, Layers, Percent, Snowflake, Target, TrendingUp, Wallet } from 'lucide-react'
import { KPICard, PeriodCard } from '../components/KPICard'
import { PnLChart } from '../components/PnLChart'
import { TradeRow } from '../components/TradeRow'
import { Card, EmptyState, ErrorState, SectionTitle, Skeleton, SkeletonCard, SkeletonRow } from '../components/ui'
import { useOpenTrades, usePnl, useSummary, useTradesPage } from '../hooks/useApi'
import { fmtSignedTon, fmtTon, isUp } from '../lib/format'
import type { PnlPeriod } from '../types'

const PERIODS: Array<{ id: PnlPeriod; label: string }> = [
  { id: 'day', label: 'Kun' },
  { id: 'week', label: 'Hafta' },
  { id: 'month', label: 'Oy' },
]

export default function Dashboard({ onNavigate }: { onNavigate: (tab: 'history' | 'portfolio') => void }) {
  const [period, setPeriod] = useState<PnlPeriod>('month')

  const summary = useSummary()
  const pnl = usePnl(period)
  const recent = useTradesPage({ page: 0, limit: 5 })
  const open = useOpenTrades()

  const s = summary.data
  const recentList = recent.data ?? []
  const openList = open.data ?? []
  const recentProfit = recentList.reduce((acc, t) => acc + (t.profit_ton ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Asosiy KPI'lar */}
      {summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
      ) : summary.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KPICard
              label="Umumiy foyda"
              icon={TrendingUp}
              tone="auto"
              value={s ? fmtSignedTon(s.total_profit_ton) : '—'}
              sub={s ? `O‘rtacha ${s.avg_profit_percent >= 0 ? '+' : ''}${s.avg_profit_percent.toFixed(1)}% / savdo` : undefined}
            />
            <KPICard
              label="Win Rate"
              icon={Target}
              tone={s && s.win_rate >= 50 ? 'up' : s ? 'down' : undefined}
              value={s ? `${s.win_rate.toFixed(1)}%` : '—'}
              sub={s ? `${s.total_trades} ta jami savdo` : undefined}
              footer={
                s ? (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full ${s.win_rate >= 50 ? 'bg-up' : 'bg-down'}`}
                      style={{ width: `${Math.min(100, Math.max(0, s.win_rate))}%`, boxShadow: '0 0 8px currentColor' }}
                    />
                  </div>
                ) : undefined
              }
            />
            <KPICard
              label="Ochiq pozitsiyalar"
              icon={Layers}
              tone="neon"
              value={s ? String(s.open_trades) : '—'}
              sub={s ? `Hamyon: ${fmtTon(s.current_balance_ton)} TON` : undefined}
            />
          </div>

          {/* 24h / Hafta / Oy */}
          <div className="grid grid-cols-3 gap-3">
            {summary.isLoading ? (
              <>
                <Skeleton className="h-[68px]" />
                <Skeleton className="h-[68px]" />
                <Skeleton className="h-[68px]" />
              </>
            ) : (
              <>
                <PeriodCard label="24 soat" value={s?.period_profits?.day} />
                <PeriodCard label="Hafta" value={s?.period_profits?.week} />
                <PeriodCard label="Oy" value={s?.period_profits?.month} />
              </>
            )}
          </div>
        </>
      )}

      {/* P&L grafigi */}
      <Card className="animate-rise p-4">
        <SectionTitle
          icon={Activity}
          title="P&L dinamikasi"
          right={
            <div className="flex rounded-lg border border-line bg-bg/60 p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                    period === p.id ? 'bg-neon/15 text-neon shadow-[0_0_10px_rgba(34,211,238,0.25)]' : 'text-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        />
        {pnl.isError ? (
          <ErrorState error={pnl.error} onRetry={() => pnl.refetch()} compact />
        ) : pnl.isLoading ? (
          <Skeleton className="h-[210px] w-full" />
        ) : (pnl.data?.points?.length ?? 0) === 0 ? (
          <EmptyState icon={Activity} title="Grafik uchun ma’lumot yo‘q" desc="Savdolar boshlangach shu yerda kunlik P&L chiziqlari paydo bo‘ladi." />
        ) : (
          <>
            <PnLChart points={pnl.data!.points} total={pnl.data!.total ?? 0} />
            <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 text-xs">
              <span className="font-bold text-muted">
                {period === 'day' ? '24 soatda' : period === 'week' ? 'Haftada' : 'Oyda'}:
              </span>
              <span className={`num font-extrabold ${isUp(pnl.data!.total) ? 'text-up' : 'text-down'}`}>
                {fmtSignedTon(pnl.data!.total)}
              </span>
            </div>
          </>
        )}
      </Card>

      {/* Eng yaxshi / eng yomon savdo */}
      {s && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-2.5 p-3">
            <Flame size={16} className="shrink-0 text-up" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Eng yaxshi</p>
              <p className="num truncate text-sm font-extrabold text-up">{fmtSignedTon(s.best_trade_profit)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-2.5 p-3">
            <Snowflake size={16} className="shrink-0 text-down" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Eng yomon</p>
              <p className="num truncate text-sm font-extrabold text-down">{fmtSignedTon(s.worst_trade_profit)}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Ochiq pozitsiyalar */}
      <div>
        <SectionTitle
          icon={Wallet}
          title={`Ochiq pozitsiyalar (${openList.length})`}
          right={
            openList.length > 0 ? (
              <button onClick={() => onNavigate('portfolio')} className="text-[11px] font-bold text-neon">
                Portfolio →
              </button>
            ) : undefined
          }
        />
        {open.isLoading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : openList.length === 0 ? (
          <EmptyState icon={Wallet} title="Ochiq pozitsiya yo‘q" desc="Bot hozircha bo‘shda turibdi yoki yangi NFT qidirmoqda." />
        ) : (
          <div className="space-y-2">
            {openList.slice(0, 3).map((t) => (
              <TradeRow key={String(t.id)} trade={t} live />
            ))}
          </div>
        )}
      </div>

      {/* Oxirgi savdolar */}
      <div>
        <SectionTitle
          icon={Percent}
          title="Oxirgi 5 savdo"
          right={
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center gap-1 text-[11px] font-bold text-neon"
            >
              Barchasi <ArrowRight size={12} />
            </button>
          }
        />
        {recent.isError ? (
          <ErrorState error={recent.error} onRetry={() => recent.refetch()} compact />
        ) : recent.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : recentList.length === 0 ? (
          <EmptyState title="Hali savdolar yo‘q" desc="Bot birinchi NFT ni sotib olgach, shu yerda ko‘rinadi." />
        ) : (
          <div className="space-y-2">
            {recentList.map((t) => (
              <TradeRow key={String(t.id)} trade={t} />
            ))}
            <Card className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold">
              <span className="text-muted">5 ta savdo natijasi</span>
              <span className={`num ${isUp(recentProfit) ? 'text-up' : 'text-down'}`}>{fmtSignedTon(recentProfit)}</span>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
