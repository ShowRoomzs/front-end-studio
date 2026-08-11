import type { OutgoingAttachment } from "@/features/connections/types"
import { getAttachmentIcon } from "@/features/connections/utils/attachmentIcon"
import { cn } from "@/lib/utils"

interface UploadingChipProps {
  attachment: OutgoingAttachment
  isMine: boolean
}

/**
 * 업로드 진행 중인 첨부 (시안 `.file-uploading`, S7).
 * 서버 응답에는 없는 로컬 전용 상태다 — 완료되면 일반 file-chip으로 바뀐다.
 */
export default function UploadingChip(props: UploadingChipProps) {
  const { attachment, isMine } = props
  const icon = getAttachmentIcon(attachment.file.name)

  return (
    <div
      className={cn(
        "mt-1.5 flex w-[230px] items-center gap-2.5 rounded-[6px] border border-sz-n-200 bg-white p-2.5",
        isMine && "ml-auto"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[8px] font-bold text-white",
          icon.colorClass
        )}
      >
        {icon.label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <span className="truncate text-[12px] font-semibold text-sz-n-900">
            {attachment.file.name}
          </span>
          <span className="shrink-0 text-[11px] font-semibold text-sz-accent-600">
            {attachment.progress}%
          </span>
        </div>
        <div className="mt-[7px] h-1 overflow-hidden rounded-sm bg-sz-n-200">
          <div
            className="h-full rounded-sm bg-sz-accent-500 transition-[width]"
            style={{ width: `${attachment.progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
