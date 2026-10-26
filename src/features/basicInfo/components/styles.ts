import { cn } from "@/lib/utils"

/*
  시안 ui-studio-06-account의 `.btn` · `.inp` 규격.
  스튜디오에 공용 버튼 규격(32px · 28px)이 아직 없어 화면 안에 둔다 — 쇼룸 관리의 `formStyles`와 같은 이유.
*/

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "danger" | "quiet"

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-sz-accent-500 text-white hover:enabled:bg-sz-accent-600",
  secondary:
    "border border-sz-n-300 bg-white text-sz-n-900 hover:enabled:bg-sz-n-100",
  ghost: "bg-transparent text-sz-n-600 hover:enabled:bg-sz-n-100",
  danger: "bg-sz-danger-text text-white hover:enabled:bg-[#8f2828]",
  // 시안 `.btn-quiet` — 흰 바탕 · 위험색 글자(탈퇴 승인 요청 · 요청 취소)
  quiet:
    "border border-sz-n-300 bg-white text-sz-danger-text hover:enabled:bg-sz-n-50",
}

/** 시안 `.btn` 32px · `.btn-sm` 28px. 비활성은 회색 상자(`.btn:disabled`) */
export function buttonClass(
  variant: ButtonVariant,
  size: "md" | "sm" = "md",
  extra?: string
) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] font-medium",
    "disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
    size === "md" ? "h-8 px-3.5 text-[12px]" : "h-7 px-2.5 text-[11px]",
    BUTTON_VARIANT[variant],
    extra
  )
}

/** 시안 `.inp` — 36px · 12px 좌우 패딩 · 오류면 위험색 테두리(`.inp.bad`) */
export function inputClass(hasError?: boolean, extra?: string) {
  return cn(
    "h-9 w-full rounded-[6px] border bg-white px-3 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400",
    hasError
      ? "border-sz-danger-text"
      : "border-sz-n-300 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50",
    extra
  )
}

/** 시안 `.inp.sel` 화살표 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237B7F89' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
}
