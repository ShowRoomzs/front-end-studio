import Pagination from "@/common/components/Pagination/Pagination"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import {
  ActBtn,
  B,
  InlineBar,
  InlineItem,
  LTAB_CELL,
  LTAB_HEAD,
  LTAB_NUM,
  LTAB_ROW,
  MNote,
  MRow,
  MTable,
  Note,
  ReadRow,
  Sec,
  WaitTag,
} from "@/features/settlement/components/detail/DetailParts"
import { CONFIRM_REASON_TEXT } from "@/features/settlement/constants/params"
import { useGetSettlementItems } from "@/features/settlement/hooks/useSettlementQueries"
import type {
  AmountCount,
  SettlementDetail,
  SettlementItem,
  SettlementPayoutRow,
  SettlementTone,
} from "@/features/settlement/types"
import {
  formatFullDate,
  formatFullDateTime,
  formatMinusWon,
  formatMonthDay,
  formatMonthDayTime,
  formatPercent,
  formatPlusWon,
  formatRatio,
  formatSignedWon,
  formatWon,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"

type Props = { detail: SettlementDetail }

const isBusiness = (detail: SettlementDetail) =>
  detail.settlement.creatorBusinessType === "BUSINESS"
const hasDeduction = (detail: SettlementDetail) =>
  detail.breakdown.rewardClawbackAmount > 0
/** 원천징수 · 부가세의 기준 — 차감이 있으면 「차감 후 리워드」 */
const rewardBaseLabel = (detail: SettlementDetail) =>
  hasDeduction(detail) ? "차감 후 리워드" : "판매 리워드"
/** 원천징수율 = 소득세 + 지방소득세(서버 소수 율) */
const withholdingRatio = (detail: SettlementDetail) =>
  detail.breakdown.withholdingIncomeRate + detail.breakdown.withholdingLocalRate

/**
 * 내 몫 지급 예정일 — 서버가 내 행 기준으로 날짜 또는 문장을 준다(사업자 발행 전 「발행 확인 후 + 3영업일」 ·
 * 주민등록번호 미등록 「주민등록번호 등록 후 지급」). 날짜가 있으면 문장은 그 근거다.
 */
function payoutDue(detail: SettlementDetail) {
  const { payoutDueDate, payoutDueNote } = detail.timeline
  return payoutDueDate
    ? { value: formatFullDate(payoutDueDate), basis: payoutDueNote }
    : { value: payoutDueNote ?? "—", basis: null }
}

// ── 상단 요약 바 ─────────────────────────────────────

/** 날짜만 있으면 왜 그 날인지 알 수 없어 정산 근거를 함께 적는다 */
export function SummaryBar({ detail }: Props) {
  const { status } = detail.settlement
  const timeline = detail.timeline

  if (status === "REVIEWING") {
    return (
      <InlineBar>
        <InlineItem label="정산 생성일">
          {formatFullDate(timeline.createdAt)}
        </InlineItem>
        <InlineItem label="확인 기간">
          {formatMonthDay(timeline.createdAt)} ~{" "}
          {formatMonthDayTime(timeline.reviewDueAt)}
        </InlineItem>
        <InlineItem label="정산 근거">
          주문 전부 종결 {formatMonthDay(timeline.ordersClosedAt)}
        </InlineItem>
      </InlineBar>
    )
  }

  if (status === "ADJUSTING") {
    return (
      <InlineBar>
        <InlineItem label="정산 생성일">
          {formatFullDate(timeline.createdAt)}
        </InlineItem>
        <InlineItem label="확인 기간">
          ~ {formatMonthDayTime(timeline.reviewDueAt)}
        </InlineItem>
        <InlineItem label="지급 예정일" tone="warning">
          보류 중
        </InlineItem>
      </InlineBar>
    )
  }

  const paid = !!timeline.paidAt
  return (
    <InlineBar>
      <InlineItem
        label={
          timeline.confirmReason === "AUTO" || !timeline.confirmReason
            ? "자동 확정일"
            : "확정일"
        }
      >
        {formatFullDate(timeline.confirmedAt)}
      </InlineItem>
      <InlineItem label={paid ? "지급일" : "지급 예정일"}>
        {paid ? formatFullDate(timeline.paidAt) : payoutDue(detail).value}
      </InlineItem>
      <InlineItem label="정산 근거">
        주문 종결 {formatMonthDay(timeline.ordersClosedAt)}
        {timeline.confirmReason &&
          ` · ${CONFIRM_REASON_TEXT[timeline.confirmReason]}`}
      </InlineItem>
    </InlineBar>
  )
}

// ── 조정 협의(D2) ────────────────────────────────────

/** 시안 `.hold` — 전액 보류 경고. 액션은 [이슈 스레드 열기] 하나 */
export function AdjustmentHold(props: Props & { onOpenThread: () => void }) {
  const adjustment = props.detail.adjustment
  if (!adjustment) return null
  const mine = adjustment.requesterType === "CREATOR"

  return (
    <div className="mb-4 flex items-start gap-3 rounded-[8px] border border-sz-warning-text bg-sz-warning-bg px-4 py-[13px]">
      <div>
        <div className="mb-1 text-[12px] font-semibold text-sz-n-900">
          정산 조정 협의 중이라 지급이 보류되었습니다
        </div>
        <div className="text-[11px] leading-[1.7] text-sz-n-700">
          {mine ? "내가 보낸 " : "브랜드가 보낸 "}
          <B className="text-sz-n-900">정산 조정 요청</B>에 대해{" "}
          {mine ? "브랜드와 " : ""}
          <B className="text-sz-n-900">이슈 스레드</B>에서 협의하고 있습니다 ·{" "}
          <B className="text-sz-n-900">양측이 합의하면 그 금액으로 바로 반영</B>
          되고,{" "}
          <B className="text-sz-n-900">
            합의 기한({formatMonthDay(adjustment.deadlineAt)})
          </B>
          까지 합의가 없으면 <B className="text-sz-n-900">원래 금액</B>으로
          확정됩니다 · 금액은 양측 합의로만 바뀌며 운영팀은 열람만 합니다.
        </div>
      </div>
      <div className="ml-auto shrink-0">
        <Btn variant="secondary" onClick={props.onOpenThread}>
          이슈 스레드 열기
        </Btn>
      </div>
    </div>
  )
}

const TONE_TEXT_CLASS: Partial<Record<SettlementTone, string>> = {
  WARNING: "text-sz-warning-text",
  INFO: "text-sz-info-text",
  SUCCESS: "text-sz-success-text",
  DANGER: "text-sz-danger-text",
}

/**
 * 조정 내역 — 스레드를 열지 않고도 어디까지 왔는지(요청 · 최근 제안 · 내 차례인지 · 합의 기한).
 * 서버는 협의가 끝난 뒤에도 이력으로 내린다 — 종결이면 결과(합의 금액 · 원래 금액)를 남긴다.
 * 응답 버튼은 두지 않는다 — 같은 행동이 두 화면에 있으면 어느 쪽이 기록인지 흐려진다.
 */
export function AdjustmentCard({ detail }: Props) {
  const adjustment = detail.adjustment
  if (!adjustment) return null
  const original = adjustment.originalRewardAmount
  const open = adjustment.status === "OPEN"
  const diff = (reward: number) => (
    <>
      {" "}
      <MNote inline>{formatSignedWon(reward - original)}</MNote>
    </>
  )
  const partyName = (mine: boolean) => (mine ? "내" : "브랜드")
  const requesterMine = adjustment.requesterType === "CREATOR"
  const myName =
    detail.payouts.rows.find(row => row.payee === "CREATOR")?.name ?? "나"
  const first = adjustment.proposals.find(item => item.seq === 1) ?? null
  const latest =
    adjustment.proposals.length > 1
      ? adjustment.proposals[adjustment.proposals.length - 1]
      : null

  return (
    <Sec
      title="조정 내역"
      note={
        open
          ? "이슈 스레드 진행 현황 · 조회 전용"
          : `이슈 스레드 이력 · ${adjustment.statusLabel}`
      }
    >
      <MTable>
        <MRow label="요청" textValue valueClassName="normal-nums">
          {requesterMine ? `${myName}(나)` : detail.settlement.brandName} ·{" "}
          {formatFullDateTime(adjustment.openedAt)}
        </MRow>
        <MRow label="원래 리워드">{formatWon(original)}</MRow>
        {first && (
          <MRow label={`${partyName(first.mine)} 요청 금액`}>
            {formatWon(first.rewardAmount)}
            {diff(first.rewardAmount)}
          </MRow>
        )}
        {latest && (
          <MRow
            label={`${partyName(latest.mine)} 제안`}
            note={`최근 · ${formatMonthDayTime(latest.proposedAt)}`}
          >
            {formatWon(latest.rewardAmount)}
            {diff(latest.rewardAmount)}
          </MRow>
        )}
        {adjustment.agreedRewardAmount !== null && (
          <MRow label="합의 금액">
            {formatWon(adjustment.agreedRewardAmount)}
            {diff(adjustment.agreedRewardAmount)}
          </MRow>
        )}
        <MRow
          label="진행"
          valueClassName={cn(
            "font-semibold",
            TONE_TEXT_CLASS[open ? adjustment.turnTone : "NEUTRAL"]
          )}
        >
          {open ? adjustment.turnLabel : adjustment.statusLabel}
        </MRow>
        <MRow kind="tot" label="합의 기한">
          {formatFullDate(adjustment.deadlineAt)}
          {adjustment.remainingBusinessDays !== null &&
            ` · D-${adjustment.remainingBusinessDays}`}
        </MRow>
      </MTable>
      {open && (
        <Note>
          응답(동의 · 다른 금액 제안 · 반대)은 <B>이슈 스레드에서만</B> 할 수
          있습니다 — 이 화면은 진행 상황을 보여주기만 합니다.
        </Note>
      )}
    </Sec>
  )
}

// ── 금액 ─────────────────────────────────────────────

function DeductRow(props: { label: string; value: AmountCount }) {
  if (props.value.count === 0) return null
  return (
    <MRow kind="sub" label={props.label} note={`${props.value.count}건`}>
      {formatMinusWon(props.value.amount)}
    </MRow>
  )
}

/**
 * 내 리워드 분해 — 확정 거래액 → 리워드율 → 판매 리워드 → (차감) → 원천징수 | 부가세 → 실지급액.
 * 플랫폼 · PG 수수료 행은 서버가 내리지 않는다 — 내 리워드에서 빠지는 돈처럼 읽힌다(§44-1 #1).
 */
export function BreakdownCard({ detail }: Props) {
  const b = detail.breakdown
  const business = isBusiness(detail)
  const status = detail.settlement.status
  const adjusting = status === "ADJUSTING"
  const deducted = hasDeduction(detail)
  const clawbackCount = detail.clawbacks.length
  // 합의 확정이면 판매 리워드가 원래 금액과 다르다
  const changed = b.rewardAmount !== b.originalRewardAmount

  const caption =
    status === "REVIEWING"
      ? "주문 종결 기준 확정 금액 · 확인 기간 중"
      : adjusting
        ? "원래 금액 · 합의 결과에 따라 바뀝니다"
        : deducted
          ? `확정 · 차감 반영 ${clawbackCount}건`
          : "확정"

  const multiRate = b.rewardRates.length > 1
  const rateNote = multiRate
    ? `상품별 계약 확정값 · ${b.rewardRates
        .map(item => `${item.productName} ${formatPercent(item.rate)}`)
        .join(" · ")}`
    : "계약 확정값 · 상품별로 다를 수 있습니다"

  const withholdingNote = deducted
    ? `차감 후 금액(${formatWon(b.rewardAfterClawback)})으로 원천징수 · ${formatRatio(withholdingRatio(detail))}`
    : `소득세 ${formatRatio(b.withholdingIncomeRate)} + 지방세 ${formatRatio(b.withholdingLocalRate)} · 비사업자`

  const rewardNote = adjusting
    ? "원래 금액 · 합의 결과에 따라 바뀝니다"
    : changed
      ? `조정 합의 반영 · 원래 ${formatWon(b.originalRewardAmount)}`
      : undefined

  return (
    <Sec title="내 리워드 분해" note={caption}>
      <MTable>
        <MRow label="총 주문 금액">{formatWon(b.grossOrderAmount)}</MRow>
        <DeductRow label="취소 차감" value={b.cancel} />
        <DeductRow label="반품 차감" value={b.return} />
        <DeductRow label="배송 예외 차감" value={b.deliveryException} />
        <MRow kind="mid" label="확정 거래액">
          {formatWon(b.confirmedSalesAmount)}
        </MRow>
        <MRow kind="rate" label="리워드율" note={rateNote}>
          {b.rewardRateLabel ?? "—"}
        </MRow>
        <MRow kind="mid" label="판매 리워드" note={rewardNote}>
          {formatWon(b.rewardAmount)}
        </MRow>
        {deducted && (
          <>
            <MRow
              kind="sub"
              label="차감 반영"
              note={`이전 정산 · 구매확정 후 하자 환불 ${clawbackCount}건 · 아래 내역`}
            >
              {formatMinusWon(b.rewardClawbackAmount)}
            </MRow>
            <MRow kind="mid" label="차감 후 리워드">
              {formatWon(b.rewardAfterClawback)}
            </MRow>
          </>
        )}
        {business ? (
          <MRow
            kind="sub"
            label={`부가세 ${formatRatio(b.creatorVatRate)}`}
            note={`세금계산서 별도 · 공급가 = ${rewardBaseLabel(detail)} · 사업자는 원천징수 없음`}
          >
            {formatPlusWon(b.creatorVatAmount)}
          </MRow>
        ) : (
          <MRow kind="sub" label="원천징수" note={withholdingNote}>
            {formatMinusWon(b.withholdingAmount)}
          </MRow>
        )}
        <MRow
          kind="tot"
          label="실지급액"
          note={
            adjusting
              ? "원래 금액 기준"
              : business
                ? "리워드 + 부가세 = 세금계산서 합계"
                : undefined
          }
        >
          {formatWon(b.creatorPayoutAmount)}
        </MRow>
      </MTable>
      <Note>
        <B>플랫폼 수수료와 PG 결제 수수료는 내 리워드에서 차감되지 않습니다</B>{" "}
        — 소비자 결제금에서 브랜드 몫에 대해 처리되는 비용입니다.{" "}
        {business ? (
          <>
            사업자는{" "}
            <B>원천징수 없이 부가세 {formatRatio(b.creatorVatRate)}를 더해</B>{" "}
            받습니다.
          </>
        ) : deducted ? (
          <>
            내 리워드에서 빠지는 것은 <B>원천징수</B>와 아래 <B>차감 반영</B>
            뿐입니다.
          </>
        ) : (
          <>
            내 리워드에서 빠지는 것은 <B>원천징수</B>뿐입니다.
          </>
        )}
        <br />
        <B>
          교환 · 반려 재발송비는 브랜드 몫이라 리워드 계산에 포함되지 않습니다.
        </B>
        <br />
        <B>정산이 끝난 뒤</B> 구매확정 상품의 하자로 환불이 생기면, 그 주문분
        리워드는 <B>다음 정산에서 자동 차감</B>됩니다.
      </Note>
    </Sec>
  )
}

/** D3 — 차감은 다른 공구에서 넘어온 값이라 「왜 깎였는지」를 이 블록에서 끝까지 추적한다 */
export function DeductionCard({ detail }: Props) {
  if (detail.clawbacks.length === 0) return null
  const business = isBusiness(detail)

  return (
    <Sec title="차감 반영" note="정산이 끝난 뒤 환불된 건 · 자동 차감">
      <table className="w-full border-collapse text-[12px]">
        <colgroup>
          <col style={{ width: 124 }} />
          <col />
          <col />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead>
          <tr>
            <th className={LTAB_HEAD}>대상 주문</th>
            <th className={LTAB_HEAD}>원 공구</th>
            <th className={LTAB_HEAD}>사유</th>
            <th className={cn(LTAB_HEAD, "text-right")}>환불 금액</th>
            <th className={cn(LTAB_HEAD, "text-right")}>차감 리워드</th>
          </tr>
        </thead>
        <tbody>
          {detail.clawbacks.map(item => (
            <tr key={item.clawbackNumber} className={LTAB_ROW}>
              <td className={cn(LTAB_CELL, "tabular-nums")}>
                {item.orderNumber}
              </td>
              <td className={LTAB_CELL}>
                {item.originGroupBuyTitle ?? "—"}{" "}
                {item.originSettlementPaidAt && (
                  <MNote>
                    {formatMonthDay(item.originSettlementPaidAt)} 지급 완료
                  </MNote>
                )}
              </td>
              <td className={LTAB_CELL}>
                {item.reasonLabel} ·{" "}
                <B>
                  {business
                    ? "차감 후 금액으로 세금계산서 발행"
                    : "차감 후 금액으로 원천징수"}
                </B>{" "}
                <MNote>{formatFullDate(item.createdAt)} · 차감 발생</MNote>
              </td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>
                {formatWon(item.refundAmount)}
              </td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>
                <B>{formatMinusWon(item.amount)}</B>
                {item.rewardRate !== null && (
                  <MNote>
                    {formatWon(item.refundAmount)} ×{" "}
                    {formatPercent(item.rewardRate)}
                  </MNote>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        이미 지급된 정산에서 <B>구매확정 후 하자로 환불</B>이 생기면, 그 주문분
        리워드는 <B>다음 정산의 리워드에서 자동 차감</B>됩니다 — 이미 받은 돈을
        돌려보낼 필요는 없습니다.{" "}
        {business ? "세금계산서 공급가는" : "원천징수는"} <B>차감 후 리워드</B>
        를 기준으로 계산합니다. <WaitTag>[자문대기-법률 J]</WaitTag> 차감 근거
        조항.
      </Note>
    </Sec>
  )
}

// ── 분배 · 지급 ──────────────────────────────────────

/**
 * 내 행 상태 색 — 내 돈이 멈춘 상태(보류 · 발행 필요 · 지급 확인 중)는 경고, 세금계산서 반려만 위험.
 * 문구는 서버 `statusLabel` 그대로다.
 */
function myRowToneClass(detail: SettlementDetail, row: SettlementPayoutRow) {
  if (row.status === "BLOCKED") {
    return detail.taxInvoice?.cardStatus === "REJECTED"
      ? "text-sz-danger-text"
      : "text-sz-warning-text"
  }
  if (row.status === "HELD" || row.status === "FAILED") {
    return "text-sz-warning-text"
  }
  return undefined
}

/**
 * 3자 분배 — PG가 몫별로 직접 지급한다는 사실은 수취자에게 더 중요하다(돈이 안 들어왔을 때
 * 누구에게 물어야 하는지). 서버가 내 행을 첫 행으로 내리고 브랜드 · 플랫폼은 회색 보조다(§44-1 #2).
 */
export function DistributionCard({ detail }: Props) {
  const business = isBusiness(detail)
  const adjusting = detail.settlement.status === "ADJUSTING"

  return (
    <Sec
      title="3자 분배 내역"
      note="지급자 SHOWROOMZ · PG 분배"
      className="mb-0"
    >
      <table className="w-full border-collapse text-[12px]">
        <colgroup>
          <col style={{ width: 100 }} />
          <col />
          <col style={{ width: 128 }} />
        </colgroup>
        <thead>
          <tr>
            <th className={LTAB_HEAD}>수령자</th>
            <th className={cn(LTAB_HEAD, "text-right")}>지급 금액</th>
            <th className={LTAB_HEAD}>지급 상태</th>
          </tr>
        </thead>
        <tbody>
          {detail.payouts.rows.map(row => {
            if (row.payee === "CREATOR") {
              return (
                <tr key={row.payee} className={LTAB_ROW}>
                  <td className={LTAB_CELL}>
                    {row.payeeLabel}
                    <MNote>나</MNote>
                  </td>
                  <td className={cn(LTAB_CELL, LTAB_NUM)}>
                    <B>{formatWon(row.amount)}</B>
                    <MNote>
                      {adjusting ? "원래 금액 기준 · 합의 시 재계산" : row.note}
                    </MNote>
                  </td>
                  <td className={cn(LTAB_CELL, myRowToneClass(detail, row))}>
                    {row.statusLabel}
                  </td>
                </tr>
              )
            }
            // 플랫폼 행의 상태 칸은 서버 note(「플랫폼 신고 · 납부」 · 「부가세는 인플루언서에게 지급」)다
            const platform = row.payee === "PLATFORM"
            return (
              <tr key={row.payee} className={LTAB_ROW}>
                <td className={LTAB_CELL}>
                  {row.payeeLabel}
                  {!platform && <MNote>{row.name}</MNote>}
                </td>
                <td className={cn(LTAB_CELL, LTAB_NUM, "text-sz-n-500")}>
                  {formatWon(row.amount)}
                  {platform && !business && <MNote>리워드 부가세</MNote>}
                </td>
                <td className={cn(LTAB_CELL, "text-sz-n-500")}>
                  {platform ? (row.note ?? row.statusLabel) : row.statusLabel}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Note>
        {adjusting ? (
          <>
            보류 중에는 <B>양측 모두 지급이 멈춥니다</B>. 소비자 결제금은 PG사에
            그대로 남아 있으며 금액이 정해지면 분배됩니다 —{" "}
            <B>차액을 먼저 지급하지 않습니다</B>.
          </>
        ) : (
          <>
            <B>내 리워드는 SHOWROOMZ가 지급합니다</B> — 브랜드가 지급하지
            않습니다. 소비자 결제금은 PG사에서 몫별로 분배되고,{" "}
            {business ? (
              <>
                사업자인 내 몫은 SHOWROOMZ가{" "}
                <B>세금계산서 확인 후 부가세를 더해</B> 내 계좌로 입금합니다.
              </>
            ) : (
              <>
                내 몫은 SHOWROOMZ가 <B>원천징수(비사업자)한 뒤</B> 내 계좌로
                입금합니다.
              </>
            )}
          </>
        )}
      </Note>
    </Sec>
  )
}

/** 지급 정보 — 지급 예정일 옆에 계산 근거(서버 문장 「자동 확정 10.06 + 3영업일」)를 함께 적는다(§41-5) */
export function PayoutInfoCard(props: Props & { onOpenAccount: () => void }) {
  const { detail, onOpenAccount } = props
  const payment = detail.payment
  const timeline = detail.timeline
  const status = detail.settlement.status
  const business = isBusiness(detail)
  const paidAt = payment?.paidAt ?? timeline.paidAt

  let scheduled: ReactNode
  let scheduledSub: ReactNode = null
  if (status === "REVIEWING") {
    // 확인 중에는 서버가 지급 예정일을 내리지 않는다 — 확정일이 아직 가정값이다(설계서 8-1 #10)
    scheduled = "확정 후 표시"
    scheduledSub = business
      ? `요청이 없으면 ${formatMonthDayTime(timeline.reviewDueAt)} 마감 뒤 자동 확정 · 세금계산서 확인 후 지급`
      : `요청이 없으면 ${formatMonthDayTime(timeline.reviewDueAt)} 마감 뒤 자동 확정`
  } else if (status === "ADJUSTING") {
    scheduled = <span className="text-sz-warning-text">보류 중</span>
    scheduledSub = "합의 · 기한 만료 후 다음 지급일"
  } else {
    const due = payoutDue(detail)
    scheduled = due.value
    scheduledSub = due.basis
  }

  return (
    <Sec title="지급 정보" className="mb-0">
      {payment?.accountNumberMasked ? (
        <ReadRow
          label="입금 계좌"
          sub={
            <>
              {payment.accountHolder && <>예금주 {payment.accountHolder} · </>}
              <button
                type="button"
                className={FLINK_CLASS}
                onClick={onOpenAccount}
              >
                입금 계좌 변경은 기본정보 관리에서
              </button>
            </>
          }
        >
          {payment.bankName} {payment.accountNumberMasked}
        </ReadRow>
      ) : (
        <ReadRow
          label="입금 계좌"
          muted
          sub={
            <button
              type="button"
              className={FLINK_CLASS}
              onClick={onOpenAccount}
            >
              기본정보 관리에서 입금 계좌를 등록해 주세요
            </button>
          }
        >
          등록된 계좌 없음
        </ReadRow>
      )}
      <ReadRow label="지급 예정일" sub={scheduledSub}>
        <span className="tabular-nums">{scheduled}</span>
      </ReadRow>
      <ReadRow label="실지급일" muted={!paidAt}>
        <span className="tabular-nums">{formatFullDate(paidAt)}</span>
      </ReadRow>
      <ReadRow label="PG 거래 참조번호" muted={!payment?.pgReference}>
        <span className="tabular-nums">
          {payment?.pgReference ?? "지급 시 생성"}
        </span>
      </ReadRow>
    </Sec>
  )
}

// ── 증빙 ─────────────────────────────────────────────

/**
 * 원천징수(비사업자) — 한 건짜리라 표가 아니라 인라인 요약 바로 둔다(시안 HEAD [한 줄짜리 표]).
 * 영수증은 지급 완료 뒤 서버가 비동기로 만든다 — `receiptAvailable` 전에는 [다운로드] 비활성.
 */
export function WithholdingCard(
  props: Props & { onDownload: () => void; isDownloading: boolean }
) {
  const { detail, onDownload, isDownloading } = props
  const withholding = detail.withholding
  if (!withholding) return null
  const status = detail.settlement.status
  const paid = status === "PAID"
  const phase =
    status === "ADJUSTING" ? "지급 보류" : paid ? "지급 완료" : "지급 전"
  const rate = formatRatio(withholdingRatio(detail))

  return (
    <Sec
      title="원천징수"
      note={`비사업자 · ${phase}${hasDeduction(detail) ? " · 차감 후 금액 기준" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-7">
        <InlineItem label="증빙">원천징수영수증</InlineItem>
        <InlineItem label="발행">{withholding.receiptIssuer}</InlineItem>
        <InlineItem label={withholding.receiptLabel}>
          {formatWon(withholding.amount)}
        </InlineItem>
        <span className="ml-auto flex">
          <ActBtn
            disabled={!withholding.receiptAvailable || isDownloading}
            onClick={onDownload}
          >
            다운로드
          </ActBtn>
        </span>
      </div>
      <Note>
        <B>
          {withholding.receiptIssuer}가 {rate}
        </B>
        (소득세 · 지방소득세)<B>를 원천징수하고 신고 · 납부</B>합니다.
        원천징수영수증은 <B>지급 완료 시 자동 발급</B>
        {withholding.receiptAvailable
          ? "됩니다"
          : paid
            ? "되며 지금 만드는 중입니다 — 잠시 후 내려받을 수 있습니다"
            : "되며 그 전에는 내려받을 수 없습니다"}{" "}
        · 한 해 내역은 목록의 <B>[연간 지급 내역]</B>에서 종합소득세 신고용으로
        받을 수 있습니다.
      </Note>
    </Sec>
  )
}

// ── 명세 ─────────────────────────────────────────────

function StatementRows(props: { rows: Array<SettlementItem> }) {
  return (
    <>
      {props.rows.map((row, index) => (
        <tr
          // 한 주문에 상품이 여럿이면 주문번호가 겹친다
          key={`${row.orderNumber}-${index}`}
          className={cn(
            LTAB_ROW,
            row.status !== "CONFIRMED" && "text-sz-n-500"
          )}
        >
          <td className={cn(LTAB_CELL, "tabular-nums")}>{row.orderNumber}</td>
          <td className={LTAB_CELL}>
            {row.productName}
            {row.optionName && ` / ${row.optionName}`}
          </td>
          <td className={cn(LTAB_CELL, LTAB_NUM)}>
            {row.quantity}
            {row.settledQuantity !== row.quantity && (
              <MNote>반영 {row.settledQuantity}</MNote>
            )}
          </td>
          <td className={cn(LTAB_CELL, LTAB_NUM)}>
            {formatWon(row.paidAmount)}
          </td>
          <td className={LTAB_CELL}>{row.statusLabel}</td>
          <td className={cn(LTAB_CELL, LTAB_NUM)}>
            {formatWon(row.settledAmount)}
          </td>
          <td className={cn(LTAB_CELL, LTAB_NUM)}>
            {formatWon(row.rewardAmount)}
          </td>
        </tr>
      ))}
    </>
  )
}

/**
 * 정산 명세 — 소비자 열 없음 · 「내 리워드」 열로 주문 단위 검산(§44-1 #3).
 * 미리보기 5건 뒤의 전체는 [전체 N건 보기]로 이 자리에서 펼친다 — 명세 조회는 확인 기간 중에도 열려
 * 있어서(다운로드는 확정 후) 확인 기간에 검산할 길이 이것뿐이다.
 */
export function StatementCard(
  props: Props & { onDownload: () => void; isDownloading: boolean }
) {
  const { detail, onDownload, isDownloading } = props
  const { preview, totalCount, downloadAvailable } = detail.items
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const { data: itemPage, isFetching } = useGetSettlementItems(
    detail.settlement.settlementId,
    page,
    expanded
  )
  const pageInfo = usePaginationInfo({
    data: itemPage?.pageInfo,
    onPageChange: setPage,
  })
  const rows = expanded && itemPage ? itemPage.content : preview
  const canExpand = totalCount > preview.length

  return (
    <Sec
      title="정산 명세"
      note={
        expanded
          ? `주문 단위 · 전체 ${totalCount}건`
          : `주문 단위 · 미리보기 ${preview.length}건${canExpand ? ` / 전체 ${totalCount}건` : ""}`
      }
      right={
        canExpand ? (
          <ActBtn
            disabled={expanded && isFetching && !itemPage}
            onClick={() => {
              setExpanded(value => !value)
              setPage(1)
            }}
          >
            {expanded ? "미리보기로 접기" : `전체 ${totalCount}건 보기`}
          </ActBtn>
        ) : undefined
      }
    >
      <table className="w-full border-collapse text-[12px]">
        <colgroup>
          <col style={{ width: 124 }} />
          <col />
          <col style={{ width: 56 }} />
          <col style={{ width: 104 }} />
          <col style={{ width: 82 }} />
          <col style={{ width: 116 }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead>
          <tr>
            <th className={LTAB_HEAD}>주문번호</th>
            <th className={LTAB_HEAD}>상품 · 옵션</th>
            <th className={cn(LTAB_HEAD, "text-right")}>수량</th>
            <th className={cn(LTAB_HEAD, "text-right")}>결제금액</th>
            <th className={LTAB_HEAD}>상태</th>
            <th className={cn(LTAB_HEAD, "text-right")}>정산 반영액</th>
            <th className={cn(LTAB_HEAD, "text-right")}>내 리워드</th>
          </tr>
        </thead>
        <tbody>
          <StatementRows rows={rows} />
        </tbody>
      </table>
      {expanded && pageInfo.totalPages > 1 && (
        <div className="mt-3 flex justify-center">
          <Pagination {...pageInfo} />
        </div>
      )}
      <div className="mt-3 flex items-center gap-2.5">
        <Note className="mt-0 flex-1">
          <B>정산 반영액 = 상품 결제금액 기준</B> — 교환 · 반려 재발송비는
          포함되지 않습니다 · 취소 · 반품 건은 정산 반영액과 내 리워드가{" "}
          <B>0원</B>입니다 · <B>소비자 정보는 표시되지 않습니다</B>.
          {!downloadAvailable && (
            <>
              {" "}
              전체 명세 파일은 <B>정산이 확정된 뒤</B> 내려받을 수 있습니다.
            </>
          )}
        </Note>
        <Btn
          variant="secondary"
          disabled={!downloadAvailable}
          isLoading={isDownloading}
          onClick={onDownload}
        >
          전체 명세 다운로드
        </Btn>
      </div>
    </Sec>
  )
}
