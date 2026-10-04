import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { HistoryItem } from "@/common/components/HistoryList/HistoryList"
import {
  ACTOR_LABEL,
  EVENT_LABEL,
  HISTORY_TONE,
} from "@/features/contracts/constants/labels"
import type { CreatorContractHistoryEntry } from "@/features/contracts/types"

/**
 * 서버 이력 → 처리 이력 목록(최신순). 서버 정렬에 기대지 않고 시각으로 다시 정렬한다.
 * `eventType`이 null인 행은 서버가 합성한 「연결 성립」이다(계약 이벤트가 아니다).
 * 브랜드는 표시명 스냅샷, 운영자는 「운영자」(익명), 내 서명은 내 쇼룸명을 쓴다.
 */
export function toHistoryItems(
  history: Array<CreatorContractHistoryEntry>,
  signature: { brandSignedAt: string | null; creatorSignedAt: string | null },
  myShowroomName: string | undefined
): Array<HistoryItem> {
  return newestFirst(withCurrentSignatures(history, signature)).map(entry => {
    // 취소 주체가 브랜드면 시안 S9 「브랜드 철회 · 취소」, 운영자면 「운영자 취소」
    const label =
      entry.eventType === null
        ? "연결 성립"
        : entry.eventType === "CANCELED"
          ? entry.actorType === "SELLER"
            ? "브랜드 철회 · 취소"
            : "운영자 취소"
          : (EVENT_LABEL[entry.eventType] ?? entry.eventType)
    const processorName =
      entry.actorDisplayName ??
      (entry.actorType === "CREATOR"
        ? (myShowroomName ?? ACTOR_LABEL.CREATOR)
        : ACTOR_LABEL[entry.actorType])
    return {
      label: entry.detail
        ? `${label} · ${humanizeHistoryDetail(entry.detail)}`
        : label,
      processedAt: entry.occurredAt,
      tone:
        entry.eventType === null
          ? "muted"
          : (HISTORY_TONE[entry.eventType] ?? "muted"),
      processorName,
    }
  })
}

/**
 * 서명 기록 정리 — 어드민이 서명 현황을 정정(체크 해제·일시 수정)해도 서버는 이전 「서명 완료」
 * 이벤트를 지우지 않는다. 지금 서명 칸이 비어 있는 쪽의 기록은 빼고, 여러 번이면 마지막 하나만 둔다.
 */
function withCurrentSignatures<T extends { eventType: string | null }>(
  history: Array<T>,
  signature: { brandSignedAt: string | null; creatorSignedAt: string | null }
) {
  const lastIndex = (type: string) =>
    history.map(entry => entry.eventType).lastIndexOf(type)
  const keep = {
    BRAND_SIGNED: signature.brandSignedAt ? lastIndex("BRAND_SIGNED") : -1,
    CREATOR_SIGNED: signature.creatorSignedAt
      ? lastIndex("CREATOR_SIGNED")
      : -1,
  }
  const bothSigned = !!signature.brandSignedAt && !!signature.creatorSignedAt
  return history.filter((entry, index) => {
    if (
      entry.eventType === "BRAND_SIGNED" ||
      entry.eventType === "CREATOR_SIGNED"
    ) {
      return keep[entry.eventType] === index
    }
    // 「양측 서명 완료 확인」도 지금 양측이 서명돼 있을 때 마지막 한 번만 남긴다
    if (entry.eventType === "BOTH_SIGNED_CONFIRMED") {
      return bothSigned && lastIndex("BOTH_SIGNED_CONFIRMED") === index
    }
    return true
  })
}

/** 이력 상세 문자열에 서버 시각(ISO)·null이 그대로 섞여 오면 화면 표기로 바꾼다 */
const ISO_IN_TEXT =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/g

export function humanizeHistoryDetail(detail: string | null) {
  return detail
    ? detail
        .replace(ISO_IN_TEXT, match => formatDateTimeShort(match))
        // 「브랜드 서명: null → …」처럼 빈 값이 서버 표기 그대로 온다
        .replace(/\bnull\b/g, "없음")
    : detail
}

/**
 * 최신순으로 맞춘다. 같은 분에 찍힌 이벤트(검토 통과 → 서명 요청 발송)는 서버가 준 순서의
 * 역순이 곧 최신순이므로, 먼저 서버 방향을 최신순으로 뒤집은 뒤 시각으로 안정 정렬한다.
 */
function newestFirst<T extends { occurredAt: string }>(history: Array<T>) {
  const ascending =
    history.length > 1 &&
    history[0].occurredAt <= history[history.length - 1].occurredAt
  const base = ascending ? [...history].reverse() : [...history]
  return base.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}
