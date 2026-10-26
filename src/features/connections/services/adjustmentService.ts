import { apiInstance } from "@/common/lib/apiInstance"
import type {
  AdjustmentStatus,
  AdjustmentTone,
  AdjustmentTurn,
  SettlementParty,
} from "@/features/connections/services/threadService"
import axios from "axios"
import toast from "react-hot-toast"

/** 제안 상태 — 백엔드 `ProposalStatus`. CLOSED = 응답 없이 종결(기한 만료 · 요청 철회) */
export type ProposalStatus =
  "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "CLOSED"

export interface AdjustmentProposal {
  proposalId: number
  seq: number
  proposerType: SettlementParty
  proposerName: string
  rewardAmount: number
  /** 원래 리워드 대비 — 양수 증액 · 음수 감액 */
  deltaAmount: number
  reason: string | null
  status: ProposalStatus
  proposedAt: string
  respondedAt: string | null
  cardMessageId: number | null
}

/** 버튼 권한 — 서버가 판정한다(화면은 식을 들지 않는다) */
export interface AdjustmentPermissions {
  canAccept: boolean
  canReject: boolean
  canCounter: boolean
  /** 메시지 전송 — 종결이면 false */
  canSend: boolean
  /**
   * [요청 철회](1021 기-14) — 처음 요청한 쪽 ∧ 최신 제안이 내 것 ∧ 응답 대기 ∧ 기한 전.
   * 10-24 이전 배포에는 없다(undefined) — 배포본은 버튼을 숨기고 DEV는 설계서 조건으로 대신 판정한다(`canWithdrawOf`).
   */
  canWithdraw?: boolean
}

/** `GET /creator/threads/{threadId}/adjustment` — 고정 카드 + 제안 목록 + 내 권한(뷰어 기준) */
export interface AdjustmentView {
  adjustmentId: number
  threadId: number
  status: AdjustmentStatus
  statusLabel: string
  turn: AdjustmentTurn
  turnLabel: string
  turnTone: AdjustmentTone
  settlement: { settlementId: number; settlementNumber: string }
  groupBuy: { groupBuyId: number; groupBuyNumber: string; title: string }
  counterpart: { type: SettlementParty; name: string }
  /** 처음 요청한 쪽 */
  requesterType: SettlementParty
  originalRewardAmount: number
  /** 조정 상한 — 「조정 후 브랜드 수취액 ≥ 0」 */
  maxRewardAmount: number
  latestProposal: AdjustmentProposal
  agreedRewardAmount: number | null
  finalRewardAmount: number | null
  /** 개설 시각 — 이벤트 시각(UTC 벽시계) */
  openedAt: string
  /** 합의 기한 — 개설 + N영업일 23:59:59(KST 벽시계) */
  deadlineAt: string
  /** D-N — 종결 뒤 null */
  remainingBusinessDays: number | null
  /** 종결 시각 — 이벤트 시각(UTC 벽시계) */
  closedAt: string | null
  permissions: AdjustmentPermissions
  /** seq 오름차순 전량 */
  proposals: Array<AdjustmentProposal>
}

/** 다른 금액 제안 — 사유는 선택 */
export interface AdjustmentCounterBody {
  rewardAmount: number
  reason?: string
}

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

/**
 * 개발 서버에 철회 API가 아직 없다(라우트 404 — 협의가 없을 때의 `SETTLEMENT_ADJUSTMENT_NOT_FOUND`와 다르다).
 * DEV에서만 목업으로 넘긴다.
 */
function isWithdrawRouteMissing(error: unknown) {
  return (
    axios.isAxiosError<{ code?: string }>(error) &&
    error.response?.status === 404 &&
    error.response.data?.code !== "SETTLEMENT_ADJUSTMENT_NOT_FOUND"
  )
}

/**
 * 정산 조정 협의(44 이슈 스레드 설계서 3-1) — 스레드 화면 쪽 5개.
 * 요청 · 미리보기는 정산 관리(`settlementService`)가 쓴다.
 * 응답 · 철회 모두 갱신된 고정 카드 · 제안 목록 전체를 돌려준다.
 */
export const adjustmentService = {
  getByThread: async (threadId: number) => {
    const { data } = await apiInstance.get<AdjustmentView>(
      `/creator/threads/${threadId}/adjustment`
    )
    if (import.meta.env.DEV) {
      const mock =
        await import("@/features/connections/services/adjustmentDevMock")
      return mock.overlayAdjustment(data)
    }
    return data
  },

  counter: async (adjustmentId: number, body: AdjustmentCounterBody) => {
    const { data } = await apiInstance.post<AdjustmentView>(
      `/creator/settlement-adjustments/${adjustmentId}/proposals`,
      body
    )
    return data
  },

  accept: async (adjustmentId: number, proposalId: number) => {
    const { data } = await apiInstance.post<AdjustmentView>(
      `/creator/settlement-adjustments/${adjustmentId}/proposals/${proposalId}/accept`
    )
    return data
  },

  reject: async (adjustmentId: number, proposalId: number) => {
    const { data } = await apiInstance.post<AdjustmentView>(
      `/creator/settlement-adjustments/${adjustmentId}/proposals/${proposalId}/reject`
    )
    return data
  },

  /**
   * 요청 철회(1021 기-14) — 입력 없음. 원래 금액 확정 · 보류 해제 · 종결(`status = WITHDRAWN`).
   * 배포본은 실패하면 인터셉터가 서버 문구를 띄운다. DEV는 라우트가 없을 때(404)만 목업으로 성공을 흉내 내고,
   * 그 밖의 실패는 여기서 같은 문구를 띄운다(목업 판정 전에 토스트가 먼저 뜨지 않도록 인터셉터 토스트를 끈다).
   */
  withdraw: async (view: AdjustmentView) => {
    try {
      const { data } = await apiInstance.post<AdjustmentView>(
        `/creator/settlement-adjustments/${view.adjustmentId}/withdraw`,
        undefined,
        { suppressErrorToast: import.meta.env.DEV }
      )
      return data
    } catch (error) {
      if (import.meta.env.DEV) {
        if (isWithdrawRouteMissing(error)) {
          const mock =
            await import("@/features/connections/services/adjustmentDevMock")
          return mock.mockWithdraw(view)
        }
        toast.error(
          (axios.isAxiosError<{ message?: string }>(error) &&
            error.response?.data?.message) ||
            SERVER_ERROR_MESSAGE
        )
      }
      throw error
    }
  },
}
