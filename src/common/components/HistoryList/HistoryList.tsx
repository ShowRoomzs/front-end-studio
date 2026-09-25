import { formatDateTimeShort } from "@/common/utils/formatDate"
import { cn } from "@/lib/utils"

/** `danger`는 소비자 노출이 실제로 막힌 집행 이벤트에만 쓴다(문의 삭제 처리 등) */
export type HistoryDotTone = "accent" | "success" | "muted" | "warn" | "danger"

export interface HistoryItem {
  /** 처리 내용 (예: "문의 등록", "답변 등록") */
  label: string
  /** 처리 일시 (ISO 문자열) */
  processedAt: string | null
  tone: HistoryDotTone
  /** 행위 주체 — 있으면 일시 옆에 "일시 · 주체"로 붙는다 */
  processorName?: string | null
  /** 사유 인용 박스 — 삭제 요청·반려 이력에만 붙는다 */
  detail?: { title: string; text: string } | null
}

interface HistoryListProps {
  items: Array<HistoryItem>
}

const DOT_CLASS: Record<HistoryDotTone, string> = {
  accent: "bg-sz-accent-500",
  success: "bg-sz-success-text",
  muted: "bg-sz-n-300",
  warn: "bg-sz-warning-text",
  danger: "bg-sz-danger-text",
}

/** 처리 이력 — 점 + 텍스트 + 시각. 최신순으로 정렬해 전달받는다. */
export default function HistoryList(props: HistoryListProps) {
  const { items } = props

  if (items.length === 0) {
    return (
      <p className="py-2 text-[12px] text-sz-n-500">처리 이력이 없습니다.</p>
    )
  }

  return (
    <div>
      {items.map((item, index) => (
        <div
          key={`${item.label}-${item.processedAt}-${index}`}
          className="flex gap-2.5 py-[9px]"
        >
          <span
            className={cn(
              "mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full",
              DOT_CLASS[item.tone]
            )}
          />
          <div className="min-w-0">
            <div className="text-[12px] text-sz-n-900">{item.label}</div>
            <div className="text-[11px] text-sz-n-500">
              {[formatDateTimeShort(item.processedAt), item.processorName]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {item.detail && (
              <div className="mt-1.5 rounded-[6px] bg-sz-n-50 px-2.5 py-2 text-[11px] leading-relaxed text-sz-n-600">
                <b className="font-semibold text-sz-n-700">
                  {item.detail.title}
                </b>{" "}
                — {item.detail.text}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
