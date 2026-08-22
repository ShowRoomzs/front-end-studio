import { Button } from "@/components/ui/button"
import {
  describeRatio,
  type CropState,
} from "@/features/posts/utils/aspectRatio"
import type { PhotoDraft } from "@/features/posts/utils/photoDraft"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const STAGE_HEIGHT = 300
const CROP_BOX_HEIGHT = 264
const STAGE_WIDTH = 512
const ZOOM_MAX = 3

/**
 * 비율 · 크롭 조정 (§24-2 · 시안 S9).
 *
 * 폭이 확인 모달(440px)이 아니라 **560px**인 이유는 조작이 들어가는 편집 모달이기 때문이다.
 * 컨트롤은 **드래그 + 확대뿐**이고 비율 수치는 표시만 한다 — 비율 선택도, 정사각 강제 옵션도
 * 두지 않는다. 사용자가 비율을 고르면 게시물 단위 통일 규칙과 충돌한다.
 */
export default function CropModal(props: {
  photos: Array<PhotoDraft>
  initialPhotoId: string
  targetRatio: number
  onApply: (crops: Array<{ id: string; crop: CropState }>) => void
  onClose: () => void
}) {
  const { photos, initialPhotoId, targetRatio, onApply, onClose } = props

  const [currentId, setCurrentId] = useState(initialPhotoId)
  /** 확정 전 편집분 — [적용]을 눌러야 화면 상태로 넘어간다 */
  const [drafts, setDrafts] = useState<Record<string, CropState>>({})

  const current = photos.find(photo => photo.id === currentId) ?? photos[0]
  const crop = current ? (drafts[current.id] ?? current.crop) : null

  const dragOrigin = useRef<{ x: number; y: number; crop: CropState } | null>(
    null
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const patchCrop = useCallback(
    (id: string, patch: Partial<CropState>, base: CropState) => {
      setDrafts(previous => ({ ...previous, [id]: { ...base, ...patch } }))
    },
    []
  )

  if (!current || !crop) {
    return null
  }

  const boxWidth = Math.min(CROP_BOX_HEIGHT * targetRatio, STAGE_WIDTH - 32)
  const boxHeight = boxWidth / targetRatio

  /** zoom=1이 크롭 상자를 꽉 채우는 배율 — 원본이 상자보다 작아지는 구간을 만들지 않는다 */
  const coverScale = Math.max(
    boxWidth / current.naturalWidth,
    boxHeight / current.naturalHeight
  )
  const scale = coverScale * crop.zoom
  const displayWidth = current.naturalWidth * scale
  const displayHeight = current.naturalHeight * scale
  const slackX = Math.max(0, displayWidth - boxWidth)
  const slackY = Math.max(0, displayHeight - boxHeight)

  // 크롭 창이 오른쪽으로 갈수록(offset+) 사진은 왼쪽으로 밀린다
  const translateX = -(slackX / 2 + crop.offsetX * slackX)
  const translateY = -(slackY / 2 + crop.offsetY * slackY)

  const handlePointerDown = (event: React.PointerEvent) => {
    dragOrigin.current = { x: event.clientX, y: event.clientY, crop }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    const origin = dragOrigin.current
    if (!origin) {
      return
    }

    // 화면에서 끈 거리를 남는 여백에 대한 비율로 환산한다 — 여백이 없으면 움직일 곳도 없다
    const nextX = slackX
      ? origin.crop.offsetX - (event.clientX - origin.x) / slackX
      : 0
    const nextY = slackY
      ? origin.crop.offsetY - (event.clientY - origin.y) / slackY
      : 0

    patchCrop(
      current.id,
      {
        offsetX: Math.min(0.5, Math.max(-0.5, nextX)),
        offsetY: Math.min(0.5, Math.max(-0.5, nextY)),
      },
      origin.crop
    )
  }

  const handlePointerUp = () => {
    dragOrigin.current = null
  }

  const handleApply = () => {
    onApply(Object.entries(drafts).map(([id, value]) => ({ id, crop: value })))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/45"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-[560px] overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-[15px] text-[13px] font-semibold text-sz-n-900">
          비율 · 크롭 조정
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="cursor-pointer text-sz-n-400 hover:text-sz-n-700"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>

        <div className="px-5 py-[18px]">
          <div className="mb-3 flex items-center justify-between gap-2">
            {/* 비율은 표시만 한다 — 고르는 컨트롤이 아니다 */}
            <span className="inline-flex items-center gap-[5px] rounded-[10px] bg-sz-n-100 px-[9px] py-0.5 text-[11px] text-sz-n-600 tabular-nums">
              {describeRatio(current.naturalWidth, current.naturalHeight)}
            </span>
            <span className="truncate text-[11px] text-sz-n-500">
              사진 {photos.indexOf(current) + 1} / {photos.length} ·{" "}
              {current.fileName}
            </span>
          </div>

          <div
            className="relative flex touch-none items-center justify-center overflow-hidden rounded-[6px] bg-sz-n-900 select-none"
            style={{ height: STAGE_HEIGHT }}
          >
            <img
              src={current.originalPreviewUrl}
              alt=""
              draggable={false}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="absolute max-w-none cursor-grab active:cursor-grabbing"
              style={{
                width: displayWidth,
                height: displayHeight,
                left: `calc(50% - ${boxWidth / 2}px)`,
                top: `calc(50% - ${boxHeight / 2}px)`,
                transform: `translate(${translateX}px, ${translateY}px)`,
              }}
            />

            {/* 3분할 가이드 + 바깥 어둡게 — 상자 밖은 잘려 나가는 영역이다 */}
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[1.5px] border-white shadow-[0_0_0_9999px_rgba(26,27,31,0.55)]"
                style={{ width: boxWidth, height: boxHeight }}
              >
                <i className="absolute top-0 bottom-0 left-1/3 w-px bg-white/30" />
                <i className="absolute top-0 bottom-0 left-2/3 w-px bg-white/30" />
                <i className="absolute top-1/3 right-0 left-0 h-px bg-white/30" />
                <i className="absolute top-2/3 right-0 left-0 h-px bg-white/30" />
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-3">
            <span className="shrink-0 text-[11px] text-sz-n-500">확대</span>
            <input
              type="range"
              min={1}
              max={ZOOM_MAX}
              step={0.01}
              value={crop.zoom}
              onChange={event =>
                patchCrop(
                  current.id,
                  { zoom: Number(event.target.value) },
                  crop
                )
              }
              className="h-[3px] flex-1 cursor-pointer appearance-none rounded-[2px] bg-sz-n-200 accent-sz-accent-500"
            />
            <span className="w-10 shrink-0 text-right text-[11px] text-sz-n-500 tabular-nums">
              {Math.round(crop.zoom * 100)}%
            </span>
          </div>

          {photos.length > 1 && (
            <div className="mt-3.5 flex gap-1.5 overflow-x-auto pb-1">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setCurrentId(photo.id)}
                  className={cn(
                    "size-fit shrink-0 cursor-pointer overflow-hidden rounded-[4px] border",
                    photo.id === current.id
                      ? "border-[1.5px] border-sz-accent-500"
                      : "border-sz-n-200"
                  )}
                >
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="h-12 w-[38px] object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <p className="mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600">
            이 게시물의 비율은 <b className="text-sz-n-900">첫 번째 사진</b>이
            정합니다. 첫 번째를 바꾸면 이미 조정한 영역이 다시 계산됩니다.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-5 py-[13px]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            적용
          </Button>
        </div>
      </div>
    </div>
  )
}
