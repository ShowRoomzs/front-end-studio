import {
  GROUP_BUY_QUERY_KEYS,
  GROUP_BUY_SUMMARY_POLL_INTERVAL,
} from "@/features/groupBuy/constants/params"
import { creatorGroupBuyService } from "@/features/groupBuy/services/creatorGroupBuyService"
import type {
  CreatorGroupBuyDetailResponse,
  CreatorGroupBuyListParams,
  CreatorSuspensionBody,
  DetailNavParams,
  ExtensionRejectBody,
  FulfillmentCheckBody,
  PostBody,
} from "@/features/groupBuy/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useGetCreatorGroupBuyList(params: CreatorGroupBuyListParams) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.LIST, params],
    queryFn: () => creatorGroupBuyService.getList(params),
  })
}

/** 탭 카운트 + GNB 배지(내 조치가 필요한 공구 수). 셸과 목록이 같은 키를 쓴다 */
export function useGetCreatorGroupBuySummary() {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.SUMMARY],
    queryFn: creatorGroupBuyService.getSummary,
    refetchInterval: GROUP_BUY_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}

export function useGetCreatorGroupBuyDetail(
  groupBuyId: number,
  params: DetailNavParams
) {
  return useQuery({
    queryKey: [GROUP_BUY_QUERY_KEYS.DETAIL, groupBuyId, params],
    queryFn: () => creatorGroupBuyService.getDetail(groupBuyId, params),
    enabled: Number.isFinite(groupBuyId) && groupBuyId > 0,
    // 403·404는 "찾을 수 없음" 화면으로 끝낸다 — 재시도해도 결과가 같다
    retry: false,
  })
}

/**
 * 공구 쓰기 — 낙관적 업데이트를 쓰지 않는다. 실행 API가 갱신된 상세를 돌려주지만
 * 상세 캐시 키에 목록 조건이 섞여 있어(이웃 계산) 상세·목록·요약을 모두 다시 읽는다.
 */
function useInvalidateGroupBuy() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.DETAIL] })
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [GROUP_BUY_QUERY_KEYS.SUMMARY] })
  }
}

type WithId<T> = { groupBuyId: number; body: T }

function useGroupBuyAction<T>(
  action: (
    groupBuyId: number,
    body: T
  ) => Promise<CreatorGroupBuyDetailResponse>
) {
  const invalidate = useInvalidateGroupBuy()
  return useMutation({
    mutationFn: (variables: WithId<T>) =>
      action(variables.groupBuyId, variables.body),
    onSuccess: invalidate,
  })
}

export function useSaveDraft() {
  return useGroupBuyAction<PostBody>(creatorGroupBuyService.saveDraft)
}

export function useSubmitPost() {
  return useGroupBuyAction<PostBody>(creatorGroupBuyService.submitPost)
}

export function useEditPost() {
  return useGroupBuyAction<PostBody>(creatorGroupBuyService.editPost)
}

export function useAcceptExtension() {
  return useGroupBuyAction<void>(groupBuyId =>
    creatorGroupBuyService.acceptExtension(groupBuyId)
  )
}

export function useRejectExtension() {
  return useGroupBuyAction<ExtensionRejectBody>(
    creatorGroupBuyService.rejectExtension
  )
}

export function useRequestSuspension() {
  return useGroupBuyAction<CreatorSuspensionBody>(
    creatorGroupBuyService.requestSuspension
  )
}

export function useCheckFulfillment() {
  return useGroupBuyAction<FulfillmentCheckBody>(
    creatorGroupBuyService.checkFulfillment
  )
}
