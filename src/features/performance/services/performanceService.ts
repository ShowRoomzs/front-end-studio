import { apiInstance } from "@/common/lib/apiInstance"
import { mockScenario } from "@/common/utils/devMock"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import {
  CREATOR_PERFORMANCE_SORTS,
  CREATOR_PERFORMANCE_STATUSES,
  PERFORMANCE_MONTHS,
  type CreatorPerformanceDetail,
  type CreatorPerformanceListPage,
  type CreatorPerformanceSummary,
  type PerformanceListParams,
} from "@/features/performance/types"
import axios from "axios"

/*
  쇼룸 스튜디오 성과 관리(ui-studio-10 rev.2) — back-end origin/main `CreatorPerformanceController`
  (`/v1/creator/performance`) · 49 스튜디오 성과 설계서. 조회 전용 — 쓰기 API가 없다.

  실서버를 먼저 부른다. main에는 있으나 개발 서버(api.showroomz.shop)에 아직 배포되지 않은 동안(2026-10-24)만,
  **개발 서버(`pnpm dev`)에서 그 경로가 404일 때** 목업으로 대신한다(`performance.mock.ts` — 동적 import라
  배포 번들에 들어가지 않는다). 배포본은 목업을 쓰지 않고 오류는 오류 상태로 보인다.
  서버에 배포되면 고칠 것 없이 실데이터가 나온다.

  상세의 404 중 `GROUP_BUY_NOT_FOUND`(남의 공구 · 없음 · 판매 0건)는 서버의 실제 답이라 목업으로 덮지 않는다.

  개발 서버 `?mock=` 시나리오 — 주소에 붙이면 실호출 없이 그 상태를 그린다(개발 서버 전용):
   - 목록 `/performance`: (없음 · 404 대체) L1 · `empty` L2 빈 상태 · `pending` 종료 공구는 있으나 정산 완료 0건
     (KPI 「—」) · `error` 불러오기 실패
   - 상세 `/performance/:groupBuyId`: (없음 · 404 대체) 목업 목록의 ID 상태 그대로(31 · 27 D3 · 30 D2 ·
     29 D2' · 28 · 26 · 25 · 24 D1) · `settled` D1 · `collecting` D2 · `reviewing` D2'(정산 확인 중 ·
     예정 없음) · `adjusting` D3 · `agreed` D4 · `sparse` D1(게시물 없음 · 분포 비공개 · 사업자)
     · `not-found` 404 · `not-ready` 409 · `error` 불러오기 실패
*/

const BASE_URL = "/creator/performance"

/** 개발 서버에서만 — 경로가 없을 때(404)만 목업. 업무 404(`GROUP_BUY_NOT_FOUND`)는 그대로 던진다 */
function isMissingEndpoint(error: unknown) {
  if (!import.meta.env.DEV || !axios.isAxiosError(error)) return false
  if (error.response?.status !== 404) return false
  const code = (error.response.data as { code?: string } | undefined)?.code
  return code !== "GROUP_BUY_NOT_FOUND"
}

async function withDevFallback<T>(
  real: () => Promise<T>,
  mock: (scenario: string | null) => Promise<T>
): Promise<T> {
  const scenario = mockScenario()
  if (import.meta.env.DEV && scenario) return mock(scenario)
  try {
    return await real()
  } catch (error) {
    if (isMissingEndpoint(error)) return mock(null)
    throw error
  }
}

/** 주소의 값은 문자열이다 — 서버가 받는 3 · 6 · 12만 보내고 나머지는 기본(생략)으로 */
export function toMonths(value: unknown) {
  const months = Number(value)
  return (PERFORMANCE_MONTHS as ReadonlyArray<number>).includes(months)
    ? months
    : null
}

/** 칩이 전부 켜진 기본 화면 = status 생략(서버 「비면 전체」). 주소에 남은 옛 값은 버린다 — 서버가 400을 낸다 */
function toListSearchParams(params: PerformanceListParams) {
  const selected = CREATOR_PERFORMANCE_STATUSES.filter(status =>
    ([] as Array<string>).concat(params.status).includes(status)
  )
  return paramsToSearchParams({
    months: toMonths(params.months),
    status:
      selected.length === CREATOR_PERFORMANCE_STATUSES.length ? [] : selected,
    keyword: params.keyword.trim(),
    sort: (CREATOR_PERFORMANCE_SORTS as ReadonlyArray<string>).includes(
      params.sort
    )
      ? params.sort
      : null,
    page: params.page,
    size: params.size,
  })
}

export const performanceService = {
  getList: (params: PerformanceListParams) =>
    withDevFallback(
      async () => {
        const { data } = await apiInstance.get<CreatorPerformanceListPage>(
          BASE_URL,
          { params: toListSearchParams(params), suppressErrorToast: true }
        )
        return data
      },
      async scenario => {
        if (!import.meta.env.DEV) throw new Error("mock is dev-only")
        const { getListMock } = await import("./performance.mock")
        return getListMock(params, scenario)
      }
    ),

  /** 목록 머리 기간 · KPI 8장 · 상태 칩 — 기간만 따르고 검색어 · 칩과 무관 */
  getSummary: (months: number) =>
    withDevFallback(
      async () => {
        const { data } = await apiInstance.get<CreatorPerformanceSummary>(
          `${BASE_URL}/summary`,
          {
            params: paramsToSearchParams({ months: toMonths(months) }),
            suppressErrorToast: true,
          }
        )
        return data
      },
      async scenario => {
        if (!import.meta.env.DEV) throw new Error("mock is dev-only")
        const { getSummaryMock } = await import("./performance.mock")
        return getSummaryMock(months, scenario)
      }
    ),

  /** 남의 공구 · 없음 · 판매 0건 = 404 `GROUP_BUY_NOT_FOUND` · 진행 중 · 중단 = 409 `PERFORMANCE_NOT_READY` */
  getDetail: (groupBuyId: number) =>
    withDevFallback(
      async () => {
        const { data } = await apiInstance.get<CreatorPerformanceDetail>(
          `${BASE_URL}/${groupBuyId}`,
          { suppressErrorToast: true }
        )
        return data
      },
      async scenario => {
        if (!import.meta.env.DEV) throw new Error("mock is dev-only")
        const { getDetailMock } = await import("./performance.mock")
        return getDetailMock(groupBuyId, scenario)
      }
    ),
}

/** 화면이 실패를 가를 때 — 서버 에러 코드 · 상태 · 문구 */
export function performanceErrorInfo(error: unknown): {
  status?: number
  code?: string
  message?: string
} {
  if (!axios.isAxiosError(error)) return {}
  const data = error.response?.data as
    { code?: string; message?: string } | undefined
  return {
    status: error.response?.status,
    code: data?.code,
    message: data?.message,
  }
}
