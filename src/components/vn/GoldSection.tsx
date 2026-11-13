import { clsx } from 'clsx'
import { Card, Disclaimer, SectionTitle } from '@/components/common/Card'
import { ForecastStrip } from '@/components/common/ForecastStrip'
import { fmtSignedVnd, fmtVnd } from '@/lib/format'
import type { GoldRow, VnData } from '@/types/market'

function Price({ label, value, change }: { label: string; value: number | null; change: number | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">{fmtVnd(value)}</p>
      {change != null ? (
        <p className={clsx('text-xs tabular-nums', change > 0 ? 'text-emerald-400' : change < 0 ? 'text-rose-400' : 'text-slate-400')}>
          {fmtSignedVnd(change)} so với phiên trước
        </p>
      ) : (
        <p className="text-xs text-slate-500">&nbsp;</p>
      )}
    </div>
  )
}

function GoldCard({ row }: { row: GoldRow }) {
  return (
    <div className="rounded-3xl bg-white/[0.04] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-display text-base font-semibold text-white">{row.name}</h3>
        <span className="text-xs text-slate-400">{row.note}</span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Price label="Mua vào" value={row.buy} change={row.buyChange} />
        <Price label="Bán ra" value={row.sell} change={row.sellChange} />
      </div>
      <ForecastStrip forecasts={row.forecasts} />
    </div>
  )
}

export function GoldSection({ data }: { data: VnData }) {
  return (
    <Card>
      <SectionTitle title="Giá vàng trong nước" hint="Đơn vị: đồng/lượng" />
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-300">
        {data.worldGoldUsd != null && data.usdVnd != null ? (
          <span className="rounded-full bg-white/5 px-3 py-1 tabular-nums">
            Vàng thế giới {data.worldGoldUsd.toFixed(2)} USD/oz · USD/VND {fmtVnd(Math.round(data.usdVnd))}
          </span>
        ) : null}
        {data.sjcPremiumPct != null ? (
          <span className="rounded-full bg-white/5 px-3 py-1 tabular-nums">SJC bán ra cao hơn giá quy đổi thế giới khoảng {data.sjcPremiumPct.toFixed(1).replace('.', ',')}%</span>
        ) : null}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {data.gold.map((g) => (
          <GoldCard key={g.id} row={g} />
        ))}
      </div>
      <div className="mt-4">
        <Disclaimer>
          Các nguồn công bố vàng 9999, 98 và 95 theo từng thương hiệu khác nhau, nên mỗi dòng ghi rõ thương hiệu. Chưa tìm thấy bảng giá vàng 96% công khai nên hiển thị vàng 95% của Mi Hồng
          (chỉ có giá mua). Dự báo bám theo vàng thế giới, không tính chênh lệch từng cửa hàng.
        </Disclaimer>
      </div>
    </Card>
  )
}
