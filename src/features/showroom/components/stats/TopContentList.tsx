import type { TopContentItem } from "@/features/showroom/types"
import {
  formatCount,
  formatPublishedAt,
} from "@/features/showroom/utils/formatStats"
import { cn } from "@/lib/utils"

/**
 * 인기 콘텐츠 TOP 5 — 시안 `.rank`.
 *
 * 제목 자리에 **본문 앞부분**이 온다. 일반 게시물에는 제목이 없어서(§24-3) 서버가
 * 본문을 40자로 잘라 `excerpt`로 준다. 사진만 있는 게시물은 그마저 없으므로
 * `사진 게시물`로 대신한다 — 빈 줄로 두면 순위표에 정체불명의 행이 남는다.
 */
export default function TopContentList(props: {
  items: Array<TopContentItem>
}) {
  return (
    <div className="flex flex-col">
      {props.items.map(item => (
        <div
          key={item.postId}
          className="flex items-center gap-[11px] border-b border-sz-n-100 py-2.5 last:border-b-0"
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-semibold",
              item.rank === 1
                ? "bg-sz-accent-500 text-white"
                : "bg-sz-n-100 text-sz-n-600"
            )}
          >
            {item.rank}
          </span>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] text-sz-n-900">
              {item.excerpt ?? "사진 게시물"}
            </div>
            <div className="mt-px text-[11px] text-sz-n-400">
              {formatPublishedAt(item.publishedAt)} 게시 · 노출{" "}
              {formatCount(item.viewCount)}
            </div>
          </div>

          <span className="shrink-0 text-[12px] tabular-nums text-sz-n-700">
            ♥ {formatCount(item.likeCount)}
          </span>
        </div>
      ))}
    </div>
  )
}
