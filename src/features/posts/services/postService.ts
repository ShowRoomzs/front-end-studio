import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageInfo } from "@/common/types/page"

/**
 * 게시물의 **노출 상태** — 백엔드 `PostStatus`와 1:1 (§24-1).
 *
 * 화면 배지는 3종(작성중·게시중·노출 중지)인데 서버 값은 5종이다. 차이는 두 가지다 —
 * `UNDER_REVIEW`는 배지도 탭도 **여전히 노출 중지**이고(이의를 넣었다고 사실이 바뀐 게
 * 아니다), `DELETED`는 목록에 아예 오지 않는다. 배지를 그릴 때 상태값을 그대로 쓰지 말고
 * `POST_STATUS_BADGE`를 거칠 것.
 */
export type PostStatus =
  "DRAFT" | "PUBLISHED" | "SUSPENDED" | "UNDER_REVIEW" | "DELETED"

/**
 * 저장 의도 — 같은 본문을 두 버튼이 공유한다 (§24-3).
 *
 * 상태값이 아니라 의도를 보내는 이유는 버튼마다 활성 조건이 다르기 때문이다.
 * 임시저장은 "사진 1장 **또는** 본문 1자", 게시하기는 "사진 최소 1장" — 어떤 규칙으로
 * 검증할지가 요청에 담겨야 서버가 프론트와 같은 기준으로 막는다.
 */
export type PostSaveAction = "DRAFT" | "PUBLISH"

export type PostAppealStatus = "PENDING" | "APPROVED" | "REJECTED"

export type PostSuspensionReason =
  | "MEDICAL_CLAIM"
  | "AD_DISCLOSURE"
  | "COPYRIGHT"
  | "MISLEADING_AD"
  | "SEXUAL_CONTENT"
  | "VIOLENCE_HATE"
  | "PERSONAL_INFO"
  | "OTHER"

/**
 * 저장 요청에 실리는 사진 한 장.
 *
 * `width`·`height`는 **크롭본을 업로드하고 서버가 돌려준 값**을 그대로 쓴다. 프론트가 잰
 * 값을 보내면 서버가 다시 읽은 크기와 어긋나 게시 단계에서 알 수 없는 이유로 거절될 수 있다.
 */
export interface PostImageRequest {
  /** 표시용 URL — 크롭 결과 */
  imageUrl: string
  /** 원본 URL — 크롭 전 파일. 반려 후 유예 기간 내려받기에 쓰인다(§24-6) */
  originalUrl: string
  width: number
  height: number
  fileSize?: number
}

export interface SavePostRequest {
  /** 선택 — 사진만 있는 게시물을 허용한다(§24-3) */
  content?: string | null
  /** 배열 순서가 곧 노출 순서이고 첫 장이 대표 사진이다. 최대 20장 */
  images: Array<PostImageRequest>
  action: PostSaveAction
}

export interface PostImageResponse {
  /** 0이 대표 사진 */
  sortOrder: number
  imageUrl: string
  originalUrl: string
  width: number
  height: number
}

/** 상태 탭 건수 — 서버가 목록과 **같은 트랜잭션에서** 세어 함께 내려준다(§24-1) */
export interface StatusCount {
  /** null이면 전체 탭 */
  status: PostStatus | null
  label: string
  count: number
}

/** 목록 항목 — 제목이 없으므로 대표 사진과 본문 앞부분이 게시물을 알아보는 단서다 */
export interface PostListItem {
  postId: number
  status: PostStatus
  /** 목록 격자는 비율과 무관하게 균일 4:5 센터 크롭이다(§24-2) */
  thumbnailUrl: string | null
  imageCount: number
  /** 본문 앞 40자 */
  contentPreview: string | null
  impressionCount: number
  likeCount: number
  /** 작성중이면 null */
  publishedAt: string | null
  createdAt: string
  /** 노출 중지 상태에서만 값이 있다 */
  appealDeadline: string | null
}

export interface PostPageResponse {
  content: Array<PostListItem>
  pageInfo: PageInfo
  statusCounts: Array<StatusCount>
}

