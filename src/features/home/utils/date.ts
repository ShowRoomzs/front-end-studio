import dayjs, { type Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import { parseServerDateTime } from "@/common/utils/formatDate"

dayjs.extend(utc)

/*
  홈 날짜 규칙(BE 58 2단계 · 10-29)
  - 시각(LocalDateTime)은 전부 UTC 순간 + "Z"다 — 공구 시작/종료 · 서명 기한 · 이의 신청 기한 · 자동 해제도 같다.
    날짜 칸 · 「MM.DD」는 그 순간의 한국 날짜로, 남은 시간은 순간끼리 견준다.
  - 날짜(LocalDate "YYYY-MM-DD")는 한국 날짜 그대로다.
  - 「오늘」은 KST 달력 날짜다(브라우저 시간대와 무관).
*/

const KST_OFFSET_MINUTES = 9 * 60
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

/** 서버 시각(UTC 순간)을 한국 벽시계로 — 브라우저 시간대와 무관하게 `format`이 한국 시각을 낸다 */
function toKst(value: string): Dayjs {
  return parseServerDateTime(value).utc().add(KST_OFFSET_MINUTES, "minute")
}

/** 지금의 KST 달력 날짜 "YYYY-MM-DD" */
export function kstDateKey(nowMs: number): string {
  return dayjs.utc(nowMs).add(KST_OFFSET_MINUTES, "minute").format("YYYY-MM-DD")
}

/** 한국 날짜 "YYYY-MM-DD" — LocalDate는 그대로, 시각은 그 순간의 한국 날짜 */
export function dateKey(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : toKst(value).format("YYYY-MM-DD")
}

/** "2026.08.20 (목)" — 할 일 제목 줄 */
export function formatTodayLine(todayKey: string): string {
  const day = dayjs(todayKey)
  return `${day.format("YYYY.MM.DD")} (${WEEKDAYS[day.day()]})`
}

/** "08.21" — 한국 날짜 */
export function formatMonthDay(value: string): string {
  return dayjs(dateKey(value)).format("MM.DD")
}

/** "08.21 23:59" — 한국 시각 */
export function formatKstMonthDayTime(value: string): string {
  return toKst(value).format("MM.DD HH:mm")
}

/** 오늘(KST)부터 그 날짜까지 남은 날 — 내일 = 1 */
export function daysUntil(value: string, todayKey: string): number {
  return dayjs(dateKey(value)).diff(dayjs(todayKey), "day")
}

/** 「D-1」 · 「D-day」 · 지난 기한 「D+2」 */
export function formatDDay(days: number): string {
  if (days === 0) {
    return "D-day"
  }
  return days > 0 ? `D-${days}` : `D+${-days}`
}

/** 종료까지 — 「1일 9시간」 · 「9시간」 · 「25분」 */
export function formatRemaining(endAt: string, nowMs: number): string {
  const minutes = Math.max(
    0,
    parseServerDateTime(endAt).diff(dayjs(nowMs), "minute")
  )
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  if (days > 0) {
    return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`
  }
  if (hours > 0) {
    return `${hours}시간`
  }
  return `${minutes % 60}분`
}

/** 알림 시각 — 「방금 전」 · 「10분 전」 · 「2시간 전」 · 「어제」 · 「3일 전」(UTC 순간) */
export function formatRelative(createdAt: string, nowMs: number): string {
  const at = parseServerDateTime(createdAt)
  const now = dayjs(nowMs)
  const minutes = now.diff(at, "minute")
  if (minutes < 1) {
    return "방금 전"
  }
  if (minutes < 60) {
    return `${minutes}분 전`
  }
  const dayDiff = now.startOf("day").diff(at.startOf("day"), "day")
  if (dayDiff === 0) {
    return `${now.diff(at, "hour")}시간 전`
  }
  if (dayDiff === 1) {
    return "어제"
  }
  return `${dayDiff}일 전`
}

/** "14:32" — 실시간 띠 집계 시각(UTC 순간) */
export function formatAsOf(asOf: string): string {
  return parseServerDateTime(asOf).format("HH:mm")
}

/** "2026.10.08 14:20" — 정지 시각(UTC 순간) */
export function formatEventDateTime(value: string): string {
  return parseServerDateTime(value).format("YYYY.MM.DD HH:mm")
}
