import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import {
  GbModal,
  MHint,
  MLabel,
  MTextarea,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts"
import {
  B,
  MRow,
  MTable,
} from "@/features/settlement/components/detail/DetailParts"
import type {
  AdjustmentRequestBody,
  SettlementDetail,
} from "@/features/settlement/types"
import {
  calcVat,
  calcWithholding,
  formatAmountInput,
  formatMinusWon,
  formatMonthDayTime,
  formatPercent,
  formatPlusWon,
  formatSignedWon,
  formatWon,
  parseAmountInput,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import { useState } from "react"

/**
 * C1 — 정산 조정 요청. 입력은 조정할 리워드 금액(필수) · 사유(필수) 둘이다(근거 첨부는 스레드 말풍선으로).
 *
 * 금액을 넣으면 원천징수 · 실지급액이 바로 계산된다 — 인플루언서가 실제로 비교하는 값은 리워드가 아니라
 * 세후 통장 입금액이다(§44-1 #6). 범위(0 ~ 상한)를 벗어나거나 사유가 비면 에러 문구 없이 버튼만 비활성.
 * 보내면 전액 보류 + 이슈 스레드 자동 개설 · 차액 선지급 없음.
 */
export default function AdjustmentRequestModal(props: {
  detail: SettlementDetail
  isPending: boolean
  onClose: () => void
  onSubmit: (body: AdjustmentRequestBody) => void
}) {
  const { detail, isPending, onClose, onSubmit } = props
  const b = detail.breakdown
  const rates = detail.taxRates
  const business = detail.taxType === "BUSINESS"
  const max = detail.maxAdjustableReward

  const [amountText, setAmountText] = useState("")
  const [reason, setReason] = useState("")

  const amount = parseAmountInput(amountText)
  // 원래 금액과 같은 값은 조정이 아니다 — 요청을 열 이유가 없다(§46 B-1 미결 · 비활성으로 처리)
  const isValidAmount =
    amount !== null && amount >= 0 && amount <= max && amount !== b.saleReward
  const canSubmit = isValidAmount && reason.trim() !== "" && !isPending

  // 차감이 있으면 요청 리워드에서 같은 차감을 뺀 값이 세금 기준이다
  const base = amount === null ? null : Math.max(0, amount - b.deductionAmount)
  const tax =
    base === null
      ? null
      : business
        ? calcVat(base, rates.vatRate)
        : calcWithholding(base, rates.withholdingRate)
  const payout =
    base === null || tax === null ? null : business ? base + tax : base - tax
  const dash = "—"

  return (
    <GbModal
      title="정산 조정을 요청할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={() =>
              amount !== null &&
              onSubmit({ requestedReward: amount, reason: reason.trim() })
            }
          >
            정산 조정 요청
          </Btn>
        </>
      }
    >
      <MWarn>
        {detail.groupBuyTitle} · {detail.brandName}
        <br />
        계약 리워드 <B className="text-sz-n-900">{formatWon(b.saleReward)}</B> ·
        확인 기간{" "}
        <B className="text-sz-n-900">
          {formatMonthDayTime(detail.confirmDeadlineAt)}
        </B>
        까지
      </MWarn>

      <MLabel required>조정할 리워드 금액</MLabel>
      <input
        className={cn(INPUT_CLASS, "w-full text-right tabular-nums")}
        inputMode="numeric"
        value={amountText}
        onChange={event => setAmountText(formatAmountInput(event.target.value))}
        aria-label="조정할 리워드 금액"
      />
      <MHint>0원 ~ {formatWon(max)} 안에서 입력할 수 있습니다</MHint>

      <div className="mt-2.5 overflow-hidden rounded-[6px] border border-sz-n-200">
        <MTable>
          <MRow label="요청 리워드">
            {amount === null ? dash : formatWon(amount)}
          </MRow>
          {b.deductionAmount > 0 && (
            <MRow kind="sub" label="차감 반영" note="이전 정산 환불분">
              {formatMinusWon(b.deductionAmount)}
            </MRow>
          )}
          {business ? (
            <MRow
              kind="sub"
              label={`부가세 ${formatPercent(rates.vatRate)}`}
              note="세금계산서 별도 · 자동 계산"
            >
              {tax === null ? dash : formatPlusWon(tax)}
            </MRow>
          ) : (
            <MRow
              kind="sub"
              label="원천징수"
              note={`${formatPercent(rates.withholdingRate)} · 자동 계산`}
            >
              {tax === null ? dash : formatMinusWon(tax)}
            </MRow>
          )}
          <MRow kind="tot" label="실지급액(요청 시)">
            {payout === null ? dash : formatWon(payout)}
          </MRow>
          <MRow kind="sub" label="원래 실지급액 대비">
            {payout === null ? dash : formatSignedWon(payout - b.payoutAmount)}
          </MRow>
        </MTable>
      </div>

      <label className="mb-1 mt-[14px] block text-[12px] font-medium text-sz-n-600">
        사유<span className="ml-0.5 text-sz-danger-text">*</span>
      </label>
      <MTextarea
        placeholder="금액을 조정해야 하는 이유를 적어 주세요."
        value={reason}
        onChange={event => setReason(event.target.value)}
      />

      <MHint className="mt-[14px]">
        근거 자료는 요청 후 <B>이슈 스레드에 올려 주세요</B>. 요청하면 이 공구
        정산이 <B>전액 보류</B>되고 브랜드와의 <B>이슈 스레드</B>가 열립니다.
        차액을 먼저 지급하지 않습니다. 브랜드가 동의하면 바로 반영되며,{" "}
        <B>10영업일</B> 안에 합의가 없으면 <B>원래 금액</B>으로 확정됩니다.
      </MHint>
    </GbModal>
  )
}
