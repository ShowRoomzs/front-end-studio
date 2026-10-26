import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

const TONE_CLASS = {
  /** 내 정지 — 조치가 필요하다(S3 체결 보류) */
  warning: "bg-sz-warning-bg text-sz-warning-text",
  /** 내 조치 없음 — 상대 브랜드 사정(R1 · R2) · 허용 안내(S7) */
  neutral: "bg-sz-n-100 text-sz-n-700",
} as const

/**
 * 시안 13 `.szn` — 정지 안내 한 줄(파트너센터 15와 같은 마크업). `<b>`는 600.
 * 공용 `Notice`(11px · 6px)와 크기가 달라 따로 둔다.
 */
export default function SuspensionNotice(props: {
  tone: keyof typeof TONE_CLASS
  children: ReactNode
  className?: string
}) {
  const { tone, children, className } = props

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[8px] px-3.5 py-2.5 text-left text-[12px] leading-[1.6] [&_b]:font-semibold",
        TONE_CLASS[tone],
        className
      )}
    >
      <div>{children}</div>
    </div>
  )
}
