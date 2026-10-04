import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { FORM_SELECT_CHEVRON_STYLE } from "@/features/contracts/constants/params"
import { toneToVariant } from "@/features/contracts/utils/statusBadge"
import type { GroupBuyTone } from "@/features/groupBuy/types"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import {
  Fragment,
  useCallback,
  useEffect,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"

/*
  시안 ui-studio-09-groupbuys의 원자 조각(파트너센터와 같은 마크업) — 이 화면 안에서만 쓴다.
  버튼·조항 박스(.btn · .terms)는 계약 관리와 같은 규격이라 그쪽 것을 가져다 쓰고,
  공구에만 있는 조각(.ck 체크리스트 · .kpi · .pbar · .post · .duty · 모달)을 여기 둔다.
*/

/** 시안 본문 강조 `<b>` — 600(preflight의 bolder가 아니다) */
export function B(props: { children: ReactNode; className?: string }) {
  return (
    <b className={cn("font-semibold", props.className)}>{props.children}</b>
  )
}

export function GbBadge(props: { tone: GroupBuyTone; children: ReactNode }) {
  return (
    <StatusBadge variant={toneToVariant(props.tone)}>
      {props.children}
    </StatusBadge>
  )
}

// ── 카드 안 행 ────────────────────────────────────────

/** 시안 `.frow.ro` — 라벨 140px · 9px 패딩 · 읽기 전용 행 */
export function FRow(props: {
  label: ReactNode
  children: ReactNode
  alignCenter?: boolean
}) {
  const { label, children, alignCenter = false } = props
  return (
    <div
      className={cn(
        "flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0",
        alignCenter && "items-center"
      )}
    >
      <div className="w-[140px] shrink-0 text-sz-n-500">{label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">{children}</div>
    </div>
  )
}

/** 시안 `.fsub` */
export function FSub(props: { children: ReactNode }) {
  return (
    <div className="mt-[2px] text-[11px] text-sz-n-500">{props.children}</div>
  )
}

// ── 준비 조건 체크리스트(.ck) ─────────────────────────

export type CheckTone = "done" | "wait" | "todo"

export interface CheckRow {
  key: string
  tone: CheckTone
  label: string
  sub?: ReactNode
  /** 오른쪽 값(시각·건수) 또는 버튼 */
  right?: ReactNode
}

export function Checklist(props: {
  rows: Array<CheckRow>
  className?: string
}) {
  const { rows, className } = props
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[6px] border border-sz-n-200",
        className
      )}
    >
      {rows.map(row => (
        <div
          key={row.key}
          className={cn(
            "flex items-center gap-2.5 border-b border-sz-n-100 px-[13px] py-3 text-[12px] last:border-b-0",
            row.tone === "wait" && "bg-[#FDFAF4]",
            row.tone === "todo" ? "text-sz-n-500" : "text-sz-n-900"
          )}
        >
          <span
            className={cn(
              "flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              row.tone === "done" && "bg-sz-success-bg text-sz-success-text",
              row.tone === "wait" && "bg-sz-warning-bg text-sz-warning-text",
              row.tone === "todo" && "bg-sz-n-100 text-sz-n-400"
            )}
          >
            {row.tone === "done" ? "✓" : row.tone === "wait" ? "!" : "·"}
          </span>
          <span
            className={cn("flex-1", row.tone === "wait" && "font-semibold")}
          >
            {row.label}
            {row.sub && (
              <span className="mt-[2px] block text-[11px] font-normal text-sz-n-500">
                {row.sub}
              </span>
            )}
          </span>
          {typeof row.right === "string" ? (
            <span className="shrink-0 text-[11px] tabular-nums text-sz-n-500">
              {row.right}
            </span>
          ) : (
            row.right
          )}
        </div>
      ))}
    </div>
  )
}

// ── 이행 확인 의무 줄(.duty) ─────────────────────────

