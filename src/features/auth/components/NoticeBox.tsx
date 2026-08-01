import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** 시안 `.notice` — info-bg 배경 + 원형 `i` 배지(16px). */
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
        "flex gap-2 rounded-[6px] bg-sz-info-bg px-3.5 py-3 text-left text-[12px] leading-[1.6] text-sz-n-700",
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
