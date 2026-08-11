import type { AttachmentSummary } from "@/features/connections/services/threadService"
import { computeImageGridLayout } from "@/features/connections/utils/imageGrid"
import { cn } from "@/lib/utils"

interface ImageGridProps {
  images: Array<AttachmentSummary>
  onClickImage: (index: number) => void
  /** 첨부만 전송한 메시지는 마지막 칸에 전송 시각을 붙인다(§13-11) */
  timestamp?: string
  isMine: boolean
}

/** 시안 `.mgrid.*` — 칸 수마다 그리드 크기가 통째로 다르다 */
const GRID_CLASSES = {
  n2: "grid-cols-2 w-[220px] h-[120px]",
  n3: "grid-cols-3 w-[270px] h-[90px]",
  n4: "grid-cols-2 grid-rows-2 w-[180px] h-[180px]",
  n5: "grid-cols-3 grid-rows-2 w-[270px] h-[180px]",
  n6plus: "grid-cols-3 grid-rows-2 w-[270px] h-[180px]",
} as const

export default function ImageGrid(props: ImageGridProps) {
  const { images, onClickImage, timestamp, isMine } = props

  if (images.length === 1) {
    return (
      <div className={cn("mt-1.5 w-fit", isMine && "ml-auto")}>
        <button
          type="button"
          onClick={() => onClickImage(0)}
          className="block h-[110px] w-[150px] overflow-hidden rounded-[6px] bg-sz-n-200"
        >
          <img
            src={images[0].fileUrl ?? ""}
            alt={images[0].originalName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </button>
        {timestamp && (
          <div className="mt-1 text-[11px] text-sz-n-400">{timestamp}</div>
        )}
      </div>
    )
  }

  const { variant, visibleCount, overlayCount } = computeImageGridLayout(
    images.length
  )

  return (
    <div className={cn("mt-1.5 w-fit", isMine && "ml-auto")}>
      <div
        className={cn(
          "grid gap-[3px] overflow-hidden rounded-[6px]",
          GRID_CLASSES[variant]
        )}
      >
        {images.slice(0, visibleCount).map((image, index) => (
          <button
            key={image.attachmentId}
            type="button"
            onClick={() => onClickImage(index)}
            className="relative bg-sz-n-200"
          >
            <img
              src={image.fileUrl ?? ""}
              alt={image.originalName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {overlayCount > 0 && index === visibleCount - 1 && (
              <span className="absolute inset-0 flex items-center justify-center bg-sz-n-900/55 text-[13px] font-semibold text-white">
                +{overlayCount}
              </span>
            )}
          </button>
        ))}
      </div>
      {timestamp && (
        <div className="mt-1 text-[11px] text-sz-n-400">{timestamp}</div>
      )}
    </div>
  )
}
