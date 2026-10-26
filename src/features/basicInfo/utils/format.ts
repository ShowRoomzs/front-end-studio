import { parseServerDateTime } from "@/common/utils/formatDate"
import type { DocumentFile } from "@/features/basicInfo/types"

/** 이벤트 시각(UTC 벽시계) → 「2026.09.05」 */
export function formatEventDate(value: string | null | undefined) {
  return value ? parseServerDateTime(value).format("YYYY.MM.DD") : null
}

/** 이벤트 시각(UTC 벽시계) → 「2026.09.08 14:20」 */
export function formatEventDateTime(value: string | null | undefined) {
  return value ? parseServerDateTime(value).format("YYYY.MM.DD HH:mm") : null
}

/** 날짜(`LocalDate` · KST 달력 날짜) — 「2026-10-21」 → 「2026.10.21」. 시간대 변환을 하지 않는다 */
export function formatPlainDate(value: string | null | undefined) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value
}

/** 「1.2MB」 · 「740KB」 — 시안 파일 상자 표기 */
export function formatFileSize(bytes: number | null | undefined) {
  if (bytes == null) return null
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

/** 파일 상자 아이콘 글자 — 확장자 대문자(「PDF」 · 「JPG」), 모르면 「FILE」 */
export function fileBadge(name: string | null | undefined) {
  const ext = name?.split(".").pop()?.toLowerCase()
  if (!ext || ext === name?.toLowerCase()) return "FILE"
  return ext === "jpeg" ? "JPG" : ext.toUpperCase().slice(0, 4)
}

/** URL 끝의 파일 이름 — 온보딩분처럼 원본 파일명이 없을 때 아이콘 글자만 뽑는다 */
export function fileNameFromUrl(url: string | null | undefined) {
  if (!url) return null
  const last = url.split("?")[0].split("/").pop()
  return last ? decodeURIComponent(last) : null
}

/** 「통장사본_국민은행.jpg · 2026.07.02 제출」 — 모르는 값은 빼고 잇는다. 둘 다 없으면 null */
export function documentSubText(doc: DocumentFile | null | undefined) {
  if (!doc) return null
  const date = formatEventDate(doc.submittedAt)
  const parts = [doc.fileName, date ? `${date} 제출` : null].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
}

/** 파일 상자 보조 줄 — 「1.2MB · 2026.09.05 제출」 */
export function documentMetaText(doc: DocumentFile | null | undefined) {
  if (!doc) return null
  const date = formatEventDate(doc.submittedAt)
  const parts = [
    formatFileSize(doc.fileSize),
    date ? `${date} 제출` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`
}

/** 사업자등록번호 입력 정제 — 숫자만 남겨 000-00-00000 모양으로 하이픈을 넣는다 */
export function formatBusinessRegistrationNumber(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export function digitsOnly(raw: string, maxLength: number) {
  return raw.replace(/[^0-9]/g, "").slice(0, maxLength)
}
