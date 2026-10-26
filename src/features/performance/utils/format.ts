import { parseServerDateTime } from "@/common/utils/formatDate"
import dayjs from "dayjs"
import type { GenderRatio } from "@/features/performance/types"

/*
  성과 화면 표기 — 값이 없으면(null) 「—」이고 0은 측정된 0이라 그대로 적는다(§47-2 빈 KPI).
  비율은 서버가 % 숫자(소수 1자리)로 준다 — 반올림을 다시 하지 않고 소수 1자리로만 맞춘다.
*/

export const DASH = "—"

export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR")
}

export function formatWon(value: number) {
  return `${formatNumber(value)}원`
}

export function formatWonOrDash(value: number | null | undefined) {
  return value === null || value === undefined ? DASH : formatWon(value)
}

/** +14,472원 · −15,585원 · 0원 */
export function formatSignedWon(value: number) {
  if (value === 0) return "0원"
  return value > 0 ? `+${formatWon(value)}` : `−${formatWon(Math.abs(value))}`
}

/** +312 · −20 · 0 */
export function formatSigned(value: number) {
  if (value === 0) return "0"
  return value > 0
    ? `+${formatNumber(value)}`
    : `−${formatNumber(Math.abs(value))}`
}

/** 5.8 → "5.8%" · 93 → "93.0%" · 100 → "100%"(시안 퍼널 막대 기준 행) */
export function formatRate(value: number | null | undefined) {
  if (value === null || value === undefined) return DASH
  if (value === 100) return "100%"
  return `${value.toFixed(1)}%`
}

/** 리워드율 — 서버 BigDecimal(12.0) → "12%" · 7.5 → "7.5%" */
export function formatRewardRate(value: number) {
  return `${Number(Number(value).toFixed(2))}%`
}

/** 화면이 직접 나누는 비율(퍼널 구간 1 · 신규 소비자 비중) — 분모 0이면 null */
export function ratio(numerator: number, denominator: number) {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

/** 막대 너비(%) — 0 ~ 100으로 자른다 */
export function barWidth(numerator: number, denominator: number) {
  if (denominator <= 0) return 0
  return Math.max(0, Math.min(100, (numerator / denominator) * 100))
}

// ------------------------------------------------------------------ 날짜

/** KST 벽시계(공구 시작 · 종료 · 합의 기한) — 시간대를 바꾸지 않는다 */
const kst = (value: string) => dayjs(value.replace(/Z$/, ""))

/** 목록 08.24 ~ 08.31 · 상세 2026.08.24 ~ 08.31(해가 바뀌면 끝에도 연도) */
export function formatPeriod(start: string, end: string, withYear = false) {
  const s = kst(start)
  const e = kst(end)
  if (!withYear) return `${s.format("MM.DD")} ~ ${e.format("MM.DD")}`
  const tail =
    s.year() === e.year() ? e.format("MM.DD") : e.format("YYYY.MM.DD")
  return `${s.format("YYYY.MM.DD")} ~ ${tail}`
}

/** 합의 기한 09.16 — KST 벽시계 */
export function formatKstMonthDay(value: string | null) {
  return value ? kst(value).format("MM.DD") : DASH
}

/** 제안 · 합의 시각 09.07 — 서버 now()(UTC 벽시계) */
export function formatEventMonthDay(value: string | null) {
  return value ? parseServerDateTime(value).format("MM.DD") : DASH
}

/** 요약 기간(LocalDate) 2026.05.01 */
export function formatLocalDate(value: string) {
  return dayjs(value).format("YYYY.MM.DD")
}

/** 하이라이트 · 퍼널 주석의 「두 상품 합계」 — 시안은 2개 상품만 그렸다 */
export function productCountWord(count: number) {
  const words: Record<number, string> = {
    1: "상품",
    2: "두 상품",
    3: "세 상품",
    4: "네 상품",
  }
  return words[count] ?? `상품 ${count}개`
}

/** 성비 라벨 — 큰 쪽을 앞에(시안 「여 83 : 남 17」). 남성이 크면 라벨도 뒤집는다 */
export function genderLabel(ratio: GenderRatio | null) {
  return ratio?.majorFirst === "MALE" ? "성비 (남 : 여)" : "성비 (여 : 남)"
}
