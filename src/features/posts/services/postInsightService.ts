import { apiInstance } from "@/common/lib/apiInstance"

/** 기간 7종 — 백엔드 `StatsPeriod`와 1:1. 쇼룸 관리(#8)와 같은 목록을 쓴다 */
export type StatsPeriod =
  | "DAYS_7"
  | "DAYS_14"
  | "DAYS_30"
  | "DAYS_60"
  | "DAYS_90"
  | "MONTHS_6"
  | "YEAR_1"

/** 비율 막대 한 줄 — 인원 수는 내려오지 않는다(표본이 작을 때 개인을 특정할 수 있다) */
export interface DistributionItem {
  label: string
  ratio: number
}

/** ① 반응 */
export interface ReactionStats {
  /** 와이어의 "조회수" — 용어는 **노출**로 통일한다(§24-7) */
  impressions: number
  likes: number
  /** 좋아요 ÷ 노출(%). **노출이 0이면 null**이다 — 0%로 표시하지 않는다 */
  likeRate: number | null
}

/** ② 이 게시물을 보고 한 행동 — 본 뒤 24시간 이내, 마지막으로 본 게시물에 귀속(라스트 터치) */
export interface BehaviorStats {
  showroomVisits: number
  visitRate: number | null
  follows: number
  followRate: number | null
  /** 언팔로우 시 귀속 행이 사라져 과거 수치가 줄어들 수 있는지 */
  followCountMayDecrease: boolean
}

/** ③ 본 사람 — 집계값만. 개인 식별 정보·개별 목록은 어떤 화면에도 두지 않는다 */
export interface ViewerStats {
  ageGroups: Array<DistributionItem>
  genders: Array<DistributionItem>
  /** 중복 제거한 조회자 수 */
  sampleSize: number
  /** 표본 최소치 미달로 비율을 감췄는지 — true면 막대 대신 안내 문구를 그린다 */
  ratioSuppressed: boolean
  minimumSampleSize: number | null
}

export interface PostInsightResponse {
  postId: number
  period: StatsPeriod
  periodLabel: string
  from: string
  /** 노출 중지된 게시물은 **중지 시각**이 상한이다 */
  to: string
  truncatedBySuspension: boolean
  reaction: ReactionStats
  behavior: BehaviorStats
  viewers: ViewerStats
}

export const postInsightService = {
  getInsights: async (postId: number, period: StatsPeriod) => {
    const { data } = await apiInstance.get<PostInsightResponse>(
      `/creator/posts/${postId}/insights`,
      { params: { period } }
    )
    return data
  },
}
