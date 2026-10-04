import type {
  HistoryDotTone,
  HistoryItem,
} from "@/common/components/HistoryList/HistoryList"
import type {
  GroupBuyActorType,
  GroupBuyEventType,
  GroupBuyHistoryEntry,
} from "@/features/groupBuy/types"

/*
  이력 문구 — 서버는 이벤트 코드와 부가 문구(detail)만 내리고 문장은 FE가 짓는다.
  시안 B1~B7a의 이력 문장과 점 색을 따른다(정보=파랑 · 성공=초록 · 경고=노랑 · 거절=빨강).
*/
const EVENT_TEXT: Record<
  GroupBuyEventType,
  { label: string; tone: HistoryDotTone }
> = {
  CREATED: { label: "공구 생성 · 계약 조건 상속", tone: "muted" },
  STOCK_CONFIRMED: { label: "브랜드 준비 물량 확보 확인", tone: "success" },
  POST_SUBMITTED: {
    label: "게시물 등록 · 운영자 검토 요청",
    tone: "accent",
  },
  OPEN_APPROVED: { label: "운영자 오픈 승인 · 준비완료", tone: "success" },
  OPEN_REJECTED: { label: "운영자 오픈 승인 반려", tone: "warn" },
  READY: { label: "준비 조건 충족 · 준비완료", tone: "success" },
  OPENED: { label: "공구 시작 · 게시물 노출 시작", tone: "success" },
  POST_HIDDEN: { label: "운영자 게시물 숨김", tone: "warn" },
  POST_UNHIDDEN: { label: "게시물 숨김 해제 · 노출 재개", tone: "success" },
  EXTENSION_REQUESTED: { label: "브랜드가 기간 연장 요청", tone: "accent" },
  EXTENSION_ACCEPTED: { label: "연장 수락 · 종료일 변경", tone: "success" },
  EXTENSION_REJECTED: { label: "연장 거절", tone: "danger" },
  EXTENSION_EXPIRED: { label: "연장 요청 기간 만료 자동 거절", tone: "danger" },
  EARLY_CLOSE_REQUESTED: { label: "브랜드 조기 마감 요청", tone: "accent" },
  EARLY_CLOSE_REJECTED: {
    label: "조기 마감 요청 반려 · 결과 알림 수신",
    tone: "danger",
  },
  EARLY_CLOSED: {
    label: "조기 마감 승인 · 공구 종료 · 게시물 노출 종료",
    tone: "accent",
  },
  SUSPENSION_REQUESTED: { label: "공구 중단 요청", tone: "accent" },
  SUSPENSION_REJECTED: {
    label: "중단 요청 반려 · 결과 알림 수신",
    tone: "danger",
  },
  SUSPENDED: {
    label: "운영자 중단 승인 · 공구 중단 · 게시물 내려감",
    tone: "warn",
  },
  SUSPENSION_NOTICED: { label: "운영자 직권 중단 사전 통지", tone: "warn" },
  APPEAL_SUBMITTED: { label: "소명 자료 제출", tone: "accent" },
  SUSPENSION_WITHDRAWN: { label: "직권 중단 철회", tone: "success" },
  SUSPENDED_BY_ADMIN: {
    label: "운영자 직권 중단 · 공구 중단 · 게시물 내려감",
    tone: "warn",
  },
  SUSPENDED_EMERGENCY: {
    label: "운영자 긴급 직권 중단 · 공구 중단 · 게시물 내려감",
    tone: "warn",
  },
  ENDED: { label: "공구 종료 · 게시물 노출 종료", tone: "accent" },
  ISSUE_OPENED: { label: "이슈 스레드 개설", tone: "warn" },
  FULFILLMENT_CONFIRMED: { label: "계약 이행 확인 — 이행", tone: "success" },
  FULFILLMENT_DISPUTED: {
    label: "계약 이행 확인 — 미이행 · 정산 보류",
    tone: "danger",
  },
  FULFILLMENT_AUTO_CONFIRMED: {
    label: "계약 이행 확인 — 무응답 자동 이행",
    tone: "success",
  },
  FULFILLMENT_AGREED: { label: "이행 이슈 합의 종결", tone: "success" },
  FULFILLMENT_RESOLVED: { label: "정산 보류 해제", tone: "success" },
  SALES_FINALIZED: { label: "전 주문 종결 · 실적 확정", tone: "accent" },
  SETTLED: { label: "정산 완료 · 리워드 지급", tone: "success" },
}

/** 운영자·시스템은 이름 스냅샷이 없다 — 호칭은 FE가 고른다 */
function actorName(entry: GroupBuyHistoryEntry): string {
  const fallback: Record<GroupBuyActorType, string> = {
    SELLER: "브랜드",
    CREATOR: "인플루언서",
    ADMIN: "운영자",
    SYSTEM: "시스템",
  }
  if (entry.actorType === "ADMIN" || entry.actorType === "SYSTEM") {
    return fallback[entry.actorType]
  }
  return entry.actorDisplayName ?? fallback[entry.actorType]
}

/** 서버 이력(최신순) → 공용 HistoryList 항목 */
export function toGroupBuyHistoryItems(
  history: Array<GroupBuyHistoryEntry>
): Array<HistoryItem> {
  return history.map(entry => {
    const text = EVENT_TEXT[entry.eventType] ?? {
      label: entry.eventType,
      tone: "muted" as const,
    }
    return {
      label: entry.detail ? `${text.label} · ${entry.detail}` : text.label,
      processedAt: entry.occurredAt,
      tone: text.tone,
      processorName: actorName(entry),
    }
  })
}
