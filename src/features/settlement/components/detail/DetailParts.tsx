import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { DS_TD_CLASS, DS_TH_CLASS, DS_TR_CLASS } from "@/common/styles/table"

/*
  시안 ui-studio-12의 원자 조각 — 파트너센터 13의 head를 통째로 포크한 마크업이라
  (.grp · .sec · .mtab · .ltab · .frow · .note2) 이 화면 안에서만 쓴다.
*/

/** 시안 본문 강조 `<b>` — 600(preflight의 bolder가 아니다) */
export function B(props: { children: ReactNode; className?: string }) {
  return (
    <b className={cn("font-semibold", props.className)}>{props.children}</b>
  )
}

/** 시안 `.grp` — 금액 · 분배·지급 · 증빙 · 명세 묶음 제목 */
export function Grp(props: { title: string; sub: string }) {
  return (
    <div className="mb-3 mt-5 flex items-baseline gap-[9px] border-b-[1.5px] border-sz-n-300 pb-2">
      <span className="text-[16px] font-semibold text-sz-n-900">
        {props.title}
      </span>
      <span className="text-[11px] text-sz-n-500">{props.sub}</span>
    </div>
  )
}

/** 시안 `.sec` / `.sec-h` / `.sec-b` */
export function Sec(props: {
  title?: string
  note?: ReactNode
  /** 헤더 우측 끝(배지) */
  right?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  const { title, note, right, className, bodyClassName, children } = props
  return (
    <section
      className={cn(
        "mb-4 rounded-[8px] border border-sz-n-200 bg-white",
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
          {note && <span className="text-[11px] text-sz-n-500">{note}</span>}
          {/* flex로 감싼다 — inline span이면 16px 루트 글자의 줄 상자가 생겨 헤더가 4px 커진다 */}
          {right && <span className="ml-auto flex">{right}</span>}
        </div>
      )}
      <div className={cn("px-4 py-3", bodyClassName)}>{children}</div>
    </section>
  )
}

/** 시안 상단 요약 바 — `.sec` 안의 한 줄(정산 생성일 · 확인 기간 · 정산 근거) */
export function InlineBar(props: { children: ReactNode }) {
  return (
    <Sec bodyClassName="flex flex-wrap items-center gap-6 px-4 py-3">
      {props.children}
    </Sec>
  )
}

export function InlineItem(props: {
  label: string
  children: ReactNode
  tone?: "warning"
}) {
  return (
    <span className="text-[12px] text-sz-n-600">
      {props.label}{" "}
      <b
        className={cn(
          "font-semibold tabular-nums",
          props.tone === "warning" ? "text-sz-warning-text" : "text-sz-n-900"
        )}
      >
        {props.children}
      </b>
    </span>
  )
}

/** 시안 `.note2` */
export function Note(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-3 text-[11px] text-sz-n-500", props.className)}>
      {props.children}
    </div>
  )
}

/** 시안 `.mnote` — 셀 안 보조 줄. `inline`은 금액 옆 증감(시안 `style="display:inline"`) */
export function MNote(props: { children: ReactNode; inline?: boolean }) {
  return (
    <span
      className={cn(
        "break-keep text-[11px] font-normal normal-nums text-sz-n-500",
        props.inline ? "inline" : "mt-0.5 block"
      )}
    >
      {props.children}
    </span>
  )
}

// ── 금액 분해 표(.mtab) ──────────────────────────────

export type MRowKind = "base" | "sub" | "rate" | "mid" | "tot"

/**
 * 디자인 시스템 v1.3(파트너센터) `.calc` 계산 명세표의 색 · 선 — 세 웹 앱 공통(11-21).
 * 칸 여백은 시안 `.mtab`(10px 12px)을 따른다(표 여백은 시안 우선 · 11-21 사용자 결정).
 * 바깥 테두리 없음 · 아래 선 n-100 · 라벨 n-600 · 값 n-900 오른쪽 정렬.
 * sub = 하위 행(10px 더 들여쓰기 · 11px n-500) · tot = 합계(위 1.5px n-300 · 16px/600).
 * mid(소계)는 `.calc`에 없어 기본 행에 600만 더한다. rate는 기본 행과 같다.
 */
