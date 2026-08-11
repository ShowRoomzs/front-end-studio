/**
 * 파일 한 개 다운로드.
 *
 * 진행률 UI는 만들지 않는다(§13-9 확정) — 브라우저 다운로드 트레이가 이미
 * 보여주는 정보고, 채팅 UI 안에 다시 그리려면 스트리밍 처리가 필요해진다.
 *
 * 첨부는 CDN(다른 오리진)에 있어서 `download` 속성만으로는 강제 저장이 보장되지
 * 않는다 — 서버가 `Content-Disposition: attachment`를 붙여야 최종적으로 저장된다.
 */
export function downloadFile(url: string, fileName: string) {
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

/** 전체 다운로드 — 압축하지 않고 개별 파일로 순차 저장한다(§13-9) */
export function downloadFiles(files: Array<{ url: string; fileName: string }>) {
  files.forEach(file => downloadFile(file.url, file.fileName))
}
