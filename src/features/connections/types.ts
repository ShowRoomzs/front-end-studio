import type {
  AttachmentSummary,
  AttachmentType,
} from "@/features/connections/services/threadService"

/** 전송 중인 첨부 하나 — 서버에 저장되기 전까지만 존재하는 로컬 상태 */
export interface OutgoingAttachment {
  /** 서버 attachmentId가 생기기 전에도 키가 필요하다 */
  localId: string
  file: File
  attachmentType: AttachmentType
  progress: number
  /** 업로드가 끝나 서버가 검증까지 마친 첨부. 완료 전에는 없다 */
  summary?: AttachmentSummary
}

/**
 * 아직 서버에 저장되지 않은 내 메시지.
 *
 * 전송 버튼을 누르는 즉시 스레드에 나타나고(§13-1 S7), 첨부 업로드가 끝난 뒤에야
 * 실제 전송 요청이 나간다. 실패해도 지우지 않는다 — [재전송]/[취소]를 눌러야
 * 사라진다(§13-10).
 */
export interface OutgoingMessage {
  /** 멱등키 — 재전송 시 그대로 재사용해 중복 저장을 막는다 */
  clientMessageId: string
  content: string | null
  attachments: Array<OutgoingAttachment>
  status: "sending" | "failed"
  /**
   * 실패 사유.
   *
   * 시안(§13-10)은 말풍선에 "전송 실패"만 쓰라고 하므로 화면 문구는 그대로 두고,
   * 이 값은 빨간 느낌표의 tooltip과 토스트로만 노출한다 — 원인을 전혀 남기지
   * 않으면 S3 CORS·서명 불일치 같은 실패를 사용자도 개발자도 구분할 수 없다.
   */
  error?: string
  createdAt: string
}
