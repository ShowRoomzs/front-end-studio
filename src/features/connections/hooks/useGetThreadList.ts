import {
  THREAD_LIST_POLL_INTERVAL,
  THREAD_PAGE_SIZE,
} from "@/features/connections/constants/params"
import { THREAD_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import { threadService } from "@/features/connections/services/threadService"
import { useQuery } from "@tanstack/react-query"

/**
 * "연결됨" 탭 목록.
 *
 * 정렬(운영자 채널 최상단 고정 + 최근 메시지순)과 노출 대상(연결됨만) 모두
 * 서버가 확정해서 내려준다 — 프론트에서 다시 정렬하거나 거르지 않는다.
 */
export function useGetThreadList(keyword: string) {
  return useQuery({
    queryKey: [THREAD_QUERY_KEYS.THREAD_LIST, keyword],
    queryFn: () =>
      threadService.getThreads({
        keyword: keyword || undefined,
        page: 1,
        size: THREAD_PAGE_SIZE,
      }),
    refetchInterval: THREAD_LIST_POLL_INTERVAL,
  })
}
