import type { BaseParams, PageResponse } from "@/common/types/page"

/*
  쇼룸 스튜디오 성과 관리(ui-studio-10 rev.2) — 서버 DTO 그대로.

  원본: back-end origin/main `api/creator/performance/dto/CreatorPerformanceDto.java`
  · enum `api/creator/performance/type/*` · `domain/performance/type/PerformanceTone`
  · `domain/member/creator/type/CreatorBusinessType`. 이름 · nullable을 서버와 맞춘다.

  값 규칙(서버): 값이 없으면 null(화면 「—」)이고 0은 측정된 0이다. 비율은 % 숫자(소수 1자리 · 5.8 = 5.8%)
  · 금액은 원 · 리워드는 세전. 돈은 정산 행 그대로라 FE가 계산하지 않는다.

  날짜(두 종류가 섞인다)
  - KST 벽시계(그대로 읽는다): 공구 시작 · 종료(`periodStartAt` · `periodEndAt`) · 합의 기한(`adjustmentDeadlineAt`)
  - UTC 벽시계(`parseServerDateTime`): 제안 · 합의 시각(`Offer.at` · `Adjustment.agreedAt`) — 서버 now()
  - LocalDate: 요약의 `periodFrom` · `periodTo`
*/

/** 스튜디오 성과 상태 3종 — 공통 5종을 인플루언서 관점으로 접은 값(저장하지 않는다) */
export const CREATOR_PERFORMANCE_STATUSES = [
  "COLLECTING",
  "ADJUSTING",
  "SETTLED",
] as const

export type CreatorPerformanceStatus =
  (typeof CREATOR_PERFORMANCE_STATUSES)[number]

export const CREATOR_PERFORMANCE_SORTS = [
  "ENDED_DESC",
  "REWARD_DESC",
  "CONVERSION_DESC",
] as const

export type CreatorPerformanceSort = (typeof CREATOR_PERFORMANCE_SORTS)[number]

/** 서버가 받는 조회 기간(개월) — 그 밖의 값은 400 */
export const PERFORMANCE_MONTHS = [3, 6, 12] as const

export type PerformanceMonths = (typeof PERFORMANCE_MONTHS)[number]

/** 성과 화면은 조치 화면이 아니라 위험 · 정보색이 없다 */
export type PerformanceTone = "NEUTRAL" | "WARNING" | "SUCCESS"

/** 돈의 세 상태 — 숫자를 단정하는 것은 CONFIRMED뿐이다 */
export type RewardStage = "AFTER_SETTLEMENT" | "AFTER_AGREEMENT" | "CONFIRMED"

export type CreatorBusinessType = "INDIVIDUAL" | "BUSINESS"

// ------------------------------------------------------------------ 목록 · 요약

export interface CreatorPerformanceListItem {
  groupBuyId: number
  groupBuyNumber: string
  groupBuyTitle: string
  brandName: string
  marketId: number
  /** KST 벽시계 */
  periodStartAt: string
  /** KST 벽시계 — 조기 마감이면 실제 종료 시각 */
  periodEndAt: string
  status: CreatorPerformanceStatus
  statusLabel: string
  statusTone: PerformanceTone
  /** 집계 중이면 null */
  confirmedSalesAmount: number | null
  confirmedQuantity: number | null
  conversionRate: number | null
  rewardStage: RewardStage
  /** CONFIRMED에서만 값 */
  myRewardAmount: number | null
}

export type CreatorPerformanceListPage =
  PageResponse<CreatorPerformanceListItem>

/** 성비(정수 %) — 미확인 제외 · 두 값의 합은 100 · 큰 쪽을 앞에 */
export interface GenderRatio {
  majorFirst: "FEMALE" | "MALE"
  female: number
  male: number
}

/** KPI 8장 — 모집단은 정산 완료 공구만. 정산 완료 0건이면 settledCount만 0이고 나머지는 null */
export interface CreatorPerformanceKpi {
  totalReward: number | null
  averageReward: number | null
  settledCount: number
  averageConversionRate: number | null
  averageRepeatRate: number | null
  averageFollowerBuyerRate: number | null
  averagePostImpressions: number | null
  genderRatio: GenderRatio | null
}

