/*
  DEV 전용 — 개발 서버에 `POST …/settlement-adjustments/{id}/withdraw`가 아직 배포되지 않아 404일 때
  철회 결과를 이 탭 안에서만 흉내 낸다(03a §2). 호출부가 `import.meta.env.DEV` 뒤에서 동적 import 하므로
  배포 번들에는 들어가지 않는다. 서버에는 아무것도 바뀌지 않았으므로 새로고침하면 사라진다.

  철회는 서버가 협의 상태 · 제안 카드 결과 · 결과 카드 · 목록 줄을 한꺼번에 바꾼다 — 폴링이 서버의 옛 값으로
  되돌리지 않도록 세 응답(고정 카드 · 메시지 · 목록)에 같은 결과를 덧씌운다.
*/
import type {
  AdjustmentPermissions,
  AdjustmentView,
} from "@/features/connections/services/adjustmentService"
import type {
  MessageItem,
  MessageListResponse,
  ThreadListItem,
} from "@/features/connections/services/threadService"
import type { PageResponse } from "@/common/types/page"

interface Withdrawn {
  view: AdjustmentView
  closedAt: string
}

/** threadId → 철회 결과 */
const withdrawnByThread = new Map<number, Withdrawn>()

const CLOSED_PERMISSIONS: AdjustmentPermissions = {
  canAccept: false,
  canReject: false,
  canCounter: false,
  canSend: false,
  canWithdraw: false,
}

/** 서버 `now()` 이벤트 시각과 같은 모양 — UTC 벽시계 · 시간대 표기 없음 */
const utcWallClockNow = () => new Date().toISOString().slice(0, 19)

function toWithdrawnView(view: AdjustmentView, closedAt: string) {
  const closeProposal = (proposal: AdjustmentView["latestProposal"]) =>
    proposal.status === "PENDING"
      ? { ...proposal, status: "CLOSED" as const }
      : proposal
  return {
    ...view,
    status: "WITHDRAWN",
    statusLabel: "철회 · 원래 금액",
    turn: "CLOSED",
    turnLabel: "종결",
    turnTone: "NEUTRAL",
    finalRewardAmount: view.originalRewardAmount,
    remainingBusinessDays: null,
    closedAt,
    permissions: CLOSED_PERMISSIONS,
    latestProposal: closeProposal(view.latestProposal),
    proposals: view.proposals.map(closeProposal),
  } satisfies AdjustmentView
}

/** 철회 성공을 흉내 낸다 — 서버 응답처럼 갱신된 고정 카드를 돌려준다 */
export function mockWithdraw(view: AdjustmentView): AdjustmentView {
  const closedAt = utcWallClockNow()
  withdrawnByThread.set(view.threadId, { view, closedAt })
  return toWithdrawnView(view, closedAt)
}

export function overlayAdjustment(view: AdjustmentView): AdjustmentView {
  const withdrawn = withdrawnByThread.get(view.threadId)
  if (!withdrawn || view.status !== "OPEN") return view
  return toWithdrawnView(view, withdrawn.closedAt)
}

/** 첫 쪽(최신순)이면 맨 앞에 결과 카드를 붙이고, 닫힌 제안 카드를 「요청 철회」로 굳힌다 */
export function overlayMessages(
  threadId: number,
  response: MessageListResponse,
  isFirstPage: boolean
): MessageListResponse {
  const withdrawn = withdrawnByThread.get(threadId)
  if (!withdrawn) return response
  const { view, closedAt } = withdrawn
  const alreadyClosed = response.content.some(
    message => message.card?.cardType === "SETTLEMENT_ADJUSTMENT_WITHDRAWN"
  )
  if (alreadyClosed) return response

  const content = response.content.map(message => {
    const action = message.card?.action
    if (!message.card || !action || action.state !== "PENDING") return message
    return {
      ...message,
      card: {
        ...message.card,
        action: {
          ...action,
          state: "CLOSED" as const,
          resultLabel: "요청 철회",
          respondable: false,
        },
      },
    }
  })

  if (!isFirstPage) return { ...response, content }

  const resultCard: MessageItem = {
    messageId: -view.adjustmentId,
    senderType: "ADMIN",
    mine: false,
    content: "요청 철회 · 원래 금액 확정 · 이슈 종결",
    attachments: [],
    createdAt: closedAt,
    messageType: "SYSTEM",
    card: {
      cardType: "SETTLEMENT_ADJUSTMENT_WITHDRAWN",
      title: "요청 철회 · 원래 금액 확정 · 이슈 종결",
      tone: "NEUTRAL",
      contractId: null,
      contractNumber: null,
      groupBuyTitle: view.groupBuy.title,
      detail: {
        adjustment: {
          settlementId: view.settlement.settlementId,
          settlementNumber: view.settlement.settlementNumber,
          groupBuyId: view.groupBuy.groupBuyId,
          adjustmentId: view.adjustmentId,
          originalRewardAmount: view.originalRewardAmount,
          deadlineAt: view.deadlineAt,
          finalRewardAmount: view.originalRewardAmount,
          agreedByType: "CREATOR",
          closedAt,
        },
      },
      action: null,
    },
  }
  return { ...response, content: [resultCard, ...content] }
}

export function overlayThreads(
  page: PageResponse<ThreadListItem>
): PageResponse<ThreadListItem> {
  if (withdrawnByThread.size === 0) return page
  return {
    ...page,
    content: page.content.map(thread => {
      if (!thread.adjustment || !withdrawnByThread.has(thread.threadId)) {
        return thread
      }
      return {
        ...thread,
        adjustment: {
          ...thread.adjustment,
          status: "WITHDRAWN",
          statusLabel: "철회 · 원래 금액",
          turn: "CLOSED",
          turnLabel: "종결",
          turnTone: "NEUTRAL",
          remainingBusinessDays: null,
        },
      }
    }),
  }
}
