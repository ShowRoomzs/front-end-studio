import { useCallback, useEffect, useRef } from "react"
import { loadScript } from "@/features/auth/utils/loadScript"

/**
 * 네이버 로그인 (웹).
 *
 * 앱(front-end)의 useNaverLogin이 useEffect에서 NaverLogin.initialize()를 호출하는 것과
 * 같은 구조다 — 여기서도 마운트 시 공식 JS SDK를 로드해 위젯을 초기화해 둔다.
 *
 * 웹 SDK만의 사정: 이 SDK는 자기가 렌더링한 <a> 엘리먼트에 클릭 핸들러를 붙이는 위젯형이라
 * 우리 커스텀 버튼과 그대로는 안 맞는다. 그래서 위젯을 화면 밖 숨은 컨테이너에 심어두고,
 * login() 호출 시 그 안의 앵커를 프로그램적으로 클릭한다.
 *
 * 미리 초기화해 두는 게 중요한 이유: 클릭 시점에야 스크립트를 로드하면 "클릭 → 팝업" 사이에
 * 시간차가 생겨 브라우저 팝업 차단에 걸린다.
 */

const SDK_SRC = "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"
const WIDGET_CONTAINER_ID = "naverIdLogin"

// SDK가 팝업 핸들을 노출하지 않아 "로그인 없이 창만 닫음"을 직접 감지할 수 없다. 타임아웃으로 방어.
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
 * 네이버 Client ID는 플랫폼에 종속되지 않아 앱(front-end)의 EXPO_PUBLIC_NAVER_CLIENT_ID를
 * 그대로 써도 된다. 다만 그 앱에 등록된 Callback URL은 모바일 스킴이라 웹에선 동작하지 않으므로,
 * 같은 네이버 애플리케이션의 서비스 URL 목록에 이 앱의 Callback URL을 **추가로만** 등록하면 된다.
 * 네이버 개발자센터 → 애플리케이션 → API 설정 → 서비스 URL / Callback URL에
 * VITE_NAVER_REDIRECT_URI 값을 경로까지 정확히 등록할 것.
 */
export function readNaverConfig() {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID
  const callbackUrl = import.meta.env.VITE_NAVER_REDIRECT_URI
  if (!clientId || !callbackUrl) {
    throw new Error(
      "네이버 로그인이 아직 설정되지 않았습니다. VITE_NAVER_CLIENT_ID / VITE_NAVER_REDIRECT_URI를 확인해 주세요."
    )
  }
  return { clientId, callbackUrl }
}

export async function initNaverWidget(
  containerId: string
): Promise<NaverLoginWidget> {
  const { clientId, callbackUrl } = readNaverConfig()
  await loadScript(SDK_SRC)
  if (!window.naver) {
    throw new Error("네이버 SDK를 불러오지 못했습니다.")
  }

  if (!document.getElementById(containerId)) {
    const container = document.createElement("div")
    container.id = containerId
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

export function useNaverLogin() {
  const readyRef = useRef(false)

  useEffect(() => {
    initNaverWidget(WIDGET_CONTAINER_ID)
      .then(() => {
        readyRef.current = true
      })
      .catch(() => {
        // 설정 누락·스크립트 실패는 여기서 조용히 넘기고, 실제 login() 호출 시 알린다.
        readyRef.current = false
      })
  }, [])

  const login = useCallback(async () => {
    const anchor = document.querySelector<HTMLAnchorElement>(
      `#${WIDGET_CONTAINER_ID} a`
    )
    if (!anchor) {
      // 설정이 비어 있으면 그 사유를 그대로 던지고, 그 외엔 준비 중 안내
      readNaverConfig()
      throw new Error(
        "네이버 로그인이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요."
      )
    }

    const accessToken = await new Promise<string>((resolve, reject) => {
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
      // 동기 호출 — 원래 버튼 클릭과 같은 호출 스택이어야 팝업이 차단되지 않는다.
      anchor.click()
    })

    return { accessToken }
  }, [])

  return { login }
}
