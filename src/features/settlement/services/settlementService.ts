import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import {
  SETTLEMENT_STATUSES,
  type AdjustmentPreviewResponse,
  type AdjustmentRequestBody,
  type AdjustmentRequestResponse,
  type CreatorProfileTaxInfo,
  type SettlementDetail,
  type SettlementItem,
  type SettlementListItem,
  type SettlementListParams,
  type SettlementStatus,
  type SettlementSummary,
  type TaxInvoiceSubmitBody,
  type TaxInvoiceSubmitResponse,
} from "@/features/settlement/types"
import axios from "axios"

/*
  쇼룸 스튜디오 정산 관리 — back-end `CreatorSettlementController`(`/v1/creator/settlements`)
  · `CreatorSettlementAdjustmentController`(`/v1/creator`).

  조회 전용 화면이다. 쓰기는 [정산 조정 요청](POST adjustment)과 사업자 승인번호 [제출](POST tax-invoice)
  둘뿐이고, 협의 응답(proposals · accept · reject)은 이슈 스레드 화면의 몫이라 여기서 부르지 않는다.
*/

const BASE_URL = "/creator/settlements"

const SORTS: ReadonlyArray<string> = ["CREATED_DESC", "PAYOUT_DESC"]

/** 상태 칩이 전부 켜진 기본 화면 = 파라미터 없음(서버 「비면 전체」). 주소에 남은 옛 값(상태 · 정렬)은 버린다 — 서버가 400을 낸다 */
function toListSearchParams(params: SettlementListParams) {
  const selected = ([] as Array<string>)
    .concat(params.status)
    .filter((value): value is SettlementStatus =>
      (SETTLEMENT_STATUSES as ReadonlyArray<string>).includes(value)
    )
  return paramsToSearchParams({
    status: selected.length === SETTLEMENT_STATUSES.length ? [] : selected,
    keyword: params.keyword.trim(),
    sort: SORTS.includes(params.sort) ? params.sort : null,
    page: params.page,
    size: params.size,
  })
}

/**
 * 서버 에러 코드를 든 에러 — 다운로드는 응답이 Blob이라 `response.data.code`를 바로 읽을 수 없어
 * 본문을 JSON으로 풀어 이 형태로 바꾼다. 호출부는 `code`로 문구를 고른다.
 */
export class SettlementApiError extends Error {
  readonly code: string | undefined
  readonly status: number | undefined
  /** 서버 `ErrorResponse.message` — 본문이 없으면(네트워크 · 5xx 게이트웨이) undefined */
  readonly serverMessage: string | undefined

  constructor(params: {
    code?: string
    status?: number
    serverMessage?: string
    fallback: string
  }) {
    super(params.serverMessage ?? params.fallback)
    this.name = "SettlementApiError"
    this.code = params.code
    this.status = params.status
    this.serverMessage = params.serverMessage
  }
}

async function toSettlementApiError(error: unknown) {
  if (!axios.isAxiosError(error)) return error
  const status = error.response?.status
  let body: unknown = error.response?.data
  if (body instanceof Blob) {
    try {
      body = JSON.parse(await body.text())
    } catch {
      body = null
    }
  }
  const { code, message } = (body ?? {}) as {
    code?: string
    message?: string
  }
  return new SettlementApiError({
    code,
    status,
    serverMessage: message,
    fallback: error.message,
  })
}

/**
 * ⚠️ 운영 서버 CORS가 Content-Disposition을 노출하지 않아 브라우저에서는 이 헤더가 비어 온다 —
 * 대체 이름을 서버 규칙과 같게 만든다(`SettlementStatementExcel` · `WithholdingReceiptGenerator`
 * · `CreatorSettlementDocumentService`).
 */
function filenameFrom(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename\*=UTF-8''([^;]+)/i)
  return match ? decodeURIComponent(match[1]) : fallback
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** 파일 다운로드 — 실패는 화면이 코드별 문구를 띄우므로 전역 토스트를 끈다 */
async function download(
  url: string,
  fallbackName: string,
  params?: Record<string, unknown>
) {
  try {
    const response = await apiInstance.get<Blob>(url, {
      params,
      responseType: "blob",
      suppressErrorToast: true,
    })
    saveBlob(
      response.data,
      filenameFrom(
        response.headers["content-disposition"] as string | undefined,
        fallbackName
      )
    )
  } catch (error) {
    throw await toSettlementApiError(error)
  }
}

