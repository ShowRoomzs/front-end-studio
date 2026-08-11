import type { PageResponse } from "@/common/types/page"
import { THREAD_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import {
  threadService,
  type ThreadListItem,
} from "@/features/connections/services/threadService"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

/**
 * 스레드를 열면 읽음 처리한다.
 *
 * 배지 숫자를 폴링(30초)까지 기다렸다 줄이면 "읽었는데 아직 안 읽음으로 뜬다"는
 * 인상을 주므로, 성공 즉시 목록 캐시의 해당 스레드 카운트를 0으로 내리고
 * GNB 합계는 다시 조회한다.
 */
export function useMarkThreadRead(
  threadId: number | null,
  unreadCount: number
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (threadId === null || unreadCount === 0) {
      return
    }

    let isCancelled = false

    threadService
      .markRead(threadId)
      .then(() => {
        if (isCancelled) {
          return
        }
        queryClient.setQueriesData<PageResponse<ThreadListItem>>(
          { queryKey: [THREAD_QUERY_KEYS.THREAD_LIST] },
          current =>
            current && {
              ...current,
              content: current.content.map(thread =>
                thread.threadId === threadId
                  ? { ...thread, unreadCount: 0 }
                  : thread
              ),
            }
        )
        queryClient.invalidateQueries({
          queryKey: [THREAD_QUERY_KEYS.THREAD_SUMMARY],
        })
      })
      .catch(() => {
        // 읽음 처리 실패는 사용자가 할 수 있는 일이 없다 — 다음 진입에서 다시 시도된다
      })

    return () => {
      isCancelled = true
    }
  }, [queryClient, threadId, unreadCount])
}
