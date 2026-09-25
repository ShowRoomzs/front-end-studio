import type { CreatorContractDetailResponse } from "@/features/contracts/types"
import { formatMonthDayTime } from "@/features/contracts/utils/format"

/**
 * 상세 화면 8종(S3·S3a·S3b·S3c·S6·S7·S8·S9)의 분기. 서버는 `viewPhase` 같은 값을 만들지 않고,
 * 근거는 `status` · `signature.brandSignedAt` · `signature.creatorSignedAt` 셋이다(§27 설계서 4-1).
 * 버튼은 `permissions`가 정한다 — 이 값은 배너·스텝퍼·메타 행·문구만 고른다.
 */
export type CreatorViewState =
  | "signingNone" // S3 — 양측 미서명
  | "signingTheirs" // S3a — 브랜드 서명 완료 · 내 서명 필요
  | "signingMine" // S3b — 내 서명 완료 · 브랜드 대기
  | "conclusionPending" // S3c
  | "concluded" // S6
  | "declined" // S7
  | "expired" // S8
  | "canceled" // S9

export function deriveCreatorView(
  detail: CreatorContractDetailResponse
): CreatorViewState {
  const { status, signature } = detail

  switch (status) {
    case "SIGNING":
      if (signature.brandSignedAt && signature.creatorSignedAt) {
        return "conclusionPending"
      }
      if (signature.creatorSignedAt) {
        return "signingMine"
      }
      if (signature.brandSignedAt) {
        return "signingTheirs"
      }
      return "signingNone"
    case "CONCLUSION_PENDING":
      return "conclusionPending"
    case "CONCLUDED":
      return "concluded"
    case "DECLINED":
      return "declined"
    case "EXPIRED":
      return "expired"
    case "CANCELED":
      return "canceled"
    // 도착 전 상태는 서버가 404로 걸러 여기 오지 않는다 — 방어적으로 서명 진행중으로 그린다
    case "DRAFT":
    case "REVIEW_PENDING":
    case "REVIEW_REJECTED":
      return "signingNone"
  }
}

export const CLOSED_VIEWS: ReadonlyArray<CreatorViewState> = [
  "declined",
  "expired",
  "canceled",
]

export type StepTone = "todo" | "done" | "cur" | "stop" | "halt"

export interface StepChip {
  label: string
  who: string
  tone: StepTone
}

/** 4단 스텝퍼 — 운영자 검토 통과 → 서명 요청 발송 → 양측 서명 → 운영자 체결 완료 처리 */
export function buildStepper(
  view: CreatorViewState,
  detail: CreatorContractDetailResponse
): Array<StepChip> {
  const { stepper, signature, closure, brand } = detail

  const approved: StepChip = {
    label: "운영자 검토 통과",
    who: formatMonthDayTime(stepper.reviewApprovedAt),
    tone: "done",
  }
  const sent: StepChip = {
    label: "서명 요청 발송",
    who: stepper.signatureRequestedAt
      ? `양측 메일·문자 · ${formatMonthDayTime(stepper.signatureRequestedAt)}`
      : "—",
    tone: "done",
  }
  const conclude: StepChip = {
    label: "운영자 체결 완료 처리",
    who: "PDF + 감사추적인증서",
    tone: "todo",
  }
  const notReached: StepChip = {
    label: "운영자 체결 완료 처리",
    who: "진행되지 않음",
    tone: "todo",
  }

  switch (view) {
    case "signingNone":
      return [
        approved,
        sent,
        { label: "양측 서명", who: "브랜드 0 / 나 0", tone: "cur" },
        conclude,
      ]
    case "signingTheirs":
      return [
        approved,
        sent,
        { label: "양측 서명", who: "1 / 2 · 내 서명 대기", tone: "cur" },
        conclude,
      ]
    case "signingMine":
      return [
        approved,
        sent,
        { label: "양측 서명", who: "1 / 2 · 브랜드 대기", tone: "cur" },
        conclude,
      ]
    case "conclusionPending":
      return [
        approved,
        { ...sent, who: formatMonthDayTime(stepper.signatureRequestedAt) },
        {
          label: "양측 서명 완료",
          who: `브랜드 ${formatMonthDayTime(signature.brandSignedAt)} · 나 ${formatMonthDayTime(signature.creatorSignedAt)}`,
          tone: "done",
        },
        { ...conclude, who: "확인 중", tone: "cur" },
      ]
    case "concluded":
      return [
        approved,
        { ...sent, who: formatMonthDayTime(stepper.signatureRequestedAt) },
        {
          label: "양측 서명 완료",
          who: `브랜드 ${formatMonthDayTime(signature.brandSignedAt)} · 나 ${formatMonthDayTime(signature.creatorSignedAt)}`,
          tone: "done",
        },
        {
          label: "운영자 체결 완료 처리",
          who: `${formatMonthDayTime(stepper.concludedAt)} · PDF·인증서 발급됨`,
          tone: "cur",
        },
      ]
    case "declined":
      return [
        approved,
        sent,
        {
          label: "내가 거절",
          who: formatMonthDayTime(closure.closedAt),
          tone: "stop",
        },
        notReached,
      ]
    case "expired":
      return [
        approved,
        sent,
        {
          label: "기한 경과 · 만료",
          who: `${signature.creatorSignedAt || signature.brandSignedAt ? "한쪽 미서명" : "양측 미서명"} · 운영자 확인 ${formatMonthDayTime(closure.closedAt)}`,
          tone: "halt",
        },
        notReached,
      ]
    case "canceled":
      return [
        approved,
        sent,
        {
          label: "취소 · 종결",
          who: `${brand.name} 요청 · 운영자 ${formatMonthDayTime(closure.closedAt)}`,
          tone: "halt",
        },
        notReached,
      ]
  }
}
