import type { PostStatus } from "@/features/posts/services/postService"
import type { StatsPeriod } from "@/features/posts/services/postInsightService"

export const POST_PAGE_SIZE = 24

/** 서버 `Post.MAX_IMAGE_COUNT` · `MAX_CONTENT_LENGTH`와 같은 값 — 즉시 피드백용이다 */
export const POST_IMAGE_MAX = 20
export const POST_CONTENT_MAX = 2000

/**
 * 이의 신청 글자수 — 서버 상한은 1,000자지만 화면은 **500자**로 막는다.
 * 좁은 쪽을 쓰면 서버가 거절할 일이 없다.
 */
export const APPEAL_CONTENT_MAX = 500

/** 장당 20MB — 서버 `ImageService.MAX_FILE_SIZE` */
export const POST_IMAGE_MAX_BYTES = 20 * 1024 * 1024

/**
 * JPG·PNG만. 공통 이미지 목록과 달리 **gif가 빠져 있다**(서버 `POST_ALLOWED_EXTENSIONS`).
 * 영상을 받지 않는 것과 같은 이유다 — 릴스·영상은 인스타그램에 직접 올리는 것이 계약상
 * 콘텐츠 의무이고, 쇼룸은 사진만 받는다.
 */
export const POST_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png"] as const
export const POST_ACCEPT_ATTRIBUTE = "image/jpeg,image/png"

/**
 * 허용 비율(가로/세로) — 서버 `Post.MIN_ASPECT_RATIO` ~ `MAX_ASPECT_RATIO`.
 *
 * 1.91:1(가로) ~ 4:5(세로). 범위 안이면 원본 비율 그대로 두고, 벗어나면 가장 가까운
 * 경계값으로 자른다. 사용자가 비율을 고르지 않는다 — 인스타와 같은 연속 범위 클램프다.
 */
export const ASPECT_RATIO_MIN = 0.8 // 4:5
export const ASPECT_RATIO_MAX = 1.91 // 1.91:1

/** 목록 격자·쇼룸 격자의 고정 크롭 — 피드의 가변 높이와 다르다(§24-2) */
export const GRID_ASPECT_RATIO = 4 / 5

/**
 * 상태 탭 4종 (§24-1) — 순서까지 시안 그대로다.
 *
 * 「노출 중지」탭이 심사 중(`UNDER_REVIEW`)까지 담는 것은 **서버가 처리한다**.
 * 여기서 상태를 합치거나 거르지 않는다.
 */
export const POST_STATUS_TABS: Array<{ status?: PostStatus; label: string }> = [
  { label: "전체" },
  { status: "PUBLISHED", label: "게시중" },
  { status: "SUSPENDED", label: "노출 중지" },
  { status: "DRAFT", label: "작성중" },
]

/** 배지 3종 — 서버 상태 5종을 화면 3종으로 접는다 */
export const POST_STATUS_BADGE: Record<
  PostStatus,
  { label: string; className: string } | null
> = {
  DRAFT: {
    label: "작성중",
    // 정보색 — 내 손에 있는 대기다
    className: "bg-sz-info-bg text-sz-info-text",
  },
  PUBLISHED: {
    label: "게시중",
    className: "bg-sz-success-bg text-sz-success-text",
  },
  SUSPENDED: {
    label: "노출 중지",
    // 위험색 — 기한 내 대응하지 않으면 영구 삭제로 끝나는 상태다(원칙 ①)
    className: "bg-sz-danger-bg text-sz-danger-text",
  },
  // 심사 중이어도 배지는 노출 중지 그대로다 — 사실이 바뀐 게 아니다(§24-5)
  UNDER_REVIEW: {
    label: "노출 중지",
    className: "bg-sz-danger-bg text-sz-danger-text",
  },
  // 목록에 오지 않는다
  DELETED: null,
}

export const INSIGHT_PERIODS: Array<{ value: StatsPeriod; label: string }> = [
  { value: "DAYS_7", label: "최근 7일" },
  { value: "DAYS_14", label: "최근 14일" },
  { value: "DAYS_30", label: "최근 30일" },
  { value: "DAYS_60", label: "최근 60일" },
  { value: "DAYS_90", label: "최근 90일" },
  { value: "MONTHS_6", label: "최근 6개월" },
  { value: "YEAR_1", label: "최근 1년" },
]

export const INSIGHT_DEFAULT_PERIOD: StatsPeriod = "DAYS_30"
