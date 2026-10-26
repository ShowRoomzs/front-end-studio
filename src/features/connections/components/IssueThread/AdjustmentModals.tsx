import {
  ModalLabel,
  ModalShell,
} from "@/common/components/ModalShell/ModalShell"
import {
  COUNTERPART_LABEL,
  proposalNoun,
} from "@/features/connections/components/IssueThread/issueView"
import type {
  AdjustmentProposal,
  AdjustmentView,
} from "@/features/connections/services/adjustmentService"
import { formatDeadline, formatWon } from "@/features/connections/utils/format"
import Btn from "@/features/contracts/components/shared/Btn"
import { INPUT_CLASS } from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"

/** 원 단위 입력 — 12자리(9천억)면 정산 금액으로 충분하다 */
const MAX_DIGITS = 12
const REASON_MAX = 1000

/** 시안 `.mdl-tgt` — 무엇에 대한 결정인지 먼저 보여 주는 회색 상자 */
function Target(props: { children: ReactNode }) {
  return (
    <div className="mb-3.5 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-2.5 text-[11px] leading-[1.7] text-sz-n-600 [&_b]:text-sz-n-900">
      {props.children}
    </div>
  )
}

/** 시안 `.mdl-p` */
function Para(props: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "m-0 text-[12px] leading-[1.7] text-sz-n-700 [&_b]:text-sz-n-900",
        props.className
      )}
    >
      {props.children}
    </p>
  )
}

/** 「글로우 크림 앵콜 공구 · 원래 리워드 X」 / 「상대 요청 Y · 합의 기한 Z」 */
function DecisionTarget(props: {
  view: AdjustmentView
  proposal: AdjustmentProposal
}) {
  const { view, proposal } = props
  return (
    <Target>
      {view.groupBuy.title} · 원래 리워드{" "}
      <b>{formatWon(view.originalRewardAmount)}</b>
      <br />
      상대 {proposalNoun(proposal.seq)}{" "}
      <b>{formatWon(proposal.rewardAmount)}</b> · 합의 기한{" "}
      <b>{formatDeadline(view.deadlineAt)}</b>
    </Target>
  )
}

/**
 * 시안 C1 — 다른 금액 제안. 내면 **새 요청**이 되어 처음 요청한 쪽이 답한다.
 * 범위(리워드 0 이상 · 브랜드 수취액 이내)를 벗어나면 에러 문구 없이 버튼 비활성. 사유는 선택.
 */
export function CounterModal(props: {
  view: AdjustmentView
  proposal: AdjustmentProposal
  isPending: boolean
  onClose: () => void
  onSubmit: (rewardAmount: number, reason: string) => void
}) {
  const { view, proposal, isPending, onClose, onSubmit } = props
  const [digits, setDigits] = useState("")
  const [reason, setReason] = useState("")

  const amount = digits === "" ? null : Number(digits)
  // 지금 걸린 요청과 같은 금액이면 제안이 아니라 동의다
  const canSubmit =
    amount !== null &&
    amount >= 0 &&
    amount <= view.maxRewardAmount &&
    amount !== proposal.rewardAmount &&
    !isPending

  return (
    <ModalShell
      isOpen
      title="다른 금액을 제안할까요?"
      width={460}
      onClose={onClose}
      bodyClassName="p-[22px]"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={() => amount !== null && onSubmit(amount, reason.trim())}
          >
            다른 금액 제안
          </Btn>
        </>
      }
    >
      <DecisionTarget view={view} proposal={proposal} />
      <ModalLabel required>제안할 리워드 금액</ModalLabel>
      <input
        aria-label="제안할 리워드 금액"
        inputMode="numeric"
        autoFocus
        className={cn(INPUT_CLASS, "w-full text-right tabular-nums")}
        value={amount === null ? "" : amount.toLocaleString("ko-KR")}
        onChange={event =>
          setDigits(
            event.target.value
              .replace(/\D/g, "")
              .replace(/^0+(?=\d)/, "")
              .slice(0, MAX_DIGITS)
          )
        }
      />
      <div className="mt-[5px] text-right text-[11px] tabular-nums text-sz-n-400">
        0원 ~ {formatWon(view.maxRewardAmount)}(브랜드 수취액) 안에서 입력할 수
        있습니다
      </div>
      <div className="mt-3">
        <ModalLabel>사유</ModalLabel>
        <textarea
          aria-label="사유"
          className="min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 px-[11px] py-[9px] text-[12px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          placeholder="제안 금액의 근거를 적어주세요."
          maxLength={REASON_MAX}
          value={reason}
          onChange={event => setReason(event.target.value)}
        />
      </div>
      <Para className="mt-3">
        제안하면 <b>{COUNTERPART_LABEL}가 응답할 차례</b>가 됩니다. 합의 기한은{" "}
        <b>늘어나지 않습니다</b>.
      </Para>
    </ModalShell>
  )
}

