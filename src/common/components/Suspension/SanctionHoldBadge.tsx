import { cn } from "@/lib/utils"

/** 서버 `SanctionHoldView` 중 배지가 읽는 두 칸 — 계약 · 공구 타입이 같은 꼴이다 */
export interface SanctionHoldLike {
  label: string
  /** WARNING(내 정지) · NEUTRAL(상대 브랜드 사정) */
  tone: string
}

/**
 * 시안 13 `.szb` · `.szb.n` — 상태 배지 옆 보조 배지(점 없음 · 20px).
 *
 * 상태는 바꾸지 않고 사정만 덧붙인다(「체결 보류 · 계정 이용 정지」 · 「오픈 보류 · 상대 브랜드 사정」).
 * 문구 · 색은 서버 값 그대로다 — 상대 브랜드의 정지 사실은 서버가 이미 「상대 브랜드 사정」으로 바꿔 내린다(R1 · R2).
 */
export default function SanctionHoldBadge(props: {
  hold: SanctionHoldLike | null | undefined
  className?: string
}) {
  const { hold, className } = props

  if (!hold) {
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-[6px] px-[7px] text-[11px] font-medium",
        hold.tone === "NEUTRAL"
          ? "bg-sz-n-100 text-sz-n-600"
          : "bg-sz-warning-bg text-sz-warning-text",
        className
      )}
    >
      {hold.label}
    </span>
  )
}
