import { cn } from "@/lib/utils"

/** 디자인 시스템 폼 요소 — 32px · 13px · 패딩 6/10 · 포커스 링 */
export function inputClass(hasError?: boolean, extra?: string) {
  return cn(
    "h-8 w-full rounded-[6px] border bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400",
    hasError
      ? "border-sz-danger-text"
      : "border-sz-n-300 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50",
    extra
  )
}
