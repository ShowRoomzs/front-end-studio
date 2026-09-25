import {
  ModalShell,
  ModalLabel,
} from "@/common/components/ModalShell/ModalShell"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  SELECT_CLASS,
  TEXTAREA_CLASS,
} from "@/features/contracts/components/shared/styles"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import {
  DECLINE_MEMO_MAX_LENGTH,
  DECLINE_REASONS,
  FORM_SELECT_CHEVRON_STYLE,
} from "@/features/contracts/constants/params"
import type {
  ContractDeclineReason,
  CreatorContractDetailResponse,
} from "@/features/contracts/types"
import { formatKRW } from "@/features/contracts/utils/format"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface DeclineModalProps {
  detail: CreatorContractDetailResponse
  isPending: boolean
  onClose: () => void
  onConfirm: (reasonCode: ContractDeclineReason, memo: string) => void
}

/**
 * 시안 S5 — 거절 확인. 되돌릴 수 없는 액션이라 요약 → 사유(필수) · 메모(선택) → 고지 순이고
 * 확정 버튼은 위험색이다. 사유는 브랜드에게 그대로 전달된다.
 * 필수 미선택은 에러 문구 없이 버튼만 비활성(절대 규칙).
 */
export default function DeclineModal(props: DeclineModalProps) {
  const { detail, isPending, onClose, onConfirm } = props
  const [reasonCode, setReasonCode] = useState<ContractDeclineReason | "">("")
  const [memo, setMemo] = useState("")

  return (
    <ModalShell
      isOpen
      title="이 계약을 거절할까요?"
      width={480}
      onClose={onClose}
      bodyClassName="max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="danger"
            disabled={reasonCode === ""}
            isLoading={isPending}
            onClick={() => reasonCode !== "" && onConfirm(reasonCode, memo)}
          >
            거절
          </Btn>
        </>
      }
    >
      <Terms className="mb-4 px-3">
        <TermRow label="공구명" labelWidth={96} className="py-2">
          {detail.title}
        </TermRow>
        <TermRow label="브랜드" labelWidth={96} className="py-2">
          {detail.brand.name}
        </TermRow>
        <TermRow
          label="고정 지급비"
          labelWidth={96}
          className="py-2 tabular-nums"
        >
          {formatKRW(detail.fixedFee.amount ?? 0)}
        </TermRow>
      </Terms>

      <ModalLabel required>사유 구분</ModalLabel>
      <select
        className={cn(SELECT_CLASS, "h-[34px] w-full")}
        style={FORM_SELECT_CHEVRON_STYLE}
        value={reasonCode}
        onChange={event =>
          setReasonCode(event.target.value as ContractDeclineReason | "")
        }
      >
        <option value="">사유를 선택하세요</option>
        {DECLINE_REASONS.map(reason => (
          <option key={reason.code} value={reason.code}>
            {reason.label}
          </option>
        ))}
      </select>

      <div className="mt-4">
        <ModalLabel optionalText="선택">브랜드에게 남길 메모</ModalLabel>
        <textarea
          className={TEXTAREA_CLASS}
          placeholder="조정이 필요한 부분을 적으면 브랜드가 조건을 고쳐 다시 보낼 수 있습니다."
          maxLength={DECLINE_MEMO_MAX_LENGTH}
          value={memo}
          onChange={event => setMemo(event.target.value)}
        />
      </div>

      <div className="mt-4 flex gap-2 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700">
        <div>
          <b className="font-semibold text-sz-n-900">
            거절하면 이 계약은 종결되고 되돌릴 수 없습니다.
          </b>{" "}
          연결은 유지되므로 브랜드가 조건을 고쳐 새 계약을 다시 보낼 수
          있습니다. 사유는 브랜드에게 그대로 전달됩니다.
        </div>
      </div>
    </ModalShell>
  )
}
