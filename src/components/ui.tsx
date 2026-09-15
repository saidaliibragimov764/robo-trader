import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ---------------- Card ---------------- */
export function Card({
  className = '',
  children,
  glow,
}: {
  className?: string
  children: ReactNode
  glow?: 'neon' | 'up' | 'down'
}) {
  const g = glow === 'neon' ? 'glow-neon' : glow === 'up' ? 'glow-up' : glow === 'down' ? 'glow-down' : ''
  return <div className={`glass ${g} ${className}`}>{children}</div>
}

export function SectionTitle({ icon: Icon, title, right }: { icon?: LucideIcon; title: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className="text-neon" />}
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">{title}</h2>
      </div>
      {right}
    </div>
  )
}

/* ---------------- Skeletons ---------------- */
export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <Card className="p-4">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-3 h-7 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="mb-2 h-3 w-1/2" />
      ))}
    </Card>
  )
}

export function SkeletonRow() {
  return (
    <Card className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-16 shrink-0" />
    </Card>
  )
}

/* ---------------- Empty / Error states ---------------- */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  desc,
}: {
  icon?: LucideIcon
  title: string
  desc?: string
}) {
  return (
    <Card className="flex flex-col items-center gap-2.5 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2">
        <Icon size={22} className="text-muted" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {desc && <p className="max-w-[260px] text-xs leading-relaxed text-muted">{desc}</p>}
    </Card>
  )
}

export function ErrorState({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : 'Noma’lum xatolik'
  return (
    <Card className={`flex items-center gap-3 border-down/40 ${compact ? 'p-3' : 'px-5 py-6'} text-sm`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-down/10">
        <AlertTriangle size={17} className="text-down" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Ma’lumotni yuklab bo’lmadi</p>
        <p className="truncate text-xs text-muted">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-bold text-neon active:border-neon/60"
        >
          <RefreshCw size={13} />
          Qayta
        </button>
      )}
    </Card>
  )
}

/* ---------------- Status pill ---------------- */
export function StatusPill({ running, size = 'md' }: { running: boolean | undefined; size?: 'sm' | 'md' }) {
  const online = running === true
  const cls = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide ${cls} ${
        online
          ? 'border-up/40 bg-up/10 text-up'
          : running === false
            ? 'border-down/40 bg-down/10 text-down'
            : 'border-line bg-surface-2 text-muted'
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-70" />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${online ? 'bg-up' : running === false ? 'bg-down' : 'bg-muted'}`} />
      </span>
      {online ? 'Online' : running === false ? 'Offline' : '—'}
    </span>
  )
}
