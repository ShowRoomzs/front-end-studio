import { useCallback } from "react"
import { loadScript } from "@/features/auth/utils/loadScript"

/**
 * Apple 로그인 (웹).
 *
 * 앱(front-end)에는 구현이 없다("Apple login is not implemented yet") — 참고할 코드가 없어
 * 유일하게 처음부터 작성한 provider다. 나머지 3사와 같은 { login } 시그니처만 맞췄다.
 *
 * Apple만 accessToken이 아니라 **identityToken(id_token)**을 백엔드에 넘긴다.
 * 백엔드 SocialLoginService도 Apple은 JWK로 id_token을 검증하는 별도 경로를 탄다.
 * 이름(name)은 **최초 로그인 1회만** 내려오므로 그때 함께 전달해야 한다.
 */

const APPLE_SDK_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope: string
          redirectURI: string
          usePopup: boolean
        }) => void
        signIn: () => Promise<{
          authorization: { id_token: string; code: string }
          user?: { name?: { firstName: string; lastName: string } }
        }>
      }
    }
  }
}

/**
 * ⚠️ 설정 필요 — VITE_APPLE_CLIENT_ID / VITE_APPLE_REDIRECT_URI
 *
 * Apple Developer → Certificates, Identifiers & Profiles → Identifiers →
 * **Service ID** 생성(이게 clientId) → Sign in with Apple 설정에서 도메인과 Return URL 등록.
 *
 * usePopup:true여도 Apple은 redirectURI를 실제로 검증하며 **HTTPS만 허용**한다
 * (http://localhost 등록 불가) — 로컬 테스트는 ngrok 등 HTTPS 터널이 필요하다.
 * 유료 Apple Developer 계정도 있어야 한다.
 */
function readConfig() {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI
  if (!clientId || !redirectURI) {
    throw new Error(
      "Apple 로그인이 아직 설정되지 않았습니다. VITE_APPLE_CLIENT_ID / VITE_APPLE_REDIRECT_URI를 확인해 주세요."
    )
  }
  return { clientId, redirectURI }
}

export function useAppleLogin() {
  const login = useCallback(async () => {
    const { clientId, redirectURI } = readConfig()

    await loadScript(APPLE_SDK_SRC)
    if (!window.AppleID) {
      throw new Error("Apple SDK를 불러오지 못했습니다.")
    }

    window.AppleID.auth.init({
      clientId,
      scope: "name email",
      redirectURI,
      usePopup: true,
    })

    const res = await window.AppleID.auth.signIn()
    const name = res.user?.name
      ? `${res.user.name.lastName}${res.user.name.firstName}`
      : undefined

    // Apple은 accessToken이 아니라 identityToken을 넘긴다(백엔드가 JWK로 검증).
    return { accessToken: res.authorization.id_token, name }
  }, [])

  return { login }
}
