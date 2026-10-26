import dayjs, { type Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import { parseServerDateTime } from "@/common/utils/formatDate"

dayjs.extend(utc)

/*
  홈 날짜 규칙(공통 규칙 5절)
  - KST 벽시계(공구 시작/종료 · 서명 기한 · 오픈일 · 이의 신청 기한) — 시간대 변환 없이 문자열 그대로 읽는다.
    표시는 `dayjs(value)`(벽시계 그대로), 남은 시간처럼 「지금」과 견줄 때만 `kstInstant`로 실제 시점을 만든다.
  - UTC 벽시계(now() 이벤트 — 실시간 띠 asOf · 알림 createdAt · 정지 시각) — `parseServerDateTime`.
  - 「오늘」은 KST 달력 날짜다(브라우저 시간대와 무관).
*/

const KST_OFFSET_MINUTES = 9 * 60
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

/** KST 벽시계 문자열의 실제 시점 */
export function kstInstant(value: string): Dayjs {
  return parseServerDateTime(value.slice(0, 19)).subtract(
    KST_OFFSET_MINUTES,
    "minute"
  )
}

/** 지금의 KST 달력 날짜 "YYYY-MM-DD" */
export function kstDateKey(nowMs: number): string {
  return dayjs.utc(nowMs).add(KST_OFFSET_MINUTES, "minute").format("YYYY-MM-DD")
}

/** 날짜 문자열(LocalDate · KST 벽시계)의 앞 10자리 "YYYY-MM-DD" */
export function dateKey(value: string): string {
  return value.slice(0, 10)
}

/** "2026.08.20 (목)" — 할 일 제목 줄 */
export function formatTodayLine(todayKey: string): string {
  const day = dayjs(todayKey)
  return `${day.format("YYYY.MM.DD")} (${WEEKDAYS[day.day()]})`
}

/** "08.21" — KST 벽시계 · LocalDate */
export function formatMonthDay(value: string): string {
  return dayjs(dateKey(value)).format("MM.DD")
}

/** "08.21 23:59" — KST 벽시계 */
export function formatKstMonthDayTime(value: string): string {
  return dayjs(value.slice(0, 19)).format("MM.DD HH:mm")
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
  const minutes = Math.max(0, kstInstant(endAt).diff(dayjs(nowMs), "minute"))
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

/** 알림 시각 — 「방금 전」 · 「10분 전」 · 「2시간 전」 · 「어제」 · 「3일 전」(UTC 벽시계) */
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

/** "14:32" — 실시간 띠 집계 시각(UTC 벽시계) */
export function formatAsOf(asOf: string): string {
  return parseServerDateTime(asOf).format("HH:mm")
}

/** "2026.10.08 14:20" — 정지 시각(UTC 벽시계) */
export function formatEventDateTime(value: string): string {
  return parseServerDateTime(value).format("YYYY.MM.DD HH:mm")
}
