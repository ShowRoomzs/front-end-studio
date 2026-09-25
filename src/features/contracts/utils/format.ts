import {
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate"
import { DEADLINE_IMMINENT_DAYS } from "@/features/contracts/constants/params"
import dayjs from "dayjs"

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

/**
 * 서명 기한 임박(D-3) — 서버 `ContractDeadlinePolicy.isImminent`와 같은 판정.
 * 목록은 서버가 `deadline.tone`으로 내리지만 상세엔 그 값이 없어 여기서 같은 규칙으로 잰다.
 */
export function isDeadlineImminent(deadlineAt: string | null): boolean {
  if (!deadlineAt) {
    return false
  }
  const deadline = parseServerDateTime(deadlineAt)
  return !dayjs().isBefore(deadline.subtract(DEADLINE_IMMINENT_DAYS, "day"))
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
