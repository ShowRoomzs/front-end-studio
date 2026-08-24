import { useMutation } from "@tanstack/react-query"

import { DEVICE_PLATFORM, requestFcmToken } from "@/common/lib/firebase"
import {
  authService,
  type SocialLoginRequest,
} from "@/features/auth/services/authService"

/**
 * 소셜 로그인 — 요청 직전에 FCM 토큰을 붙인다.
 *
 * 알림 권한을 여기서 묻는 이유: 화면을 열자마자 팝업을 띄우면 무슨 알림인지 모르는 채로
 * 거부당하고, 브라우저는 한 번 거부한 출처에 다시 묻지 않는다. 로그인은 "이 서비스를 쓰겠다"는
 * 의사가 드러난 시점이라 승낙률이 가장 높다.
 *
 * 토큰 발급이 실패하면 `undefined`로 빠지고 로그인은 그대로 간다(`requestFcmToken`이 전부 흡수).
 */
export function useSocialLoginMutation() {
  const socialLoginMutation = useMutation({
    mutationFn: async (data: SocialLoginRequest) => {
      const fcmToken = await requestFcmToken()
      return authService.socialLogin({
        ...data,
        fcmToken: fcmToken ?? undefined,
        platform: DEVICE_PLATFORM,
      })
    },
  })

  return socialLoginMutation
}
