import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Wordmark } from "@/common/components/Auth/Wordmark"

type AuthShellProps = {
  /**
   * auth       = 로그인 `.auth-card` (400px, 수직 중앙, 워드마크 186.3×20 로즈레드)
   * form       = 신청 `.form-card` (520px, 상단 정렬 + 스크롤, 워드마크 150×16 검정)
   * onboarding = 온보딩 `.auth-card` (480px, 상단 정렬, 워드마크 150×16 검정)
   *
   * 시안마다 폭·패딩·워드마크 색과 크기가 전부 달라서
   * 개별 prop을 나열하지 않고 화면 종류 하나로 묶었다.
   */
  variant: "auth" | "form" | "onboarding"
  /** 워드마크 아래 서피스 캡션 (예: "쇼룸 스튜디오") */
  subtitle?: string
  children: ReactNode
}

const CARD_WIDTH: Record<AuthShellProps["variant"], number> = {
  auth: 400,
  form: 520,
  onboarding: 480,
}

export function AuthShell({ variant, subtitle, children }: AuthShellProps) {
  const isAuth = variant === "auth"

  return (
    <div
      className={cn(
        "flex min-h-screen w-full justify-center bg-white px-4",
        isAuth ? "items-center" : "items-start"
      )}
    >
      <div
        style={{ width: CARD_WIDTH[variant], maxWidth: "100%" }}
        className={isAuth ? "pt-6 pb-5" : "py-14"}
      >
        <div className="mb-6 text-center">
          {isAuth ? (
            <Wordmark
              width={186.3}
              height={20}
              tone="studio"
              className="mx-auto"
            />
          ) : (
            <Wordmark width={150} height={16} tone="dark" className="mx-auto" />
          )}
          {subtitle && (
            <p className="mt-2 text-[12px] text-sz-n-500">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
