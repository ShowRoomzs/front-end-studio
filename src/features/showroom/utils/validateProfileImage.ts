import {
  ERROR_MESSAGE,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
  PROFILE_IMAGE_MIN_SIZE,
} from "@/features/showroom/constants/params"

function readDimensions(file: File) {
  return new Promise<{ width: number; height: number } | null>(resolve => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    // 판독 실패는 크기 미달과 다르다 — 여기서 막지 않고 서버 검증에 맡긴다
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }
    image.src = objectUrl
  })
}

/**
 * 프로필 이미지 사전 검증 — 형식 · 용량 · 최소 크기 · 정비율.
 *
 * 서버도 검증하지만 업로드를 태우기 전에 걸러 준다. 20MB 파일을 다 올리고 나서
 * 거절당하면 사용자는 그동안 기다린 이유를 알 수 없다.
 *
 * 통과하면 null, 막히면 문구를 돌려준다(문구는 시안 `.err`와 같은 값이어야 한다).
 */
export async function validateProfileImage(file: File): Promise<string | null> {
  if (!PROFILE_IMAGE_MIME_TYPES.includes(file.type)) {
    return ERROR_MESSAGE.IMAGE_TYPE
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return ERROR_MESSAGE.IMAGE_TOO_LARGE
  }

  const size = await readDimensions(file)
  if (!size) {
    return null
  }

  // 정비율 = 정사각형. 아바타는 원형으로 잘려 나가므로 가로세로가 어긋나면 잘린다
  if (
    size.width !== size.height ||
    size.width < PROFILE_IMAGE_MIN_SIZE ||
    size.height < PROFILE_IMAGE_MIN_SIZE
  ) {
    return ERROR_MESSAGE.IMAGE_TOO_SMALL
  }

  return null
}
