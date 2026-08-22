import { imageService } from "@/common/services/imageService"
import { POST_IMAGE_MAX } from "@/features/posts/constants/params"
import type { PostImageResponse } from "@/features/posts/services/postService"
import {
  clampAspectRatio,
  DEFAULT_CROP,
  isWithinAspectRange,
  type CropState,
} from "@/features/posts/utils/aspectRatio"
import {
  loadCropSource,
  renderCroppedBlob,
  toCropFileName,
} from "@/features/posts/utils/cropCanvas"
import {
  countPhotos,
  isPhoto,
  nextCellId,
  toPhotoDraft,
  validateLocally,
  type PhotoCell,
  type PhotoDraft,
} from "@/features/posts/utils/photoDraft"
import { isAxiosError } from "axios"
import toast from "react-hot-toast"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/** 같은 비율로 볼 만큼 가까운지 — 정수 픽셀에서 나온 값이라 정확히 같을 수 없다 */
const RATIO_TOLERANCE = 0.005

/** 동시에 도는 업로드 수. 20장을 한꺼번에 밀면 브라우저 연결 수에 걸린다 */
const UPLOAD_CONCURRENCY = 3

function ratioOf(photo: PhotoDraft) {
  return photo.uploaded ? photo.uploaded.width / photo.uploaded.height : null
}

/** 실패 칸에 적을 사유 — 서버가 준 문구를 그대로 쓰되 칸 안에 들어갈 만큼만 */
function toFailureReason(error: unknown) {
  if (isAxiosError(error)) {
    const code = error.response?.data?.code
    if (code === "FILE_SIZE_EXCEEDED") {
      return "20MB 초과"
    }
    if (code === "INVALID_FILE_TYPE") {
      return "지원하지 않는 형식"
    }
    return error.response?.data?.message ?? "업로드 실패"
  }
  return error instanceof Error ? error.message : "업로드 실패"
}

interface UsePhotoCellsOptions {
  /** 이미 올라간 사진 — 수정 화면 진입 시 한 번만 넘긴다 */
  initialImages?: Array<PostImageResponse>
  /** 게시물에 이미 정해진 비율 — 있으면 새로 넣는 사진도 이 비율로 잘린다 */
  initialRatio?: number | null
}

/**
 * 사진 그리드의 상태 전부 — 추가·제외·순서·크롭·업로드 (§24-2 · §24-4).
 *
 * 설계의 축은 **자기 치유 루프** 하나다. 화면은 "지금 이 순서의 사진들"만 들고 있고,
 * 어떤 칸이든 결과물이 목표 비율과 어긋나면(새로 넣었거나, 크롭을 바꿨거나, 첫 장이
 * 바뀌어 게시물 비율 자체가 달라졌거나) 그 칸을 다시 만든다. 추가·재정렬·크롭 각각에
 * 개별 처리 경로를 두면 "첫 장을 끌어다 놓으면 나머지 전부가 다시 잘려야 한다"는 규칙이
 * 세 군데로 흩어진다.
 */
