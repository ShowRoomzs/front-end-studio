import StatusBadge from "@/features/posts/components/StatusBadge"
import { useGetPost } from "@/features/posts/hooks/useGetPost"
import type { PostListItem } from "@/features/posts/services/postService"
import { formatCardDate, formatCount } from "@/features/posts/utils/format"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * 목록 카드 — 제목이 없으므로 대표 사진과 본문 앞부분이 게시물을 알아보는 단서다.
 *
 * 썸네일은 **비율과 무관하게 균일 4:5 센터 크롭**이다(§24-2). 소비자 피드는 게시물마다
 * 높이가 다르지만 관리 목록에서 카드 높이가 제각각이면 훑어보기 어렵다.
 */
export default function PostCard(props: { post: PostListItem }) {
  const { post } = props
  const navigate = useNavigate()

  const [isHovered, setIsHovered] = useState(false)
  const [index, setIndex] = useState(0)

  /**
   * 넘겨 볼 사진은 마우스를 올린 뒤에 받아 온다 — 목록 응답에는 대표 한 장뿐이다.
   * 격자 전체가 상세를 미리 받으면 24장짜리 화면에서 24번의 요청이 된다.
   */
  const { data: detail } = useGetPost(post.postId, { enabled: isHovered })

  const images = detail?.images ?? []
  const currentUrl = images[index]?.imageUrl ?? post.thumbnailUrl
  const canFlip = post.imageCount > 1 && images.length > 1

  const isDraft = post.status === "DRAFT"
  const isSuspended =
    post.status === "SUSPENDED" || post.status === "UNDER_REVIEW"

  const flip = (event: React.MouseEvent, delta: number) => {
    // 화살표는 카드 안에 있다 — 막지 않으면 넘기려다 수정 화면으로 들어간다
    event.stopPropagation()
    setIndex(previous =>
      Math.min(images.length - 1, Math.max(0, previous + delta))
    )
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/posts/${post.postId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIndex(0)
      }}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-[8px] border bg-white text-left transition-shadow hover:shadow-sm",
        isDraft ? "border-dashed border-sz-n-300 bg-sz-n-50" : "border-sz-n-200"
      )}
    >
      <div className="relative aspect-4/5 border-b border-sz-n-200 bg-sz-n-100">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt=""
            className={cn(
              "size-full object-cover",
              // 작성중은 회색조, 노출 중지는 딤 — 공개된 게시물과 한눈에 구분된다
              isDraft && "opacity-60 grayscale",
              isSuspended && "brightness-[0.55]"
            )}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1.5 text-[11px] text-sz-n-400">
            <ImageOff className="size-5" aria-hidden />
            사진 없음
          </div>
        )}

        {post.imageCount > 1 && (
          <span className="absolute top-2 right-2 z-2 rounded-[10px] bg-sz-n-900/70 px-[7px] py-0.5 text-[10px] font-medium text-white tabular-nums">
            {index + 1} / {post.imageCount}
          </span>
        )}

        {/* 화살표는 마우스를 올렸을 때만 — 격자에 상시 떠 있으면 시선이 분산된다(§24-2) */}
        {canFlip && index > 0 && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="이전 사진"
            onClick={event => flip(event, -1)}
            className="absolute top-1/2 left-2 z-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 opacity-0 shadow-[0_1px_4px_rgba(26,27,31,0.22)] transition-opacity group-hover:opacity-100"
          >
            <ChevronLeft className="size-3 text-sz-n-700" aria-hidden />
          </span>
        )}
        {canFlip && index < images.length - 1 && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="다음 사진"
            onClick={event => flip(event, 1)}
            className="absolute top-1/2 right-2 z-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 opacity-0 shadow-[0_1px_4px_rgba(26,27,31,0.22)] transition-opacity group-hover:opacity-100"
          >
            <ChevronRight className="size-3 text-sz-n-700" aria-hidden />
          </span>
        )}
      </div>

      <div className="px-3 pt-[11px] pb-3">
        <p
          className={cn(
            "line-clamp-2 h-[37px] overflow-hidden text-[12px] leading-[1.55] text-pretty",
            isDraft ? "text-sz-n-400" : "text-sz-n-700"
          )}
        >
          {post.contentPreview || "(본문 미작성)"}
        </p>

        <div className="mt-[9px] flex items-center justify-between gap-1.5">
          <span className="text-[11px] text-sz-n-400 tabular-nums">
            {isDraft
              ? `임시저장 ${formatCardDate(post.createdAt)}`
              : isSuspended
                ? `${formatCardDate(post.publishedAt ?? post.createdAt)} 게시`
                : `${formatCardDate(post.publishedAt ?? post.createdAt)} · ♥ ${formatCount(post.likeCount)}`}
          </span>
          <StatusBadge status={post.status} />
        </div>
      </div>
    </button>
  )
}
