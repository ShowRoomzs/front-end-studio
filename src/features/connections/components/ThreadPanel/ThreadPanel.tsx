import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal"
import { Button } from "@/components/ui/button"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import MessageInput from "@/features/connections/components/MessageInput/MessageInput"
import MessageList from "@/features/connections/components/MessageList/MessageList"
import VideoPlayerModal from "@/features/connections/components/VideoPlayerModal/VideoPlayerModal"
import {
  CONNECTED_THREAD_STATUS_TEXT,
  OPERATOR_CHANNEL_STATUS_TEXT,
  OPERATOR_NOTICE_TEXT,
} from "@/features/connections/constants/params"
import { useGetThreadMessages } from "@/features/connections/hooks/useGetThreadMessages"
import { useMarkThreadRead } from "@/features/connections/hooks/useMarkThreadRead"
import { useOutgoingMessages } from "@/features/connections/hooks/useOutgoingMessages"
import type {
  AttachmentSummary,
  ThreadListItem,
} from "@/features/connections/services/threadService"
import { downloadFile } from "@/features/connections/utils/download"
import { useState } from "react"
import toast from "react-hot-toast"

interface ThreadPanelProps {
  thread: ThreadListItem
}

interface LightboxState {
  images: Array<AttachmentSummary>
  index: number
  senderLabel: string
}

/** 우측 소통 스레드 (시안 `.cs-thread`) */
export default function ThreadPanel(props: ThreadPanelProps) {
  const { thread } = props

  const { messages, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetThreadMessages(thread.threadId)
  const { outgoing, send, retry, cancel } = useOutgoingMessages(thread.threadId)
  useMarkThreadRead(thread.threadId, thread.unreadCount)

  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [playingVideo, setPlayingVideo] = useState<AttachmentSummary | null>(
    null
  )

  const currentImage = lightbox?.images[lightbox.index]

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-sz-n-50">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sz-n-200 bg-white px-5">
        <CounterpartAvatar
          name={thread.counterpartName}
          imageUrl={thread.counterpartImageUrl}
          isOperator={thread.operatorChannel}
          className="h-10 w-10"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-sz-n-900">
            {thread.counterpartName}
          </div>
          <div className="mt-0.5 text-[11px] text-sz-n-500">
            {thread.operatorChannel
              ? OPERATOR_CHANNEL_STATUS_TEXT
              : CONNECTED_THREAD_STATUS_TEXT}
          </div>
        </div>
        {/*
          [계약 확인]은 계약이 **있을 때만** 노출한다(§14-2) — 스튜디오는 계약을
          확인하는 쪽이라 없으면 볼 것이 없다. 파트너센터가 버튼을 비활성으로
          남겨두는 것과 방향이 반대다. 계약 화면은 아직 없어 진입점만 둔다.
        */}
        {thread.hasContract && (
          <Button
            type="button"
            size="sm"
            onClick={() => toast("계약 관리 화면은 준비 중입니다.")}
          >
            계약 확인
          </Button>
        )}
      </div>

      {/*
        운영자 열람 고지는 스크롤과 무관하게 항상 보여야 한다(§13-4) —
        스크롤로 사라지면 "상시 고지" 요건을 만족하지 못한다.
      */}
      {!thread.operatorChannel && (
        <div className="shrink-0 bg-sz-n-100 px-4 py-2 text-center text-[11px] text-sz-n-500">
          {OPERATOR_NOTICE_TEXT}
        </div>
      )}

      <MessageList
        messages={messages}
        outgoing={outgoing}
        counterpartName={thread.counterpartName}
        hasOlderMessages={Boolean(hasNextPage)}
        isFetchingOlder={isFetchingNextPage}
        onLoadOlder={() => void fetchNextPage()}
        onRetry={retry}
        onCancel={cancel}
        onClickImage={(images, index, senderLabel) =>
          setLightbox({ images, index, senderLabel })
        }
        onPlayVideo={setPlayingVideo}
      />

      <MessageInput onSend={send} />

      <PreviewModal
        isOpen={Boolean(currentImage)}
        onOpenChange={open => !open && setLightbox(null)}
        imageUrl={currentImage?.fileUrl ?? ""}
        currentIndex={lightbox?.index ?? 0}
        fileLength={lightbox?.images.length ?? 0}
        onIndexChange={index =>
          setLightbox(current => current && { ...current, index })
        }
        senderLabel={lightbox?.senderLabel}
        onDownload={() =>
          currentImage?.fileUrl &&
          downloadFile(currentImage.fileUrl, currentImage.originalName)
        }
      />

      <VideoPlayerModal
        attachment={playingVideo}
        onClose={() => setPlayingVideo(null)}
      />
    </div>
  )
}
