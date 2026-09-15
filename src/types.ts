/* ============================================================
   Backend API javoblarining tiplari (FastAPI:8765)
   ============================================================ */

export interface Summary {
  total_profit_ton: number
  total_trades: number
  open_trades: number
  win_rate: number // 0..100
  avg_profit_percent: number
  best_trade_profit: number
  worst_trade_profit: number
  current_balance_ton: number
  period_profits: {
    day: number
    week: number
    month: number
  }
}

export type TradeStatus = 'open' | 'closed'

export interface Trade {
  id: number | string
  nft_address: string
  nft_name: string
  collection: string
  buy_price_ton: number
  sell_price_ton: number | null
  /** Backend ochiq pozitsiyalar uchun jonli floor narxini yuboradi (ixtiyoriy) */
  current_price_ton?: number | null
  profit_ton: number | null
  profit_percent: number | null
  marketplace: string
  status: TradeStatus
  bought_at: string | null
  sold_at: string | null
  marketplace_url: string | null
}

export type PnlPeriod = 'day' | 'week' | 'month' | 'year'

export interface PnlPoint {
  date: string
  profit_ton: number
  trades_count: number
}

export interface PnlResponse {
  points: PnlPoint[]
  total: number
}

/** /api/portfolio — qo'lda ushlab turilgan NFT'lar (maydonlar erkin) */
export interface PortfolioNft {
  id?: number | string
  nft_address?: string
  nft_name: string
  collection: string
  buy_price_ton?: number | null
  current_value_ton?: number | null
  quantity?: number
  marketplace?: string
  marketplace_url?: string | null
  acquired_at?: string | null
  image_url?: string | null
}

export interface BotStatus {
  is_running: boolean
  allowed_collections: string[]
  max_buy_price_ton: number
  min_profit_percent: number
  last_scan_at: string | null
  marketplaces_enabled: string[]
}

export interface CollectionStat {
  collection: string
  trades: number
  wins: number
  win_rate: number
  total_profit_ton: number
  avg_profit_ton: number
}
