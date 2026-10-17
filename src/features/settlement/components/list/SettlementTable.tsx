import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { MNote } from "@/features/settlement/components/detail/DetailParts"
import {
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import type { SettlementListItem } from "@/features/settlement/types"
import {
  formatMinusWon,
  formatMonthDay,
  formatPercent,
  formatPeriod,
  formatPlusWon,
  formatWon,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"

const HEAD_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-left text-[11px] font-semibold tracking-[.2px] text-sz-n-600"
const CELL_CLASS = "px-4 py-[13px] text-[12px] align-middle"
const NUM_CELL = cn(CELL_CLASS, "text-center tabular-nums")

/** 지급(예정)일 칸 — 확정 전은 「—」, 사업자 발행 확인 전은 날짜가 없다 */
function payoutDateCell(row: SettlementListItem) {
  if (row.status === "PAID") return formatMonthDay(row.payoutDate)
  if (row.status === "SCHEDULED") {
    return row.payoutDate
      ? `${formatMonthDay(row.payoutDate)} 예정`
      : "발행 확인 후"
  }
  return null
}

/**
 * 시안 L1 표 — 열을 계산 순서 그대로 놓는다(확정 거래액 → 리워드율 → 판매 리워드 → 원천징수 → 실지급액).
 * 조회 전용이라 체크박스 · 관리 열이 없고 행 클릭으로만 상세에 들어간다.
 * 사업자는 원천징수 대신 부가세가 붙는다 — 같은 칸에 「+부가세」로 적는다.
 */
export default function SettlementTable(props: {
  rows: Array<SettlementListItem>
  onRowClick: (row: SettlementListItem) => void
}) {
  const { rows, onRowClick } = props

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
          <th className={cn(HEAD_CLASS, "text-center")}>원천징수</th>
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
              onClick={() => onRowClick(row)}
              className="group cursor-pointer border-t border-sz-n-100 first:border-t-0 hover:bg-sz-accent-50"
            >
              <td className={CELL_CLASS}>
                <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
                  {row.groupBuyTitle}
                </span>
              </td>
              <td className={cn(CELL_CLASS, "truncate")}>{row.brandName}</td>
              <td className={cn(NUM_CELL, "whitespace-nowrap text-sz-n-500")}>
                {formatPeriod(row.periodStart, row.periodEnd)}
              </td>
              <td className={NUM_CELL}>{formatWon(row.confirmedSales)}</td>
              <td className={NUM_CELL}>
                {row.rewardRate === null
                  ? "상품별"
                  : formatPercent(row.rewardRate)}
              </td>
              <td className={NUM_CELL}>
                {formatWon(row.saleReward)}
                {row.deductionAmount > 0 && (
                  <MNote>차감 {formatMinusWon(row.deductionAmount)}</MNote>
                )}
              </td>
              <td className={NUM_CELL}>
                {row.taxType === "BUSINESS" ? (
                  <>
                    —<MNote>부가세 {formatPlusWon(row.vatAmount)}</MNote>
                  </>
                ) : (
                  formatMinusWon(row.withholdingTax)
                )}
              </td>
              <td className={NUM_CELL}>
                <b className="font-semibold">{formatWon(row.payoutAmount)}</b>
              </td>
              <td className={cn(CELL_CLASS, "text-center")}>
                <StatusBadge variant={SETTLEMENT_STATUS_VARIANT[row.status]}>
                  {SETTLEMENT_STATUS_LABEL[row.status]}
                </StatusBadge>
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
