import { parseServerDateTime } from "@/common/utils/formatDate"
import dayjs from "dayjs"

/**
 * 서버 날짜 — `LocalDate`("2026-10-12")는 그대로, `LocalDateTime`("…Z")은 로컬 시각으로 읽는다.
 * 날짜만 있는 값을 UTC로 읽으면 자정 경계에서 하루가 밀릴 수 있어 둘을 가른다.
 */
function toDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? dayjs(value)
    : parseServerDateTime(value)
}

export function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`
}

/** KPI · 금액 칸 — null(건수 0)은 0원이 아니라 「—」 */
export function formatWonOrDash(value: number | null) {
  return value === null ? "—" : formatWon(value)
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
  return date ? toDay(date).format("MM.DD") : "—"
}

/** 09.24 23:59 — 정산 확인 기간 마감 */
export function formatMonthDayTime(date: string | null) {
  return date ? toDay(date).format("MM.DD HH:mm") : "—"
}

/** 2026.08.31 */
export function formatFullDate(date: string | null) {
  return date ? toDay(date).format("YYYY.MM.DD") : "—"
}

/** 2026.09.02 10:40 */
export function formatFullDateTime(date: string | null) {
  return date ? toDay(date).format("YYYY.MM.DD HH:mm") : "—"
}

/** 목록 08.20 ~ 08.26 · 상세 2026.08.20 ~ 08.26 */
export function formatPeriod(start: string, end: string, withYear = false) {
  const head = withYear ? formatFullDate(start) : formatMonthDay(start)
  const sameYear = toDay(start).year() === toDay(end).year()
  const tail = withYear && !sameYear ? formatFullDate(end) : formatMonthDay(end)
  return `${head} ~ ${tail}`
}

/** 퍼센트 숫자 — 15 → "15%" · 3.3 → "3.3%" · 소수 둘째 자리까지 */
export function formatPercent(rate: number) {
  return `${Number(rate.toFixed(2))}%`
}

/** 서버 소수 율(0.033) → "3.3%" — 원천징수 · 부가세 율은 소수로 온다 */
export function formatRatio(ratio: number) {
  return formatPercent(Math.round(ratio * 10000) / 100)
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
 * 국세청 승인번호 — 서버 형식은 `^\d{8}-\d{8}-\d{8}$`다. 하이픈 없이 24자리를 붙여 넣어도 받아서
 * 서버 형식으로 바꿔 보낸다. 형식이 아니면 null.
 */
export function normalizeApprovalNumber(value: string): string | null {
  const compact = value.replace(/\s/g, "")
  if (/^\d{8}-\d{8}-\d{8}$/.test(compact)) return compact
  if (/^\d{24}$/.test(compact)) {
    return `${compact.slice(0, 8)}-${compact.slice(8, 16)}-${compact.slice(16)}`
  }
  return null
}
