import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageResponse } from "@/common/types/page"

/** 발신자 구분 — 백엔드 ParticipantType과 1:1 */
export type ParticipantType = "SELLER" | "CREATOR" | "ADMIN"

/** 첨부 종류 — 압축 파일은 서버가 DOCUMENT로 분류해 내려준다 */
export type AttachmentType = "IMAGE" | "VIDEO" | "DOCUMENT"

/**
 * 첨부 업로드 상태.
 *
 * 메시지 조회 응답에는 사실상 `UPLOADED`만 온다. `REJECTED`는 서버가
 * HeadObject 검증에서 위조를 잡아낸 경우다.
 */
export type AttachmentStatus = "PENDING" | "UPLOADED" | "REJECTED"

export interface AttachmentSummary {
  attachmentId: number
  status: AttachmentStatus
  attachmentType: AttachmentType
  /**
   * CDN URL — **화면에 보여줄 때만** 쓴다(이미지 썸네일·라이트박스, 영상 재생).
   * 저장(다운로드)에는 쓰지 않는다 — `getDownloadUrls`로 매번 새로 서명받아야
   * 원본 파일명으로 저장되고 미리보기로 열리지 않는다.
   */
  fileUrl: string | null
  originalName: string
  extension: string
  sizeBytes: number
  /** 영상 재생시간 — 표시용 참고값이라 없을 수 있다 */
  durationSeconds: number | null
  sortOrder: number | null
}

/**
 * 스레드 종류 — 같은 상대의 줄이 여럿일 수 있어 이 값으로 구분한다.
 * GROUP_BUY_ISSUE · GROUP_BUY_FULFILLMENT는 폐기 이력이라 새로 생기지 않는다.
 */
export type ThreadKind =
  | "CONNECTION"
  | "SETTLEMENT_ADJUSTMENT"
  | "GROUP_BUY_ISSUE"
  | "GROUP_BUY_FULFILLMENT"

/**
 * 정산 조정 협의 상태 — 백엔드 `AdjustmentStatus`.
 * WITHDRAWN = 요청자가 상대 응답 전에 거둬 원래 금액으로 확정(1021 기-14)
 */
export type AdjustmentStatus = "OPEN" | "AGREED" | "EXPIRED" | "WITHDRAWN"

/** 뷰어 기준 차례 — 반대 뒤에는 OPEN_FLOOR(양측 모두 제안 가능). 서버가 정한다 */
export type AdjustmentTurn = "MY_TURN" | "THEIR_TURN" | "OPEN_FLOOR" | "CLOSED"

export type AdjustmentTone =
  "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "NEUTRAL"

/** 정산 조정의 당사자 — 백엔드 `SettlementParty` */
export type SettlementParty = "SELLER" | "CREATOR"

/** 목록 줄의 정산 조정 표시(`ThreadAdjustmentBadge`) — kind = SETTLEMENT_ADJUSTMENT일 때만 */
export interface ThreadAdjustmentBadge {
  adjustmentId: number
  status: AdjustmentStatus
  statusLabel: string
  turn: AdjustmentTurn
  /** 「내 응답 필요」 · 「상대 응답 대기」 · 「협의 중」 · 「종결」 */
  turnLabel: string
  turnTone: AdjustmentTone
  deadlineAt: string
  /** D-N — 종결 뒤 null */
  remainingBusinessDays: number | null
  /** 최신 제안 종류 — REQUEST(seq 1) · COUNTER(seq 2 이상). 제안이 없으면 null */
  latestProposalKind?: "REQUEST" | "COUNTER" | null
  /** 목록 줄 앞말 — 「정산 조정 요청」 · 「다른 금액 제안」(카드 제목과 같다) */
  latestProposalKindLabel?: string | null
}

export interface ThreadListItem {
  threadId: number
  /** 운영자 채널이면 "SHOWROOMZ 운영팀", 아니면 상대 브랜드명 */
  counterpartName: string
  counterpartImageUrl: string | null
  /** 운영자 고정 채널 — 서버가 이미 최상단으로 정렬해 내려준다(§14-6) */
  operatorChannel: boolean
  /**
   * [계약 확인] 버튼 게이트(§14-2).
   *
   * 파트너센터는 `connectionStatus`로 버튼을 **비활성**시키지만, 스튜디오는
   * 계약을 확인하는 쪽이라 없으면 볼 것이 없어 **버튼 자체를 숨긴다**.
   * 계약 도메인이 아직 없어 서버가 항상 false로 내려준다.
   */
  hasContract: boolean
  lastMessagePreview: string | null
  lastMessageAt: string | null
  unreadCount: number
  kind: ThreadKind
  /** 공구 3자 스레드(이슈)의 공구 — CONNECTION이면 null */
  groupBuyId: number | null
  groupBuyTitle: string | null
  adjustment: ThreadAdjustmentBadge | null
}

