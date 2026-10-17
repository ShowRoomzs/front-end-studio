import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { SETTLEMENT_STATUS_LABEL } from "@/features/settlement/constants/params"
import {
  SETTLEMENT_STATUSES,
  type CreatorBusinessType,
  type SettlementListParams,
  type SettlementStatus,
  type SettlementStatusCounts,
  type SettlementSummary,
} from "@/features/settlement/types"
import {
  formatMonthDay,
  formatMonthDayTime,
  formatWonOrDash,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { ReactNode } from "react"

/**
 * 화면 루트 — 시안 body `line-height:1.6`. 셸 기본(1.5)을 그대로 두면 카드 · 표 행마다 1~2px씩 줄어
 * 상세 한 장에서 50px 넘게 어긋난다(상속받는 글자 전부가 대상이라 루트에 한 번만 건다).
 */
export const SETTLEMENT_PAGE_CLASS = "leading-[1.6]"

export const SETTLEMENT_DESCRIPTION =
  "공구별 내 리워드가 어떻게 계산되고 언제 지급되는지 확인합니다."

/** 시안 `.page-h` — 셸 H1 대신 화면이 제목 · 설명을 그린다 */
export function SettlementPageHeader(props: {
  title: string
  description: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">
          {props.title}
        </h1>
        <div className="mt-0.5 text-[12px] text-sz-n-600">
          {props.description}
        </div>
      </div>
      {props.right}
    </div>
  )
}

/**
 * 시안 `.kgrid.c4` — 누적 수령 · 지급 예정 · 정산 확인 중 · 조정 협의.
 * 건수가 0이면 서버가 금액을 null로 내린다 — 0원이 아니라 「—」(0원은 실적처럼 읽힌다 · L2).
 */
export function SettlementKpis(props: {
  summary: SettlementSummary | undefined
  /** 내 세무 구분 — 사업자의 실지급액은 리워드 + 부가세라 「세후」라고 적으면 틀린 말이 된다 */
  businessType: CreatorBusinessType | null
}) {
  const { summary, businessType } = props
  const business = businessType === "BUSINESS"
  const paid = summary?.totalPaid
  const scheduled = summary?.payoutScheduled
  const reviewing = summary?.reviewing
  const adjustingCount = summary?.adjusting.count ?? 0
  const paidCount = paid?.count ?? 0
  const scheduledCount = scheduled?.count ?? 0
  const reviewingCount = reviewing?.count ?? 0

  return (
    <div className="mb-4 grid grid-cols-4 gap-3">
      <Kpi
        label="누적 수령"
        value={formatWonOrDash(paid?.amount ?? null)}
        sub={
          paidCount > 0
            ? `지급 완료 ${paidCount}건 · ${business ? "부가세 포함" : "세후"}`
            : "지급 완료 0건"
        }
      />
      <Kpi
        label="지급 예정"
        value={formatWonOrDash(scheduled?.amount ?? null)}
        sub={
          scheduledCount > 0
            ? scheduled?.nearestDate
              ? `${scheduledCount}건 · ${formatMonthDay(scheduled.nearestDate)} 지급 예정`
              : // 예정 건이 전부 보류(BLOCKED)면 날짜가 없다 — 사업자 = 세금계산서 · 비사업자 = 주민등록번호
                `${scheduledCount}건 · ${business ? "세금계산서 확인 후 지급" : "주민등록번호 등록 후 지급"}`
            : "예정 없음"
        }
      />
      <Kpi
        label="정산 확인 중"
        value={reviewingCount > 0 ? `${reviewingCount}건` : "—"}
        sub={
          reviewingCount > 0
            ? reviewing?.nearestDueAt
              ? `${formatMonthDayTime(reviewing.nearestDueAt)}까지 조정 요청 가능`
              : "확인 기간 종료 · 확정 대기"
            : "확인할 정산 없음"
        }
      />
      <Kpi
        label="조정 협의"
        value={adjustingCount > 0 ? `${adjustingCount}건` : "—"}
        sub={
          adjustingCount > 0 ? "합의 전까지 지급 보류" : "협의 중인 정산 없음"
        }
      />
    </div>
  )
}

/** 시안 `.kc` */
function Kpi(props: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="text-[11px] text-sz-n-600">{props.label}</div>
      <div className="mt-[5px] text-[21px] font-semibold leading-[1.2] tabular-nums text-sz-n-900">
        {props.value}
      </div>
      <div className="mt-1 text-[11px] tabular-nums text-sz-n-500">
        {props.sub}
      </div>
    </div>
  )
}

