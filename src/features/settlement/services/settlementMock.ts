import type {
  AdjustmentRequestBody,
  ConfirmBasis,
  CountAmount,
  SettlementAdjustment,
  SettlementDeduction,
  SettlementDetail,
  SettlementListItem,
  SettlementStatus,
  StatementLine,
  TaxInvoiceStatus,
  TaxInvoiceSubmitBody,
  TaxRates,
  TaxType,
} from "@/features/settlement/types"
import { calcVat, calcWithholding } from "@/features/settlement/utils/format"

/*
  개발 서버 전용 목업 — 시안 ui-studio-12 rev.3의 더미 수치를 그대로 옮겼다(HEAD [더미 수치 정합]).
  KPI · 상태 칩 · 총 건수가 같은 6행에서 나온다: 누적 수령 1,127,522 = 529,916 + 597,606 ·
  지급 예정 93,558 · 정산 확인 중 1 · 조정 협의 2(여름 수분 세럼 · 퓨어랩 립밤 — 이슈 스레드 두 케이스).

  이 파일은 settlementService에서만 import한다 — 화면 코드는 목업을 모른다.
*/

const TAX_RATES: TaxRates = {
  incomeTaxRate: 3,
  localIncomeTaxRate: 0.3,
  withholdingRate: 3.3,
  vatRate: 10,
}

/** 조정 상한 계산용(목업 전용) — PG 결제 수수료 3.0% 잠정 · 플랫폼 수수료 베타 0% */
const PG_FEE_RATE = 3
const PLATFORM_FEE_RATE = 0

const RECEIVER = {
  companyName: "SHOWROOMZ(주)",
  ceoName: "이쇼룸",
  businessNumber: "214-88-01234",
  address: "서울특별시 성동구 성수이로 77",
  email: "tax@showroomz.kr",
}

const PAYOUT_ACCOUNT = {
  bankName: "OO은행",
  accountNumberMasked: "123-****-**89",
  accountHolder: "김소연",
}

const ME = "뷰티_소연"

const none: CountAmount = { count: 0, amount: 0 }

interface MockBase {
  settlementId: number
  groupBuyId: number
  groupBuyTitle: string
  brandName: string
  periodStart: string
  periodEnd: string
  status: SettlementStatus
  createdAt: string
  ordersClosedAt: string
  confirmDeadlineAt: string
  confirmedAt: string
  confirmBasis: ConfirmBasis | null
  /** 비사업자 기준 지급(예정)일 */
  scheduledDate: string | null
  paidDate: string | null
  pgReferenceNo: string | null
  totalOrderAmount: number
  cancel: CountAmount
  return: CountAmount
  deliveryException: CountAmount
  confirmedSales: number
  rewardRate: number | null
  productRates: Array<{ productName: string; rate: number }>
  saleReward: number
  deductions: Array<SettlementDeduction>
  brandAmount: number
  brandPayoutDate: string | null
  brandPaid: boolean
  adjustment: SettlementAdjustment | null
  statementPreview: Array<StatementLine>
  statementTotalCount: number
}

function line(
  orderNo: string,
  productName: string,
  quantity: number,
  paymentAmount: number,
  status: StatementLine["status"],
  rate: number
): StatementLine {
  const settled = status === "CONFIRMED" ? paymentAmount : 0
  return {
    orderNo,
    productName,
    optionName: "단품",
    quantity,
    paymentAmount,
    status,
    settledAmount: settled,
    myReward: Math.floor((settled * rate) / 100),
  }
}

