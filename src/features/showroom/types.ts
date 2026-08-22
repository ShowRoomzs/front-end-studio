/** 쇼룸 프로필 — BE `ShowroomProfileResponse`와 1:1 */
export interface ShowroomProfile {
  creatorId: number
  showroomName: string
  /** 앱 계정 프로필과 별개다. 없으면 null */
  profileImageUrl: string | null
  /** 주소 핸들 — 자동 생성·수정 불가 */
  showroomAddress: string
  /** 전체 URL — 복사 버튼이 그대로 쓰는 값 */
  showroomUrl: string
  introduction: string | null
  instagramUrl: string | null
  /** 연결코드가 프로필 응답에 함께 온다 — `/connections/code`를 따로 부르지 않는다 */
  connectionCode: string
  connectionCodeIssuedAt: string | null
}

/**
 * 프로필 수정 요청 — BE `ShowroomProfileUpdateRequest`와 1:1.
 *
 * 부분 수정이 아니라 **화면 값 전체를 그대로** 보낸다. 쇼룸 주소는 필드 자체가 없다
 * (자동 생성 후 수정 불가).
 */
export interface ShowroomProfileUpdateRequest {
  showroomName: string
  /**
   * 이미지 삭제는 **빈 문자열**로 보낸다. `null`은 "안 바꿈"과 구분되지 않아
   * 서버가 삭제로 받지 않는다 — 여기서 `null`을 넘기지 말 것.
   */
  profileImageUrl: string
  introduction: string
  instagramUrl: string
}

/** 쇼룸명 검사 — BE `ShowroomNameCheckResponse` */
export interface ShowroomNameCheckResult {
  isAvailable: boolean
  /** AVAILABLE / DUPLICATE / INVALID_FORMAT */
  code: string
  message: string
}

export interface ConnectionCode {
  connectionCode: string
  issuedAt: string | null
}

export interface ImageUploadResult {
  imageUrl: string
}

/** 기간 7종 — BE `StatsPeriod`. 화면 전체에 하나로 적용된다(카드별 기간 없음) */
export type StatsPeriod =
  | "DAYS_7"
  | "DAYS_14"
  | "DAYS_30"
  | "DAYS_60"
  | "DAYS_90"
  | "MONTHS_6"
  | "YEAR_1"

/** 인기 콘텐츠 정렬 — BE `TopContentSort`. 최신순은 없다(순위표의 목적이 성과 비교다) */
export type TopContentSort = "LIKES" | "VIEWS"

export interface FollowerStats {
  /** 기간과 무관한 현재 값 */
  total: number
  newFollowers: number
  /** 직전 기간이 0이면 null — 비교 불가라 `—`로 그린다 */
  changeRate: number | null
}

export interface ReachStats {
  /** 방문 횟수(같은 소비자의 재방문은 30분 세션 기준 1회) */
  visits: number
  /** 중복 제거한 사람 수 */
  visitors: number
  /** 방문자가 없으면 null */
  followConversionRate: number | null
}

/**
 * 비율 막대 한 줄 — 라벨과 비율뿐이다.
 * 인원 수는 서버가 내려주지 않는다(표본이 작을 때 비율보다 인원이 개인을 특정하기 쉽다).
 */
export interface DistributionItem {
  label: string
  ratio: number
}

export interface CompositionStats {
  /** 표본 부족이면 빈 배열 */
  ageGroups: Array<DistributionItem>
  genders: Array<DistributionItem>
  sampleSize: number
  /** 표본 최소치 미달로 비율을 비공개했는지 */
  ratioSuppressed: boolean
  minimumSampleSize: number
}

export interface RegionStats {
  /** 상위 5개 + 기타. 표본 부족이면 빈 배열 */
  items: Array<DistributionItem>
  sampleSize: number
  ratioSuppressed: boolean
  minimumSampleSize: number
}

/** 셋 다 분모가 0이면 null */
export interface BehaviorStats {
  averageVisitsPerFollower: number | null
  followerRevisitRate: number | null
  followerShareOfVisitors: number | null
}

export interface TopContentItem {
  rank: number
  postId: number
  thumbnailUrl: string | null
  /**
   * 본문 앞 40자. **제목이 아니다** — 일반 게시물에는 제목이 없어(§24-3) 서버가
   * 본문에서 잘라 준다. 사진만 있는 게시물이면 null이다.
   */
  excerpt: string | null
  publishedAt: string
  viewCount: number
  likeCount: number
}

/** 유입 경로 — BE `ShowroomVisitSource` */
export type ShowroomVisitSource =
  "INSTAGRAM_LINK" | "APP_SEARCH" | "GROUP_BUY_POST" | "DIRECT"

export interface TrafficSourceItem {
  source: ShowroomVisitSource
  label: string
  ratio: number
  /** 방문 횟수 — 도달 카드의 순방문과 같은 단위(사람 수가 아니다) */
  visits: number
}

export interface ShowroomStats {
  period: StatsPeriod
  /** "최근 30일" — 증감률 라벨을 여기서 파생한다 */
  periodLabel: string
  from: string
  to: string
  follower: FollowerStats
  reach: ReachStats
  composition: CompositionStats
  region: RegionStats
  behavior: BehaviorStats
  topContentSort: TopContentSort
  /** 없으면 빈 배열 — 카드를 숨기지 않는다 */
  topContents: Array<TopContentItem>
  sources: Array<TrafficSourceItem>
}
