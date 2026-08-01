import { useEffect } from "react"
import { loadScript } from "@/features/auth/utils/loadScript"
import {
  NAVER_CALLBACK_MESSAGE_SOURCE,
  type NaverCallbackMessage,
} from "@/features/auth/utils/socialProviders/naverWebLogin"

const SDK_SRC = "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"

/**
 * 네이버 로그인 팝업이 인증 완료 후 도착하는 콜백 페이지.
 *
 * 네이버 공식 SDK는 "콜백 페이지도 같은 설정으로 SDK를 다시 초기화해야 팝업 안에서
 * 발급된 토큰을 읽어낼 수 있다"는 2단계 구조를 요구한다(SDK 표준 사용 패턴).
 * 여기서 SDK를 다시 초기화해 로그인 상태를 확인한 뒤, opener(원래 로그인 탭)에
 * postMessage로 결과를 전달하고 스스로 닫는다.
 *
 * 라우트 경로는 VITE_NAVER_REDIRECT_URI, 그리고 네이버 개발자센터에 등록한
 * Callback URL과 정확히 일치해야 한다.
 */
export default function NaverCallbackPage() {
  useEffect(() => {
    const send = (message: NaverCallbackMessage) => {
      window.opener?.postMessage(message, window.location.origin)
      window.close()
    }

    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID
    const callbackUrl = import.meta.env.VITE_NAVER_REDIRECT_URI
    if (!clientId || !callbackUrl) {
      send({
        source: NAVER_CALLBACK_MESSAGE_SOURCE,
        accessToken: null,
        error: "네이버 로그인 설정이 올바르지 않습니다.",
      })
      return
    }

    loadScript(SDK_SRC)
      .then(() => {
        if (!window.naver) {
          throw new Error("네이버 SDK를 불러오지 못했습니다.")
        }
        const widget = new window.naver.LoginWithNaverId({
          clientId,
          callbackUrl,
          isPopup: true,
        })
        widget.init()
        widget.getLoginStatus(status => {
          if (status && widget.accessToken?.accessToken) {
            send({
              source: NAVER_CALLBACK_MESSAGE_SOURCE,
              accessToken: widget.accessToken.accessToken,
              error: null,
            })
          } else {
            send({
              source: NAVER_CALLBACK_MESSAGE_SOURCE,
              accessToken: null,
              error: "네이버 로그인에 실패했습니다.",
            })
          }
        })
      })
      .catch((err: Error) => {
        send({
          source: NAVER_CALLBACK_MESSAGE_SOURCE,
          accessToken: null,
          error: err.message,
        })
      })
  }, [])

  return null
}
