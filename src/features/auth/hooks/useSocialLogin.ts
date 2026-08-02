import { useCallback } from "react"

import type { SocialType } from "@/features/auth/services/authService"
import { useAppleLogin } from "@/features/auth/hooks/useAppleLogin"
import { useGoogleLogin } from "@/features/auth/hooks/useGoogleLogin"
import { useKakaoLogin } from "@/features/auth/hooks/useKakaoLogin"
import { useNaverLogin } from "@/features/auth/hooks/useNaverLogin"

/**
 * @description 소셜 로그인 응답 타입
 * @property {string} token - 소셜 로그인 토큰
 * - naver : accessToken
 * - kakao : accessToken
 * - google : accessToken
 * - apple : identityToken
 * @property {string} [name] - Apple 최초 로그인 시에만 내려오는 이름
 */
export type SocialLoginResponse = {
  token: string
  providerType: SocialType
  name?: string
}

interface UseSocialLoginResult {
  login: () => Promise<SocialLoginResponse>
}

/**
 * 앱(front-end)의 useSocialLogin과 같은 구조 — socialType을 인자로 받고,
 * provider별 훅을 전부 호출해 둔 뒤 switch로 하나만 실행한다.
 * 호출부(SocialButton)는 provider별 차이를 전혀 몰라도 된다.
 */
export function useSocialLogin(socialType: SocialType): UseSocialLoginResult {
  const { login: loginWithNaver } = useNaverLogin()
  const { login: loginWithKakao } = useKakaoLogin()
  const { login: loginWithGoogle } = useGoogleLogin()
  const { login: loginWithApple } = useAppleLogin()

  const login = useCallback(async (): Promise<SocialLoginResponse> => {
    let token: string
    let name: string | undefined

    switch (socialType) {
      case "NAVER": {
        const res = await loginWithNaver()

        token = res.accessToken
        break
      }
      case "KAKAO": {
        const res = await loginWithKakao()

        token = res.accessToken
        break
      }
      case "GOOGLE": {
        const res = await loginWithGoogle()

        token = res.accessToken
        break
      }
      case "APPLE": {
        const res = await loginWithApple()

        token = res.accessToken
        name = res.name
        break
      }
    }

    if (!token) {
      throw new Error(`${socialType} 로그인에 실패했습니다.`)
    }

    return { token, providerType: socialType, name }
  }, [
    loginWithApple,
    loginWithGoogle,
    loginWithKakao,
    loginWithNaver,
    socialType,
  ])
  // 앱은 여기서 catch해 `${socialType} login failed: ...`로 감싸지만, 스튜디오는 이 에러를
  // 그대로 사용자에게 배너로 보여주므로 한국어 원문 메시지를 훼손하지 않고 통과시킨다.

  return { login }
}