/**
 * 시안 `.qform` — 상태(복수 · 기본 전부 켬) / 검색어.
 * 상태는 바로 적용되고 검색어만 [검색] · Enter로 적용된다. 상태는 하나는 남아야 한다 — 전부 끄면
 * 「전체」와 같은데 화면은 아무것도 고르지 않은 것처럼 보인다(파트너센터 정산 관리와 같은 규칙).
 */
export function SettlementFilters(props: {
  params: SettlementListParams
  keyword: string
  statusCounts: SettlementStatusCounts | undefined
  onChange: (next: Partial<SettlementListParams>) => void
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onReset: () => void
}) {
  const {
    params,
    keyword,
    statusCounts,
    onChange,
    onKeywordChange,
    onSearch,
    onReset,
  } = props
  const selected = ([] as Array<SettlementStatus>).concat(params.status)

  const toggle = (status: SettlementStatus) => {
    const has = selected.includes(status)
    if (has && selected.length === 1) return
    onChange({
      status: has
        ? selected.filter(item => item !== status)
        : SETTLEMENT_STATUSES.filter(
            item => item === status || selected.includes(item)
          ),
      page: 1,
    })
  }

  return (
    <div className="mb-3 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterLabel>상태</FilterLabel>
        {SETTLEMENT_STATUSES.map(status => (
          <StatusCheck
            key={status}
            checked={selected.includes(status)}
            label={SETTLEMENT_STATUS_LABEL[status]}
            count={statusCounts?.[status] ?? 0}
            onToggle={() => toggle(status)}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 border-t border-sz-n-100 pt-2.5">
        <FilterLabel>검색</FilterLabel>
        <input
          className={cn(INPUT_CLASS, "h-8 w-[320px]")}
          placeholder="공구명 · 브랜드명 검색"
          aria-label="공구명 · 브랜드명 검색"
          value={keyword}
          onChange={event => onKeywordChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") onSearch()
          }}
        />
        <Btn variant="primary" onClick={onSearch}>
          검색
        </Btn>
        <Btn variant="secondary" onClick={onReset}>
          초기화
        </Btn>
      </div>
    </div>
  )
}

function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <span className="w-[62px] shrink-0 text-[11px] font-semibold text-sz-n-500">
      {children}
    </span>
  )
}

/** 시안 `.fp-item` — 색 없는 체크 + 건수 */
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
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px]",
        checked ? "font-medium text-sz-n-900" : "text-sz-n-600"
      )}
    >
      <span
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
          checked
            ? "border-sz-accent-500 bg-sz-accent-500"
            : "border-sz-n-300 bg-white"
        )}
      >
        {checked && <Check className="size-[9px] text-white" strokeWidth={3} />}
      </span>
      {label}
      <span
        className={cn(
          "text-[11px]",
          checked ? "text-sz-n-500" : "text-sz-n-400"
        )}
      >
        {count}
      </span>
    </button>
  )
}

/**
 * 빈 상태 — 정산이 아예 없음(L2: 신규 인플루언서가 가장 먼저 보는 화면 · 여기서 만들 수 있는 게
 * 없으니 CTA는 공구 관리) / 검색 조건에 맞는 정산 없음.
 */
export function SettlementEmptyState(props: {
  hasCondition: boolean
  keyword: string
  onReset: () => void
  onGoGroupBuy: () => void
}) {
  const { hasCondition, keyword, onReset, onGoGroupBuy } = props

  if (hasCondition) {
    return (
      <EmptyBox
        title="검색 조건에 맞는 정산 내역이 없습니다"
        action={
          <Btn variant="secondary" onClick={onReset}>
            검색 조건 초기화
          </Btn>
        }
      >
        {keyword
          ? `“${keyword}”에 해당하는 공구명 · 브랜드명이 없습니다. 상태 조건도 함께 확인해 주세요.`
          : "선택한 상태에 해당하는 정산 내역이 없습니다."}
      </EmptyBox>
    )
  }

  return (
    <EmptyBox
      title="정산 내역이 없습니다"
      action={
        <Btn variant="secondary" onClick={onGoGroupBuy}>
          공구 관리로 이동
        </Btn>
      }
    >
      공구가 종료되고 <b className="font-semibold">모든 주문 처리가 끝나면</b>{" "}
      정산이 생성되고, <b className="font-semibold">3영업일 확인 기간</b>을 거쳐
      자동 확정됩니다.
    </EmptyBox>
  )
}

/** 시안 `.empty` */
function EmptyBox(props: {
  title: string
  children: ReactNode
  action: ReactNode
}) {
  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {props.title}
      </div>
      <div className="text-[12px] text-sz-n-500">{props.children}</div>
      <div className="mt-4">{props.action}</div>
    </div>
  )
}
