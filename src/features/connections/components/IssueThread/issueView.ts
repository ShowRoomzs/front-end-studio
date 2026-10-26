import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import {
  PARTY_LABEL,
  VIEWER_PARTY,
} from "@/features/connections/constants/params"
import type { AdjustmentView } from "@/features/connections/services/adjustmentService"
import type {
  AdjustmentStatus,
  AdjustmentTone,
  SettlementParty,
  ThreadAdjustmentBadge,
} from "@/features/connections/services/threadService"

/** 서버 톤 → 배지 색. 상태색 규칙: 내 응답 필요=경고 · 상대 응답 대기=정보 · 합의 완료=성공 · 기한 만료 · 요청 철회=중립 */
export const TONE_VARIANT: Record<AdjustmentTone, StatusBadgeVariant> = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  NEUTRAL: "neutral",
}

export const isClosedStatus = (status: AdjustmentStatus) => status !== "OPEN"

/**
 * 종결 결과 — 머리 · 고정 카드 배지에 쓴다. 철회(WITHDRAWN)는 시안에 종결 화면이 없어
 * 결과 카드 문구(「요청 철회 · 원래 금액 확정 · 이슈 종결」)에서 앞말을 따왔다.
 */
const CLOSED_RESULT_LABEL: Record<Exclude<AdjustmentStatus, "OPEN">, string> = {
  AGREED: "합의 완료",
  EXPIRED: "기한 만료",
  WITHDRAWN: "요청 철회",
}

export const otherParty = (party: SettlementParty): SettlementParty =>
  party === "SELLER" ? "CREATOR" : "SELLER"

/** 상대 호칭 — 파트너센터에서는 「인플루언서」 */
export const COUNTERPART_LABEL = PARTY_LABEL[otherParty(VIEWER_PARTY)]

/**
 * 고정 카드 우측 배지 — 시안은 서버 차례 문구보다 짧게 쓴다(「상대 응답 대기」 → 「응답 대기」).
 * 종결은 결과로 적는다(합의 완료 · 기한 만료).
 */
export function pinBadge(view: AdjustmentView): {
  label: string
  variant: StatusBadgeVariant
} {
  if (view.status !== "OPEN") {
    return {
      label: CLOSED_RESULT_LABEL[view.status],
      variant: view.status === "AGREED" ? "success" : "neutral",
    }
  }
  return {
    label: view.turn === "THEIR_TURN" ? "응답 대기" : view.turnLabel,
    variant: TONE_VARIANT[view.turnTone],
  }
}

/** 스레드 머리 둘째 줄 — 「이슈 진행 중 · 내 응답 필요」 · 종결은 결과로 「이슈 종결 · 합의 완료」 */
export function headStatus(status: AdjustmentStatus, turnLabel: string) {
  if (status !== "OPEN") {
    return `이슈 종결 · ${CLOSED_RESULT_LABEL[status]}`
  }
  return `이슈 진행 중 · ${turnLabel}`
}

/**
 * 목록 줄 미리보기 — 「[이슈] 정산 조정 요청 · 내 응답 필요」. 앞말은 최신 제안의 종류다 — 상대가 다른 금액을
 * 내면 「[이슈] 다른 금액 제안 · 내 응답 필요」(시안 T2). 종결은 결과로 적는다
 * (「[이슈] 합의 완료 · 금액 변경」 · 「[이슈] 합의 기한 경과 · 원래 금액」 · 철회 「[이슈] 요청 철회 · 원래 금액」).
 */
export function issueListPreview(badge: ThreadAdjustmentBadge | null) {
  if (!badge) return "[이슈] 정산 조정 요청"
  if (badge.status === "AGREED") return "[이슈] 합의 완료 · 금액 변경"
  if (badge.status === "EXPIRED") return "[이슈] 합의 기한 경과 · 원래 금액"
  if (badge.status === "WITHDRAWN") return "[이슈] 요청 철회 · 원래 금액"
  return `[이슈] ${badge.latestProposalKindLabel ?? "정산 조정 요청"} · ${badge.turnLabel}`
}

/** 몇 번째 제안인가 — 첫 제안은 「요청」, 그 뒤는 「제안」 */
export const proposalNoun = (seq: number | undefined) =>
  seq === undefined || seq === 1 ? "요청" : "제안"

/**
 * [요청 철회] 노출(1021 기-14) — 서버 `permissions.canWithdraw`를 그대로 쓴다.
 * 10-24 이전 배포는 이 값을 내려 주지 않는다. 배포본은 그때 버튼을 숨기고(호출해도 404다),
 * DEV만 설계서 6-4 조건(협의 중 ∧ 처음 요청한 쪽 = 나 ∧ 최신 제안이 내 것 ∧ 응답 대기)으로 대신 판정해
 * 철회 목업(404 대체)을 확인할 수 있게 한다.
 */
export function canWithdrawOf(view: AdjustmentView) {
  const { canWithdraw } = view.permissions
  if (canWithdraw !== undefined) return canWithdraw
  if (!import.meta.env.DEV) return false
  return (
    view.status === "OPEN" &&
    view.requesterType === VIEWER_PARTY &&
    view.latestProposal.proposerType === VIEWER_PARTY &&
    view.latestProposal.status === "PENDING"
  )
}