/**
 * 시안 C2 — 동의. 되돌릴 수 없다 — 동의 순간 정산 금액 변경 + 보류 해제 + 종결이
 * 동시에 일어난다(운영자 승인 없음). 입력 없음.
 */
export function AcceptModal(props: {
  view: AdjustmentView
  proposal: AdjustmentProposal
  isPending: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const { view, proposal, isPending, onClose, onSubmit } = props
  return (
    <ModalShell
      isOpen
      title="이 금액에 동의할까요?"
      width={460}
      onClose={onClose}
      bodyClassName="p-[22px]"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={isPending}
            isLoading={isPending}
            onClick={onSubmit}
          >
            동의
          </Btn>
        </>
      }
    >
      <DecisionTarget view={view} proposal={proposal} />
      <Para>
        동의하면 <b>되돌릴 수 없습니다</b>.
        <br />· 내 리워드가{" "}
        <b>
          {formatWon(view.originalRewardAmount)} →{" "}
          {formatWon(proposal.rewardAmount)}
        </b>
        으로 바뀌고 <b>보류가 해제</b>됩니다
        <br />· 이슈가 바로 종결되며 같은 사안으로 다시 요청할 수 없습니다
      </Para>
    </ModalShell>
  )
}

/**
 * 시안 C3 — 반대. 사유는 받지 않는다(협의는 스레드 대화로). 결과를 먼저 말한다 — 요청 금액 미반영 ·
 * 보류 계속 · 협의는 기한까지 · 합의가 없으면 원래 금액 확정. 종결이 아니라 위험색 버튼을 쓰지 않는다.
 */
export function RejectModal(props: {
  view: AdjustmentView
  proposal: AdjustmentProposal
  isPending: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const { view, proposal, isPending, onClose, onSubmit } = props
  return (
    <ModalShell
      isOpen
      title={`이 ${proposalNoun(proposal.seq)}에 반대할까요?`}
      width={460}
      onClose={onClose}
      bodyClassName="p-[22px]"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={isPending}
            isLoading={isPending}
            onClick={onSubmit}
          >
            반대
          </Btn>
        </>
      }
    >
      <DecisionTarget view={view} proposal={proposal} />
      <Para>
        반대하면{" "}
        <b>
          {proposalNoun(proposal.seq)} 금액({formatWon(proposal.rewardAmount)}
          )은 반영되지 않습니다
        </b>
        .
        <br />· 이 공구 정산은 <b>보류가 계속</b>됩니다
        <br />· 협의는 <b>
          합의 기한({formatDeadline(view.deadlineAt)})까지
        </b>{" "}
        이어지며, 그 안에 상대가 다시 제안할 수 있습니다
        <br />· 기한까지 합의가 없으면{" "}
        <b>원래 금액 {formatWon(view.originalRewardAmount)}으로 확정</b>됩니다
        <br />· 반대 이유는 스레드 대화로 남겨 주세요
      </Para>
    </ModalShell>
  )
}

/**
 * 시안 C4 — 요청 철회(기-14). 요청한 쪽만 · 상대 응답 전에만 할 수 있다. 입력 없음(확인만).
 * 결과를 먼저 말한다 — 원래 금액으로 바로 확정 · 보류 해제 · 종결 · 같은 사안 재요청 불가 · 지급 예정일 재계산.
 * 내가 낸 요청을 거두는 것이라 위험색을 쓰지 않는다.
 */
export function WithdrawModal(props: {
  view: AdjustmentView
  proposal: AdjustmentProposal
  isPending: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const { view, proposal, isPending, onClose, onSubmit } = props
  return (
    <ModalShell
      isOpen
      title="조정 요청을 철회할까요?"
      width={460}
      onClose={onClose}
      bodyClassName="p-[22px]"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="primary"
            disabled={isPending}
            isLoading={isPending}
            onClick={onSubmit}
          >
            요청 철회
          </Btn>
        </>
      }
    >
      <Target>
        {view.groupBuy.title} · {view.counterpart.name}
        <br />
        원래 리워드 <b>{formatWon(view.originalRewardAmount)}</b> · 내{" "}
        {proposalNoun(proposal.seq)} <b>{formatWon(proposal.rewardAmount)}</b> ·
        합의 기한 <b>{formatDeadline(view.deadlineAt)}</b>
      </Target>
      <Para>
        철회하면{" "}
        <b>원래 금액 {formatWon(view.originalRewardAmount)}으로 바로 확정</b>
        됩니다.
        <br />· 정산 <b>보류가 해제</b>되고 이슈가 <b>종결</b>됩니다
        <br />· 같은 사안으로 <b>다시 조정을 요청할 수 없습니다</b>
        <br />· 지급 예정일은 확정일 기준으로 다시 계산됩니다
      </Para>
    </ModalShell>
  )
}
