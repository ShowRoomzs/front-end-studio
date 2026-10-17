import type { BaseParams } from "@/common/types/page"

/*
  쇼룸 스튜디오 정산 관리(ui-studio-12 rev.3 · 요구사항 §41 · §42 · §44) 화면 모델.

  ⚠️ 백엔드에 정산 API가 아직 없다 — 이 타입은 시안·요구사항에서 역산한 **요청 사양**이다.
  API가 생기면 서버 DTO와 대조해 이름을 맞추고 `services/settlementService.ts` 본문만 바꾼다.

  정산은 공구의 주문이 전부 종결된 뒤에만 생긴다 — 그래서 금액이 미확정인 행이 없고, 모든 금액은
  확정값이다(「예정」 배지 없음). 인플루언서가 금액을 바꾸는 경로는 정산 확인 기간의
  [정산 조정 요청] 하나뿐이고, 협의 응답은 이슈 스레드에서만 한다(§42).
*/

/**
 * 정산 확인 중(정보) · 조정 협의(경고) · 지급 예정(중립) · 지급 완료(성공) — §41-2.
 * 「분배 실패」는 어드민 전용 상태라 스튜디오에는 오지 않는다.
 */
export const SETTLEMENT_STATUSES = [
  "CONFIRMING",
  "ADJUSTING",
  "SCHEDULED",
  "PAID",
] as const

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number]

/** 정산 생성일 최신순(기본) · 실지급액 높은순 — §44-2 */
export type SettlementSort = "CREATED_AT_DESC" | "PAYOUT_DESC"

export interface SettlementListParams extends BaseParams {
  statuses: Array<SettlementStatus>
  keyword: string
  sort: SettlementSort
}

/**
 * 세무 구분 — 「나 하나」의 속성이라 모든 정산에 같은 값이 온다(§44-2).
 * 비사업자 = SHOWROOMZ가 원천징수 · 사업자 = SHOWROOMZ 앞 세금계산서 정발행 + 부가세 별도.
 */
export type TaxType = "INDIVIDUAL" | "BUSINESS"

export interface SettlementListItem {
  settlementId: number
  groupBuyTitle: string
  brandName: string
  /** 정산 대상 기간 = 공구 기간(LocalDate) */
  periodStart: string
  periodEnd: string
  status: SettlementStatus
  taxType: TaxType
  confirmedSales: number
  /** 상품별로 다르면 null — 목록에 「상품별」 */
  rewardRate: number | null
  saleReward: number
  /** 이전 정산 뒤 환불분 차감(§41-7) — 없으면 0 */
  deductionAmount: number
  /** 비사업자 원천징수액 — 사업자는 0 */
  withholdingTax: number
  /** 사업자 부가세 — 비사업자는 0 */
  vatAmount: number
  payoutAmount: number
  /** 지급 예정 = 지급 예정일 · 지급 완료 = 실지급일 · 그 외(또는 사업자 발행 확인 전) null */
  payoutDate: string | null
  /** 사업자 세금계산서 상태 — 비사업자 · 확정 전이면 null */
  taxInvoiceStatus: TaxInvoiceStatus | null
  createdAt: string
}

export interface SettlementSummary {
  /** 지급 완료 실지급액 합계(세후) */
  paidTotal: number
  paidCount: number
  /** 지급 예정 실지급액 합계 */
  scheduledTotal: number
  scheduledCount: number
  /** 지급 예정 중 가장 이른 지급일 — 사업자 발행 확인 전이면 null */
  nextPayoutDate: string | null
  confirmingCount: number
  /** 정산 확인 중 중 가장 이른 확인 기간 마감(LocalDateTime) */
  nearestConfirmDeadlineAt: string | null
  adjustingCount: number
  statusCounts: Record<SettlementStatus, number>
  /**
   * GNB 배지 — 내 조치가 필요한 정산 수(조정 협의 중 내 응답 차례 + 세금계산서 발행 필요 · 반려).
   * 시안은 숫자만 그렸고 기준은 정하지 않았다 — 계약 · 공구 배지와 같은 「내 조치 필요」로 맞췄다.
   */
  actionRequiredCount: number
  /** [연간 지급 내역] 연도 선택지 — 지급 내역이 있는 해, 최신순 */
  payoutYears: Array<number>
}

