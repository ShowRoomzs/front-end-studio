import Btn from "@/features/contracts/components/shared/Btn"
import { SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import {
  B,
  EmptyBox,
  KpiTile,
  TD_CLASS,
  TD_NUM,
  TH_CLASS,
  ToneBadge,
  Unit,
} from "@/features/performance/components/shared/PerformanceParts"
import {
  PERFORMANCE_MONTH_OPTIONS,
  PERFORMANCE_STATUS_LABEL,
  REWARD_STAGE_LABEL,
} from "@/features/performance/constants/params"
import {
  CREATOR_PERFORMANCE_STATUSES,
  type CreatorPerformanceListItem,
  type CreatorPerformanceStatus,
  type CreatorPerformanceSummary,
  type GenderRatio,
} from "@/features/performance/types"
import {
  DASH,
  formatNumber,
  formatPeriod,
  formatRate,
  formatWon,
  genderLabel,
} from "@/features/performance/utils/format"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { ReactNode } from "react"

/** 시안 `.sel-sm` — 표 머리 정렬 셀렉트 */
export const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

/** 시안 `.btn.sm` — 필터 패널 [검색] · [초기화] */
const BTN_SM = "h-[30px] px-[15px]"

/** 시안 `.period` — 목록 머리 기간 셀렉트(「최근 6개월」) */
export function PeriodSelect(props: {
  value: number
  onChange: (months: number) => void
}) {
  return (
    <select
      aria-label="조회 기간"
      value={props.value}
      onChange={event => props.onChange(Number(event.target.value))}
      style={{
        ...SELECT_CHEVRON_STYLE,
        backgroundPosition: "right 12px center",
      }}
      className="h-8 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-3 pr-[30px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
    >
      {PERFORMANCE_MONTH_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function GenderValue({ ratio }: { ratio: GenderRatio }) {
  const [first, second] =
    ratio.majorFirst === "MALE"
      ? [ratio.male, ratio.female]
      : [ratio.female, ratio.male]
  return (
    <>
      {first}
      <span className="text-[12px] font-normal">:</span>
      {second}
    </>
  )
}

/**
 * 시안 L1 · L2 `.kpi.g4` — 누적 2 · 평균 5 · 구성 1. 모집단은 정산 완료 공구만(서버).
 * 값이 없으면 0원 · 0%가 아니라 「—」이고(측정된 0이 아니다), 완료 공구만 「0건」이다(실제로 센 값).
 * 빈 상태(L2)에서도 8장은 자리를 지킨다.
 */
export function PerformanceKpis(props: {
  summary: CreatorPerformanceSummary | undefined
}) {
  const kpi = props.summary?.kpi
  const settledCount = kpi?.settledCount ?? 0
  const dash = <span className="text-sz-n-500">{DASH}</span>
  const won = (value: number | null | undefined) =>
    value === null || value === undefined ? (
      dash
    ) : (
      <>
        {formatNumber(value)}
        <Unit>원</Unit>
      </>
    )
  const rate = (value: number | null | undefined) =>
    value === null || value === undefined ? dash : formatRate(value)

  return (
    <div className="mb-4 grid grid-cols-4 gap-3">
      <KpiTile
        hi={kpi?.totalReward !== null && kpi?.totalReward !== undefined}
        label="누적 리워드"
        value={won(kpi?.totalReward)}
        sub={`완료 공구 ${formatNumber(settledCount)}건${settledCount > 0 ? " 합산" : ""}`}
      />
      <KpiTile
        label="평균 리워드"
        value={won(kpi?.averageReward)}
        sub="공구 1건당"
      />
      <KpiTile
        label="완료 공구"
        value={
          <>
            {formatNumber(settledCount)}
            <Unit>건</Unit>
          </>
        }
        sub="집계가 끝난 공구"
      />
      <KpiTile
        label="평균 구매전환율"
        value={rate(kpi?.averageConversionRate)}
        sub="쇼룸 방문 대비 구매확정"
      />
      <KpiTile
        label="평균 재구매율"
        value={rate(kpi?.averageRepeatRate)}
        sub="구매 소비자 중 재구매"
      />
      <KpiTile
        label="평균 구매 소비자 중 팔로워"
        value={rate(kpi?.averageFollowerBuyerRate)}
        sub="구매한 소비자 중 팔로워"
      />
      <KpiTile
        label="평균 공구 게시물 조회수"
        value={
          kpi?.averagePostImpressions === null ||
          kpi?.averagePostImpressions === undefined ? (
            dash
          ) : (
            <>
              {formatNumber(kpi.averagePostImpressions)}
              <Unit>회</Unit>
            </>
          )
        }
        sub="공구 1건당"
      />
      <KpiTile
        label={genderLabel(kpi?.genderRatio ?? null)}
        value={
          kpi?.genderRatio ? <GenderValue ratio={kpi.genderRatio} /> : dash
        }
        sub="구매 소비자 기준"
      />
    </div>
  )
}

/**
 * 시안 `.filt` — 상태(체크박스 다중선택 · 건수 병기) / 검색(공구명 · 브랜드명 한 칸).
 * 검색어는 [검색] · Enter로 적용하고 [초기화]가 두 축을 함께 되돌린다. 상태는 하나는 남긴다 —
 * 전부 끄면 「전체」와 같은데 화면은 아무것도 고르지 않은 것처럼 보인다(정산 관리 · 파트너센터 성과와 같은 규칙).
 */
export function PerformanceFilters(props: {
  status: Array<CreatorPerformanceStatus>
  keyword: string
  statusCounts: Record<CreatorPerformanceStatus, number> | undefined
  onStatusChange: (status: Array<CreatorPerformanceStatus>) => void
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onReset: () => void
}) {
  const {
    status,
    keyword,
    statusCounts,
    onStatusChange,
    onKeywordChange,
    onSearch,
    onReset,
  } = props

  const toggle = (target: CreatorPerformanceStatus) => {
    const has = status.includes(target)
    if (has && status.length === 1) return
    onStatusChange(
      has
        ? status.filter(item => item !== target)
        : CREATOR_PERFORMANCE_STATUSES.filter(
            item => item === target || status.includes(item)
          )
    )
  }

  return (
    <div className="mb-4 rounded-[8px] border border-sz-n-200 bg-white">
      <FilterRow label="상태">
        <div className="flex flex-wrap gap-4">
          {CREATOR_PERFORMANCE_STATUSES.map(item => (
            <StatusCheck
              key={item}
              checked={status.includes(item)}
              label={PERFORMANCE_STATUS_LABEL[item]}
              count={statusCounts?.[item] ?? 0}
              onToggle={() => toggle(item)}
            />
          ))}
        </div>
      </FilterRow>
      <FilterRow label="검색">
        <input
          className="h-[30px] w-[300px] rounded-[6px] border border-sz-n-300 bg-white px-[11px] text-[12px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          placeholder="공구명 · 브랜드명 검색"
          aria-label="공구명 · 브랜드명 검색"
          value={keyword}
          onChange={event => onKeywordChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") onSearch()
          }}
        />
        <span className="flex gap-[7px]">
          <Btn variant="primary" className={BTN_SM} onClick={onSearch}>
            검색
          </Btn>
          <Btn variant="secondary" className={BTN_SM} onClick={onReset}>
            초기화
          </Btn>
        </span>
      </FilterRow>
    </div>
  )
}

/** 시안 `.filt-r` */
function FilterRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-sz-n-100 px-4 py-[11px] last:border-b-0">
      <span className="w-[34px] shrink-0 text-[11px] text-sz-n-600">
        {props.label}
      </span>
      {props.children}
    </div>
  )
}

/** 시안 `.chk` — 켜짐은 인디고 채움 + 흰 체크, 꺼짐은 테두리만 */
function StatusCheck(props: {
  checked: boolean
  label: string
  count: number
  onToggle: () => void
}) {
  const { checked, label, count, onToggle } = props
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-[7px] text-[12px]",
        checked ? "text-sz-n-900" : "text-sz-n-600"
      )}
    >
      <span
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-[3px]",
          checked
            ? "bg-sz-accent-500"
            : "border-[1.5px] border-sz-n-300 bg-white"
        )}
      >
        {checked && (
          <Check className="size-[10px] text-white" strokeWidth={3.2} />
        )}
      </span>
      {label}
      <span className="tabular-nums text-sz-n-500">{count}</span>
    </button>
  )
}

