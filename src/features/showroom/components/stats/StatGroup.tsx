import { cn } from "@/lib/utils"

export interface StatItem {
  value: string
  label: string
  /** 시안 `.stat.key` — 카드마다 **하나만** 강조한다. 둘이면 강조가 아니다 */
  emphasized?: boolean
}

/**
 * 시안 `.stats` — 숫자 카드 나열.
 *
 * 값이 없을 때 카드를 지우지 않는다. `0`이나 `—`로 자리를 지켜야 신규 인플루언서가
 * "그 기능이 없다"고 오해하지 않는다(§22-5 빈 상태 처리).
 */
export default function StatGroup(props: {
  items: Array<StatItem>
  /** 우측 컬럼의 좁은 카드는 세로로 쌓는다(시안 팔로워 행동 카드) */
  direction?: "row" | "column"
}) {
  const { items, direction = "row" } = props

  return (
    <div className={cn("flex gap-2.5", direction === "column" && "flex-col")}>
      {items.map(item => (
        <div
          key={item.label}
          className={cn(
            "flex-1 rounded-[6px] border p-[13px]",
            item.emphasized
              ? "border-sz-accent-100 bg-sz-accent-50"
              : "border-sz-n-200 bg-sz-n-50"
          )}
        >
          <div
            className={cn(
              "text-[19px] font-semibold tabular-nums",
              item.emphasized ? "text-sz-accent-600" : "text-sz-n-900"
            )}
          >
            {item.value}
          </div>
          <div
            className={cn(
              "mt-0.5 text-[11px]",
              item.emphasized ? "text-sz-accent-600/80" : "text-sz-n-500"
            )}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
