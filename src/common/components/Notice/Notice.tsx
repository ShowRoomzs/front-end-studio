import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type NoticeTone = "info" | "warn" | "danger" | "neutral" | "consent"

const TONE_CLASS: Record<NoticeTone, string> = {
  info: "bg-sz-info-bg text-sz-info-text",
  warn: "bg-sz-warning-bg text-sz-warning-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  neutral: "bg-sz-n-100 text-sz-n-600",
  // 시안 `.notice.consent` — 고지·확인 체크가 들어가는 흰 박스(테두리만)
  consent: "border border-sz-n-200 bg-sz-n-50 text-sz-n-700",
}

/**
 * 시안 `.notice` — 카드 안에 들어가는 안내 배너.
 *
 * 상태색 4원칙을 그대로 쓴다. 검토 중은 정보, 반려는 경고, 삭제 집행·거절은 위험,
 * 만료·취소 같은 중립 종결은 무채색이다. `consent`만 색이 아니라 **동의를 받는 자리**다.
 *
 * 원래 상품 문의 전용이었으나 계약 관리가 같은 배너를 쓰면서 공용으로 올렸다.
 */
export default function Notice(props: {
  tone: NoticeTone
  children: ReactNode
  className?: string
}) {
  const { tone, children, className } = props

  return (
    <div
      className={cn(
        "rounded-[6px] px-[13px] py-[11px] text-[11px] leading-[1.6]",
        TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </div>
  )
}
