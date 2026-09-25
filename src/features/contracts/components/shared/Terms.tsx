import {
  TERMS_CLASS,
  TK_CLASS,
  TROW_CLASS,
  TV_CLASS,
} from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/** 시안 `.terms` — 읽기 전용 표(정산 조건 요약 · 표준 조항 · 계약 상품 항목 · 모달 요약) */
export function Terms(props: { children: ReactNode; className?: string }) {
  const { children, className } = props
  return <div className={cn(TERMS_CLASS, className)}>{children}</div>
}

interface TermRowProps {
  label: ReactNode
  children: ReactNode
  /** 라벨 폭 — 기본 118px, 상품 항목은 176px, 모달 요약은 96px */
  labelWidth?: number
  className?: string
}

export function TermRow(props: TermRowProps) {
  const { label, children, labelWidth, className } = props
  return (
    <div className={cn(TROW_CLASS, className)}>
      <div
        className={cn(TK_CLASS, labelWidth !== undefined && "w-auto")}
        style={labelWidth !== undefined ? { width: labelWidth } : undefined}
      >
        {label}
      </div>
      <div className={TV_CLASS}>{children}</div>
    </div>
  )
}
