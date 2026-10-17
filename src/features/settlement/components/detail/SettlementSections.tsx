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
import { STATEMENT_LINE_LABEL } from "@/features/settlement/constants/params"
import type {
  ConfirmBasis,
  CountAmount,
  SettlementDetail,
} from "@/features/settlement/types"
import {
  formatFullDate,
  formatFullDateTime,
  formatMinusWon,
  formatMonthDay,
  formatMonthDayTime,
  formatPercent,
  formatPlusWon,
  formatSignedWon,
  formatWon,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type Props = { detail: SettlementDetail }

const isBusiness = (detail: SettlementDetail) => detail.taxType === "BUSINESS"
const hasDeduction = (detail: SettlementDetail) =>
  detail.breakdown.deductionAmount > 0
/** 원천징수 · 부가세의 기준 — 차감이 있으면 「차감 후 리워드」 */
const rewardBaseLabel = (detail: SettlementDetail) =>
  hasDeduction(detail) ? "차감 후 리워드" : "판매 리워드"

const CONFIRM_BASIS_TEXT: Record<ConfirmBasis, string> = {
  NO_REQUEST: "확인 기간 중 요청 없음",
  AGREED: "조정 합의로 확정",
  EXPIRED: "합의 기한 경과 · 원래 금액 확정",
}

/**
 * 사업자는 세금계산서 확인 전까지 내 몫의 지급일이 없다(§44-4) — 「발행 확인 후 + 3영업일」.
 * 확인 완료면 null을 돌려주고 호출부가 날짜를 쓴다.
 */
function businessPayoutPending(detail: SettlementDetail): string | null {
  if (!isBusiness(detail)) return null
  const lag = detail.payoutLagBusinessDays
  switch (detail.taxInvoice?.status) {
    case "REVIEWING":
      return `확인 후 + ${lag}영업일`
    case "REJECTED":
      return `재제출 확인 후 + ${lag}영업일`
    case "APPROVED":
      return null
    default:
      return `발행 확인 후 + ${lag}영업일`
  }
}

// ── 상단 요약 바 ─────────────────────────────────────

/** 날짜만 있으면 왜 그 날인지 알 수 없어 정산 근거를 함께 적는다 */
export function SummaryBar({ detail }: Props) {
  if (detail.status === "CONFIRMING") {
    return (
      <InlineBar>
        <InlineItem label="정산 생성일">
          {formatFullDate(detail.createdAt)}
        </InlineItem>
        <InlineItem label="확인 기간">
          {formatMonthDay(detail.createdAt)} ~{" "}
          {formatMonthDayTime(detail.confirmDeadlineAt)} ·{" "}
          {detail.confirmBusinessDays}영업일
        </InlineItem>
        <InlineItem label="정산 근거">
          주문 전부 종결 {formatMonthDay(detail.ordersClosedAt)}
        </InlineItem>
      </InlineBar>
    )
  }

  if (detail.status === "ADJUSTING") {
    return (
      <InlineBar>
        <InlineItem label="정산 생성일">
          {formatFullDate(detail.createdAt)}
        </InlineItem>
        <InlineItem label="확인 기간">
          ~ {formatMonthDayTime(detail.confirmDeadlineAt)}
        </InlineItem>
        <InlineItem label="지급 예정일" tone="warning">
          보류 중
        </InlineItem>
      </InlineBar>
    )
  }

  const paid = detail.status === "PAID"
  const pending = paid ? null : businessPayoutPending(detail)
  return (
    <InlineBar>
      <InlineItem
        label={
          detail.confirmBasis === "NO_REQUEST" || !detail.confirmBasis
            ? "자동 확정일"
            : "확정일"
        }
      >
        {formatFullDate(detail.confirmedAt)}
      </InlineItem>
      <InlineItem label={paid ? "지급일" : "지급 예정일"}>
        {paid
          ? formatFullDate(detail.payout.paidDate)
          : (pending ?? formatFullDate(detail.payout.scheduledDate))}
      </InlineItem>
      <InlineItem label="정산 근거">
        주문 종결 {formatMonthDay(detail.ordersClosedAt)}
        {detail.confirmBasis && ` · ${CONFIRM_BASIS_TEXT[detail.confirmBasis]}`}
      </InlineItem>
    </InlineBar>
  )
}

// ── 조정 협의(D2) ────────────────────────────────────

/** 시안 `.hold` — 전액 보류 경고. 액션은 [이슈 스레드 열기] 하나 */
export function AdjustmentHold(props: Props & { onOpenThread: () => void }) {
  const adjustment = props.detail.adjustment
  if (!adjustment) return null
  const mine = adjustment.requestedBy === "ME"

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

/**
 * 조정 내역 — 스레드를 열지 않고도 어디까지 왔는지(요청 · 최근 제안 · 내 차례인지 · 합의 기한).
 * 응답 버튼은 두지 않는다 — 같은 행동이 두 화면에 있으면 어느 쪽이 기록인지 흐려진다.
 */
export function AdjustmentCard({ detail }: Props) {
  const adjustment = detail.adjustment
  if (!adjustment) return null
  const original = adjustment.originalReward
  const diff = (reward: number) => (
    <>
      {" "}
      <MNote inline>{formatSignedWon(reward - original)}</MNote>
    </>
  )
  const partyName = (by: "ME" | "BRAND") => (by === "ME" ? "내" : "브랜드")
  const proposal = adjustment.latestProposal

  return (
    <Sec title="조정 내역" note="이슈 스레드 진행 현황 · 조회 전용">
      <MTable>
        <MRow label="요청" textValue valueClassName="normal-nums">
          {adjustment.requesterName}
          {adjustment.requestedBy === "ME" && "(나)"} ·{" "}
          {formatFullDateTime(adjustment.requestedAt)}
        </MRow>
        <MRow label="원래 리워드">{formatWon(original)}</MRow>
        <MRow label={`${partyName(adjustment.requestedBy)} 요청 금액`}>
          {formatWon(adjustment.requestedReward)}
          {diff(adjustment.requestedReward)}
        </MRow>
        {proposal && (
          <MRow
            label={`${partyName(proposal.by)} 제안`}
            note={`최근 · ${formatMonthDayTime(proposal.proposedAt)}`}
          >
            {formatWon(proposal.reward)}
            {diff(proposal.reward)}
          </MRow>
        )}
        <MRow
          label="진행"
          valueClassName={cn(
            "font-semibold",
            adjustment.myTurn ? "text-sz-warning-text" : "text-sz-info-text"
          )}
        >
          {adjustment.myTurn ? "내 응답 필요" : "상대 응답 대기"}
        </MRow>
        <MRow kind="tot" label="합의 기한">
          {formatFullDate(adjustment.deadlineAt)} · D-
          {adjustment.remainingBusinessDays}
        </MRow>
      </MTable>
      <Note>
        응답(동의 · 다른 금액 제안 · 반대)은 <B>이슈 스레드에서만</B> 할 수
        있습니다 — 이 화면은 진행 상황을 보여주기만 합니다.
      </Note>
    </Sec>
  )
}

// ── 금액 ─────────────────────────────────────────────

function DeductRow(props: { label: string; value: CountAmount }) {
  if (props.value.count === 0) return null
  return (
    <MRow kind="sub" label={props.label} note={`${props.value.count}건`}>
      {formatMinusWon(props.value.amount)}
    </MRow>
  )
}

/**
 * 내 리워드 분해 — 확정 거래액 → 리워드율 → 판매 리워드 → (차감) → 원천징수 | 부가세 → 실지급액.
 * 플랫폼 · PG 수수료 행은 넣지 않는다 — 내 리워드에서 빠지는 돈처럼 읽힌다(§44-1 #1).
 */
export function BreakdownCard({ detail }: Props) {
  const b = detail.breakdown
  const rates = detail.taxRates
  const business = isBusiness(detail)
  const adjusting = detail.status === "ADJUSTING"
  const deducted = hasDeduction(detail)

  const caption =
    detail.status === "CONFIRMING"
      ? "주문 종결 기준 확정 금액 · 확인 기간 중"
      : adjusting
        ? "원래 금액 · 합의 결과에 따라 바뀝니다"
        : deducted
          ? `확정 · 차감 반영 ${detail.deductions.length}건`
          : "확정"

  const rateNote =
    b.rewardRate === null
      ? `상품별 계약 확정값 · ${b.productRates
          .map(item => `${item.productName} ${formatPercent(item.rate)}`)
          .join(" · ")}`
      : "계약 확정값 · 상품별로 다를 수 있습니다"

  const withholdingNote = deducted
    ? `차감 후 금액(${formatWon(b.rewardAfterDeduction)})으로 원천징수 · ${formatPercent(rates.withholdingRate)}`
    : `소득세 ${formatPercent(rates.incomeTaxRate)} + 지방세 ${formatPercent(rates.localIncomeTaxRate)} · 비사업자`

  return (
    <Sec title="내 리워드 분해" note={caption}>
      <MTable>
        <MRow label="총 주문 금액">{formatWon(b.totalOrderAmount)}</MRow>
        <DeductRow label="취소 차감" value={b.cancel} />
        <DeductRow label="반품 차감" value={b.return} />
        <DeductRow label="배송 예외 차감" value={b.deliveryException} />
        <MRow kind="mid" label="확정 거래액">
          {formatWon(b.confirmedSales)}
        </MRow>
        <MRow kind="rate" label="리워드율" note={rateNote}>
          {b.rewardRate === null ? "상품별" : formatPercent(b.rewardRate)}
        </MRow>
        <MRow
          kind="mid"
          label="판매 리워드"
          note={adjusting ? "원래 금액 · 합의 결과에 따라 바뀝니다" : undefined}
        >
          {formatWon(b.saleReward)}
        </MRow>
        {deducted && (
          <>
            <MRow
              kind="sub"
              label="차감 반영"
              note={`이전 정산 · 구매확정 후 하자 환불 ${detail.deductions.length}건 · 아래 내역`}
            >
              {formatMinusWon(b.deductionAmount)}
            </MRow>
            <MRow kind="mid" label="차감 후 리워드">
              {formatWon(b.rewardAfterDeduction)}
            </MRow>
          </>
        )}
        {business ? (
          <MRow
            kind="sub"
            label={`부가세 ${formatPercent(rates.vatRate)}`}
            note={`세금계산서 별도 · 공급가 = ${rewardBaseLabel(detail)} · 사업자는 원천징수 없음`}
          >
            {formatPlusWon(b.vatAmount)}
          </MRow>
        ) : (
          <MRow kind="sub" label="원천징수" note={withholdingNote}>
            {formatMinusWon(b.withholdingTax)}
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
          {formatWon(b.payoutAmount)}
        </MRow>
      </MTable>
      <Note>
        <B>플랫폼 수수료와 PG 결제 수수료는 내 리워드에서 차감되지 않습니다</B>{" "}
        — 소비자 결제금에서 브랜드 몫에 대해 처리되는 비용입니다.{" "}
        {business ? (
          <>
            사업자는{" "}
            <B>원천징수 없이 부가세 {formatPercent(rates.vatRate)}를 더해</B>{" "}
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
  if (detail.deductions.length === 0) return null
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
          {detail.deductions.map(item => (
            <tr key={item.clawbackNo} className={LTAB_ROW}>
              <td className={cn(LTAB_CELL, "tabular-nums")}>{item.orderNo}</td>
              <td className={LTAB_CELL}>
                {item.sourceGroupBuyTitle}{" "}
                {item.sourcePaidAt && (
                  <MNote>{formatMonthDay(item.sourcePaidAt)} 지급 완료</MNote>
                )}
              </td>
              <td className={LTAB_CELL}>
                {item.reason} ·{" "}
                <B>
                  {business
                    ? "차감 후 금액으로 세금계산서 발행"
                    : "차감 후 금액으로 원천징수"}
                </B>{" "}
                <MNote>
                  {formatFullDate(item.openedAt)} · 운영자 반품 개설
                </MNote>
              </td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>
                {formatWon(item.refundAmount)}
              </td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>
                <B>{formatMinusWon(item.deductedReward)}</B>
                <MNote>
                  {formatWon(item.refundAmount)} ×{" "}
                  {formatPercent(item.rewardRate)}
                </MNote>
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

function myPayoutStatus(detail: SettlementDetail): {
  text: string
  tone?: "warning" | "danger"
} {
  switch (detail.status) {
    case "CONFIRMING":
      return { text: "확인 기간 후 지급" }
    case "ADJUSTING":
      return { text: "보류 중", tone: "warning" }
    case "PAID":
      return { text: `${formatMonthDay(detail.payout.paidDate)} 지급 완료` }
    default:
      break
  }
  if (isBusiness(detail)) {
    switch (detail.taxInvoice?.status) {
      case "REVIEWING":
        return { text: "확인 중" }
      case "REJECTED":
        return { text: "반려 · 재제출 필요", tone: "danger" }
      case "APPROVED":
        break
      default:
        return { text: "발행 필요", tone: "warning" }
    }
  }
  return { text: `${formatMonthDay(detail.payout.scheduledDate)} 지급 예정` }
}

function brandPayoutStatus(detail: SettlementDetail) {
  if (detail.status === "CONFIRMING") return "확인 기간 후 지급"
  if (detail.status === "ADJUSTING") return "보류 중"
  const date = formatMonthDay(detail.distribution.brandPayoutDate)
  return detail.distribution.brandPaid
    ? `${date} 지급 완료`
    : `${date} 지급 예정`
}

const STATUS_TONE_CLASS = {
  warning: "text-sz-warning-text",
  danger: "text-sz-danger-text",
}

/**
 * 3자 분배 — PG가 몫별로 직접 지급한다는 사실은 수취자에게 더 중요하다(돈이 안 들어왔을 때
 * 누구에게 물어야 하는지). 행 순서는 내가 첫 행이고 브랜드 · 플랫폼은 회색 보조다(§44-1 #2).
 */
export function DistributionCard({ detail }: Props) {
  const b = detail.breakdown
  const business = isBusiness(detail)
  const adjusting = detail.status === "ADJUSTING"
  const my = myPayoutStatus(detail)
  const base = `${rewardBaseLabel(detail)} ${formatWon(b.rewardAfterDeduction)}`
  const formula = adjusting
    ? "원래 금액 기준 · 합의 시 재계산"
    : business
      ? `${base} + 부가세 ${formatWon(b.vatAmount)}`
      : `${base} − 원천징수 ${formatWon(b.withholdingTax)}`
  const brandStatus = brandPayoutStatus(detail)

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
          <tr className={LTAB_ROW}>
            <td className={LTAB_CELL}>
              인플루언서<MNote>나</MNote>
            </td>
            <td className={cn(LTAB_CELL, LTAB_NUM)}>
              <B>{formatWon(b.payoutAmount)}</B>
              <MNote>{formula}</MNote>
            </td>
            <td
              className={cn(LTAB_CELL, my.tone && STATUS_TONE_CLASS[my.tone])}
            >
              {my.text}
            </td>
          </tr>
          <tr className={LTAB_ROW}>
            <td className={LTAB_CELL}>
              브랜드<MNote>{detail.brandName}</MNote>
            </td>
            <td className={cn(LTAB_CELL, LTAB_NUM, "text-sz-n-500")}>
              {formatWon(detail.distribution.brandAmount)}
            </td>
            <td className={cn(LTAB_CELL, "text-sz-n-500")}>{brandStatus}</td>
          </tr>
          <tr className={LTAB_ROW}>
            <td className={LTAB_CELL}>플랫폼</td>
            <td className={cn(LTAB_CELL, LTAB_NUM, "text-sz-n-500")}>
              {formatWon(detail.distribution.platformAmount)}
              {!business && <MNote>리워드 부가세</MNote>}
            </td>
            <td className={cn(LTAB_CELL, "text-sz-n-500")}>
              {business ? "부가세는 인플루언서에게 지급" : "플랫폼 신고 · 납부"}
            </td>
          </tr>
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

/** 지급 정보 — 지급 예정일 옆에 계산 근거(확정일 + N영업일)를 함께 적는다(§41-5) */
export function PayoutInfoCard(props: Props & { onOpenAccount: () => void }) {
  const { detail, onOpenAccount } = props
  const payout = detail.payout
  const lag = detail.payoutLagBusinessDays
  const business = isBusiness(detail)
  const paid = detail.status === "PAID"

  let scheduled: ReactNode
  let scheduledSub: ReactNode = null
  if (detail.status === "CONFIRMING") {
    scheduled = business
      ? `발행 확인 후 + ${lag}영업일`
      : `${formatFullDate(payout.scheduledDate)} 예정`
    scheduledSub = business
      ? `요청이 없으면 ${formatMonthDay(detail.confirmedAt)} 자동 확정 · 세금계산서 확인 후 지급`
      : `요청이 없으면 ${formatMonthDay(detail.confirmedAt)} 자동 확정 + ${lag}영업일`
  } else if (detail.status === "ADJUSTING") {
    scheduled = <span className="text-sz-warning-text">보류 중</span>
    scheduledSub = "합의 · 기한 만료 후 다음 지급일"
  } else {
    const pending = paid ? null : businessPayoutPending(detail)
    if (pending) {
      scheduled = pending
    } else {
      scheduled = formatFullDate(payout.scheduledDate)
      const approvedAt = detail.taxInvoice?.approval?.approvedAt ?? null
      scheduledSub =
        business && approvedAt
          ? `발행 확인 ${formatMonthDay(approvedAt)} + ${lag}영업일`
          : `${detail.confirmBasis === "NO_REQUEST" ? "자동 확정" : "확정"} ${formatMonthDay(detail.confirmedAt)} + ${lag}영업일`
    }
  }

  return (
    <Sec title="지급 정보" className="mb-0">
      <ReadRow
        label="입금 계좌"
        sub={
          <>
            예금주 {payout.accountHolder} ·{" "}
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
        {payout.bankName} {payout.accountNumberMasked}
      </ReadRow>
      <ReadRow label="지급 예정일" sub={scheduledSub}>
        <span className="tabular-nums">{scheduled}</span>
      </ReadRow>
      <ReadRow label="실지급일" muted={!paid}>
        <span className="tabular-nums">
          {paid ? formatFullDate(payout.paidDate) : "—"}
        </span>
      </ReadRow>
      <ReadRow label="PG 거래 참조번호" muted={!payout.pgReferenceNo}>
        <span className="tabular-nums">
          {payout.pgReferenceNo ?? "지급 시 생성"}
        </span>
      </ReadRow>
    </Sec>
  )
}

// ── 증빙 ─────────────────────────────────────────────

/**
 * 원천징수(비사업자) — 한 건짜리라 표가 아니라 인라인 요약 바로 둔다(시안 HEAD [한 줄짜리 표]).
 * 영수증은 지급 완료 시 자동 발급 — 그 전에는 [다운로드] 비활성.
 */
export function WithholdingCard(props: Props & { onDownload: () => void }) {
  const { detail, onDownload } = props
  if (isBusiness(detail)) return null
  const paid = detail.status === "PAID"
  const phase =
    detail.status === "ADJUSTING" ? "지급 보류" : paid ? "지급 완료" : "지급 전"
  const rate = formatPercent(detail.taxRates.withholdingRate)

  return (
    <Sec
      title="원천징수"
      note={`비사업자 · ${phase}${hasDeduction(detail) ? " · 차감 후 금액 기준" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-7">
        <InlineItem label="증빙">원천징수영수증</InlineItem>
        <InlineItem label="발행">SHOWROOMZ</InlineItem>
        <InlineItem label={paid ? "징수액" : "징수 예정액"}>
          {formatWon(detail.breakdown.withholdingTax)}
        </InlineItem>
        <span className="ml-auto">
          <ActBtn disabled={!paid} onClick={onDownload}>
            다운로드
          </ActBtn>
        </span>
      </div>
      <Note>
        <B>SHOWROOMZ가 {rate}</B>(소득세 · 지방소득세)
        <B>를 원천징수하고 신고 · 납부</B>합니다. 원천징수영수증은{" "}
        <B>지급 완료 시 자동 발급</B>
        {paid ? "됩니다" : "되며 그 전에는 내려받을 수 없습니다"} · 한 해 내역은
        목록의 <B>[연간 지급 내역]</B>에서 종합소득세 신고용으로 받을 수
        있습니다.
      </Note>
    </Sec>
  )
}

// ── 명세 ─────────────────────────────────────────────

/** 정산 명세 — 소비자 열 없음 · 「내 리워드」 열로 주문 단위 검산(§44-1 #3) */
export function StatementCard(props: Props & { onDownload: () => void }) {
  const { detail, onDownload } = props
  const rows = detail.statementPreview

  return (
    <Sec title="정산 명세" note={`주문 단위 · 미리보기 ${rows.length}건`}>
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
          {rows.map(row => (
            <tr
              key={row.orderNo}
              className={cn(
                LTAB_ROW,
                row.status !== "CONFIRMED" && "text-sz-n-500"
              )}
            >
              <td className={cn(LTAB_CELL, "tabular-nums")}>{row.orderNo}</td>
              <td className={LTAB_CELL}>
                {row.productName} / {row.optionName}
              </td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>{row.quantity}</td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>
                {formatWon(row.paymentAmount)}
              </td>
              <td className={LTAB_CELL}>{STATEMENT_LINE_LABEL[row.status]}</td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>
                {formatWon(row.settledAmount)}
              </td>
              <td className={cn(LTAB_CELL, LTAB_NUM)}>
                {formatWon(row.myReward)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2.5">
        <Note className="mt-0 flex-1">
          <B>정산 반영액 = 상품 결제금액 기준</B> — 교환 · 반려 재발송비는
          포함되지 않습니다 · 취소 · 반품 건은 정산 반영액과 내 리워드가{" "}
          <B>0원</B>입니다 · <B>소비자 정보는 표시되지 않습니다</B>.
        </Note>
        <Btn variant="secondary" onClick={onDownload}>
          전체 명세 다운로드
        </Btn>
      </div>
    </Sec>
  )
}
