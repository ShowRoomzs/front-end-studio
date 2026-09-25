import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"
import type { ContractStatusTone } from "@/features/contracts/types"

/** 서버 배지 색 → 공용 StatusBadge variant. 상태→색 판단은 서버가 하고 여기선 이름만 바꾼다 */
const TONE_TO_VARIANT: Record<ContractStatusTone, StatusBadgeVariant> = {
  NEUTRAL: "neutral",
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  DANGER: "danger",
}

export function toneToVariant(tone: ContractStatusTone): StatusBadgeVariant {
  return TONE_TO_VARIANT[tone] ?? "neutral"
}
