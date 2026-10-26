import {
  ACCOUNT_STATUS_STALE_TIME,
  HOME_QUERY_KEYS,
} from "@/features/home/constants/params"
import { accountStatusService } from "@/features/home/services/accountStatusService"
import { useQuery } from "@tanstack/react-query"

/**
 * 계정 상태(`GET /v1/creator/account-status`) — 모든 페이지의 정지 배너 · 탑바 「정지」 칩 · 막힌 버튼의 재료.
 *
 * 홈은 `GET /v1/creator/home`의 `account`로 같은 키를 채운다(따로 부르지 않는다). 다른 화면은 이 훅이 부른다.
 * 실패하면 배너를 그리지 않는다 — 조회 실패를 정지로 오인하게 하지 않는다.
 *
 * ```tsx
 * const { isSuspended, sanction } = useAccountStatus()
 * <Button disabled={isSuspended}>수락</Button>
 * ```
 */
export function useAccountStatus() {
  const query = useQuery({
    queryKey: [HOME_QUERY_KEYS.ACCOUNT_STATUS],
    queryFn: accountStatusService.get,
    staleTime: ACCOUNT_STATUS_STALE_TIME,
    refetchOnWindowFocus: true,
  })

  const sanction = query.data?.sanction ?? null

  return {
    ...query,
    accountStatus: query.data,
    /** 열린 정지 — 배너 · 막힘 판단은 이 값 하나로 한다 */
    sanction,
    isSuspended: sanction != null,
    /** 지급 정지 사유 — 배너 정산 줄 · 정산 보조 배지 */
    isPayoutHeld: sanction?.payoutHeld ?? false,
    withdrawalPending: query.data?.withdrawalPending ?? false,
  }
}
