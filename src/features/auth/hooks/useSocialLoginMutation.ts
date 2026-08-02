import { useMutation } from "@tanstack/react-query"

import { authService } from "@/features/auth/services/authService"

// 앱(front-end)의 useSocialLoginMutation과 동일 — 소셜 로그인 API 호출을 mutation으로 감싼다.
export function useSocialLoginMutation() {
  const socialLoginMutation = useMutation({
    mutationFn: authService.socialLogin,
  })

  return socialLoginMutation
}
