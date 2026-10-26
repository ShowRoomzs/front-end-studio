import type {
  CreatorGroupBuyDetailResponse,
  CreatorGroupBuyListItem,
  GroupBuyPostStatus,
  GroupBuyTone,
} from "@/features/groupBuy/types"

/*
  1021 기-08 「숨김」 → 「노출 중지」 — 서버가 `HIDDEN("숨김", WARNING)`을
  `EXPOSURE_SUSPENDED("노출 중지", DANGER)`로 바꿨다(깨지는 변경).
  새 백엔드가 배포되기 전에는 옛 값이 내려오므로 응답을 받자마자 새 값으로 맞춘다 —
  화면 코드는 `EXPOSURE_SUSPENDED`만 본다.

  TODO: 새 백엔드 배포 확인 뒤 이 파일의 HIDDEN 호환(normalize*)을 걷어 낸다.
*/

/** 시안 B5a 배지 — 게시물(07) S8과 같은 이름 · 같은 위험색 */
export const POST_EXPOSURE_SUSPENDED_LABEL = "노출 중지"
const POST_EXPOSURE_SUSPENDED_TONE: GroupBuyTone = "DANGER"

function normalizePost<T>(
  status: GroupBuyPostStatus,
  label: string,
  tone: GroupBuyTone,
  build: (status: GroupBuyPostStatus, label: string, tone: GroupBuyTone) => T
): T {
  if (status === "HIDDEN" || status === "EXPOSURE_SUSPENDED") {
    return build(
      "EXPOSURE_SUSPENDED",
      POST_EXPOSURE_SUSPENDED_LABEL,
      POST_EXPOSURE_SUSPENDED_TONE
    )
  }
  return build(status, label, tone)
}

export function normalizeListItem(
  item: CreatorGroupBuyListItem
): CreatorGroupBuyListItem {
  return normalizePost(
    item.postStatus,
    item.postStatusLabel,
    item.postStatusTone,
    (postStatus, postStatusLabel, postStatusTone) => ({
      ...item,
      postStatus,
      postStatusLabel,
      postStatusTone,
    })
  )
}

export function normalizeDetail(
  detail: CreatorGroupBuyDetailResponse
): CreatorGroupBuyDetailResponse {
  const post = normalizePost(
    detail.post.status,
    detail.post.statusLabel,
    detail.post.statusTone,
    (status, statusLabel, statusTone) => ({
      ...detail.post,
      status,
      statusLabel,
      statusTone,
    })
  )
  const { permissions } = detail
  // 배포 전 응답에는 canEditPostTitle이 없다 — 서버 규칙(GroupBuyPostPolicy.isTitleLocked:
  // 진행 중 ∧ 노출 중지 아님이면 제목 잠금)과 같게 채운다
  const canEditPostTitle =
    typeof permissions.canEditPostTitle === "boolean"
      ? permissions.canEditPostTitle
      : permissions.canEditPost &&
        !(
          detail.groupBuy.status === "IN_PROGRESS" &&
          post.status !== "EXPOSURE_SUSPENDED"
        )
  return {
    ...detail,
    post,
    permissions: { ...permissions, canEditPostTitle },
  }
}
