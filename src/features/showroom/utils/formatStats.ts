import { parseServerDateTime } from "@/common/utils/formatDate"

/**
 * 값이 없다는 표시.
 *
 * 지표 여러 개가 null로 온다 — 직전 기간이 0이면 증감률을, 방문자가 0이면 전환율을
 * 낼 수 없다. 그 자리를 `0`으로 채우면 "0%였다"는 거짓말이 되므로 `—`로 비운다.
 */
export const EMPTY_VALUE = "—"

export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE
  }
  return value.toLocaleString("ko-KR")
}

/** `34%` · `3.5%` — 서버가 소수점 1자리로 주지만 정수면 소수점을 떼고 그린다 */
export function formatRatio(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE
  }
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`
}

/** `+42` — 기간 내 신규처럼 증감을 나타내는 **개수**. 0이어도 부호를 붙이지 않는다 */
export function formatDelta(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE
  }
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toLocaleString("ko-KR")}`
}

/** 증감률만 부호를 붙인다 — 늘었는지 줄었는지가 값 자체보다 먼저 읽혀야 한다 */
export function formatChangeRate(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE
  }
  const sign = value > 0 ? "+" : ""
  return `${sign}${Number.isInteger(value) ? value : value.toFixed(1)}%`
}

/** `2.4회` — 방문 팔로워가 없으면 `—` */
export function formatVisitCount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE
  }
  return `${Number.isInteger(value) ? value : value.toFixed(1)}회`
}

/** 인기 콘텐츠 게시일 — `08.10` */
export function formatPublishedAt(date: string) {
  return parseServerDateTime(date).format("MM.DD")
}

/**
 * "최근 30일" → "직전 30일 대비 증감률".
 *
 * 기간을 바꾸면 비교 대상도 함께 바뀌므로 라벨을 고정 문자열로 두면 거짓이 된다.
 * 서버가 준 `periodLabel`에서 접두사만 갈아 끼운다.
 */
export function toComparisonLabel(periodLabel: string) {
  return `직전 ${periodLabel.replace(/^최근\s*/, "")} 대비 증감률`
}
