import { apiInstance } from "@/common/lib/apiInstance"
import { HOME_MOCK_SCENARIOS } from "@/features/home/constants/params"
import {
  loadHomeDevMock,
  withDevFallback,
} from "@/features/home/services/devFallback"
import type { MemberAccountStatus } from "@/features/home/types"

/**
 * `GET /v1/creator/account-status`(1017 설계서 8-10) — 모든 페이지 정지 배너 · 탑바 「정지」 칩의 재료.
 * 홈 응답의 `account` 와 같은 꼴이다. DEV 목업은 `?mock=h5`일 때만 정지다.
 */
export const accountStatusService = {
  get: () =>
    withDevFallback({
      request: async config => {
        const { data } = await apiInstance.get<MemberAccountStatus>(
          "/creator/account-status",
          config
        )
        return data
      },
      mock: async scenario =>
        (await loadHomeDevMock()).mockAccountStatus(scenario),
      scenarios: HOME_MOCK_SCENARIOS,
      silent: true,
    }),
}
