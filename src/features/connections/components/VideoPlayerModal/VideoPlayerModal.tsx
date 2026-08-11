import type { AttachmentSummary } from "@/features/connections/services/threadService"
import { useEffect } from "react"

interface VideoPlayerModalProps {
  attachment: AttachmentSummary | null
  onClose: () => void
}

/**
 * 영상 재생 오버레이.
 *
 * 재생·탐색·볼륨·전체화면은 브라우저 기본 컨트롤에 맡긴다 — 다운로드 진행 UI를
 * 직접 만들지 않기로 한 것과 같은 이유다(§13-9). 스토리지가 HTTP Range Request를
 * 지원하면 전체 파일을 받지 않고 필요한 만큼만 스트리밍한다.
 */
export default function VideoPlayerModal(props: VideoPlayerModalProps) {
  const { attachment, onClose } = props

  useEffect(() => {
    if (!attachment) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [attachment, onClose])

  if (!attachment?.fileUrl) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-6 right-6 z-20 text-2xl text-white hover:text-sz-n-300"
      >
        ✕
      </button>
      <div className="absolute top-6 left-6 z-20 max-w-[60%] truncate text-sm text-white">
        {attachment.originalName}
      </div>
      <video
        src={attachment.fileUrl}
        controls
        autoPlay
        className="max-h-[80vh] max-w-[80vw] rounded-[6px] bg-black"
      />
    </div>
  )
}
