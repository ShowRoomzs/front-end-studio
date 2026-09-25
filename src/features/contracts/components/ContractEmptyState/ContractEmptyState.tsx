import Btn from "@/features/contracts/components/shared/Btn"
import { CREATOR_CONTRACT_TABS } from "@/features/contracts/constants/params"
import type { CreatorContractTab } from "@/features/contracts/types"

interface ContractEmptyStateProps {
  hasCondition: boolean
  tab: CreatorContractTab
  keyword: string
  onReset: () => void
  onGoConnections: () => void
}

/**
 * 시안 S2 — 받은 계약 없음. 계약을 만들 수 없으므로 주 CTA를 두지 않고 연결·소통으로 안내한다
 * (파트너 A2와 반대). 검색 결과 없음은 조건 탓임을 밝히고 초기화로 되돌린다.
 */
export default function ContractEmptyState(props: ContractEmptyStateProps) {
  const { hasCondition, tab, keyword, onReset, onGoConnections } = props

  if (hasCondition) {
    const tabLabel =
      CREATOR_CONTRACT_TABS.find(item => item.value === tab)?.label ?? "전체"
    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          검색 조건에 맞는 계약이 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          {keyword
            ? `${tabLabel} 탭에서 “${keyword}”을(를) 찾지 못했습니다. 다른 탭에는 있을 수 있습니다.`
            : `${tabLabel} 탭에 계약이 없습니다. 다른 탭에는 있을 수 있습니다.`}
        </div>
        <Btn variant="secondary" className="mt-4" onClick={onReset}>
          검색 조건 초기화
        </Btn>
      </div>
    )
  }

  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        받은 계약이 없습니다
      </div>
      <div className="text-[12px] leading-relaxed text-sz-n-500">
        계약은{" "}
        <b className="font-semibold text-sz-n-700">브랜드가 작성해 보내면</b>{" "}
        이곳에 도착합니다 — 인플루언서가 직접 만들 수는 없습니다.
        <br />
        브랜드와 연결되어 있어야 계약을 받을 수 있으니, 먼저 연결을 확인하세요.
      </div>
      <Btn variant="secondary" className="mt-4" onClick={onGoConnections}>
        연결·소통 열기
      </Btn>
      <div className="mx-auto mt-3.5 max-w-[460px] text-[11px] leading-[1.55] text-sz-n-500">
        브랜드에게 <b className="font-semibold text-sz-n-700">내 연결코드</b>를
        전달하면 연결 요청이 정확히 내 쇼룸으로 도착합니다 — 연결코드는{" "}
        <b className="font-semibold text-sz-n-700">쇼룸 관리</b>에서 확인할 수
        있습니다.
      </div>
    </div>
  )
}
