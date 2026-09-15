import WebApp from '@twa-dev/sdk'

/**
 * Telegram Mini App integratsiyasi:
 *  - expand + to'q sariq header
 *  - themeColors'ni o'qib CSS o'zgaruvchilarga yozamiz (accent har doim,
 *    fon/faqaat faqat Telegram qora(traffic) rejimida — neon dizayn buzilmasin).
 */

function hexLuma(color?: string): number | null {
  if (!color) return null
  let hex = color.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function setupTelegram(): void {
  try {
    const tg = WebApp as unknown as {
      ready?: () => void
      expand?: () => void
      setHeaderColor?: (c: string) => void
      setBackgroundColor?: (c: string) => void
      themeParams?: Record<string, string | undefined>
    }
    tg.ready?.()
    tg.expand?.()
    tg.setHeaderColor?.('#0a0e13')
    tg.setBackgroundColor?.('#0a0e13')

    const p = tg.themeParams ?? {}
    const root = document.documentElement
    const setVar = (name: string, value: string | undefined) => {
      if (value) root.style.setProperty(name, value)
    }
    setVar('--tg-accent', p.link_color ?? p.button_color)

    const bgLuma = hexLuma(p.bg_color)
    const textLuma = hexLuma(p.text_color)
    if (bgLuma != null && bgLuma < 0.25 && textLuma != null && textLuma > 0.6) {
      // Telegram Dark rejimi — uning haqiqiy ranglarini qo'llaymiz
      setVar('--tg-bg', p.bg_color)
      setVar('--tg-text', p.text_color)
      setVar('--tg-hint', p.hint_color)
      root.dataset.tgDark = '1'
    }
  } catch {
    /* Telegram ichida bo'lmasa — oddiy veb ko'rinish */
  }
}

/** Marketplace kabi tashqi havolalarni Telegram BrauzerOrqali ochish */
export function openExternal(url: string): void {
  if (!url) return
  try {
    const tg = WebApp as unknown as { openTelegramLink?: (u: string) => void; openLink?: (u: string) => void }
    if (tg.openLink) {
      tg.openLink(url)
      return
    }
  } catch {
    /* fallthrough */
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export const haptics = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    ;(WebApp as unknown as { HapticFeedback?: { impactOccurred?: (o: string) => void } }).HapticFeedback?.impactOccurred?.(style)
  } catch {
    /* yo'q bo'lsa jimgina o'tamiz */
  }
}
