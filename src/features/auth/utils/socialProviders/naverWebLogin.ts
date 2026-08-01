import { loadScript } from "@/features/auth/utils/loadScript"

// 네이버 공식 JS SDK. 실제 <a> 엘리먼트에 스스로 클릭 핸들러를 붙이는 위젯형 SDK라
// 우리 커스텀 버튼(SocialLoginButton)과 그대로는 안 맞는다. 그래서 위젯은 화면 밖
// 숨은 컨테이너에 렌더링해두고, 우리 버튼 클릭 시 그 안의 앵커를 프로그램적으로
// 클릭해 팝업을 띄운다. 팝업은 로그인 완료 후 callbackUrl(NaverCallbackPage)로
// 이동하는데, 그 페이지도 같은 SDK를 다시 초기화해 토큰을 읽고 opener에 postMessage로
// 돌려준다 — 공식 SDK가 요구하는 "콜백 페이지도 SDK를 태운다"는 표준 패턴 그대로다.
const SDK_SRC = "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"
const WIDGET_CONTAINER_ID = "naverIdLogin"

// 팝업 핸들을 SDK가 노출하지 않아 "로그인 없이 창만 닫음"을 직접 감지할 수 없다.
// 대신 타임아웃으로 방어한다(이전 직접 구현보다 UX가 살짝 둔감해진 지점).
const RESPONSE_TIMEOUT_MS = 3 * 60 * 1000

export const NAVER_CALLBACK_MESSAGE_SOURCE = "naver-oauth-callback"

export type NaverCallbackMessage = {
  source: typeof NAVER_CALLBACK_MESSAGE_SOURCE
  accessToken: string | null
  error: string | null
}

interface NaverLoginWidget {
  init: () => void
  getLoginStatus: (callback: (status: boolean) => void) => void
  accessToken?: { accessToken: string }
}

declare global {
  interface Window {
    naver?: {
      LoginWithNaverId: new (options: {
        clientId: string
        callbackUrl: string
        isPopup: boolean
      }) => NaverLoginWidget
    }
  }
}

/**
 * ⚠️ 설정 필요 — VITE_NAVER_CLIENT_ID / VITE_NAVER_REDIRECT_URI
 *
 * 네이버 Client ID는 카카오와 달리 플랫폼에 종속되지 않는다 — 소비자 앱(front-end)의
 * EXPO_PUBLIC_NAVER_CLIENT_ID를 **같은 값 그대로** VITE_NAVER_CLIENT_ID에 써도 될 가능성이
 * 높다. 다만 그 앱에 등록된 Callback URL은 모바일 스킴이라 이 도메인으로는 동작하지
 * 않으므로, 같은 네이버 애플리케이션의 서비스 URL 목록에 이 앱의 Callback URL을
 * **추가로만** 등록하면 된다(새 애플리케이션을 만들 필요는 없어 보인다).
 * 네이버 개발자센터 → 그 애플리케이션 → API 설정 → 서비스 URL / Callback URL에
 * VITE_NAVER_REDIRECT_URI 값을 경로까지 정확히 등록할 것
 * (로컬 기본값 http://localhost:5173/oauth/naver/callback).
 */
function requireConfig() {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID
  const callbackUrl = import.meta.env.VITE_NAVER_REDIRECT_URI
  if (!clientId || !callbackUrl) {
    throw new Error(
      "네이버 로그인이 아직 설정되지 않았습니다. VITE_NAVER_CLIENT_ID / VITE_NAVER_REDIRECT_URI를 확인해 주세요."
    )
  }
  return { clientId, callbackUrl }
}

let widgetPromise: Promise<NaverLoginWidget> | null = null

async function createWidget(): Promise<NaverLoginWidget> {
  const { clientId, callbackUrl } = requireConfig()
  await loadScript(SDK_SRC)
  if (!window.naver) {
    throw new Error("네이버 SDK를 불러오지 못했습니다.")
  }

  let container = document.getElementById(WIDGET_CONTAINER_ID)
  if (!container) {
    container = document.createElement("div")
    container.id = WIDGET_CONTAINER_ID
    container.style.display = "none"
    document.body.appendChild(container)
  }

  const widget = new window.naver.LoginWithNaverId({
    clientId,
    callbackUrl,
    isPopup: true,
  })
  widget.init()
  return widget
}

/**
 * 로그인 페이지 진입 시 미리 호출해 둔다(useEffect).
 *
 * 위젯 초기화는 스크립트 네트워크 요청을 포함해 진짜 비동기라, 버튼 클릭 시점에야
 * 시작하면 "클릭 → 팝업 호출" 사이에 시간차가 생겨 브라우저 팝업 차단에 걸린다.
 * 미리 준비해 두면 클릭 시점엔 getNaverAccessToken()의 앵커 클릭만 동기로 실행된다.
 */
export async function preloadNaverWidget(): Promise<void> {
  if (!widgetPromise) {
    widgetPromise = createWidget().catch(err => {
      widgetPromise = null // 실패 시 다음 시도에서 재시도 가능하도록 캐시 해제
      throw err
    })
  }
  await widgetPromise
}

export function getNaverAccessToken(): Promise<string> {
  const anchor = document.querySelector<HTMLAnchorElement>(
    `#${WIDGET_CONTAINER_ID} a`
  )
  if (!anchor) {
    throw new Error(
      "네이버 로그인이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요."
    )
  }

  return new Promise<string>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      window.removeEventListener("message", handleMessage)
      reject(
        new Error("네이버 로그인 시간이 초과되었습니다. 다시 시도해 주세요.")
      )
    }, RESPONSE_TIMEOUT_MS)

    const handleMessage = (event: MessageEvent<NaverCallbackMessage>) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.source !== NAVER_CALLBACK_MESSAGE_SOURCE) return

      clearTimeout(timeoutId)
      window.removeEventListener("message", handleMessage)

      if (!event.data.accessToken) {
        reject(new Error(event.data.error ?? "네이버 로그인에 실패했습니다."))
        return
      }
      resolve(event.data.accessToken)
    }

    window.addEventListener("message", handleMessage)
    // 동기 호출 — 이 클릭이 원래 버튼 클릭 이벤트와 같은 호출 스택 안에 있어야
    // 브라우저가 팝업을 사용자 조작으로 인정한다. preloadNaverWidget()이 미리
    // 끝나 있지 않으면 위의 querySelector가 null이라 이 지점까지 오지 않는다.
    anchor.click()
  })
}
