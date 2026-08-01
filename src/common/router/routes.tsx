import type { RouteObject } from "react-router-dom"
import LoginPage from "@/features/auth/pages/LoginPage"
import SignupPage from "@/features/auth/pages/SignupPage"
import OnboardingPlaceholderPage from "@/features/auth/pages/OnboardingPlaceholderPage"
import NaverCallbackPage from "@/features/auth/pages/NaverCallbackPage"
import HomePage from "@/features/home/pages/HomePage"

/**
 * 크리에이터 권한을 아직 갖지 않은 사용자용 라우트.
 *
 * ⚠️ 여기에는 USER 토큰을 가진 사람도 들어온다 — 신청 이력이 없는 사용자는
 * 로그인 시 USER 토큰을 발급받기 때문이다(신청 API가 로그인을 요구). 그래서
 * accessToken 유무가 아니라 role로 분기한다. router.ts 참고.
 */
export const authRoutes: Array<RouteObject> = [
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  // 승인 후 최초 로그인(isNewMember) 진입점. 정식 토큰이 없어 authRoutes에 둔다.
  { path: "/onboarding", element: <OnboardingPlaceholderPage /> },
  // 네이버 로그인 팝업 전용 콜백. VITE_NAVER_REDIRECT_URI와 경로가 정확히 일치해야 한다.
  { path: "/oauth/naver/callback", element: <NaverCallbackPage /> },
  { path: "*", element: <LoginPage /> },
]

/** 승인된 크리에이터(role=CREATOR)용 라우트. */
export const mainRoutes: Array<RouteObject> = [
  { path: "/", element: <HomePage /> },
  { path: "*", element: <HomePage /> },
]