const BASES: Array<MockBase> = [
  {
    // D1 · C1 — 정산 확인 중
    settlementId: 1,
    groupBuyId: 1201,
    groupBuyTitle: "하이드라 앰플 공구",
    brandName: "퓨어네이처",
    periodStart: "2026-08-20",
    periodEnd: "2026-08-26",
    status: "CONFIRMING",
    createdAt: "2026-09-21T09:00:00",
    ordersClosedAt: "2026-09-18",
    confirmDeadlineAt: "2026-09-24T23:59:00",
    confirmedAt: "2026-09-25",
    confirmBasis: null,
    scheduledDate: "2026-09-30",
    paidDate: null,
    pgReferenceNo: null,
    totalOrderAmount: 6_760_000,
    cancel: { count: 7, amount: 140_000 },
    return: { count: 19, amount: 480_000 },
    deliveryException: { count: 1, amount: 20_000 },
    confirmedSales: 6_120_000,
    rewardRate: 15,
    productRates: [],
    saleReward: 918_000,
    deductions: [],
    brandAmount: 4_926_600,
    brandPayoutDate: "2026-09-30",
    brandPaid: false,
    adjustment: null,
    statementPreview: [
      line("ORD-25204", "하이드라 앰플 30ml", 1, 24_000, "CONFIRMED", 15),
      line("ORD-25203", "하이드라 앰플 미니 10ml", 2, 18_000, "CONFIRMED", 15),
      line("ORD-25201", "하이드라 앰플 30ml", 1, 24_000, "RETURNED", 15),
      line("ORD-25198", "하이드라 앰플 30ml", 1, 24_000, "CANCELED", 15),
      line("ORD-25195", "하이드라 앰플 30ml", 2, 48_000, "CONFIRMED", 15),
    ],
    statementTotalCount: 281,
  },
  {
    // D2 — 조정 협의 · 내가 요청 · 브랜드가 다른 금액 제안 → 내 응답 필요(이슈 스레드 케이스 A)
    settlementId: 2,
    groupBuyId: 1188,
    groupBuyTitle: "여름 수분 세럼 공구",
    brandName: "○○ 브랜드",
    periodStart: "2026-08-24",
    periodEnd: "2026-08-31",
    status: "ADJUSTING",
    createdAt: "2026-09-01T10:00:00",
    ordersClosedAt: "2026-08-31",
    confirmDeadlineAt: "2026-09-03T23:59:00",
    confirmedAt: "",
    confirmBasis: null,
    scheduledDate: null,
    paidDate: null,
    pgReferenceNo: null,
    totalOrderAmount: 11_472_000,
    cancel: { count: 3, amount: 78_000 },
    return: { count: 5, amount: 128_000 },
    deliveryException: none,
    confirmedSales: 11_266_000,
    rewardRate: null,
    productRates: [
      { productName: "세럼 30ml", rate: 15 },
      { productName: "크림 50ml", rate: 12 },
    ],
    saleReward: 1_577_040,
    deductions: [],
    brandAmount: 9_193_276,
    brandPayoutDate: null,
    brandPaid: false,
    adjustment: {
      requestedBy: "ME",
      requesterName: ME,
      requestedAt: "2026-09-02T10:40:00",
      originalReward: 1_577_040,
      requestedReward: 1_606_512,
      latestProposal: {
        by: "BRAND",
        reward: 1_591_512,
        proposedAt: "2026-09-07T11:20:00",
      },
      myTurn: true,
      deadlineAt: "2026-09-16T23:59:00",
      remainingBusinessDays: 7,
      threadId: 9001,
    },
    statementPreview: [
      line("ORD-25012", "여름 수분 세럼 30ml", 1, 28_000, "CONFIRMED", 15),
      line("ORD-25010", "여름 수분 크림 50ml", 2, 44_000, "CONFIRMED", 12),
      line("ORD-25007", "여름 수분 세럼 30ml", 1, 28_000, "RETURNED", 15),
      line("ORD-25003", "여름 수분 세럼 30ml", 2, 56_000, "CONFIRMED", 15),
      line("ORD-24998", "여름 수분 크림 50ml", 1, 22_000, "CANCELED", 12),
    ],
    statementTotalCount: 447,
  },
  {
    // D3 — 지급 예정 · 차감 반영(이전 정산 하자 환불)
    settlementId: 3,
    groupBuyId: 1175,
    groupBuyTitle: "모이스처 토너 공구",
    brandName: "모이스처하우스",
    periodStart: "2026-08-18",
    periodEnd: "2026-08-25",
    status: "SCHEDULED",
    createdAt: "2026-09-01T09:00:00",
    ordersClosedAt: "2026-09-01",
    confirmDeadlineAt: "2026-09-03T23:59:00",
    confirmedAt: "2026-09-04",
    confirmBasis: "NO_REQUEST",
    scheduledDate: "2026-09-09",
    paidDate: null,
    pgReferenceNo: null,
    totalOrderAmount: 700_000,
    cancel: { count: 1, amount: 14_000 },
    return: none,
    deliveryException: none,
    confirmedSales: 686_000,
    rewardRate: 15,
    productRates: [],
    saleReward: 102_900,
    deductions: [
      {
        clawbackNo: "CLW-0007",
        orderNo: "ORD-21877",
        sourceGroupBuyTitle: "글로우 세럼 공구",
        sourcePaidAt: "2026-07-24",
        reason: "구매확정 후 하자 환불",
        openedAt: "2026-09-02",
        refundAmount: 41_000,
        rewardRate: 15,
        deductedReward: 6_150,
      },
    ],
    brandAmount: 552_230,
    brandPayoutDate: "2026-09-09",
    brandPaid: false,
    adjustment: null,
    statementPreview: [
      line("ORD-24701", "모이스처 토너 200ml", 2, 28_000, "CONFIRMED", 15),
      line("ORD-24699", "모이스처 토너 200ml", 1, 14_000, "CONFIRMED", 15),
      line("ORD-24690", "모이스처 토너 200ml", 1, 14_000, "CANCELED", 15),
    ],
    statementTotalCount: 3,
  },
  {
    // D4 — 지급 완료(비사업자) · 사업자 시나리오에서는 D5~D5c
    settlementId: 4,
    groupBuyId: 1150,
    groupBuyTitle: "데일리 선크림 공구",
    brandName: "데일리랩",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-07",
    status: "PAID",
    createdAt: "2026-08-25T09:00:00",
    ordersClosedAt: "2026-08-25",
    confirmDeadlineAt: "2026-08-27T23:59:00",
    confirmedAt: "2026-08-28",
    confirmBasis: "NO_REQUEST",
    scheduledDate: "2026-09-02",
    paidDate: "2026-09-02",
    pgReferenceNo: "PG-20260831-004821",
    totalOrderAmount: 6_020_000,
    cancel: { count: 8, amount: 160_000 },
    return: { count: 13, amount: 350_000 },
    deliveryException: { count: 1, amount: 30_000 },
    confirmedSales: 5_480_000,
    rewardRate: 10,
    productRates: [],
    saleReward: 548_000,
    deductions: [],
    brandAmount: 4_712_800,
    brandPayoutDate: "2026-09-02",
    brandPaid: true,
    adjustment: null,
    statementPreview: [
      line("ORD-24118", "데일리 선크림 50ml", 1, 19_800, "CONFIRMED", 10),
      line("ORD-24117", "데일리 선크림 리필", 2, 25_600, "CONFIRMED", 10),
      line("ORD-24115", "데일리 선크림 50ml", 1, 19_800, "CANCELED", 10),
      line("ORD-24114", "데일리 선크림 50ml", 1, 19_800, "RETURNED", 10),
      line("ORD-24112", "데일리 선크림 50ml", 3, 59_400, "CONFIRMED", 10),
    ],
    statementTotalCount: 302,
  },
  {
    // 조정 협의 · 브랜드가 감액 요청 → 내 응답 필요(이슈 스레드 케이스 B)
    settlementId: 5,
    groupBuyId: 1102,
    groupBuyTitle: "퓨어랩 립밤 공구",
    brandName: "퓨어랩",
    periodStart: "2026-07-10",
    periodEnd: "2026-07-17",
    status: "ADJUSTING",
    createdAt: "2026-07-18T09:00:00",
    ordersClosedAt: "2026-07-17",
    confirmDeadlineAt: "2026-07-22T23:59:00",
    confirmedAt: "",
    confirmBasis: null,
    scheduledDate: null,
    paidDate: null,
    pgReferenceNo: null,
    totalOrderAmount: 426_000,
    cancel: { count: 1, amount: 10_400 },
    return: none,
    deliveryException: none,
    confirmedSales: 415_600,
    rewardRate: 15,
    productRates: [],
    saleReward: 62_340,
    deductions: [],
    brandAmount: 334_558,
    brandPayoutDate: null,
    brandPaid: false,
    adjustment: {
      requestedBy: "BRAND",
      requesterName: "퓨어랩",
      requestedAt: "2026-07-20T09:12:00",
      originalReward: 62_340,
      requestedReward: 46_755,
      latestProposal: null,
      myTurn: true,
      deadlineAt: "2026-08-03T23:59:00",
      remainingBusinessDays: 9,
      threadId: 9002,
    },
    statementPreview: [
      line("ORD-23510", "퓨어랩 립밤 4.5g", 2, 20_800, "CONFIRMED", 15),
      line("ORD-23507", "퓨어랩 립밤 4.5g", 1, 10_400, "CANCELED", 15),
      line("ORD-23502", "퓨어랩 립밤 4.5g", 3, 31_200, "CONFIRMED", 15),
    ],
    statementTotalCount: 37,
  },
  {
    settlementId: 6,
    groupBuyId: 1094,
    groupBuyTitle: "글로우 세럼 공구",
    brandName: "글로우코스",
    periodStart: "2026-07-05",
    periodEnd: "2026-07-11",
    status: "PAID",
    createdAt: "2026-07-15T09:00:00",
    ordersClosedAt: "2026-07-15",
    confirmDeadlineAt: "2026-07-20T23:59:00",
    confirmedAt: "2026-07-21",
    confirmBasis: "NO_REQUEST",
    scheduledDate: "2026-07-24",
    paidDate: "2026-07-24",
    pgReferenceNo: "PG-20260723-001937",
    totalOrderAmount: 4_300_000,
    cancel: { count: 4, amount: 96_000 },
    return: { count: 3, amount: 84_000 },
    deliveryException: none,
    confirmedSales: 4_120_000,
    rewardRate: 15,
    productRates: [],
    saleReward: 618_000,
    deductions: [],
    brandAmount: 3_316_600,
    brandPayoutDate: "2026-07-24",
    brandPaid: true,
    adjustment: null,
    statementPreview: [
      line("ORD-22104", "글로우 세럼 50ml", 1, 32_000, "CONFIRMED", 15),
      line("ORD-22101", "글로우 세럼 50ml", 2, 64_000, "CONFIRMED", 15),
      line("ORD-22097", "글로우 세럼 50ml", 1, 32_000, "RETURNED", 15),
    ],
    statementTotalCount: 129,
  },
]

