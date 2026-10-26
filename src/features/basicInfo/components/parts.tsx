import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/*
  시안 ui-studio-06-account의 반복 마크업 — `.card` · `.sec` · `.kv` · `.reqbox` · `.filebox` · `.note-i` · `.tag-tbd`.
  이 화면 안에서만 쓴다.
*/

/** 시안 `.card` + `.card-h`(흰 헤더 · 13px/600) */
export function InfoCard(props: {
  title: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-sz-n-200 px-[18px] py-[13px]">
        <h2 className="text-[13px] font-semibold text-sz-n-900">
          {props.title}
        </h2>
        {props.badge}
      </div>
      <div className="p-[18px]">{props.children}</div>
    </section>
  )
}

/** 시안 `.kv` — 라벨 104px · 값 */
export function KvList(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col", props.className)}>{props.children}</div>
  )
}

export function KvRow(props: {
  label: string
  children: ReactNode
  sub?: ReactNode
  subTone?: "default" | "warning"
  tabular?: boolean
}) {
  const { label, children, sub, subTone = "default", tabular } = props

  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0">
      <span className="w-[104px] shrink-0 text-sz-n-500">{label}</span>
      <span
        className={cn(
          "min-w-0 flex-1 text-sz-n-900 [&_b]:font-semibold",
          tabular && "tabular-nums tracking-[0.2px]"
        )}
      >
        {children}
        {sub && (
          <span
            className={cn(
              "mt-0.5 block text-[11px] leading-[1.6]",
              subTone === "warning" ? "text-sz-warning-text" : "text-sz-n-500"
            )}
          >
            {sub}
          </span>
        )}
      </span>
    </div>
  )
}

/** 시안 `.note-i` — 카드 안 회색 안내 상자 */
export function NoteBox(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600 [&_b]:font-semibold [&_b]:text-sz-n-900",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

/** 시안 `.reqbox` — 요청 상태 상자. `warn`은 경고 테두리(반려) · `accent`는 승인 배너(T5) · `success`(T10) */
export function RequestBox(props: {
  badge: ReactNode
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  tone?: "default" | "warn" | "accent" | "success"
  className?: string
}) {
  const { badge, title, children, action, tone = "default", className } = props

  return (
    <div
      className={cn(
        "rounded-[6px] border px-3.5 py-3",
        tone === "warn" && "border-sz-warning-text bg-white",
        tone === "accent" && "border-sz-accent-100 bg-sz-accent-50",
        tone === "success" && "border-sz-success-text bg-sz-success-bg",
        tone === "default" && "border-sz-n-200 bg-sz-n-50",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-[7px] text-[12px] font-semibold text-sz-n-900">
        {badge}
        {title}
      </div>
      {children && (
        <div className="mt-[5px] text-[11px] leading-[1.7] text-sz-n-600 [&_b]:font-semibold [&_b]:text-sz-n-900">
          {children}
        </div>
      )}
      {action && <div className="mt-[11px] flex justify-end">{action}</div>}
    </div>
  )
}

/** 시안 `.filebox` — 파일 아이콘 · 이름 · 보조 줄 · 우측 버튼 */
export function FileBox(props: {
  badge: string
  name: ReactNode
  meta?: ReactNode
  action?: ReactNode
  empty?: boolean
  hasError?: boolean
}) {
  const { badge, name, meta, action, empty, hasError } = props

  return (
    <div
      className={cn(
        "flex items-center gap-[9px] rounded-[6px] border border-dashed bg-sz-n-50 px-3 py-2.5",
        hasError ? "border-sz-danger-text" : "border-sz-n-300"
      )}
    >
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[4px] bg-sz-n-200 text-[8px] font-bold text-sz-n-600">
        {badge}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[11px]",
          empty ? "text-sz-n-500" : "text-sz-n-700"
        )}
      >
        {name}
        {meta && <span className="block truncate text-sz-n-500">{meta}</span>}
      </span>
      {action}
    </div>
  )
}

/** 시안 `.tag-tbd` — 「[정책값 미정]」 */
export function PolicyTbdTag() {
  return (
    <span className="whitespace-nowrap rounded-[4px] bg-sz-n-100 px-1.5 py-px text-[10px] font-medium text-sz-n-500">
      [정책값 미정]
    </span>
  )
}

/** 시안 `.field` + `.flabel` */
export function Field(props: {
  label: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
}) {
  const { label, required, htmlFor, children, hint, error, className } = props

  return (
    <div className={cn("mb-3.5 last:mb-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-[5px] block text-[12px] font-medium text-sz-n-600"
      >
        {label}
        {required && <span className="ml-1 text-sz-danger-text">*</span>}
      </label>
      {children}
      {error ? (
        <p
          role="alert"
          className="mt-[5px] text-[11px] font-medium text-sz-danger-text"
        >
          {error}
        </p>
      ) : (
        hint && (
          <div className="mt-[5px] text-[11px] leading-[1.7] text-sz-n-500 [&_b]:font-semibold">
            {hint}
          </div>
        )
      )}
    </div>
  )
}

/** 시안 `.hint` — 필드 밖에 따로 붙는 보조 줄 */
export function Hint(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-[5px] text-[11px] leading-[1.7] text-sz-n-500 [&_b]:font-semibold",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

/** 시안 `.inp.ro` + `.lk` — 읽기 전용 값과 자물쇠 표기 */
export function ReadonlyInput(props: { value: ReactNode; lock: string }) {
  return (
    <div className="flex h-9 w-full items-center rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 text-[13px] text-sz-n-600">
      <span className="min-w-0 truncate">{props.value}</span>
      <span className="ml-auto whitespace-nowrap pl-2 text-[11px] text-sz-n-400">
        {props.lock}
      </span>
    </div>
  )
}

/** 시안 `.chklist` — 모달 고지 목록 */
export function CheckList(props: { children: ReactNode }) {
  return (
    <ul className="m-0 list-disc pl-[18px] text-[12px] leading-[1.8] text-sz-n-600 [&_b]:font-semibold [&_b]:text-sz-n-900">
      {props.children}
    </ul>
  )
}

/** 조회 중 · 실패 — 쇼룸 관리와 같은 문구 */
export function LoadingBlock(props: { isLoading: boolean }) {
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
      {props.isLoading ? "불러오는 중…" : "정보를 불러오지 못했습니다."}
    </div>
  )
}

/** 시안 `.cols` — 왼쪽 가변 · 오른쪽 400px */
export function TwoColumns(props: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-4">{props.left}</div>
      <div className="flex w-[400px] shrink-0 flex-col gap-4">
        {props.right}
      </div>
    </div>
  )
}
