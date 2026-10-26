import Pagination from "@/common/components/Pagination/Pagination"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  ListTip,
  LoadFailed,
  NoEndedGroupBuy,
  NoMatch,
  PerformanceFilters,
  PerformanceKpis,
  PerformanceTable,
  PeriodSelect,
  SELECT_SM_CLASS,
  TableSummary,
} from "@/features/performance/components/list/PerformanceListParts"
import {
  PageHeader,
  PERFORMANCE_PAGE_CLASS,
} from "@/features/performance/components/shared/PerformanceParts"
import {
  GROUP_BUY_LIST_PATH,
  PERFORMANCE_DEFAULT_MONTHS,
  PERFORMANCE_INITIAL_PARAMS,
  PERFORMANCE_LIST_PATH,
  PERFORMANCE_SORT_OPTIONS,
} from "@/features/performance/constants/params"
import {
  useGetPerformanceList,
  useGetPerformanceSummary,
} from "@/features/performance/hooks/usePerformanceQueries"
import { toMonths } from "@/features/performance/services/performanceService"
import {
  CREATOR_PERFORMANCE_STATUSES,
  type CreatorPerformanceSort,
  type CreatorPerformanceStatus,
} from "@/features/performance/types"
import { formatLocalDate } from "@/features/performance/utils/format"
import { Loader2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

/** 시안 L1 `.tbar-l` 순서 — 정산 완료 · 조정 협의 · 집계 중 */
const BREAKDOWN_ORDER: Array<CreatorPerformanceStatus> = [
  "SETTLED",
  "ADJUSTING",
  "COLLECTING",
]

/**
 * 성과 관리 목록(ui-studio-10 L1 · L2) — `/performance`.
 *
 * 종료 공구 단위 비교표다(진행 중 공구는 없다 — 공구 관리 소관). 인플루언서가 묻는 것은
 * 「이 공구로 내가 얼마 벌었나 · 이 브랜드와 또 할 것인가」이고, 조회 전용이라 내려받기 · 기간 저장이 없다.
 * 기간 · 상태 · 검색어 · 정렬 · 쪽은 주소에 남는다(새로고침 · 상세에서 [목록으로]가 같은 자리로 돌아온다).
 */
export default function PerformanceListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    params,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
  } = useParams(PERFORMANCE_INITIAL_PARAMS)

  const months = toMonths(params.months) ?? PERFORMANCE_DEFAULT_MONTHS
  const status = ([] as Array<string>)
    .concat(params.status)
    .filter((value): value is CreatorPerformanceStatus =>
      (CREATOR_PERFORMANCE_STATUSES as ReadonlyArray<string>).includes(value)
    )

  const {
    data: list,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useGetPerformanceList(params)
  const {
    data: summary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useGetPerformanceSummary(months)
  const rows = list?.content ?? []

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => updateParam("page", page),
  })

  // L2 — 기간 안에 종료 공구가 하나도 없다(서버 판정). KPI 8장은 자리를 지키고 표 · 필터 대신 갈 곳을 준다
  const noEnded = summary?.hasAnyEnded === false
  const keyword = params.keyword.trim()
  const breakdown =
    summary && keyword === ""
      ? BREAKDOWN_ORDER.filter(item => status.includes(item)).map(item => ({
          status: item,
          count: summary.statusCounts[item] ?? 0,
        }))
      : null

  const description = noEnded
    ? "아직 종료된 공구가 없습니다"
    : summary
      ? `종료된 공구의 확정 성과 · ${formatLocalDate(summary.periodFrom)} ~ ${formatLocalDate(summary.periodTo)}`
      : "종료된 공구의 확정 성과"

  const goGroupBuy = () => navigate(GROUP_BUY_LIST_PATH)
  // [초기화] — 상태 · 검색어 두 축을 함께 되돌린다. 기간 · 정렬은 필터가 아니라 보기 옵션이라 둔다
  const resetFilters = () =>
    updateParams({
      status: PERFORMANCE_INITIAL_PARAMS.status,
      keyword: "",
      page: 1,
    })
  const retry = () => {
    refetchList()
    refetchSummary()
  }

  return (
    <div className={PERFORMANCE_PAGE_CLASS}>
      <PageHeader
        title="성과 관리"
        description={description}
        right={
          // 시안 L2는 기간 셀렉트가 없다 — 기본 기간이 아니면 되돌아갈 길로 남긴다
          !noEnded || months !== PERFORMANCE_DEFAULT_MONTHS ? (
            <PeriodSelect
              value={months}
              onChange={next => updateParams({ months: next, page: 1 })}
            />
          ) : undefined
        }
      />

      <PerformanceKpis summary={summary} />

      {isListError || isSummaryError ? (
        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          <LoadFailed onRetry={retry} />
        </div>
      ) : noEnded ? (
        <NoEndedGroupBuy onGoGroupBuy={goGroupBuy} />
      ) : (
        <>
          <PerformanceFilters
            status={status}
            keyword={localParams.keyword}
            statusCounts={summary?.statusCounts}
            onStatusChange={next => updateParams({ status: next, page: 1 })}
            onKeywordChange={value => updateLocalParam("keyword", value)}
            onSearch={update}
            onReset={resetFilters}
          />

          <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
            {rows.length > 0 && (
              <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
                <TableSummary
                  total={pageInfo.totalResults}
                  breakdown={breakdown}
                />
                <select
                  aria-label="정렬"
                  value={params.sort}
                  onChange={event =>
                    updateParams({
                      sort: event.target.value as CreatorPerformanceSort,
                      page: 1,
                    })
                  }
                  style={SELECT_CHEVRON_STYLE}
                  className={SELECT_SM_CLASS}
                >
                  {PERFORMANCE_SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isListLoading && !list ? (
              <div className="flex justify-center py-[72px]">
                <Loader2 className="size-5 animate-spin text-sz-n-400" />
              </div>
            ) : rows.length === 0 ? (
              <NoMatch keyword={keyword} onReset={resetFilters} />
            ) : (
              <PerformanceTable
                rows={rows}
                onRowClick={row =>
                  // 목록 조건을 들고 간다 — [목록으로]가 같은 자리로 돌아온다
                  navigate({
                    pathname: `${PERFORMANCE_LIST_PATH}/${row.groupBuyId}`,
                    search: location.search,
                  })
                }
              />
            )}

            {/* 시안 L1은 한 쪽짜리라 페이지 바가 없다 — 두 쪽 이상일 때만 둔다 */}
            {pageInfo.totalPages > 1 && rows.length > 0 && (
              <div className="flex justify-center border-t border-sz-n-200 p-3">
                <Pagination {...pageInfo} />
              </div>
            )}
          </div>

          <ListTip />
        </>
      )}
    </div>
  )
}
