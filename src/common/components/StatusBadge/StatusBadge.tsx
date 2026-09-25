import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * 상태 배지 색상 토큰 (웹 디자인시스템 v1.1 · §9 4원칙)
 * - info    : 진행 중·대기
 * - success : 성공
 * - warning : 경고 — 조치가 필요한 상태
 * - danger  : 위험 — 파괴적 액션 · 소비자 노출 차단
 * - neutral : 종료된 상태, 그리고 **분류**(유형·공개여부)
 *
 * 분류에는 `hideDot`을 함께 준다. 점이 있으면 상태색 체계로 읽혀서
 * "지금 무슨 일이 벌어지고 있는가"를 오독하게 만든다.
 *
 */
export type StatusBadgeVariant =
  "info" | "success" | "warning" | "danger" | "neutral"

interface StatusBadgeProps {
  variant: StatusBadgeVariant
  children: ReactNode
  /** 좌측 점 숨김 — 분류 배지에 쓴다 */
  hideDot?: boolean
}

const VARIANT_CLASS: Record<StatusBadgeVariant, string> = {
  info: "bg-sz-info-bg text-sz-info-text",
  success: "bg-sz-success-bg text-sz-success-text",
  warning: "bg-sz-warning-bg text-sz-warning-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  neutral: "bg-sz-neutral-bg text-sz-neutral-text",
}

export default function StatusBadge(props: StatusBadgeProps) {
  const { variant, children, hideDot = false } = props

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] whitespace-nowrap rounded-[10px] px-[9px] py-0.5 text-[11px] font-medium",
        VARIANT_CLASS[variant]
      )}
    >
      {!hideDot && (
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current opacity-75" />
      )}
      {children}
    </span>
  )
}
