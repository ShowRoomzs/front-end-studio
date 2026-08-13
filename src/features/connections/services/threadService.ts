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
   * 저장(다운로드)에는 쓰지 않는다 — `getDownloadUrl`로 매번 새로 서명받아야
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
}

export interface ThreadSummaryResponse {
  unreadCount: number
  /** "요청함" 탭 배지 — 0건이면 배지를 숨긴다(§14-3) */
  pendingRequestCount: number
}

export interface MessageItem {
  messageId: number
  senderType: ParticipantType
  mine: boolean
  /** 첨부만 보낸 메시지는 null이다(§13-11) */
  content: string | null
  attachments: Array<AttachmentSummary>
  createdAt: string
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

  /** 저장 직전에 호출한다 — 발급된 URL이 5분 뒤 만료되므로 미리 받아두면 안 된다 */
  getDownloadUrl: async (attachmentId: number) => {
    const { data } = await apiInstance.get<AttachmentDownloadResponse>(
      `/creator/attachments/${attachmentId}/download`
    )
    return data
  },
}
