import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import type { CreatorContractClausesResponse } from "@/features/contracts/types"

interface ClausesModalProps {
  clauses: CreatorContractClausesResponse | undefined
  onClose: () => void
}

/**
 * 표준 조항 전문 — 이 계약에 고정된 버전을 읽는다. 문안이 개정된 뒤에도 내가 서명한 계약의
 * 조항과 화면에 뜨는 조항이 달라지지 않는다. 입력 컨트롤이 하나도 없다.
 */
export default function ClausesModal(props: ClausesModalProps) {
  const { clauses, onClose } = props
  const fullClauses = clauses?.clauses.filter(
    clause => clause.fullTitle !== null && clause.fullBody !== null
  )

  return (
    <ModalShell
      isOpen
      title="표준 조항 전문"
      width={640}
      onClose={onClose}
      bodyClassName="max-h-[560px] overflow-y-auto p-5"
      footer={
        <Btn variant="secondary" onClick={onClose}>
          닫기
        </Btn>
      }
    >
      <Notice tone="neutral" className="mb-4">
        계약서에 자동 삽입되는 <b className="font-semibold">표준 조항</b>이며 이
        계약에 고정된 버전입니다.
        {clauses && (
          <>
            {" "}
            (v{clauses.versionNumber} · {clauses.effectiveDate} 시행)
          </>
        )}
      </Notice>
      {fullClauses?.map(clause => (
        <div key={clause.code} className="mb-[18px] last:mb-0">
          <div className="mb-[5px] text-[13px] font-semibold text-sz-n-900">
            {clause.fullTitle}
          </div>
          <div className="whitespace-pre-line text-[12px] leading-[1.75] text-sz-n-600">
            {clause.fullBody}
          </div>
        </div>
      ))}
      {!clauses && <p className="text-[12px] text-sz-n-500">불러오는 중…</p>}
      {fullClauses && fullClauses.length === 0 && (
        <p className="text-[12px] text-sz-n-500">
          전문이 확정된 조항이 아직 없습니다.
        </p>
      )}
    </ModalShell>
  )
}
