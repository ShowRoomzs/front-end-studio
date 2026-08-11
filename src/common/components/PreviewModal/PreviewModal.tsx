import { useCallback, useEffect } from "react"

export interface PreviewModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  currentIndex: number
  fileLength: number
  onIndexChange?: (index: number) => void
  /** 좌상단에 "보낸 사람 · 시각"을 덧붙인다 */
  senderLabel?: string
  /** 넘기면 우상단에 다운로드 버튼이 생긴다 */
  onDownload?: () => void
}

/** 전체화면 이미지 뷰어 — 좌우 이동·카운터·Esc/배경 클릭 닫기 */
export const PreviewModal = (props: PreviewModalProps) => {
  const {
    imageUrl,
    fileLength,
    currentIndex,
    isOpen,
    onIndexChange,
    onOpenChange,
    senderLabel,
    onDownload,
  } = props

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange?.(currentIndex - 1)
    }
  }, [currentIndex, onIndexChange])

  const handleNext = useCallback(() => {
    if (currentIndex < fileLength - 1) {
      onIndexChange?.(currentIndex + 1)
    }
  }, [currentIndex, fileLength, onIndexChange])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) {
        return
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          handlePrevious()
          break
        case "ArrowRight":
          event.preventDefault()
          handleNext()
          break
        case "Escape":
          event.preventDefault()
          onOpenChange(false)
          break
      }
    },
    [isOpen, handlePrevious, handleNext, onOpenChange]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || !imageUrl) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div className="absolute top-6 left-6 z-20 text-sm text-white">
        {senderLabel ? `${senderLabel} · ` : ""}
        {currentIndex + 1} / {fileLength}
      </div>

      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            aria-label="다운로드"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/25"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[17px] w-[17px]"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="닫기"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/25"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="h-[17px] w-[17px]"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="relative flex h-full max-h-[90vh] w-full max-w-[90vw] items-center justify-center">
        <img
          src={imageUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
        />

        {fileLength > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                aria-label="이전 이미지"
                className="absolute left-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/25"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            {currentIndex < fileLength - 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="다음 이미지"
                className="absolute right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/25"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
