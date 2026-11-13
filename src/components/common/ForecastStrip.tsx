import { ArrowDown, ArrowUp, ChevronDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'
import { HORIZONS, HORIZON_LABEL } from '@/types/market'
import type { Direction, ForecastMap } from '@/types/market'
import { fmtPct } from '@/lib/format'

const DIR_TEXT: Record<Direction, string> = { up: 'Tăng', down: 'Giảm', flat: 'Đi ngang' }
const TONE: Record<Direction, { box: string; badge: string; bar: string; text: string }> = {
  up: { box: 'border-emerald-400/20 bg-emerald-400/[0.07]', badge: 'bg-emerald-400/15 text-emerald-300', bar: 'bg-emerald-400', text: 'text-emerald-300' },
  down: { box: 'border-rose-400/20 bg-rose-400/[0.07]', badge: 'bg-rose-400/15 text-rose-300', bar: 'bg-rose-400', text: 'text-rose-300' },
  flat: { box: 'border-white/10 bg-white/[0.04]', badge: 'bg-white/10 text-slate-300', bar: 'bg-slate-400', text: 'text-slate-300' },
}

export function DirIcon({ dir, className }: { dir: Direction; className?: string }) {
  const Icon = dir === 'up' ? ArrowUp : dir === 'down' ? ArrowDown : Minus
  return <Icon className={className} aria-hidden strokeWidth={2.5} />
}

export function ForecastStrip({ forecasts }: { forecasts: ForecastMap }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Dự báo</p>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {HORIZONS.map((h) => {
          const f = forecasts[h]
          const t = TONE[f.dir]
          const level = Math.max(8, Math.min(100, ((f.confidence - 50) / 30) * 100))
          return (
            <div key={h} className={clsx('flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-1 pb-3 pt-2.5 text-center', t.box)} title={f.reason}>
              <span className="text-[11px] font-medium text-slate-400 sm:text-xs">{HORIZON_LABEL[h]}</span>
              <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9', t.badge)}>
                <DirIcon dir={f.dir} className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className={clsx('text-xs font-semibold sm:text-sm', t.text)}>{DIR_TEXT[f.dir]}</span>
              <span className="text-xs tabular-nums text-slate-200 sm:text-sm">{fmtPct(f.movePct)}</span>
              <div className="w-3/4" aria-label={`Độ tin cậy ${f.confidence}%`}>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div className={clsx('h-full rounded-full', t.bar)} style={{ width: `${level}%` }} />
                </div>
                <span className="mt-1 block text-[11px] tabular-nums text-slate-400">{f.confidence}%</span>
              </div>
            </div>
          )
        })}
      </div>
      <details className="group mt-3">
        <summary className="inline-flex min-h-[32px] cursor-pointer list-none items-center gap-1 text-sm text-slate-400 hover:text-slate-100 [&::-webkit-details-marker]:hidden">
          Căn cứ dự báo
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-300">
          {HORIZONS.map((h) => (
            <li key={h} className="flex gap-3">
              <span className="w-16 shrink-0 text-slate-500">{HORIZON_LABEL[h]}</span>
              <span className="text-pretty">{forecasts[h].reason}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Thanh dưới mỗi ô là độ tin cậy của mô hình (50% đến 80%), không phải xác suất.</p>
      </details>
    </div>
  )
}
