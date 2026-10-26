import { apiInstance } from "@/common/lib/apiInstance"
import type { BaseParams, PageResponse } from "@/common/types/page"

/**
 * 연결 상태 — 백엔드 ConnectionStatus와 1:1.
 *
 * 스튜디오는 **수신 측**이라 연결을 먼저 걸 수 없다 — 브랜드가 보낸 요청을
 * 수락/거절만 한다(§14-2). 그래서 검색·요청 발신 API가 아예 없다.
 */
export type ConnectionStatus =
  "REQUESTED" | "CONNECTED" | "REJECTED" | "DISCONNECTED"

/** `REQUESTED`는 대기중만, `ALL`은 처리 이력까지 함께 내려준다 */
export type ConnectionRequestStatusFilter = "REQUESTED" | "ALL"

/** 받은 연결 요청 한 건 (시안 S12의 `.req-card` / 좌측 목록 항목) */
export interface ConnectionRequestItem {
  connectionId: number
  marketId: number
  marketName: string
  marketImageUrl: string | null
  status: ConnectionStatus
  requestedAt: string
  /**
   * 지금 수락할 수 있는 요청인가 — false 면 [수락] 비활성 + 「현재 수락할 수 없는 요청」(요청 브랜드 정지 · 시안 13 R ·
   * 1017 설계서 8-6). 상대의 정지 사실은 내리지 않는다 · [거절]은 그대로. 옛 배포 응답에는 없다(없으면 수락 가능으로 본다)
   */
  acceptable?: boolean
}

export const connectionService = {
  getRequests: async (
    params: BaseParams & {
      status: ConnectionRequestStatusFilter
      keyword?: string
    }
  ) => {
    const { data } = await apiInstance.get<PageResponse<ConnectionRequestItem>>(
      "/creator/connections/requests",
      { params }
    )
    return data
  },

  /** 수락 시 연결됨으로 전이하고 스레드가 열린다(§14-4) */
  accept: async (connectionId: number) => {
    await apiInstance.post(`/creator/connections/${connectionId}/accept`)
  },

  /** 거절 사유는 받지 않는다 — 서버에도 해당 필드가 없다 */
  reject: async (connectionId: number) => {
    await apiInstance.post(`/creator/connections/${connectionId}/reject`)
  },
}
