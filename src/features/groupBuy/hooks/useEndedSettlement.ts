import type { Detail } from "@/features/groupBuy/utils/view"
import { SETTLEMENT_QUERY_KEYS } from "@/features/settlement/constants/params"
import { useGetSettlementDetail } from "@/features/settlement/hooks/useSettlementQueries"
import { settlementService } from "@/features/settlement/services/settlementService"
import type {
  SettlementStatus,
  SettlementTone,
} from "@/features/settlement/types"
import { useQuery } from "@tanstack/react-query"

/** 시안 09 B11 「정산으로 이관」 — 종료 공구에 생긴 정산 */
export interface EndedSettlement {
  settlementId: number
  status: SettlementStatus
  statusLabel: string
  statusTone: SettlementTone
  /** 정산 확인 마감 — 정산 상세를 받기 전이면 null */
  reviewDueAt: string | null
  /** 주문 전부 종결 시각 — 정산 상세를 받기 전이면 null */
  ordersClosedAt: string | null
}

/**
 * 종료(ENDED) 공구의 정산이 생겼는지 — 공구 상세는 정산완료(SETTLED)에서만 `settlement`를 주므로
 * 주문이 전부 종결된 종료 공구만 정산 목록(공구명 검색)에서 같은 groupBuyId를 찾고,
 * 확인 마감은 정산 상세에서 읽는다. 정산이 아직 없으면(10분 배치 전) null — B7 그대로.
 */
export function useEndedSettlement(
  detail: Detail | undefined
): EndedSettlement | null {
  const groupBuyId = detail?.groupBuy.groupBuyId
  const unclosed = detail?.orderClosure?.unclosed.total
  // 판매 모듈이 건수를 모르면(orderClosure null) 일단 찾아본다
  const enabled =
    detail?.groupBuy.status === "ENDED" &&
    (unclosed === undefined || unclosed === 0)

  const { data: list } = useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, "groupBuy", groupBuyId],
    queryFn: () =>
      settlementService.getList({
        status: [],
        keyword: detail?.groupBuy.title ?? "",
        sort: "CREATED_DESC",
        page: 1,
        size: 100,
      }),
    enabled,
  })
  const row = enabled
    ? list?.content.find(item => item.groupBuyId === groupBuyId)
    : undefined
  const { data: settlement } = useGetSettlementDetail(
    row?.settlementId ?? Number.NaN
  )

  if (!row) {
    return null
  }
  const header = settlement?.settlement
  return {
    settlementId: row.settlementId,
    status: header?.status ?? row.status,
    statusLabel: header?.statusLabel ?? row.statusLabel,
    statusTone: header?.statusTone ?? row.statusTone,
    reviewDueAt: settlement
      ? (settlement.review?.requestDeadlineAt ??
        settlement.timeline.reviewDueAt)
      : null,
    ordersClosedAt: settlement?.timeline.ordersClosedAt ?? null,
  }
}
