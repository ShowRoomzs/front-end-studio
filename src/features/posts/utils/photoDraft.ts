import {
  POST_ALLOWED_EXTENSIONS,
  POST_IMAGE_MAX_BYTES,
} from "@/features/posts/constants/params"
import { formatFileSize } from "@/features/posts/utils/format"
import {
  DEFAULT_CROP,
  type CropState,
} from "@/features/posts/utils/aspectRatio"
import type { PostImageResponse } from "@/features/posts/services/postService"

/** 저장 요청에 그대로 실리는 부분 — 서버가 돌려준 값만 담는다 */
export interface UploadedImage {
  imageUrl: string
  originalUrl: string
  width: number
  height: number
}

export interface PhotoDraft {
  kind: "photo"
  id: string
  fileName: string
  fileSize?: number
  /** 크롭 전 원본의 자연 크기 — 크롭 창 계산의 기준 */
  naturalWidth: number
  naturalHeight: number
  crop: CropState
  /** 크롭 소스. 새로 고른 파일이면 바이트, 이미 올라간 사진이면 원본 URL */
  source: File | string
  /** 화면에 보이는 크롭 결과 */
  previewUrl: string
  uploaded: UploadedImage | null
  /** 업로드·크롭이 도는 중 — 이 칸은 아직 저장 대상이 아니다 */
  busy: boolean
}

/**
 * 형식·용량에 걸린 파일 (§24-4).
 *
 * 문구로만 알리면 여러 장을 한꺼번에 올렸을 때 무엇을 다시 골라야 하는지 알 수 없어서,
 * 그리드에 칸으로 남기고 파일명과 사유를 칸 안에 적는다. 장수에 포함되지 않고 저장
 * 대상도 아니다.
 */
export interface PhotoFailure {
  kind: "failure"
  id: string
  fileName: string
  reason: string
}

export type PhotoCell = PhotoDraft | PhotoFailure

export function isPhoto(cell: PhotoCell): cell is PhotoDraft {
  return cell.kind === "photo"
}

export function isFailure(cell: PhotoCell): cell is PhotoFailure {
  return cell.kind === "failure"
}

let sequence = 0
export function nextCellId(prefix: string) {
  sequence += 1
  return `${prefix}-${sequence}`
}

/**
 * 고르는 즉시 거를 수 있는 것만 여기서 거른다.
 *
 * 확장자를 바꾼 영상처럼 내용으로만 판별되는 파일은 통과시킨다 — 서버가 실제 바이트를
 * 읽어 잡아내고, 그 실패도 같은 모양의 칸으로 돌아온다.
 */
export function validateLocally(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (!POST_ALLOWED_EXTENSIONS.includes(extension as "jpg")) {
    return "지원하지 않는 형식"
  }
  if (file.size > POST_IMAGE_MAX_BYTES) {
    return `${formatFileSize(file.size)} · 20MB 초과`
  }
  return null
}

/** 저장 대상 사진 수 — 실패 칸은 세지 않는다(`N / 20`) */
export function countPhotos(cells: Array<PhotoCell>) {
  return cells.filter(isPhoto).length
}

export function hasFailure(cells: Array<PhotoCell>) {
  return cells.some(isFailure)
}

/** 업로드나 크롭이 아직 도는 칸이 있으면 저장·게시를 눌러도 보낼 값이 없다 */
export function hasBusyPhoto(cells: Array<PhotoCell>) {
  return cells.some(cell => isPhoto(cell) && (cell.busy || !cell.uploaded))
}

/** 이미 올라간 사진을 편집 화면의 칸으로 되돌린다 */
export function toPhotoDraft(image: PostImageResponse): PhotoDraft {
  return {
    kind: "photo",
    id: nextCellId("saved"),
    fileName: image.imageUrl.split("/").pop() ?? "photo",
    naturalWidth: image.width,
    naturalHeight: image.height,
    crop: DEFAULT_CROP,
    source: image.originalUrl,
    previewUrl: image.imageUrl,
    uploaded: {
      imageUrl: image.imageUrl,
      originalUrl: image.originalUrl,
      width: image.width,
      height: image.height,
    },
    busy: false,
  }
}

/** 저장 요청의 `images` — 배열 순서가 곧 노출 순서이고 첫 장이 대표 사진이다 */
export function toImageRequests(cells: Array<PhotoCell>) {
  return cells
    .filter(isPhoto)
    .map(photo =>
      photo.uploaded
        ? { ...photo.uploaded, fileSize: photo.fileSize }
        : null
    )
    .filter((image): image is UploadedImage & { fileSize?: number } =>
      image !== null
    )
}