export const settlementService = {
  getList: async (params: SettlementListParams) => {
    const { data } = await apiInstance.get<PageResponse<SettlementListItem>>(
      BASE_URL,
      { params: toListSearchParams(params) }
    )
    return data
  },

  /** KPI · 상태 칩 건수 · GNB 배지 — 검색 조건과 무관한 전체 기준 */
  getSummary: async () => {
    const { data } = await apiInstance.get<SettlementSummary>(
      `${BASE_URL}/summary`
    )
    return data
  },

  getDetail: async (settlementId: number) => {
    const { data } = await apiInstance.get<SettlementDetail>(
      `${BASE_URL}/${settlementId}`,
      // 남의 정산 · 없음은 404 — 화면이 「찾을 수 없음」을 그린다
      { suppressErrorToast: true }
    )
    return data
  },

  /** 명세 전체(페이지) — 상태와 무관하게 열린다(확인 기간 중 검산용 · 다운로드는 확정 후) */
  getItems: async (settlementId: number, page: number, size: number) => {
    const { data } = await apiInstance.get<PageResponse<SettlementItem>>(
      `${BASE_URL}/${settlementId}/items`,
      { params: { page, size } }
    )
    return data
  },

  /** 확정 전이면 409 SETTLEMENT_STATEMENT_NOT_READY · 서버 파일명 `정산명세_{정산번호}.xlsx` */
  downloadItems: (settlementId: number, settlementNumber: string) =>
    download(
      `${BASE_URL}/${settlementId}/items/download`,
      `정산명세_${settlementNumber}.xlsx`
    ),

  /** 생성 전이면 409 SETTLEMENT_RECEIPT_NOT_READY · 서버 파일명 `원천징수영수증_{정산번호}.pdf` */
  downloadWithholdingReceipt: (
    settlementId: number,
    settlementNumber: string
  ) =>
    download(
      `${BASE_URL}/${settlementId}/withholding-receipt`,
      `원천징수영수증_${settlementNumber}.pdf`
    ),

  /** 제출한 세금계산서 PDF — 서버 파일명은 업로드한 원래 이름(`taxInvoice.attachmentName`) */
  downloadTaxInvoiceAttachment: (settlementId: number, fileName: string) =>
    download(`${BASE_URL}/${settlementId}/tax-invoice/attachment`, fileName),

  /** 그 해 지급 완료분이 없으면 404 SETTLEMENT_NOT_FOUND(빈 파일 대신) · 서버 파일명 `연간지급내역_{연도}.xlsx` */
  downloadAnnualStatement: (year: number) =>
    download(`${BASE_URL}/annual-statement`, `연간지급내역_${year}.xlsx`, {
      year,
    }),

  /** 사업자 승인번호(+ PDF) 제출 — 에러 문구는 화면이 코드별로 그린다 */
  submitTaxInvoice: async (
    settlementId: number,
    body: TaxInvoiceSubmitBody
  ) => {
    const formData = new FormData()
    formData.append("approvalNumber", body.approvalNumber)
    if (body.attachment) formData.append("attachment", body.attachment)
    try {
      const { data } = await apiInstance.post<TaxInvoiceSubmitResponse>(
        `${BASE_URL}/${settlementId}/tax-invoice`,
        formData,
        { suppressErrorToast: true }
      )
      return data
    } catch (error) {
      throw await toSettlementApiError(error)
    }
  },

  /**
   * 요청 모달의 자동 계산 — 절사 규칙을 FE가 들면 정산 화면과 1원이 어긋나서 서버가 계산한다.
   * 입력마다 부르므로 실패를 토스트로 쌓지 않는다(모달이 「—」로 둔다).
   */
  getAdjustmentPreview: async (
    settlementId: number,
    rewardAmount: number | null
  ) => {
    const { data } = await apiInstance.get<AdjustmentPreviewResponse>(
      `${BASE_URL}/${settlementId}/adjustment/preview`,
      {
        params: rewardAmount === null ? undefined : { rewardAmount },
        suppressErrorToast: true,
      }
    )
    return data
  },

  /** 보내면 정산 전액 보류 + 3자 이슈 스레드 자동 개설 */
  requestAdjustment: async (
    settlementId: number,
    body: AdjustmentRequestBody
  ) => {
    try {
      const { data } = await apiInstance.post<AdjustmentRequestResponse>(
        `${BASE_URL}/${settlementId}/adjustment`,
        body,
        { suppressErrorToast: true }
      )
      return data
    } catch (error) {
      throw await toSettlementApiError(error)
    }
  },

  /**
   * 세무 구분 — 목록 · 요약 응답에 없어 내 프로필에서 읽는다(목록 열 「원천징수 / 부가세」 · 누적 수령
   * 「세후 / 부가세 포함」). 실패해도 화면은 그린다.
   */
  getProfileTaxInfo: async () => {
    const { data } = await apiInstance.get<CreatorProfileTaxInfo>(
      "/creator/profile",
      { suppressErrorToast: true }
    )
    return { businessType: data.businessType ?? null }
  },
}
