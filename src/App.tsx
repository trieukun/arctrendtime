import { useState } from 'react'
import { Globe2, Landmark, Loader2, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { VnTab } from '@/components/vn/VnTab'
import { WorldTab } from '@/components/world/WorldTab'
import { fmtDateTime } from '@/lib/format'
import { useMarket } from '@/lib/useMarket'

type TabId = 'world' | 'vn'

const TABS: { id: TabId; label: string; icon: typeof Globe2 }[] = [
  { id: 'world', label: 'Thế giới', icon: Globe2 },
  { id: 'vn', label: 'Trong nước', icon: Landmark },
]

export default function App() {
  const [tab, setTab] = useState<TabId>('world')
  const { world, vn, banks, loading, errors, refresh } = useMarket()
  const stamp = tab === 'world' ? world?.updatedAt : vn?.updatedAt
  const empty = tab === 'world' ? !world : !vn && !banks

  return (
    <div className="min-h-dvh bg-[#0a0f1f] font-body text-slate-200">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(125,211,252,0.10),transparent)]" aria-hidden />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1f]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-tight text-white">Bảng giá thị trường</h1>
            <p className="text-sm text-slate-400">{stamp ? `Cập nhật lúc ${fmtDateTime(stamp)}` : 'Chưa có dữ liệu'}</p>
          </div>

          <nav className="order-last flex w-full gap-1 rounded-2xl bg-white/[0.06] p-1 sm:order-none sm:w-auto" aria-label="Danh mục">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={clsx(
                  'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors sm:flex-none',
                  tab === id ? 'bg-sky-200 text-slate-900' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
            {loading ? 'Đang cập nhật' : 'Làm mới'}
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
        {errors.length ? (
          <div role="alert" className="mb-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-200">
            {errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
            <p className="mt-1 text-xs text-amber-200/80">Kiểm tra dịch vụ dữ liệu đang chạy (bun run api) rồi bấm Làm mới lại.</p>
          </div>
        ) : null}

        {empty ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            {loading ? (
              <p className="flex items-center justify-center gap-2 text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Đang tải dữ liệu thị trường
              </p>
            ) : (
              <p className="text-slate-300">Chưa có dữ liệu. Bấm Làm mới để tải.</p>
            )}
          </div>
        ) : tab === 'world' && world ? (
          <WorldTab data={world} />
        ) : (
          <VnTab vn={vn} banks={banks} />
        )}

        <p className="mx-auto mt-10 max-w-xl text-pretty text-center text-[13px] leading-relaxed text-slate-500">
          Thông tin chỉ cập nhật khi bạn bấm Làm mới. Số liệu tổng hợp từ nguồn công khai, mang tính tham khảo, không phải khuyến nghị đầu tư.
        </p>
      </main>
    </div>
  )
}
