import { ExternalLink } from 'lucide-react'
import { Card, Disclaimer, SectionTitle } from '@/components/common/Card'
import type { FedInfo } from '@/types/market'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-snug text-slate-100">{value}</p>
    </div>
  )
}

const pct = (n: number | null) => (n == null ? '—' : `${n.toFixed(2).replace('.', ',')}%`)

export function FedCard({ fed }: { fed: FedInfo }) {
  return (
    <Card>
      <SectionTitle title="Lãi suất FED" hint={`Số liệu FOMC đến ${fed.asOf}`} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="rounded-3xl bg-sky-200/10 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-sky-200/80">Khung lãi suất mục tiêu</p>
          <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em] text-white tabular-nums">{fed.targetRange}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{fed.marketPricing}</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-black/20 py-2">
              <dt className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Trái phiếu 10 năm</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{pct(fed.us10y)}</dd>
            </div>
            <div className="rounded-xl bg-black/20 py-2">
              <dt className="text-[11px] uppercase tracking-[0.06em] text-slate-400">T-bill 13 tuần</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{pct(fed.us13w)}</dd>
            </div>
            <div className="rounded-xl bg-black/20 py-2">
              <dt className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Chỉ số USD</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white">{fed.dxy == null ? '—' : fed.dxy.toFixed(2).replace('.', ',')}</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Fact label="Quyết định gần nhất" value={fed.lastDecision} />
            <Fact label="Biểu quyết" value={fed.vote} />
            <Fact label="Cuộc họp kế tiếp" value={fed.nextMeeting} />
            <Fact label="Lạm phát Mỹ" value={fed.inflation} />
          </div>
          <ul className="space-y-1.5 text-sm leading-relaxed text-slate-300">
            {fed.outlook.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-200" aria-hidden />
                <span className="text-pretty">{o}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {fed.sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[32px] items-center gap-1 text-xs text-slate-400 underline-offset-4 hover:text-sky-200 hover:underline">
                {s.label}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ))}
          </div>
          <Disclaimer>Khung lãi suất và xác suất là số liệu công bố tại ngày ghi trên. Lợi suất và chỉ số USD lấy trực tiếp khi làm mới.</Disclaimer>
        </div>
      </div>
    </Card>
  )
}
