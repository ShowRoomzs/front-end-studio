import { loadScript } from "@/features/auth/utils/loadScript"

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

export type AppleLoginResult = {
  /** 백엔드로 전송할 값 — Apple은 accessToken이 아니라 identityToken(id_token)이다 */
  token: string
  /** 최초 로그인 시 1회만 내려온다. 이후 재로그인부터는 undefined. */
  name?: string
}

/**
 * ⚠️ 설정 필요 — VITE_APPLE_CLIENT_ID / VITE_APPLE_REDIRECT_URI
 *
 * Apple Developer 계정 → Certificates, Identifiers & Profiles → Identifiers
 * → Service ID 생성(이게 clientId) → Sign in with Apple 설정에서
 * **도메인**과 **Return URL(redirectURI)**을 등록.
 *
 * usePopup:true라도 Apple 콘솔은 redirectURI를 실제로 검증하며, 반드시 **HTTPS**여야 한다
 * (http://localhost는 등록 불가) — 로컬에서 테스트하려면 ngrok 등으로 HTTPS 터널을 열어야 한다.
 * 실제 브랜드 인증서(Kakao/Naver/Google과 달리 유료 개발자 계정 필요)도 이미 있어야 한다.
 */
export async function getAppleIdentityToken(): Promise<AppleLoginResult> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI
  if (!clientId || !redirectURI) {
    throw new Error(
      "Apple 로그인이 아직 설정되지 않았습니다. VITE_APPLE_CLIENT_ID / VITE_APPLE_REDIRECT_URI를 확인해 주세요."
    )
  }

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

  return { token: res.authorization.id_token, name }
}
