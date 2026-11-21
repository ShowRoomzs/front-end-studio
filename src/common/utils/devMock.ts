/*
  개발 서버(`pnpm dev`) 전용 목업 도구 — 홈 · 기본정보 · 성과가 DEV에서 404일 때 목업으로 채운다.
  배포본은 항상 실 API만 부른다(실제 인플루언서에게 가짜 금액이 보이면 안 된다).
*/

const DEV_MOCK_ENABLED = import.meta.env.DEV

/** 목업 응답에 네트워크 지연을 흉내 낸다 — 로딩 상태를 눈으로 확인할 수 있게 */
export function mockDelay<T>(value: T, ms = 250): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(structuredClone(value)), ms)
  })
}

/**
 * 시안의 다른 상태를 보고 싶을 때 주소에 `?mock=<값>`을 붙인다(개발 서버 전용).
 * 예: 홈 `/?mock=h2`
 */
export function mockScenario(): string | null {
  if (!DEV_MOCK_ENABLED) return null
  return new URLSearchParams(window.location.search).get("mock")
}
