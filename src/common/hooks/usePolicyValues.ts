import { useQuery } from "@tanstack/react-query"

import { QUERY_KEYS } from "@/common/constants/queryKeys"
import {
  policyService,
  type PolicyValues,
} from "@/common/services/policyService"

/**
 * 서버 응답 전 · 실패 · 옛 서버(404)에서 쓰는 값 — 서버 설정 기본값과 같다(application.yml).
 * 화면이 숫자를 비워 두지 않게 하려는 것이고, 응답이 오면 서버 값으로 바뀐다.
 */
const FALLBACK: PolicyValues = {
  claimAutoReceiveBusinessDays: 3,
  trackingStallAlertDays: 7,
  stallConsumerChoiceDays: 7,
  settlementReviewBusinessDays: 3,
  settlementPayoutBusinessDays: 3,
  adjustmentDeadlineBusinessDays: 10,
  fixedFeePaymentBusinessDays: null,
  sanctionAppealBusinessDays: 3,
  sanctionAppealReviewBusinessDays: null,
  cancelRequestRespondBusinessDays: 1,
  creatorAccountReviewBusinessDays: null,
  groupBuySuspensionAppealBusinessDays: 3,
}

/** 정책 영업일 — 세션 중 바뀌지 않는 설정값이라 한 번만 받는다 */
export function usePolicyValues(): PolicyValues {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.POLICY_VALUES],
    queryFn: policyService.getPolicyValues,
    staleTime: Infinity,
    retry: false,
  })
  return data ?? FALLBACK
}