export interface ThreadSummaryResponse {
  unreadCount: number
  /** "요청함" 탭 배지 — 0건이면 배지를 숨긴다(§14-3) */
  pendingRequestCount: number
}

/** 시스템 카드 종류 — 백엔드 `MessageCardType`. 이 화면이 따로 그리는 것은 정산 조정 9종이고 나머지는 한 줄 띠다 */
export type MessageCardType =
  | "CONTRACT_RESEND_REQUEST"
  | "CONTRACT_ADMIN_CANCELED"
  | "SETTLEMENT_ADJUSTMENT_OPENED"
  | "SETTLEMENT_ADJUSTMENT_REQUEST"
  | "SETTLEMENT_ADJUSTMENT_COUNTER"
  | "SETTLEMENT_ADJUSTMENT_ACCEPTED"
  | "SETTLEMENT_ADJUSTMENT_REJECTED"
  | "SETTLEMENT_ADJUSTMENT_DEADLINE_NOTICE"
  | "SETTLEMENT_ADJUSTMENT_AGREED"
  | "SETTLEMENT_ADJUSTMENT_EXPIRED"
  | "SETTLEMENT_ADJUSTMENT_WITHDRAWN"
  | "CONTRACT_CLOSE_CONSENT_REQUEST"
  | "CONTRACT_TERMINATED"
  | "GROUP_BUY_SUSPENSION_NOTICE"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_SUSPENSION_RELEASED"

/** 정산 조정 카드의 사실(생성 시점 스냅샷) — 카드 종류마다 채워지는 칸이 다르다(빈 칸은 응답에서 빠진다) */
export interface MessageCardAdjustment {
  settlementId?: number
  settlementNumber?: string
  groupBuyId?: number
  adjustmentId?: number
  proposalId?: number
  seq?: number
  proposerType?: SettlementParty
  proposerName?: string
  originalRewardAmount?: number
  rewardAmount?: number
  reason?: string
  deadlineAt?: string
  responderType?: SettlementParty
  responderName?: string
  respondedAt?: string
  finalRewardAmount?: number
  agreedByType?: SettlementParty
  agreedByName?: string
  closedAt?: string
}

/**
 * 계정 이용 정지 · 해제 카드의 사실(`MessageCardResponse.SanctionDetail` · 시안 13 S8) — 1017 이후 카드에만 있다.
 * 차단 · 계속 이용 목록은 `memberType`별 고정 문구라 FE가 든다. 빈 칸은 응답에서 빠진다.
 */
export interface MessageCardSanction {
  /** BRAND · CREATOR */
  memberType?: string
  /** 정지 사유 코드(정지 카드) · 해제 사유 코드(해제 카드) — `CreatorSuspensionReason` */
  reasonCode?: string
  reasonLabel?: string
  /** 상세 사유 · 해제 메모 — 운영자가 적은 경우만 */
  reasonDetail?: string
  /** [정지 카드] 지급 정지 사유인가 — 정산 줄 문구가 갈린다 */
  payoutHeld?: boolean
  /** [정지 카드] 정지 종료일(포함) · LocalDate — 기간 없는 정지 · 1021 이전 카드는 없다 */
  endsOn?: string
  /** [정지 카드] 자동 해제 시각 = 종료일 다음 날 00:00 · KST 벽시계 */
  autoReleaseAt?: string
  /** [정지 카드] 정지 기간(일) — 「(14일)」 */
  periodDays?: number
  /** [정지 카드] 이의 신청 기한 — 통지 + N영업일 23:59:59 · KST 벽시계 */
  appealDeadlineAt?: string
}

export interface MessageCardDetail {
  requesterType?: SettlementParty
  requesterName?: string
  requestedAt?: string
  /** [직권 취소] 사유 · [정지] 옛 카드의 사유 한 문장 */
  reasonLabel?: string
  /** [직권 취소 · 정지 · 해제] 처리 시각 — now() 이벤트(UTC 벽시계) */
  processedAt?: string
  notifiedBothParties?: boolean
  adjustment?: MessageCardAdjustment
  /** [계정 이용 정지 · 해제] 1017 이후 카드에만 */
  sanction?: MessageCardSanction
}

export interface MessageCardAction {
  /** RESEND_NOTICE(재발송 요청) · ADJUSTMENT_RESPOND(정산 조정 제안) */
  type: string
  /** PENDING 응답 대기 · DONE 응답됨 · CLOSED 응답 없이 닫힘(기한 만료 · 요청 철회) */
  state: "PENDING" | "DONE" | "CLOSED"
  doneAt: string | null
  /** 「동의」 · 「반대」 · 「다른 금액 제안으로 응답됨」 · 「기한 만료」 · 「요청 철회」 */
  resultLabel: string | null
  /** 뷰어가 지금 이 카드에 답할 수 있다 — 버튼 종류는 `…/threads/{id}/adjustment`의 permissions */
  respondable: boolean
}

