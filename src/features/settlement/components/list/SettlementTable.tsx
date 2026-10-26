import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  MNote,
  SubBadge,
} from "@/features/settlement/components/detail/DetailParts"
import {
  PAYOUT_HOLD_SANCTION_LABEL,
  TONE_VARIANT,
} from "@/features/settlement/constants/params"
import type { SettlementListItem } from "@/features/settlement/types"
import {
  formatMinusWon,
  formatMonthDay,
  formatPeriod,
  formatPlusWon,
  formatWon,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"

const HEAD_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-left text-[11px] font-semibold tracking-[.2px] text-sz-n-600"
const CELL_CLASS = "px-4 py-[13px] text-[12px] align-middle"
const NUM_CELL = cn(CELL_CLASS, "text-center tabular-nums")

/**
 * 지급(예정)일 칸 — 서버가 내 행 기준으로 준다: PAID = 「09.02」 · SCHEDULED = 「09.09 예정」.
 * 확인 중 · 협의 · 보류(사업자 발행 확인 전 · 계정 이용 정지 · 계좌 확인 중) · 지급 확인 중이면 날짜가 없다.
 */
function payoutDateCell(row: SettlementListItem) {
  if (!row.payoutDate) return null
  if (row.payoutDateKind === "SCHEDULED") {
    return `${formatMonthDay(row.payoutDate)} 예정`
  }
  return formatMonthDay(row.payoutDate)
}

/**
 * 시안 L1 표 — 열을 계산 순서 그대로 놓는다(확정 거래액 → 리워드율 → 판매 리워드 → 원천징수 → 실지급액).
 * 조회 전용이라 체크박스 · 관리 열이 없고 행 클릭으로만 상세에 들어간다.
 * 사업자는 원천징수 대신 부가세가 붙는다 — 세무 구분은 「나 하나」의 속성이라 모든 행이 같으므로
 * 열 이름을 「부가세」로 바꾸고 「+금액」만 적는다(같은 칸에 「— / 부가세 / +금액」 세 줄을 쌓으면
 * 96px 칸에서 줄이 넘쳐 행 높이가 두 배가 된다).
 */
export default function SettlementTable(props: {
  rows: Array<SettlementListItem>
  /** 내 세무 구분(프로필) — 목록 응답에 없다 */
  business: boolean
  onRowClick: (row: SettlementListItem) => void
}) {
  const { rows, business, onRowClick } = props

  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col />
        <col style={{ width: 112 }} />
        <col style={{ width: 132 }} />
        <col style={{ width: 116 }} />
        <col style={{ width: 74 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 96 }} />
        <col style={{ width: 112 }} />
        <col style={{ width: 104 }} />
        <col style={{ width: 104 }} />
      </colgroup>
      <thead>
        <tr>
          <th className={HEAD_CLASS}>공구명</th>
          <th className={HEAD_CLASS}>브랜드</th>
          <th className={cn(HEAD_CLASS, "text-center")}>정산 대상 기간</th>
          <th className={cn(HEAD_CLASS, "text-center")}>확정 거래액</th>
          <th className={cn(HEAD_CLASS, "text-center")}>리워드율</th>
          <th className={cn(HEAD_CLASS, "text-center")}>판매 리워드</th>
          <th className={cn(HEAD_CLASS, "text-center")}>
            {business ? "부가세" : "원천징수"}
          </th>
          <th className={cn(HEAD_CLASS, "text-center")}>실지급액</th>
          <th className={cn(HEAD_CLASS, "text-center")}>상태</th>
          <th className={cn(HEAD_CLASS, "text-center")}>지급(예정)일</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const dateText = payoutDateCell(row)
          return (
            <tr
              key={row.settlementId}
              tabIndex={0}
              aria-label={`${row.groupBuyTitle} 정산 상세`}
              onClick={() => onRowClick(row)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onRowClick(row)
                }
              }}
              className="group cursor-pointer border-t border-sz-n-100 outline-none first:border-t-0 hover:bg-sz-accent-50 focus-visible:bg-sz-accent-50 focus-visible:shadow-[inset_0_0_0_2px_var(--color-sz-accent-500)]"
            >
              <td className={CELL_CLASS}>
                <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
                  {row.groupBuyTitle}
                </span>
              </td>
              <td className={cn(CELL_CLASS, "truncate")}>{row.brandName}</td>
              <td className={cn(NUM_CELL, "whitespace-nowrap text-sz-n-500")}>
                {formatPeriod(row.periodStartAt, row.periodEndAt)}
              </td>
              <td className={NUM_CELL}>
                {formatWon(row.confirmedSalesAmount)}
              </td>
              <td className={NUM_CELL}>{row.rewardRateLabel ?? "—"}</td>
              <td className={NUM_CELL}>
                {formatWon(row.rewardAmount)}
                {row.rewardClawbackAmount > 0 && (
                  <MNote>차감 {formatMinusWon(row.rewardClawbackAmount)}</MNote>
                )}
              </td>
              {/* 사업자 6자리 부가세(+157,704원)가 96px 칸에서 꺾이지 않게 — 넘침은 좌우 패딩 안에서 끝난다 */}
              <td className={cn(NUM_CELL, "whitespace-nowrap")}>
                {business
                  ? formatPlusWon(row.creatorVatAmount)
                  : formatMinusWon(row.withholdingAmount)}
              </td>
              <td className={NUM_CELL}>
                <b className="font-semibold">
                  {formatWon(row.creatorPayoutAmount)}
                </b>
              </td>
              <td className={cn(CELL_CLASS, "text-center")}>
                {/* 13 S6 — 상태는 그대로 · 정지 보류면 보조 배지를 아래에 붙인다 */}
                <div className="inline-flex flex-col items-center gap-1">
                  <StatusBadge variant={TONE_VARIANT[row.statusTone]}>
                    {row.statusLabel}
                  </StatusBadge>
                  {row.payoutHold?.sanction && (
                    <SubBadge>{PAYOUT_HOLD_SANCTION_LABEL}</SubBadge>
                  )}
                </div>
              </td>
              <td
                className={cn(
                  NUM_CELL,
                  "whitespace-nowrap",
                  dateText ? "text-sz-n-500" : "text-sz-n-400"
                )}
              >
                {dateText ?? "—"}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
