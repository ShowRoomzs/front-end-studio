import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  SettlementListParams,
  SettlementSort,
  SettlementStatus,
  StatementLineStatus,
  TaxInvoiceStatus,
} from "@/features/settlement/types"

export const SETTLEMENT_LIST_PATH = "/settlement"
export const GROUP_BUY_LIST_PATH = "/group-buy"

export const SETTLEMENT_QUERY_KEYS = {
  LIST: "creatorSettlementList",
  SUMMARY: "creatorSettlementSummary",
  DETAIL: "creatorSettlementDetail",
} as const

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  CONFIRMING: "정산 확인 중",
  ADJUSTING: "조정 협의",
  SCHEDULED: "지급 예정",
  PAID: "지급 완료",
}

/**
 * 시안 HEAD [상태색] — 정산 확인 중 = 정보(창이 열려 있지만 조치가 필수는 아니다) · 조정 협의 = 경고
 * (내 돈이 멈췄다) · 지급 예정 = 중립(rev.3 · 조치할 것 없는 대기) · 지급 완료 = 성공. 위험색은 쓰지 않는다.
 */
export const SETTLEMENT_STATUS_VARIANT: Record<
  SettlementStatus,
  StatusBadgeVariant
> = {
  CONFIRMING: "info",
  ADJUSTING: "warning",
  SCHEDULED: "neutral",
  PAID: "success",
}

export const TAX_INVOICE_STATUS_LABEL: Record<TaxInvoiceStatus, string> = {
  REQUIRED: "발행 필요",
  REVIEWING: "확인 중",
  REJECTED: "반려",
  APPROVED: "확인 완료",
}

/** 발행 필요 = 경고(내가 안 하면 지급되지 않는다) · 확인 중 = 정보 · 반려만 위험 · 확인 완료 = 성공 */
export const TAX_INVOICE_STATUS_VARIANT: Record<
  TaxInvoiceStatus,
  StatusBadgeVariant
> = {
  REQUIRED: "warning",
  REVIEWING: "info",
  REJECTED: "danger",
  APPROVED: "success",
}

export const SETTLEMENT_SORT_OPTIONS: Array<{
  value: SettlementSort
  label: string
}> = [
  { value: "CREATED_AT_DESC", label: "정산 생성일 최신순" },
  { value: "PAYOUT_DESC", label: "실지급액 높은순" },
]

export const SETTLEMENT_PAGE_SIZES = [20, 50] as const

export const SETTLEMENT_INITIAL_PARAMS: SettlementListParams = {
  statuses: ["CONFIRMING", "ADJUSTING", "SCHEDULED", "PAID"],
  keyword: "",
  sort: "CREATED_AT_DESC",
  page: 1,
  size: 20,
}

export const STATEMENT_LINE_LABEL: Record<StatementLineStatus, string> = {
  CONFIRMED: "확정",
  CANCELED: "취소",
  RETURNED: "반품",
}

/** 국세청 세금계산서 승인번호 — 숫자 24자리(하이픈 허용) */
export const APPROVAL_NO_DIGITS = 24