/** 사업자 시나리오에서 세금계산서 카드 값 — 시안 D5~D5c(데일리 선크림) */
interface InvoiceOverride {
  status: TaxInvoiceStatus
  payoutDate: string | null
  paidDate?: string | null
  submission?: { approvalNo: string; submittedAt: string; count: number }
  rejection?: { reason: string; rejectedAt: string; previous: string }
  approval?: { approvalNo: string; approvedAt: string; hasPdf: boolean }
}

const D5_SUBMITTED = {
  approvalNo: "20260829-41000012-38475920",
  submittedAt: "2026-08-29T14:20:00",
  count: 1,
}

const INVOICE_BY_SCENARIO: Record<string, InvoiceOverride> = {
  "settlement-business": { status: "REQUIRED", payoutDate: null },
  "settlement-business-reviewing": {
    status: "REVIEWING",
    payoutDate: null,
    submission: D5_SUBMITTED,
  },
  "settlement-business-rejected": {
    status: "REJECTED",
    payoutDate: null,
    rejection: {
      reason:
        "공급가액이 다릅니다 — 548,000원이어야 하는데 584,000원으로 발행되었습니다.",
      rejectedAt: "2026-08-31T10:05:00",
      previous: D5_SUBMITTED.approvalNo,
    },
  },
  "settlement-business-approved": {
    status: "APPROVED",
    payoutDate: "2026-09-04",
    approval: {
      approvalNo: "20260901-41000021-50192834",
      approvedAt: "2026-09-01",
      hasPdf: true,
    },
  },
}

