import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { PnlPeriod, TradeStatus } from '../types'

/** Barcha so'rovlar 30 soniyada bir yangilanadi */
const REFRESH_MS = 30_000

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: api.summary,
    refetchInterval: REFRESH_MS,
  })
}

export function useBotStatus() {
  return useQuery({
    queryKey: ['bot-status'],
    queryFn: api.botStatus,
    refetchInterval: REFRESH_MS,
  })
}

export function usePnl(period: PnlPeriod) {
  return useQuery({
    queryKey: ['pnl', period],
    queryFn: () => api.pnl(period),
    refetchInterval: REFRESH_MS,
  })
}

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: api.collections,
    refetchInterval: REFRESH_MS * 2,
  })
}

export function useOpenTrades() {
  return useQuery({
    queryKey: ['trades-open'],
    queryFn: () => api.openTrades({ limit: 200 }),
    refetchInterval: REFRESH_MS,
  })
}

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: api.portfolio,
    refetchInterval: REFRESH_MS * 2,
  })
}

export function useTradesPage(opts: {
  status?: TradeStatus
  collection?: string
  page: number
  limit: number
}) {
  const { status, collection, page, limit } = opts
  return useQuery({
    queryKey: ['trades', status ?? 'all', collection ?? 'all', page, limit],
    queryFn: () =>
      api.trades({
        status,
        collection: collection || undefined,
        limit,
        offset: page * limit,
      }),
    placeholderData: keepPreviousData,
  })
}