export interface CountAmount {
  count: number
  amount: number
}

/**
 * 내 리워드 분해 — 확정 거래액 → 리워드율 → 판매 리워드 → (차감) → 원천징수 | 부가세 → 실지급액.
 * 플랫폼 · PG 수수료는 내 리워드에서 빠지지 않으므로 이 축에 없다(§41-8 · §44-1 #1).
 */
export interface SettlementBreakdown {
  totalOrderAmount: number
  cancel: CountAmount
  return: CountAmount
  deliveryException: CountAmount
  confirmedSales: number
  /** 단일 리워드율 — 상품별이면 null이고 productRates를 쓴다 */
  rewardRate: number | null
  productRates: Array<{ productName: string; rate: number }>
  saleReward: number
  deductionAmount: number
  /** 차감 후 리워드 — 원천징수 · 세금계산서 공급가의 기준 */
  rewardAfterDeduction: number
  withholdingTax: number
  vatAmount: number
  payoutAmount: number
}

/**
 * 세율 — 백엔드 변수라 문구에 고정하지 않는다(플랫폼 종사자 세율 개정 가능성 · §41-4).
 * 원천징수 = 소득세 + 지방소득세, 사업자 = 부가세.
 */
export interface TaxRates {
  incomeTaxRate: number
  localIncomeTaxRate: number
  /** incomeTaxRate + localIncomeTaxRate — 3.3 */
  withholdingRate: number
  vatRate: number
}

/** 차감 반영 블록 한 줄 — 다른 공구에서 넘어온 값이라 원 공구 · 사유를 함께 둔다(§41-7) */
export interface SettlementDeduction {
  clawbackNo: string
  orderNo: string
  sourceGroupBuyTitle: string
  sourcePaidAt: string | null
  reason: string
  /** 운영자가 반품을 대신 연 시각 */
  openedAt: string
  refundAmount: number
  rewardRate: number
  deductedReward: number
}

/** 3자 분배의 브랜드 · 플랫폼 행 — 내 행은 분해 값에서 만든다 */
export interface SettlementDistribution {
  brandAmount: number
  /** 브랜드 몫 지급(예정)일 — 사업자 발행 확인과 무관하게 원래 날짜에 나간다 */
  brandPayoutDate: string | null
  brandPaid: boolean
  /** 비사업자 = 리워드 부가세(플랫폼 신고 · 납부) · 사업자 = 0 */
  platformAmount: number
}

export interface SettlementPayout {
  bankName: string
  /** 마스킹된 계좌번호 */
  accountNumberMasked: string
  accountHolder: string
  /** 지급 예정일 — 정산 확인 중이면 「요청이 없을 때」의 예정일, 조정 협의 · 사업자 확인 전이면 null */
  scheduledDate: string | null
  paidDate: string | null
  pgReferenceNo: string | null
}

/** 조정 협의 진행 현황 — 응답은 이슈 스레드에서만 한다(§42-2 · §44-3 D2) */
export type AdjustmentParty = "ME" | "BRAND"

export interface SettlementAdjustment {
  requestedBy: AdjustmentParty
  requesterName: string
  requestedAt: string
  originalReward: number
  requestedReward: number
  /** 첫 요청 뒤의 가장 최근 「다른 금액 제안」 — 없으면 null */
  latestProposal: {
    by: AdjustmentParty
    reward: number
    proposedAt: string
  } | null
  /** 받은 쪽 = 내 응답 필요(경고) · 보낸 쪽 = 상대 응답 대기(정보) */
  myTurn: boolean
  /** 합의 기한(개설 + 10영업일 · LocalDateTime) */
  deadlineAt: string
  /** 영업일 기준 남은 일수 — 서버가 공휴일 달력으로 계산한다 */
  remainingBusinessDays: number
  threadId: number | null
}

