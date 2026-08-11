import FileChip from "@/features/connections/components/Attachment/FileChip"
import ImageGrid from "@/features/connections/components/Attachment/ImageGrid"
import { DownloadIcon } from "@/features/connections/components/icons"
import type { AttachmentSummary } from "@/features/connections/services/threadService"
import { downloadFiles } from "@/features/connections/utils/download"
import { cn } from "@/lib/utils"

interface AttachmentRendererProps {
  attachments: Array<AttachmentSummary>
  isMine: boolean
  onClickImage: (images: Array<AttachmentSummary>, index: number) => void
  onPlayVideo: (attachment: AttachmentSummary) => void
  /** 첨부만 전송한 메시지는 **마지막 첨부**에 전송 시각을 붙인다(§13-11) */
  timestamp?: string
}

/**
 * 메시지 첨부 영역 — 종류별로 표시 방식이 갈린다(§13-8).
 * 이미지는 그리드, 영상·문서는 같은 file-chip이다.
 */
export default function AttachmentRenderer(props: AttachmentRendererProps) {
  const { attachments, isMine, onClickImage, onPlayVideo, timestamp } = props

  if (attachments.length === 0) {
    return null
  }

  const images = attachments.filter(
    attachment => attachment.attachmentType === "IMAGE"
  )
  const files = attachments.filter(
    attachment => attachment.attachmentType !== "IMAGE"
  )

  /*
    전체 다운로드는 첨부가 2개 이상일 때만 뜬다. 개수는 **화면에 보이는 장수가
    아니라 실제 첨부 개수** 기준이라 "+N"으로 가려진 사진도 포함한다(§13-9).
  */
  const showBulkDownload = attachments.length >= 2

  const handleBulkDownload = () =>
    downloadFiles(
      attachments
        .filter(attachment => attachment.fileUrl)
        .map(attachment => ({
          url: attachment.fileUrl!,
          fileName: attachment.originalName,
        }))
    )

  return (
    <>
      {images.length > 0 && (
        <ImageGrid
          images={images}
          isMine={isMine}
          onClickImage={index => onClickImage(images, index)}
          timestamp={files.length === 0 ? timestamp : undefined}
        />
      )}

      {files.map((file, index) => (
        <FileChip
          key={file.attachmentId}
          attachment={file}
          isMine={isMine}
          onPlayVideo={onPlayVideo}
          timestamp={index === files.length - 1 ? timestamp : undefined}
        />
      ))}

      {showBulkDownload && (
        <button
          type="button"
          onClick={handleBulkDownload}
          className={cn(
            "mt-1.5 inline-flex h-7 w-fit items-center gap-1.5 rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-600 hover:bg-sz-n-100 hover:text-sz-n-900",
            isMine ? "ml-auto" : "mr-auto"
          )}
        >
          <DownloadIcon className="h-[13px] w-[13px]" />
          <span>전체 다운로드 ({attachments.length})</span>
        </button>
      )}
    </>
  )
}
