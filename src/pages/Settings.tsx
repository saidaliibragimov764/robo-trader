import { ExternalLink, RefreshCw, ServerCog, Settings2, ShieldCheck, Store, Timer } from 'lucide-react'
import { Card, ErrorState, SectionTitle, SkeletonCard, Skeleton, StatusPill } from '../components/ui'
import { useBotStatus } from '../hooks/useApi'
import { fmtDateTime, fmtTon, marketLabel, timeAgo } from '../lib/format'
import { openExternal } from '../lib/telegram'

const CONFIG_URL = (import.meta.env.VITE_USERBOT_CONFIG_URL ?? '').trim()

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
      </div>
      <p className="num shrink-0 text-[13px] font-extrabold text-neon">{value}</p>
    </div>
  )
}

export default function Settings() {
  const { data: bot, isLoading, isError, error, refetch, isFetching } = useBotStatus()

  return (
    <div className="space-y-4">
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
        </>
      ) : (
        <>
          {/* Bot holati */}
          <Card className="animate-rise p-4" glow={bot?.is_running ? 'up' : 'down'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                    bot?.is_running ? 'border-up/40 bg-up/10 text-up' : 'border-down/40 bg-down/10 text-down'
                  }`}
                >
                  <ServerCog size={20} className={bot?.is_running ? 'animate-[spin_6s_linear_infinite]' : ''} />
                </div>
                <div>
                  <p className="text-sm font-extrabold">Trading Bot</p>
                  <p className="num mt-0.5 text-[11px] text-muted">Python userbot · VPS</p>
                </div>
              </div>
              <StatusPill running={bot?.is_running} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                <Timer size={12} className="text-warn" />
                Oxirgi skan: {bot?.last_scan_at ? timeAgo(bot.last_scan_at) : '—'}
              </span>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] font-bold text-neon"
              >
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
                Yangilash
              </button>
            </div>
            {bot?.last_scan_at && (
              <p className="num mt-1 text-right text-[10px] text-muted/70">{fmtDateTime(bot.last_scan_at)}</p>
            )}
          </Card>

          {/* Strategiya */}
          <div>
            <SectionTitle icon={ShieldCheck} title="Strategiya (read-only)" />
            <Card className="divide-y divide-line/50 px-4 py-1">
              <Row
                label="Maksimal xarid narxi"
                value={`${fmtTon(bot?.max_buy_price_ton)} TON`}
                hint="Shu narxdan qimmat NFT’lar o’tkazib yuboriladi"
              />
              <Row
                label="Minimal foyda"
                value={`${bot?.min_profit_percent != null ? bot.min_profit_percent.toFixed(1) : '—'} %`}
                hint="Kamida shu % foyda bilan sotishga uriladi"
              />
              <div className="flex items-center justify-between py-2.5 text-[11px] font-semibold text-muted">
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={11} /> Ma’lumotlar har 30s yangilanadi
                </span>
                <span>Ochiq</span>
              </div>
            </Card>
          </div>

          {/* Collections */}
          <div>
            <SectionTitle icon={Settings2} title={`Ruxsat etilgan collection’lar (${bot?.allowed_collections?.length ?? 0})`} />
            <Card className="p-4">
              {bot?.allowed_collections?.length ? (
                <div className="flex flex-wrap gap-2">
                  {bot.allowed_collections.map((c) => (
                    <span key={c} className="chip border-neon/30 bg-neon/10 text-neon">
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">Collection’lar ro‘yxati bo‘sh</p>
              )}
            </Card>
          </div>

          {/* Marketplaces */}
          <div>
            <SectionTitle icon={Store} title="Faol marketplace’lar" />
            <Card className="p-4">
              {bot?.marketplaces_enabled?.length ? (
                <div className="grid grid-cols-1 gap-2">
                  {bot.marketplaces_enabled.map((m) => (
                    <div key={m} className="flex items-center justify-between rounded-xl border border-line/70 bg-bg/40 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-[13px] font-bold">
                        <Store size={14} className="text-warn" />
                        {marketLabel(m)}
                      </span>
                      <span className="chip border-up/30 bg-up/10 text-up">Ulangan</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">Marketplace’lar ko‘rsatilmagan</p>
              )}
            </Card>
          </div>

          {/* Config */}
          <Card className="p-4">
            <p className="text-xs leading-relaxed text-muted">
              Sozlamalar hozircha <span className="font-bold text-warn">faqat o‘qish</span> rejimida — boshqarish Python
              userbotning <span className="num font-bold text-[var(--tg-text)]">.env</span> faylida (VPS).
            </p>
            <button
              onClick={() => openExternal(CONFIG_URL || 'https://github.com')}
              disabled={!CONFIG_URL}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-neon/40 bg-neon/10 py-3 text-[13px] font-extrabold text-neon shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)] disabled:opacity-40"
            >
              Open Userbot Config
              <ExternalLink size={14} />
            </button>
            {!CONFIG_URL && (
              <p className="mt-2 text-center text-[10px] text-muted/70">
                .env da VITE_USERBOT_CONFIG_URL ni to‘ldiring (masalan, Portainer/SSH panel havolasi)
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
