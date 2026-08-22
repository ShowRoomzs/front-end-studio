// 이미지 프록시의 공통 규칙 — Vercel 함수(api/image-proxy.ts)와 로컬 개발 서버가 함께 쓴다.
//
// 왜 프록시가 필요한가: 게시물 사진의 크롭은 브라우저 캔버스가 한다(§24-2 — 서버에 이미지
// 처리 파이프라인을 들이지 않기로 한 경계). 그런데 이미 올라간 사진을 다시 자르려면 캔버스가
// CloudFront에 있는 원본을 읽어야 하고, 응답에 Access-Control-Allow-Origin이 없으면 그 읽기가
// 막힌다. 같은 오리진으로 한 번 거치면 애초에 교차 출처가 아니게 되어 CORS 자체가 성립하지 않는다.
//
// 스토리지에 CORS가 설정되면 프론트가 직접 받는 경로가 먼저 성공하므로 이 함수는 호출되지
// 않는다 — 그때 지워도 되는 우회로다.

/**
 * 프록시를 허용할 호스트 접미사.
 *
 * 임의의 주소를 받아 대신 요청해 주면 이 엔드포인트가 그대로 **열린 프록시**가 된다
 * (사내망 주소를 찔러보는 통로로 쓰인다). 그래서 목록에 없으면 거부한다(default-deny).
 * 커스텀 CDN 도메인을 쓰게 되면 IMAGE_PROXY_ALLOWED_HOSTS에 쉼표로 나열해 넣는다.
 */
const DEFAULT_ALLOWED_SUFFIXES = [".cloudfront.net", ".amazonaws.com"]

/** 사진 한 장의 상한과 같다 — 그보다 큰 응답은 게시물 사진일 수 없다 */
const MAX_BYTES = 20 * 1024 * 1024

function allowedSuffixes() {
  const extra = (process.env.IMAGE_PROXY_ALLOWED_HOSTS ?? "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
  return [...DEFAULT_ALLOWED_SUFFIXES, ...extra]
}

/** 허용된 대상이면 URL, 아니면 null. 호출부는 null을 400으로 돌려준다 */
export function resolveProxyTarget(raw: string | null | undefined) {
  if (!raw) {
    return null
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  // http를 허용하면 프록시가 평문 구간을 만들어 준다
  if (url.protocol !== "https:") {
    return null
  }

  const host = url.hostname.toLowerCase()
  return allowedSuffixes().some(
    suffix => host === suffix.replace(/^\./, "") || host.endsWith(suffix)
  )
    ? url
    : null
}

export interface ProxiedImage {
  body: Buffer
  contentType: string
}

/** 대상 이미지를 받아 온다. 이미지가 아니거나 너무 크면 던진다 */
export async function fetchProxiedImage(url: URL): Promise<ProxiedImage> {
  const response = await fetch(url, { redirect: "follow" })
  if (!response.ok) {
    throw new Error(`원본을 가져오지 못했습니다 (${response.status})`)
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) {
    throw new Error("이미지가 아닙니다")
  }

  const body = Buffer.from(await response.arrayBuffer())
  if (body.byteLength > MAX_BYTES) {
    throw new Error("파일이 너무 큽니다")
  }

  return { body, contentType }
}
