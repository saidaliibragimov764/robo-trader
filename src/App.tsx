import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Gem, History, LayoutDashboard, Settings as SettingsIcon, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import HistoryPage from './pages/History'
import Settings from './pages/Settings'
import { StatusPill } from './components/ui'
import { useBotStatus } from './hooks/useApi'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

type TabId = 'dashboard' | 'portfolio' | 'history' | 'settings'

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  { id: 'history', label: 'Tarix', icon: History },
  { id: 'settings', label: 'Sozlamalar', icon: SettingsIcon },
]

function BotBadge() {
  const { data } = useBotStatus()
  return <StatusPill running={data?.is_running} size="sm" />
}

function Shell() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const nav = (t: TabId) => {
    setTab(t)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  return (
    <div className="bg-grid min-h-dvh">
      {/* Fon nuri */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 mx-auto h-48 max-w-2xl bg-[radial-gradient(60%_100%_at_50%_0%,rgba(34,211,238,0.12),transparent_70%)]" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
          <button onClick={() => nav('dashboard')} className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-neon/40 bg-neon/10 shadow-[0_0_16px_-2px_rgba(34,211,238,0.55)]">
              <Gem size={15} className="text-neon" />
            </span>
            <span className="text-[15px] font-extrabold tracking-tight">
              NFT<span className="text-neon text-glow-neon">TRADER</span>
            </span>
          </button>
          <BotBadge />
        </div>
      </header>

      {/* Kontent */}
      <main className="relative z-10 mx-auto w-full max-w-2xl px-3 pb-28 pt-4">
        {tab === 'dashboard' && <Dashboard onNavigate={nav} />}
        {tab === 'portfolio' && <Portfolio />}
        {tab === 'history' && <HistoryPage />}
        {tab === 'settings' && <Settings />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line/60 bg-surface/75 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-stretch justify-around px-2">
          {TABS.map((t) => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => nav(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 ${
                  active ? 'text-neon' : 'text-muted'
                }`}
              >
                {active && (
                  <span className="absolute -top-[7px] h-[3px] w-8 rounded-full bg-neon shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                )}
                <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
                <span className={`text-[10px] ${active ? 'font-extrabold' : 'font-semibold'}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  )
}
