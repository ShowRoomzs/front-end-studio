import type { PageResponse } from "@/common/types/page"
import { apiInstance } from "@/common/lib/apiInstance"
import {
  NOTIFICATION_MOCK_SCENARIOS,
  NOTIFICATION_PAGE_SIZE,
} from "@/features/home/constants/params"
import {
  loadHomeDevMock,
  withDevFallback,
} from "@/features/home/services/devFallback"
import type {
  NotificationItem,
  NotificationSummary,
} from "@/features/home/types"

const loadMock = loadHomeDevMock

/**
 * 탑바 알림(1017 설계서 1-7 · 스튜디오 14 H1a) — 운영팀 · 브랜드 · SHOWROOMZ 가 처리한 결과만 온다.
 * 보관 30일 · 전체 목록 화면 없음(MVP). 배지 = 안 읽은 수.
 */
export const notificationService = {
  /** `GET /v1/creator/notifications?unreadOnly=false&page=1&size=50` */
  getList: () =>
    withDevFallback({
      request: async config => {
        const { data } = await apiInstance.get<PageResponse<NotificationItem>>(
          "/creator/notifications",
          {
            ...config,
            params: {
              unreadOnly: false,
              page: 1,
              size: NOTIFICATION_PAGE_SIZE,
            },
          }
        )
        return data
      },
      mock: async scenario => (await loadMock()).mockNotifications(scenario),
      scenarios: NOTIFICATION_MOCK_SCENARIOS,
      silent: true,
    }),

  /** `GET /v1/creator/notifications/summary` — 종 배지(60초 폴링) */
  getSummary: () =>
    withDevFallback({
      request: async config => {
        const { data } = await apiInstance.get<NotificationSummary>(
          "/creator/notifications/summary",
          config
        )
        return data
      },
      mock: async scenario =>
        (await loadMock()).mockNotificationSummary(scenario),
      scenarios: NOTIFICATION_MOCK_SCENARIOS,
      silent: true,
    }),

  /** `POST /v1/creator/notifications/{id}/read` — 204 */
  markRead: (notificationId: number) =>
    withDevFallback({
      request: async config => {
        await apiInstance.post(
          `/creator/notifications/${notificationId}/read`,
          undefined,
          config
        )
      },
      mock: async () => (await loadMock()).mockMarkRead(notificationId),
      scenarios: NOTIFICATION_MOCK_SCENARIOS,
    }),

  /** `POST /v1/creator/notifications/read-all` — 204 */
  markAllRead: () =>
    withDevFallback({
      request: async config => {
        await apiInstance.post(
          "/creator/notifications/read-all",
          undefined,
          config
        )
      },
      mock: async () => (await loadMock()).mockMarkAllRead(),
      scenarios: NOTIFICATION_MOCK_SCENARIOS,
    }),
}
