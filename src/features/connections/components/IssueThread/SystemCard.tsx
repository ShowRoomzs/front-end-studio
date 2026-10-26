import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  ResCard,
  ResRow,
  Sub,
  SysBar,
} from "@/features/connections/components/IssueThread/cardParts"
import {
  canWithdrawOf,
  COUNTERPART_LABEL,
  otherParty,
  proposalNoun,
} from "@/features/connections/components/IssueThread/issueView"
import SanctionCard from "@/features/connections/components/IssueThread/SanctionCard"
import {
  ADJUSTMENT_DEADLINE_BUSINESS_DAYS,
  PARTY_LABEL,
  VIEWER_PARTY,
} from "@/features/connections/constants/params"
import type { AdjustmentView } from "@/features/connections/services/adjustmentService"
import type { MessageItem } from "@/features/connections/services/threadService"
import {
  formatDateTime,
  formatDeadline,
  formatDeadlineTime,
  formatDelta,
  formatWon,
} from "@/features/connections/utils/format"
import Btn from "@/features/contracts/components/shared/Btn"
import type { ReactNode } from "react"

/** 카드의 응답 버튼 — 어느 제안에 답하는지 함께 올린다. WITHDRAW = 내 요청 철회(기-14) */
export type AdjustmentResponse = "ACCEPT" | "COUNTER" | "REJECT" | "WITHDRAW"

/**
 * 시스템 카드 — 절차의 기록. 정산 조정 카드 8종은 시안 ui-partner-14 그대로 그리고,
 * 계약 카드(재발송 요청 · 직권 취소)는 1:1 스레드에 한 줄 띠로 남긴다.
 *
 * 응답 버튼은 **가장 최근 요청 카드에만** 있다 — 서버 `action.respondable`과 고정 카드의
 * `permissions`(동의 · 다른 금액 제안 · 반대 중 무엇이 되는지)를 함께 본다. 이전 카드는 응답 결과로 굳는다.
 */
