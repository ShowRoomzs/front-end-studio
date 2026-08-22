interface ReissueConfirmModalProps {
  /** 지금 무효가 될 코드 — 무엇이 사라지는지 눈으로 확인하고 누르게 한다 */
  connectionCode: string
  isSubmitting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * S5 — 연결코드 재발급 확인 모달.
 *
 * 되돌릴 수 없는 액션이라 확인 모달이 필수이고, 확정 버튼은 **위험색**이다.
 * 주 액션색(인디고) 규칙의 공식 예외로, 디자인시스템 `btn-danger`를 그대로 쓴다.
 *
 * 본문에 "기존 연결은 유지된다"를 반드시 함께 적는다 — 코드는 새 연결 요청용 열쇠지
 * 이미 성립한 관계의 근거가 아니다. 이 말이 없으면 인플루언서가 재발급 자체를
 * 두려워하게 된다.
 */
export default function ReissueConfirmModal(props: ReissueConfirmModalProps) {
  const { connectionCode, isSubmitting = false, onCancel, onConfirm } = props

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="연결코드 재발급 확인"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,27,31,0.45)] px-4"
      onClick={event => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        className="w-[440px] max-w-full overflow-hidden rounded-[12px] bg-white"
        style={{ boxShadow: "var(--sz-shadow-popover)" }}
      >
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-4">
          <h2 className="text-[16px] font-semibold text-sz-n-900">
            연결코드를 재발급할까요?
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="text-[14px] text-sz-n-400 hover:text-sz-n-700"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <div className="mb-3.5 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3.5 py-3">
            <div className="text-center text-[19px] font-semibold tracking-[2px] text-sz-n-900">
              {connectionCode}
            </div>
          </div>
          <p className="m-0 text-[12px] leading-[1.7] text-sz-n-600">
            재발급하면 위 코드는{" "}
            <b className="font-semibold text-sz-n-900">
              즉시 사용할 수 없습니다
            </b>
            . 이 코드를 이미 전달한 브랜드는 새 코드를 다시 받아야 합니다. 이미
            연결된 브랜드와의 연결은 그대로 유지됩니다.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-5 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 items-center rounded-[6px] px-3.5 text-[12px] font-medium text-sz-n-600 hover:bg-sz-n-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-danger-text px-3.5 text-[12px] font-medium text-white hover:enabled:bg-[#8f2828] disabled:cursor-not-allowed disabled:bg-sz-n-200 disabled:text-sz-n-400"
          >
            {isSubmitting ? "처리 중" : "재발급"}
          </button>
        </div>
      </div>
    </div>
  )
}
