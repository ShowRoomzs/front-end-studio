import {
  CONNECTION_QUERY_KEYS,
  THREAD_QUERY_KEYS,
} from "@/features/connections/constants/queryKeys"
import { connectionService } from "@/features/connections/services/connectionService"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import toast from "react-hot-toast"

/**
 * 연결 요청 수락·거절 (§14-4).
 *
 * 수락하면 그 즉시 스레드가 열리므로 요청 목록뿐 아니라 **스레드 목록과
 * 배지 합계까지** 다시 조회해야 "연결됨" 탭에 바로 나타난다.
 * 일괄 처리는 없다 — 카드 하나씩만 처리한다.
 */
export function useRespondToRequest() {
  const queryClient = useQueryClient()
  const [respondingId, setRespondingId] = useState<number | null>(null)

  const respond = useCallback(
    async (connectionId: number, action: "accept" | "reject") => {
      if (respondingId !== null) {
        return
      }

      setRespondingId(connectionId)
      try {
        await (action === "accept"
          ? connectionService.accept(connectionId)
          : connectionService.reject(connectionId))

        toast.success(
          action === "accept"
            ? "연결 요청을 수락했습니다. 대화가 열렸어요."
            : "연결 요청을 거절했습니다."
        )

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [CONNECTION_QUERY_KEYS.REQUESTS],
          }),
          queryClient.invalidateQueries({
            queryKey: [THREAD_QUERY_KEYS.THREAD_LIST],
          }),
          queryClient.invalidateQueries({
            queryKey: [THREAD_QUERY_KEYS.THREAD_SUMMARY],
          }),
        ])
      } catch {
        // 실패 사유는 apiInstance 인터셉터가 토스트로 띄운다
      } finally {
        setRespondingId(null)
      }
    },
    [queryClient, respondingId]
  )

  return { respond, respondingId }
}
