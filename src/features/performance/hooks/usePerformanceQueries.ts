import { mockScenario } from "@/common/utils/devMock"
import { PERFORMANCE_QUERY_KEYS } from "@/features/performance/constants/params"
import {
  performanceErrorInfo,
  performanceService,
} from "@/features/performance/services/performanceService"
import type { PerformanceListParams } from "@/features/performance/types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

/*
  개발 서버 `?mock=` 시나리오도 키에 넣는다 — 주소만 바꿔도 다른 상태를 그린다(배포본은 늘 null).
*/

/** 404 · 409 · 400은 다시 불러도 같다 */
const retryUnlessClientError = (failureCount: number, error: unknown) => {
  const { status } = performanceErrorInfo(error)
  if (status !== undefined && status >= 400 && status < 500) return false
  return failureCount < 2
}

export function useGetPerformanceList(params: PerformanceListParams) {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEYS.LIST, params, mockScenario()],
    queryFn: () => performanceService.getList(params),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientError,
  })
}

/** 목록 머리 기간 · KPI 8장 · 상태 칩 — 기간만 따른다(검색어 · 칩이 바뀌어도 다시 부르지 않는다) */
export function useGetPerformanceSummary(months: number) {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEYS.SUMMARY, months, mockScenario()],
    queryFn: () => performanceService.getSummary(months),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientError,
  })
}

export function useGetPerformanceDetail(groupBuyId: number) {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEYS.DETAIL, groupBuyId, mockScenario()],
    queryFn: () => performanceService.getDetail(groupBuyId),
    enabled: Number.isFinite(groupBuyId),
    retry: retryUnlessClientError,
  })
}
