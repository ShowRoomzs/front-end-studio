import useDebounce from "@/common/hooks/useDebounce"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
} from "@/features/contracts/components/shared/styles"
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
import { ADJUSTMENT_REASON_MAX_LENGTH } from "@/features/settlement/constants/params"
import { useGetAdjustmentPreview } from "@/features/settlement/hooks/useSettlementQueries"
import type {
  AdjustmentRequestBody,
  SettlementDetail,
} from "@/features/settlement/types"
import {
  formatAmountInput,
  formatMinusWon,
  formatMonthDayTime,
  formatPlusWon,
  formatRatio,
  formatSignedWon,
  formatWon,
  parseAmountInput,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import { useId, useState } from "react"

/** 서버가 돌려준 칸별 오류 — 금액(범위) · 사유(빈 값 · 길이) */
export interface AdjustmentFieldErrors {
  amount?: string
  reason?: string
}

/**
 * C1 — 정산 조정 요청. 입력은 조정할 리워드 금액(필수) · 사유(필수) 둘이다(근거 첨부는 스레드 말풍선으로).
 *
 * 금액을 넣으면 원천징수 · 실지급액이 바로 계산된다 — 인플루언서가 실제로 비교하는 값은 리워드가 아니라
 * 세후 통장 입금액이다(§44-1 #6). 계산은 서버 미리보기(`GET …/adjustment/preview`)가 한다 — 절사 규칙을
 * FE가 들면 정산 화면과 1원이 어긋난다. 상한 · 요청 가능 여부도 미리보기 값이다.
 * 범위(0 ~ 상한 · 원래 금액과 같으면 안 됨)를 벗어나거나 사유가 비면 에러 문구 없이 버튼만 비활성.
 * 보내면 전액 보류 + 이슈 스레드 자동 개설 · 차액 선지급 없음.
 */
export default function AdjustmentRequestModal(props: {
  detail: SettlementDetail
  isPending: boolean
  fieldErrors: AdjustmentFieldErrors
  onEditField: (field: keyof AdjustmentFieldErrors) => void
  onClose: () => void
  onSubmit: (body: AdjustmentRequestBody) => void
}) {
  const { detail, isPending, fieldErrors, onEditField, onClose, onSubmit } =
    props
  const settlementId = detail.settlement.settlementId
  const business = detail.settlement.creatorBusinessType === "BUSINESS"
  const clawback = detail.breakdown.rewardClawbackAmount

  const [amountText, setAmountText] = useState("")
  const [reason, setReason] = useState("")
  const reasonId = useId()

  const amount = parseAmountInput(amountText)
  const debouncedAmount = useDebounce(amount, 300)
  const { data: preview, isError } = useGetAdjustmentPreview(
    settlementId,
    debouncedAmount
  )

  // 상한 · 원래 금액은 미리보기가 정본 — 첫 응답 전에는 상세 값(같은 포트 계산)으로 그린다
  const max = preview?.maxRewardAmount ?? detail.review?.maxRewardAmount ?? 0
  const originalReward =
    preview?.originalRewardAmount ?? detail.breakdown.rewardAmount
  const reviewEndsAt = preview?.reviewEndsAt ?? detail.timeline.reviewDueAt
  const canRequest =
    preview?.canRequest ?? detail.review?.canRequestAdjustment ?? false

  // 원래 금액과 같은 값은 조정이 아니다 — 서버도 범위 오류로 막는다
  const isValidAmount =
    amount !== null && amount >= 0 && amount <= max && amount !== originalReward
  const canSubmit =
    canRequest && isValidAmount && reason.trim() !== "" && !isPending

  // 지금 입력에 맞는 계산만 쓴다 — 디바운스 중이거나 범위 밖이면 「—」
  const computed =
    amount !== null &&
    preview?.input?.rewardAmount === amount &&
    preview.inRange
      ? preview.preview
      : null
  const original = preview?.original ?? null
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
              onSubmit({ rewardAmount: amount, reason: reason.trim() })
            }
          >
            정산 조정 요청
          </Btn>
        </>
      }
    >
      <MWarn>
        {detail.settlement.groupBuyTitle} · {detail.settlement.brandName}
        <br />
        계약 리워드 <B className="text-sz-n-900">
          {formatWon(originalReward)}
        </B>{" "}
        · 확인 기간{" "}
        <B className="text-sz-n-900">{formatMonthDayTime(reviewEndsAt)}</B>
        까지
      </MWarn>

      <MLabel required>조정할 리워드 금액</MLabel>
      <input
        className={cn(
          INPUT_CLASS,
          "w-full text-right tabular-nums",
          fieldErrors.amount && INPUT_ERROR_CLASS
        )}
        inputMode="numeric"
        value={amountText}
        onChange={event => {
          setAmountText(formatAmountInput(event.target.value))
          if (fieldErrors.amount) onEditField("amount")
        }}
        aria-label="조정할 리워드 금액"
        aria-required
        aria-invalid={!!fieldErrors.amount}
      />
      {fieldErrors.amount ? (
        <div role="alert" className="mt-[5px] text-[11px] text-sz-danger-text">
          {fieldErrors.amount}
        </div>
      ) : (
        <MHint>0원 ~ {formatWon(max)} 안에서 입력할 수 있습니다</MHint>
      )}

      <div className="mt-2.5 overflow-hidden rounded-[6px] border border-sz-n-200">
        <MTable>
          <MRow label="요청 리워드">
            {amount === null ? dash : formatWon(amount)}
          </MRow>
          {clawback > 0 && (
            <MRow kind="sub" label="차감 반영" note="이전 정산 환불분">
              {formatMinusWon(clawback)}
            </MRow>
          )}
          {business ? (
            <MRow
              kind="sub"
              label={`부가세 ${formatRatio(detail.breakdown.creatorVatRate)}`}
              note="세금계산서 별도 · 자동 계산"
            >
              {computed ? formatPlusWon(computed.rewardVatAmount) : dash}
            </MRow>
          ) : (
            <MRow
              kind="sub"
              label="원천징수"
              note={`${formatRatio(
                detail.breakdown.withholdingIncomeRate +
                  detail.breakdown.withholdingLocalRate
              )} · 자동 계산`}
            >
              {computed ? formatMinusWon(computed.withholdingAmount) : dash}
            </MRow>
          )}
          <MRow kind="tot" label="실지급액(요청 시)">
            {computed ? formatWon(computed.creatorNetAmount) : dash}
          </MRow>
          <MRow kind="sub" label="원래 실지급액 대비">
            {computed && original
              ? formatSignedWon(
                  computed.creatorNetAmount - original.creatorNetAmount
                )
              : dash}
          </MRow>
        </MTable>
      </div>
      {isError && (
        <MHint>
          자동 계산을 불러오지 못했습니다 — 요청은 보낼 수 있고, 실지급액은 합의
          후 정산 화면에서 확인할 수 있습니다.
        </MHint>
      )}

      <label
        htmlFor={reasonId}
        className="mb-1 mt-[14px] block text-[12px] font-medium text-sz-n-600"
      >
        사유<span className="ml-0.5 text-sz-danger-text">*</span>
      </label>
      <MTextarea
        id={reasonId}
        aria-required
        aria-invalid={!!fieldErrors.reason}
        maxLength={ADJUSTMENT_REASON_MAX_LENGTH}
        className={cn(fieldErrors.reason && INPUT_ERROR_CLASS)}
        placeholder="금액을 조정해야 하는 이유를 적어 주세요."
        value={reason}
        onChange={event => {
          setReason(event.target.value)
          if (fieldErrors.reason) onEditField("reason")
        }}
      />
      {fieldErrors.reason && (
        <div role="alert" className="mt-[5px] text-[11px] text-sz-danger-text">
          {fieldErrors.reason}
        </div>
      )}

      <MHint className="mt-[14px]">
        근거 자료는 요청 후 <B>이슈 스레드에 올려 주세요</B>. 요청하면 이 공구
        정산이 <B>전액 보류</B>되고 브랜드와의 <B>이슈 스레드</B>가 열립니다.
        차액을 먼저 지급하지 않습니다. 브랜드가 동의하면 바로 반영되며,{" "}
        <B>10영업일</B> 안에 합의가 없으면 <B>원래 금액</B>으로 확정됩니다.
      </MHint>
    </GbModal>
  )
}
