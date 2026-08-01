import type { SocialProvider } from "@/features/auth/services/authService"

/**
 * 버튼 노출 순서 — 카카오 → 네이버 → Apple → Google.
 * §4에서 확정된 순서이므로 배열 순서를 임의로 바꾸지 말 것
 * (기존 3종 순서를 유지하고 Google만 마지막에 추가한 결과다).
 */
export const SOCIAL_PROVIDERS: SocialProvider[] = [
  "KAKAO",
  "NAVER",
  "APPLE",
  "GOOGLE",
]
