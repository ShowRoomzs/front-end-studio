import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** 안내 상자 · 정보 — DS v1.3 `.notice.info`(11px · 줄간 1.6 · 11px 13px · 테두리 없음) + 원형 `i` 배지(16px) */
export function NoticeBox({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-[6px] bg-sz-info-bg px-[13px] py-[11px] text-left text-[11px] leading-[1.6] text-sz-info-text [&_b]:font-semibold",
        className
      )}
    >
      <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sz-info-text text-[10px] font-bold text-white">
        i
      </span>
      <span>{children}</span>
    </div>
  )
}
