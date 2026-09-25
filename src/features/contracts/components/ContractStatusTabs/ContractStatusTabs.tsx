import { CREATOR_CONTRACT_TABS } from "@/features/contracts/constants/params"
import type {
  CreatorContractSummaryResponse,
  CreatorContractTab,
} from "@/features/contracts/types"
import { cn } from "@/lib/utils"

interface ContractStatusTabsProps {
  tab: CreatorContractTab
  onTabChange: (tab: CreatorContractTab) => void
  counts: CreatorContractSummaryResponse["tabCounts"] | undefined
}

/**
 * 상태 탭 5종 — 배타적 단일선택(시안 `.tabs`). 파트너센터와 같은 마크업이고 탭 구성만 다르다.
 * 건수는 검색어와 무관한 전체 기준(summary)이라 조건을 걸어도 흔들리지 않는다.
 */
export default function ContractStatusTabs(props: ContractStatusTabsProps) {
  const { tab, onTabChange, counts } = props

  return (
    <div className="mb-4 flex shrink-0 flex-wrap border-b border-sz-n-200">
      {CREATOR_CONTRACT_TABS.map(item => {
        const isActive = tab === item.value

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
            className={cn(
              "mr-[22px] flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-[9px] text-[12px]",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-lg px-1.5 text-[10px]",
                isActive
                  ? "bg-sz-accent-50 text-sz-accent-600"
                  : "bg-sz-n-100 text-sz-n-600"
              )}
            >
              {counts?.[item.value] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