/** 사업자 시나리오의 나머지 정산 — 확인 완료로 둔다(데일리 선크림만 시나리오별로 바뀐다) */
const APPROVED_INVOICE: Record<number, InvoiceOverride> = {
  3: {
    status: "APPROVED",
    payoutDate: "2026-09-10",
    approval: {
      approvalNo: "20260905-41000033-11820456",
      approvedAt: "2026-09-05",
      hasPdf: false,
    },
  },
  6: {
    status: "APPROVED",
    payoutDate: "2026-07-27",
    paidDate: "2026-07-27",
    approval: {
      approvalNo: "20260722-41000008-90214573",
      approvedAt: "2026-07-22",
      hasPdf: true,
    },
  },
}

/** 10원 미만 절사 */
const floor10 = (value: number) => Math.floor(value / 10) * 10

function build(
  base: MockBase,
  taxType: TaxType,
  invoice: InvoiceOverride | null
): SettlementDetail {
  const isBusiness = taxType === "BUSINESS"
  const deductionAmount = base.deductions.reduce(
    (sum, item) => sum + item.deductedReward,
    0
  )
  const rewardAfterDeduction = base.saleReward - deductionAmount
  const withholdingTax = isBusiness
    ? 0
    : calcWithholding(rewardAfterDeduction, TAX_RATES.withholdingRate)
  const vatAmount = isBusiness
    ? calcVat(rewardAfterDeduction, TAX_RATES.vatRate)
    : 0
  const payoutAmount = rewardAfterDeduction - withholdingTax + vatAmount
  const pgFee = Math.floor((base.confirmedSales * PG_FEE_RATE) / 100)
  const platformFee = Math.floor(
    (base.confirmedSales * PLATFORM_FEE_RATE) / 100
  )
  const isConfirmed = base.status === "SCHEDULED" || base.status === "PAID"
  // 사업자는 발행 확인 전까지 내 몫이 지급되지 않는다 — 지급 예정일 미정(브랜드 몫은 원래 날짜)
  const scheduledDate = isBusiness
    ? (invoice?.payoutDate ?? null)
    : base.scheduledDate
  const paidDate = isBusiness ? (invoice?.paidDate ?? null) : base.paidDate
  const status: SettlementStatus =
    isBusiness && base.status === "PAID" && !paidDate
      ? "SCHEDULED"
      : base.status

  return {
    settlementId: base.settlementId,
    settlementNo: `STL-${base.createdAt.slice(2, 4)}${base.createdAt.slice(5, 7)}-${String(base.settlementId).padStart(3, "0")}`,
    status,
    taxType,
    groupBuyId: base.groupBuyId,
    groupBuyTitle: base.groupBuyTitle,
    brandName: base.brandName,
    periodStart: base.periodStart,
    periodEnd: base.periodEnd,
    createdAt: base.createdAt,
    ordersClosedAt: base.ordersClosedAt,
    confirmDeadlineAt: base.confirmDeadlineAt,
    confirmBusinessDays: 3,
    confirmedAt: base.confirmedAt || null,
    confirmBasis: base.confirmBasis,
    payoutLagBusinessDays: 3,
    canRequestAdjustment: base.status === "CONFIRMING",
    maxAdjustableReward: floor10(
      (base.confirmedSales - pgFee - platformFee) /
        (1 + TAX_RATES.vatRate / 100)
    ),
    breakdown: {
      totalOrderAmount: base.totalOrderAmount,
      cancel: base.cancel,
      return: base.return,
      deliveryException: base.deliveryException,
      confirmedSales: base.confirmedSales,
      rewardRate: base.rewardRate,
      productRates: base.productRates,
      saleReward: base.saleReward,
      deductionAmount,
      rewardAfterDeduction,
      withholdingTax,
      vatAmount,
      payoutAmount,
    },
    taxRates: TAX_RATES,
    deductions: base.deductions,
    distribution: {
      brandAmount: base.brandAmount,
      brandPayoutDate: base.brandPayoutDate,
      brandPaid: base.brandPaid,
      platformAmount: isBusiness
        ? 0
        : calcVat(base.saleReward, TAX_RATES.vatRate),
    },
    payout: {
      ...PAYOUT_ACCOUNT,
      scheduledDate,
      paidDate: status === "PAID" ? paidDate : null,
      pgReferenceNo: status === "PAID" ? base.pgReferenceNo : null,
    },
    adjustment: base.adjustment,
    taxInvoice:
      isBusiness && isConfirmed && invoice
        ? {
            status: invoice.status,
            receiver: RECEIVER,
            supplyAmount: rewardAfterDeduction,
            vatAmount,
            totalAmount: rewardAfterDeduction + vatAmount,
            submission: invoice.submission
              ? {
                  approvalNo: invoice.submission.approvalNo,
                  submittedAt: invoice.submission.submittedAt,
                  attachmentCount: invoice.submission.count,
                }
              : null,
            rejection: invoice.rejection
              ? {
                  reason: invoice.rejection.reason,
                  rejectedAt: invoice.rejection.rejectedAt,
                  previousApprovalNo: invoice.rejection.previous,
                }
              : null,
            approval: invoice.approval ?? null,
          }
        : null,
    statementPreview: base.statementPreview,
    statementTotalCount: base.statementTotalCount,
  }
}

