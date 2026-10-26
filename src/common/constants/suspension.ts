/*
  계정 이용 정지(ui-studio-13-suspension rev.2) — 화면 곳곳에 흩어지는 고정 문구를 한 곳에 모은다.
  기-01 · 02 · 03 은 【잠정】(변호사 확인 뒤 바뀔 수 있다) — 바뀌면 여기만 고친다.
*/

/** 막힌 버튼의 툴팁(시안 `.sztip`) */
export const SUSPENDED_TOOLTIP = "계정 이용 정지 중에는 이용할 수 없습니다"

/** URL 직접 진입 빈 상태 제목(시안 13 S5 「계정 이용 정지 중에는 게시물 작성을 이용할 수 없습니다」) */
export function suspendedFeatureTitle(feature: string) {
  return `계정 이용 정지 중에는 ${feature}을 이용할 수 없습니다`
}

/** S8 운영팀 채널 카드 — 차단 목록(인플루언서 · 서버 `memberType = CREATOR` 고정 문구) */
export const SUSPENSION_CARD_BLOCKED =
  "새 연결 수락 · 새 게시물 작성 · 공구 게시물 등록 · 공구 기간 연장 수락 · 오픈 전 공구의 오픈 · 계약 체결 · 쇼룸명 변경"

/** S8 계속 이용 목록 — 마지막 「탈퇴 요청」(기-03 【잠정】)은 굵게 · 조건 안내를 붙인다 */
export const SUSPENSION_CARD_CONTINUED =
  "진행 중 공구 판매 · 기존 게시물 수정 · 삭제 · 공구 중단 요청 · 소통 스레드 · 정산 조회 · 조정 요청 · 기본정보 수정 · "
export const SUSPENSION_CARD_WITHDRAWAL = "탈퇴 요청"
export const SUSPENSION_CARD_WITHDRAWAL_NOTE =
  "탈퇴 조건(끝나지 않은 공구 · 체결 전 계약 · 미정산)은 그대로라 정산이 남아 있으면 신청할 수 없습니다"

/** S8 이의 신청 기한 보조 줄 — 「통지 후 3영업일 이상」(기-02 【잠정】) */
export const SUSPENSION_APPEAL_RULE = "3영업일 이상"

/** S8 정산 줄 — 지급 정지 사유(정산 정보 불일치)면 배너 정산 줄과 같은 말, 아니면 시안 문구 */
export const SUSPENSION_PAYOUT_HELD_TEXT =
  "확정까지 진행되며, 내 리워드는 정지가 풀리면 다음 영업일에 지급됩니다."
export const SUSPENSION_PAYOUT_KEPT_TEXT =
  "이번 사유는 지급에 영향이 없습니다. 정산은 평소대로 확정 · 지급됩니다."

/** 정산 정보 불일치 — S7 상단 안내 · S8 바로가기가 이 사유에서만 갈린다(서버 `CreatorSuspensionReason`) */
export const SETTLEMENT_MISMATCH_REASON = "SETTLEMENT_INFO_MISMATCH"

/** 게시물 표현 사유 — S8 바로가기 [게시물 수정하기] */
export const POST_FIX_REASONS = [
  "AD_DISCLOSURE_OMITTED_REPEATED",
  "AD_LAW_VIOLATION_REPEATED",
]