/** 목록 머리 · KPI · 상태 칩 — 기간만 따르고 검색어 · 칩과 무관 */
export interface CreatorPerformanceSummary {
  /** LocalDate */
  periodFrom: string
  /** LocalDate */
  periodTo: string
  periodLabel: string
  kpi: CreatorPerformanceKpi
  /** 세 키가 항상 있다(0 포함) */
  statusCounts: Record<CreatorPerformanceStatus, number>
  /** false면 빈 상태(L2) */
  hasAnyEnded: boolean
}

// ------------------------------------------------------------------ 상세

export interface CreatorPerformanceHeader {
  groupBuyId: number
  groupBuyNumber: string
  groupBuyTitle: string
  brandName: string
  marketId: number
  /** [계약서 보기] */
  contractId: number
  periodStartAt: string
  periodEndAt: string
  status: CreatorPerformanceStatus
  statusLabel: string
  statusTone: PerformanceTone
}

export type PerformanceNoticeLink = "ISSUE_THREAD" | "ISSUE_THREAD_HISTORY"

export interface CreatorPerformanceNotice {
  /** NEUTRAL | WARNING */
  tone: PerformanceTone
  /** 서버 문장 그대로 */
  text: string
  link: PerformanceNoticeLink | null
  threadId: number | null
}

/** 금액 칸 — stage가 CONFIRMED가 아니면 amount = null이고 금액 대신 stage 라벨을 그린다 */
export interface CreatorPerformanceMoney {
  stage: RewardStage
  amount: number | null
  /** 판매 리워드의 원래 금액(정산 전이면 예정액) — 고정 지급비 · 합계 칸은 null */
  originalAmount: number | null
  note: string | null
}

export interface CreatorPerformanceRewardBar {
  salesReward: CreatorPerformanceMoney
  fixedFee: CreatorPerformanceMoney
  totalReward: CreatorPerformanceMoney
}

/** 금액 지표 — estimated면 「예정」 태그 */
export interface AmountFigure {
  value: number | null
  basis: string
  estimated: boolean
}

/** 비율 지표(%) — 분모가 0이면 null */
export interface RateFigure {
  value: number | null
  basis: string
  estimated: boolean
}

export interface FollowerDelta {
  /** 음수 가능 */
  delta: number
  countAtEnd: number
}

export interface CreatorPerformanceDetailKpi {
  myReward: CreatorPerformanceMoney
  confirmedSales: AmountFigure
  conversionRate: RateFigure
  repeatRate: RateFigure
  followerDelta: FollowerDelta
  genderRatio: GenderRatio | null
  genderEstimated: boolean
}

export type TrafficSource =
  "INTERNAL" | "PROFILE_LINK" | "POST_LINK" | "PRODUCT_LINK"

export interface SourceItem {
  source: TrafficSource
  label: string
  visitors: number
  ratio: number | null
}

export interface PostBlock {
  postId: number
  impressions: number
  uniqueViewers: number
  productViews: number
  productViewRate: number | null
  orders: number
  orderRate: number | null
  likes: number
  /** 앱에 공유 이벤트가 없어 항상 null(「—」) */
  shares: number | null
}

export interface CreatorPerformanceTraffic {
  visitorCount: number
  /** 항상 4행 */
  sources: Array<SourceItem>
  /** 게시물이 없으면 null */
  post: PostBlock | null
}

export interface CreatorPerformanceFunnel {
  visitorCount: number
  orderCount: number
  nonOrderVisitors: number
  confirmedOrderCount: number
  cancelCount: number
  returnCount: number
  deliveryExceptionCount: number
  confirmedRate: number | null
  finalConversionRate: number | null
  /** 구간 2가 예정값인가 */
  estimated: boolean
}

export interface ProductRow {
  productId: number
  productName: string
  detailViews: number
  orders: number
  confirmedQuantity: number
  confirmedAmount: number
  /** % (BigDecimal — 12.0) */
  rewardRate: number
  rewardAmount: number
}

export interface Highlight {
  productId: number
  productName: string
  /** 서버 문장 그대로 */
  basis: string
}

