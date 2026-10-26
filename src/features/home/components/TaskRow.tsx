import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface TaskRowProps {
  /** 왼쪽 기한 칸 큰 글씨(시안 `.hm-n`) — 「D-1」 · 「지급」 · 「2건」 · 체크 표시 */
  lead: ReactNode
  /** 왼쪽 기한 칸 작은 글씨(시안 `.hm-s`) — 「08.21」 · 「종료 전」 · 「대기」 · 「선택」 */
  leadSub?: ReactNode
  /** 회색 기한(시안 `.hm-dd.q`) — 기한 없는 일 · 다가오는 일정 · 체크리스트 */
  muted?: boolean
  title: ReactNode
  description: ReactNode
  actionLabel: string
  /** 보조 버튼(시안 `.btn-secondary`) — 해도 되고 안 해도 되는 일 · 완료된 일 */
  secondary?: boolean
  /** 정지 중 막힌 일(시안 `.tkr.lock`) — 버튼 비활성 · 기한 회색 */
  locked?: boolean
  /** 완료한 체크리스트(시안 `.tkr.done`) — 회색 바탕 · 취소선 */
  done?: boolean
  disabled?: boolean
  onAction?: () => void
}

/**
 * 할 일 카드 한 장 — 시안 `.tkr`. 기한(왼쪽) · 무엇을(제목) · 왜(한 줄) · 행동(버튼 하나).
 * H1 할 일 · H2 다가오는 일정 · H3 체크리스트가 같은 카드를 쓴다.
 */
export default function TaskRow(props: TaskRowProps) {
  const {
    lead,
    leadSub,
    muted = false,
    title,
    description,
    actionLabel,
    secondary = false,
    locked = false,
    done = false,
    disabled = false,
    onAction,
  } = props

  return (
    <div
      className={cn(
        "grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[8px] border border-sz-n-200 px-4 py-3.5",
        done ? "bg-sz-n-50" : "bg-white"
      )}
    >
      <div className="text-center">
        <div
          className={cn(
            "text-[18px] font-semibold leading-[1.1] tabular-nums",
            muted || locked ? "text-sz-n-400" : "text-sz-warning-text"
          )}
        >
          {lead}
        </div>
        <div className="mt-0.5 text-[10px] text-sz-n-500">{leadSub}</div>
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "text-[13px] font-semibold",
            done ? "text-sz-n-500 line-through" : "text-sz-n-900"
          )}
        >
          {title}
        </div>
        <div className="mt-[3px] text-[12px] text-sz-n-500">{description}</div>
      </div>
      <Button
        type="button"
        size="sm"
        variant={secondary || locked ? "outline" : "default"}
        disabled={locked || disabled}
        onClick={onAction}
        className="rounded-[6px] px-3.5 text-[12px] font-medium shadow-none"
      >
        {actionLabel}
      </Button>
    </div>
  )
}