/** 시나리오별 상태 저장소 — 조정 요청 · 승인번호 제출을 새로고침 전까지 기억한다 */
const store = new Map<string, Array<SettlementDetail>>()

export function getMockSettlements(scenario: string): Array<SettlementDetail> {
  const cached = store.get(scenario)
  if (cached) return cached

  let built: Array<SettlementDetail>
  if (scenario === "settlement-empty") {
    built = []
  } else if (scenario in INVOICE_BY_SCENARIO) {
    built = BASES.map(base =>
      build(
        base,
        "BUSINESS",
        base.settlementId === 4
          ? INVOICE_BY_SCENARIO[scenario]
          : (APPROVED_INVOICE[base.settlementId] ?? null)
      )
    )
  } else {
    built = BASES.map(base => build(base, "INDIVIDUAL", null))
  }
  store.set(scenario, built)
  return built
}

export function toListItem(detail: SettlementDetail): SettlementListItem {
  const b = detail.breakdown
  return {
    settlementId: detail.settlementId,
    groupBuyTitle: detail.groupBuyTitle,
    brandName: detail.brandName,
    periodStart: detail.periodStart,
    periodEnd: detail.periodEnd,
    status: detail.status,
    taxType: detail.taxType,
    confirmedSales: b.confirmedSales,
    rewardRate: b.rewardRate,
    saleReward: b.saleReward,
    deductionAmount: b.deductionAmount,
    withholdingTax: b.withholdingTax,
    vatAmount: b.vatAmount,
    payoutAmount: b.payoutAmount,
    payoutDate:
      detail.status === "PAID"
        ? detail.payout.paidDate
        : detail.status === "SCHEDULED"
          ? detail.payout.scheduledDate
          : null,
    taxInvoiceStatus: detail.taxInvoice?.status ?? null,
    createdAt: detail.createdAt,
  }
}

