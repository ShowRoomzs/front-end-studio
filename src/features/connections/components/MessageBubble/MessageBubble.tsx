import AttachmentRenderer from "@/features/connections/components/Attachment/AttachmentRenderer"
import type { AttachmentSummary } from "@/features/connections/services/threadService"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MessageBubbleProps {
  isMine: boolean
  /** 상대 메시지에만 붙는 이름표 */
  senderName?: string
  content: string | null
  attachments?: Array<AttachmentSummary>
  /** "14:02" 또는 "전송 중…" */
  timestamp: string
  /** 전송 실패 — 타임스탬프 자리에 빨간 느낌표가 대신 들어간다(§13-10) */
  isFailed?: boolean
  onRetry?: () => void
  onCancel?: () => void
  onClickImage?: (images: Array<AttachmentSummary>, index: number) => void
  onPlayVideo?: (attachment: AttachmentSummary) => void
  /** 업로드 진행 중인 첨부 등 로컬 전용 렌더 */
  children?: ReactNode
}

/**
 * 말풍선 하나 (시안 `.msg`).
 *
 * 텍스트 없이 첨부만 보낸 경우 말풍선 자체가 없어 시각을 붙일 자리가 없다 —
 * 이때는 **마지막 첨부 항목**에 전송 시각을 표시한다(§13-11).
 */
export default function MessageBubble(props: MessageBubbleProps) {
  const {
    isMine,
    senderName,
    content,
    attachments = [],
    timestamp,
    isFailed = false,
    onRetry,
    onCancel,
    onClickImage,
    onPlayVideo,
    children,
  } = props

  const hasBubble = Boolean(content)

  return (
    <div
      className={cn(
        "min-w-0 max-w-[56%]",
        isMine ? "self-end text-right" : "self-start"
      )}
    >
      {!isMine && senderName && (
        <div className="mb-1 text-[11px] text-sz-n-500">{senderName}</div>
      )}

      {hasBubble && (
        <div
          className={cn("flex items-end gap-1.5", isMine && "flex-row-reverse")}
        >
          <div className="min-w-0">
            <div
              className={cn(
                "inline-block w-fit max-w-full rounded-xl px-3.5 py-2.5 text-[13px] leading-[1.55] break-words whitespace-pre-wrap",
                isMine
                  ? "rounded-tr-[2px] bg-sz-accent-500 text-left text-white"
                  : "rounded-tl-[2px] border border-sz-n-200 bg-white text-sz-n-900"
              )}
            >
              {content}
            </div>
          </div>
          {isFailed ? (
            <span
              title="전송 실패"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sz-danger-text text-[10px] leading-none font-bold text-white"
            >
              !
            </span>
          ) : (
            <span className="shrink-0 text-[11px] whitespace-nowrap text-sz-n-400">
              {timestamp}
            </span>
          )}
        </div>
      )}

      {children}

      <AttachmentRenderer
        attachments={attachments}
        isMine={isMine}
        onClickImage={onClickImage ?? (() => {})}
        onPlayVideo={onPlayVideo ?? (() => {})}
        timestamp={hasBubble || isFailed ? undefined : timestamp}
      />

      {isFailed && (
        <div className="mt-1 flex items-center justify-end gap-[7px] text-[11px] font-medium text-sz-danger-text">
          <span>전송 실패</span>
          <button
            type="button"
            onClick={onRetry}
            className="font-medium text-sz-n-600 underline hover:text-sz-n-900"
          >
            재전송
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="font-medium text-sz-n-600 underline hover:text-sz-n-900"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