/** 확정 경로 — 정산 근거 문구에 쓴다 */
export type ConfirmBasis = "NO_REQUEST" | "AGREED" | "EXPIRED"

/** 사업자 세금계산서 발행 카드 4상태(§44-4) — 발행 필요(경고) · 확인 중(정보) · 반려(위험) · 확인 완료(성공) */
export type TaxInvoiceStatus =
  "REQUIRED" | "REVIEWING" | "REJECTED" | "APPROVED"

export interface TaxInvoiceReceiver {
  companyName: string
  ceoName: string
  businessNumber: string
  address: string
  email: string
}

export interface SettlementTaxInvoice {
  status: TaxInvoiceStatus
  /** 공급받는자 = SHOWROOMZ(정발행 · 브랜드가 아니다) */
  receiver: TaxInvoiceReceiver
  /** 공급가액 = 판매 리워드(차감 후) */
  supplyAmount: number
  vatAmount: number
  totalAmount: number
  /** 확인 중 — 내가 제출한 값(반려 시 비교 근거) */
  submission: {
    approvalNo: string
    submittedAt: string
    attachmentCount: number
  } | null
  rejection: {
    reason: string
    rejectedAt: string
    previousApprovalNo: string
  } | null
  approval: {
    approvalNo: string
    approvedAt: string
    hasPdf: boolean
  } | null
}

export type StatementLineStatus = "CONFIRMED" | "CANCELED" | "RETURNED"

/** 정산 명세 한 줄 — 소비자 열이 없다(개인정보 최소 수집 · §44-1 #3) */
export interface StatementLine {
  orderNo: string
  productName: string
  optionName: string
  quantity: number
  paymentAmount: number
  status: StatementLineStatus
  /** 정산 반영액 = 상품 결제금액 기준(재발송비 제외) */
  settledAmount: number
  myReward: number
}

export interface SettlementDetail {
  settlementId: number
  settlementNo: string
  status: SettlementStatus
  taxType: TaxType
  groupBuyId: number
  groupBuyTitle: string
  brandName: string
  periodStart: string
  periodEnd: string
  /** 정산 생성일 = 주문 전부 종결 뒤 금액 공개 시점 */
  createdAt: string
  /** 정산 근거 — 주문 전부 종결일 */
  ordersClosedAt: string
  /** 정산 확인 기간 마감(23:59) */
  confirmDeadlineAt: string
  /** 확인 기간 길이(영업일) — 운영정책 위임 값 */
  confirmBusinessDays: number
  /** 확정일 — 자동 확정 · 합의 · 기한 만료. 정산 확인 중이면 「요청이 없을 때」의 자동 확정일 */
  confirmedAt: string | null
  confirmBasis: ConfirmBasis | null
  /** 지급 예정일 = 확정일 + N영업일(PG 계약) */
  payoutLagBusinessDays: number
  /** 서버 판정 — 확인 기간 안이고 요청 이력이 없을 때만 true(마감 뒤에는 에러 문구 없이 비활성) */
  canRequestAdjustment: boolean
  /** 조정 상한 — 조정 후 브랜드 수취액이 0 미만이 되지 않는 리워드(§42-1) */
  maxAdjustableReward: number
  breakdown: SettlementBreakdown
  taxRates: TaxRates
  deductions: Array<SettlementDeduction>
  distribution: SettlementDistribution
  payout: SettlementPayout
  adjustment: SettlementAdjustment | null
  taxInvoice: SettlementTaxInvoice | null
  statementPreview: Array<StatementLine>
  statementTotalCount: number
}

export interface AdjustmentRequestBody {
  requestedReward: number
  reason: string
}

export interface TaxInvoiceSubmitBody {
  approvalNo: string
  /** PDF 첨부(선택) */
  file: File | null
}
