import { MESSAGE_POLL_INTERVAL } from "@/features/connections/constants/params"
import { THREAD_QUERY_KEYS } from "@/features/connections/constants/queryKeys"
import {
  adjustmentService,
  type AdjustmentCounterBody,
  type AdjustmentView,
} from "@/features/connections/services/adjustmentService"
import { SETTLEMENT_QUERY_KEYS } from "@/features/settlement/constants/params"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"

/**
 * 이슈 스레드의 고정 카드 · 제안 목록 · 내 권한.
 * 상대의 응답 · 기한 만료 배치로 차례가 바뀌므로 메시지와 같은 간격으로 다시 읽는다.
 */
export function useGetThreadAdjustment(threadId: number, enabled: boolean) {
  return useQuery({
    queryKey: [THREAD_QUERY_KEYS.THREAD_ADJUSTMENT, threadId],
    queryFn: () => adjustmentService.getByThread(threadId),
    enabled,
    refetchInterval: MESSAGE_POLL_INTERVAL,
    retry: false,
  })
}

/**
 * 응답이 끝나면 고정 카드는 응답 본문으로 바로 바꾸고, 새 카드가 붙은 메시지 · 목록 줄 · 정산 화면을 다시 읽는다.
 * 합의 · 다른 금액 제안 · 요청 철회는 정산 금액 · 보류 상태 · 지급 예정일을 바꾼다(정산 관리의 보류 탭 · 상세).
 */
function applyView(
  queryClient: QueryClient,
  threadId: number,
  view: AdjustmentView
) {
  queryClient.setQueryData(
    [THREAD_QUERY_KEYS.THREAD_ADJUSTMENT, threadId],
    view
  )
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: [THREAD_QUERY_KEYS.THREAD_MESSAGES, threadId],
    }),
    queryClient.invalidateQueries({
      queryKey: [THREAD_QUERY_KEYS.THREAD_LIST],
    }),
    ...Object.values(SETTLEMENT_QUERY_KEYS).map(key =>
      queryClient.invalidateQueries({ queryKey: [key] })
    ),
  ])
}

/** 실패(409 그사이 상대 응답 · 기한 만료 등)여도 화면을 서버의 지금 상태로 돌린다. 문구는 인터셉터가 띄운다 */
function refetchView(queryClient: QueryClient, threadId: number) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: [THREAD_QUERY_KEYS.THREAD_ADJUSTMENT, threadId],
    }),
    queryClient.invalidateQueries({
      queryKey: [THREAD_QUERY_KEYS.THREAD_MESSAGES, threadId],
    }),
  ])
}

export function useAdjustmentActions(threadId: number) {
  const queryClient = useQueryClient()

  const counter = useMutation({
    mutationFn: (variables: {
      adjustmentId: number
      body: AdjustmentCounterBody
    }) => adjustmentService.counter(variables.adjustmentId, variables.body),
    onSuccess: view => applyView(queryClient, threadId, view),
    onError: () => refetchView(queryClient, threadId),
  })

  const accept = useMutation({
    mutationFn: (variables: { adjustmentId: number; proposalId: number }) =>
      adjustmentService.accept(variables.adjustmentId, variables.proposalId),
    onSuccess: view => applyView(queryClient, threadId, view),
    onError: () => refetchView(queryClient, threadId),
  })

  const reject = useMutation({
    mutationFn: (variables: { adjustmentId: number; proposalId: number }) =>
      adjustmentService.reject(variables.adjustmentId, variables.proposalId),
    onSuccess: view => applyView(queryClient, threadId, view),
    onError: () => refetchView(queryClient, threadId),
  })

  /** 요청 철회(기-14) — 원래 금액 확정 · 보류 해제 · 종결. DEV에서 라우트가 없으면 서비스가 목업으로 대신한다 */
  const withdraw = useMutation({
    mutationFn: (view: AdjustmentView) => adjustmentService.withdraw(view),
    onSuccess: view => applyView(queryClient, threadId, view),
    onError: () => refetchView(queryClient, threadId),
  })

  return { counter, accept, reject, withdraw }
}
