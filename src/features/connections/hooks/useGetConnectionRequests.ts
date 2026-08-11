import { REQUEST_PAGE_SIZE } from "@/features/connections/constants/params"
import { CONNECTION_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import { connectionService } from "@/features/connections/services/connectionService"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

/**
 * "요청함" 탭 — 받은 연결 요청.
 *
 * `status=ALL`로 한 번만 조회해서 대기중/처리이력을 프론트에서 나눈다.
 * 좌측 목록은 둘 다 보여주고(이력은 흐리게), 우측 카드 패널은 **미확인(액션
 * 필요) 건만** 보여준다(§14-4 처리 이력 표시 규칙) — 두 번 조회할 이유가 없다.
 */
export function useGetConnectionRequests(keyword: string) {
  const query = useQuery({
    queryKey: [CONNECTION_QUERY_KEYS.REQUESTS, keyword],
    queryFn: () =>
      connectionService.getRequests({
        status: "ALL",
        keyword: keyword || undefined,
        page: 1,
        size: REQUEST_PAGE_SIZE,
      }),
  })

  const { pending, resolved } = useMemo(() => {
    const items = query.data?.content ?? []
    return {
      pending: items.filter(item => item.status === "REQUESTED"),
      resolved: items.filter(item => item.status !== "REQUESTED"),
    }
  }, [query.data])

  return { ...query, pending, resolved }
}
