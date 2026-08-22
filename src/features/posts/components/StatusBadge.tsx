import { POST_STATUS_BADGE } from "@/features/posts/constants/params"
import type { PostStatus } from "@/features/posts/services/postService"
import { cn } from "@/lib/utils"

/**
 * 상태 배지 — 서버 상태 5종을 화면 3종으로 접는다 (§24-1).
 *
 * 심사 중(`UNDER_REVIEW`)도 「노출 중지」로 그린다. 이의를 넣었다고 노출이 돌아온 게
 * 아니므로 배지가 바뀌면 사실과 어긋난다(§24-5).
 */
export default function StatusBadge(props: {
  status: PostStatus
  className?: string
}) {
  const { status, className } = props
  const badge = POST_STATUS_BADGE[status]

  if (!badge) {
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-[10px] px-[9px] py-0.5 text-[11px] font-medium whitespace-nowrap",
        badge.className,
        className
      )}
    >
      <span className="size-[5px] rounded-full bg-current opacity-75" />
      {badge.label}
    </span>
  )
}
