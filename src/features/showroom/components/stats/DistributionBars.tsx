import { formatRatio } from "@/features/showroom/utils/formatStats"
import type { ReactNode } from "react"

export interface BarRow {
  label: string
  ratio: number
  /** 비율 오른쪽에 덧붙는 값 — 유입 경로의 방문 횟수 */
  suffix?: ReactNode
}

/** 시안 `.dist` / `.src-r` — 라벨 + 비율 + 막대 한 줄씩 */
export default function DistributionBars(props: { rows: Array<BarRow> }) {
  return (
    <div className="flex flex-col gap-[11px]">
      {props.rows.map(row => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between gap-2 text-[12px] text-sz-n-700">
            <span>{row.label}</span>
            <span className="text-[12px] tabular-nums text-sz-n-500">
              <b className="font-semibold text-sz-n-900">
                {formatRatio(row.ratio)}
              </b>
              {row.suffix}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-[3px] bg-sz-n-200">
            <div
              className="h-full rounded-[3px] bg-sz-accent-500"
              style={{ width: `${Math.min(row.ratio, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 시안 `.dist-grp` + `.dist-g` — 한 카드 안에 분포가 둘 이상일 때(연령대 · 성별) */
export function DistributionGroup(props: {
  label: string
  children: ReactNode
  /** 두 번째 그룹부터는 위에 구분선이 붙는다 */
  divided?: boolean
}) {
  const { label, children, divided } = props

  return (
    <div className={divided ? "mt-5 border-t border-sz-n-200 pt-[18px]" : ""}>
      <div className="mb-2.5 text-[11px] font-semibold text-sz-n-600">
        {label}
      </div>
      {children}
    </div>
  )
}

/**
 * 카드 안 빈 상태 — 카드를 통째로 감추지 않는다(§22-5).
 *
 * 서버가 표본 부족으로 비율을 비우는 경우(`ratioSuppressed`)도 배열이 비어 오므로
 * 같은 문구를 쓴다. 화면은 "왜 비었는지"를 구분하지 않는다 — 인플루언서가 할 수 있는
 * 일이 팔로워를 더 모으는 것 하나로 같기 때문이다.
 */
export function StatsEmpty(props: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center px-5 py-8 text-center text-[12px] text-sz-n-500">
      {props.children}
    </div>
  )
}
