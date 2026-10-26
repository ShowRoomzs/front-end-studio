import { apiInstance } from "@/common/lib/apiInstance"
import type { PageResponse } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import type {
  CreatorGroupBuyDetailResponse,
  CreatorGroupBuyListItem,
  CreatorGroupBuyListParams,
  CreatorGroupBuySummaryResponse,
  CreatorSuspensionBody,
  DetailNavParams,
  ExtensionRejectBody,
  FulfillmentCheckBody,
  PostBody,
} from "@/features/groupBuy/types"
import {
  normalizeDetail,
  normalizeListItem,
} from "@/features/groupBuy/utils/postStatus"

const BASE_URL = "/creator/group-buys"

/**
 * 실행 API는 모두 갱신된 상세를 돌려준다 — 호출부가 상세 캐시를 그 값으로 바꾼다.
 * 목록 · 상세는 받자마자 게시물 상태 옛 이름(HIDDEN)을 새 이름으로 맞춘다(utils/postStatus).
 */
export const creatorGroupBuyService = {
  getList: async (params: CreatorGroupBuyListParams) => {
    const { data } = await apiInstance.get<
      PageResponse<CreatorGroupBuyListItem>
    >(BASE_URL, { params: paramsToSearchParams(params) })
    return { ...data, content: data.content.map(normalizeListItem) }
  },

  getSummary: async () => {
    const { data } = await apiInstance.get<CreatorGroupBuySummaryResponse>(
      `${BASE_URL}/summary`
    )
    return data
  },

  /** 목록 조건을 함께 넘긴다 — 서버가 그 범위로 이전/다음 ID를 계산한다 */
  getDetail: async (groupBuyId: number, params: DetailNavParams) => {
    const { data } = await apiInstance.get<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}`,
      { params: paramsToSearchParams(params) }
    )
    return normalizeDetail(data)
  },

  saveDraft: async (groupBuyId: number, body: PostBody) => {
    const { data } = await apiInstance.put<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/post/draft`,
      body
    )
    return normalizeDetail(data)
  },

  submitPost: async (groupBuyId: number, body: PostBody) => {
    const { data } = await apiInstance.post<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/post/submission`,
      body
    )
    return normalizeDetail(data)
  },

  /** 승인 후 수정 — 재승인 없이 바로 반영된다 */
  editPost: async (groupBuyId: number, body: PostBody) => {
    const { data } = await apiInstance.patch<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/post`,
      body
    )
    return normalizeDetail(data)
  },

  acceptExtension: async (groupBuyId: number) => {
    const { data } = await apiInstance.post<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/extension/acceptance`
    )
    return normalizeDetail(data)
  },

  rejectExtension: async (groupBuyId: number, body: ExtensionRejectBody) => {
    const { data } = await apiInstance.post<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/extension/rejection`,
      body
    )
    return normalizeDetail(data)
  },

  requestSuspension: async (
    groupBuyId: number,
    body: CreatorSuspensionBody
  ) => {
    const { data } = await apiInstance.post<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/suspension-request`,
      body
    )
    return normalizeDetail(data)
  },

  checkFulfillment: async (groupBuyId: number, body: FulfillmentCheckBody) => {
    const { data } = await apiInstance.post<CreatorGroupBuyDetailResponse>(
      `${BASE_URL}/${groupBuyId}/fulfillment-check`,
      body
    )
    return normalizeDetail(data)
  },
}
