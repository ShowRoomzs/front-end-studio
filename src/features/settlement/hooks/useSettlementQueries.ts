import {
  SETTLEMENT_ITEMS_PAGE_SIZE,
  SETTLEMENT_QUERY_KEYS,
  SETTLEMENT_SUMMARY_POLL_INTERVAL,
} from "@/features/settlement/constants/params"
import { settlementService } from "@/features/settlement/services/settlementService"
import type {
  AdjustmentRequestBody,
  SettlementListParams,
  TaxInvoiceSubmitBody,
} from "@/features/settlement/types"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

export function useGetSettlementList(params: SettlementListParams) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, params],
    queryFn: () => settlementService.getList(params),
    placeholderData: keepPreviousData,
  })
}

/** KPI · 상태 칩 건수 · GNB 배지 — 검색 조건과 무관한 전체 기준. 셸과 목록이 같은 키를 쓴다 */
export function useGetSettlementSummary() {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY],
    queryFn: settlementService.getSummary,
    refetchInterval: SETTLEMENT_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}

export function useGetSettlementDetail(settlementId: number) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL, settlementId],
    queryFn: () => settlementService.getDetail(settlementId),
    enabled: Number.isFinite(settlementId),
    // 없는 정산 · 남의 정산(404)은 「찾을 수 없음」으로 끝낸다 — 재시도해도 결과가 같다
    retry: false,
  })
}

/** 명세 전체 보기 — 펼쳤을 때만 부른다 */
export function useGetSettlementItems(
  settlementId: number,
  page: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.ITEMS, settlementId, page],
    queryFn: () =>
      settlementService.getItems(
        settlementId,
        page,
        SETTLEMENT_ITEMS_PAGE_SIZE
      ),
    enabled,
    placeholderData: keepPreviousData,
  })
}

/** 조정 요청 모달의 자동 계산 — 입력(디바운스 후)마다 서버가 계산한다. null이면 원래 금액만 */
export function useGetAdjustmentPreview(
  settlementId: number,
  rewardAmount: number | null
) {
  return useQuery({
    queryKey: [
      SETTLEMENT_QUERY_KEYS.ADJUSTMENT_PREVIEW,
      settlementId,
      rewardAmount,
    ],
    queryFn: () =>
      settlementService.getAdjustmentPreview(settlementId, rewardAmount),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

/** 내 세무 구분 — 목록 · 요약 응답에 없어 프로필에서 읽는다 */
export function useGetProfileTaxInfo() {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.PROFILE_TAX],
    queryFn: settlementService.getProfileTaxInfo,
    staleTime: 5 * 60_000,
    retry: false,
  })
}

/** 쓰기 뒤에는 상세 · 목록 · 요약(GNB 배지)을 모두 다시 읽는다 */
export function useInvalidateSettlement() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL] })
    queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY] })
    queryClient.invalidateQueries({
      queryKey: [SETTLEMENT_QUERY_KEYS.ADJUSTMENT_PREVIEW],
    })
  }
}

export function useRequestAdjustment() {
  const invalidate = useInvalidateSettlement()
  return useMutation({
    mutationFn: (variables: {
      settlementId: number
      body: AdjustmentRequestBody
    }) =>
      settlementService.requestAdjustment(
        variables.settlementId,
        variables.body
      ),
    onSuccess: invalidate,
  })
}

export function useSubmitTaxInvoice() {
  const invalidate = useInvalidateSettlement()
  return useMutation({
    mutationFn: (variables: {
      settlementId: number
      body: TaxInvoiceSubmitBody
    }) =>
      settlementService.submitTaxInvoice(
        variables.settlementId,
        variables.body
      ),
    onSuccess: invalidate,
  })
}
