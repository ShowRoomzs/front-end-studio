import { useCallback, useEffect, useRef } from "react"
import { loadScript } from "@/features/auth/utils/loadScript"

/**
 * 구글 로그인 (웹).
 *
 * 앱(front-end)의 useGoogleLogin은 expo-auth-session의 useAuthRequest로 요청 객체를 미리
 * 준비해두고, 콜백을 Promise로 잇기 위해 pendingPromiseRef를 쓴다. 여기서도 같은 구조를 따른다 —
 * 마운트 시 tokenClient를 미리 만들어 두고(request 준비에 해당), GIS가 콜백으로 주는 토큰을
 * pendingPromiseRef로 Promise에 연결한다.
 *
 * 앱은 webClientId/iosClientId/androidClientId 3종을 쓰지만 웹은 web 클라이언트 하나만 쓴다.
 */

const GIS_SRC = "https://accounts.google.com/gsi/client"

type TokenResponse = { access_token?: string; error?: string }

interface TokenClient {
  requestAccessToken: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (res: TokenResponse) => void
          }) => TokenClient
        }
      }
    }
  }
}

/**
 * ⚠️ 설정 필요 — VITE_GOOGLE_CLIENT_ID
 *
 * 새 클라이언트를 만들 필요가 없을 가능성이 높다 — 앱(front-end)의
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID가 이미 **웹 애플리케이션 타입** 클라이언트다.
 * 그 값을 그대로 쓰고, Google Cloud Console에서 같은 클라이언트의
 * **승인된 JavaScript 원본**에 이 앱의 도메인만 추가하면 된다.
 */
function readClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error(
      "Google 로그인이 아직 설정되지 않았습니다. VITE_GOOGLE_CLIENT_ID를 확인해 주세요."
    )
  }
  return clientId
}

export function useGoogleLogin() {
  const clientRef = useRef<TokenClient | null>(null)
  const pendingPromiseRef = useRef<{
    resolve: (value: { accessToken: string }) => void
    reject: (error: Error) => void
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    const prepare = async () => {
      const clientId = readClientId()
      await loadScript(GIS_SRC)
      if (cancelled || !window.google) return

      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: res => {
          const pending = pendingPromiseRef.current
          if (!pending) return
          pendingPromiseRef.current = null

          if (res.error || !res.access_token) {
            pending.reject(
              new Error(res.error ?? "Google 로그인에 실패했습니다.")
            )
            return
          }
          pending.resolve({ accessToken: res.access_token })
        },
      })
    }

    prepare().catch(() => {
      // 설정 누락·스크립트 실패는 조용히 넘기고, 실제 login() 호출 시 알린다.
      clientRef.current = null
    })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async () => {
    if (!clientRef.current) {
      // 설정이 비어 있으면 그 사유를 그대로 던지고, 그 외엔 준비 중 안내
      readClientId()
      throw new Error(
        "Google 로그인이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요."
      )
    }
    if (pendingPromiseRef.current) {
      throw new Error("Google 로그인이 이미 진행 중입니다.")
    }

    return new Promise<{ accessToken: string }>((resolve, reject) => {
      pendingPromiseRef.current = { resolve, reject }
      try {
        clientRef.current!.requestAccessToken()
      } catch (error) {
        pendingPromiseRef.current = null
        reject(new Error(`Google 로그인 오류: ${error}`))
      }
    })
  }, [])

  return { login }
}
