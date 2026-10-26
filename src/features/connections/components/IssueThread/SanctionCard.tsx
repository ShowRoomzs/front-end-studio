import {
  POST_FIX_REASONS,
  SETTLEMENT_MISMATCH_REASON,
  SUSPENSION_APPEAL_RULE,
  SUSPENSION_CARD_BLOCKED,
  SUSPENSION_CARD_CONTINUED,
  SUSPENSION_CARD_WITHDRAWAL,
  SUSPENSION_CARD_WITHDRAWAL_NOTE,
  SUSPENSION_PAYOUT_HELD_TEXT,
  SUSPENSION_PAYOUT_KEPT_TEXT,
} from "@/common/constants/suspension"
import {
  ResCard,
  ResRow,
  Sub,
} from "@/features/connections/components/IssueThread/cardParts"
import type {
  MessageCard,
  MessageItem,
} from "@/features/connections/services/threadService"
import {
  formatDateTime,
  formatDeadline,
  formatDeadlineTime,
} from "@/features/connections/utils/format"
import { HOME_PATHS } from "@/features/home/constants/params"
import { useAccountStatus } from "@/features/home/hooks/useAccountStatus"
import { useNavigate } from "react-router-dom"

const FLINK_CLASS =
  "cursor-pointer text-[11px] font-medium text-sz-accent-600 hover:underline"

/** 사유별 바로가기(1017 설계서 8-9) — 정산 정보 불일치 → 정산 계좌 · 게시물 표현 사유 → 공구 게시물 */
function shortcutOf(reasonCode: string | undefined) {
  if (reasonCode === SETTLEMENT_MISMATCH_REASON) {
    return { label: "정산 계좌 확인", path: HOME_PATHS.basicInfo("settlement") }
  }
  if (reasonCode && POST_FIX_REASONS.includes(reasonCode)) {
    return { label: "게시물 수정하기", path: "/group-buy" }
  }
  return null
}

/**
 * 운영팀 채널의 「계정 이용 정지」 · 「정지 해제」 시스템 카드(시안 13 S8 · 파트너센터 15 S7과 같은 구조).
 *
 * 사유 · 정지 기간 · 이의 신청 기한 · 상세 사유는 카드 스냅샷(`detail.sanction`)에서 읽고, 차단 · 계속 이용 목록은
 * 인플루언서 고정 문구다(서버가 `memberType`만 준다). 소명은 별도 폼 없이 이 카드 아래 일반 답글로 한다 —
 * 입력창은 정지 중에도 그대로다. 1017 이전 카드는 `sanction`이 없어 사유 한 줄로 그린다.
 *
 * 시각: 처리 시각은 now() 이벤트(UTC 벽시계), 자동 해제 · 이의 신청 기한은 KST 벽시계다.
 */
export default function SanctionCard(props: {
  message: MessageItem
  card: MessageCard
}) {
  const { message, card } = props
  const navigate = useNavigate()
  const { sanction: current } = useAccountStatus()
  const detail = card.detail
  const sanction = detail?.sanction
  const processedAt = detail?.processedAt ?? message.createdAt
  const reasonLabel = sanction?.reasonLabel ?? detail?.reasonLabel
  const head = `시스템 · ${formatDateTime(processedAt)}`

  if (card.cardType === "ACCOUNT_SUSPENSION_RELEASED") {
    return (
      <ResCard badge={card.title} badgeVariant="success" head={head}>
        {reasonLabel && <ResRow label="사유">{reasonLabel}</ResRow>}
        {sanction?.reasonDetail && (
          <ResRow label="상세 사유">{sanction.reasonDetail}</ResRow>
        )}
      </ResCard>
    )
  }

  // 지금 열린 정지의 카드에만 소명 안내 · 바로가기를 붙인다 — 해제된 옛 카드는 기록으로만 남는다
  const isOpen =
    current != null &&
    (current.suspendCardMessageId == null ||
      current.suspendCardMessageId === message.messageId)
  const shortcut = shortcutOf(sanction?.reasonCode)

  return (
    <ResCard
      badge={card.title}
      badgeVariant="danger"
      head={head}
      footerSpread
      footer={
        isOpen ? (
          <>
            <span className="text-[11px] text-sz-n-500">
              이 카드 아래에 답글로 소명해 주세요
            </span>
            {shortcut && (
              <button
                type="button"
                className={FLINK_CLASS}
                onClick={() => navigate(shortcut.path)}
              >
                {shortcut.label}
              </button>
            )}
          </>
        ) : undefined
      }
    >
      {reasonLabel && <ResRow label="사유">{reasonLabel}</ResRow>}
      {sanction?.autoReleaseAt && (
        <ResRow label="정지 기간">
          <span className="tabular-nums">
            {formatDateTime(processedAt)} ~{" "}
            {formatDeadlineTime(sanction.autoReleaseAt)}
            {sanction.periodDays != null && ` (${sanction.periodDays}일)`}
          </span>
          <Sub>
            기간이 끝나면 <b className="font-semibold">자동 해제</b>됩니다 ·
            소명이 받아들여지면 그 전에 해제됩니다
          </Sub>
        </ResRow>
      )}
      {sanction?.appealDeadlineAt && (
        <ResRow label="이의 신청 기한">
          <span className="tabular-nums">
            {formatDeadline(sanction.appealDeadlineAt)}까지
          </span>
          <Sub>
            통지 후 <b className="font-semibold">{SUSPENSION_APPEAL_RULE}</b> ·
            이 카드 아래 답글로 신청
          </Sub>
        </ResRow>
      )}
      {sanction?.reasonDetail && (
        <ResRow label="상세 사유">{sanction.reasonDetail}</ResRow>
      )}
      {sanction && (
        <>
          <ResRow label="차단">{SUSPENSION_CARD_BLOCKED}</ResRow>
          <ResRow label="계속 이용">
            {SUSPENSION_CARD_CONTINUED}
            <b className="font-semibold">{SUSPENSION_CARD_WITHDRAWAL}</b>
            <Sub>{SUSPENSION_CARD_WITHDRAWAL_NOTE}</Sub>
          </ResRow>
          {sanction.payoutHeld !== undefined && (
            <ResRow label="정산">
              {sanction.payoutHeld
                ? SUSPENSION_PAYOUT_HELD_TEXT
                : SUSPENSION_PAYOUT_KEPT_TEXT}
            </ResRow>
          )}
        </>
      )}
    </ResCard>
  )
}
