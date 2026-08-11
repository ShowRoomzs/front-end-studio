import { CloseIcon } from "@/features/connections/components/icons"
import {
  getAttachmentIcon,
  getLocalAttachmentType,
} from "@/features/connections/utils/attachmentIcon"
import { formatBytes } from "@/features/connections/utils/format"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export interface StagedFile {
  localId: string
  file: File
}

interface AttachPreviewProps {
  files: Array<StagedFile>
  onRemove: (localId: string) => void
}

/** 이미지 썸네일은 로컬 objectURL로 그린다 — 아직 업로드 전이라 서버 URL이 없다 */
function useObjectUrls(files: Array<StagedFile>) {
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const created: Record<string, string> = {}
    files.forEach(({ localId, file }) => {
      if (getLocalAttachmentType(file.name) === "IMAGE") {
        created[localId] = URL.createObjectURL(file)
      }
    })
    setUrls(created)

    return () => {
      Object.values(created).forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  return urls
}

/**
 * 전송 전 첨부 미리보기 (시안 `.attach-preview`).
 * 개수가 많으면 줄바꿈 대신 가로 스크롤로 한 줄을 유지한다(S11).
 */
export default function AttachPreview(props: AttachPreviewProps) {
  const { files, onRemove } = props
  const objectUrls = useObjectUrls(files)

  if (files.length === 0) {
    return null
  }

  const isScrollable = files.length > 6

  return (
    <div
      className={cn(
        "flex gap-2 pb-2.5",
        isScrollable ? "flex-nowrap overflow-x-auto pt-2 pb-3" : "flex-wrap"
      )}
    >
      {files.map(({ localId, file }) => {
        const isImage = getLocalAttachmentType(file.name) === "IMAGE"
        const icon = getAttachmentIcon(file.name)

        return isImage ? (
          <div
            key={localId}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[6px] bg-sz-n-200"
          >
            <img
              src={objectUrls[localId]}
              alt={file.name}
              className="h-full w-full object-cover"
            />
            <RemoveButton onClick={() => onRemove(localId)} />
          </div>
        ) : (
          <div
            key={localId}
            className="relative flex h-16 shrink-0 items-center gap-2 rounded-[6px] border border-sz-n-200 bg-white py-0 pr-[34px] pl-1.5"
          >
            <span
              className={cn(
                "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] text-[8px] font-bold text-white",
                icon.colorClass
              )}
            >
              {icon.label}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[90px] truncate text-[11px] font-semibold text-sz-n-900">
                {file.name}
              </span>
              <span className="block text-[9px] text-sz-n-500">
                {formatBytes(file.size)}
              </span>
            </span>
            <RemoveButton
              onClick={() => onRemove(localId)}
              className="top-1.5 right-1.5"
            />
          </div>
        )
      })}
    </div>
  )
}

function RemoveButton(props: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label="첨부 제거"
      className={cn(
        "absolute -top-1.5 -right-1.5 z-[2] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-sz-n-900 text-white",
        props.className
      )}
    >
      <CloseIcon />
    </button>
  )
}
