import { ExternalLink } from 'lucide-react'
import { hashColor } from '../lib/format'

const cache = new Map<string, string>()

function colorOf(collection: string) {
  const hit = cache.get(collection)
  if (hit) return hit
  const c = hashColor(collection)
  cache.set(collection, c)
  return c
}

export function CollectionBadge({ name, className = '' }: { name: string; className?: string }) {
  const c = colorOf(name)
  return (
    <span
      className={`inline-flex max-w-[150px] items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[10px] font-bold ${className}`}
      style={{
        color: c,
        borderColor: `${c}55`,
        background: `${c}14`,
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
      <span className="truncate">{name}</span>
    </span>
  )
}

export function NftTile({ name, collection, size = 40 }: { name: string; collection: string; size?: number }) {
  const c = colorOf(collection || name)
  const initials = (name.match(/[A-Za-z0-9]/g) ?? ['?']).slice(0, 2).join('').toUpperCase()
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border font-extrabold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color: c,
        borderColor: `${c}44`,
        background: `linear-gradient(150deg, ${c}26, rgba(22,27,34,0.9) 60%)`,
        boxShadow: `inset 0 0 12px ${c}14`,
      }}
    >
      {initials}
    </div>
  )
}

export function MarketLink({ url, label }: { url: string | null | undefined; label?: string }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2 py-1 text-[10px] font-bold text-neon no-underline active:border-neon/50"
    >
      {label}
      <ExternalLink size={11} />
    </a>
  )
}
