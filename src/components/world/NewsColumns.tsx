import { ArrowDown, ArrowUp, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, Disclaimer, SectionTitle } from '@/components/common/Card'
import { timeAgo } from '@/lib/format'
import type { ImpactKey, NewsItem } from '@/types/market'

const LABEL: Record<ImpactKey, string> = { btc: 'Bitcoin', crypto: 'Crypto', gold: 'Vàng', oil: 'Dầu', rates: 'Lãi suất' }
const ORDER: ImpactKey[] = ['btc', 'crypto', 'gold', 'oil', 'rates']

function Impact({ k, v }: { k: ImpactKey; v: number }) {
  const up = v > 0
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        up ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400' : 'border-rose-400/20 bg-rose-400/10 text-rose-400',
      )}
    >
      {LABEL[k]}
      {up ? <ArrowUp className="h-3 w-3" aria-label="tăng" /> : <ArrowDown className="h-3 w-3" aria-label="giảm" />}
      {Math.abs(v) >= 2 ? <span className="text-[10px] opacity-80">mạnh</span> : null}
    </span>
  )
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <li className="rounded-2xl bg-white/[0.04] p-4">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
        <p className="text-pretty text-sm font-medium leading-snug text-slate-100 group-hover:text-sky-200">
          {item.title}
          <ExternalLink className="ml-1 inline h-3 w-3 text-slate-500" aria-hidden />
        </p>
      </a>
      <p className="mt-1 text-xs text-slate-400">
        {item.source} · {timeAgo(item.publishedAt)} · {item.topic}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {ORDER.map((k) => {
          const v = item.impacts[k]
          return v ? <Impact key={k} k={k} v={v} /> : null
        })}
      </div>
    </li>
  )
}

function Column({ title, tone, items }: { title: string; tone: 'good' | 'bad'; items: NewsItem[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={clsx('h-2.5 w-2.5 rounded-full', tone === 'good' ? 'bg-emerald-400' : 'bg-rose-400')} aria-hidden />
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <span className="text-xs tabular-nums text-slate-400">{items.length} tin</span>
      </div>
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((n) => (
            <NewsRow key={n.url + n.title} item={n} />
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-slate-400">Chưa có tin nào trong 48 giờ qua.</p>
      )}
    </div>
  )
}

export function NewsColumns({ news }: { news: { good: NewsItem[]; bad: NewsItem[]; other?: NewsItem[] } }) {
  const other = news.other ?? []
  return (
    <Card>
      <SectionTitle title="Tin tức ảnh hưởng thị trường" hint="48 giờ gần nhất, tự phân loại" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Column title="Tin xấu" tone="bad" items={news.bad} />
        <Column title="Tin tốt" tone="good" items={news.good} />
      </div>
      {other.length ? (
        <details className="mt-6">
          <summary className="inline-flex min-h-[36px] cursor-pointer list-none items-center text-sm text-slate-300 underline-offset-4 hover:text-white hover:underline">
            Tin riêng về vàng, dầu ({other.length})
          </summary>
          <ul className="mt-3 grid gap-2.5 lg:grid-cols-2">
            {other.map((n) => (
              <NewsRow key={n.url + n.title} item={n} />
            ))}
          </ul>
        </details>
      ) : null}
      <div className="mt-5">
        <Disclaimer>
          Tin tốt hoặc xấu được xếp theo tác động lên tâm lý thị trường và Bitcoin. Mũi tên trên mỗi tin là hướng tác động dự kiến lên từng loại tài sản.
          Việc phân loại dựa trên tiêu đề bằng bộ quy tắc từ khóa nên có thể chưa chính xác.
        </Disclaimer>
      </div>
    </Card>
  )
}
