import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface DetailCardProps {
  title: string
  /** 카드 헤더 우측 보조 텍스트 (예: 문의번호, "소비자 입력") */
  note?: ReactNode
  children: ReactNode
  className?: string
  /** 본문 패딩 제거 (처리 이력처럼 자체 패딩을 갖는 콘텐츠용) */
  flushBody?: boolean
}

/** 카드 헤더 + 본문 슬롯. 상세형 화면 전부에서 재사용한다. */
export default function DetailCard(props: DetailCardProps) {
  const { title, note, children, className, flushBody = false } = props

  return (
    <section
      className={cn("rounded-[8px] border border-sz-n-200 bg-white", className)}
    >
      <div className="flex items-center justify-between rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px]">
        <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
        {note && <span className="text-[11px] text-sz-n-500">{note}</span>}
      </div>
      <div className={flushBody ? "px-4 pb-3 pt-2" : "p-4"}>{children}</div>
    </section>
  )
}

interface FieldRowProps {
  label: string
  children: ReactNode
}

/** 상세 필드 행 — 9px 패딩 · 라벨 140px · gap 12px */
export function FieldRow(props: FieldRowProps) {
  const { label, children } = props

  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0">
      <span className="w-[140px] shrink-0 text-sz-n-500">{label}</span>
      <span className="flex-1 text-sz-n-900">{children}</span>
    </div>
  )
}

interface MetaRowProps {
  label: string
  value: ReactNode
}

/** 라벨 좌 · 값 우 정렬의 메타 정보 한 줄 — 우측 처리 패널에서 쓴다 */
export function MetaRow(props: MetaRowProps) {
  const { label, value } = props

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium text-sz-n-900">{value}</span>
    </div>
  )
}
