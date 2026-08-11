import { Button } from "@/components/ui/button"
import AttachPreview, {
  type StagedFile,
} from "@/features/connections/components/MessageInput/AttachPreview"
import { AttachIcon, SendIcon } from "@/features/connections/components/icons"
import {
  ALLOWED_EXTENSIONS,
  ATTACHMENT_COUNT_MAX,
  ATTACHMENT_TOTAL_SIZE_MAX,
} from "@/features/connections/constants/params"
import { getExtension } from "@/features/connections/utils/attachmentIcon"
import { useRef, useState } from "react"
import toast from "react-hot-toast"

interface MessageInputProps {
  onSend: (content: string, files: Array<File>) => void
}

/**
 * 메시지 입력창 (시안 `.th-input`).
 *
 * 개수(20개)와 총 용량(500MB)은 **서로 독립적인 두 축**이라 둘 다 봐야 한다 —
 * 개수는 통과했는데 용량이 초과인 경우(대용량 영상 2개 등)도 전송 불가다(§13-7).
 * 여기 검증은 즉시 피드백용이고, 서버가 전송 시 다시 판정한다.
 */
export default function MessageInput(props: MessageInputProps) {
  const { onSend } = props
  const [content, setContent] = useState("")
  const [staged, setStaged] = useState<Array<StagedFile>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalSize = staged.reduce((sum, item) => sum + item.file.size, 0)
  const isOverCount = staged.length > ATTACHMENT_COUNT_MAX
  const isOverSize = totalSize > ATTACHMENT_TOTAL_SIZE_MAX
  const canSend =
    !isOverCount &&
    !isOverSize &&
    (content.trim().length > 0 || staged.length > 0)

  const handlePickFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return
    }

    const picked = Array.from(fileList)
    const rejected = picked.filter(
      file => !ALLOWED_EXTENSIONS.includes(getExtension(file.name))
    )
    if (rejected.length > 0) {
      toast.error(
        `첨부할 수 없는 형식입니다: ${rejected.map(file => file.name).join(", ")}`
      )
    }

    const accepted = picked.filter(file =>
      ALLOWED_EXTENSIONS.includes(getExtension(file.name))
    )
    setStaged(prev => [
      ...prev,
      ...accepted.map(file => ({ localId: crypto.randomUUID(), file })),
    ])
  }

  const handleSend = () => {
    if (!canSend) {
      return
    }
    onSend(
      content,
      staged.map(item => item.file)
    )
    setContent("")
    setStaged([])
  }

  return (
    <div className="flex min-h-16 shrink-0 flex-col justify-center border-t border-sz-n-200 bg-white px-4 py-3">
      <AttachPreview
        files={staged}
        onRemove={localId =>
          setStaged(prev => prev.filter(item => item.localId !== localId))
        }
      />

      {(isOverCount || isOverSize) && (
        <div className="flex items-center gap-1.5 pb-2 text-[11px] font-medium text-sz-danger-text">
          <span>⚠</span>
          <span>
            {isOverCount
              ? `첨부는 최대 ${ATTACHMENT_COUNT_MAX}개까지 가능합니다.`
              : "최대 500MB를 초과했습니다. 일부 파일을 제거하거나 나눠서 보내주세요."}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={event => {
            handlePickFiles(event.target.files)
            event.target.value = ""
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="파일 첨부"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-sz-n-300 text-sz-n-500 hover:bg-sz-n-100"
        >
          <AttachIcon />
        </button>

        <textarea
          value={content}
          onChange={event => setContent(event.target.value)}
          onKeyDown={event => {
            // 줄바꿈은 Shift+Enter — 채팅에서 Enter는 전송이다
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
          rows={1}
          placeholder="메시지 입력…"
          className="h-10 flex-1 resize-none rounded-[20px] border border-sz-n-300 px-4 py-[9px] text-[13px] text-sz-n-900 placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:outline-none"
        />

        <Button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          aria-label="전송"
          className="h-10 w-10 shrink-0 rounded-full p-0"
        >
          <SendIcon />
        </Button>
      </div>
    </div>
  )
}