export default function SystemCard(props: {
  message: MessageItem
  view: AdjustmentView | null
  pendingResponse: boolean
  onRespond: (response: AdjustmentResponse, proposalId: number) => void
}) {
  const { message, view, pendingResponse, onRespond } = props
  const card = message.card

  if (!card) {
    return message.content ? <SysBar>{message.content}</SysBar> : null
  }

  const adjustment = card.detail?.adjustment ?? {}
  const original =
    adjustment.originalRewardAmount ?? view?.originalRewardAmount ?? null

  switch (card.cardType) {
    case "SETTLEMENT_ADJUSTMENT_OPENED": {
      const requester = view?.requesterType ?? adjustment.proposerType
      const deadline = adjustment.deadlineAt ?? view?.deadlineAt
      return (
        <SysBar>
          <b>
            {requester && requester !== VIEWER_PARTY
              ? `${PARTY_LABEL[requester]}의 정산 조정 요청으로 이슈 스레드가 열렸습니다.`
              : "정산 조정 요청으로 이슈 스레드가 열렸습니다."}
          </b>{" "}
          이 공구 정산이 전액 보류됩니다
          {deadline && (
            <>
              {" "}
              · 합의 기한 <b>{formatDeadline(deadline)}</b>(
              {ADJUSTMENT_DEADLINE_BUSINESS_DAYS}영업일)까지 합의가 없으면{" "}
              <b>원래 금액</b>으로 확정됩니다
            </>
          )}
        </SysBar>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_REQUEST":
    case "SETTLEMENT_ADJUSTMENT_COUNTER": {
      const isCounter = card.cardType === "SETTLEMENT_ADJUSTMENT_COUNTER"
      const noun = isCounter ? "제안" : "요청"
      const proposerName =
        adjustment.proposerName ??
        (adjustment.proposerType ? PARTY_LABEL[adjustment.proposerType] : "")
      const isLatest =
        view !== null &&
        adjustment.proposalId !== undefined &&
        view.latestProposal.proposalId === adjustment.proposalId
      const canRespond =
        card.action?.respondable === true && isLatest && view !== null

      let footer: ReactNode = null
      if (canRespond && adjustment.proposalId !== undefined) {
        const proposalId = adjustment.proposalId
        const { canAccept, canCounter, canReject } = view.permissions
        footer = (
          <>
            {canReject && (
              <Btn
                variant="secondary"
                disabled={pendingResponse}
                onClick={() => onRespond("REJECT", proposalId)}
              >
                반대
              </Btn>
            )}
            {canCounter && (
              <Btn
                variant="secondary"
                disabled={pendingResponse}
                onClick={() => onRespond("COUNTER", proposalId)}
              >
                다른 금액 제안
              </Btn>
            )}
            {canAccept && (
              <Btn
                variant="primary"
                disabled={pendingResponse}
                onClick={() => onRespond("ACCEPT", proposalId)}
              >
                동의
              </Btn>
            )}
          </>
        )
      } else if (card.action?.state === "PENDING") {
        // 시안 T1(rev.3 · 기-14) — 내가 낸 최신 요청에는 [요청 철회] 하나만 있다. 노출은 서버 canWithdraw
        const withdrawable = isLatest && view !== null && canWithdrawOf(view)
        footer =
          adjustment.proposerType === VIEWER_PARTY ? (
            <>
              <span className="mr-auto text-[11px] text-sz-n-500 [&_b]:text-sz-n-700">
                {COUNTERPART_LABEL} 응답을 기다리고 있습니다
                {withdrawable && (
                  <>
                    {" "}
                    · 철회하면 <b>원래 금액으로 바로 확정</b>됩니다
                  </>
                )}
              </span>
              <StatusBadge variant="info">응답 대기</StatusBadge>
              {withdrawable && adjustment.proposalId !== undefined && (
                <Btn
                  variant="secondary"
                  className="h-7 px-2.5 text-[11px]"
                  disabled={pendingResponse}
                  onClick={() =>
                    adjustment.proposalId !== undefined &&
                    onRespond("WITHDRAW", adjustment.proposalId)
                  }
                >
                  요청 철회
                </Btn>
              )}
            </>
          ) : (
            <StatusBadge variant="info">응답 대기</StatusBadge>
          )
      } else if (card.action?.resultLabel) {
        footer = (
          <StatusBadge variant="neutral">{card.action.resultLabel}</StatusBadge>
        )
      }

      return (
        <ResCard
          badge={isCounter ? "다른 금액 제안" : "조정 요청"}
          // 스튜디오 시안은 내 카드에 「(나)」를 붙인다 — 「뷰티_소연(나) 요청」
          head={`${proposerName}${adjustment.proposerType === VIEWER_PARTY ? "(나)" : ""} ${noun} · ${formatDateTime(message.createdAt)}`}
          footer={footer}
        >
          {adjustment.rewardAmount !== undefined && (
            <ResRow label={`${noun} 금액`}>
              리워드{" "}
              <b className="tabular-nums">
                {original !== null && `${formatWon(original)} → `}
                {formatWon(adjustment.rewardAmount)}
              </b>
              {original !== null && (
                <Sub>{formatDelta(adjustment.rewardAmount - original)}</Sub>
              )}
            </ResRow>
          )}
          {adjustment.reason && (
            <ResRow label="사유">{adjustment.reason}</ResRow>
          )}
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_ACCEPTED":
    case "SETTLEMENT_ADJUSTMENT_REJECTED": {
      const isAccepted = card.cardType === "SETTLEMENT_ADJUSTMENT_ACCEPTED"
      const verb = isAccepted ? "동의" : "반대"
      const responderName =
        adjustment.responderName ??
        (adjustment.responderType ? PARTY_LABEL[adjustment.responderType] : "")
      return (
        <ResCard
          badge={verb}
          head={`${responderName}${adjustment.responderType === VIEWER_PARTY ? "(나)" : ""} ${verb} · ${formatDateTime(
            adjustment.respondedAt ?? message.createdAt
          )}`}
        >
          <ResRow label="결과">
            {isAccepted ? (
              adjustment.rewardAmount !== undefined ? (
                // 「○○ 브랜드 제안 1,591,512원에 동의」 — 동의한 제안은 상대가 낸 것이다
                <>
                  {view?.proposals.find(
                    proposal => proposal.proposalId === adjustment.proposalId
                  )?.proposerName ??
                    (adjustment.responderType
                      ? PARTY_LABEL[otherParty(adjustment.responderType)]
                      : "")}{" "}
                  {proposalNoun(adjustment.seq)}{" "}
                  <b className="tabular-nums">
                    {formatWon(adjustment.rewardAmount)}
                  </b>
                  에 동의
                </>
              ) : (
                "요청 금액에 동의"
              )
            ) : (
              "요청 금액에 반대 · 협의는 합의 기한까지 이어집니다"
            )}
          </ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_DEADLINE_NOTICE": {
      const deadline = adjustment.deadlineAt ?? view?.deadlineAt
      return (
        <ResCard badge="시스템" head="합의 기한 D-1 안내">
          <ResRow label="안내">
            {deadline ? `${formatDeadlineTime(deadline)}까지 ` : "기한까지 "}
            합의가 없으면 원래 금액으로 확정됩니다.
          </ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_AGREED": {
      const final =
        adjustment.finalRewardAmount ??
        view?.finalRewardAmount ??
        view?.agreedRewardAmount ??
        null
      const agreedBy = adjustment.agreedByType
      const accepted = view?.proposals.find(
        proposal => proposal.status === "ACCEPTED"
      )
      const closedAt = adjustment.closedAt ?? view?.closedAt ?? null
      return (
        <ResCard badge="합의 완료" head="정산 금액 변경 · 이슈 종결">
          {final !== null && (
            <ResRow label="확정 금액">
              리워드 <b className="tabular-nums">{formatWon(final)}</b>
              {original !== null && <Sub>원래 {formatWon(original)}</Sub>}
            </ResRow>
          )}
          {agreedBy && (
            <ResRow label="합의">
              {PARTY_LABEL[otherParty(agreedBy)]} {proposalNoun(accepted?.seq)}
              에 {PARTY_LABEL[agreedBy]} 동의
              {closedAt && ` · ${formatDateTime(closedAt)}`}
            </ResRow>
          )}
          <ResRow label="정산">보류 해제 · 정산 관리에 바로 반영</ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_EXPIRED": {
      const final = adjustment.finalRewardAmount ?? original
      return (
        <ResCard badge="기한 만료" head="원래 금액 확정 · 이슈 종결">
          {final !== null && (
            <ResRow label="확정 금액">
              리워드 <b className="tabular-nums">{formatWon(final)}</b>
              <Sub>원래 계약 금액</Sub>
            </ResRow>
          )}
          <ResRow label="정산">보류 해제 · 정산 관리에 바로 반영</ResRow>
        </ResCard>
      )
    }

    case "SETTLEMENT_ADJUSTMENT_WITHDRAWN": {
      // 시안에 없는 결과 카드 — 기한 만료(T4) · 합의 완료(T3) 카드의 행 구성을 따른다.
      // 철회한 쪽 · 시각은 결과 카드 스냅샷의 agreedBy* · closedAt(서버 SettlementAdjustmentCards.withdrawn)
      const final = adjustment.finalRewardAmount ?? original
      const withdrawnBy = adjustment.agreedByType
      const closedAt = adjustment.closedAt ?? view?.closedAt ?? null
      return (
        <ResCard badge="요청 철회" head="원래 금액 확정 · 이슈 종결">
          {final !== null && (
            <ResRow label="확정 금액">
              리워드 <b className="tabular-nums">{formatWon(final)}</b>
              <Sub>원래 계약 금액</Sub>
            </ResRow>
          )}
          {withdrawnBy && (
            <ResRow label="철회">
              {PARTY_LABEL[withdrawnBy]} 요청 철회
              {closedAt && ` · ${formatDateTime(closedAt)}`}
            </ResRow>
          )}
          <ResRow label="정산">보류 해제 · 정산 관리에 바로 반영</ResRow>
        </ResCard>
      )
    }

    case "ACCOUNT_SUSPENDED":
    case "ACCOUNT_SUSPENSION_RELEASED":
      // 시안 13 S8 — 운영팀 채널의 계정 이용 정지 · 해제 카드. 소명은 이 카드 아래 일반 답글이다
      return <SanctionCard message={message} card={card} />

    default:
      // 계약 카드 — 1:1 스레드의 절차 기록. 처리는 계약 관리에서 한다
      return (
        <SysBar>
          <b>{card.title}</b>
          {[card.contractNumber, card.groupBuyTitle].some(Boolean) &&
            ` · ${[card.contractNumber, card.groupBuyTitle]
              .filter(Boolean)
              .join(" ")}`}
        </SysBar>
      )
  }
}
