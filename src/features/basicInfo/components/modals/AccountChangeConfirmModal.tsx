import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import { CheckList } from "@/features/basicInfo/components/parts"
import { buttonClass } from "@/features/basicInfo/components/styles"
import { useGetAccountChangeImpact } from "@/features/basicInfo/hooks/useBasicInfoQueries"
import { formatWon } from "@/features/basicInfo/utils/format"

/**
 * T6 계좌 변경 확인 — 돈이 늦어질 수 있는 액션이라 확인을 받는다.
 * 보류 건수 · 금액은 열 때 서버가 센다(`change-impact`). 0건이면 보류 문장을 뺀다(서버 문서).
 * 삭제가 아니므로 확정 버튼은 위험색이 아니라 주 액션이다.
 */
export default function AccountChangeConfirmModal(props: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
}) {
  const { isOpen, onClose, onConfirm, isSubmitting } = props
  const { data: impact, isLoading } = useGetAccountChangeImpact(isOpen)

  return (
    <ModalShell
      isOpen={isOpen}
      title="정산 계좌를 변경할까요?"
      width={440}
      onClose={onClose}
      bodyClassName="max-h-[70vh] overflow-y-auto p-5"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={buttonClass("ghost")}
          >
            취소
          </button>
          <button
            type="button"
            disabled={isLoading || isSubmitting}
            onClick={onConfirm}
            className={buttonClass("primary")}
          >
            계좌 변경 계속
          </button>
        </>
      }
    >
      <CheckList>
        <li>
          <b>통장 사본을 다시 제출</b>하면 <b>운영자가 확인한 뒤</b> 변경이
          완료됩니다
        </li>
        {impact && impact.pendingPayoutCount > 0 && (
          <li>
            확인이 끝날 때까지{" "}
            <b>
              지급 예정 {impact.pendingPayoutCount}건(
              {formatWon(impact.pendingPayoutAmount)})의 입금이 보류
            </b>
            됩니다
          </li>
        )}
        {impact && impact.inFlightPayoutCount > 0 && (
          <li>
            이미 지급 요청이 나간 <b>{impact.inFlightPayoutCount}건</b>은 이전
            계좌로 지급됩니다
          </li>
        )}
        <li>
          이미 <b>지급이 끝난 건은 영향이 없습니다</b>
        </li>
        <li>
          <b>본인 명의 계좌</b>만 등록할 수 있습니다
        </li>
      </CheckList>
      <p className="mt-3.5 text-[12px] leading-[1.7] text-sz-n-600 [&_b]:font-semibold [&_b]:text-sz-n-900">
        지급 예정일이 가까우면 <b>입금 후에 변경</b>하는 것이 안전합니다.
      </p>
    </ModalShell>
  )
}
