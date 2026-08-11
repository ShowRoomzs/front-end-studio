import {
  MESSAGE_PAGE_SIZE,
  MESSAGE_POLL_INTERVAL,
} from "@/features/connections/constants/params"
import { THREAD_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import {
  threadService,
  type MessageItem,
} from "@/features/connections/services/threadService"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"

/**
 * 스레드 메시지 — 최신순 커서 페이징.
 *
 * 채팅은 오프셋 페이징을 쓰면 새 메시지가 들어올 때마다 경계가 밀려서
 * 같은 메시지를 두 번 받거나 건너뛴다. 그래서 서버가 커서 방식만 제공한다.
 * 화면은 오래된 것부터 아래로 쌓이므로 `messages`는 뒤집어서 돌려준다.
 */
export function useGetThreadMessages(threadId: number | null) {
  const query = useInfiniteQuery({
    queryKey: [THREAD_QUERY_KEYS.THREAD_MESSAGES, threadId],
    queryFn: ({ pageParam }) =>
      threadService.getMessages(threadId!, {
        cursor: pageParam,
        size: MESSAGE_PAGE_SIZE,
      }),
    enabled: threadId !== null,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: lastPage =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    refetchInterval: MESSAGE_POLL_INTERVAL,
  })

  const messages = useMemo<Array<MessageItem>>(() => {
    const newestFirst = query.data?.pages.flatMap(page => page.content) ?? []
    return [...newestFirst].reverse()
  }, [query.data])

  return { ...query, messages }
}
