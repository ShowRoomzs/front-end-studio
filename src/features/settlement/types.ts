import type { BaseParams } from "@/common/types/page"

/*
  쇼룸 스튜디오 정산 관리(ui-studio-12 rev.4) — 서버 DTO 그대로.

  원본: back-end `api/creator/settlement/dto/CreatorSettlementDto.java`
  · `api/common/settlement/dto/SettlementPartyDto.java` · `SettlementAdjustmentDto.java`
  · enum `domain/settlement/type/*`. 이름 · nullable을 서버와 맞춘다 — 화면 문구로 바꾸는 일은
  컴포넌트가 한다.

  날짜: `LocalDateTime`은 `"…Z"` 문자열(`parseServerDateTime`으로 읽는다), `LocalDate`는 `"YYYY-MM-DD"`.
  비율: 원천징수 · 부가세 율은 소수(0.03 · 0.003 · 0.10), 리워드율은 퍼센트 숫자(12.0)다.

  응답에 **없는 것**(서버가 안 내린다) — 고정 지급비 · PG · 플랫폼 수수료 행 · 브랜드 수취액(분배 행 금액으로만)
  · 반품 · 교환 배송비 블록 · 이력 · 소비자 정보.
*/

/**
 * 정산 상태 — 수취자 화면은 4종이다. 「분배 실패」(PAYOUT_FAILED)는 어드민 전용이라 서버가 PAID로 접어
 * 내린다(목록 필터로도 받지 않는다).
 */
export const SETTLEMENT_STATUSES = [
  "REVIEWING",
  "ADJUSTING",
  "PAYOUT_SCHEDULED",
  "PAID",
] as const

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number]

/** 배지 색 — 서버 enum이 든다(FE 매핑표 없음) */
export type SettlementTone =
  "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER"

/** 정산 생성일 최신순(기본) · 실지급액 높은순 */
export type SettlementPartySort = "CREATED_DESC" | "PAYOUT_DESC"

/** 화면 상태(URL) — 서버에는 `toListSearchParams`로 바꿔 보낸다 */
export interface SettlementListParams extends BaseParams {
  status: Array<SettlementStatus>
  keyword: string
  sort: SettlementPartySort
}

/** 세무 구분 — 스튜디오는 법인을 받지 않는다(개인 비사업자 · 개인사업자) */
export type CreatorBusinessType = "INDIVIDUAL" | "BUSINESS"

// ── 목록(2-2) ───────────────────────────────────────

export interface SettlementListItem {
  settlementId: number
  settlementNumber: string
  groupBuyId: number
  groupBuyTitle: string
  brandName: string
  periodStartAt: string
  periodEndAt: string
  confirmedSalesAmount: number
  /** 「15%」 · 상품마다 다르면 「상품별」 · 명세 행이 없으면 null */
  rewardRateLabel: string | null
  rewardAmount: number
  /** 차감 — 있으면 「차감 −6,150원」 보조줄 */
  rewardClawbackAmount: number
  withholdingAmount: number
  creatorVatAmount: number
  /** 실지급액 */
  creatorPayoutAmount: number
  status: SettlementStatus
  statusLabel: string
  statusTone: SettlementTone
  /** 내 행의 지급 예정일 · 지급일 — 확인 중 · 협의 · 보류 · 실패면 null */
  payoutDate: string | null
  payoutDateKind: "SCHEDULED" | "PAID" | null
  /**
   * 내 지급 행 보류 이유 — 상태는 「지급 예정」 그대로 · `sanction`이면 보조 배지
   * 「지급 정지 · 계정 이용 정지」(13 S6). 보류가 아니면 null
   */
  payoutHold: PayoutHoldView | null
}

/**
 * 내 지급 행 보류 이유(1017 설계서 8-8 · `api/common/settlement/dto/PayoutHoldView.java`).
 * 정산 상태 라벨은 바꾸지 않고 이 보조 정보로 보인다 — 「보류」는 조정 협의 전용이다.
 */
export interface PayoutHoldView {
  /** `PayoutBlockReason` 코드 — 「BRAND_SUSPENDED」 · 「CREATOR_SUSPENDED」 · 「TAX_INVOICE_UNVERIFIED」 등 */
  reason: string
  /** 「계정 이용 정지 · 정산 정보 불일치」 */
  label: string
  /** 지급일 문구 — 「정지 해제 다음 영업일 지급」 · 「발행 확인 후 + 3영업일」(서버 문장) */
  scheduleLabel: string
  /** 원래 지급 예정일(LocalDate) — 「원래 2026.09.09」 · 사업자 확인 전이면 null */
  originalDueDate: string | null
  /** 계정 이용 정지로 인한 보류인가 — 보조 배지는 이때만 */
  sanction: boolean
}

