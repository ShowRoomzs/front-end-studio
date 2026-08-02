import { useCallback } from "react"

/**
 * 카카오 로그인 (웹).
 *
 * ⚠️ 앱(front-end)의 useKakaoLogin과 내부 구현이 다를 수밖에 없는 유일한 provider다.
 * 앱은 @react-native-kakao/user의 login()이 accessToken을 바로 주지만, 웹에는 그런 API가 없다:
 *   - JS SDK v1의 Kakao.Auth.login()은 v2에서 제거됐고, v1 자체도 2026-12-31 지원 종료
 *   - v2의 Kakao.Auth.authorize()는 팝업 옵션이 없고(전체 페이지 리다이렉트) 인가 코드만 준다
 *   - 그 코드를 토큰으로 바꾸는 /oauth/token은 CORS로 브라우저 직접 호출이 막혀 있다
 * 그래서 authorize URL을 직접 팝업으로 열고, code→token 교환 한 단계만
 * Vercel 서버리스 함수(api/kakao-token.ts)에 맡긴다.
 *
 * 반환 시그니처는 앱과 동일하게 { login: () => Promise<{ accessToken }> }로 맞춰,
 * 상위 useSocialLogin은 provider별 차이를 몰라도 되게 했다.
 */

const AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize"
const STATE_STORAGE_KEY = "kakao_oauth_state"

export const KAKAO_CALLBACK_MESSAGE_SOURCE = "kakao-oauth-callback"

export type KakaoCallbackMessage = {
  source: typeof KAKAO_CALLBACK_MESSAGE_SOURCE
  accessToken: string | null
  state: string | null
  error: string | null
}

/**
 * ⚠️ 설정 필요
 *
 * 프론트(.env — 브라우저에 노출돼도 무방한 값):
 *   VITE_KAKAO_REST_API_KEY  — 카카오 콘솔 > 앱 키 > **REST API 키** (JavaScript 키 아님)
 *   VITE_KAKAO_REDIRECT_URI  — 예: https://front-end-studio-one.vercel.app/oauth/kakao/callback
 *
 * Vercel 대시보드(서버 전용 — VITE_ 접두사를 붙이면 브라우저에 노출되니 붙이지 말 것):
 *   KAKAO_REST_API_KEY / KAKAO_REDIRECT_URI  — 위와 같은 값
 *   KAKAO_CLIENT_SECRET — 콘솔에서 Client Secret을 "사용함"으로 켠 경우에만
 *
 * 카카오 콘솔: [앱] > [플랫폼 키] > [REST API 키] > **리다이렉트 URI**에
 * VITE_KAKAO_REDIRECT_URI와 문자 그대로 같은 값을 등록(플랫폼 > Web 도메인 등록도 함께).
 */
function buildAuthorizeUrl(): string {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI
  if (!clientId || !redirectUri) {
    throw new Error(
      "카카오 로그인이 아직 설정되지 않았습니다. VITE_KAKAO_REST_API_KEY / VITE_KAKAO_REDIRECT_URI를 확인해 주세요."
    )
  }

  // CSRF 방지용 state — 팝업이 돌아왔을 때 우리가 연 요청이 맞는지 대조한다.
  const state = crypto.randomUUID()
  sessionStorage.setItem(STATE_STORAGE_KEY, state)

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

export function useKakaoLogin() {
  const login = useCallback(async () => {
    // URL 조립은 동기라 window.open이 클릭 이벤트와 같은 호출 스택에 남는다(팝업 차단 회피).
    const url = buildAuthorizeUrl()
    const popup = window.open(url, "kakao-login", "width=460,height=600")
    if (!popup) {
      throw new Error(
        "팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해 주세요."
      )
    }

    const accessToken = await new Promise<string>((resolve, reject) => {
      let settled = false

      const cleanup = () => {
        settled = true
        window.removeEventListener("message", handleMessage)
        clearInterval(closedCheck)
      }

      const handleMessage = (event: MessageEvent<KakaoCallbackMessage>) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.source !== KAKAO_CALLBACK_MESSAGE_SOURCE) return

        cleanup()
        popup.close()

        const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY)
        sessionStorage.removeItem(STATE_STORAGE_KEY)

        if (event.data.state !== expectedState) {
          reject(new Error("카카오 로그인 상태값이 일치하지 않습니다."))
          return
        }
        if (!event.data.accessToken) {
          reject(new Error(event.data.error ?? "카카오 로그인에 실패했습니다."))
          return
        }
        resolve(event.data.accessToken)
      }

      window.addEventListener("message", handleMessage)

      // 로그인하지 않고 팝업만 닫은 경우 무한 대기하지 않도록 감지
      const closedCheck = setInterval(() => {
        if (!settled && popup.closed) {
          cleanup()
          reject(new Error("카카오 로그인이 취소되었습니다."))
        }
      }, 500)
    })

    return { accessToken }
  }, [])

  return { login }
}