const MCELL = "border-b border-sz-n-100 px-3 py-2.5"

const MLABEL_CLASS: Record<MRowKind, string> = {
  base: "text-sz-n-600",
  sub: "pl-[22px] text-[11px] text-sz-n-500",
  rate: "text-sz-n-600",
  mid: "font-semibold text-sz-n-900",
  tot: "border-b-0 border-t-[1.5px] border-t-sz-n-300 pt-2.5 text-[16px] font-semibold text-sz-n-900",
}

const MAMOUNT_CLASS: Record<MRowKind, string> = {
  base: "text-sz-n-900",
  sub: "text-[11px] text-sz-n-500",
  rate: "text-sz-n-900",
  mid: "font-semibold text-sz-n-900",
  tot: "border-b-0 border-t-[1.5px] border-t-sz-n-300 pt-2.5 text-[16px] font-semibold text-sz-n-900",
}

/** `.calc` — 표 하나. 바깥 테두리 · 머리가 없다 */
export function MTable(props: { children: ReactNode; className?: string }) {
  return (
    <table
      className={cn("w-full border-collapse text-[12px]", props.className)}
    >
      <tbody>{props.children}</tbody>
    </table>
  )
}

/**
 * `.calc` 한 줄 — 금액 칸은 우측 정렬 · tabular-nums.
 * `textValue`는 금액이 아닌 값(요청자 · 시각)이라 좌측 정렬로 둔다(조정 내역).
 */
export function MRow(props: {
  kind?: MRowKind
  label: ReactNode
  note?: ReactNode
  children: ReactNode
  textValue?: boolean
  valueClassName?: string
}) {
  const {
    kind = "base",
    label,
    note,
    children,
    textValue = false,
    valueClassName,
  } = props
  return (
    <tr>
      <td className={cn(MCELL, MLABEL_CLASS[kind])}>
        {label}
        {note && <MNote>{note}</MNote>}
      </td>
      <td
        className={cn(
          MCELL,
          textValue ? "text-left" : "text-right tabular-nums",
          MAMOUNT_CLASS[kind],
          valueClassName
        )}
      >
        {children}
      </td>
    </tr>
  )
}

// ── 링크 표(.ltab) ───────────────────────────────────

/** 링크 표 — 디자인 시스템 표(compact) 규격 */
export const LTAB_HEAD = DS_TH_CLASS
export const LTAB_ROW = DS_TR_CLASS
export const LTAB_CELL = DS_TD_CLASS
export const LTAB_NUM = "text-right tabular-nums"

// ── 읽기 전용 행(.frow.ro) · 작은 버튼(.act-btn) ──────

export function ReadRow(props: {
  label: string
  children: ReactNode
  sub?: ReactNode
  muted?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0",
        props.className
      )}
    >
      <div className="w-[140px] shrink-0 text-sz-n-500">{props.label}</div>
      <div
        className={cn(
          "min-w-0 flex-1",
          props.muted ? "text-sz-n-500" : "text-sz-n-900"
        )}
      >
        {props.children}
        {props.sub && (
          <div className="mt-0.5 text-[11px] text-sz-n-500">{props.sub}</div>
        )}
      </div>
    </div>
  )
}

/** 시안 `.act-btn` 자리 — 디자인 시스템 `.btn-secondary`(12px/500 · 32px) */
export function ActBtn(props: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="inline-flex h-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"
    >
      {props.children}
    </button>
  )
}

/** [자문대기-…] 표시 — 시안의 빨간 굵은 태그(파트너센터와 같은 처리) */
export function WaitTag({ children }: { children: ReactNode }) {
  return <b className="font-semibold text-sz-danger-text">{children}</b>
}

/**
 * 시안 13 `.szb` — 상태 배지 옆 보조 배지(경고 · 점 없음 · 20px). 상태 라벨을 바꾸지 않고 사정만 덧붙인다
 * (S6 「지급 정지 · 계정 이용 정지」).
 */
export function SubBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded-[6px] bg-sz-warning-bg px-[7px] text-[11px] font-medium whitespace-nowrap text-sz-warning-text">
      {children}
    </span>
  )
}