/** 시안 L1 `.tbar-l` — 「총 8건 · 정산 완료 4 · 조정 협의 2 · 집계 중 2」 */
export function TableSummary(props: {
  total: number
  /** 검색어가 있으면 칩 건수(기간 전체)와 합이 맞지 않아 총 건수만 적는다 */
  breakdown: Array<{ status: CreatorPerformanceStatus; count: number }> | null
}) {
  return (
    <span className="text-[12px] text-sz-n-600">
      총{" "}
      <b className="font-semibold text-sz-n-900">{formatNumber(props.total)}</b>
      건
      {props.breakdown?.map(item => (
        <span key={item.status}>
          {" "}
          · {PERFORMANCE_STATUS_LABEL[item.status]} {formatNumber(item.count)}
        </span>
      ))}
    </span>
  )
}

/**
 * 시안 L1 표 — 공구 · 브랜드 · 기간 · 확정 거래액 · 판매 수량 · 구매전환율 · 내 리워드 · 상태.
 * 집계 중 = 판매 · 리워드 전부 「—」(흐린 행) · 조정 협의 = 판매는 값 · 내 리워드 「합의 후 확정」.
 * 집계 중 행도 상세(D2)가 열린다(서버). 조회 전용이라 체크박스 · 관리 열이 없다.
 */
