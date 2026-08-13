import { threadService } from "@/features/connections/services/threadService"

/**
 * 여러 건을 연달아 저장할 때 클릭 사이에 두는 간격.
 *
 * 다운로드 트리거를 한 틱에 몰아 쏘면 브라우저가 뒤쪽 것들을 조용히 버린다.
 * URL을 매번 새로 발급받느라 자연스럽게 간격이 생기긴 하지만, 응답이 빠른 환경에서는
 * 그것만으로 부족해 명시적으로 벌린다.
 */
const SEQUENTIAL_DOWNLOAD_GAP = 400

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 저장을 시작시킨다.
 *
 * `download` 속성을 일부러 붙이지 않는다 — 첨부는 다른 오리진(S3/CDN)에 있어서 그 속성은
 * 브라우저가 무시한다. 대신 **서버가 URL 서명에 심어 보낸 `Content-Disposition: attachment`**가
 * 저장을 결정하고 파일명까지 정한다. 그래서 평범한 링크 이동처럼 보내도 브라우저가
 * 페이지를 떠나지 않고 다운로드로 전환한다(`target="_blank"`도 필요 없다 —
 * 붙이면 빈 탭만 깜빡이고 닫힌다).
 */
function triggerDownload(url: string) {
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

/**
 * 첨부 한 개 저장. 실제로 시작됐으면 `true`.
 *
 * 메시지 목록이 들고 있는 `fileUrl`(CDN)을 쓰지 않고 **매번 서버에서 새로 서명받는다**.
 * 이유가 두 가지다 — ① S3 키가 UUID라서 `fileUrl`로 받으면 파일명이 `uuid.mp4`가 되고,
 * ② `Content-Disposition`이 없어 브라우저가 저장 대신 새 탭 미리보기로 열어버린다.
 * (예전에는 바이트를 fetch해 blob으로 바꿔 우회했는데, CDN에 CORS가 없으면 그마저 막혀
 * 결국 새 탭으로 여는 수밖에 없었다. 서버가 서명에 헤더를 심어주면서 그 우회가 통째로 필요 없어졌다.)
 */
export async function downloadAttachment(
  attachmentId: number
): Promise<boolean> {
  try {
    const { downloadUrl } = await threadService.getDownloadUrl(attachmentId)
    triggerDownload(downloadUrl)
    return true
  } catch {
    // 권한 없음·업로드 미완료 등 실패 사유는 apiInstance 인터셉터가 토스트로 띄운다
    return false
  }
}

/**
 * 전체 다운로드 — 압축하지 않고 개별 파일로 순차 저장한다(§13-9).
 *
 * 첫 실패에서 멈춘다. 여기서 실패하는 이유(로그인 만료·스레드 접근 권한)는 대체로
 * 나머지에도 똑같이 적용돼서, 계속 돌면 같은 토스트만 파일 수만큼 쌓인다.
 *
 * 참고: 파일이 여러 개면 크롬이 "여러 파일 다운로드를 허용하시겠습니까?"를 한 번 묻는다.
 * 브라우저 정책이라 우회할 수 없고, 서버 압축은 §13-9에서 하지 않기로 한 사항이다.
 */
export async function downloadAttachments(attachmentIds: Array<number>) {
  for (const [index, attachmentId] of attachmentIds.entries()) {
    if (index > 0) {
      await delay(SEQUENTIAL_DOWNLOAD_GAP)
    }
    const started = await downloadAttachment(attachmentId)
    if (!started) {
      break
    }
  }
}
