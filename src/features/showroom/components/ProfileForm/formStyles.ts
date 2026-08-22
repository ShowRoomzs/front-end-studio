import { cn } from "@/lib/utils"

/** 시안 `.inp` 기본 규격 — 36px · 12px 좌우 패딩 · 포커스 링 */
export function inputClass(hasError?: boolean, extra?: string) {
  return cn(
    "h-9 w-full rounded-[6px] border bg-white px-3 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400",
    hasError
      ? "border-sz-danger-text"
      : "border-sz-n-300 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50",
    extra
  )
}
