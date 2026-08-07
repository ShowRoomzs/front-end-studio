import { cn } from "@/lib/utils"

/**
 * 컨트롤 높이는 화면마다 다르다 — 각 시안이 서로 다른 값을 확정했다.
 *   md(44px) = 신청(ui-studio-02-signup)
 *   sm(40px) = 온보딩(ui-studio-03-onboarding rev.2, 파트너센터와 동일)
 * 로그인 소셜 버튼(48px)은 SocialButton이 자체적으로 갖는다.
 *
 * 기본값을 md로 둬서 기존 신청 화면 호출부는 그대로 둔다.
 */
export type ControlSize = "sm" | "md"

const HEIGHT_CLASS: Record<ControlSize, string> = {
  sm: "h-10",
  md: "h-11",
}

/** 시안 `.inp` — 폼 컨트롤 공통 스타일 */
export const authInputClass = (
  hasError?: boolean,
  extra?: string,
  size: ControlSize = "md"
) =>
  cn(
    HEIGHT_CLASS[size],
    "w-full rounded-[6px] border bg-white px-3 text-[13px] text-sz-n-900 outline-none",
    "placeholder:text-sz-n-400 transition-[color,box-shadow,border-color]",
    "disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
    hasError
      ? "border-sz-danger-text focus:border-sz-danger-text focus:ring-[3px] focus:ring-sz-danger-bg"
      : "border-sz-n-300 hover:enabled:border-sz-n-400 focus:border-sz-n-900 focus:ring-[3px] focus:ring-sz-n-200",
    extra
  )

/**
 * 시안 `select.inp` — 셀렉트 화살표.
 *
 * 브라우저 기본 화살표는 OS·브라우저마다 위치와 모양이 달라 시안과 어긋난다(가장자리에
 * 바짝 붙어 그려진다). 시안은 화살표를 직접 그려 **오른쪽에서 12px** 안쪽에 두므로,
 * `appearance-none`으로 기본 화살표를 지우고 이 배경을 대신 깐다.
 *
 * Tailwind 임의값으로는 데이터 URI가 파싱되지 않아 인라인 스타일로 넣는다.
 * 함께 쓸 클래스: `authInputClass(hasError, "appearance-none pr-8", "sm")`
 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0L5 6L10 0Z' fill='%237B7F89'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
} as const

/** 시안 `.inp.ro` — 읽기 전용 표시용(플랫폼 고정·쇼룸 주소·예금주 등). input이 아니라 div로 렌더한다. */
export const authReadonlyBoxClass = (size: ControlSize = "md") =>
  cn(
    HEIGHT_CLASS[size],
    "flex w-full items-center justify-between rounded-[6px] border border-sz-n-300",
    "bg-sz-n-100 px-3 text-[13px] text-sz-n-700"
  )

/** 시안 `.btn` — `.btn-primary` / `.btn-line` 두 종류 */
export const authButtonClass = (
  variant: "primary" | "line",
  extra?: string,
  size: ControlSize = "md"
) =>
  cn(
    HEIGHT_CLASS[size],
    "flex items-center justify-center gap-2 rounded-[6px] border text-[13px] font-medium transition-colors",
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
