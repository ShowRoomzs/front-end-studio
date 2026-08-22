import {
  POST_ACCEPT_ATTRIBUTE,
  POST_IMAGE_MAX,
} from "@/features/posts/constants/params"
import {
  countPhotos,
  isFailure,
  type PhotoCell,
} from "@/features/posts/utils/photoDraft"
import { cn } from "@/lib/utils"
import { Expand, Loader2, Plus, X } from "lucide-react"
import { useRef, useState } from "react"

/**
 * 사진 편집 그리드 (§24-2 · §24-4).
 *
 * 순서 변경은 셀 드래그이고 **화면에 문구로 안내하지 않는다** — 커서와 드래그 상태로만
 * 드러낸다. 첫 칸이 대표 사진이자 게시물 비율의 기준이라, 다른 칸을 첫 자리로 끌어다 놓으면
 * 나머지 전부가 그 비율로 다시 잘린다.
 */
export default function PhotoGrid(props: {
  cells: Array<PhotoCell>
  /** 칸을 그릴 비율 — 사진이 아직 없으면 목록 격자와 같은 4:5로 자리만 잡는다 */
  targetRatio: number | null
  /** 읽기 전용(노출 중지·심사 중) — 추가·제외·크롭·드래그가 전부 사라진다 */
  readOnly?: boolean
  onAddFiles: (files: Array<File>) => void
  onRemove: (id: string) => void
  onMove: (fromId: string, toId: string) => void
  onCrop: (id: string) => void
}) {
  const { cells, targetRatio, readOnly, onAddFiles, onRemove, onMove, onCrop } =
    props

  const inputRef = useRef<HTMLInputElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const photoCount = countPhotos(cells)
  /**
   * 실패 칸이 하나라도 남아 있으면 `+`가 잠긴다 (§24-4).
   * 푸는 길은 실패 칸의 X 하나뿐이다 — 확인하지 않고 빠져나갈 경로를 두지 않는다.
   */
  const isLocked = cells.some(isFailure)
  const isFull = photoCount >= POST_IMAGE_MAX
  const canAdd = !readOnly && !isLocked && !isFull

  const cellStyle = { aspectRatio: `${targetRatio ?? 4 / 5}` }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={POST_ACCEPT_ATTRIBUTE}
        multiple
        hidden
        onChange={event => {
          onAddFiles(Array.from(event.target.files ?? []))
          // 같은 파일을 다시 고를 수 있어야 한다 — 값이 남아 있으면 change가 안 뜬다
          event.target.value = ""
        }}
      />

      <div className="grid grid-cols-5 gap-2">
        {cells.map(cell =>
          isFailure(cell) ? (
            <div
              key={cell.id}
              style={cellStyle}
              className="relative flex flex-col items-center justify-center gap-[3px] rounded-[6px] border-[1.5px] border-sz-danger-text bg-sz-danger-bg px-1.5 py-2"
            >
              <span className="line-clamp-2 px-1 text-center text-[9px] leading-[1.4] break-all text-sz-n-700">
                {cell.fileName}
              </span>
              <span className="text-center text-[9px] leading-[1.4] font-semibold text-sz-danger-text">
                {cell.reason}
              </span>
              <button
                type="button"
                aria-label={`${cell.fileName} 제외`}
                onClick={() => onRemove(cell.id)}
                className="absolute top-1 right-1 flex size-[17px] cursor-pointer items-center justify-center rounded-full bg-sz-danger-text text-[9px] text-white"
              >
                <X className="size-2.5" aria-hidden />
              </button>
            </div>
          ) : (
            <div
              key={cell.id}
              style={cellStyle}
              draggable={!readOnly}
              onDragStart={() => setDraggingId(cell.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={event => {
                if (draggingId && draggingId !== cell.id) {
                  event.preventDefault()
                }
              }}
              onDrop={() => {
                if (draggingId && draggingId !== cell.id) {
                  onMove(draggingId, cell.id)
                }
                setDraggingId(null)
              }}
              className={cn(
                "relative overflow-hidden rounded-[6px] border border-sz-n-200 bg-sz-n-100",
                !readOnly && "cursor-grab active:cursor-grabbing",
                draggingId === cell.id && "opacity-40"
              )}
            >
              <img
                src={cell.previewUrl}
                alt=""
                className="size-full object-cover"
              />

              {cell.busy && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2
                    className="size-4 animate-spin text-sz-n-500"
                    aria-hidden
                  />
                </div>
              )}

              {!readOnly && (
                <>
                  <button
                    type="button"
                    aria-label="비율 · 크롭 조정"
                    onClick={() => onCrop(cell.id)}
                    className="absolute top-1 left-1 flex size-[17px] cursor-pointer items-center justify-center rounded-[6px] bg-sz-n-900/70 text-white"
                  >
                    <Expand className="size-2.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="사진 제외"
                    onClick={() => onRemove(cell.id)}
                    className="absolute top-1 right-1 flex size-[17px] cursor-pointer items-center justify-center rounded-full bg-sz-n-900/70 text-white"
                  >
                    <X className="size-2.5" aria-hidden />
                  </button>
                </>
              )}

              {cells.indexOf(cell) === 0 && (
                <span className="absolute bottom-1 left-1 rounded-[10px] bg-sz-accent-500 px-1.5 py-px text-[9px] font-medium text-white">
                  대표
                </span>
              )}
            </div>
          )
        )}

        {!readOnly && !isFull && (
          <button
            type="button"
            style={cellStyle}
            disabled={!canAdd}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex items-center justify-center rounded-[6px] border border-dashed text-[17px]",
              canAdd
                ? "cursor-pointer border-sz-n-300 bg-white text-sz-n-500 hover:bg-sz-n-50"
                : "cursor-not-allowed border-sz-n-200 bg-sz-n-100 text-sz-n-300"
            )}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </>
  )
}
