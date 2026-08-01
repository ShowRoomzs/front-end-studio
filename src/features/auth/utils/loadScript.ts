// 소셜 로그인 SDK들을 <script> 태그로 1회만 주입하는 공용 로더.
// partners의 loadDaumPostcode.ts와 같은 패턴 — src당 Promise를 캐시해 중복 주입을 막는다.

const loadedScripts = new Map<string, Promise<void>>()

export function loadScript(src: string): Promise<void> {
  const cached = loadedScripts.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadedScripts.delete(src) // 실패 시 다음 시도에서 재주입 가능하도록 캐시 해제
      reject(new Error(`스크립트를 불러오지 못했습니다: ${src}`))
    }
    document.head.appendChild(script)
  })

  loadedScripts.set(src, promise)
  return promise
}
