import {
  computeCropWindow,
  resolveOutputSize,
  type CropState,
} from "@/features/posts/utils/aspectRatio"

/**
 * 크롭본은 항상 JPEG로 낸다.
 *
 * 원본이 PNG여도 마찬가지다 — 사진 콘텐츠라 무손실이 필요 없고, PNG로 다시 인코딩하면
 * 20장짜리 게시물의 업로드 용량이 몇 배로 뛴다. 투명 픽셀은 흰색으로 깔아 없앤다
 * (JPEG는 알파를 담지 못해 그냥 그리면 검게 나온다).
 */
const OUTPUT_MIME = "image/jpeg"
const OUTPUT_QUALITY = 0.92
export const CROP_FILE_EXTENSION = "jpg"

/**
 * 같은 오리진 이미지 프록시 — `api/image-proxy.ts`(배포) · vite 개발 서버 미들웨어(로컬).
 */
function toProxyUrl(url: string) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

async function decodeFromNetwork(url: string) {
  const response = await fetch(url, { credentials: "omit" })
  if (!response.ok) {
    throw new Error(`원본을 가져오지 못했습니다 (${response.status})`)
  }
  return createImageBitmap(await response.blob())
}

/**
 * 자를 원본을 손에 넣는다.
 *
 * 새로 고른 파일은 바이트가 이미 있으니 그대로 디코딩한다. 이미 올라간 사진은 받아 와야
 * 하는데, 여기서 두 번 시도한다.
 *
 * 1. **직접** — 스토리지가 CORS를 열어두면 이 경로로 끝난다. 콘솔에 CORS 오류 한 줄이
 *    남지만 그건 실패한 시도의 흔적일 뿐 화면 동작과 무관하다.
 * 2. **같은 오리진 프록시** — CloudFront는 지금 `Access-Control-Allow-Origin`을 주지 않아
 *    브라우저가 응답 본문을 읽지 못한다. 앱 오리진을 한 번 거치면 애초에 교차 출처가
 *    아니게 되어 제약이 사라진다.
 *
 * 순서를 이렇게 둔 이유 — 스토리지에 CORS가 설정되는 순간 프록시는 저절로 쓰이지 않게 되고,
 * 그때 우회로만 걷어내면 된다.
 */
export async function loadCropSource(source: File | string) {
  if (source instanceof File) {
    return createImageBitmap(source)
  }

  try {
    return await decodeFromNetwork(source)
  } catch {
    try {
      return await decodeFromNetwork(toProxyUrl(source))
    } catch {
      throw new Error("원본 사진을 불러오지 못했습니다")
    }
  }
}

/**
 * 대상 비율로 잘라 JPEG Blob을 만든다.
 *
 * 이 결과의 픽셀 크기가 곧 게시물 비율이 된다 — 업로드하면 서버가 같은 이미지를 다시 읽어
 * 범위를 검사하므로, 여기서 만든 정수 크기가 곧 통과 여부를 가른다.
 */
export async function renderCroppedBlob(params: {
  source: ImageBitmap
  targetRatio: number
  crop: CropState
}) {
  const { source, targetRatio, crop } = params

  const window = computeCropWindow({
    naturalWidth: source.width,
    naturalHeight: source.height,
    targetRatio,
    crop,
  })
  const output = resolveOutputSize({
    sw: window.sw,
    sh: window.sh,
    targetRatio,
  })

  const canvas = document.createElement("canvas")
  canvas.width = output.width
  canvas.height = output.height

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("이 브라우저에서는 사진을 편집할 수 없습니다")
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, output.width, output.height)
  context.imageSmoothingQuality = "high"
  context.drawImage(
    source,
    window.sx,
    window.sy,
    window.sw,
    window.sh,
    0,
    0,
    output.width,
    output.height
  )

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, OUTPUT_MIME, OUTPUT_QUALITY)
  )
  if (!blob) {
    throw new Error("사진을 처리하지 못했습니다")
  }

  return { blob, width: output.width, height: output.height }
}

/** 크롭본 파일명 — 서버가 확장자로 형식을 판정하므로 실제 출력 형식과 맞춰야 한다 */
export function toCropFileName(originalName: string) {
  const base = originalName.replace(/\.[^.]+$/, "") || "photo"
  return `${base}_crop.${CROP_FILE_EXTENSION}`
}
