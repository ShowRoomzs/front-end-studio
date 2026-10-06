/*
  공구 관리(쇼룸 스튜디오) — 서버 `/v1/creator/group-buys` 응답을 그대로 옮긴 타입.
  근거: back-end `api/creator/groupbuy/dto/*` · `domain/groupbuy/type/*`.

  파트너 응답과 DTO를 공유하지 않는다(서버 설계) — 최소 물량·비고·소명·상대 메모가 빠져 있다.
  버튼 노출은 서버 permissions가 판정하고 FE는 조건을 복제하지 않는다.
*/

export type GroupBuyTone = "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER"

export type GroupBuyStatus =
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "SUSPENSION_SCHEDULED"
  | "ENDED"
  | "SETTLED"
  | "SUSPENDED"

export type GroupBuyPostStatus =
  | "NOT_WRITTEN"
  | "WRITING"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "SCHEDULED"
  | "EXPOSED"
  | "HIDDEN"
  | "CLOSED"

/** 시안 A1 5탭 — 종료·정산(ENDED)에 정산완료·중단이 함께 든다(서버도 같은 5탭) */
export type CreatorGroupBuyTab =
  "ALL" | "PREPARING" | "READY" | "IN_PROGRESS" | "ENDED"

export type CreatorGroupBuySortType = "START_AT_ASC" | "ACTION_REQUIRED_FIRST"

export type GroupBuyActorType = "SELLER" | "CREATOR" | "ADMIN" | "SYSTEM"

export type GroupBuyCloseType = "COMPLETED" | "EARLY_CLOSED" | "SUSPENDED"

export type FulfillmentResult = "FULFILLED" | "UNFULFILLED"

export type ExtensionRejectReason =
  | "NEXT_SCHEDULE_BOOKED"
  | "CONTENT_PLAN_MISMATCH"
  | "TERMS_RENEGOTIATION"
  | "ETC"

export type CreatorSuspensionReason =
  | "PRODUCT_DEFECT"
  | "DELIVERY_FAILURE"
  | "CONSUMER_COMPLAINTS"
  | "BRAND_UNREACHABLE"
  | "PERSONAL_REASON"
  | "ETC"

export type GroupBuyEventType =
  | "CREATED"
  | "STOCK_CONFIRMED"
  | "POST_SUBMITTED"
  | "OPEN_APPROVED"
  | "OPEN_REJECTED"
  | "READY"
  | "OPENED"
  | "POST_HIDDEN"
  | "POST_UNHIDDEN"
  | "EXTENSION_REQUESTED"
  | "EXTENSION_ACCEPTED"
  | "EXTENSION_REJECTED"
  | "EXTENSION_EXPIRED"
  | "EARLY_CLOSE_REQUESTED"
  | "EARLY_CLOSE_REJECTED"
  | "EARLY_CLOSED"
  | "SUSPENSION_REQUESTED"
  | "SUSPENSION_REJECTED"
  | "SUSPENDED"
  | "SUSPENSION_NOTICED"
  | "APPEAL_SUBMITTED"
  | "SUSPENSION_WITHDRAWN"
  | "SUSPENDED_BY_ADMIN"
  | "SUSPENDED_EMERGENCY"
  | "ENDED"
  | "ISSUE_OPENED"
  | "FULFILLMENT_CONFIRMED"
  | "FULFILLMENT_DISPUTED"
  | "FULFILLMENT_AUTO_CONFIRMED"
  | "FULFILLMENT_AGREED"
  | "FULFILLMENT_RESOLVED"
  | "SALES_FINALIZED"
  | "SETTLED"

// ── 목록 ──────────────────────────────────────────────

export interface CreatorGroupBuyListParams {
  tab: CreatorGroupBuyTab
  keyword: string
  sort: CreatorGroupBuySortType
  page: number
  size: number
}

