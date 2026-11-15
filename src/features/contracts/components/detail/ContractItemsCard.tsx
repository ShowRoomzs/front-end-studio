import DetailCard from "@/common/components/DetailCard/DetailCard"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import type { CreatorContractItem } from "@/features/contracts/types"
import {
  formatKRW,
  formatNumber,
  formatOptionExtra,
  formatPercent,
} from "@/features/contracts/utils/format"

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
            {/*
              옵션 상품 — 파트너 08 rev.10 「옵션별」 줄을 스튜디오 라벨로. 리워드는 옵션 판매가(공구가 + 옵션가)
              기준이라 옵션마다 다를 수 있고(BE 11-15) 상품 행 값은 기본 옵션 기준이다. 옛 서버라 옵션 값이 없으면 상품 값으로
            */}
            {(item.options ?? []).some(
              option => option.variantName !== null
            ) && (
              <div className="mt-1 text-[11px] text-sz-n-500">
                {item.options?.map((option, index) => (
                  <div key={option.variantId ?? `option-${index}`}>
                    {index === 0 && "옵션별 · "}
                    {option.variantName ?? "(삭제된 옵션)"}{" "}
                    {formatOptionExtra(option.optionExtraPrice)} — 정가{" "}
                    {formatNumber(option.regularPrice)} · 공구가{" "}
                    {formatNumber(option.salePrice)} · 개당 리워드{" "}
                    {formatNumber(option.unitReward ?? item.expectedUnitReward)}{" "}
                    ·{" "}
                    {option.brandSupplyQuantity === null
                      ? "—"
                      : `${option.brandSupplyQuantity.toLocaleString("ko-KR")}개`}
                  </div>
                ))}
              </div>
            )}
          </TermRow>
        ))}
      </Terms>
    </DetailCard>
  )
}
