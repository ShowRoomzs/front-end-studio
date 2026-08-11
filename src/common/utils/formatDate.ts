import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

/**
 * 서버가 내려준 시각 문자열을 로컬 시각으로 파싱한다.
 *
 * 백엔드는 시간대 표기가 붙은 값(Instant, "...Z")과 안 붙은 값(LocalDateTime)을
 * 섞어 내려준다. 시간대가 없으면 서버 JVM 기준 UTC 벽시계 시각이므로,
 * 그대로 dayjs에 넘기면 브라우저 로컬(KST)로 해석돼 9시간 어긋난다.
 */
export function parseServerDateTime(date: string) {
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(date)
  return hasTimeZone ? dayjs(date) : dayjs.utc(date).local()
}
