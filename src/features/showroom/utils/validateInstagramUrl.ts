import { ERROR_MESSAGE } from "@/features/showroom/constants/params"

/**
 * 인스타그램 URL 형식 검증 — 선택 필드라 빈 값은 통과다.
 *
 * `https://`로 시작할 것을 먼저 본다. `instagram.com/...`처럼 스킴 없이 적으면
 * 소비자 화면에서 상대경로로 해석돼 링크가 죽는다(시안 S3의 실제 오류 예시).
 */
export function validateInstagramUrl(value: string): string | null {
  const url = value.trim()
  if (!url) {
    return null
  }

  if (!url.startsWith("https://")) {
    return ERROR_MESSAGE.INSTAGRAM_URL_FORMAT
  }

  try {
    // 공백이 섞인 주소(`beauty soyeon`)를 URL 생성자가 걸러 준다
    const parsed = new URL(url)
    if (!parsed.hostname || /\s/.test(url)) {
      return ERROR_MESSAGE.INSTAGRAM_URL_FORMAT
    }
  } catch {
    return ERROR_MESSAGE.INSTAGRAM_URL_FORMAT
  }

  return null
}
