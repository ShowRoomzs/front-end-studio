import type { HistoryDotTone } from "@/common/components/HistoryList/HistoryList"
import type {
  ContractActorType,
  ContractEventType,
  CreatorDeadlineDisplayType,
  CreatorFixedFeePaymentState,
} from "@/features/contracts/types"

/** 스튜디오 호칭 — 운영자는 「운영자」(익명). 인플루언서가 보는 화면에 사내 용어를 쓰지 않는다(§25-10) */
export const ACTOR_LABEL: Record<ContractActorType, string> = {
  SELLER: "브랜드",
  CREATOR: "나",
  ADMIN: "운영자",
  SYSTEM: "시스템",
}

/** 이력 문구 — 시안 S3~S9 `.htxt`. 서버는 화이트리스트만 내리지만 모르는 값도 코드로 보인다 */
export const EVENT_LABEL: Record<ContractEventType, string> = {
  CREATED: "연결 성립",
  REVIEW_REQUESTED: "검토 요청",
  REVIEW_REQUEST_CANCELED: "검토 요청 취소",
  REVIEW_APPROVED: "운영자 검토 통과",
  REVIEW_REJECTED: "운영자 검토 반려",
  SIGNATURE_SENT: "서명 요청 도착 · 운영자 검토 통과",
  BRAND_SIGNED: "브랜드 서명 완료",
  CREATOR_SIGNED: "내 서명 완료",
  SIGNATURE_UPDATED: "서명 현황 갱신 · 운영자 확인",
  BOTH_SIGNED_CONFIRMED: "양측 서명 완료 확인",
  RESEND_REQUESTED: "서명 안내 재발송 요청 · 소통 스레드 자동 등록",
  RESEND_HANDLED: "서명 안내 재발송 · 스레드 답글",
  CONTRACT_PDF_GENERATED: "계약서 생성본 발급",
  DOCUMENT_UPLOADED: "체결 문서 등록",
  DOCUMENT_DELETED: "체결 문서 삭제",
  CONCLUDED: "체결완료 · PDF·인증서 발급",
  DECLINED: "내가 거절",
  EXPIRED: "서명 기한 경과 · 만료 처리",
  CANCELED: "계약 취소",
  FIXED_FEE_PAID: "고정 지급비 지급 완료 기록 · 브랜드",
  GROUP_BUY_CREATED: "공구 생성",
}

export const HISTORY_TONE: Partial<Record<ContractEventType, HistoryDotTone>> =
  {
    SIGNATURE_SENT: "accent",
    SIGNATURE_UPDATED: "accent",
    RESEND_REQUESTED: "accent",
    RESEND_HANDLED: "accent",
    GROUP_BUY_CREATED: "accent",
    BRAND_SIGNED: "success",
    CREATOR_SIGNED: "success",
    BOTH_SIGNED_CONFIRMED: "success",
    CONCLUDED: "success",
    FIXED_FEE_PAID: "success",
    DECLINED: "danger",
  }

/** 「내 서명 기한」 열 — 서버는 표시 종류만 내리고 문구는 여기서 고른다(§27 설계서 2-2) */
export const DEADLINE_TEXT: Record<
  Exclude<CreatorDeadlineDisplayType, "DEADLINE">,
  string
> = {
  MY_SIGNED: "내 서명 완료",
  BOTH_SIGNED: "양측 서명 완료",
  SIGNED: "서명 완료",
  PASSED: "기한 경과",
  NONE: "—",
}

/** 고정 지급비 지급 상태 — 「체결완료 = 지급 전」을 못박는 문구(§27-5) */
export const PAYMENT_STATE_TEXT: Record<CreatorFixedFeePaymentState, string> = {
  NOT_YET: "지급 전",
  RECORDED_BY_BRAND: "브랜드가 지급 완료로 기록",
  NONE: "지급 없음",
}
