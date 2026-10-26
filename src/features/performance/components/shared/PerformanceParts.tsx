import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { PERFORMANCE_TONE_VARIANT } from "@/features/performance/constants/params"
import type { PerformanceTone } from "@/features/performance/types"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/*
  ui-studio-10 공용 원자 — 시안 `.page-h` · `.kpi .k` · `.card` · `.grp` · `.mini .m` · `.sum` · `.tip` · `.est`.
  값(크기 · 색 · 간격)은 시안 CSS 그대로다.
*/

/**
 * 화면 루트 — 시안 body `line-height:1.6`(셸 기본 1.5면 카드 · 표 행마다 1~2px씩 줄어든다 — 정산 관리와 같은 판단).
 */
export const PERFORMANCE_PAGE_CLASS = "leading-[1.6]"

/** 시안 `thead td` · `tbody td` */
export const TH_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-left text-[11px] font-semibold tracking-[.2px] text-sz-n-600"
export const TD_CLASS =
  "border-t border-sz-n-100 px-4 py-[13px] align-middle text-[12px]"
export const TD_NUM = cn(TD_CLASS, "text-center tabular-nums")

/** 시안 `.page-h` — 셸 H1 대신 화면이 제목 · 설명을 그린다 */
export function PageHeader(props: {
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

export function ToneBadge(props: {
  tone: PerformanceTone
  children: ReactNode
  className?: string
}) {
  return (
    <span className={props.className}>
      <StatusBadge variant={PERFORMANCE_TONE_VARIANT[props.tone]}>
        {props.children}
      </StatusBadge>
    </span>
  )
}

/** 시안 `.est` — 줄어들 수 있는 값에만 붙는 회색 「예정」 태그 */
export function EstTag() {
  return (
    <span className="ml-1.5 inline-block whitespace-nowrap rounded-[4px] bg-sz-n-100 px-1.5 py-px align-[1px] text-[10px] font-medium leading-[1.6] tracking-normal text-sz-n-600">
      예정
    </span>
  )
}

/** KPI 숫자 옆 단위 — 시안 `<span style="font-size:12px;font-weight:400"> 원</span>` */
export function Unit({ children }: { children: ReactNode }) {
  return <span className="text-[12px] font-normal"> {children}</span>
}

/** 시안 `.kpi .k` — `hi`는 화면의 주인공 카드(인디고 바탕) */
export function KpiTile(props: {
  label: string
  value: ReactNode
  sub: ReactNode
  hi?: boolean
  dim?: boolean
}) {
  const { label, value, sub, hi = false, dim = false } = props
  return (
    <div
      className={cn(
        "min-w-0 rounded-[6px] border px-[14px] py-3",
        hi ? "border-sz-accent-100 bg-sz-accent-50" : "border-sz-n-200 bg-white"
      )}
    >
      <div
        className={cn(
          "text-[11px]",
          hi ? "text-sz-accent-600" : "text-sz-n-600"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-[19px] font-semibold leading-[1.2] tracking-[-.02em] tabular-nums",
          dim ? "text-sz-n-500" : hi ? "text-sz-accent-600" : "text-sz-n-900"
        )}
      >
        {value}
      </div>
      <div className="mt-[5px] text-[11px] tabular-nums text-sz-n-500">
        {sub}
      </div>
    </div>
  )
}

/** 시안 `.card` — 머리(`.card-h`)의 자식은 양 끝으로 벌어진다(제목 · 보조 · 태그) */
export function Card(props: {
  title?: ReactNode
  note?: ReactNode
  tag?: ReactNode
  className?: string
  children: ReactNode
}) {
  const { title, note, tag, className, children } = props
  return (
    <section
      className={cn(
        "mb-4 rounded-[8px] border border-sz-n-200 bg-white last:mb-0",
        className
      )}
    >
      {title !== undefined && (
        <div className="flex items-center justify-between gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px] text-[13px] font-semibold text-sz-n-900">
          <span>{title}</span>
          {note !== undefined && (
            <span className="text-[11px] font-normal text-sz-n-500">
              {note}
            </span>
          )}
          {tag}
        </div>
      )}
      {children}
    </section>
  )
}

/** 시안 `.card-b` */
export function CardBody(props: { children: ReactNode; className?: string }) {
  return <div className={cn("p-4", props.className)}>{props.children}</div>
}

/** 시안 `.grp` — 유입 · 판매 · 소비자 · 팔로워 · 리워드 묶음 제목(질문 한 줄) */
export function Grp(props: { title: string; sub: string }) {
  return (
    <div className="mb-3 mt-5 flex items-baseline gap-[9px]">
      <span className="text-[13px] font-semibold text-sz-n-900">
        {props.title}
      </span>
      <span className="text-[11px] text-sz-n-500">{props.sub}</span>
    </div>
  )
}

/** 시안 `.mini .m` */
export function MiniStat(props: {
  label: string
  value: ReactNode
  sub: ReactNode
  dim?: boolean
}) {
  return (
    <div className="min-w-0 rounded-[6px] border border-sz-n-200 px-[13px] py-[11px]">
      <div className="text-[11px] text-sz-n-600">{props.label}</div>
      <div
        className={cn(
          "mt-1.5 text-[19px] font-semibold leading-[1.2] tracking-[-.02em] tabular-nums",
          props.dim ? "text-sz-n-500" : "text-sz-n-900"
        )}
      >
        {props.value}
      </div>
      <div className="mt-[5px] text-[11px] text-sz-n-500">{props.sub}</div>
    </div>
  )
}

/** 시안 `.tip` */
export function Tip(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-3 text-[11px] leading-[1.7] text-sz-n-500",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

/** 시안 `.tip b` 등 본문 강조 */
export function B({ children }: { children: ReactNode }) {
  return <b className="font-semibold">{children}</b>
}

/** 시안 `.sumrow` · `.sumrow.tot` */
export function SumRow(props: {
  label: ReactNode
  sub?: ReactNode
  value: ReactNode
  total?: boolean
  valueClassName?: string
}) {
  const { label, sub, value, total = false, valueClassName } = props
  return (
    <div
      className={cn(
        "flex justify-between gap-3 py-[5px] text-[12px]",
        total && "mt-1.5 border-t border-sz-n-200 pt-2.5 font-semibold"
      )}
    >
      <span className={total ? "text-sz-n-900" : "text-sz-n-600"}>
        {label}
        {sub !== undefined && (
          <>
            {" "}
            <span
              className={cn(
                "text-[11px] text-sz-n-500",
                total && "font-normal"
              )}
            >
              {sub}
            </span>
          </>
        )}
      </span>
      <span
        className={cn(
          "shrink-0 text-right tabular-nums text-sz-n-900",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  )
}

/** 불러오기 실패 · 찾을 수 없음 · 빈 상태 상자(시안 `.empty`) */
export function EmptyBox(props: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {props.title}
      </div>
      {props.children !== undefined && (
        <div className="text-[12px] leading-[1.6] text-sz-n-500">
          {props.children}
        </div>
      )}
      {props.action !== undefined && (
        <div className="mt-4 flex justify-center gap-1.5">{props.action}</div>
      )}
    </div>
  )
}
