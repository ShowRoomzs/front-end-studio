import { useEffect } from "react"

import {
  KAKAO_CALLBACK_MESSAGE_SOURCE,
  type KakaoCallbackMessage,
} from "@/features/auth/hooks/useKakaoLogin"

/**
 * 카카오 로그인 팝업이 인가 후 도착하는 콜백 페이지.
 *
 * 카카오는 access token이 아니라 인가 코드(code)를 쿼리스트링으로 준다. 그 코드를
 * 토큰으로 바꾸는 건 CORS 때문에 브라우저에서 직접 못 하므로 Vercel 서버리스 함수
 * (api/kakao-token.ts)에 대신 요청하고, 받은 토큰을 opener(원래 로그인 탭)에
 * postMessage로 전달한 뒤 스스로 닫는다.
 *
 * 라우트 경로는 VITE_KAKAO_REDIRECT_URI 및 카카오 콘솔의 리다이렉트 URI와 정확히 일치해야 한다.
 */
export default function KakaoCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const state = params.get("state")

    const send = (
      result: Pick<KakaoCallbackMessage, "accessToken" | "error">
    ) => {
      window.opener?.postMessage(
        { source: KAKAO_CALLBACK_MESSAGE_SOURCE, state, ...result },
        window.location.origin
      )
      window.close()
    }

    const code = params.get("code")
    if (!code) {
      send({
        accessToken: null,
        // 사용자가 동의 화면에서 취소하면 error=access_denied로 돌아온다
        error:
          params.get("error_description") ?? "카카오 로그인이 취소되었습니다.",
      })
      return
    }

    fetch(`/api/kakao-token?code=${encodeURIComponent(code)}`)
      .then(async res => {
        const data = (await res.json()) as {
          accessToken?: string
          error?: string
        }
        if (!res.ok || !data.accessToken) {
          send({
            accessToken: null,
            error: data.error ?? "카카오 토큰 발급에 실패했습니다.",
          })
          return
        }
        send({ accessToken: data.accessToken, error: null })
      })
      .catch(() => {
        send({
          accessToken: null,
          error: "카카오 토큰 발급 요청에 실패했습니다.",
        })
      })
  }, [])

  return null
}