export function usePhotoCells(options: UsePhotoCellsOptions = {}) {
  const { initialImages, initialRatio } = options

  const [cells, setCells] = useState<Array<PhotoCell>>(() =>
    (initialImages ?? []).map(toPhotoDraft)
  )
  /**
   * 이미 게시물에 붙은 비율 — 사진이 한 장이라도 남아 있는 동안은 이 값을 지킨다.
   *
   * 이미 게시된 게시물의 비율 변경 허용 여부가 아직 정해지지 않았고(§24-8 미결 7번),
   * 바꾸려면 서버에 있는 원본을 다시 받아 잘라야 해서 스토리지 CORS에 기대게 된다.
   * 사진을 전부 비우면 잠금이 풀리고 새 첫 장이 비율을 다시 정한다.
   */
  const [ratioLock, setRatioLock] = useState<number | null>(
    initialRatio ?? null
  )

  /** 진행 중인 칸 — 자기 치유 루프가 같은 칸을 두 번 집지 않게 한다 */
  const processingIds = useRef(new Set<string>())
  /** 칸별 재생성 횟수 — 판정과 재시도가 맞물려 도는 것을 끊는다 */
  const attempts = useRef(new Map<string, number>())
  /** 언마운트 후 setState를 막는다 — 업로드가 화면보다 오래 산다 */
  const aliveRef = useRef(true)
  /** 화면이 만든 objectURL만 회수한다(서버 URL은 대상이 아니다) */
  const objectUrls = useRef(new Set<string>())

  useEffect(() => {
    aliveRef.current = true
    const urls = objectUrls.current
    return () => {
      aliveRef.current = false
      urls.forEach(url => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const trackObjectUrl = useCallback((url: string) => {
    objectUrls.current.add(url)
    return url
  }, [])

  const releaseObjectUrl = useCallback((url: string | undefined) => {
    if (url && objectUrls.current.has(url)) {
      objectUrls.current.delete(url)
      URL.revokeObjectURL(url)
    }
  }, [])

  const photos = useMemo(() => cells.filter(isPhoto), [cells])

  /**
   * 게시물 비율 — 잠겨 있으면 그 값, 아니면 **첫 장의 원본 비율**을 범위 안으로 클램프한 값.
   */
  const targetRatio = useMemo(() => {
    if (ratioLock !== null) {
      return ratioLock
    }
    const first = photos[0]
    return first
      ? clampAspectRatio(first.naturalWidth / first.naturalHeight)
      : null
  }, [photos, ratioLock])

  /*
    게시물 비율이 바뀌면(첫 장을 끌어다 놓았다) 모든 칸이 다시 잘려야 한다.
    앞선 비율에서 쌓인 재시도 횟수를 그대로 두면 그 칸들이 시도조차 못 하고 낡은 채 남는다.
  */
  useEffect(() => {
    attempts.current.clear()
  }, [targetRatio])

  // 사진을 전부 비우면 잠금이 풀린다 — 다음 첫 장이 비율을 새로 정한다
  useEffect(() => {
    if (photos.length === 0 && ratioLock !== null) {
      setRatioLock(null)
    }
  }, [photos.length, ratioLock])

  const patchPhoto = useCallback((id: string, patch: Partial<PhotoDraft>) => {
    if (!aliveRef.current) {
      return
    }
    setCells(previous =>
      previous.map(cell =>
        isPhoto(cell) && cell.id === id ? { ...cell, ...patch } : cell
      )
    )
  }, [])

  const replaceWithFailure = useCallback(
    (id: string, fileName: string, reason: string) => {
      if (!aliveRef.current) {
        return
      }
      setCells(previous =>
        previous.map(cell =>
          cell.id === id
            ? { kind: "failure" as const, id, fileName, reason }
            : cell
        )
      )
    },
    []
  )

  /**
   * 칸 하나를 목표 비율에 맞춰 다시 만든다 — 원본 업로드 → 크롭 → 크롭본 업로드.
   *
   * 원본은 한 번만 올린다. 반려 후 유예 기간에 내려받는 대상이라 크롭과 무관하게 같은
   * 파일이고(§24-6), 크롭만 바꿨을 때 같은 바이트를 다시 밀 이유가 없다.
   */
  const processPhoto = useCallback(
    async (photo: PhotoDraft, ratio: number) => {
      processingIds.current.add(photo.id)
      attempts.current.set(photo.id, (attempts.current.get(photo.id) ?? 0) + 1)
      patchPhoto(photo.id, { busy: true })

      try {
        let originalUrl = photo.uploaded?.originalUrl
        if (!originalUrl) {
          if (!(photo.source instanceof File)) {
            throw new Error("원본을 찾을 수 없습니다")
          }
          const uploadedOriginal = await imageService.upload({
            file: photo.source,
            type: "POST",
            fileName: photo.fileName,
            suppressErrorToast: true,
          })
          originalUrl = uploadedOriginal.imageUrl
        }

        const naturalRatio = photo.naturalWidth / photo.naturalHeight
        const isUncropped =
          photo.crop.zoom === 1 &&
          photo.crop.offsetX === 0 &&
          photo.crop.offsetY === 0 &&
          isWithinAspectRange(naturalRatio) &&
          Math.abs(naturalRatio - ratio) <= RATIO_TOLERANCE

        // 자를 것이 없으면 같은 파일을 두 번 올리지 않는다 — 사진 한 장짜리 게시물의 흔한 경우다
        if (isUncropped) {
          patchPhoto(photo.id, {
            busy: false,
            dirty: false,
            uploaded: {
              imageUrl: originalUrl,
              originalUrl,
              width: photo.naturalWidth,
              height: photo.naturalHeight,
            },
          })
          return
        }

        const source = await loadCropSource(photo.source)
        const cropped = await renderCroppedBlob({
          source,
          targetRatio: ratio,
          crop: photo.crop,
        })
        source.close?.()

        const uploadedCrop = await imageService.upload({
          file: cropped.blob,
          type: "POST",
          fileName: toCropFileName(photo.fileName),
          suppressErrorToast: true,
        })

        if (!aliveRef.current) {
          return
        }

        const previewUrl = trackObjectUrl(URL.createObjectURL(cropped.blob))
        releaseObjectUrl(photo.previewUrl)

        patchPhoto(photo.id, {
          busy: false,
          dirty: false,
          previewUrl,
          uploaded: {
            imageUrl: uploadedCrop.imageUrl,
            originalUrl,
            // 서버가 실제로 읽은 크기다 — 프론트가 잰 값을 보내면 게시 단계에서 어긋난다
            width: uploadedCrop.width ?? cropped.width,
            height: uploadedCrop.height ?? cropped.height,
          },
        })
      } catch (error) {
        /*
          이미 저장돼 있던 사진은 실패 칸으로 바꾸지 않는다.
          실패 칸을 푸는 길은 X(제외)뿐이라, 크롭을 한 번 잘못 시도한 대가로 멀쩡히
          게시돼 있던 사진을 지워야 하는 처지가 된다. 되돌리고 사유만 알린다 —
          스토리지가 CORS를 열어주지 않으면 이미 올라간 원본은 캔버스로 다시 자를 수 없다.
        */
        if (photo.uploaded) {
          patchPhoto(photo.id, {
            busy: false,
            dirty: false,
            crop: DEFAULT_CROP,
            uploaded: photo.uploaded,
          })
          toast.error(toFailureReason(error))
        } else {
          replaceWithFailure(photo.id, photo.fileName, toFailureReason(error))
        }
      } finally {
        processingIds.current.delete(photo.id)
      }
    },
    [patchPhoto, releaseObjectUrl, replaceWithFailure, trackObjectUrl]
  )

  // 자기 치유 루프 — 결과물이 목표 비율과 어긋난 칸을 다시 만든다
  useEffect(() => {
    if (targetRatio === null) {
      return
    }

    const stale = photos.filter(photo => {
      if (processingIds.current.has(photo.id)) {
        return false
      }
      /*
        같은 칸을 두 번까지만 다시 만든다.
        서버가 돌려준 정수 크기가 어떤 이유로든 목표 비율과 계속 어긋나면, 판정과 재시도가
        서로를 먹여 살리며 업로드가 끝없이 돈다. 결과물은 이미 손에 있으므로 멈추는 쪽이 낫다.
      */
      if ((attempts.current.get(photo.id) ?? 0) >= 2 && photo.uploaded) {
        return false
      }

      const current = ratioOf(photo)
      return (
        photo.dirty ||
        current === null ||
        Math.abs(current - targetRatio) > RATIO_TOLERANCE
      )
    })

    stale
      .slice(0, UPLOAD_CONCURRENCY)
      .forEach(photo => void processPhoto(photo, targetRatio))
  }, [photos, processPhoto, targetRatio])

  /**
   * 파일 추가 — 남은 자리를 넘는 파일은 아예 받지 않는다.
   *
   * 자연 크기는 여기서 읽는다. 첫 장이면 이 값이 곧 게시물 비율이 되므로, 업로드가
   * 끝나기 전에도 나머지 칸을 어떤 비율로 그릴지 정해진다.
   */
  const addFiles = useCallback(
    async (files: Array<File>) => {
      const remaining = POST_IMAGE_MAX - countPhotos(cells)
      const accepted = files.slice(0, Math.max(0, remaining))
      if (accepted.length === 0) {
        return
      }

      const added: Array<PhotoCell> = []
      for (const file of accepted) {
        const localError = validateLocally(file)
        if (localError) {
          added.push({
            kind: "failure",
            id: nextCellId("fail"),
            fileName: file.name,
            reason: localError,
          })
          continue
        }

        try {
          const bitmap = await createImageBitmap(file)
          added.push({
            kind: "photo",
            id: nextCellId("photo"),
            fileName: file.name,
            fileSize: file.size,
            naturalWidth: bitmap.width,
            naturalHeight: bitmap.height,
            crop: DEFAULT_CROP,
            source: file,
            // 같은 파일에서 두 개를 따로 만든다 — 크롭이 끝나면 previewUrl만 갈아치워진다
            previewUrl: trackObjectUrl(URL.createObjectURL(file)),
            originalPreviewUrl: trackObjectUrl(URL.createObjectURL(file)),
            uploaded: null,
            dirty: false,
            busy: true,
          })
          bitmap.close?.()
        } catch {
          // 확장자만 바꾼 파일 — 디코더가 없으면 이미지가 아니다
          added.push({
            kind: "failure",
            id: nextCellId("fail"),
            fileName: file.name,
            reason: "지원하지 않는 형식",
          })
        }
      }

      if (aliveRef.current && added.length > 0) {
        setCells(previous => {
          // 남은 자리는 여기서 한 번 더 센다 — 파일을 연달아 고르면 앞의 계산이 낡는다
          const room = POST_IMAGE_MAX - countPhotos(previous)
          let taken = 0
          return [
            ...previous,
            ...added.filter(cell => cell.kind === "failure" || taken++ < room),
          ]
        })
      }
    },
    [cells, trackObjectUrl]
  )

  /** 칸 제외 — 실패 칸의 X도 같은 경로다. 이것이 오류 잠금을 푸는 유일한 길이다 */
  const removeCell = useCallback(
    (id: string) => {
      setCells(previous => {
        const target = previous.find(cell => cell.id === id)
        if (target && isPhoto(target)) {
          releaseObjectUrl(target.previewUrl)
          releaseObjectUrl(target.originalPreviewUrl)
        }
        attempts.current.delete(id)
        return previous.filter(cell => cell.id !== id)
      })
    },
    [releaseObjectUrl]
  )

  /** 순서 변경 — 첫 자리로 옮기면 게시물 비율이 따라 바뀐다(잠겨 있지 않을 때) */
  const movePhoto = useCallback((fromId: string, toId: string) => {
    setCells(previous => {
      const from = previous.findIndex(cell => cell.id === fromId)
      const to = previous.findIndex(cell => cell.id === toId)
      if (from < 0 || to < 0 || from === to) {
        return previous
      }
      const next = [...previous]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  /**
   * 크롭 확정 — `dirty`만 세우고 결과물은 그대로 둔다.
   *
   * 여기서 `uploaded`를 비우면 원본 URL까지 함께 날아간다. 이미 올라가 있던 사진은
   * 로컬에 바이트가 없어 원본을 다시 올릴 수도 없으므로, 크롭을 한 번 만졌다는 이유로
   * 실패 칸이 되어 버린다.
   */
  const applyCrop = useCallback(
    (id: string, crop: CropState) => {
      attempts.current.delete(id)
      patchPhoto(id, { crop, dirty: true, busy: true })
    },
    [patchPhoto]
  )

  return {
    cells,
    photos,
    targetRatio,
    addFiles,
    removeCell,
    movePhoto,
    applyCrop,
  }
}
