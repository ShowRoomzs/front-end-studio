import { X } from "lucide-react"
import { useCallback, useEffect } from "react"
import type { ReactNode } from "react"

interface ModalShellProps {
  isOpen: boolean
  title: string
  width?: number
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  /** 본문 최대 높이를 넘기면 본문만 스크롤된다(시안 C5 표준 조항 전문) */
  bodyClassName?: string
}

/**
 * 시안 `.overlay`/`.modal`/`.modal-h`/`.modal-b`/`.modal-f` 셸.
 *
 * `ConfirmModal.tsx`와 같은 오버레이·Esc 관례를 따르되, 그건
 * "제목+본문 한 줄+취소/확인 두 버튼"짜리 확인창 전용이라 폼이 들어가는
 * 모달에는 못 쓴다 — 헤더 X버튼·스크롤 가능한 본문·자유 형식 푸터가 필요해 따로 둔다.
 *
 * 원래 기본정보 관리(storeManagement)에 있던 것을 계약 관리가 같이 쓰면서 공용으로 올렸다.
 */
export function ModalShell(props: ModalShellProps) {
  const {
    isOpen,
    title,
    width = 560,
    onClose,
    children,
    footer,
    bodyClassName,
  } = props

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    },
    [isOpen, onClose]
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

  if (!isOpen) return null

  return (
    // 바깥 영역을 눌러도 닫지 않는다 — 체크·입력·파일 업로드까지 마친 폼이
    // 실수로 한 번 빗나간 클릭에 전부 날아가면 처음부터 다시 해야 한다.
    // 닫는 경로는 헤더 X · [취소] 버튼 · Esc 세 가지로 충분하다.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="max-h-[90vh] overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
        style={{ width }}
      >
        <div className="flex items-center justify-between border-b border-sz-n-200 px-[22px] py-4">
          <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-sz-n-400 hover:text-sz-n-600"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        <div
          className={bodyClassName ?? "max-h-[70vh] overflow-y-auto p-[22px]"}
        >
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-[22px] py-3.5">
          {footer}
        </div>
      </div>
    </div>
  )
}

/** 시안 `.notice` — 모달 최상단 파란 안내 박스 */
export function ModalNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex gap-2 rounded-[6px] bg-sz-info-bg p-3.5 text-[11px] leading-[1.65] text-sz-n-700">
      <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sz-info-text text-[10px] font-bold text-white">
        i
      </span>
      <span>{children}</span>
    </div>
  )
}

/** 시안 `.err-msg` — 모달 폼 필드 아래 빨간 오류 문구. 빨간 테두리만으로는 이유를 알 수 없다 */
export function ModalFieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-[12px] text-sz-danger-text">
      {children}
    </p>
  )
}

/** 모달 폼 필드 라벨 — 필수 표시(*)는 시안대로 라벨 뒤에 붙는다 */
export function ModalLabel(props: {
  children: ReactNode
  required?: boolean
  /** 시안 `.mlabel .opt` — "선택" 같은 보조 표기 */
  optionalText?: string
}) {
  const { children, required = false, optionalText } = props

  return (
    <label className="mb-1 block text-[12px] font-medium text-sz-n-600">
      {children}
      {required && <span className="ml-0.5 text-sz-danger-text">*</span>}
      {optionalText && (
        <span className="ml-1 font-normal text-sz-n-400">{optionalText}</span>
      )}
    </label>
  )
}
