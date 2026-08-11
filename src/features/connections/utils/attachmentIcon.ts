import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
} from "@/features/connections/constants/params"
import type { AttachmentType } from "@/features/connections/services/threadService"

export interface AttachmentIcon {
  /** 아이콘 안에 넣을 짧은 라벨 */
  label: string
  /** Tailwind 배경색 클래스 */
  colorClass: string
}

/**
 * 확장자 → 아이콘 매핑 테이블(§13-8 지정 방식).
 *
 * 화면마다 아이콘을 하드코딩하지 않는다 — 테이블에 없는 확장자는
 * 회색 기본 아이콘 + 확장자 텍스트로 떨어져서, 새 확장자가 들어와도 화면이 안 깨진다.
 * 색상은 시안 `.file-ic.*` 값 그대로다.
 */
const EXTENSION_ICONS: Record<string, AttachmentIcon> = {
  pdf: { label: "PDF", colorClass: "bg-[#D64545]" },
  doc: { label: "DOC", colorClass: "bg-[#2E5AAC]" },
  docx: { label: "DOC", colorClass: "bg-[#2E5AAC]" },
  hwp: { label: "HWP", colorClass: "bg-sz-accent-500" },
  hwpx: { label: "HWP", colorClass: "bg-sz-accent-500" },
  xls: { label: "XLS", colorClass: "bg-sz-success-text" },
  xlsx: { label: "XLS", colorClass: "bg-sz-success-text" },
  csv: { label: "CSV", colorClass: "bg-sz-success-text" },
  ppt: { label: "PPT", colorClass: "bg-[#D96B2B]" },
  pptx: { label: "PPT", colorClass: "bg-[#D96B2B]" },
  zip: { label: "ZIP", colorClass: "bg-sz-n-500" },
  rar: { label: "ZIP", colorClass: "bg-sz-n-500" },
  "7z": { label: "ZIP", colorClass: "bg-sz-n-500" },
  ...Object.fromEntries(
    ALLOWED_VIDEO_EXTENSIONS.map(extension => [
      extension,
      { label: extension.toUpperCase(), colorClass: "bg-[#6B4FD1]" },
    ])
  ),
}

const DEFAULT_COLOR_CLASS = "bg-sz-n-400"

export function getExtension(fileName: string) {
  const parts = fileName.split(".")
  return parts.length > 1 ? (parts.pop() ?? "").toLowerCase() : ""
}

export function getAttachmentIcon(fileNameOrExtension: string): AttachmentIcon {
  const extension = fileNameOrExtension.includes(".")
    ? getExtension(fileNameOrExtension)
    : fileNameOrExtension.toLowerCase()

  return (
    EXTENSION_ICONS[extension] ?? {
      label: extension ? extension.toUpperCase().slice(0, 4) : "FILE",
      colorClass: DEFAULT_COLOR_CLASS,
    }
  )
}

/**
 * 전송 전 로컬 파일의 첨부 종류 판정.
 * 서버는 같은 분류를 응답의 `attachmentType`으로 내려주므로, 이 함수는
 * **아직 서버에 안 올린 파일**(첨부 미리보기 단계)에만 쓴다.
 */
export function getLocalAttachmentType(fileName: string): AttachmentType {
  const extension = getExtension(fileName)
  if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return "IMAGE"
  }
  if (ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
    return "VIDEO"
  }
  return "DOCUMENT"
}
