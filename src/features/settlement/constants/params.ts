import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  SettlementConfirmReason,
  SettlementListParams,
  SettlementPartySort,
  SettlementStatus,
  SettlementTone,
  TaxInvoiceCardStatus,
} from "@/features/settlement/types"

export const SETTLEMENT_LIST_PATH = "/settlement"
export const GROUP_BUY_LIST_PATH = "/group-buy"

export const SETTLEMENT_QUERY_KEYS = {
  LIST: "creatorSettlementList",
  SUMMARY: "creatorSettlementSummary",
  DETAIL: "creatorSettlementDetail",
  ITEMS: "creatorSettlementItems",
  ADJUSTMENT_PREVIEW: "creatorSettlementAdjustmentPreview",
  PROFILE_TAX: "creatorSettlementProfileTax",
} as const

/** GNB 배지 — 계약 · 공구 배지와 같은 주기 */
export const SETTLEMENT_SUMMARY_POLL_INTERVAL = 30_000

/**
 * 상태 칩 문구 — 칩은 건수만 오고 라벨이 없어 서버 enum 라벨(`SettlementStatus.label`)을 그대로 옮겨 둔다.
 * 표 · 상세 배지는 응답의 `statusLabel`을 쓴다.
 */
export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  REVIEWING: "정산 확인 중",
  ADJUSTING: "조정 협의",
  PAYOUT_SCHEDULED: "지급 예정",
  PAID: "지급 완료",
}

/** 서버 톤 → 배지 색. 매핑은 서버 enum이 정한다(정산 확인 중 = 정보 · 조정 협의 = 경고 · 지급 예정 = 중립 · 지급 완료 = 성공) */
export const TONE_VARIANT: Record<SettlementTone, StatusBadgeVariant> = {
  NEUTRAL: "neutral",
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  DANGER: "danger",
}

export const TAX_INVOICE_STATUS_LABEL: Record<TaxInvoiceCardStatus, string> = {
  PENDING_INPUT: "발행 필요",
  SUBMITTED: "확인 중",
  REJECTED: "반려",
  VERIFIED: "확인 완료",
}

/** 발행 필요 = 경고(내가 안 하면 지급되지 않는다) · 확인 중 = 정보 · 반려만 위험 · 확인 완료 = 성공 */
export const TAX_INVOICE_STATUS_VARIANT: Record<
  TaxInvoiceCardStatus,
  StatusBadgeVariant
> = {
  PENDING_INPUT: "warning",
  SUBMITTED: "info",
  REJECTED: "danger",
  VERIFIED: "success",
}

/** 요약 바 「정산 근거」 꼬리 — 시안 문구(서버 `confirmReasonLabel`은 「자동 확정」 같은 이름이라 근거 문장으로 쓴다) */
export const CONFIRM_REASON_TEXT: Record<SettlementConfirmReason, string> = {
  AUTO: "확인 기간 중 요청 없음",
  AGREED: "조정 합의로 확정",
  EXPIRED: "합의 기한 경과 · 원래 금액 확정",
}

export const SETTLEMENT_SORT_OPTIONS: Array<{
  value: SettlementPartySort
  label: string
}> = [
  { value: "CREATED_DESC", label: "정산 생성일 최신순" },
  { value: "PAYOUT_DESC", label: "실지급액 높은순" },
]

export const SETTLEMENT_PAGE_SIZES = [20, 50] as const

export const SETTLEMENT_INITIAL_PARAMS: SettlementListParams = {
  status: ["REVIEWING", "ADJUSTING", "PAYOUT_SCHEDULED", "PAID"],
  keyword: "",
  sort: "CREATED_DESC",
  page: 1,
  size: 20,
}

/** 명세 전체 보기 한 쪽 크기(서버 상한 100) */
export const SETTLEMENT_ITEMS_PAGE_SIZE = 20

/** 세금계산서 첨부 상한 — 서버 `settlement.tax-invoice-attachment-max-bytes` 기본값 */
export const TAX_INVOICE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

/** 조정 사유 상한 — 서버 `settlement.adjustment.reason-max-length`(설계서 1,000자) */
export const ADJUSTMENT_REASON_MAX_LENGTH = 1000
