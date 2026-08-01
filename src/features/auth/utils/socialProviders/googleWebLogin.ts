import { loadScript } from "@/features/auth/utils/loadScript"

// Google Identity Services(GIS). 옛 gapi/GSI 라이브러리가 아니라 현재 구글 공식 권장 SDK.
const GIS_SRC = "https://accounts.google.com/gsi/client"

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (res: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

/**
 * ⚠️ 설정 필요 — VITE_GOOGLE_CLIENT_ID
 *
 * Google Cloud Console → API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID
 * (유형: 웹 애플리케이션) 생성 또는 기존 것 사용.
 * → **승인된 JavaScript 원본**에 이 앱이 배포될 도메인(로컬은 http://localhost:5173) 등록.
 * → 클라이언트 ID를 .env.local 의 VITE_GOOGLE_CLIENT_ID 에 붙여넣으면 바로 동작한다.
 *
 * 새 클라이언트를 만들 필요가 없을 가능성이 높다 — 소비자 앱(front-end)의
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID가 이미 **웹 애플리케이션 타입**으로 등록된 클라이언트다
 * (Expo AuthSession이 크로스플랫폼 흐름에 쓰려고 등록해둔 것). 이 값을 그대로
 * VITE_GOOGLE_CLIENT_ID에 넣고, 같은 클라이언트의 승인된 원본에 스튜디오 도메인만
 * 추가하면 될 것으로 보인다. Google Cloud Console 접근 권한으로 직접 확인할 것.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error(
      "Google 로그인이 아직 설정되지 않았습니다. VITE_GOOGLE_CLIENT_ID를 확인해 주세요."
    )
  }

  await loadScript(GIS_SRC)
  if (!window.google) {
    throw new Error("Google SDK를 불러오지 못했습니다.")
  }

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: res => {
        if (res.error || !res.access_token) {
          reject(new Error(res.error ?? "Google 로그인에 실패했습니다."))
          return
        }
        resolve(res.access_token)
      },
    })
    client.requestAccessToken()
  })
}