export interface Highlights {
  mostViewed: Highlight | null
  bestConversion: Highlight | null
  topReward: Highlight | null
}

export interface CreatorPerformanceSales {
  estimated: boolean
  products: Array<ProductRow>
  /** 상품별 리워드 합 = 계약 기준 판매 리워드 */
  contractRewardAmount: number | null
  /** 합의 반영 차액(D4만) — 상품에 배분하지 않는다 */
  adjustmentDelta: number | null
  highlights: Highlights
}

export interface GenderSplit {
  female: number | null
  male: number | null
  femaleCount: number
  maleCount: number
  unknownCount: number
}

export interface AgeGroup {
  /** 서버 구간 라벨(18–24세 · 25–34세 · 35–44세 · 45세 이상 · 미확인 · 기타) */
  label: string
  count: number
  /** 구간 비율(%) — 분모는 전체 구매 소비자 */
  total: number | null
  /** 구간 안 여성 — 전체 대비 % */
  female: number | null
  male: number | null
}

export interface Distribution {
  /** true면 genders = null · ageGroups = [] */
  suppressed: boolean
  sampleSize: number
  minimumSampleSize: number
  genders: GenderSplit | null
  ageGroups: Array<AgeGroup>
}

export interface CreatorPerformanceConsumers {
  estimated: boolean
  buyerCount: number
  newBuyerCount: number
  repeatBuyerCount: number
  followerBuyerCount: number
  followerBuyerRate: number | null
  distribution: Distribution
}

export interface FollowerSide {
  visitors: number
  postViewers: number
  orders: number
  confirmedOrders: number
  conversionRate: number | null
}

export interface CreatorPerformanceFollowers {
  follower: FollowerSide
  nonFollower: FollowerSide
  countAtEnd: number
  delta: number
  followerVisitorRate: number | null
  /** 구매전환율 열만 예정값인가 */
  conversionEstimated: boolean
}

export interface Offer {
  amount: number
  /** UTC 벽시계(now()) */
  at: string
}

export interface Adjustment {
  /** 합의 금액 − 원래 금액(음수 가능) */
  delta: number
  /** UTC 벽시계(now()) */
  agreedAt: string
  /** 「브랜드 제안」 | 「내 요청」 | 「합의」 */
  agreedProposalLabel: string
}

export interface Payout {
  businessType: CreatorBusinessType
  /** CONFIRMED에서만 */
  amount: number | null
  note: string
}

export interface CreatorPerformanceReward {
  stage: RewardStage
  confirmedSalesAmount: number | null
  originalRewardAmount: number | null
  myRequest: Offer | null
  counterProposal: Offer | null
  adjustment: Adjustment | null
  finalRewardAmount: number | null
  fixedFeeAmount: number
  totalRewardAmount: number | null
  payout: Payout
  settlementId: number | null
  settlementStatusLabel: string | null
  adjustmentThreadId: number | null
  /** KST 벽시계 — ADJUSTING에서만 */
  adjustmentDeadlineAt: string | null
}

export interface Recollaboration {
  marketId: number
  /** 브랜드 ↔ 인플루언서 1:1 스레드 — 없으면 null */
  threadId: number | null
}

export interface CreatorPerformanceDetail {
  groupBuy: CreatorPerformanceHeader
  notice: CreatorPerformanceNotice | null
  rewardBar: CreatorPerformanceRewardBar
  kpi: CreatorPerformanceDetailKpi
  traffic: CreatorPerformanceTraffic
  funnel: CreatorPerformanceFunnel
  sales: CreatorPerformanceSales
  consumers: CreatorPerformanceConsumers
  followers: CreatorPerformanceFollowers
  reward: CreatorPerformanceReward
  recollaboration: Recollaboration
}

// ------------------------------------------------------------------ 화면 상태(URL)

/** 서버에는 `toListSearchParams`로 바꿔 보낸다 — 칩이 전부 켜지면 status 생략 */
export interface PerformanceListParams extends BaseParams {
  /** URL은 문자열이라 숫자로 읽어 3 · 6 · 12만 보낸다 */
  months: number
  status: Array<CreatorPerformanceStatus>
  keyword: string
  sort: CreatorPerformanceSort
}
