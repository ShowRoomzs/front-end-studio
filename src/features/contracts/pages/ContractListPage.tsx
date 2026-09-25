import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import ContractEmptyState from "@/features/contracts/components/ContractEmptyState/ContractEmptyState"
import ContractStatusTabs from "@/features/contracts/components/ContractStatusTabs/ContractStatusTabs"
import ContractTable from "@/features/contracts/components/ContractTable/ContractTable"
import ContractToolbar from "@/features/contracts/components/ContractToolbar/ContractToolbar"
import {
  CREATOR_CONTRACT_INITIAL_PARAMS,
  CREATOR_CONTRACT_LIST_PATH,
  CREATOR_CONTRACT_PAGE_SIZES,
  CREATOR_CONTRACT_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/contracts/constants/params"
import {
  useGetCreatorContractList,
  useGetCreatorContractSummary,
} from "@/features/contracts/hooks/useCreatorContractQueries"
import type {
  CreatorContractListItem,
  CreatorContractListParams,
  CreatorContractSortType,
  CreatorContractTab,
} from "@/features/contracts/types"
import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

/**
 * S1·S2 — 계약 목록(쇼룸 스튜디오). 수신 측이라 작성중 탭도, 주 CTA도 없다(§27-1).
 * 「생성일」 대신 「내 서명 기한」 열이 있다 — 수신 측에서 유효한 날짜는 내가 조치해야 하는 기한뿐이다.
 */
export default function ContractListPage() {
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
  } = useParams<CreatorContractListParams>(CREATOR_CONTRACT_INITIAL_PARAMS)

  const { data: contractList, isLoading } = useGetCreatorContractList(params)
  const { data: summary } = useGetCreatorContractSummary()

  const pageInfo = usePaginationInfo({
    data: contractList?.pageInfo,
    onPageChange: page => {
      updateParam("page", page)
    },
  })

  const handleRowClick = useCallback(
    (record: CreatorContractListItem) => {
      // 목록 조건을 들고 간다 — 상세가 이 조건으로 이전/다음을 계산하고 [목록]은 같은 자리로 돌아온다
      navigate({
        pathname: `${CREATOR_CONTRACT_LIST_PATH}/${record.contractId}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  const handleTabChange = useCallback(
    (tab: CreatorContractTab) => {
      updateParams({ tab, page: 1 })
    },
    [updateParams]
  )

  const hasCondition = params.tab !== "ALL" || !!params.keyword
  const actionRequired = summary?.actionRequiredCount ?? 0
  // 받은 계약이 아예 없으면(S2) 표 없이 안내 카드만, 검색 결과 없음이면 표 머리만 남긴다
  const isEmpty = !isLoading && (contractList?.content.length ?? 0) === 0

  const emptyState = useMemo(
    () => (
      <ContractEmptyState
        hasCondition={hasCondition}
        tab={params.tab}
        keyword={params.keyword}
        onReset={reset}
        onGoConnections={() => navigate("/connections")}
      />
    ),
    [hasCondition, params.tab, params.keyword, reset, navigate]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">계약 관리</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          브랜드가 보낸 공구 계약을 확인하고 서명하거나 거절합니다.
        </p>
      </div>

      <ContractStatusTabs
        tab={params.tab}
        onTabChange={handleTabChange}
        counts={summary?.tabCounts}
      />

      <ContractToolbar
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
                {/* 내 서명이 필요한 건수 — 탭·검색과 무관한 전체 기준. 0건이면 문구를 붙이지 않는다 */}
                {actionRequired > 0 && (
                  <>
                    {" · 내 서명이 필요한 계약 "}
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
                      sort: event.target.value as CreatorContractSortType,
                      page: 1,
                    })
                  }
                  style={SELECT_CHEVRON_STYLE}
                  className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
                >
                  {CREATOR_CONTRACT_SORT_OPTIONS.map(option => (
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
                  className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
                >
                  {CREATOR_CONTRACT_PAGE_SIZES.map(size => (
                    <option key={size} value={size}>
                      {size}건씩
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <ContractTable
            rows={contractList?.content ?? []}
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