// ── 요약(2-3) ───────────────────────────────────────

/** KPI 칸 — 건수 0이면 amount = null(「0원은 실적처럼 읽힌다」 · 「—」) */
export interface SettlementKpi {
  amount: number | null
  count: number
}

export interface SettlementScheduledKpi extends SettlementKpi {
  /** 가장 가까운 지급 예정일(보류 건 제외) */
  nearestDate: string | null
}

export interface SettlementReviewingKpi {
  count: number
  /** 요청 가능 창이 열린 정산 중 가장 빠른 확인 마감 */
  nearestDueAt: string | null
}

export type SettlementStatusCounts = Record<SettlementStatus, number>

/** 인플루언서 전체 기준 — 검색어 · 상태 칩과 무관 */
export interface SettlementSummary {
  /** 누적 수령 — 내 행 PAID · 실지급액 */
  totalPaid: SettlementKpi
  /** 지급 예정 — 내 행 SCHEDULED · BLOCKED */
  payoutScheduled: SettlementScheduledKpi
  reviewing: SettlementReviewingKpi
  adjusting: { count: number }
  statusCounts: SettlementStatusCounts
  /** GNB 배지 = 요청 가능 창이 열린 정산 확인 중 + 세금계산서 입력 대기 · 반려 */
  attentionCount: number
  /** `TAX_INVOICE_UNVERIFIED`면 지급 예정 중 세금계산서 확인 전이라 보류된 건이 있다 · 없으면 null */
  payoutCondition: string | null
}

// ── 상세(2-4) ───────────────────────────────────────

export interface SettlementHeader {
  settlementId: number
  settlementNumber: string
  groupBuyId: number
  groupBuyTitle: string
  brandName: string
  marketId: number
  periodStartAt: string
  periodEndAt: string
  status: SettlementStatus
  statusLabel: string
  statusTone: SettlementTone
  /** 정산 생성 시점의 세무 구분 스냅샷 */
  creatorBusinessType: CreatorBusinessType
  taxInvoiceRequired: boolean
  /** 내 지급 행 보류 이유 — 지급 예정일 「정지 해제 다음 영업일 · 원래 09.09」 */
  payoutHold: PayoutHoldView | null
}

/** 확정 사유 — 자동 확정 · 합의 확정 · 기한 만료 확정 · 철회 확정 */
export type SettlementConfirmReason =
  "AUTO" | "AGREED" | "EXPIRED" | "WITHDRAWN"

export interface SettlementTimeline {
  createdAt: string
  ordersClosedAt: string
  reviewDueAt: string
  confirmedAt: string | null
  confirmReason: SettlementConfirmReason | null
  confirmReasonLabel: string | null
  /** 내 행 지급 예정일 — 사업자 발행 전 · 확인 중 · 협의면 null */
  payoutDueDate: string | null
  /** 「자동 확정 08.28 + 3영업일」 · 「발행 확인 후 + 3영업일」 등 — 서버 문장 */
  payoutDueNote: string | null
  paidAt: string | null
}

/** 정산 확인 중에서만 */
export interface SettlementReview {
  canRequestAdjustment: boolean
  requestDeadlineAt: string
  /** 조정 상한 — 「조정 후 브랜드 수취액 ≥ 0」 · 10원 절사 */
  maxRewardAmount: number
}

export interface AmountCount {
  amount: number
  count: number
}

export interface ProductRate {
  productName: string
  /** 퍼센트(12.0) */
  rate: number
}

/** 분해 — 브랜드 축 상단(확정 거래액까지) + 인플루언서 축 */
export interface SettlementBreakdown {
  grossOrderAmount: number
  cancel: AmountCount
  return: AmountCount
  deliveryException: AmountCount
  confirmedSalesAmount: number
  rewardRateLabel: string | null
  /** 「상품별」일 때 주석 */
  rewardRates: Array<ProductRate>
  /** 합의로 바뀌면 rewardAmount와 다르다 */
  originalRewardAmount: number
  rewardAmount: number
  rewardClawbackAmount: number
  rewardAfterClawback: number
  /** 소수(0.03) */
  withholdingIncomeRate: number
  /** 소수(0.003) */
  withholdingLocalRate: number
  withholdingAmount: number
  /** 소수(0.10) */
  creatorVatRate: number
  creatorVatAmount: number
  creatorPayoutAmount: number
}

