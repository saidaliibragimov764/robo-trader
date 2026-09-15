import type { LucideIcon } from 'lucide-react'
import { isUp } from '../lib/format'
import { Card } from './ui'

export function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  footer,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  /** karta rangi: avtomatik foydaga qarab yoki neon */
  tone?: 'up' | 'down' | 'neon' | 'auto'
  footer?: React.ReactNode
}) {
  const auto = tone === 'auto' ? (isUp(parseFloat(value.replace(/[^0-9.\-−]/g, '').replace('−', '-'))) ? 'up' : 'down') : tone

  const toneText =
    auto === 'up' ? 'text-up text-glow-up' : auto === 'down' ? 'text-down text-glow-down' : auto === 'neon' ? 'text-neon text-glow-neon' : ''
  const glow = auto === 'up' ? 'glow-up' : auto === 'down' ? 'glow-down' : auto === 'neon' ? 'glow-neon' : ''

  return (
    <Card className={`animate-rise p-4 ${glow}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 ${toneText || 'text-neon'}`}>
          <Icon size={14} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
      </div>
      <p className={`num mt-3 text-2xl font-extrabold leading-none ${toneText}`}>{value}</p>
      {sub && <p className="num mt-2 text-[11px] font-medium text-muted">{sub}</p>}
      {footer}
    </Card>
  )
}

/** Kichik davr kartasi (24h / Hafta / Oy) */
export function PeriodCard({ label, value }: { label: string; value: number | undefined | null }) {
  const up = isUp(value)
  return (
    <Card className="p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`num mt-1.5 text-sm font-extrabold ${value == null ? 'text-muted' : up ? 'text-up' : 'text-down'}`}>
        {value == null ? '—' : `${up ? '+' : '−'}${Math.abs(value).toFixed(2)}`}
      </p>
      <p className={`text-[9px] font-semibold ${value == null ? 'text-muted/50' : up ? 'text-up/60' : 'text-down/60'}`}>TON</p>
    </Card>
  )
}
