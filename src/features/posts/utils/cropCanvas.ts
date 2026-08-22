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
 * 원본 소스를 얻는다.
 *
 * 새로 고른 파일은 바이트가 손에 있으니 그대로 디코딩하고, 이미 올라간 사진은 원본 URL에서
 * 다시 받아야 한다. 후자는 `crossOrigin`이 없으면 캔버스가 오염돼 `toBlob`이 던진다 —
 * 스토리지가 CORS를 열어주지 않는 경우가 있어서 호출부가 실패를 다룰 수 있게 그대로 전파한다.
 */
export async function loadCropSource(source: File | string) {
  if (source instanceof File) {
    return createImageBitmap(source)
  }

  const image = new Image()
  image.crossOrigin = "anonymous"
  image.src = source

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("원본 사진을 불러오지 못했습니다"))
  })

  return createImageBitmap(image)
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