export function DutyList(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[6px] border border-sz-n-200",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

export function DutyRow(props: {
  label: string
  sub: string
  /** 상대가 확인하는 줄 — 흐리게(.duty-r.ro) */
  readOnly?: boolean
  value: string
  valueTone?: "none" | "ok" | "bad"
}) {
  const { label, sub, readOnly = false, value, valueTone = "none" } = props
  return (
    <div className="flex items-center gap-2.5 border-b border-sz-n-100 px-[13px] py-[11px] text-[12px] last:border-b-0">
      <span className={cn("flex-1", readOnly && "text-sz-n-600")}>
        {label}
        <span
          className={cn(
            "mt-[2px] block text-[11px]",
            readOnly ? "text-sz-n-400" : "text-sz-n-500"
          )}
        >
          {sub}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 text-[11px] tabular-nums",
          valueTone === "none" && "text-sz-n-500",
          valueTone === "ok" && "font-semibold text-sz-success-text",
          valueTone === "bad" && "font-semibold text-sz-danger-text"
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ── 판매 실적 KPI(.kpi) · 진행 막대(.pbar) ────────────

export interface KpiItem {
  value: string
  label: string
  sub: string
}

export function KpiRow(props: { items: Array<KpiItem> }) {
  return (
    <div className="flex gap-3">
      {props.items.map(item => (
        <div
          key={item.label}
          className="flex-1 rounded-[6px] border border-sz-n-200 bg-white px-3.5 py-3"
        >
          <div className="text-[19px] font-semibold tabular-nums text-sz-n-900">
            {item.value}
          </div>
          <div className="mt-[3px] text-[11px] text-sz-n-600">{item.label}</div>
          <div className="mt-[2px] text-[10px] tabular-nums text-sz-n-400">
            {item.sub}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PeriodProgress(props: {
  elapsedDays: number
  totalDays: number
  endText: string
}) {
  const { elapsedDays, totalDays, endText } = props
  const percent =
    totalDays > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
      : 0
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex justify-between text-[11px] text-sz-n-600">
        <span>
          기간 진행{" "}
          <b className="font-semibold text-sz-n-900">
            {elapsedDays}일 / {totalDays}일
          </b>
        </span>
        <span className="tabular-nums">종료 {endText}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-[3px] bg-sz-n-200">
        <i
          className="block h-full rounded-[3px] bg-sz-accent-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ── 진행 단계(.steps) ────────────────────────────────

export type StepTone = "todo" | "done" | "cur" | "warn" | "halt"

export interface GbStep {
  label: string
  who: string
  tone: StepTone
}

const STEP_CLASS: Record<StepTone, string> = {
  todo: "border-sz-n-200 bg-white text-sz-n-400",
  done: "border-sz-n-200 bg-sz-n-100 text-sz-n-600",
  cur: "border-sz-accent-500 bg-sz-accent-50 font-semibold text-sz-accent-600",
  // 시안 `.stp.cur.warn` — 중단 예정
  warn: "border-[#E8DCC0] bg-sz-warning-bg font-semibold text-sz-warning-text",
  // 시안 `.stp.halt` — 중단(종결)
  halt: "border-sz-n-300 bg-sz-n-100 font-semibold text-sz-n-600",
}

const STEP_WHO_CLASS: Record<StepTone, string> = {
  todo: "text-sz-n-400",
  done: "text-sz-n-500",
  cur: "text-sz-accent-600",
  warn: "text-sz-warning-text",
  halt: "text-sz-n-500",
}

export function GbStepper(props: { steps: Array<GbStep> }) {
  return (
    <div className="flex flex-wrap items-center gap-[3px]">
      {props.steps.map((step, index) => (
        <Fragment key={`${step.label}-${index}`}>
          {index > 0 && <span className="text-[11px] text-sz-n-300">›</span>}
          <span
            className={cn(
              "rounded-[6px] border px-2.5 py-1.5 text-[11px] leading-[1.35]",
              STEP_CLASS[step.tone]
            )}
          >
            {step.label}
            <span
              className={cn(
                "mt-px block text-[10px] font-normal tabular-nums",
                STEP_WHO_CLASS[step.tone]
              )}
            >
              {step.who}
            </span>
          </span>
        </Fragment>
      ))}
    </div>
  )
}

// ── 빈 상태(.empty) ──────────────────────────────────

export function GbEmpty(props: {
  title: string
  children?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  const { title, children, action, compact = false } = props
  return (
    <div
      className={cn("text-center", compact ? "px-5 py-10" : "px-6 py-[72px]")}
    >
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {title}
      </div>
      {children && (
        <div className="text-[12px] leading-relaxed text-sz-n-500">
          {children}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── 모달(.modal) ─────────────────────────────────────

/**
 * 시안 `.modal` 셸 — 헤더 14px/20px · 본문 20px · 푸터 12px/20px.
 * 공용 ModalShell은 22px 규격(계약 작성 폼 기준)이라 이 화면의 모달과 어긋난다.
 */
export function GbModal(props: {
  title: string
  width?: number
  onClose: () => void
  footer: ReactNode
  children: ReactNode
}) {
  const { title, width = 480, onClose, footer, children } = props

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [handleKeyDown])

  return (
    // 바깥 클릭으로 닫지 않는다 — 입력한 사유가 빗나간 클릭 한 번에 날아가면 안 된다
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,27,31,0.4)]">
      <div
        className="flex max-h-[90vh] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
        style={{ width }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-sz-n-400 hover:text-sz-n-600"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700">
          {children}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-sz-n-200 px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  )
}

/** 시안 `.msum` — 모달 상단 요약 */
export function MSum(props: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[2px]">
      {props.children}
    </div>
  )
}

export function MSumRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-[14px] border-b border-sz-n-200 py-2 text-[12px] last:border-b-0">
      <div className="w-[96px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="flex-1 leading-[1.6] text-sz-n-700 tabular-nums">
        {props.children}
      </div>
    </div>
  )
}

/** 시안 `.mlabel` — 첫 필드는 위 여백 없음 */
export function MLabel(props: {
  children: ReactNode
  required?: boolean
  optional?: boolean
  first?: boolean
}) {
  const { children, required = false, optional = false, first = false } = props
  return (
    <label
      className={cn(
        "mb-1 block text-[12px] font-medium text-sz-n-600",
        first ? "mt-0" : "mt-4"
      )}
    >
      {children}
      {required && <span className="ml-0.5 text-sz-danger-text">*</span>}
      {optional && <span className="ml-1 font-normal text-sz-n-400">선택</span>}
    </label>
  )
}

export function MHint(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-1.5 text-[11px] text-sz-n-500", props.className)}>
      {props.children}
    </div>
  )
}

/** 시안 `.mwarn` — 기본은 무채색 고지, danger는 미이행 제출(C7) 전용 붉은 테두리 */
export function MWarn(props: { children: ReactNode; danger?: boolean }) {
  return (
    <div
      className={cn(
        "mt-4 flex gap-2 rounded-[6px] border px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-700",
        props.danger
          ? "border-sz-danger-text bg-[#FFFAFA]"
          : "border-sz-n-200 bg-sz-n-50"
      )}
    >
      <div>{props.children}</div>
    </div>
  )
}

const MFIELD_BASE =
  "w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

/** 시안 `.msel` — 34px */
export function MSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, style, ...rest } = props
  return (
    <select
      {...rest}
      style={{ ...FORM_SELECT_CHEVRON_STYLE, ...style }}
      className={cn(
        MFIELD_BASE,
        "h-[34px] cursor-pointer appearance-none py-1.5 pr-8",
        className
      )}
    />
  )
}

/** 시안 `.mta` — 76px */
export function MTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return (
    <textarea
      {...rest}
      className={cn(
        MFIELD_BASE,
        "min-h-[76px] resize-y pb-1.5 pt-2 leading-[1.6]",
        className
      )}
    />
  )
}
