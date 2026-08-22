import type { StatsPeriod, TopContentSort } from "@/features/showroom/types"

/** 기간 7종 — 기본 30일. 화면 전체에 하나로 적용된다 */
export const STATS_PERIOD_OPTIONS: Array<{
  value: StatsPeriod
  label: string
}> = [
  { value: "DAYS_7", label: "최근 7일" },
  { value: "DAYS_14", label: "최근 14일" },
  { value: "DAYS_30", label: "최근 30일" },
  { value: "DAYS_60", label: "최근 60일" },
  { value: "DAYS_90", label: "최근 90일" },
  { value: "MONTHS_6", label: "최근 6개월" },
  { value: "YEAR_1", label: "최근 1년" },
]

export const DEFAULT_STATS_PERIOD: StatsPeriod = "DAYS_30"

/** 최신순은 없다 — 순위표의 목적이 성과 비교라 시간순 나열은 순위로서 의미가 없다 */
export const TOP_CONTENT_SORT_OPTIONS: Array<{
  value: TopContentSort
  label: string
}> = [
  { value: "LIKES", label: "좋아요 많은 순" },
  { value: "VIEWS", label: "노출 많은 순" },
]

export const DEFAULT_TOP_CONTENT_SORT: TopContentSort = "LIKES"

/** 쇼룸 소개글 상한 — BE `@Size(max = 50)` */
export const INTRODUCTION_MAX_LENGTH = 50

/** 쇼룸명 상한 — BE `@Size(2, 20)`. 카운터에 쓴다 */
export const SHOWROOM_NAME_MAX_LENGTH = 20

/** 프로필 이미지 — 시안 힌트 문구와 같은 값이어야 한다 */
export const PROFILE_IMAGE_MAX_BYTES = 20 * 1024 * 1024
export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/gif"
export const PROFILE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"]
export const PROFILE_IMAGE_MIN_SIZE = 160

/** 시안 `.hint` — 이미지 제약 안내. 상한값을 바꾸면 이 문구도 같이 고친다 */
export const PROFILE_IMAGE_HINT =
  "최소 160×160 · 정비율 · 최대 20MB · JPG · PNG · GIF"

/** 시안 `.err` 3종 — 이 화면에서 문구를 띄우는 건 중복·형식·파일뿐이다 */
export const ERROR_MESSAGE = {
  NAME_DUPLICATE: "이미 사용 중인 쇼룸명입니다. 다른 이름을 입력해주세요.",
  INSTAGRAM_URL_FORMAT: "https://로 시작하는 올바른 URL을 입력해 주세요.",
  IMAGE_TOO_LARGE:
    "20MB를 초과했습니다. 20MB 이하 JPG · PNG · GIF 파일을 올려주세요.",
  IMAGE_TYPE: "JPG · PNG · GIF 파일만 올릴 수 있습니다.",
  IMAGE_TOO_SMALL: "최소 160×160 이상, 정비율 이미지를 올려주세요.",
} as const

/** 시안 `.sel-sm` 갈매기표 — 셀렉트 배경 이미지 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%237B7F89' stroke-width='2.2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
}
