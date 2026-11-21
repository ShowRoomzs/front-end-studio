import { cn } from "@/lib/utils"

/**
 * 로그인 · 신청 · 온보딩의 폼 컨트롤은 「큰 컨트롤」 38px · 13px 하나다.
 * 디자인 시스템 v1.2에는 32px 기본 크기만 있다. 단독 주 행동 화면의 큰 크기는
 * 세 웹 앱(파트너센터 · 스튜디오 · 어드민)이 함께 정했다(11-21, 시안 .btn-lg 값).
 * 시안이 화면마다 달랐던 40 · 44px는 쓰지 않는다. 소셜 버튼(SocialButton)도 같은 높이다.
 *
 * size 인자는 호출부 호환용으로만 남긴다. 두 값 모두 같은 높이다.
 */
export type ControlSize = "sm" | "md"

const HEIGHT_CLASS: Record<ControlSize, string> = {
  sm: "h-[38px]",
  md: "h-[38px]",
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
      : "border-sz-n-300 hover:enabled:border-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50",
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

/** 큰 버튼 — 주(`--sz-auth-action` = 시안 검정) / DS `.btn-secondary` 색 · 38px */
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
          "border-sz-n-300 bg-white text-sz-n-900",
          "hover:enabled:bg-sz-n-100",
          "disabled:cursor-not-allowed disabled:opacity-60"
        ),
    extra
  )