export interface CreatorGroupBuyListItem {
  groupBuyId: number
  groupBuyNumber: string
  title: string
  brandName: string
  itemCount: number
  startAt: string
  endAt: string
  postStatus: GroupBuyPostStatus
  postStatusLabel: string
  postStatusTone: GroupBuyTone
  status: GroupBuyStatus
  statusLabel: string
  statusTone: GroupBuyTone
  actionRequired: boolean
}

export interface CreatorGroupBuySummaryResponse {
  tabCounts: Record<CreatorGroupBuyTab, number>
  actionRequiredCount: number
}

// ── 상세 ──────────────────────────────────────────────

export type GateKey = "STOCK_CONFIRMED" | "POST_SUBMITTED" | "OPEN_APPROVED"
export type GateState = "DONE" | "MY_TURN" | "WAITING" | "IN_REVIEW"

export interface FulfillmentCheck {
  result: FulfillmentResult
  reason: string | null
  checkedAt: string
  auto: boolean
}

export type FulfillmentDuty =
  | "ORDER_DELIVERY"
  | "FIXED_FEE_PAYMENT"
  | "SHOWROOM_POST"
  | "FEED"
  | "REELS"
  | "STORY"

export interface FulfillmentTarget {
  party: "BRAND" | "CREATOR"
  duties: Array<FulfillmentDuty>
  counts: { feed: number; reels: number; story: number } | null
}

export interface GroupBuyHistoryEntry {
  eventType: GroupBuyEventType
  actorType: GroupBuyActorType
  actorDisplayName: string | null
  detail: string | null
  occurredAt: string
}

