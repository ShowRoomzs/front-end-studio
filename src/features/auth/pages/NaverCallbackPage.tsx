import { useEffect } from "react"

import {
  initNaverWidget,
  NAVER_CALLBACK_MESSAGE_SOURCE,
  type NaverCallbackMessage,
} from "@/features/auth/hooks/useNaverLogin"

/**
 * 네이버 로그인 팝업이 인증 완료 후 도착하는 콜백 페이지.
 *
 * 네이버 공식 SDK는 "콜백 페이지도 같은 설정으로 SDK를 다시 초기화해야 팝업 안에서
 * 발급된 토큰을 읽어낼 수 있다"는 2단계 구조를 요구한다(SDK 표준 사용 패턴).
 * 여기서 다시 초기화해 로그인 상태를 확인한 뒤 opener(원래 로그인 탭)에
 * postMessage로 결과를 전달하고 스스로 닫는다.
 *
 * 라우트 경로는 VITE_NAVER_REDIRECT_URI 및 네이버 개발자센터의 Callback URL과
 * 정확히 일치해야 한다.
 */
export default function NaverCallbackPage() {
  useEffect(() => {
    const send = (result: Omit<NaverCallbackMessage, "source">) => {
      window.opener?.postMessage(
        { source: NAVER_CALLBACK_MESSAGE_SOURCE, ...result },
        window.location.origin
      )
      window.close()
    }

    // 여기선 토큰만 읽으므로 버튼은 렌더링하지 않는다(renderButton=false).
    initNaverWidget(false)
      .then(widget => {
        widget.getLoginStatus(status => {
          if (status && widget.accessToken?.accessToken) {
            send({
              accessToken: widget.accessToken.accessToken,
              error: null,
            })
            return
          }
          send({
            accessToken: null,
            error: "네이버 로그인에 실패했습니다.",
          })
        })
      })
      .catch((err: Error) => {
        send({ accessToken: null, error: err.message })
      })
  }, [])

  return null
}
