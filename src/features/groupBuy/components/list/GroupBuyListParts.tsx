import Pagination, {
  type PaginationProps,
} from "@/common/components/Pagination/Pagination"
import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { periodText } from "@/features/contracts/utils/format"
import { GbBadge, GbEmpty } from "@/features/groupBuy/components/shared/GbParts"
import { GROUP_BUY_TABS } from "@/features/groupBuy/constants/params"
import type {
  CreatorGroupBuyListItem,
  CreatorGroupBuySummaryResponse,
  CreatorGroupBuyTab,
} from "@/features/groupBuy/types"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"

/** 시안 `.tabs` — 상태 탭 5종. 건수는 검색어와 무관한 내 전체 기준(summary) */
export function GroupBuyStatusTabs(props: {
  tab: CreatorGroupBuyTab
  onTabChange: (tab: CreatorGroupBuyTab) => void
  counts: CreatorGroupBuySummaryResponse["tabCounts"] | undefined
}) {
  const { tab, onTabChange, counts } = props

  return (
    <div className="mb-4 flex shrink-0 flex-wrap border-b border-sz-n-200">
      {GROUP_BUY_TABS.map(item => {
        const isActive = tab === item.value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
            className={cn(
              "mr-[22px] flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-[9px] text-[12px]",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-lg px-1.5 text-[10px]",
                isActive
                  ? "bg-sz-accent-50 text-sz-accent-600"
                  : "bg-sz-n-100 text-sz-n-600"
              )}
            >
              {counts?.[item.value] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** 시안 `.toolbar` — 검색어 · [검색]. 공구를 만들 수 없으므로 생성 버튼이 없다 */
export function GroupBuyToolbar(props: {
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
}) {
  const { keyword, onKeywordChange, onSearch } = props

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        className={cn(INPUT_CLASS, "w-[280px]")}
        placeholder="공구명 · 브랜드명 검색"
        value={keyword}
        onChange={event => onKeywordChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter") {
            onSearch()
          }
        }}
      />
      <Btn variant="secondary" onClick={onSearch}>
        검색
      </Btn>
    </div>
  )
}

/**
 * 빈 상태 — 공구가 아예 없으면(A2) 계약 관리로 보내고 연결부터라는 순서를 함께 안내한다.
 * 검색 결과가 없으면 조건 탓임을 밝히고 초기화로 되돌린다.
 */
export function GroupBuyEmptyState(props: {
  hasCondition: boolean
  tab: CreatorGroupBuyTab
  keyword: string
  onReset: () => void
  onGoContracts: () => void
}) {
  const { hasCondition, tab, keyword, onReset, onGoContracts } = props

  if (hasCondition) {
    const tabLabel =
      GROUP_BUY_TABS.find(item => item.value === tab)?.label ?? "전체"
    return (
      <GbEmpty
        title="검색 조건에 맞는 공구가 없습니다"
        action={
          <Btn variant="secondary" onClick={onReset}>
            검색 조건 초기화
          </Btn>
        }
      >
        {keyword
          ? `${tabLabel} 탭에서 “${keyword}”${objectParticle(keyword)} 찾지 못했습니다. 다른 탭에는 있을 수 있습니다.`
          : `${tabLabel} 탭에 해당하는 공구가 없습니다. 다른 탭에는 있을 수 있습니다.`}
      </GbEmpty>
    )
  }

  return (
    <GbEmpty
      title="아직 공구가 없습니다"
      action={
        <>
          <Btn variant="secondary" onClick={onGoContracts}>
            계약 관리 열기
          </Btn>
          <p className="mt-3.5 text-[11px] leading-[1.55] text-sz-n-500">
            받은 계약이 없다면 먼저 <b className="font-semibold">연결·소통</b>
            에서 브랜드와의 연결을 확인하세요.
          </p>
        </>
      }
    >
      공구는 <b className="font-semibold">계약이 체결되면 자동으로</b>{" "}
      생성됩니다 — 내가 직접 만들 수는 없습니다.
      <br />
      브랜드가 보낸 계약에 서명하면 이곳에 공구가 나타납니다.
    </GbEmpty>
  )
}

const HEAD_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-left text-[11px] font-semibold tracking-[.2px] text-sz-n-600"
const CELL_CLASS = "px-4 py-[13px] text-[12px] align-middle"

/**
 * 시안 A1 표 — 스튜디오엔 공용 Table이 없어 시안 마크업 그대로의 경량 표를 둔다.
 * 열 폭: 공구명(나머지) · 브랜드 172 · 상품 수 96 · 공구 기간 296 · 내 게시물 136 · 상태 128.
 * 비고 열은 두지 않는다 — 요청·조치 여부는 상세에서 확인한다.
 */
export function GroupBuyTable(props: {
  rows: Array<CreatorGroupBuyListItem>
  isLoading: boolean
  pageInfo: PaginationProps
  emptyState: ReactNode
  onRowClick: (row: CreatorGroupBuyListItem) => void
}) {
  const { rows, isLoading, pageInfo, emptyState, onRowClick } = props

  return (
    <>
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col />
          <col style={{ width: 172 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 296 }} />
          <col style={{ width: 136 }} />
          <col style={{ width: 128 }} />
        </colgroup>
        <thead>
          <tr>
            <th className={HEAD_CLASS}>공구명</th>
            <th className={HEAD_CLASS}>브랜드</th>
            <th className={cn(HEAD_CLASS, "text-center")}>상품 수</th>
            <th className={cn(HEAD_CLASS, "text-center")}>공구 기간</th>
            <th className={cn(HEAD_CLASS, "text-center")}>내 게시물</th>
            <th className={cn(HEAD_CLASS, "text-center")}>상태</th>
          </tr>
        </thead>
        {rows.length > 0 && (
          <tbody>
            {rows.map(row => (
              <tr
                key={row.groupBuyId}
                onClick={() => onRowClick(row)}
                className="group cursor-pointer border-t border-sz-n-100 first:border-t-0 hover:bg-sz-accent-50"
              >
                <td className={CELL_CLASS}>
                  <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
                    {row.title}
                  </span>
                </td>
                <td className={cn(CELL_CLASS, "truncate")}>{row.brandName}</td>
                <td className={cn(CELL_CLASS, "text-center tabular-nums")}>
                  {row.itemCount}
                </td>
                <td
                  className={cn(
                    CELL_CLASS,
                    "whitespace-nowrap text-center tabular-nums text-sz-n-500"
                  )}
                >
                  {periodText(row.startAt, row.endAt) ?? "—"}
                </td>
                <td className={cn(CELL_CLASS, "text-center")}>
                  <GbBadge tone={row.postStatusTone}>
                    {row.postStatusLabel}
                  </GbBadge>
                </td>
                <td className={cn(CELL_CLASS, "text-center")}>
                  <GbBadge tone={row.statusTone}>{row.statusLabel}</GbBadge>
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
    </>
  )
}

/** 받침 유무로 목적격 조사를 고른다 — 「립밤을」 · 「토너를」 */
function objectParticle(word: string) {
  const last = word.charCodeAt(word.length - 1)
  const isHangul = last >= 0xac00 && last <= 0xd7a3
  return isHangul && (last - 0xac00) % 28 === 0 ? "를" : "을"
}
