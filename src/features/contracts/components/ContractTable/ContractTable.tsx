import Pagination, {
  type PaginationProps,
} from "@/common/components/Pagination/Pagination"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import { DEADLINE_TEXT } from "@/features/contracts/constants/labels"
import type { CreatorContractListItem } from "@/features/contracts/types"
import { periodText } from "@/features/contracts/utils/format"
import { toneToVariant } from "@/features/contracts/utils/statusBadge"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"

interface ContractTableProps {
  rows: Array<CreatorContractListItem>
  isLoading: boolean
  pageInfo: PaginationProps
  emptyState: ReactNode
  onRowClick: (row: CreatorContractListItem) => void
}

/** 시안 S1 컬럼 폭 — 공구명(나머지) · 브랜드 150 · 상품 수 82 · 공구 기간 280 · 내 서명 기한 150 · 상태 124 */
const HEAD_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-left text-[11px] font-semibold tracking-[.2px] text-sz-n-600"
const CELL_CLASS = "px-4 py-[13px] text-[12px] align-middle"

/**
 * 시안 `.tcard table` — 스튜디오엔 공용 Table이 없어 시안 마크업 그대로의 경량 표를 둔다.
 * 관리 열 없이 행 전체 클릭으로 들어간다. 「내 서명 기한」 열은 서버 판정(type·tone)대로 그린다 —
 * 기한 임박은 칩이 아니라 **날짜 텍스트 자체를 경고색**으로 칠한다.
 */
export default function ContractTable(props: ContractTableProps) {
  const { rows, isLoading, pageInfo, emptyState, onRowClick } = props

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col />
          <col style={{ width: 150 }} />
          <col style={{ width: 82 }} />
          <col style={{ width: 280 }} />
          <col style={{ width: 150 }} />
          <col style={{ width: 124 }} />
        </colgroup>
        <thead>
          <tr>
            <th className={HEAD_CLASS}>공구명</th>
            <th className={HEAD_CLASS}>브랜드</th>
            <th className={cn(HEAD_CLASS, "text-center")}>상품 수</th>
            <th className={cn(HEAD_CLASS, "text-center")}>공구 기간</th>
            <th className={cn(HEAD_CLASS, "text-center")}>내 서명 기한</th>
            <th className={cn(HEAD_CLASS, "text-center")}>상태</th>
          </tr>
        </thead>
        {rows.length > 0 && (
          <tbody>
            {rows.map(row => (
              <tr
                key={row.contractId}
                onClick={() => onRowClick(row)}
                className="group cursor-pointer border-t border-sz-n-100 first:border-t-0 hover:bg-sz-accent-50"
              >
                <td className={CELL_CLASS}>
                  <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
                    {row.title}
                  </span>
                </td>
                <td className={cn(CELL_CLASS, "truncate text-sz-n-700")}>
                  {row.brandName}
                </td>
                <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
                  {row.itemCount}
                </td>
                <td
                  className={cn(
                    CELL_CLASS,
                    "whitespace-nowrap text-center tabular-nums text-sz-n-500"
                  )}
                >
                  {periodText(row.startAt, row.endAt) ?? "미설정"}
                </td>
                <td
                  className={cn(
                    CELL_CLASS,
                    "whitespace-nowrap text-center tabular-nums",
                    row.deadline.type === "DEADLINE"
                      ? row.deadline.tone === "WARNING"
                        ? "font-semibold text-sz-warning-text"
                        : "text-sz-n-500"
                      : "text-sz-n-400"
                  )}
                >
                  {row.deadline.type === "DEADLINE"
                    ? formatDateTimeShort(row.deadline.deadlineAt)
                    : DEADLINE_TEXT[row.deadline.type]}
                </td>
                <td className={cn(CELL_CLASS, "text-center")}>
                  <StatusBadge variant={toneToVariant(row.statusTone)}>
                    {row.statusLabel}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>

      {rows.length === 0 &&
        (isLoading ? (
          <div className="flex justify-center py-12 text-sz-n-400">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : (
          emptyState
        ))}

      {rows.length > 0 && (
        <div className="flex justify-center border-t border-sz-n-200 p-3">
          <Pagination {...pageInfo} />
        </div>
      )}
    </div>
  )
}
