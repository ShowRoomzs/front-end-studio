import { useCallback } from "react"
import type { SocialProvider } from "@/features/auth/services/authService"

export type SocialLoginResult = {
  providerType: SocialProvider
  /** 각 사에서 받은 토큰. Apple만 identityToken, 나머지는 accessToken. */
  token: string
  /** Apple 최초 로그인에서만 내려온다 */
  name?: string
}

/**
 * provider별 토큰 획득 어댑터.
 *
 * ⚠️ 현재는 **목 구현**이다. 백엔드는 프론트가 각 사에서 이미 받아온 토큰을 넘겨주길
 * 기대하는데(POST /v1/creator/auth/social/login 의 `token` 필드), 실제 웹 SDK를 붙이려면
 * 각 사 JavaScript 앱 키와 등록된 리다이렉트 도메인이 필요하다. 확보되면 아래
 * getProviderToken() 하나만 교체하면 되고, 호출부(LoginPage)는 손대지 않아도 된다.
 *
 * 소비자 앱(front-end)의 useSocialLogin과 같은 시그니처를 유지해 이식 비용을 낮췄다.
 *
 * 교체 지점:
 *   KAKAO  → Kakao.init(JS키) 후 Kakao.Auth.authorize / login → accessToken
 *   NAVER  → naver.LoginWithNaverId → accessToken
 *   GOOGLE → Google Identity Services (google.accounts.oauth2) → access_token
 *   APPLE  → AppleID.auth.signIn → authorization.id_token (+ user.name 최초 1회)
 */
async function getProviderToken(provider: SocialProvider): Promise<string> {
  // TODO: 실제 SDK 연동으로 교체
  if (!import.meta.env.DEV) {
    throw new Error(
      `${provider} 로그인이 아직 연동되지 않았습니다. 소셜 SDK 설정이 필요합니다.`
    )
  }
  return `mock-${provider.toLowerCase()}-token`
}

export function useSocialLogin() {
  const login = useCallback(
    async (provider: SocialProvider): Promise<SocialLoginResult> => {
      const token = await getProviderToken(provider)
      if (!token) {
        throw new Error(`${provider} 로그인에 실패했습니다.`)
      }
      return { providerType: provider, token }
    },
    []
  )

  return { login }
}
