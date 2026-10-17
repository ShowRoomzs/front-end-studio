import Pagination from "@/common/components/Pagination/Pagination"
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo"
import { useParams } from "@/common/hooks/useParams"
import Btn from "@/features/contracts/components/shared/Btn"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  SETTLEMENT_DESCRIPTION,
  SETTLEMENT_PAGE_CLASS,
  SettlementEmptyState,
  SettlementFilters,
  SettlementKpis,
  SettlementPageHeader,
} from "@/features/settlement/components/list/SettlementListParts"
import SettlementTable from "@/features/settlement/components/list/SettlementTable"
import {
  GROUP_BUY_LIST_PATH,
  SETTLEMENT_INITIAL_PARAMS,
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_PAGE_SIZES,
  SETTLEMENT_SORT_OPTIONS,
} from "@/features/settlement/constants/params"
import { useSettlementDownload } from "@/features/settlement/hooks/useSettlementDownload"
import {
  useGetProfileTaxInfo,
  useGetSettlementList,
  useGetSettlementSummary,
} from "@/features/settlement/hooks/useSettlementQueries"
import { settlementService } from "@/features/settlement/services/settlementService"
import type {
  SettlementListParams,
  SettlementPartySort,
} from "@/features/settlement/types"
import dayjs from "dayjs"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

/** 시안 `.sel-sm` — 목록 툴바 셀렉트(채운 삼각형) */
const SELECT_SM_CLASS =
  "h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

/**
 * 정산 관리 목록(ui-studio-12 L1 · L2).
 *
 * 인플루언서가 묻는 것은 「내가 얼마를 언제 받나」 하나다. 이 화면이 금액의 단일 소스이고(성과는 해석,
 * 정산은 돈의 사실) 조회 전용이라 체크박스 · 관리 열 · 일괄 액션이 없다.
 */
export default function SettlementListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    params,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
    reset,
  } = useParams<SettlementListParams>(SETTLEMENT_INITIAL_PARAMS)

  const { data: list, isLoading } = useGetSettlementList(params)
  const { data: summary } = useGetSettlementSummary()
  const { data: profileTax } = useGetProfileTaxInfo()
  const rows = list?.content ?? []
  // 세무 구분은 프로필 값 — 프로필을 못 읽으면 행의 부가세로 짐작한다(사업자만 부가세가 붙는다)
  const businessType =
    profileTax?.businessType ??
    (rows.some(row => row.creatorVatAmount > 0) ? "BUSINESS" : null)

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: page => updateParam("page", page),
  })

  const totalCount = summary
    ? Object.values(summary.statusCounts).reduce((sum, n) => sum + n, 0)
    : 0
  const neverHadSettlements = !!summary && totalCount === 0
  const hasCondition =
    params.keyword.trim() !== "" ||
    ([] as Array<string>).concat(params.status).length <
      SETTLEMENT_INITIAL_PARAMS.status.length

  return (
    <div className={SETTLEMENT_PAGE_CLASS}>
      <SettlementPageHeader
        title="정산 관리"
        description={SETTLEMENT_DESCRIPTION}
        right={
          summary && summary.totalPaid.count > 0 ? (
            <AnnualStatement />
          ) : undefined
        }
      />

      <SettlementKpis summary={summary} businessType={businessType} />

      <SettlementFilters
        params={params}
        keyword={localParams.keyword}
        statusCounts={summary?.statusCounts}
        onChange={updateParams}
        onKeywordChange={keyword => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
      />

      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {!neverHadSettlements && rows.length > 0 && (
          <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
            <span className="text-[12px] text-sz-n-600">
              총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            </span>
            <div className="flex items-center gap-2">
              <select
                aria-label="정렬"
                value={params.sort}
                onChange={event =>
                  updateParams({
                    sort: event.target.value as SettlementPartySort,
                    page: 1,
                  })
                }
                style={SELECT_CHEVRON_STYLE}
                className={SELECT_SM_CLASS}
              >
                {SETTLEMENT_SORT_OPTIONS.map(option => (
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
                {SETTLEMENT_PAGE_SIZES.map(size => (
                  <option key={size} value={size}>
                    {size}건씩
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isLoading && !list ? (
          <div className="flex justify-center py-[72px]">
            <Loader2 className="size-5 animate-spin text-sz-n-400" />
          </div>
        ) : rows.length === 0 ? (
          <SettlementEmptyState
            hasCondition={!neverHadSettlements && hasCondition}
            keyword={params.keyword}
            onReset={reset}
            onGoGroupBuy={() => navigate(GROUP_BUY_LIST_PATH)}
          />
        ) : (
          <SettlementTable
            rows={rows}
            business={businessType === "BUSINESS"}
            onRowClick={row =>
              // 목록 조건을 들고 간다 — [목록]이 같은 자리로 돌아온다
              navigate({
                pathname: `${SETTLEMENT_LIST_PATH}/${row.settlementId}`,
                search: location.search,
              })
            }
          />
        )}

        {/* 시안 L1은 한 쪽짜리라 페이지 바를 그리지 않았다 — 두 쪽 이상일 때만 둔다 */}
        {pageInfo.totalPages > 1 && rows.length > 0 && (
          <div className="flex justify-center border-t border-sz-n-200 p-3">
            <Pagination {...pageInfo} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 목록 상단 [연간 지급 내역] — 내 몫 지급일이 그 해에 속한 정산(xlsx · 비사업자는 종합소득세 신고용).
 * 서버가 지급 연도 목록을 내리지 않아 올해 · 지난해를 고르게 하고, 그 해 지급이 없으면 서버 404를
 * 「지급 내역 없음」으로 알린다(빈 엑셀은 「소득 0」으로 읽혀 서버가 파일을 만들지 않는다).
 */
function AnnualStatement() {
  const thisYear = dayjs().year()
  const years = [thisYear, thisYear - 1]
  const [year, setYear] = useState(thisYear)
  const { run, pendingKey } = useSettlementDownload()

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <select
        aria-label="연도"
        value={year}
        onChange={event => setYear(Number(event.target.value))}
        style={SELECT_CHEVRON_STYLE}
        className={SELECT_SM_CLASS}
      >
        {years.map(item => (
          <option key={item} value={item}>
            {item}년
          </option>
        ))}
      </select>
      <Btn
        variant="secondary"
        isLoading={pendingKey === "annual"}
        onClick={() =>
          run("annual", () => settlementService.downloadAnnualStatement(year), {
            notFoundText: `${year}년에 지급 완료된 정산이 없습니다.`,
          })
        }
      >
        연간 지급 내역
      </Btn>
    </div>
  )
}
