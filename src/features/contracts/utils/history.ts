import type { HistoryItem } from "@/common/components/HistoryList/HistoryList"
import {
  ACTOR_LABEL,
  EVENT_LABEL,
  HISTORY_TONE,
} from "@/features/contracts/constants/labels"
import type { CreatorContractHistoryEntry } from "@/features/contracts/types"

/**
 * 서버 이력(오래된순) → 처리 이력 목록(최신순).
 * 브랜드는 표시명 스냅샷, 운영자는 「운영자」(익명), 내 서명은 내 쇼룸명을 쓴다.
 */
export function toHistoryItems(
  history: Array<CreatorContractHistoryEntry>,
  myShowroomName: string | undefined
): Array<HistoryItem> {
  return [...history].reverse().map(entry => {
    const label = EVENT_LABEL[entry.eventType] ?? entry.eventType
    const processorName =
      entry.actorDisplayName ??
      (entry.actorType === "CREATOR"
        ? (myShowroomName ?? ACTOR_LABEL.CREATOR)
        : ACTOR_LABEL[entry.actorType])
    return {
      label: entry.detail ? `${label} · ${entry.detail}` : label,
      processedAt: entry.occurredAt,
      tone: HISTORY_TONE[entry.eventType] ?? "muted",
      processorName,
    }
  })
}
