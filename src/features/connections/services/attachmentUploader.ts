import {
  threadService,
  type AttachmentSummary,
} from "@/features/connections/services/threadService"
import { getLocalAttachmentType } from "@/features/connections/utils/attachmentIcon"

/**
 * 영상 재생시간을 브라우저에서 읽어낸다.
 *
 * 서버는 파일 바이트를 직접 보지 않고(S3 직접 업로드) 이 값을 스스로 구할 방법이
 * 없어서, 프론트가 `loadedmetadata`로 읽어 완료 통지에 실어 보낸다.
 * 읽지 못하는 코덱이면 그냥 없이 보낸다 — 표시용 참고값이라 첨부를 거부하지 않는다.
 */
function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise(resolve => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement("video")

    const cleanUp = (duration?: number) => {
      URL.revokeObjectURL(objectUrl)
      resolve(duration)
    }

    video.preload = "metadata"
    video.onloadedmetadata = () =>
      cleanUp(
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.round(video.duration)
          : undefined
      )
    video.onerror = () => cleanUp(undefined)
    video.src = objectUrl
  })
}

/**
 * S3로 파일 바이트를 직접 PUT한다.
 *
 * `fetch`가 아니라 `XMLHttpRequest`를 쓰는 이유는 하나뿐이다 — fetch는 업로드
 * 진행률 이벤트를 주지 않아서 시안 S7의 진행률 바를 그릴 수 없다.
 */
function putToStorage(params: {
  uploadUrl: string
  contentType: string
  file: File
  onProgress: (percent: number) => void
  signal?: AbortSignal
}) {
  const { uploadUrl, contentType, file, onProgress, signal } = params

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    // 서명에 포함된 값과 정확히 같아야 한다 — 다르면 S3가 SignatureDoesNotMatch로 거부한다
    xhr.setRequestHeader("Content-Type", contentType)

    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`업로드에 실패했습니다 (${xhr.status})`))
    xhr.onerror = () =>
      reject(new Error("업로드 중 네트워크 오류가 발생했습니다"))
    xhr.onabort = () =>
      reject(new DOMException("업로드가 취소되었습니다", "AbortError"))

    signal?.addEventListener("abort", () => xhr.abort(), { once: true })
    xhr.send(file)
  })
}

/**
 * 첨부 업로드 3단계 — presign 발급 → S3 직접 PUT → 완료 통지(서버가 실측 재검증).
 * 서버를 거치지 않고 S3로 바로 올리므로 500MB 파일도 타임아웃 없이 처리된다.
 */
export async function uploadAttachment(params: {
  threadId: number
  file: File
  onProgress: (percent: number) => void
  signal?: AbortSignal
}): Promise<AttachmentSummary> {
  const { threadId, file, onProgress, signal } = params

  const presign = await threadService.createPresignedUpload(threadId, {
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  })

  await putToStorage({
    uploadUrl: presign.uploadUrl,
    contentType: presign.requiredContentType,
    file,
    onProgress,
    signal,
  })

  const durationSeconds =
    getLocalAttachmentType(file.name) === "VIDEO"
      ? await readVideoDuration(file)
      : undefined

  return threadService.completeUpload(presign.attachmentId, { durationSeconds })
}
