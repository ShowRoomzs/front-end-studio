import { useState } from "react"

import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import { CheckList, Field } from "@/features/basicInfo/components/parts"
import {
  buttonClass,
  inputClass,
  SELECT_CHEVRON_STYLE,
} from "@/features/basicInfo/components/styles"
import { WITHDRAWAL_REASON_OPTIONS } from "@/features/basicInfo/constants/params"

/**
 * S6 탈퇴 승인 요청 — 사유 선택 필수(운영자 판단 근거 · 반려 시 재조치 단서). 미선택은 문구 없이 버튼 비활성만.
 * 즉시 탈퇴가 아니라는 것 · 처리 기한 · 대기 중 제약 · 탈퇴 후 결과를 고지한다. 확정 버튼은 위험색.
 * 선택지가 정의되지 않아 고른 라벨을 그대로 보낸다(서버 문자열 1 ~ 500자).
 */
export default function WithdrawalRequestModal(props: {
  isOpen: boolean
  approvalDueBusinessDays: number
  onClose: () => void
  onSubmit: (reason: string) => void
  isSubmitting: boolean
}) {
  if (!props.isOpen) return null
  return <WithdrawalRequestForm {...props} />
}

function WithdrawalRequestForm(props: {
  approvalDueBusinessDays: number
  onClose: () => void
  onSubmit: (reason: string) => void
  isSubmitting: boolean
}) {
  const { approvalDueBusinessDays, onClose, onSubmit, isSubmitting } = props
  const [reason, setReason] = useState("")

  return (
    <ModalShell
      isOpen
      title="탈퇴 승인을 요청할까요?"
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
            disabled={!reason || isSubmitting}
            onClick={() => onSubmit(reason)}
            className={buttonClass("danger")}
          >
            승인 요청
          </button>
        </>
      }
    >
      <Field
        label="탈퇴 사유"
        required
        htmlFor="basic-info-withdrawal-reason"
        hint="운영자가 승인 · 반려를 판단하는 근거입니다."
      >
        <select
          id="basic-info-withdrawal-reason"
          value={reason}
          onChange={event => setReason(event.target.value)}
          style={SELECT_CHEVRON_STYLE}
          className={inputClass(
            false,
            "cursor-pointer appearance-none pr-8 invalid:text-sz-n-400"
          )}
          required
        >
          <option value="" disabled>
            사유를 선택하세요
          </option>
          {WITHDRAWAL_REASON_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      <CheckList>
        <li>
          요청 즉시 탈퇴되지 않습니다 —{" "}
          <b>운영자 승인(영업일 {approvalDueBusinessDays}일 이내)</b> 후
          처리됩니다
        </li>
        <li>
          대기 중에는 <b>새 연결 수락 · 계약 서명이 막힙니다</b>
        </li>
        <li>
          승인되면 내 쇼룸이 소비자에게 <b>더 이상 보이지 않습니다</b>
        </li>
        <li>
          소비자 계정은 유지되고 계약 · 정산 이력은{" "}
          <b>법정 보존 기간 동안 보관</b>됩니다
        </li>
      </CheckList>
      <p className="mt-3.5 text-[12px] leading-[1.7] text-sz-n-600 [&_b]:font-semibold [&_b]:text-sz-n-900">
        다시 활동하려면 <b>처음부터 다시 가입 신청</b>해야 합니다.
      </p>
    </ModalShell>
  )
}
