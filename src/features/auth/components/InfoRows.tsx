import { cn } from "@/lib/utils"

export type InfoRow = {
  label: string
  value: string
  /** 값이 아직 없을 때 회색 placeholder로 표시 */
  placeholder?: boolean
}

/**
 * 시안 `.verify`(본인인증 결과) 와 `.info-box`(완료 화면) 는 같은 구조다 —
 * 테두리 박스 안에 라벨/값 행이 쌓인다. 행 패딩만 다르다.
 */
export function InfoRows({
  rows,
  density = "comfortable",
  className,
}: {
  rows: InfoRow[]
  /** comfortable = `.verify`(11px), compact = `.info-box`(10px) */
  density?: "comfortable" | "compact"
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[6px] border border-sz-n-200 text-left",
        className
      )}
    >
      {rows.map(row => (
        <div
          key={row.label}
          className={cn(
            "flex justify-between border-b border-sz-n-100 text-[12px] last:border-b-0",
            density === "comfortable" ? "px-3.5 py-[11px]" : "px-4 py-2.5"
          )}
        >
          <span className="text-sz-n-500">{row.label}</span>
          <span
            className={
              row.placeholder ? "text-sz-n-400" : "font-medium text-sz-n-900"
            }
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}