export function PerformanceTable(props: {
  rows: Array<CreatorPerformanceListItem>
  onRowClick: (row: CreatorPerformanceListItem) => void
}) {
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col />
        <col className="w-[112px]" />
        <col className="w-[136px]" />
        <col className="w-[126px]" />
        <col className="w-[96px]" />
        <col className="w-[100px]" />
        <col className="w-[118px]" />
        <col className="w-[98px]" />
      </colgroup>
      <thead>
        <tr>
          <th className={TH_CLASS}>공구</th>
          <th className={TH_CLASS}>브랜드</th>
          <th className={cn(TH_CLASS, "text-center")}>기간</th>
          <th className={cn(TH_CLASS, "text-center")}>확정 거래액</th>
          <th className={cn(TH_CLASS, "text-center")}>판매 수량</th>
          <th className={cn(TH_CLASS, "text-center")}>구매전환율</th>
          <th className={cn(TH_CLASS, "text-center")}>내 리워드</th>
          <th className={cn(TH_CLASS, "text-center")}>상태</th>
        </tr>
      </thead>
      <tbody>
        {props.rows.map(row => {
          const collecting = row.status === "COLLECTING"
          const cellValue = (value: string | null) =>
            collecting || value === null ? DASH : value
          return (
            <tr
              key={row.groupBuyId}
              onClick={() => props.onRowClick(row)}
              className={cn(
                "group cursor-pointer hover:bg-sz-accent-50 [&:first-child>td]:border-t-0",
                collecting && "text-sz-n-400"
              )}
            >
              <td className={TD_CLASS}>
                <span className="block truncate font-medium text-sz-n-900 group-hover:text-sz-accent-600">
                  {row.groupBuyTitle}
                </span>
              </td>
              <td className={cn(TD_CLASS, "truncate")}>{row.brandName}</td>
              <td
                className={cn(
                  TD_NUM,
                  "whitespace-nowrap",
                  !collecting && "text-sz-n-500"
                )}
              >
                {formatPeriod(row.periodStartAt, row.periodEndAt)}
              </td>
              <td className={TD_NUM}>
                {cellValue(
                  row.confirmedSalesAmount === null
                    ? null
                    : formatWon(row.confirmedSalesAmount)
                )}
              </td>
              <td className={TD_NUM}>
                {cellValue(
                  row.confirmedQuantity === null
                    ? null
                    : `${formatNumber(row.confirmedQuantity)}개`
                )}
              </td>
              <td className={TD_NUM}>
                {cellValue(
                  row.conversionRate === null
                    ? null
                    : formatRate(row.conversionRate)
                )}
              </td>
              <td className={TD_NUM}>
                {row.rewardStage === "CONFIRMED" &&
                row.myRewardAmount !== null ? (
                  formatWon(row.myRewardAmount)
                ) : row.rewardStage === "AFTER_AGREEMENT" ? (
                  <span className="text-sz-n-500">
                    {REWARD_STAGE_LABEL.AFTER_AGREEMENT}
                  </span>
                ) : (
                  DASH
                )}
              </td>
              <td className={cn(TD_CLASS, "text-center")}>
                <ToneBadge tone={row.statusTone}>{row.statusLabel}</ToneBadge>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** 시안 L1 표 아래 `.tip` */
export function ListTip() {
  return (
    <div className="mt-3 text-[11px] leading-[1.7] text-sz-n-500">
      집계 중인 공구는 <B>모든 주문 처리가 끝나면 열람할 수 있습니다</B>. 진행
      중인 공구는 <B>공구 관리</B>에서 확인합니다.
    </div>
  )
}

/** 시안 L2 — 표 · 필터 대신 갈 곳을 준다 */
export function NoEndedGroupBuy(props: { onGoGroupBuy: () => void }) {
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white p-4">
      <EmptyBox
        title="공구 종료 후 성과가 집계됩니다"
        action={
          <Btn variant="secondary" onClick={props.onGoGroupBuy}>
            공구 관리로 이동
          </Btn>
        }
      >
        진행 중인 공구는 <B>공구 관리</B>에서 확인할 수 있습니다.
      </EmptyBox>
    </div>
  )
}

/** 종료 공구는 있는데 검색 조건에 맞는 행이 없을 때(시안에 없는 상태 — 정산 관리와 같은 꼴) */
export function NoMatch(props: { keyword: string; onReset: () => void }) {
  return (
    <EmptyBox
      title="검색 조건에 맞는 공구가 없습니다"
      action={
        <Btn variant="secondary" onClick={props.onReset}>
          검색 조건 초기화
        </Btn>
      }
    >
      {props.keyword
        ? `“${props.keyword}”에 해당하는 공구명 · 브랜드명이 없습니다. 상태 조건도 함께 확인해 주세요.`
        : "선택한 상태에 해당하는 공구가 없습니다."}
    </EmptyBox>
  )
}

export function LoadFailed(props: { onRetry: () => void }) {
  return (
    <EmptyBox
      title="성과를 불러오지 못했습니다"
      action={
        <Btn variant="primary" onClick={props.onRetry}>
          다시 시도
        </Btn>
      }
    >
      잠시 후 다시 시도해 주세요.
    </EmptyBox>
  )
}