/** 차감 반영(D3) */
export interface SettlementClawback {
  clawbackNumber: string
  orderNumber: string
  /** 원 공구 — 원 정산을 찾지 못하면 null */
  originGroupBuyTitle: string | null
  originSettlementPaidAt: string | null
  reasonLabel: string
  refundAmount: number
  amount: number
  /** 퍼센트 */
  rewardRate: number | null
  createdAt: string
}

export type SettlementPayee = "BRAND" | "CREATOR" | "PLATFORM"

/**
 * 수취자별 지급 상태. 스튜디오에서는 내 행 실패만 FAILED(「지급 확인 중」)로 오고 브랜드 행 실패는
 * SCHEDULED로 접힌다.
 */
export type PayoutStatus =
  | "WAITING"
  | "HELD"
  | "BLOCKED"
  | "SCHEDULED"
  | "REQUESTED"
  | "PAID"
  | "FAILED"
  | "NOT_APPLICABLE"

export interface SettlementPayoutRow {
  payee: SettlementPayee
  /** 「인플루언서」 · 「브랜드」 · 「플랫폼」 */
  payeeLabel: string
  name: string
  amount: number
  /** 내 행 = 「리워드 282,000 − 원천징수 9,306(3.3%)」 · 플랫폼 = 「플랫폼 신고 · 납부」 */
  note: string | null
  status: PayoutStatus
  /** 「10.12 지급 예정」 · 「보류 중」 · 「발행 필요」 */
  statusLabel: string
  date: string | null
  /** [내 행] 보류 이유 — 남의 행은 null */
  hold: PayoutHoldView | null
}

export interface SettlementPayouts {
  /** 확정 전(REVIEWING · ADJUSTING)이면 true — 금액만 보이고 상태는 「확인 기간 후 지급」 · 「보류 중」 */
  shownAfterConfirm: boolean
  /** 인플루언서(내 행) 첫 행 · 브랜드 · 플랫폼 */
  rows: Array<SettlementPayoutRow>
}

/** 내 계좌 · 뒤 6자리 */
export interface SettlementPayment {
  bankName: string | null
  accountNumberMasked: string | null
  accountHolder: string | null
  dueDate: string | null
  dueNote: string | null
  paidAt: string | null
  /** 내 행 PAID일 때만 */
  pgReference: string | null
}

export type SettlementParty = "SELLER" | "CREATOR"

export type AdjustmentStatus = "OPEN" | "AGREED" | "EXPIRED" | "WITHDRAWN"

/** 뷰어(나) 기준 차례 */
export type AdjustmentTurn = "MY_TURN" | "THEIR_TURN" | "OPEN_FLOOR" | "CLOSED"

export type AdjustmentProposalStatus =
  "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "CLOSED"

export interface SettlementAdjustmentProposal {
  seq: number
  proposerType: SettlementParty
  /** 내가 낸 제안인가 */
  mine: boolean
  rewardAmount: number
  reason: string | null
  status: AdjustmentProposalStatus
  proposedAt: string
  respondedAt: string | null
}

/** 조정 내역 — 협의가 열린 뒤 항상(종결 뒤에도 이력으로) · 없으면 null */
export interface SettlementAdjustmentBlock {
  adjustmentId: number
  /** 3자 이슈 스레드 */
  threadId: number
  status: AdjustmentStatus
  statusLabel: string
  /** 처음 요청한 쪽 */
  requesterType: SettlementParty
  openedAt: string
  /** 합의 기한 — 개설 + 10영업일 23:59:59 */
  deadlineAt: string
  /** D-N — 종결 뒤 null */
  remainingBusinessDays: number | null
  originalRewardAmount: number
  maxRewardAmount: number
  agreedRewardAmount: number | null
  finalRewardAmount: number | null
  myLatestAmount: number | null
  counterpartLatestAmount: number | null
  counterpartLatestAt: string | null
  turn: AdjustmentTurn
  turnLabel: string
  turnTone: SettlementTone
  /** seq 오름차순 전량 */
  proposals: Array<SettlementAdjustmentProposal>
}

/** 비사업자만 */
export interface SettlementWithholding {
  receiptIssuer: string
  amount: number
  /** 지급 완료 ∧ 원천징수영수증 생성 완료 */
  receiptAvailable: boolean
  /** 「징수 예정액」 · 「징수액」 */
  receiptLabel: string
}

/** 세금계산서 카드 4상태 — 발행 필요 · 확인 중 · 반려 · 확인 완료 */
export type TaxInvoiceCardStatus =
  "PENDING_INPUT" | "SUBMITTED" | "REJECTED" | "VERIFIED"

export type TaxInvoiceRejectReason =
  "AMOUNT_MISMATCH" | "RECIPIENT_MISMATCH" | "NOT_FOUND"

