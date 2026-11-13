import type { BanksData, VnData } from '@/types/market'
import { BankSection } from './BankSection'
import { FuelSection } from './FuelSection'
import { GoldSection } from './GoldSection'

export function VnTab({ vn, banks }: { vn: VnData | null; banks: BanksData | null }) {
  return (
    <div className="space-y-5">
      {vn ? (
        <>
          <GoldSection data={vn} />
          <FuelSection data={vn} />
          {vn.warnings.length ? (
            <ul className="space-y-1 text-xs text-amber-300/90">
              {vn.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      {banks ? <BankSection data={banks} /> : null}
    </div>
  )
}
