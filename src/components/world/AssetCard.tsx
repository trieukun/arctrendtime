import { Bitcoin, Coins, Droplets, TrendingDown, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '@/components/common/Card'
import { ForecastStrip } from '@/components/common/ForecastStrip'
import { Sparkline } from '@/components/common/Sparkline'
import { fmtPct, fmtUsd } from '@/lib/format'
import type { WorldAsset } from '@/types/market'

const ICON = { btc: Bitcoin, gold: Coins, oil: Droplets } as const
const ICON_TONE = { btc: 'bg-orange-400/15 text-orange-300', gold: 'bg-amber-300/15 text-amber-200', oil: 'bg-sky-300/15 text-sky-200' } as const

export function AssetCard({ asset }: { asset: WorldAsset }) {
  const up = asset.changePct24h >= 0
  const Icon = ICON[asset.id]
  const Trend = up ? TrendingUp : TrendingDown
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl', ICON_TONE[asset.id])}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight text-white">{asset.name}</h3>
          <p className="text-sm text-slate-400">{asset.unit}</p>
        </div>
      </div>

      <div>
        <p className="font-display text-4xl font-semibold tracking-[-0.03em] text-white tabular-nums sm:text-[2.6rem]">{fmtUsd(asset.price, asset.id === 'btc' ? 0 : 2)}</p>
        <p className={clsx('mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums', up ? 'text-emerald-400' : 'text-rose-400')}>
          <Trend className="h-4 w-4" aria-hidden />
          {fmtPct(asset.changePct24h)}
          <span className="font-normal text-slate-400">so với phiên trước</span>
        </p>
        {asset.extra?.map((e) => (
          <p key={e.label} className="mt-1 text-sm text-slate-400">
            {e.label}: <span className="tabular-nums text-slate-200">{e.value}</span>
          </p>
        ))}
      </div>

      <Sparkline data={asset.series} positive={up} />
      <ForecastStrip forecasts={asset.forecasts} />
    </Card>
  )
}
