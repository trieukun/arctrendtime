import { CalendarClock } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, Disclaimer, SectionTitle } from '@/components/common/Card'
import { ForecastStrip } from '@/components/common/ForecastStrip'
import { fmtSignedVnd, fmtVnd, fmtWeekdayTime } from '@/lib/format'
import type { FuelRow, VnData } from '@/types/market'

function FuelCard({ row }: { row: FuelRow }) {
  const ch = row.changeLastAdjust
  return (
    <div className="rounded-3xl bg-white/[0.04] p-4 sm:p-5">
      <h3 className="mb-3 font-display text-base font-semibold text-white">{row.name}</h3>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Vùng 1</p>
          <p className="mt-0.5 font-display text-xl font-semibold text-white tabular-nums sm:text-2xl">{fmtVnd(row.region1)}</p>
          <p className="text-xs text-slate-500">đ/lít</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Vùng 2</p>
          <p className="mt-0.5 font-display text-xl font-semibold text-white tabular-nums sm:text-2xl">{fmtVnd(row.region2)}</p>
          <p className="text-xs text-slate-500">đ/lít</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Kỳ vừa rồi</p>
          <p className={clsx('mt-0.5 font-display text-xl font-semibold tabular-nums sm:text-2xl', ch == null ? 'text-slate-400' : ch > 0 ? 'text-emerald-400' : ch < 0 ? 'text-rose-400' : 'text-slate-300')}>
            {fmtSignedVnd(ch)}
          </p>
          <p className="text-xs text-slate-500">đ/lít</p>
        </div>
      </div>
      <ForecastStrip forecasts={row.forecasts} />
    </div>
  )
}

export function FuelSection({ data }: { data: VnData }) {
  return (
    <Card>
      <SectionTitle title="Giá xăng dầu bán lẻ" hint={data.fuelSource} />
      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-sky-200/10 p-4 text-sm text-slate-200">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" aria-hidden />
        <p className="text-pretty">
          Giá bán lẻ điều chỉnh theo kỳ hằng tuần. Kỳ vừa rồi: <b className="font-semibold text-white">{fmtWeekdayTime(data.lastFuelAdjust)}</b>. Kỳ tới:{' '}
          <b className="font-semibold text-white">{fmtWeekdayTime(data.nextFuelAdjust)}</b>. Vì vậy các khung 15 phút, 1 giờ, 24 giờ thường đi ngang.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {data.fuel.map((f) => (
          <FuelCard key={f.id} row={f} />
        ))}
      </div>
      <div className="mt-4">
        <Disclaimer>Dự báo 1 tuần và 1 tháng dựa trên xu hướng giá dầu thế giới và tin tức; mức điều chỉnh thực tế còn phụ thuộc thuế, quỹ bình ổn và tỷ giá.</Disclaimer>
      </div>
    </Card>
  )
}
