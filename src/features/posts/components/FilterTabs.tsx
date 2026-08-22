import { POST_STATUS_TABS } from "@/features/posts/constants/params"
import type {
  PostStatus,
  StatusCount,
} from "@/features/posts/services/postService"
import { cn } from "@/lib/utils"

/**
 * 상태 탭 — 드롭다운이 아니라 탭인 이유는 **개수가 함께 보여야** 조치가 필요한 게시물을
 * 바로 찾을 수 있기 때문이다 (§24-1).
 *
 * 건수는 서버가 준 값을 그대로 쓴다. 「노출 중지」가 심사 중까지 담는 것도 서버가 정한다.
 */
export default function FilterTabs(props: {
  active?: PostStatus
  counts: Array<StatusCount>
  onChange: (status?: PostStatus) => void
}) {
  const { active, counts, onChange } = props

  const countOf = (status?: PostStatus) =>
    counts.find(item => (item.status ?? undefined) === status)?.count ?? 0

  return (
    <div className="flex">
      {POST_STATUS_TABS.map(tab => {
        const isActive = active === tab.status

        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => onChange(tab.status)}
            className={cn(
              "mr-5 cursor-pointer border-b-2 px-0.5 py-[9px] text-[12px] transition-colors",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "ml-1 tabular-nums",
                isActive ? "text-sz-accent-500" : "text-sz-n-400"
              )}
            >
              {countOf(tab.status)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
