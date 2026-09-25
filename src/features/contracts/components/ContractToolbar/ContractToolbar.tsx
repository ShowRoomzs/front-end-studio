import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"

interface ContractToolbarProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
}

/** 시안 `.toolbar` — 검색만 있다. 인플루언서는 계약을 만들 수 없어 주 CTA가 없다(§27-1 #2) */
export default function ContractToolbar(props: ContractToolbarProps) {
  const { keyword, onKeywordChange, onSearch } = props

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        className={cn(INPUT_CLASS, "w-[280px]")}
        placeholder="공구명 · 브랜드명 검색"
        value={keyword}
        onChange={event => onKeywordChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter") {
            onSearch()
          }
        }}
      />
      <Btn variant="secondary" onClick={onSearch}>
        검색
      </Btn>
    </div>
  )
}
