import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import type {
  ContractDocumentType,
  CreatorContractClausesResponse,
  CreatorContractDeclineRequest,
  CreatorContractDetailResponse,
  CreatorContractDocumentDownloadResponse,
  CreatorContractListItem,
  CreatorContractListParams,
  CreatorContractNavigationParams,
  CreatorContractResendRequestResponse,
  CreatorContractSummaryResponse,
} from "@/features/contracts/types"

const BASE_URL = "/creator/contracts"

/**
 * 스튜디오 계약 관리 — 쓰기는 거절·재발송 요청 둘뿐이다.
 * 서명·조건 수정·작성·취소 엔드포인트는 존재하지 않는다(§27-4).
 */
export const creatorContractService = {
  getList: async (params: CreatorContractListParams) => {
    const { data } = await apiInstance.get<
      PageResponse<CreatorContractListItem>
    >(BASE_URL, { params: paramsToSearchParams(params) })
    return data
  },

  getSummary: async () => {
    const { data } = await apiInstance.get<CreatorContractSummaryResponse>(
      `${BASE_URL}/summary`
    )
    return data
  },

  /** 목록 조건을 함께 넘긴다 — 서버가 그 범위로 이전/다음 ID를 계산한다 */
  getDetail: async (
    contractId: number,
    params: CreatorContractNavigationParams
  ) => {
    const { data } = await apiInstance.get<CreatorContractDetailResponse>(
      `${BASE_URL}/${contractId}`,
      { params: paramsToSearchParams(params) }
    )
    return data
  },

  getClauses: async (contractId: number) => {
    const { data } = await apiInstance.get<CreatorContractClausesResponse>(
      `${BASE_URL}/${contractId}/clauses`
    )
    return data
  },

  getDocument: async (contractId: number, type: ContractDocumentType) => {
    const { data } =
      await apiInstance.get<CreatorContractDocumentDownloadResponse>(
        `${BASE_URL}/${contractId}/documents/${type}`,
        // 체결 문서가 아직 업로드 전이면 404가 정상이다
        { suppressErrorToast: true }
      )
    return data
  },

  decline: async (contractId: number, body: CreatorContractDeclineRequest) => {
    const { data } = await apiInstance.post<CreatorContractDetailResponse>(
      `${BASE_URL}/${contractId}/decline`,
      body
    )
    return data
  },

  /** 요청이지 발송이 아니다 — 실제 재발송은 운영자가 모두싸인에서 한다 */
  requestResend: async (contractId: number) => {
    const { data } =
      await apiInstance.post<CreatorContractResendRequestResponse>(
        `${BASE_URL}/${contractId}/resend-request`
      )
    return data
  },
}
