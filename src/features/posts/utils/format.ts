import { parseServerDateTime } from "@/common/utils/formatDate"
import dayjs from "dayjs"

export function formatCount(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("ko-KR")
}

/** 비율 지표 — **노출이 0이면 서버가 null을 준다.** 0%로 표시하지 않는다(§24-7) */
export function formatRate(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value.toFixed(1)}%`
}

export function formatDate(value: string) {
  return parseServerDateTime(value).format("YYYY.MM.DD")
}

export function formatDateTime(value: string) {
  return parseServerDateTime(value).format("YYYY.MM.DD HH:mm")
}

/** 목록 카드의 날짜 — 같은 해면 월·일만 써서 카드 폭을 아낀다 */
export function formatCardDate(value: string) {
  const date = parseServerDateTime(value)
  return date.year() === dayjs().year()
    ? date.format("MM.DD")
    : date.format("YYYY.MM.DD")
}

/** 미리보기 카드의 시각 — 소비자 쇼룸이 쓰는 표기를 그대로 재현한다 */
export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "방금"
  }

  const date = parseServerDateTime(value)
  const minutes = dayjs().diff(date, "minute")
  if (minutes < 1) {
    return "방금"
  }
  if (minutes < 60) {
    return `${minutes}분 전`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}시간 전`
  }

  const days = Math.floor(hours / 24)
  return days < 7 ? `${days}일 전` : date.format("YYYY.MM.DD")
}

/**
 * 이의 신청 기한까지 남은 일수 — 배너의 `D-N`.
 *
 * 시각이 아니라 **날짜 경계**로 센다. 기한이 23:59라 시간 차로 세면 같은 날인데도
 * D-0이 아니라 D-1로 보이는 구간이 생긴다.
 */
export function formatRemainingDays(deadline: string) {
  const days = parseServerDateTime(deadline)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day")
  return days <= 0 ? "오늘 마감" : `D-${days}`
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}
