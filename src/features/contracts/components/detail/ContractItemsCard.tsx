import DetailCard from "@/common/components/DetailCard/DetailCard"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import type { CreatorContractItem } from "@/features/contracts/types"
import { formatKRW, formatPercent } from "@/features/contracts/utils/format"

interface ContractItemsCardProps {
  items: Array<CreatorContractItem>
  showSettlementNote: boolean
}

/** 「계약 상품 항목」 — 스튜디오 관점 라벨: 내 리워드율 · 개당 리워드 · 브랜드 준비 물량(§25-6-3) */
export default function ContractItemsCard(props: ContractItemsCardProps) {
  const { items, showSettlementNote } = props

  return (
    <DetailCard
      title="계약 상품 항목"
      note={
        showSettlementNote
          ? `${items.length}건 · 정산이 이 리워드율을 사용합니다`
          : `${items.length}건`
      }
    >
      <Terms>
        {items.map(item => (
          <TermRow
            key={item.contractItemId}
            label={item.productName ?? "상품"}
            labelWidth={176}
            className="tabular-nums"
          >
            정가 {formatKRW(item.regularPrice)} · 공구가{" "}
            <b className="font-semibold text-sz-n-900">
              {formatKRW(item.groupBuyPrice)}
            </b>{" "}
            · 내 리워드율{" "}
            <b className="font-semibold text-sz-n-900">
              {formatPercent(item.myRewardRate)}
            </b>{" "}
            · 개당 리워드 {formatKRW(item.expectedUnitReward)} · 브랜드 준비
            물량{" "}
            {item.brandSupplyQuantity === null
              ? "—"
              : `${item.brandSupplyQuantity.toLocaleString("ko-KR")}개`}
          </TermRow>
        ))}
      </Terms>
    </DetailCard>
  )
}
