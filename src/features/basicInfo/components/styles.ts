import { DS_SELECT_CHEVRON_STYLE } from "@/common/styles/formControls"
import { cn } from "@/lib/utils"

/*
  시안 ui-studio-06-account의 `.btn` · `.inp` 규격.
  값은 웹 디자인 시스템 v1.2(버튼 한 크기 32px · 입력 32px)를 따른다.
*/

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-sz-accent-500 text-white hover:enabled:bg-sz-accent-600",
  secondary:
    "border border-sz-n-300 bg-white text-sz-n-900 hover:enabled:bg-sz-n-100",
  ghost: "bg-transparent text-sz-n-600 hover:enabled:bg-sz-n-100",
  danger: "bg-sz-danger-text text-white hover:enabled:bg-[#8f2828]",
}

/** 디자인 시스템 버튼 — 32px · 12px/500 · 6px. 비활성은 회색 상자 */
export function buttonClass(variant: ButtonVariant, extra?: string) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] font-medium",
    "disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
    "h-8 px-3.5 text-[12px]",
    BUTTON_VARIANT[variant],
    extra
  )
}

/** 디자인 시스템 입력칸 — 32px · 패딩 6/10 · 오류면 위험색 테두리 */
export function inputClass(hasError?: boolean, extra?: string) {
  return cn(
    "h-8 w-full rounded-[6px] border bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400",
    hasError
      ? "border-sz-danger-text"
      : "border-sz-n-300 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50",
    extra
  )
}

/** 시안 `.inp.sel` 화살표 */
export const SELECT_CHEVRON_STYLE = DS_SELECT_CHEVRON_STYLE
