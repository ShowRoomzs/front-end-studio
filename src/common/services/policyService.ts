import { authInstance } from "@/common/lib/authInstance"

/**
 * 정책 영업일 — GET /v1/common/policy-values(BE 58 6-1 · 인증 불필요).
 * 설정이 없는 값(지급 영업일 외 일부)은 null — 화면은 「N영업일 [정책값 미정]」으로 둔다.
 */
export interface PolicyValues {
  claimAutoReceiveBusinessDays: number
  trackingStallAlertDays: number
  stallConsumerChoiceDays: number
  /** 정산 확인 기간 — 「3영업일 확인 → 자동 확정」 */
  settlementReviewBusinessDays: number
  /** 자동 확정 뒤 지급 — 「+ 3영업일」 */
  settlementPayoutBusinessDays: number
  /** 정산 조정 합의 기한 — 「(10영업일)」 */
  adjustmentDeadlineBusinessDays: number
  fixedFeePaymentBusinessDays: number | null
  /** 정지 이의 신청 — 「통지 후 3영업일 이상」 */
  sanctionAppealBusinessDays: number
  sanctionAppealReviewBusinessDays: number | null
  cancelRequestRespondBusinessDays: number
  /** 계좌 변경 운영자 확인 — 미정이면 null */
  creatorAccountReviewBusinessDays: number | null
  groupBuySuspensionAppealBusinessDays: number
}

export const policyService = {
  getPolicyValues: async () => {
    const { data } = await authInstance.get<PolicyValues>(
      "/common/policy-values",
      { suppressErrorToast: true }
    )
    return data
  },
}
