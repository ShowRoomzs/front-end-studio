/**
 * 입점 반려 정형 사유 → 신청자 통지 라벨(01 rev.2 · 기-36).
 *
 * 화면은 서버의 통지 라벨(`TokenResponse.rejectReasonLabel`)을 먼저 쓴다. 이 표는 그 값이 없을 때
 * (예전 배포 서버)만 쓰는 대체 표다 — 백엔드 `CreatorRejectionReasonType.noticeLabel` 과 같은 값.
 * 「허위 팔로워 의심」은 신청자에게 「채널 운영 기준 미충족」으로 알린다.
 *
 * 운영자가 적은 상세 사유(`rejectReasonDetail`)는 내부용이라 어디에도 보이지 않는다.
 */
export const REJECTION_NOTICE_LABELS: Record<string, string> = {
  CHANNEL_PERFORMANCE_UNVERIFIABLE: "채널 실적 확인 불가",
  IDENTITY_INFO_MISMATCH: "본인 인증 정보 불일치",
  SUSPECTED_FAKE_FOLLOWERS: "채널 운영 기준 미충족",
  OTHER: "기타",
}

/** 코드를 모르거나 비었을 때 — enum 코드를 그대로 보이지 않는다(서버 신청 조회의 대체값과 같다). */
export const REJECTION_NOTICE_FALLBACK = "기타"

export function rejectionNoticeLabel(
  serverLabel: string | null | undefined,
  reasonType: string | null | undefined
): string {
  const label = serverLabel?.trim()
  if (label) return label
  return (
    (reasonType && REJECTION_NOTICE_LABELS[reasonType]) ||
    REJECTION_NOTICE_FALLBACK
  )
}
