import { apiInstance } from "@/common/lib/apiInstance"
import { HOME_MOCK_SCENARIOS } from "@/features/home/constants/params"
import {
  loadHomeDevMock,
  withDevFallback,
} from "@/features/home/services/devFallback"
import type {
  CreatorHome,
  HolidayItem,
  HomeCalendar,
  HomeLive,
} from "@/features/home/types"

const loadMock = loadHomeDevMock

/**
 * 스튜디오 홈(1017 설계서 5절) — 조회 셋 + 공용 공휴일.
 * 화면이 오류 상태를 직접 그려 전역 토스트는 끈다(silent).
 */
export const homeService = {
  /** `GET /v1/creator/home` — 진입 시 한 번(계정 · 가이드 · 실시간 띠 · 할 일 · 다가오는 일정 · 리워드 · 쇼룸 7일) */
  getHome: () =>
    withDevFallback({
      request: async config => {
        const { data } = await apiInstance.get<CreatorHome>(
          "/creator/home",
          config
        )
        return data
      },
      mock: async scenario => (await loadMock()).mockHome(scenario),
      scenarios: HOME_MOCK_SCENARIOS,
      silent: true,
    }),

  /** `GET /v1/creator/home/live` — 진행 중 공구가 없으면 본문 null(빈 본문) */
  getLive: () =>
    withDevFallback({
      request: async config => {
        const { data } = await apiInstance.get<HomeLive | "" | null>(
          "/creator/home/live",
          config
        )
        return data || null
      },
      mock: async scenario => (await loadMock()).mockLive(scenario),
      scenarios: HOME_MOCK_SCENARIOS,
      silent: true,
    }),

  /** `GET /v1/creator/home/calendar?month=yyyy-MM` — 요청 월 ±7일 */
  getCalendar: (month: string) =>
    withDevFallback({
      request: async config => {
        const { data } = await apiInstance.get<HomeCalendar>(
          "/creator/home/calendar",
          { ...config, params: { month } }
        )
        return data
      },
      mock: async scenario => (await loadMock()).mockCalendar(scenario, month),
      scenarios: HOME_MOCK_SCENARIOS,
      silent: true,
    }),

  /**
   * `GET /v1/common/business-holidays?from&to` — 공휴일(대체 · 임시 포함 · 주말 제외 · 인증 불요).
   * 달력 응답에도 실리지만, 달력이 실패해도 주말 · 공휴일 칸은 칠하려고 따로 부른다.
   */
  getHolidays: (from: string, to: string) =>
    withDevFallback({
      request: async config => {
        const { data } = await apiInstance.get<Array<HolidayItem>>(
          "/common/business-holidays",
          { ...config, params: { from, to } }
        )
        return data
      },
      mock: async () => (await loadMock()).mockHolidays(from, to),
      scenarios: HOME_MOCK_SCENARIOS,
      silent: true,
    }),
}
