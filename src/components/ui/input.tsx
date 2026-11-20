import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 디자인 시스템 폼 요소 — 32px · 13px · 패딩 6/10 · 테두리 n-300 · 포커스 액센트 링
        "h-8 w-full min-w-0 rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 transition-[color,box-shadow] outline-none placeholder:text-sz-n-400",
        // 디자인시스템: 비활성 입력은 옅게가 아니라 회색으로 확실히 채운다
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-500 disabled:opacity-100",
        "focus-visible:border-sz-accent-500 focus-visible:ring-[3px] focus-visible:ring-sz-accent-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
