import { APPROVAL_NO_DIGITS } from "@/features/settlement/constants/params"
import dayjs from "dayjs"

export function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`
}

/** 차감 행 — 0원은 부호 없이 */
export function formatMinusWon(value: number) {
  return value === 0 ? "0원" : `−${formatWon(value)}`
}

export function formatPlusWon(value: number) {
  return `+${formatWon(value)}`
}

/** 증감 — +40,614원 · −15,585원 · 0원 */
export function formatSignedWon(value: number) {
  if (value === 0) return "0원"
  return value > 0 ? formatPlusWon(value) : formatMinusWon(-value)
}

/** 08.31 */
export function formatMonthDay(date: string | null) {
  return date ? dayjs(date).format("MM.DD") : "—"
}

/** 09.24 23:59 — 정산 확인 기간 마감 */
export function formatMonthDayTime(date: string | null) {
  return date ? dayjs(date).format("MM.DD HH:mm") : "—"
}

/** 2026.08.31 */
export function formatFullDate(date: string | null) {
  return date ? dayjs(date).format("YYYY.MM.DD") : "—"
}

/** 2026.09.02 10:40 */
export function formatFullDateTime(date: string | null) {
  return date ? dayjs(date).format("YYYY.MM.DD HH:mm") : "—"
}

/** 목록 08.20 ~ 08.26 · 상세 2026.08.20 ~ 08.26 */
export function formatPeriod(start: string, end: string, withYear = false) {
  const head = withYear ? formatFullDate(start) : formatMonthDay(start)
  const sameYear = dayjs(start).year() === dayjs(end).year()
  const tail = withYear && !sameYear ? formatFullDate(end) : formatMonthDay(end)
  return `${head} ~ ${tail}`
}

/** 15 → "15%" · 3.3 → "3.3%" — 정수면 소수점을 붙이지 않는다 */
export function formatPercent(rate: number) {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(1)}%`
}

/** 입력칸 표시 — 숫자만 남기고 천 단위 쉼표 */
export function formatAmountInput(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "")
  return digits ? Number(digits).toLocaleString("ko-KR") : ""
}

export function parseAmountInput(text: string): number | null {
  const digits = text.replace(/\D/g, "")
  return digits ? Number(digits) : null
}

/**
 * 원천징수(비사업자) — 원 미만 절사. 시안 D3 96,750 × 3.3% = 3,192.75 → 3,192.
 * 원 단위 처리 규칙은 미결(§46 B-2)이라 서버 산식이 정해지면 그 값을 따른다.
 */
export function calcWithholding(reward: number, rate: number) {
  return Math.floor((reward * rate) / 100)
}

/** 사업자 부가세 — 원 미만 절사 */
export function calcVat(reward: number, rate: number) {
  return Math.floor((reward * rate) / 100)
}

/** 승인번호 형식 — 숫자와 하이픈만 · 숫자 24자리 */
export function isValidApprovalNo(value: string) {
  const trimmed = value.trim()
  if (!/^[0-9-]+$/.test(trimmed)) return false
  return trimmed.replace(/-/g, "").length === APPROVAL_NO_DIGITS
}
