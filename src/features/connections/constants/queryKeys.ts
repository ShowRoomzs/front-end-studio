export const CONNECTION_QUERY_KEYS = {
  REQUESTS: "connectionRequests",
} as const

export const THREAD_QUERY_KEYS = {
  THREAD_LIST: "threadList",
  THREAD_SUMMARY: "threadSummary",
  THREAD_MESSAGES: "threadMessages",
  /** 이슈 스레드의 고정 카드 · 제안 목록 · 권한 */
  THREAD_ADJUSTMENT: "threadAdjustment",
} as const
