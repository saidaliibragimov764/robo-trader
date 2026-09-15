import type {
  BotStatus,
  CollectionStat,
  PnlPeriod,
  PnlResponse,
  PortfolioNft,
  Summary,
  Trade,
  TradeStatus,
} from '../types'

/**
 * Bitta API qatlami. VITE_API_URL bo'sh bo'lsa nisbiy `/api` ishlatiladi
 * (Vite proxy yoki nginx orqali) — bu Telegram HTTPS ichida eng xavfsiz rejim.
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '')

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchJSON<T>(path: string, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new ApiError(`Server xatosi (HTTP ${res.status})`, res.status)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    if ((e as Error)?.name === 'AbortError') throw new ApiError('Server javob bermadi (taym-out)')
    throw new ApiError('API bilan aloqa yo‘q. Backend ishlayaptimi?')
  } finally {
    clearTimeout(timer)
  }
}

/* Backend array yoki { trades: [...] } ko'rinishida qaytarsa ham ishlaydi */
function normalizeList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[]
  const obj = data as Record<string, unknown> | null
  const arr = obj?.[key] ?? obj?.items
  return Array.isArray(arr) ? (arr as T[]) : []
}

export interface TradesQuery {
  limit?: number
  offset?: number
  status?: TradeStatus
  collection?: string
}

function toQs(q: TradesQuery): string {
  const p = new URLSearchParams()
  if (q.limit != null) p.set('limit', String(q.limit))
  if (q.offset != null) p.set('offset', String(q.offset))
  if (q.status) p.set('status', q.status)
  if (q.collection) p.set('collection', q.collection)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  summary: (): Promise<Summary> => fetchJSON<Summary>('/api/summary'),

  trades: async (q: TradesQuery = {}): Promise<Trade[]> => {
    const raw = await fetchJSON<unknown>(`/api/trades${toQs(q)}`)
    return normalizeList<Trade>(raw, 'trades')
  },

  openTrades: async (q: Omit<TradesQuery, 'status'> = {}): Promise<Trade[]> => {
    const raw = await fetchJSON<unknown>(`/api/trades/open${toQs(q)}`)
    return normalizeList<Trade>(raw, 'trades')
  },

  pnl: (period: PnlPeriod): Promise<PnlResponse> =>
    fetchJSON<PnlResponse>(`/api/pnl?period=${period}`),

  portfolio: async (): Promise<PortfolioNft[]> => {
    const raw = await fetchJSON<unknown>('/api/portfolio')
    return normalizeList<PortfolioNft>(raw, 'portfolio')
  },

  botStatus: (): Promise<BotStatus> => fetchJSON<BotStatus>('/api/bot/status'),

  collections: async (): Promise<CollectionStat[]> => {
    const raw = await fetchJSON<unknown>('/api/collections')
    return normalizeList<CollectionStat>(raw, 'collections')
  },
}
