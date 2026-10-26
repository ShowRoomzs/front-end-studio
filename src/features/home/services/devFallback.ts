import axios, { type AxiosRequestConfig } from "axios"
import toast from "react-hot-toast"
import { mockScenario } from "@/common/utils/devMock"

/*
  DEV 전용 대체(03a 2절) — 홈 · 알림 · 계정 상태 · 공휴일 API는 `origin/main`에 있지만 개발 서버가 아직
  예전 배포라 404다. 개발 서버(`pnpm dev`)에서만, 그 라우트가 없을 때(404) 목업으로 채운다.
  - 배포본은 절대 목업을 쓰지 않는다 — 실패하면 화면이 오류 상태를 그린다.
  - 목업 모듈은 동적 import 로 불러 배포 번들에서 빠진다(호출부가 `import()`를 넘긴다).
  - `?mock=<시나리오>`(DEV)는 실 API 대신 그 시나리오를 강제로 그린다 — 시안 상태를 눈으로 확인하는 용도.
  배포되면 404가 사라져 자동으로 실데이터가 나온다.
*/

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

/** 라우트가 없을 때의 404 — 계정 · 알림이 없을 때의 업무 404(코드가 붙는다)와 가른다 */
const BUSINESS_NOT_FOUND_CODES = ["CREATOR_NOT_FOUND", "NOTIFICATION_NOT_FOUND"]

export function isRouteMissing(error: unknown) {
  return (
    axios.isAxiosError<{ code?: string }>(error) &&
    error.response?.status === 404 &&
    !BUSINESS_NOT_FOUND_CODES.includes(error.response.data?.code ?? "")
  )
}

/** DEV 에서 `?mock=`이 이 화면의 시나리오면 그 값 — 아니면 null(배포본은 언제나 null) */
export function forcedScenario<S extends string>(
  scenarios: ReadonlyArray<S>
): S | null {
  const scenario = mockScenario()
  return scenario && (scenarios as ReadonlyArray<string>).includes(scenario)
    ? (scenario as S)
    : null
}

interface DevFallbackOptions<T, S extends string> {
  /** 실제 호출 — DEV 에서는 인터셉터 토스트를 끄는 설정을 받는다 */
  request: (config: AxiosRequestConfig) => Promise<T>
  /** 목업 — 강제 시나리오가 없으면 null(기본 시나리오) */
  mock: (scenario: S | null) => Promise<T>
  scenarios: ReadonlyArray<S>
  /** 조회처럼 화면이 오류를 직접 그리는 호출은 배포본에서도 토스트를 끈다 */
  silent?: boolean
}

export async function withDevFallback<T, S extends string>(
  options: DevFallbackOptions<T, S>
): Promise<T> {
  const { request, mock, scenarios, silent = false } = options

  if (!import.meta.env.DEV) {
    return request(silent ? { suppressErrorToast: true } : {})
  }

  const scenario = forcedScenario(scenarios)
  if (scenario) {
    return mock(scenario)
  }

  try {
    // 목업 판정 전에 인터셉터 토스트가 먼저 뜨지 않도록 끈다 — 404가 아니면 아래에서 같은 문구를 띄운다
    return await request({ suppressErrorToast: true })
  } catch (error) {
    if (isRouteMissing(error)) {
      return mock(null)
    }
    if (!silent) {
      toast.error(
        (axios.isAxiosError<{ message?: string }>(error) &&
          error.response?.data?.message) ||
          SERVER_ERROR_MESSAGE
      )
    }
    throw error
  }
}

/**
 * 목업 모듈 — `import.meta.env.DEV`가 빌드 때 false 로 바뀌어 이 import 가 통째로 빠진다(배포 번들에 목업 청크가 생기지 않는다).
 * `withDevFallback`이 배포본에서는 목업을 부르지 않으므로 거절 경로는 실행되지 않는다.
 */
export function loadHomeDevMock() {
  return import.meta.env.DEV
    ? import("@/features/home/services/homeDevMock")
    : Promise.reject(new Error("DEV 전용 목업입니다."))
}
