import toast from "react-hot-toast"

/**
 * blob URL은 만든 직후에 바로 회수하면 다운로드가 시작되기 전에 끊기는 경우가 있다.
 * 저장은 메모리/디스크에서 곧바로 끝나므로 넉넉히 10초면 충분하다.
 */
const OBJECT_URL_TTL = 10_000

const CORS_BLOCKED_MESSAGE =
  "브라우저가 파일을 새 탭에서 열었습니다. 저장하려면 새 탭에서 우클릭 → 저장을 사용해 주세요."

function clickAnchor(href: string, fileName?: string) {
  const anchor = document.createElement("a")
  anchor.href = href
  if (fileName) {
    anchor.download = fileName
  } else {
    anchor.target = "_blank"
  }
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

/**
 * 파일 한 개 다운로드. 실제로 저장됐으면 `true`.
 *
 * ⚠️ 첨부는 CDN(다른 오리진)에 있다. **크로스 오리진 URL에서는 `<a download>`의
 * `download` 속성이 브라우저에 의해 무시된다** — 저장 대신 "이동"이 돼서 이미지는
 * 탭에 그냥 열리고, SPA는 보고 있던 화면을 잃는다. 그래서 바이트를 직접 받아
 * **같은 오리진의 blob URL**로 바꾼 뒤 저장한다(blob은 same-origin이라 속성이 먹는다).
 *
 * CDN에 CORS(GET)가 없으면 이 fetch가 막힌다. 그때는 새 탭으로 여는 것으로 물러난다 —
 * 저장은 못 하지만 최소한 대화 화면이 날아가지는 않는다.
 *
 * 근본 해결은 서버가 `Content-Disposition: attachment`를 붙여 내려주는 것이다.
 * 그러면 이 우회 없이 브라우저가 직접 스트리밍 저장한다(§13-9의 "브라우저에 맡긴다").
 */
export async function downloadFile(
  url: string,
  fileName: string
): Promise<boolean> {
  let objectUrl: string | null = null

  try {
    const response = await fetch(url, { mode: "cors" })
    if (!response.ok) {
      throw new Error(`${response.status}`)
    }
    objectUrl = URL.createObjectURL(await response.blob())
    clickAnchor(objectUrl, fileName)
    return true
  } catch {
    clickAnchor(url)
    toast.error(CORS_BLOCKED_MESSAGE)
    return false
  } finally {
    if (objectUrl) {
      const revokeTarget = objectUrl
      setTimeout(() => URL.revokeObjectURL(revokeTarget), OBJECT_URL_TTL)
    }
  }
}

/**
 * 전체 다운로드 — 압축하지 않고 개별 파일로 순차 저장한다(§13-9).
 *
 * 병렬로 돌리지 않는 이유는 두 가지다 — 대용량 첨부를 한꺼번에 메모리에 올리지
 * 않기 위해서, 그리고 브라우저가 동시 다운로드를 막지 않게 하기 위해서다.
 */
export async function downloadFiles(
  files: Array<{ url: string; fileName: string }>
) {
  for (const file of files) {
    const saved = await downloadFile(file.url, file.fileName)
    /*
      CORS가 막혀 있으면 나머지도 전부 같은 이유로 실패한다.
      탭을 파일 수만큼 열고 토스트를 도배하는 대신 첫 실패에서 멈춘다.
    */
    if (!saved) {
      break
    }
  }
}
