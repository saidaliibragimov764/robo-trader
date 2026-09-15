/* Son/sana formatlash — barcha sonlar tabular-nums bilan chiroyli tiziladi */

const nf = (min: number, max: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: min, maximumFractionDigits: max })

const ton2 = nf(2, 2)
const ton3 = nf(0, 3)
const int0 = nf(0, 0)

export function fmtTon(n: number | null | undefined, digits: 2 | 3 = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return digits === 2 ? ton2.format(n) : ton3.format(n)
}

export function fmtSignedTon(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${ton2.format(Math.abs(n))} TON`
}

export function fmtTonUnit(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${ton2.format(n)} TON`
}

export function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return int0.format(n)
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

const p2 = (n: number) => String(n).padStart(2, '0')

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}

export function fmtDayLabel(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}`
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso).getTime()
  if (isNaN(d)) return '—'
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000))
  if (s < 60) return 'hozir'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} daqiqa oldin`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} soat oldin`
  const dd = Math.floor(h / 24)
  if (dd < 30) return `${dd} kun oldin`
  return fmtDateTime(iso)
}

/** Nechun turibdi (holding vaqt) */
export function heldFor(iso: string | null | undefined): string {
  if (!iso) return '—'
  const start = new Date(iso).getTime()
  if (isNaN(start)) return '—'
  const h = Math.floor((Date.now() - start) / 3_600_000)
  if (h < 1) {
    const m = Math.max(1, Math.floor(h * 60))
    return `${m} daqiqa`
  }
  if (h < 24) return `${h} soat`
  return `${Math.floor(h / 24)} kun ${h % 24} soat`
}

export const isUp = (n: number | null | undefined) => (n ?? 0) >= 0

/** Collection nomidan barqaror rang (initial tile va badge uchun) */
const PALETTE = ['#22d3ee', '#10b981', '#eab308', '#a78bfa', '#f472b6', '#38bdf8', '#fb923c']
export function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export function marketLabel(m: string | null | undefined): string {
  if (!m) return '—'
  return m
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('Ton', 'TON')
}
