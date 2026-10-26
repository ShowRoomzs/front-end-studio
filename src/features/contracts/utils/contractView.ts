import type { CreatorContractDetailResponse } from "@/features/contracts/types"
import {
  formatMonthDay,
  formatMonthDayTime,
} from "@/features/contracts/utils/format"

/**
 * 상세 화면 9종(S3·S3a·S3b·S3c·S6·S7·S8·S9·S10)의 분기. 서버는 `viewPhase` 같은 값을 만들지 않고,
 * 근거는 `status` · `signature.brandSignedAt` · `signature.creatorSignedAt` 셋이다(§27 설계서 4-1).
 * 버튼은 `permissions`가 정한다 — 이 값은 배너·스텝퍼·메타 행·문구만 고른다.
 */
export type CreatorViewState =
  | "signingNone" // S3 — 양측 미서명
  | "signingTheirs" // S3a — 브랜드 서명 완료 · 내 서명 필요
  | "signingMine" // S3b — 내 서명 완료 · 브랜드 대기
  | "conclusionPending" // S3c — 공구 생성 대기
  | "concluded" // S6
  | "declined" // S7
  | "expired" // S8
  | "canceled" // S9
  | "terminated" // S10 — 성립 뒤 · 공구 오픈 전 해지(1021 기-05)

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
    case "TERMINATED":
      return "terminated"
    // 도착 전 상태는 서버가 404로 걸러 여기 오지 않는다 — 방어적으로 서명 진행중으로 그린다
    case "DRAFT":
    case "REVIEW_PENDING":
    case "REVIEW_REJECTED":
      return "signingNone"
  }
}

/** 종결 4종 — 계약 조건 · 상품 항목 · 콘텐츠 의무를 읽기 전용(효력 없음)으로 그린다 */
export const CLOSED_VIEWS: ReadonlyArray<CreatorViewState> = [
  "declined",
  "expired",
  "canceled",
  "terminated",
]

/**
 * 계약 성립 시각 = 양측 서명 완료(1021 기-05). 서버 `stepper.establishedAt`을 쓰고,
 * 옛 배포라 필드가 없으면 두 서명 시각 중 나중 값으로 대신한다(서버 백필과 같은 규칙).
 */
export function establishedAtOf(
  detail: CreatorContractDetailResponse
): string | null {
  if (detail.stepper.establishedAt) {
    return detail.stepper.establishedAt
  }
  const { brandSignedAt, creatorSignedAt } = detail.signature
  if (!brandSignedAt || !creatorSignedAt) {
    return null
  }
  return brandSignedAt > creatorSignedAt ? brandSignedAt : creatorSignedAt
}

export type StepTone = "todo" | "done" | "cur" | "stop" | "halt"

export interface StepChip {
  label: string
  who: string
  tone: StepTone
}

/** 4단 스텝퍼 — 운영자 검토 통과 → 서명 요청 발송 → 양측 서명(· 계약 성립) → 운영자 공구 생성 처리 */
export function buildStepper(
  view: CreatorViewState,
  detail: CreatorContractDetailResponse,
  myName?: string
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
  const createGroupBuy: StepChip = {
    label: "운영자 공구 생성 처리",
    who: "PDF + 감사추적인증서",
    tone: "todo",
  }
  const notReached: StepChip = {
    label: "운영자 공구 생성 처리",
    who: "진행되지 않음",
    tone: "todo",
  }
  const established: StepChip = {
    label: "양측 서명 완료 · 계약 성립",
    who: `브랜드 ${formatMonthDayTime(signature.brandSignedAt)} · 나 ${formatMonthDayTime(signature.creatorSignedAt)}`,
    tone: "done",
  }

  switch (view) {
    case "signingNone":
      return [
        approved,
        sent,
        { label: "양측 서명", who: "브랜드 0 / 나 0", tone: "cur" },
        createGroupBuy,
      ]
    case "signingTheirs":
      return [
        approved,
        sent,
        { label: "양측 서명", who: "1 / 2 · 내 서명 대기", tone: "cur" },
        createGroupBuy,
      ]
    case "signingMine":
      return [
        approved,
        sent,
        { label: "양측 서명", who: "1 / 2 · 브랜드 대기", tone: "cur" },
        createGroupBuy,
      ]
    case "conclusionPending":
      return [
        approved,
        { ...sent, who: formatMonthDayTime(stepper.signatureRequestedAt) },
        established,
        { ...createGroupBuy, who: "확인 중", tone: "cur" },
      ]
    case "concluded":
      return [
        approved,
        { ...sent, who: formatMonthDayTime(stepper.signatureRequestedAt) },
        established,
        {
          label: "운영자 공구 생성 처리",
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
          // 시안 S7 「뷰티_소연 · 07.24 10:15」
          who: myName
            ? `${myName} · ${formatMonthDayTime(closure.closedAt)}`
            : formatMonthDayTime(closure.closedAt),
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
        // 시안 S9는 브랜드 철회 — 검토 통과 이후 취소는 운영자만 하므로 주체에 따라 고른다
        closure.actorType === "SELLER"
          ? {
              label: "브랜드 철회 · 취소",
              who: `${brand.name} · ${formatMonthDayTime(closure.closedAt)}`,
              tone: "halt",
            }
          : {
              label: "운영자 취소",
              who: `운영자 · ${formatMonthDayTime(closure.closedAt)}`,
              tone: "halt",
            },
        notReached,
      ]
    case "terminated": {
      // 시안 S10 — 5단. 성립 칩은 날짜만(「브랜드 08.16 · 나 08.16」)
      const terminatedChip: StepChip = {
        label: "계약 해지",
        who: `양측 합의 · ${formatMonthDayTime(closure.closedAt)}`,
        tone: "halt",
      }
      const establishedShort: StepChip = {
        ...established,
        who: `브랜드 ${formatMonthDay(signature.brandSignedAt)} · 나 ${formatMonthDay(signature.creatorSignedAt)}`,
      }
      // 공구가 이미 생성된 뒤(오픈 전) 해지된 계약 — 공구 생성 칩이 해지보다 앞선다
      if (stepper.concludedAt) {
        return [
          approved,
          sent,
          establishedShort,
          {
            label: "운영자 공구 생성 처리",
            who: formatMonthDayTime(stepper.concludedAt),
            tone: "done",
          },
          terminatedChip,
        ]
      }
      return [approved, sent, establishedShort, terminatedChip, notReached]
    }
  }
}