export interface CreatorGroupBuyDetailResponse {
  groupBuy: {
    groupBuyId: number
    groupBuyNumber: string
    title: string
    status: GroupBuyStatus
    statusLabel: string
    statusTone: GroupBuyTone
    createdAt: string
    readyAt: string | null
    openedAt: string | null
    endedAt: string | null
    closeType: GroupBuyCloseType | null
    closeTypeLabel: string | null
    settledAt: string | null
  }
  timeline: {
    startAt: string
    endAt: string
    originalEndAt: string
    totalDays: number
    elapsedDays: number
    daysUntilStart: number | null
    daysUntilEnd: number | null
    startOverdue: boolean
  }
  brand: { marketId: number; name: string; pairThreadId: number | null }
  contract: {
    contractId: number
    contractNumber: string
    concludedAt: string
    contentDueDate: string | null
  }
  items: Array<{
    productId: number | null
    productName: string
    groupBuyPrice: number | null
    myRewardRate: number | null
    unitReward: number | null
    /** 옵션별 판매가(공구가 + 옵션가) — 최소 물량은 브랜드 소관이라 오지 않는다 */
    options: Array<{
      variantId: number | null
      variantName: string | null
      salePrice: number | null
    }>
  }>
  fixedFee: {
    amount: number | null
    trigger: string | null
    triggerLabel: string | null
    displayText: string | null
  }
  payout: {
    fixedFeeAmount: number | null
    salesReward: { amount: number; basis: string } | null
    platformGuaranteed: boolean
    disputeChannel: { threadId: number | null } | null
  } | null
  readiness: {
    gates: Array<{
      key: GateKey
      actorType: GroupBuyActorType
      state: GateState
      tone: GroupBuyTone
      doneAt: string | null
    }>
    registrationDeadline: string | null
    registrationOverdue: boolean
    reviewSlaBusinessDays: number
  } | null
  post: {
    status: GroupBuyPostStatus
    statusLabel: string
    statusTone: GroupBuyTone
    title: string | null
    content: string | null
    disclosureText: string | null
    sellerInfoAutoAttached: boolean
    submittedAt: string | null
    expectedReviewDate: string | null
    reviewedAt: string | null
    openedAt: string | null
    closedAt: string | null
    lastEditedAt: string | null
    rejection: {
      code: string
      detail: string | null
      rejectedAt: string | null
    } | null
    hidden: {
      code: string
      detail: string | null
      hiddenAt: string
      hiddenDays: number
    } | null
  }
  sales: {
    basis: "LIVE" | "PROVISIONAL" | "SETTLED" | "AT_SUSPENSION"
    orderCount: number
    /** 종결 중 구매확정 — B8 「구매확정 308건」. 판매 모듈이 모르면 null */
    purchaseConfirmedCount: number | null
    /** 종결 중 환불(결제 후 취소) — B8 「환불 4건 반영」. 판매 모듈이 모르면 null */
    refundedCount: number | null
    itemQuantities: Array<{ productId: number; quantity: number }>
    amount: number
    myReward: number
    ordersSinceHidden: number | null
  } | null
  orderClosure: {
    totalCount: number
    closedCount: number
    unclosed: {
      total: number
      awaitingShipment: number | null
      inReturnOrExchange: number | null
    }
  } | null
  extension: {
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"
    days: number
    reason: string | null
    beforeEndAt: string
    afterEndAt: string
    beforeTotalDays: number
    afterTotalDays: number
    requestedAt: string
    respondDeadlineAt: string | null
    respondedAt: string | null
    responseActorType: GroupBuyActorType | null
    rejectReasonCode: string | null
    rejectReasonLabel: string | null
    rejectMemo: string | null
  } | null
  activeRequest: {
    type: "SUSPEND" | "EARLY_CLOSE"
    requesterType: GroupBuyActorType
    mine: boolean
    reasonCode: string
    reasonLabel: string | null
    memo: string | null
    requestedAt: string
  } | null
  adminSuspension: {
    kind: "NOTICE" | "EMERGENCY"
    reasonClause: string | null
    noticeBody: string
    noticedAt: string
    executeScheduledAt: string | null
    businessDaysUntilExecution: number | null
  } | null
  closure: {
    closeType: GroupBuyCloseType
    endedAt: string
    source: "REQUEST" | "ADMIN_NOTICE" | "ADMIN_EMERGENCY" | null
    requester: {
      type: GroupBuyActorType
      mine: boolean
      name: string
      reasonCode: string
      reasonLabel: string | null
      requestedAt: string
    } | null
    decisionReason: string | null
    decidedAt: string | null
    adminBasis: {
      kind: "NOTICE" | "EMERGENCY"
      reasonClause: string | null
      emergencyReason: string | null
      body: string | null
    } | null
  } | null
  settlement: {
    settledAt: string | null
    fixedFeeAmount: number | null
    confirmedReward: number | null
    totalBeforeDeduction: number | null
  } | null
  afterEnd: {
    fulfillment: {
      mine: FulfillmentCheck | null
      theirs: FulfillmentCheck | null
      myTarget: FulfillmentTarget
      theirTarget: FulfillmentTarget
      dueAt: string | null
      autoConfirmOnTimeout: boolean
      onHold: boolean
      threadId: number | null
      resolvedAt: string | null
    } | null
  } | null
  permissions: {
    canWritePost: boolean
    canEditPost: boolean
    canRespondExtension: boolean
    canRequestSuspension: boolean
    canCheckFulfillment: boolean
    canOpenPairThread: boolean
  }
  history: Array<GroupBuyHistoryEntry>
  navigation: {
    prevGroupBuyId: number | null
    nextGroupBuyId: number | null
  } | null
}

export interface DetailNavParams {
  tab?: string
  keyword?: string
  sort?: string
}

// ── 실행 요청 ─────────────────────────────────────────

export interface PostBody {
  title: string
  content: string
}

export interface ExtensionRejectBody {
  reasonCode?: ExtensionRejectReason
  memo?: string
}

export interface CreatorSuspensionBody {
  reasonCode: CreatorSuspensionReason
  memo: string
}

export interface FulfillmentCheckBody {
  result: FulfillmentResult
  reason?: string
}
