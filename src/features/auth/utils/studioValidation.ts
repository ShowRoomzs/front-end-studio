/**
 * 신청 Step2 검증·정규화.
 *
 * 정규식은 백엔드 CreatorApplicationRequest의 @Pattern과 **동일하게** 맞춘다.
 * 프론트만 느슨하면 제출 시점에 서버가 거부해 사용자가 원인을 알 수 없게 된다.
 */

/** 백엔드 @Pattern ^[a-z0-9._]+$ 와 동일. 최대 30자(@Size). */
export const ACCOUNT_ID_MAX_LENGTH = 30

/**
 * §7-2: 계정 아이디는 브라우저 기본 검증이 아니라 **입력 즉시** 걸러야 한다.
 * 대문자는 막는 게 아니라 소문자로 변환한다(인스타그램 아이디 규칙과 동일).
 */
export const normalizeAccountId = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, ACCOUNT_ID_MAX_LENGTH)

export const validateAccountId = (value: string) => {
  if (!value) return true
  if (!/^[a-z0-9._]+$/.test(value))
    return "영문 소문자·숫자·마침표(.)·밑줄(_)만 사용할 수 있습니다."
  return true
}

export const validateChannelUrl = (value: string) => {
  if (!value) return true
  if (!/^https:\/\/.+/.test(value))
    return "https://로 시작하는 올바른 URL을 입력해 주세요."
  return true
}

export const validateBusinessEmail = (value: string) => {
  if (!value) return true
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "올바른 이메일 형식으로 입력해 주세요."
  return true
}

/**
 * 인스타그램 채널 주소에서 핸들을 뽑는다.
 * `https://www.instagram.com/showroomz/?hl=ko` → `showroomz`
 * 추출에 실패하면 빈 문자열 — 호출부가 기존 값을 덮어쓰지 않도록 판단한다.
 */
export function extractInstagramHandle(url: string): string {
  const match = url.match(/^https?:\/\/(?:www\.)?instagram\.com\/([^/?#]+)/i)
  if (!match) return ""
  return normalizeAccountId(match[1])
}

/** 만 나이 계산 — 생일이 지났는지까지 반영한다. */
export function getKoreanAge(birthDate: Date, today = new Date()): number {
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1
  }
  return age
}
