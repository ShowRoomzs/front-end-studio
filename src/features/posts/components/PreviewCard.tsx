import { formatRelativeTime } from "@/features/posts/utils/format"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { useState } from "react"

/**
 * 소비자 쇼룸 카드 재현 — 지금 소비자에게 어떻게 보이는지 (§24-2).
 *
 * 미디어 영역에 **고정 높이를 주지 않는다.** 쇼룸 피드는 게시물마다 비율이 달라 높이가
 * 제각각이고, 그것이 이 미리보기가 보여줘야 하는 사실이다. 목록 격자의 균일 4:5와 헷갈리지 말 것.
 */
export default function PreviewCard(props: {
  showroomName?: string
  imageUrls: Array<string>
  content: string
  /** 가로/세로. 사진이 없으면 자리만 잡는다 */
  aspectRatio: number | null
  publishedAt: string | null
  /** 노출 중지·심사 중이면 시각 자리에 상태를 적는다 */
  timeLabel?: string
}) {
  const {
    showroomName,
    imageUrls,
    content,
    aspectRatio,
    publishedAt,
    timeLabel,
  } = props

  const [index, setIndex] = useState(0)
  const current = Math.min(index, Math.max(0, imageUrls.length - 1))

  return (
    <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center gap-[9px] px-[13px] py-[11px]">
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-sz-n-200 text-[9px] text-sz-n-500">
          IMG
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-sz-n-900">
            {showroomName ?? "내 쇼룸"}
          </div>
          <div className="text-[11px] text-sz-n-400">
            {timeLabel ?? formatRelativeTime(publishedAt)}
          </div>
        </div>
      </div>

      <div
        className="relative flex items-center justify-center border-t border-sz-n-200 bg-sz-n-100 text-[11px] text-sz-n-400"
        style={{ aspectRatio: `${aspectRatio ?? 4 / 5}` }}
      >
        {imageUrls.length > 0 ? (
          <img
            src={imageUrls[current]}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          "사진을 추가하면 여기에 보입니다"
        )}

        {imageUrls.length > 1 && (
          <>
            <span className="absolute top-2.5 right-2.5 z-2 rounded-[10px] bg-sz-n-900/70 px-2 py-0.5 text-[10px] font-medium text-white tabular-nums">
              {current + 1} / {imageUrls.length}
            </span>
            {current > 0 && (
              <button
                type="button"
                aria-label="이전 사진"
                onClick={() => setIndex(current - 1)}
                className="absolute top-1/2 left-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-[0_1px_4px_rgba(26,27,31,0.22)]"
              >
                <ChevronLeft className="size-3 text-sz-n-700" aria-hidden />
              </button>
            )}
            {current < imageUrls.length - 1 && (
              <button
                type="button"
                aria-label="다음 사진"
                onClick={() => setIndex(current + 1)}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-[0_1px_4px_rgba(26,27,31,0.22)]"
              >
                <ChevronRight className="size-3 text-sz-n-700" aria-hidden />
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-[13px] pt-2.5 pb-1 text-[12px] text-sz-n-600">
        <Heart className="size-3.5" aria-hidden />
        좋아요
      </div>

      <div className="px-[13px] pb-[13px] text-[12px] leading-[1.65] text-pretty text-sz-n-700">
        {content ? (
          <>
            <span className="mr-[5px] font-semibold text-sz-n-900">
              {showroomName ?? "내 쇼룸"}
            </span>
            {content}
          </>
        ) : (
          <span className="text-sz-n-400">
            본문이 캡션으로 여기에 표시됩니다
          </span>
        )}
      </div>
    </div>
  )
}