/** 공급받는자 = SHOWROOMZ(서버 `company.*` 설정 · 기-35) */
export interface TaxInvoiceSupplier {
  name: string
  representative: string
  registrationNumber: string
  address: string
  /** 세금계산서 수신 — 설정 전이면 빈 문자열 · 화면은 「[확인 필요]」 */
  taxEmail: string | null
}

/** 사업자 ∧ 확정 후만 */
export interface SettlementTaxInvoice {
  cardStatus: TaxInvoiceCardStatus
  supplier: TaxInvoiceSupplier
  supplyAmount: number
  vatAmount: number
  totalAmount: number
  approvalNumber: string | null
  submittedAt: string | null
  attachmentName: string | null
  rejectReason: TaxInvoiceRejectReason | null
  rejectReasonLabel: string | null
  rejectedAt: string | null
  verifiedAt: string | null
}

/** 명세 「상태」 열 */
export type SettlementItemStatus =
  | "CONFIRMED"
  | "PARTIAL_RETURNED"
  | "RETURNED"
  | "CANCELLED"
  | "DELIVERY_EXCEPTION"

/** 명세 행 — 소비자 열 없음 */
export interface SettlementItem {
  orderNumber: string
  productName: string
  optionName: string | null
  quantity: number
  settledQuantity: number
  paidAmount: number
  status: SettlementItemStatus
  statusLabel: string
  settledAmount: number
  /** 퍼센트 */
  rewardRate: number
  /** 내 리워드 */
  rewardAmount: number
}

export interface SettlementItems {
  /** 미리보기 5건 · 주문번호 내림차순 */
  preview: Array<SettlementItem>
  totalCount: number
  /** 확정 후만 */
  downloadAvailable: boolean
}

export interface SettlementDetail {
  settlement: SettlementHeader
  timeline: SettlementTimeline
  review: SettlementReview | null
  breakdown: SettlementBreakdown
  /** 없으면 [] */
  clawbacks: Array<SettlementClawback>
  payouts: SettlementPayouts
  /** 계좌가 없으면 null */
  payment: SettlementPayment | null
  adjustment: SettlementAdjustmentBlock | null
  /** 비사업자만 · 사업자 null */
  withholding: SettlementWithholding | null
  /** 사업자 ∧ 확정 후만 · 그 전 null */
  taxInvoice: SettlementTaxInvoice | null
  items: SettlementItems
}

// ── 세금계산서 제출(3-1) ────────────────────────────

export interface TaxInvoiceSubmitBody {
  /** 서버 형식 `^\d{8}-\d{8}-\d{8}$` */
  approvalNumber: string
  /** PDF(선택 · 10MB) */
  attachment: File | null
}

export interface TaxInvoiceSubmitResponse {
  settlementId: number
  taxInvoice: SettlementTaxInvoice
}

// ── 조정 요청(이슈 스레드 설계서 3-2 · 3-3) ──────────

/** 정산 포트의 계산값 — 전 항목 절사 */
export interface AdjustmentAmounts {
  rewardAmount: number
  rewardVatAmount: number
  withholdingAmount: number
  /** 인플루언서 실지급 */
  creatorNetAmount: number
  /** 브랜드 수취액 */
  brandPayoutAmount: number
}

export interface AdjustmentPreviewResponse {
  settlementId: number
  settlementNumber: string
  /** 확인 기간 안 ∧ 협의 없음 — false면 버튼 비활성(에러 문구 없이) */
  canRequest: boolean
  cannotRequestReason: "REVIEW_CLOSED" | "ALREADY_ADJUSTING" | null
  reviewEndsAt: string
  originalRewardAmount: number
  maxRewardAmount: number
  input: { rewardAmount: number } | null
  /** 입력 금액의 자동 계산 — 입력이 없거나 범위 밖이면 null */
  preview: AdjustmentAmounts | null
  original: AdjustmentAmounts
  /** 0 ≤ 입력 ≤ 상한 — 입력이 없으면 null */
  inRange: boolean | null
}

export interface AdjustmentRequestBody {
  /** 요청 리워드(공급가) */
  rewardAmount: number
  /** 필수 · 1,000자 */
  reason: string
}

export interface AdjustmentRequestResponse {
  adjustmentId: number
  /** 자동 개설된 3자 이슈 스레드 */
  threadId: number
  proposalId: number
  deadlineAt: string
}

/** `GET /creator/profile`에서 세무 구분만 읽는다(목록 응답에 없다) */
export interface CreatorProfileTaxInfo {
  businessType: CreatorBusinessType | null
}
