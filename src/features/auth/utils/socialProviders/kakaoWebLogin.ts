import { loadScript } from "@/features/auth/utils/loadScript"

// 카카오 JS SDK. 버전은 https://developers.kakao.com/sdk/js 최신 버전을 확인해 갱신할 것.
const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"

declare global {
  interface Window {
    Kakao?: {
      init: (jsKey: string) => void
      isInitialized: () => boolean
      Auth: {
        login: (options: {
          success: (res: { access_token: string }) => void
          fail: (err: unknown) => void
        }) => void
      }
    }
  }
}

/**
 * ⚠️ 설정 필요 — VITE_KAKAO_JS_KEY
 *
 * 새 앱을 만들 필요는 없다 — 소비자 앱(front-end)의 EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY가
 * 등록된 **같은 카카오 애플리케이션**을 그대로 쓰면 된다. 다만 카카오는 플랫폼별로
 * 키 자체가 다르다: 카카오 개발자센터 → 그 앱 → 앱 설정 → 플랫폼 → **Web** 추가 →
 * 사이트 도메인에 이 앱이 배포될 도메인(로컬은 http://localhost:5173) 등록 →
 * 앱 키 탭에서 (네이티브 앱 키가 아니라) **JavaScript 키**를 복사.
 * → .env.local 의 VITE_KAKAO_JS_KEY 에 붙여넣으면 바로 동작한다.
 */
export async function getKakaoAccessToken(): Promise<string> {
  const jsKey = import.meta.env.VITE_KAKAO_JS_KEY
  if (!jsKey) {
    throw new Error(
      "카카오 로그인이 아직 설정되지 않았습니다. VITE_KAKAO_JS_KEY를 확인해 주세요."
    )
  }

  await loadScript(KAKAO_SDK_SRC)
  if (!window.Kakao) {
    throw new Error("카카오 SDK를 불러오지 못했습니다.")
  }
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(jsKey)
  }

  return new Promise<string>((resolve, reject) => {
    window.Kakao!.Auth.login({
      success: res => resolve(res.access_token),
      fail: err =>
        reject(
          new Error(`카카오 로그인에 실패했습니다: ${JSON.stringify(err)}`)
        ),
    })
  })
}
