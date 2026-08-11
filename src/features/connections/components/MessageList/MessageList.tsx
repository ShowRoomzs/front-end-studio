import UploadingChip from "@/features/connections/components/Attachment/UploadingChip"
import MessageBubble from "@/features/connections/components/MessageBubble/MessageBubble"
import type {
  AttachmentSummary,
  MessageItem,
} from "@/features/connections/services/threadService"
import type { OutgoingMessage } from "@/features/connections/types"
import {
  formatDayMark,
  formatMessageTime,
} from "@/features/connections/utils/format"
import { useCallback, useEffect, useRef } from "react"

interface MessageListProps {
  messages: Array<MessageItem>
  outgoing: Array<OutgoingMessage>
  counterpartName: string
  hasOlderMessages: boolean
  isFetchingOlder: boolean
  onLoadOlder: () => void
  onRetry: (clientMessageId: string) => void
  onCancel: (clientMessageId: string) => void
  /** `senderLabel`은 라이트박스 상단의 "보낸 사람 · 시각" 표기다 */
  onClickImage: (
    images: Array<AttachmentSummary>,
    index: number,
    senderLabel: string
  ) => void
  onPlayVideo: (attachment: AttachmentSummary) => void
}

/**
 * 스레드 본문 (시안 `.th-body`).
 *
 * 오래된 메시지는 위로 스크롤할 때 이어서 불러온다. 그때 스크롤이 튀지 않도록
 * 불러오기 전후의 `scrollHeight` 차이만큼 위치를 보정한다 — 보정하지 않으면
 * 새로 붙은 높이만큼 읽던 자리가 아래로 밀려난다.
 */
export default function MessageList(props: MessageListProps) {
  const {
    messages,
    outgoing,
    counterpartName,
    hasOlderMessages,
    isFetchingOlder,
    onLoadOlder,
    onRetry,
    onCancel,
    onClickImage,
    onPlayVideo,
  } = props

  const scrollRef = useRef<HTMLDivElement>(null)
  const previousScrollHeight = useRef<number | null>(null)
  /** 첫 렌더에서 한 번은 무조건 맨 아래로 내린다(아직 스크롤 위치가 없다) */
  const hasScrolledToBottom = useRef(false)
  const lastMessageId = messages.at(-1)?.messageId ?? null

  /*
    새 메시지가 오면 맨 아래로 따라간다. 단 **이미 맨 아래를 보고 있을 때만** —
    과거 대화를 읽는 중에 폴링으로 새 메시지가 들어왔다고 화면을 끌어내리면
    읽던 자리를 잃는다.
  */
  useEffect(() => {
    const element = scrollRef.current
    if (!element || previousScrollHeight.current !== null) {
      return
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight
    if (!hasScrolledToBottom.current || distanceFromBottom < 120) {
      element.scrollTop = element.scrollHeight
      hasScrolledToBottom.current = true
    }
  }, [lastMessageId, outgoing.length])

  // 이전 메시지를 붙인 직후 읽던 위치를 그대로 유지
  useEffect(() => {
    const element = scrollRef.current
    if (!element || previousScrollHeight.current === null || isFetchingOlder) {
      return
    }
    element.scrollTop = element.scrollHeight - previousScrollHeight.current
    previousScrollHeight.current = null
  }, [isFetchingOlder, messages.length])

  const handleScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element || !hasOlderMessages || isFetchingOlder) {
      return
    }
    if (element.scrollTop < 80) {
      previousScrollHeight.current = element.scrollHeight
      onLoadOlder()
    }
  }, [hasOlderMessages, isFetchingOlder, onLoadOlder])

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col items-start gap-4 overflow-y-auto p-5"
    >
      {isFetchingOlder && (
        <div className="self-center text-[11px] text-sz-n-400">
          이전 메시지를 불러오는 중…
        </div>
      )}

      {messages.map((message, index) => {
        const dayMark = formatDayMark(message.createdAt)
        const showDayMark =
          index === 0 ||
          dayMark !== formatDayMark(messages[index - 1].createdAt)

        return (
          <div key={message.messageId} className="contents">
            {showDayMark && (
              <div className="self-center text-center text-[11px] text-sz-n-400">
                {dayMark}
              </div>
            )}
            <MessageBubble
              isMine={message.mine}
              senderName={counterpartName}
              content={message.content}
              attachments={message.attachments}
              timestamp={formatMessageTime(message.createdAt)}
              onClickImage={(images, imageIndex) =>
                onClickImage(
                  images,
                  imageIndex,
                  `${message.mine ? "나" : counterpartName} · ${formatMessageTime(
                    message.createdAt
                  )}`
                )
              }
              onPlayVideo={onPlayVideo}
            />
          </div>
        )
      })}

      {outgoing.map(message => (
        <MessageBubble
          key={message.clientMessageId}
          isMine
          content={message.content}
          timestamp={message.status === "failed" ? "" : "전송 중…"}
          isFailed={message.status === "failed"}
          onRetry={() => onRetry(message.clientMessageId)}
          onCancel={() => onCancel(message.clientMessageId)}
        >
          {message.attachments.map(attachment => (
            <UploadingChip
              key={attachment.localId}
              attachment={attachment}
              isMine
            />
          ))}
        </MessageBubble>
      ))}
    </div>
  )
}
