import { useCallback } from "react"
import type { SocialProvider } from "@/features/auth/services/authService"
import { getKakaoAccessToken } from "@/features/auth/utils/socialProviders/kakaoWebLogin"
import { getNaverAccessToken } from "@/features/auth/utils/socialProviders/naverWebLogin"
import { getGoogleAccessToken } from "@/features/auth/utils/socialProviders/googleWebLogin"
import { getAppleIdentityToken } from "@/features/auth/utils/socialProviders/appleWebLogin"

export type SocialLoginResult = {
  providerType: SocialProvider
  /** 각 사에서 받은 토큰. Apple만 identityToken, 나머지는 accessToken. */
  token: string
  /** Apple 최초 로그인에서만 내려온다 */
  name?: string
}

/**
 * provider별 웹 SDK 어댑터.
 *
 * 각 로더 파일(utils/socialProviders/*)이 필요한 env var(VITE_KAKAO_JS_KEY 등)가
 * 비어 있으면 각자 명확한 한국어 에러를 던진다 — 개발자센터에 도메인을 등록하고
 * 키를 발급받아 .env.local을 채우면 이 파일은 손댈 필요 없이 그대로 동작한다.
 *
 * 소비자 앱(front-end)의 useSocialLogin과 같은 반환 시그니처를 유지해 호출부
 * (LoginPage)가 provider별 차이를 몰라도 되게 했다.
 */
async function resolveProviderToken(
  provider: SocialProvider
): Promise<{ token: string; name?: string }> {
  switch (provider) {
    case "KAKAO":
      return { token: await getKakaoAccessToken() }
    case "NAVER":
      return { token: await getNaverAccessToken() }
    case "GOOGLE":
      return { token: await getGoogleAccessToken() }
    case "APPLE":
      return getAppleIdentityToken()
  }
}

export function useSocialLogin() {
  const login = useCallback(
    async (provider: SocialProvider): Promise<SocialLoginResult> => {
      const { token, name } = await resolveProviderToken(provider)
      if (!token) {
        throw new Error(`${provider} 로그인에 실패했습니다.`)
      }
      return { providerType: provider, token, name }
    },
    []
  )

  return { login }
}
