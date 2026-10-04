import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  GroupBuyEmptyState,
  GroupBuyStatusTabs,
  GroupBuyTable,
  GroupBuyToolbar,
} from "@/features/groupBuy/components/list/GroupBuyListParts"
import {
  GROUP_BUY_INITIAL_PARAMS,
  GROUP_BUY_LIST_PATH,
  GROUP_BUY_PAGE_SIZES,
  GROUP_BUY_SORT_OPTIONS,
} from "@/features/groupBuy/constants/params"
import {
  useGetCreatorGroupBuyList,
  useGetCreatorGroupBuySummary,
} from "@/features/groupBuy/hooks/useCreatorGroupBuy"
import type {
  CreatorGroupBuyListItem,
  CreatorGroupBuyListParams,
  CreatorGroupBuySortType,
  CreatorGroupBuyTab,
} from "@/features/groupBuy/types"
import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const SELECT_SM_CLASS =
  "h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

/**
 * A1·A2 — 공구 목록(쇼룸 스튜디오). 공구는 계약 체결 시 자동 생성되어 [+ 공구 생성]이 없다.
 * 「게시물」 열은 내 소관 값이라 「내 게시물」로 부르고, 행 클릭으로만 들어간다.
 */
export default function GroupBuyListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
    reset,
  } = useParams<CreatorGroupBuyListParams>(GROUP_BUY_INITIAL_PARAMS)

  const { data: list, isLoading } = useGetCreatorGroupBuyList(params)
  const { data: summary } = useGetCreatorGroupBuySummary()

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => {
      updateParam("page", page)
    },
  })

  const handleRowClick = useCallback(
    (record: CreatorGroupBuyListItem) => {
      // 목록 조건을 들고 간다 — 상세가 이 조건으로 이전/다음을 계산하고 [목록]은 같은 자리로 돌아온다
      navigate({
        pathname: `${GROUP_BUY_LIST_PATH}/${record.groupBuyId}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  const handleTabChange = useCallback(
    (tab: CreatorGroupBuyTab) => updateParams({ tab, page: 1 }),
    [updateParams]
  )

  const hasCondition = params.tab !== "ALL" || !!params.keyword
  const actionRequired = summary?.actionRequiredCount ?? 0
  const isEmpty = !isLoading && (list?.content.length ?? 0) === 0

  const emptyState = useMemo(
    () => (
      <GroupBuyEmptyState
        hasCondition={hasCondition}
        tab={params.tab}
        keyword={params.keyword}
        onReset={reset}
        onGoContracts={() => navigate("/contracts")}
      />
    ),
    [hasCondition, params.tab, params.keyword, reset, navigate]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">공구 관리</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          체결된 계약에서 생성된 공구입니다. 공구 게시물을 쓰고, 준비 상황과 내
          리워드를 확인합니다.
        </p>
      </div>

      <GroupBuyStatusTabs
        tab={params.tab}
        onTabChange={handleTabChange}
        counts={summary?.tabCounts}
      />

      <GroupBuyToolbar
        keyword={localParams.keyword}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
      />

      {isEmpty && !hasCondition ? (
        <div className="rounded-[8px] border border-sz-n-200 bg-white">
          {emptyState}
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          {!isEmpty && (
            <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
              <span className="text-[12px] text-sz-n-600">
                총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
                {/* 내 조치 필요 — 탭·검색과 무관한 전체 기준. 0건이면 문구를 붙이지 않는다 */}
                {actionRequired > 0 && (
                  <>
                    {" · 내 조치가 필요한 공구 "}
                    <b className="text-sz-n-900">{actionRequired}</b>건
                  </>
                )}
              </span>

              <div className="flex items-center gap-2">
                <select
                  aria-label="정렬"
                  value={params.sort}
                  onChange={event =>
                    updateParams({
                      sort: event.target.value as CreatorGroupBuySortType,
                      page: 1,
                    })
                  }
                  style={SELECT_CHEVRON_STYLE}
                  className={SELECT_SM_CLASS}
                >
                  {GROUP_BUY_SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="표시 건수"
                  value={params.size}
                  onChange={event =>
                    updateParams({ size: Number(event.target.value), page: 1 })
                  }
                  style={SELECT_CHEVRON_STYLE}
                  className={SELECT_SM_CLASS}
                >
                  {GROUP_BUY_PAGE_SIZES.map(size => (
                    <option key={size} value={size}>
                      {size}건씩
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <GroupBuyTable
            rows={list?.content ?? []}
            isLoading={isLoading}
            pageInfo={pageInfo}
            emptyState={emptyState}
            onRowClick={handleRowClick}
          />
        </div>
      )}
    </div>
  )
}
