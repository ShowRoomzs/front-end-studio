import { DownloadIcon } from "@/features/connections/components/icons"
import type { AttachmentSummary } from "@/features/connections/services/threadService"
import { getAttachmentIcon } from "@/features/connections/utils/attachmentIcon"
import { downloadFile } from "@/features/connections/utils/download"
import {
  formatBytes,
  formatDuration,
} from "@/features/connections/utils/format"
import { cn } from "@/lib/utils"

interface FileChipProps {
  attachment: AttachmentSummary
  isMine: boolean
  /** 영상 본문 클릭 — 재생. 문서는 클릭이 곧 다운로드라 이 콜백을 안 쓴다 */
  onPlayVideo?: (attachment: AttachmentSummary) => void
  timestamp?: string
  className?: string
}

/**
 * 문서·영상 공용 file-chip (시안 `.file-chip`).
 *
 * 클릭 동작이 종류마다 다르다(§13-8) — 영상은 **재생**, 문서는 **매번 새로 다운로드**다.
 * 브라우저는 "이미 받은 파일 열기"를 할 수 없어서 문서엔 미리보기 예외를 두지 않는다.
 * 어느 쪽이든 우측 다운로드 아이콘은 항상 다운로드다.
 */
export default function FileChip(props: FileChipProps) {
  const { attachment, isMine, onPlayVideo, timestamp, className } = props
  const icon = getAttachmentIcon(
    attachment.extension || attachment.originalName
  )
  const isVideo = attachment.attachmentType === "VIDEO"
  const isRejected = attachment.status === "REJECTED"

  const handleDownload = () => {
    if (attachment.fileUrl) {
      downloadFile(attachment.fileUrl, attachment.originalName)
    }
  }

  return (
    <div className={cn("mt-1.5 w-fit", isMine && "ml-auto", className)}>
      <div className="flex w-[230px] items-center gap-2.5 rounded-[6px] border border-sz-n-200 bg-white p-2.5">
        <button
          type="button"
          disabled={isRejected}
          onClick={() =>
            isVideo && onPlayVideo ? onPlayVideo(attachment) : handleDownload()
          }
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:cursor-not-allowed"
        >
          <span
            className={cn(
              "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[6px] text-[9px] font-bold text-white",
              isRejected ? "bg-sz-danger-text" : icon.colorClass
            )}
          >
            {icon.label}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-sz-n-900">
              {attachment.originalName}
            </span>
            <span
              className={cn(
                "mt-px block text-[11px]",
                isRejected ? "text-sz-danger-text" : "text-sz-n-500"
              )}
            >
              {isRejected
                ? "업로드 검증에 실패한 파일입니다"
                : [
                    attachment.durationSeconds !== null &&
                      formatDuration(attachment.durationSeconds),
                    formatBytes(attachment.sizeBytes),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </span>
          </span>
        </button>
        {!isRejected && (
          <button
            type="button"
            onClick={handleDownload}
            aria-label={`${attachment.originalName} 다운로드`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-700"
          >
            <DownloadIcon />
          </button>
        )}
      </div>
      {timestamp && (
        <div className="mt-1 text-[11px] text-sz-n-400">{timestamp}</div>
      )}
    </div>
  )
}
