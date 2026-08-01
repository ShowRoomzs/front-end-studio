import { cn } from "@/lib/utils"

/**
 * ui-studio-02-signup 시안의 `.inp` — 신청 폼 컨트롤 공통 스타일.
 *
 * ⚠️ 높이 44px. front-end-partners의 auth 입력은 40px이므로 그대로 옮겨오면 안 된다
 * (시안 `--auth-control-h: 44px`).
 */
export const authInputClass = (hasError?: boolean, extra?: string) =>
  cn(
    "h-11 w-full rounded-[6px] border bg-white px-3 text-[13px] text-sz-n-900 outline-none",
    "placeholder:text-sz-n-400 transition-[color,box-shadow,border-color]",
    "disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
    hasError
      ? "border-sz-danger-text focus:border-sz-danger-text focus:ring-[3px] focus:ring-sz-danger-bg"
      : "border-sz-n-300 hover:enabled:border-sz-n-400 focus:border-sz-n-900 focus:ring-[3px] focus:ring-sz-n-200",
    extra
  )

/** 시안 `.inp.ro` — 읽기 전용 표시용(플랫폼 고정 등). input이 아니라 div로 렌더한다. */
export const authReadonlyBoxClass = cn(
  "flex h-11 w-full items-center justify-between rounded-[6px] border border-sz-n-300",
  "bg-sz-n-100 px-3 text-[13px] text-sz-n-700"
)

/** 시안 `.btn` — 44px. `.btn-primary` / `.btn-line` 두 종류. */
export const authButtonClass = (variant: "primary" | "line", extra?: string) =>
  cn(
    "flex h-11 items-center justify-center gap-2 rounded-[6px] border text-[13px] font-medium transition-colors",
    variant === "primary"
      ? cn(
          "border-sz-auth-action bg-sz-auth-action text-white",
          "hover:enabled:border-sz-auth-action-hover hover:enabled:bg-sz-auth-action-hover",
          "disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"
        )
      : cn(
          "border-sz-n-300 bg-white text-sz-n-700",
          "hover:enabled:bg-sz-n-100",
          "disabled:cursor-not-allowed disabled:opacity-60"
        ),
    extra
  )