/** 주말만 건너뛰는 영업일 더하기(목업 전용 — 실제 공휴일 달력은 서버 소관) */
function addBusinessDays(from: Date, days: number) {
  const date = new Date(from)
  let left = days
  while (left > 0) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) left -= 1
  }
  date.setHours(23, 59, 0, 0)
  return date
}

const pad = (n: number) => String(n).padStart(2, "0")
function toLocalDateTime(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

/** C1 제출 — 정산 전액 보류 + 이슈 스레드 자동 개설 · 차액 선지급 없음 */
export function applyAdjustmentRequest(
  scenario: string,
  settlementId: number,
  body: AdjustmentRequestBody
) {
  const detail = getMockSettlements(scenario).find(
    item => item.settlementId === settlementId
  )
  if (!detail || !detail.canRequestAdjustment) throw new Error("CONFLICT")
  const now = new Date()
  detail.status = "ADJUSTING"
  detail.canRequestAdjustment = false
  detail.confirmedAt = null
  detail.payout.scheduledDate = null
  detail.distribution.brandPayoutDate = null
  detail.adjustment = {
    requestedBy: "ME",
    requesterName: ME,
    requestedAt: toLocalDateTime(now),
    originalReward: detail.breakdown.saleReward,
    requestedReward: body.requestedReward,
    latestProposal: null,
    myTurn: false,
    deadlineAt: toLocalDateTime(addBusinessDays(now, 10)),
    remainingBusinessDays: 10,
    threadId: null,
  }
}

/** 승인번호 제출 — 확인 중으로 넘어간다(운영팀 대조) */
export function applyTaxInvoiceSubmit(
  scenario: string,
  settlementId: number,
  body: TaxInvoiceSubmitBody
) {
  const detail = getMockSettlements(scenario).find(
    item => item.settlementId === settlementId
  )
  const invoice = detail?.taxInvoice
  if (
    !invoice ||
    (invoice.status !== "REQUIRED" && invoice.status !== "REJECTED")
  ) {
    throw new Error("CONFLICT")
  }
  invoice.status = "REVIEWING"
  invoice.submission = {
    approvalNo: body.approvalNo.trim(),
    submittedAt: toLocalDateTime(new Date()),
    attachmentCount: body.file ? 1 : 0,
  }
}
