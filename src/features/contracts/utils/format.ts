import {
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate"

export function formatKRW(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("ko-KR")}원`
}

/** 리워드율 — "15%" / "12.5%". 서버가 소수 첫째 자리까지 내리므로 `.0`은 지운다 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—"
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${text.replace(/\.0$/, "")}%`
}

/** "2026.08.24 10:00 ~ 2026.08.31 23:55" — 어느 한쪽이 없으면 null */
export function periodText(
  startAt: string | null,
  endAt: string | null
): string | null {
  if (!startAt || !endAt) {
    return null
  }
  return `${formatDateTimeShort(startAt)} ~ ${formatDateTimeShort(endAt)}`
}

/** 스텝퍼 `.who`용 — "08.13 16:40" */
export function formatMonthDayTime(value: string | null): string {
  if (!value) {
    return "—"
  }
  return parseServerDateTime(value).format("MM.DD HH:mm")
}

export function formatMonthDay(value: string | null): string {
  if (!value) {
    return "—"
  }
  return parseServerDateTime(value).format("MM.DD")
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) {
    return "—"
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}
