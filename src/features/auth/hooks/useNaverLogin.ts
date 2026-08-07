import { useCallback, useEffect } from "react"
import { loadScript } from "@/features/auth/utils/loadScript"

/**
 * 네이버 로그인 (웹).
 *
 * 앱(front-end)의 useNaverLogin이 useEffect에서 NaverLogin.initialize()를 호출하는 것과
 * 같은 구조다 — 여기서도 마운트 시 공식 JS SDK를 로드해 위젯을 초기화해 둔다.
 *
 * 웹 SDK만의 사정: 이 SDK는 자기가 렌더링한 <a>에 클릭 핸들러를 붙이는 위젯형이라
 * 우리 커스텀 버튼과 그대로는 안 맞는다. 그래서 위젯을 화면 밖 컨테이너에 렌더링해두고,
 * login() 호출 시 그 앵커를 프로그램적으로 클릭한다.
 *
 * ⚠️ SDK 제약 2가지 (여기 어기면 앵커가 아예 안 만들어진다)
 *   1. 컨테이너 id는 반드시 `naverIdLogin` — SDK가 이 id를 하드코딩해 찾는다
 *   2. `loginButton` 옵션을 줘야 버튼(<a id="naverIdLogin_loginButton">)을 렌더링한다.
 *      이 옵션이 없으면 init()이 아무것도 그리지 않는다.
 */

const SDK_SRC = "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"

// SDK가 하드코딩으로 찾는 id. 바꾸면 동작하지 않는다.
const WIDGET_CONTAINER_ID = "naverIdLogin"
const LOGIN_ANCHOR_SELECTOR = `#${WIDGET_CONTAINER_ID} a`

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

interface NaverLoginOptions {
  clientId: string
  callbackUrl: string
  isPopup: boolean
  loginButton?: { color: string; type: number; height: number }
}

declare global {
  interface Window {
    naver?: {
      LoginWithNaverId: new (options: NaverLoginOptions) => NaverLoginWidget
    }
  }
}

/**
 * ⚠️ 설정 필요 — VITE_NAVER_CLIENT_ID / VITE_NAVER_REDIRECT_URI
 *
 * 네이버 Client ID는 플랫폼에 종속되지 않아 앱(front-end)의 EXPO_PUBLIC_NAVER_CLIENT_ID를
 * 그대로 써도 된다. 다만 그 앱에 등록된 Callback URL은 모바일 스킴이라 웹에선 동작하지 않으므로,
 * 같은 네이버 애플리케이션의 **네이버 로그인 Callback URL** 목록에 이 앱의 값을
 * 추가로만 등록하면 된다(기존 값을 지우면 앱 로그인이 깨진다).
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

/**
 * @param renderButton 로그인 페이지에서는 true(앵커를 그려야 클릭 가능),
 *   콜백 페이지에서는 false(토큰만 읽으므로 버튼이 필요 없다).
 */
export async function initNaverWidget(
  renderButton: boolean
): Promise<NaverLoginWidget> {
  const { clientId, callbackUrl } = readNaverConfig()
  await loadScript(SDK_SRC)
  if (!window.naver) {
    throw new Error("네이버 SDK를 불러오지 못했습니다.")
  }

  const options: NaverLoginOptions = { clientId, callbackUrl, isPopup: true }

  if (renderButton) {
    if (!document.getElementById(WIDGET_CONTAINER_ID)) {
      const container = document.createElement("div")
      container.id = WIDGET_CONTAINER_ID
      // display:none 대신 화면 밖으로 밀어낸다 — 일부 브라우저는 렌더링되지 않은
      // 엘리먼트의 프로그램적 클릭을 무시할 수 있다.
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.width = "1px"
      container.style.height = "1px"
      container.style.overflow = "hidden"
      document.body.appendChild(container)
    }
    // 이 옵션이 있어야 SDK가 <a id="naverIdLogin_loginButton">을 렌더링한다.
    options.loginButton = { color: "green", type: 3, height: 48 }
  }

  const widget = new window.naver.LoginWithNaverId(options)
  widget.init()
  return widget
}

export function useNaverLogin() {
  useEffect(() => {
    initNaverWidget(true).catch(() => {
      // 설정 누락·스크립트 실패는 여기서 조용히 넘기고, 실제 login() 호출 시 알린다.
    })
  }, [])

  const login = useCallback(async () => {
    const anchor = document.querySelector<HTMLAnchorElement>(
      LOGIN_ANCHOR_SELECTOR
    )
    if (!anchor) {
      // 설정이 비어 있으면 그 사유를 그대로 던지고, 그 외엔 준비 중 안내
      readNaverConfig()
      throw new Error(
        "네이버 로그인이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요."
      )
    }

    const accessToken = await new Promise<string>((resolve, reject) => {
      let settled = false
      let popupRef: Window | null = null

      const cleanup = () => {
        settled = true
        window.removeEventListener("message", handleMessage)
        clearTimeout(timeoutId)
        clearInterval(closedCheck)
      }

      const handleMessage = (event: MessageEvent<NaverCallbackMessage>) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.source !== NAVER_CALLBACK_MESSAGE_SOURCE) return

        cleanup()

        if (!event.data.accessToken) {
          reject(new Error(event.data.error ?? "네이버 로그인에 실패했습니다."))
          return
        }
        resolve(event.data.accessToken)
      }

      window.addEventListener("message", handleMessage)

      // SDK가 anchor.click() 내부에서 동기적으로 여는 팝업이라 참조를 직접 받을 수 없다.
      // window.open을 호출 직후에만 잠깐 가로채 그 팝업의 핸들을 얻는다.
      const originalOpen = window.open.bind(window)
      window.open = (...args: Parameters<typeof window.open>) => {
        popupRef = originalOpen(...args)
        window.open = originalOpen
        return popupRef
      }
      // 동기 호출 — 원래 버튼 클릭과 같은 호출 스택이어야 팝업이 차단되지 않는다.
      anchor.click()
      window.open = originalOpen

      // 로그인하지 않고 팝업만 닫은 경우 무한 대기하지 않도록 감지
      const closedCheck = setInterval(() => {
        if (!settled && popupRef?.closed) {
          cleanup()
          reject(new Error("네이버 로그인이 취소되었습니다."))
        }
      }, 500)

      // 팝업 참조를 못 얻은 경우 등을 대비한 안전망
      const timeoutId = setTimeout(() => {
        if (!settled) {
          cleanup()
          reject(
            new Error(
              "네이버 로그인 시간이 초과되었습니다. 다시 시도해 주세요."
            )
          )
        }
      }, RESPONSE_TIMEOUT_MS)
    })

    return { accessToken }
  }, [])

  return { login }
}
