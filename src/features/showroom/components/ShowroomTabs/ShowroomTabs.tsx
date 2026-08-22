import {
  SELECT_CHEVRON_STYLE,
  STATS_PERIOD_OPTIONS,
} from "@/features/showroom/constants/params"
import type { StatsPeriod } from "@/features/showroom/types"
import { cn } from "@/lib/utils"

export type ShowroomTab = "profile" | "stats"

const TABS: Array<{ value: ShowroomTab; label: string }> = [
  { value: "profile", label: "쇼룸 프로필" },
  { value: "stats", label: "쇼룸 현황" },
]

interface ShowroomTabsProps {
  tab: ShowroomTab
  onTabChange: (tab: ShowroomTab) => void
  period: StatsPeriod
  onPeriodChange: (period: StatsPeriod) => void
}

/**
 * 탭 2종(밑줄 · 배타적 단일선택) + 우측 기간 셀렉트.
 *
 * 기간 셀렉트는 시안에서 페이지 헤더(H1 우측)에 있지만, 스튜디오 셸이 H1을 직접
 * 그려서 화면이 그 자리에 손댈 수 없다. 시안 CSS의 `.tabs .period{margin-left:auto}`가
 * 같은 배치를 이미 예비해 둔 자리라 여기에 붙인다.
 *
 * 기간은 **쇼룸 현황 탭에서만** 의미가 있어 프로필 탭에서는 렌더링하지 않는다 —
 * 프로필에 아무 영향이 없는 컨트롤이 떠 있으면 무엇에 걸리는 값인지 알 수 없다.
 */
export default function ShowroomTabs(props: ShowroomTabsProps) {
  const { tab, onTabChange, period, onPeriodChange } = props

  return (
    <div className="mb-4 flex shrink-0 items-center border-b border-sz-n-200">
      {TABS.map(item => {
        const isActive = tab === item.value

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
            className={cn(
              "mr-5 border-b-2 px-0.5 py-[9px] text-[12px]",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {item.label}
          </button>
        )
      })}

      {tab === "stats" && (
        <select
          aria-label="조회 기간"
          value={period}
          onChange={event => onPeriodChange(event.target.value as StatsPeriod)}
          style={SELECT_CHEVRON_STYLE}
          className="mb-1.5 ml-auto h-8 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-3 pr-[30px] text-[12px] text-sz-n-700 outline-none hover:border-sz-n-400 focus:border-sz-accent-500"
        >
          {STATS_PERIOD_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