/** 운영자 조치 — 사유·근거 규정·조치 시각·처리자·기한을 그대로 화면에 남긴다(§24-5) */
export interface SuspensionResponse {
  suspensionId: number
  reasonCode: PostSuspensionReason
  reasonLabel: string
  reasonDetail: string | null
  policyRef: string | null
  suspendedAt: string
  suspendedBy: number | null
  appealDeadline: string
  /** 기한 내 미신청일 때만 true — 버튼 노출 조건을 이 값으로만 판정한다 */
  appealable: boolean
}

export interface AppealResponse {
  appealId: number
  status: PostAppealStatus
  content: string
  submittedAt: string
  reviewedAt: string | null
  reviewComment: string | null
  /** 반려된 건에만 값이 있다 — 원본 내려받기 유예 만료(§24-6) */
  graceUntil: string | null
  expectedReviewBusinessDays: number | null
}

export interface PostDetailResponse {
  postId: number
  status: PostStatus
  content: string | null
  /** 가로/세로 — 1.9100 ~ 0.8000. 문자열로 온다(BigDecimal) */
  aspectRatio: string | null
  images: Array<PostImageResponse>
  impressionCount: number
  likeCount: number
  publishedAt: string | null
  createdAt: string
  modifiedAt: string | null
  /**
   * 중지·심사 중에는 false (§24-5).
   * 상태값으로 프론트가 다시 판정하지 말 것 — 판정 규칙은 서버에 하나만 둔다.
   */
  editable: boolean
  /** 심사 중에만 false — 중지 중 본인 삭제는 허용한다(출구) */
  deletable: boolean
  suspension: SuspensionResponse | null
  appeal: AppealResponse | null
}

export interface OriginalImagesResponse {
  graceUntil: string | null
  images: Array<PostImageResponse>
}

export interface PostIdResponse {
  postId: number
}

export const postService = {
  /**
   * 목록 — `status`를 빼면 전체 탭이다.
   *
   * 「노출 중지」 탭은 서버가 `UNDER_REVIEW`까지 함께 담아 내려준다. 탭 건수와 탭 목록이
   * 같은 답을 쓰므로 프론트가 두 상태를 합치거나 거르지 않는다.
   */
  getPosts: async (params: BaseParams & { status?: PostStatus }) => {
    const { data } = await apiInstance.get<PostPageResponse>("/creator/posts", {
      params,
    })
    return data
  },

  getPost: async (postId: number) => {
    const { data } = await apiInstance.get<PostDetailResponse>(
      `/creator/posts/${postId}`
    )
    return data
  },

  createPost: async (request: SavePostRequest) => {
    const { data } = await apiInstance.post<PostIdResponse>(
      "/creator/posts",
      request
    )
    return data
  },

  /**
   * 수정 — 사진은 **전체 교체**다.
   *
   * 추가·삭제·순서 변경을 나눈 엔드포인트가 없다. 화면이 그리는 것은 언제나 "지금 이
   * 순서의 사진들"이고, 서버도 `(post_id, sort_order)` 유니크 때문에 통째로 갈아끼운다.
   */
  updatePost: async (postId: number, request: SavePostRequest) => {
    const { data } = await apiInstance.put<PostIdResponse>(
      `/creator/posts/${postId}`,
      request
    )
    return data
  },

  /** 작성중 → 게시중. 편집 없이 목록에서 곧바로 올릴 때 쓴다 */
  publish: async (postId: number) => {
    const { data } = await apiInstance.post<PostIdResponse>(
      `/creator/posts/${postId}/publish`
    )
    return data
  },

  /** 되돌릴 수 없고 좋아요 수도 함께 사라진다 — 확인 모달에서만 부를 것(§24-3) */
  deletePost: async (postId: number) => {
    await apiInstance.delete(`/creator/posts/${postId}`)
  },

  /** 게시물당 1회 (§24-5) */
  submitAppeal: async (postId: number, content: string) => {
    const { data } = await apiInstance.post<AppealResponse>(
      `/creator/posts/${postId}/appeal`,
      { content }
    )
    return data
  },

  /** 반려 통지 후 유예 기간 동안 본인만 받을 수 있다(§24-6) */
  getOriginalImages: async (postId: number) => {
    const { data } = await apiInstance.get<OriginalImagesResponse>(
      `/creator/posts/${postId}/originals`
    )
    return data
  },
}
