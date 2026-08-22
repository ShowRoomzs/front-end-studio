import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, type ReactNode } from "react"

/**
 * 확인 모달 — **440px**. 조작이 들어가는 편집 모달(크롭 560px)과 폭으로 구분한다.
 */
export default function ConfirmModal(props: {
  title: string
  children: ReactNode
  confirmLabel: string
  /** 되돌릴 수 없는 액션만 위험색 */
  isDestructive?: boolean
  isConfirmDisabled?: boolean
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const {
    title,
    children,
    confirmLabel,
    isDestructive,
    isConfirmDisabled,
    isPending,
    onConfirm,
    onClose,
  } = props

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/45"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-[440px] overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-[15px] text-[13px] font-semibold text-sz-n-900">
          {title}
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="cursor-pointer text-sz-n-400 hover:text-sz-n-700"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>

        <div className="px-5 py-[18px]">{children}</div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-5 py-[13px]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isDestructive ? "destructive" : "default"}
            disabled={isConfirmDisabled}
            isLoading={isPending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