/** 시스템 카드(`MessageCardResponse`) — 운영자 개인 정보는 담기지 않는다 */
export interface MessageCard {
  cardType: MessageCardType
  title: string
  tone: "WARNING" | "NEUTRAL"
  contractId: number | null
  contractNumber: string | null
  groupBuyTitle: string | null
  detail: MessageCardDetail | null
  action: MessageCardAction | null
}

export interface MessageItem {
  messageId: number
  senderType: ParticipantType
  mine: boolean
  /** 첨부만 보낸 메시지는 null이다(§13-11) */
  content: string | null
  attachments: Array<AttachmentSummary>
  createdAt: string
  /** TEXT 말풍선 · SYSTEM 시스템 카드 */
  messageType: "TEXT" | "SYSTEM"
  /** messageType = SYSTEM일 때만 */
  card: MessageCard | null
}

export interface MessageListResponse {
  /** 최신순 */
  content: Array<MessageItem>
  nextCursor: number | null
  hasNext: boolean
}

export interface SendMessageRequest {
  /** 멱등키 — 재전송 시 **같은 값**을 다시 보내야 중복 저장되지 않는다(§13-10) */
  clientMessageId: string
  content?: string
  /** 배열 순서가 곧 표시 순서 */
  attachmentIds?: Array<number>
}

export interface PresignRequest {
  fileName: string
  contentType: string
  sizeBytes: number
}

export interface PresignResponse {
  attachmentId: number
  uploadUrl: string
  /** PUT 요청의 Content-Type이 이 값과 다르면 S3가 서명 불일치로 거부한다 */
  requiredContentType: string
  expiresInSeconds: number
}

export interface AttachmentDownloadResponse {
  attachmentId: number
  /**
   * 다운로드 전용 presigned GET URL. `Content-Disposition: attachment`가 **서명에 포함**돼
   * 있어서 브라우저가 미리보기로 열지 않고 원본 파일명으로 저장한다.
   * 만료가 5분으로 짧으므로 받아온 즉시 써야 한다 — 캐시하거나 미리 받아두지 않는다.
   */
  downloadUrl: string
  originalName: string
  sizeBytes: number
  expiresInSeconds: number
}

export const threadService = {
  getThreads: async (params: BaseParams & { keyword?: string }) => {
    const { data } = await apiInstance.get<PageResponse<ThreadListItem>>(
      "/creator/connections/threads",
      { params }
    )
    // DEV — 철회 API 404 목업(adjustmentDevMock)이 바꾼 이슈 줄을 덧씌운다. 배포 번들에서는 빠진다
    if (import.meta.env.DEV) {
      const mock =
        await import("@/features/connections/services/adjustmentDevMock")
      return mock.overlayThreads(data)
    }
    return data
  },

  getSummary: async () => {
    const { data } = await apiInstance.get<ThreadSummaryResponse>(
      "/creator/connections/summary"
    )
    return data
  },

  getMessages: async (
    threadId: number,
    params: { cursor?: number; size?: number }
  ) => {
    const { data } = await apiInstance.get<MessageListResponse>(
      `/creator/threads/${threadId}/messages`,
      { params }
    )
    if (import.meta.env.DEV) {
      const mock =
        await import("@/features/connections/services/adjustmentDevMock")
      return mock.overlayMessages(threadId, data, params.cursor === undefined)
    }
    return data
  },

  sendMessage: async (threadId: number, request: SendMessageRequest) => {
    const { data } = await apiInstance.post<MessageItem>(
      `/creator/threads/${threadId}/messages`,
      request
    )
    return data
  },

  markRead: async (threadId: number) => {
    await apiInstance.post(`/creator/threads/${threadId}/read`)
  },

  createPresignedUpload: async (threadId: number, request: PresignRequest) => {
    const { data } = await apiInstance.post<PresignResponse>(
      `/creator/threads/${threadId}/attachments/presign`,
      request
    )
    return data
  },

  completeUpload: async (
    attachmentId: number,
    request: { durationSeconds?: number }
  ) => {
    const { data } = await apiInstance.patch<AttachmentSummary>(
      `/creator/attachments/${attachmentId}/complete`,
      request
    )
    return data
  },

  /**
   * 저장 직전에 호출한다 — 발급된 URL이 5분 뒤 만료되므로 미리 받아두면 안 된다.
   * 파일 하나든 「전체 다운로드」든 한 번에 발급한다. 응답은 요청한 ID 순서를 따른다.
   */
  getDownloadUrls: async (attachmentIds: Array<number>) => {
    const { data } = await apiInstance.post<Array<AttachmentDownloadResponse>>(
      "/creator/attachments/download",
      { attachmentIds }
    )
    return data
  },
}
