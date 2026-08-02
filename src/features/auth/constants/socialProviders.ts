import type { SocialType } from "@/features/auth/services/authService"

/**
 * 버튼 노출 순서 — 카카오 → 네이버 → Apple → Google.
 * §4에서 확정된 순서이므로 배열 순서를 임의로 바꾸지 말 것
 * (기존 3종 순서를 유지하고 Google만 마지막에 추가한 결과다).
 *
 * 앱(front-end)은 AuthHomeView에서 플랫폼별로 buttons 배열을 만들지만(iOS=Apple, Android=Google),
 * 웹은 4종을 모두 노출하므로 상수로 고정한다.
 */
export const SOCIAL_TYPES: SocialType[] = ["KAKAO", "NAVER", "APPLE", "GOOGLE"]
