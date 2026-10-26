import {
  HOME_QUERY_KEYS,
  LIVE_POLL_INTERVAL,
} from "@/features/home/constants/params"
import { homeService } from "@/features/home/services/homeService"
import { useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * `GET /v1/creator/home` — 응답의 계정 블록 · 실시간 띠를 각 키에 함께 넣는다.
 * 정지 배너(계정 상태)와 실시간 띠가 홈 진입 직후 같은 값을 한 번 더 부르지 않게 한다.
 */
export function useGetCreatorHome() {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.HOME],
    queryFn: async () => {
      const home = await homeService.getHome()
      queryClient.setQueryData([HOME_QUERY_KEYS.ACCOUNT_STATUS], home.account)
      queryClient.setQueryData([HOME_QUERY_KEYS.LIVE], home.live)
      return home
    },
    retry: 1,
  })
}

/** `GET /v1/creator/home/live` — 홈 응답의 `live`로 시작해 1분마다 갱신한다 */
export function useGetHomeLive(enabled: boolean) {
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.LIVE],
    queryFn: homeService.getLive,
    enabled,
    refetchInterval: LIVE_POLL_INTERVAL,
    // 첫 값은 홈 응답이 이미 넣었다 — 마운트 즉시 같은 값을 다시 부르지 않는다
    staleTime: LIVE_POLL_INTERVAL,
    retry: false,
  })
}

/** `GET /v1/creator/home/calendar?month=` */
export function useGetHomeCalendar(month: string) {
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.CALENDAR, month],
    queryFn: () => homeService.getCalendar(month),
    staleTime: 60_000,
  })
}

/** `GET /v1/common/business-holidays?from&to` — 공휴일은 어드민이 등록할 때만 바뀐다 */
export function useGetBusinessHolidays(from: string, to: string) {
  return useQuery({
    queryKey: [HOME_QUERY_KEYS.HOLIDAYS, from, to],
    queryFn: () => homeService.getHolidays(from, to),
    staleTime: 60 * 60_000,
    retry: false,
  })
}
