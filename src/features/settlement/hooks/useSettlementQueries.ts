import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
import { SETTLEMENT_QUERY_KEYS } from "@/features/settlement/constants/params"
import {
  currentSettlementScenario,
  settlementService,
} from "@/features/settlement/services/settlementService"
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

/*
  배포본에서는 호출하지 않는다 — API가 없어 화면이 「준비 중」을 띄운다.
  캐시 키의 시나리오는 개발 서버의 `?mock=` 값이다(배포본은 늘 빈 문자열).
*/

export function useGetSettlementList(params: SettlementListParams) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, currentSettlementScenario(), params],
    queryFn: () => settlementService.getList(params),
    placeholderData: keepPreviousData,
    enabled: DEV_MOCK_ENABLED,
  })
}

/** KPI · 상태 칩 건수 · GNB 배지 — 검색 조건과 무관한 전체 기준. 셸과 목록이 같은 키를 쓴다 */
export function useGetSettlementSummary() {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY, currentSettlementScenario()],
    queryFn: settlementService.getSummary,
    enabled: DEV_MOCK_ENABLED,
  })
}

export function useGetSettlementDetail(settlementId: number) {
  return useQuery({
    queryKey: [
      SETTLEMENT_QUERY_KEYS.DETAIL,
      currentSettlementScenario(),
      settlementId,
    ],
    queryFn: () => settlementService.getDetail(settlementId),
    enabled: DEV_MOCK_ENABLED && Number.isFinite(settlementId),
    // 없는 정산은 「찾을 수 없음」으로 끝낸다 — 재시도해도 결과가 같다
    retry: false,
  })
}

/** 쓰기 뒤에는 상세 · 목록 · 요약(GNB 배지)을 모두 다시 읽는다 */
function useInvalidateSettlement() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL] })
    queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.LIST] })
    queryClient.invalidateQueries({ queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY] })
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
