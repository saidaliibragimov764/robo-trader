import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PnlPoint } from '../types'
import { fmtDayLabel, fmtTon } from '../lib/format'

const UP = '#10b981'
const DOWN = '#ef4444'

interface ChartRow extends PnlPoint {
  label: string
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const up = p.profit_ton >= 0
  return (
    <div className="glass glow-neon rounded-xl px-3 py-2 text-xs">
      <p className="font-bold text-muted">{p.label}</p>
      <p className={`num mt-1 font-extrabold ${up ? 'text-up' : 'text-down'}`}>
        {up ? '+' : '−'}
        {fmtTon(Math.abs(p.profit_ton))} TON
      </p>
      <p className="num mt-0.5 text-[10px] text-muted">{p.trades_count} ta savdo</p>
    </div>
  )
}

export function PnLChart({ points, total }: { points: PnlPoint[]; total: number }) {
  const data = useMemo<ChartRow[]>(
    () => points.map((p) => ({ ...p, label: fmtDayLabel(p.date) })),
    [points],
  )
  const color = total >= 0 ? UP : DOWN

  return (
    <div className="h-[210px] w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--tg-hint, #8b98a9)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            interval="preserveStartEnd"
          />
          <YAxis
            orientation="right"
            width={44}
            tick={{ fill: 'var(--tg-hint, #8b98a9)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(34,211,238,0.3)', strokeWidth: 1 }} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="profit_ton"
            stroke={color}
            strokeWidth={2}
            fill="url(#pnlFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: color, stroke: '#0a0e13', strokeWidth: 2 }}
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
