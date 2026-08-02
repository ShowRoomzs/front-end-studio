import { useCallback, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { SocialType } from "@/features/auth/services/authService"
import {
  useSocialLogin,
  type SocialLoginResponse,
} from "@/features/auth/hooks/useSocialLogin"

/**
 * 앱(front-end)의 SocialButton과 같은 구조 —
 * 버튼이 useSocialLogin(socialType)을 직접 들고 있고, 로그인 결과만 onPress로 올려보낸다.
 * 부모(LoginPage)는 provider별 SDK 차이를 전혀 모른다.
 *
 * 디자인은 시안 `.sbtn` 그대로: 48px, radius 6px, 14px/600, letter-spacing -.1px,
 * 아이콘은 absolute left:16px(20×20)이라 라벨이 버튼 정중앙에 남는다.
 * 색은 §8-2 지시대로 하드코딩하지 않고 --sz-social-* 토큰을 쓴다.
 */

const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <path
      fill="#191919"
      d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.9 5.36 4.76 6.8-.16.6-.98 3.57-1.02 3.8 0 0-.02.17.09.24.11.06.24.02.24.02.32-.05 3.7-2.42 4.29-2.84.53.08 1.08.12 1.64.12 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
    />
  </svg>
)

const NaverIcon = () => (
  <span
    aria-hidden
    className="text-[15px] font-extrabold text-white"
    style={{ fontFamily: "Arial, sans-serif" }}
  >
    N
  </span>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
    <path
      fill="#fff"
      d="M16.365 1.43c0 1.14-.462 2.24-1.21 3.05-.822.9-2.17 1.6-3.29 1.51-.14-1.11.42-2.27 1.19-3.03.86-.86 2.33-1.5 3.31-1.53zm4.365 17.13c-.61 1.35-.9 1.96-1.68 3.15-1.09 1.66-2.63 3.73-4.53 3.75-1.69.02-2.12-1.1-4.41-1.09-2.29.01-2.76 1.11-4.45 1.09-1.9-.02-3.36-1.88-4.45-3.54C-1.07 17.94.03 11.28 3.62 8.42c1.88-1.5 3.94-1.62 5.34-.72 1 .64 1.83.68 2.79.02 1.6-1.1 3.7-1.05 5.36.06-.13.08-3.2 1.87-3.17 5.55.03 4.4 3.86 5.86 3.9 5.88-.03.09-.61 2.09-2.11 3.32z"
    />
  </svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden>
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.98v2.33A9 9 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.98a9 9 0 0 0 0 8.08l2.98-2.33z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.96l2.98 2.33C4.67 5.16 6.66 3.58 9 3.58z"
    />
  </svg>
)

type SocialStyle = {
  label: string
  icon: ReactNode
  className: string
  style?: React.CSSProperties
}

const SOCIAL_STYLES: Record<SocialType, SocialStyle> = {
  KAKAO: {
    label: "카카오로 로그인",
    icon: <KakaoIcon />,
    className: "border-transparent",
    style: {
      background: "var(--sz-social-kakao)",
      color: "var(--sz-social-kakao-fg)",
    },
  },
  NAVER: {
    label: "네이버로 로그인",
    icon: <NaverIcon />,
    className: "border-transparent text-white",
    style: { background: "var(--sz-social-naver)" },
  },
  APPLE: {
    label: "Apple로 로그인",
    icon: <AppleIcon />,
    className: "text-white",
    style: {
      background: "var(--sz-social-apple)",
      borderColor: "var(--sz-social-apple)",
    },
  },
  GOOGLE: {
    label: "Google로 로그인",
    icon: <GoogleIcon />,
    className: "border-sz-n-300 bg-white hover:enabled:bg-sz-n-50",
    style: { color: "var(--sz-social-google-fg)" },
  },
}

export interface SocialButtonProps {
  socialType: SocialType
  onPress: (response: SocialLoginResponse) => void
  /** provider별 SDK 실패(설정 누락·팝업 차단·사용자 취소)를 화면에 알린다 */
  onError: (message: string) => void
  disabled?: boolean
}

export default function SocialButton({
  socialType,
  onPress,
  onError,
  disabled,
}: SocialButtonProps) {
  const { login } = useSocialLogin(socialType)
  const [loading, setLoading] = useState(false)
  const { label, icon, className, style } = SOCIAL_STYLES[socialType]

  const handleClick = useCallback(async () => {
    setLoading(true)
    try {
      const res = await login()

      if (!res) {
        return
      }
      onPress(res)
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다."
      )
    } finally {
      setLoading(false)
    }
  }, [login, onPress, onError])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      style={style}
      className={cn(
        "relative flex h-12 w-full cursor-pointer items-center justify-center gap-2.5",
        "rounded-[6px] border text-[14px] font-semibold tracking-[-0.1px]",
        "shadow-[0_1px_2px_rgba(26,27,31,0.06)] transition-[filter,background-color]",
        "hover:enabled:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <span className="absolute left-4 flex h-5 w-5 shrink-0 items-center justify-center">
        {loading ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/35 border-t-current" />
        ) : (
          icon
        )}
      </span>
      {label}
    </button>
  )
}
