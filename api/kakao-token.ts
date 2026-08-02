// Vercel 서버리스 함수 — 카카오 인가 코드(code)를 access token으로 교환한다.
//
// 왜 서버가 필요한가: 카카오는 다른 3사와 달리 브라우저에 access token을 직접 주지 않는다.
// authorize는 인가 코드만 주고, 그 코드를 토큰으로 바꾸는 kauth.kakao.com/oauth/token은
// CORS로 브라우저 직접 호출이 막혀 있다(client_secret 노출 방지). 그래서 이 한 단계만
// 서버가 대신한다. 교환된 access token은 프론트로 돌아가 기존 백엔드
// POST /v1/creator/auth/social/login 으로 그대로 전달되므로, Spring 백엔드는 수정이 없다.
//
// ⚠️ 환경변수는 Vercel 대시보드에 등록한다. VITE_ 접두사를 붙이면 안 된다 —
//    VITE_ 가 붙은 값은 브라우저 번들에 그대로 노출되는데, client_secret은 진짜 비밀값이다.
//      KAKAO_REST_API_KEY   (필수) 카카오 콘솔 > 앱 키 > REST API 키
//      KAKAO_REDIRECT_URI   (필수) 콘솔에 등록한 값과 문자 그대로 일치해야 한다
//      KAKAO_CLIENT_SECRET  (선택) 콘솔에서 보안 > Client Secret을 "사용함"으로 켠 경우에만

type VercelRequest = {
  method?: string
  query: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

const TOKEN_URL = "https://kauth.kakao.com/oauth/token"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const code = typeof req.query.code === "string" ? req.query.code : null
  if (!code) {
    res.status(400).json({ error: "code 파라미터가 필요합니다." })
    return
  }

  const clientId = process.env.KAKAO_REST_API_KEY
  const redirectUri = process.env.KAKAO_REDIRECT_URI
  if (!clientId || !redirectUri) {
    res.status(500).json({
      error:
        "카카오 서버 설정이 누락되었습니다. KAKAO_REST_API_KEY / KAKAO_REDIRECT_URI를 확인해 주세요.",
    })
    return
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  })
  // 콘솔에서 Client Secret을 켜둔 경우에만 필요하다. 켜져 있는데 안 보내면 카카오가 거부한다.
  if (process.env.KAKAO_CLIENT_SECRET) {
    body.set("client_secret", process.env.KAKAO_CLIENT_SECRET)
  }

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body,
    })
    const data = (await response.json()) as {
      access_token?: string
      error_description?: string
      error?: string
    }

    if (!response.ok || !data.access_token) {
      res.status(response.ok ? 502 : response.status).json({
        error:
          data.error_description ??
          data.error ??
          "카카오 토큰 발급에 실패했습니다.",
      })
      return
    }

    res.status(200).json({ accessToken: data.access_token })
  } catch {
    res.status(502).json({ error: "카카오 서버와 통신하지 못했습니다." })
  }
}
