import StatusBadge, {
  type StatusBadgeVariant,
} from "@/common/components/StatusBadge/StatusBadge"
import type { ReactNode } from "react"

/** 시안 `.sysbar` — 가운데 회색 띠(개설 · 종결 안내) */
export function SysBar(props: { children: ReactNode }) {
  return (
    <div className="self-stretch rounded-[6px] bg-sz-n-100 px-3 py-2 text-center text-[11px] leading-[1.6] text-sz-n-500 [&_b]:text-sz-n-700">
      {props.children}
    </div>
  )
}

/** 시안 `.res` — 절차 카드(머리 배지 + 행 + 버튼 줄) */
export function ResCard(props: {
  badge: string
  /** 머리 배지 색 — 기본 중립. 계정 이용 정지 카드는 위험(시안 13 S8 `b-danger`) */
  badgeVariant?: StatusBadgeVariant
  head: ReactNode
  children?: ReactNode
  footer?: ReactNode
  /** 시안 13 S8 `.res-f` — 왼쪽 안내 · 오른쪽 링크로 벌린다 */
  footerSpread?: boolean
}) {
  const { badgeVariant = "neutral", footerSpread = false } = props
  return (
    <div className="self-stretch rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="mb-[9px] flex items-center gap-2 text-[12px] font-semibold text-sz-n-900">
        <StatusBadge variant={badgeVariant}>{props.badge}</StatusBadge>
        <span className="min-w-0">{props.head}</span>
      </div>
      {props.children}
      {props.footer && (
        <div
          className={
            footerSpread
              ? "mt-2.5 flex items-center justify-between gap-2 border-t border-sz-n-100 pt-2.5"
              : "mt-2.5 flex items-center justify-end gap-2 border-t border-sz-n-100 pt-2.5"
          }
        >
          {props.footer}
        </div>
      )}
    </div>
  )
}

export function ResRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2.5 py-[5px] text-[12px]">
      <span className="w-[84px] shrink-0 text-sz-n-600">{props.label}</span>
      <span className="flex-1 leading-[1.6] text-sz-n-900">
        {props.children}
      </span>
    </div>
  )
}

export function Sub(props: { children: ReactNode }) {
  return (
    <span className="mt-[3px] block text-[11px] text-sz-n-500">
      {props.children}
    </span>
  )
}
