import { Card, Disclaimer, SectionTitle } from '@/components/common/Card'
import type { BankInfo, BanksData } from '@/types/market'

function LoanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-slate-300">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums text-white">{value}</dd>
    </div>
  )
}

function BankCard({ bank }: { bank: BankInfo }) {
  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-white/[0.04] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-white">{bank.name}</h3>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">Cập nhật {bank.depositAsOf}</span>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Lãi suất tiết kiệm (%/năm)</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
              <th className="pb-1.5 font-medium">Kỳ hạn</th>
              <th className="pb-1.5 text-right font-medium">Tại quầy</th>
              <th className="pb-1.5 text-right font-medium">Online</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bank.deposits.map((d) => (
              <tr key={d.term}>
                <td className="py-2 text-slate-300">{d.term}</td>
                <td className="py-2 text-right tabular-nums text-white">{d.counter}</td>
                <td className="py-2 text-right tabular-nums text-sky-200">{d.online}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Lãi suất cho vay</p>
        <dl className="divide-y divide-white/5">
          <LoanLine label="Vay tín chấp (tín dụng)" value={bank.loans.unsecured} />
          <LoanLine label="Vay thế chấp" value={bank.loans.mortgage} />
          <div className="py-2.5">
            <dt className="text-sm text-slate-300">Vay thấu chi</dt>
            <dd className="mt-1 text-pretty text-sm leading-snug text-white">{bank.loans.overdraft}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-auto space-y-1 text-[11px] leading-relaxed text-slate-500">
        <p>Nguồn tiết kiệm: {bank.depositSource}</p>
        <p>Nguồn cho vay: {bank.loanSource}</p>
      </div>
    </div>
  )
}

export function BankSection({ data }: { data: BanksData }) {
  return (
    <Card>
      <SectionTitle title="Lãi suất ngân hàng" hint="Agribank, Vietcombank, Sacombank" />
      <div className="grid gap-4 xl:grid-cols-3">
        {data.banks.map((b) => (
          <BankCard key={b.id} bank={b} />
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        <Disclaimer>
          Ngân hàng không niêm yết một mức cố định cho lãi suất cho vay: mức thật phụ thuộc hồ sơ, tài sản bảo đảm và thời điểm giải ngân, nên các con số vay là khung công bố gần nhất.
          Lãi gửi tại quầy của Agribank và Vietcombank được tải trực tiếp mỗi lần làm mới; các ô còn lại là số liệu công bố gần nhất ghi ở phần nguồn. Dấu — nghĩa là chưa tìm được số công bố.
        </Disclaimer>
        {data.warnings.map((w) => (
          <p key={w} className="text-xs text-amber-300/90">
            {w}
          </p>
        ))}
      </div>
    </Card>
  )
}
