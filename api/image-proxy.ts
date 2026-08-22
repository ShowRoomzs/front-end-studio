// Vercel 서버리스 함수 — 게시물 사진의 원본을 같은 오리진으로 중계한다.
//
// 배경과 허용 규칙은 _imageProxy.ts 주석 참고. 요약하면, 크롭은 브라우저 캔버스가 하는데
// CloudFront 응답에 CORS 헤더가 없어 캔버스가 원본을 읽지 못한다. 여기를 한 번 거치면
// 브라우저 입장에서 같은 오리진이라 그 제약이 사라진다.
//
// ⚠️ 환경변수(선택): IMAGE_PROXY_ALLOWED_HOSTS — 커스텀 CDN 도메인을 쓸 때만.
//    VITE_ 접두사를 붙이지 않는다(브라우저 번들에 들어갈 값이 아니다).

import { fetchProxiedImage, resolveProxyTarget } from "./_imageProxy"

type VercelRequest = {
  method?: string
  query: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
  send: (body: Buffer) => void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const raw = typeof req.query.url === "string" ? req.query.url : null
  const target = resolveProxyTarget(raw)
  if (!target) {
    res.status(400).json({ error: "허용되지 않은 주소입니다." })
    return
  }

  try {
    const image = await fetchProxiedImage(target)
    res.setHeader("Content-Type", image.contentType)
    // 크롭 중 같은 사진을 여러 번 열 수 있다. 공용 캐시에는 남기지 않는다
    res.setHeader("Cache-Control", "private, max-age=300")
    res.status(200).send(image.body)
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error ? error.message : "원본을 가져오지 못했습니다.",
    })
  }
}
