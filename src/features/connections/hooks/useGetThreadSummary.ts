import { SUMMARY_POLL_INTERVAL } from "@/features/connections/constants/params"
import { THREAD_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import { threadService } from "@/features/connections/services/threadService"
import { useQuery } from "@tanstack/react-query"

/**
 * GNB 배지(안 읽은 수)와 "요청함" 탭 배지(미처리 요청 건수)를 함께 내려주는
 * 경량 엔드포인트. 셸 전체에서 항상 돌기 때문에 목록 조회로 대신하지 않는다.
 */
export function useGetThreadSummary() {
  return useQuery({
    queryKey: [THREAD_QUERY_KEYS.THREAD_SUMMARY],
    queryFn: threadService.getSummary,
    refetchInterval: SUMMARY_POLL_INTERVAL,
  })
}
