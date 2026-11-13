import { Disclaimer } from '@/components/common/Card'
import type { WorldData } from '@/types/market'
import { AssetCard } from './AssetCard'
import { HeadlineTicker } from './HeadlineTicker'
import { FedCard } from './FedCard'
import { NewsColumns } from './NewsColumns'

export function WorldTab({ data }: { data: WorldData }) {
  return (
    <div className="space-y-5">
      <HeadlineTicker />
      <div className="grid gap-5 lg:grid-cols-3">
        {data.assets.map((a) => (
          <AssetCard key={a.id} asset={a} />
        ))}
      </div>
      <Disclaimer>
        Dự báo tăng hoặc giảm được tính từ động lượng giá, đường trung bình và RSI của từng khung thời gian, cộng thêm độ lệch của tin tức gần đây. Độ tin cậy là điểm
        của mô hình, không phải xác suất thực. Chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
      </Disclaimer>
      <FedCard fed={data.fed} />
      <NewsColumns news={data.news} />
      {data.warnings.length ? (
        <ul className="space-y-1 text-xs text-amber-300/90">
          {data.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
