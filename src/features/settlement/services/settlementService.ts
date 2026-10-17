import type { PageResponse } from "@/common/types/page"
import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock"
import {
  applyAdjustmentRequest,
  applyTaxInvoiceSubmit,
  getMockSettlements,
  toListItem,
} from "@/features/settlement/services/settlementMock"
import {
  SETTLEMENT_STATUSES,
  type AdjustmentRequestBody,
  type SettlementDetail,
  type SettlementListItem,
  type SettlementListParams,
  type SettlementStatus,
  type SettlementSummary,
  type TaxInvoiceSubmitBody,
} from "@/features/settlement/types"

/**
 * 쇼룸 스튜디오 정산 관리(ui-studio-12 rev.3).
 *
 * ⚠️ 백엔드에 정산 API가 없다(`api/creator`에 settlement 없음). 개발 서버에서만 목업으로 채우고
 * 배포본에서는 화면이 「준비 중」을 띄운다 — 가짜 금액을 실제 인플루언서에게 보이면 안 된다.
 * API가 생기면 아래 함수 본문만 바꾼다. 예상 경로:
 * `GET /v1/creator/settlements` · `/summary` · `/{id}` · `/{id}/statement`(xlsx) ·
 * `/{id}/withholding-receipt`(pdf) · `/annual-statement?year=`(종합소득세 신고용) ·
 * `POST /{id}/adjustment-requests` · `POST /{id}/tax-invoice`(승인번호 + PDF).
 *
 * 시나리오(개발 서버 · `?mock=`):
 * - (없음) 비사업자 6건 — L1 · D1 · D2 · D3 · D4
 * - `settlement-empty` — L2 빈 상태
 * - `settlement-business` — 사업자 · 데일리 선크림 = D5 발행 필요
 * - `settlement-business-reviewing` — D5a 확인 중
 * - `settlement-business-rejected` — D5b 반려
 * - `settlement-business-approved` — D5c 확인 완료
 *
 * 목록의 필터 · 페이지를 바꾸면 주소에서 `mock`이 빠지므로, 한 번 고른 시나리오는 새로고침 전까지
 * 유지한다. 기본으로 돌아가려면 `?mock=`(빈 값)을 붙이거나 새로고침한다.
 */

let stickyScenario = ""

/** 지금 쓰는 목업 시나리오 — 조회 캐시 키에도 넣어 시나리오끼리 섞이지 않게 한다 */
export function currentSettlementScenario(): string {
  const fromUrl = mockScenario()
  if (fromUrl !== null) stickyScenario = fromUrl
  return stickyScenario
}

function source(): Array<SettlementDetail> {
  return getMockSettlements(currentSettlementScenario())
}

function notReady(): never {
  throw new ApiNotReadyError("정산 관리")
}

const isActionRequired = (detail: SettlementDetail) =>
  (detail.status === "ADJUSTING" && !!detail.adjustment?.myTurn) ||
  detail.taxInvoice?.status === "REQUIRED" ||
  detail.taxInvoice?.status === "REJECTED"

export const settlementService = {
  getSummary: async (): Promise<SettlementSummary> => {
    if (!DEV_MOCK_ENABLED) notReady()
    const details = source()
    const of = (status: SettlementStatus) =>
      details.filter(item => item.status === status)
    const paid = of("PAID")
    const scheduled = of("SCHEDULED")
    const confirming = of("CONFIRMING")
    const earliest = (dates: Array<string | null>) =>
      dates.filter((date): date is string => !!date).sort()[0] ?? null

    return mockDelay({
      paidTotal: paid.reduce((sum, d) => sum + d.breakdown.payoutAmount, 0),
      paidCount: paid.length,
      scheduledTotal: scheduled.reduce(
        (sum, d) => sum + d.breakdown.payoutAmount,
        0
      ),
      scheduledCount: scheduled.length,
      nextPayoutDate: earliest(scheduled.map(d => d.payout.scheduledDate)),
      confirmingCount: confirming.length,
      nearestConfirmDeadlineAt: earliest(
        confirming.map(d => d.confirmDeadlineAt)
      ),
      adjustingCount: of("ADJUSTING").length,
      statusCounts: Object.fromEntries(
        SETTLEMENT_STATUSES.map(status => [status, of(status).length])
      ) as SettlementSummary["statusCounts"],
      actionRequiredCount: details.filter(isActionRequired).length,
      payoutYears: paid.length > 0 ? [2026, 2025] : [],
    })
  },

  getList: async (
    params: SettlementListParams
  ): Promise<PageResponse<SettlementListItem>> => {
    if (!DEV_MOCK_ENABLED) notReady()
    const keyword = params.keyword.trim().toLowerCase()
    const statuses = ([] as Array<string>).concat(params.statuses)
    const filtered = source()
      .filter(detail => statuses.includes(detail.status))
      .filter(
        detail =>
          !keyword ||
          detail.groupBuyTitle.toLowerCase().includes(keyword) ||
          detail.brandName.toLowerCase().includes(keyword)
      )
    // 모든 행에 생성일이 있다(주문 종결 후에만 생성) — 「대기 행 맨 위」 같은 정렬 예외가 없다
    const sorted = [...filtered].sort((a, b) =>
      params.sort === "PAYOUT_DESC"
        ? b.breakdown.payoutAmount - a.breakdown.payoutAmount
        : b.createdAt.localeCompare(a.createdAt)
    )
    const page = Math.max(1, Number(params.page) || 1)
    const size = Number(params.size) || 20
    const totalResults = sorted.length
    const totalPages = Math.max(1, Math.ceil(totalResults / size))
    return mockDelay({
      content: sorted.slice((page - 1) * size, page * size).map(toListItem),
      pageInfo: {
        currentPage: page,
        totalPages,
        totalResults,
        limit: size,
        hasNext: page < totalPages,
      },
    })
  },

  getDetail: async (settlementId: number): Promise<SettlementDetail> => {
    if (!DEV_MOCK_ENABLED) notReady()
    const detail = source().find(item => item.settlementId === settlementId)
    if (!detail) throw new Error("NOT_FOUND")
    return mockDelay(detail)
  },

  /** C1 — 보내면 정산 전액 보류 + 이슈 스레드 자동 개설(목업은 상태만 바꾼다) */
  requestAdjustment: async (
    settlementId: number,
    body: AdjustmentRequestBody
  ): Promise<void> => {
    if (!DEV_MOCK_ENABLED) notReady()
    applyAdjustmentRequest(currentSettlementScenario(), settlementId, body)
    return mockDelay(undefined, 400)
  },

  /** D5 · D5b — 승인번호(+ PDF)를 제출하면 운영팀 대조(확인 중)로 넘어간다 */
  submitTaxInvoice: async (
    settlementId: number,
    body: TaxInvoiceSubmitBody
  ): Promise<void> => {
    if (!DEV_MOCK_ENABLED) notReady()
    applyTaxInvoiceSubmit(currentSettlementScenario(), settlementId, body)
    return mockDelay(undefined, 400)
  },
}
