import { useSearchParams } from "react-router-dom"

import AccountTab from "@/features/basicInfo/components/account/AccountTab"
import SettlementInfoTab from "@/features/basicInfo/components/settlement/SettlementInfoTab"
import {
  BASIC_INFO_TABS,
  DEFAULT_BASIC_INFO_TAB,
} from "@/features/basicInfo/constants/params"
import type { BasicInfoTab } from "@/features/basicInfo/types"
import { cn } from "@/lib/utils"

/**
 * GNB #9 기본정보 관리(§50 · 시안 ui-studio-06-account rev.2) — 계정 / 정산 정보 2탭.
 *
 * 탭은 `?tab=settlement|account`(기본 정산 정보) — 정산 상세 [계좌 확인] · 홈 「정산 정보 확인」이 링크로 들어온다.
 * 탭을 바꿀 때 다른 쿼리(DEV `?mock=`)는 그대로 둔다. H1은 셸이 GNB 라벨로 그린다.
 */
export default function BasicInfoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: BasicInfoTab =
    searchParams.get("tab") === "account" ? "account" : DEFAULT_BASIC_INFO_TAB

  const changeTab = (next: BasicInfoTab) =>
    setSearchParams(
      prev => {
        const params = new URLSearchParams(prev)
        params.set("tab", next)
        return params
      },
      { replace: true }
    )

  return (
    <>
      <div className="mb-4 flex shrink-0 items-center border-b border-sz-n-200">
        {BASIC_INFO_TABS.map(item => (
          <button
            key={item.value}
            type="button"
            onClick={() => changeTab(item.value)}
            className={cn(
              "mr-5 border-b-2 px-0.5 py-[9px] text-[12px]",
              tab === item.value
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "account" ? <AccountTab /> : <SettlementInfoTab />}
    </>
  )
}
