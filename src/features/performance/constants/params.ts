import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type {
  CreatorPerformanceSort,
  CreatorPerformanceStatus,
  PerformanceListParams,
  PerformanceMonths,
  PerformanceTone,
  RewardStage,
} from "@/features/performance/types"

export const PERFORMANCE_LIST_PATH = "/performance"
export const GROUP_BUY_LIST_PATH = "/group-buy"
export const SETTLEMENT_LIST_PATH = "/settlement"
export const CONTRACT_LIST_PATH = "/contracts"
/** 연결·소통 — 스레드는 `?threadId=`로 연다 */
export const CONNECTIONS_PATH = "/connections"
/** 쇼룸 관리 › 쇼룸 현황 탭 */
export const SHOWROOM_STATS_PATH = "/showroom?tab=stats"

export const PERFORMANCE_QUERY_KEYS = {
  LIST: "creatorPerformanceList",
  SUMMARY: "creatorPerformanceSummary",
  DETAIL: "creatorPerformanceDetail",
} as const

/**
 * 상태 칩 문구 — 칩은 건수만 오고 라벨이 없어 서버 enum 라벨(`CreatorPerformanceStatus.label`)을 옮겨 둔다.
 * 표 · 상세 배지는 응답의 `statusLabel`을 쓴다. 칩 순서는 시안(집계 중 · 조정 협의 · 정산 완료).
 */
export const PERFORMANCE_STATUS_LABEL: Record<
  CreatorPerformanceStatus,
  string
> = {
  COLLECTING: "집계 중",
  ADJUSTING: "조정 협의",
  SETTLED: "정산 완료",
}

/** 서버 톤 → 배지 색(집계 중 중립 · 조정 협의 경고 · 정산 완료 성공 — 위험 · 정보색 없음) */
export const PERFORMANCE_TONE_VARIANT: Record<
  PerformanceTone,
  StatusBadgeVariant
> = {
  NEUTRAL: "neutral",
  WARNING: "warning",
  SUCCESS: "success",
}

/** 서버 `RewardStage.label` — 금액 대신 그리는 말 */
export const REWARD_STAGE_LABEL: Record<RewardStage, string> = {
  AFTER_SETTLEMENT: "정산 후 확정",
  AFTER_AGREEMENT: "합의 후 확정",
  CONFIRMED: "확정",
}

export const PERFORMANCE_SORT_OPTIONS: Array<{
  value: CreatorPerformanceSort
  label: string
}> = [
  { value: "ENDED_DESC", label: "종료일 최신순" },
  { value: "REWARD_DESC", label: "리워드 높은 순" },
  { value: "CONVERSION_DESC", label: "구매전환율 높은 순" },
]

/** 기간 셀렉트 — 시안은 「최근 6개월」(기본)만 그렸다. 3 · 12는 서버가 받는 나머지 값 */
export const PERFORMANCE_MONTH_OPTIONS: Array<{
  value: PerformanceMonths
  label: string
}> = [
  { value: 3, label: "최근 3개월" },
  { value: 6, label: "최근 6개월" },
  { value: 12, label: "최근 12개월" },
]

export const PERFORMANCE_DEFAULT_MONTHS: PerformanceMonths = 6

export const PERFORMANCE_INITIAL_PARAMS: PerformanceListParams = {
  months: PERFORMANCE_DEFAULT_MONTHS,
  status: ["COLLECTING", "ADJUSTING", "SETTLED"],
  keyword: "",
  sort: "ENDED_DESC",
  page: 1,
  size: 20,
}

/** 유입 경로 도넛 · 게시물 막대 — 인디고 한 색의 명도 4단(시안 #3B5BDB → #CED5F9) */
export const INDIGO_STEPS = [
  "#3B5BDB",
  "#6C84E5",
  "#9DACEF",
  "#CED5F9",
] as const

/** 성별 2색 — 여성은 위험색(#B23434)과 일부러 다른 값이다(시안 rule) */
export const GENDER_COLOR = { female: "#D9455F", male: "#3B5BDB" } as const
