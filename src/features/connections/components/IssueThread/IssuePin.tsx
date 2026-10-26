import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  isClosedStatus,
  pinBadge,
  proposalNoun,
} from "@/features/connections/components/IssueThread/issueView"
import {
  PARTY_LABEL,
  VIEWER_PARTY,
} from "@/features/connections/constants/params"
import type { AdjustmentView } from "@/features/connections/services/adjustmentService"
import { formatDeadline, formatWon } from "@/features/connections/utils/format"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import type { ReactNode } from "react"

/**
 * 시안 `.iss-pin` — 스크롤과 무관하게 머리 아래 고정되는 이슈 요약.
 * 공구 · 보류 금액 · 요청 금액(누구의 요청인지 — 내 것은 「내 요청」) · 합의 기한(D-N).
 * 종결되면 보류 금액이 「보류 해제」로, 요청 금액이 확정 금액(합의 · 원래 금액)으로 바뀐다(ui-studio-11).
 * 철회(WITHDRAWN)는 시안에 종결 화면이 없어 기한 만료처럼 「원래 금액」으로 적고, 기한은 합의 완료처럼 「—」로 둔다.
 */
export default function IssuePin(props: {
  view: AdjustmentView
  onOpenGroupBuy: () => void
  onOpenSettlement: () => void
}) {
  const { view, onOpenGroupBuy, onOpenSettlement } = props
  const badge = pinBadge(view)
  const isClosed = isClosedStatus(view.status)
  const latest = view.latestProposal

  let requested: ReactNode = (
    <>
      {formatWon(latest.rewardAmount)}{" "}
      <span className="text-sz-n-500">
        (
        {latest.proposerType === VIEWER_PARTY
          ? "내"
          : PARTY_LABEL[latest.proposerType]}{" "}
        {proposalNoun(latest.seq)})
      </span>
    </>
  )
  if (view.status === "AGREED") {
    const agreed = view.finalRewardAmount ?? view.agreedRewardAmount
    requested =
      agreed === null ? (
        "—"
      ) : (
        <>
          {formatWon(agreed)} <span className="text-sz-n-500">(합의)</span>
        </>
      )
  }
  // 기한 만료 · 요청 철회 — 둘 다 원래 계약 금액으로 확정된다
  if (view.status === "EXPIRED" || view.status === "WITHDRAWN") {
    requested = (
      <>
        {formatWon(view.finalRewardAmount ?? view.originalRewardAmount)}{" "}
        <span className="text-sz-n-500">(원래 금액)</span>
      </>
    )
  }

  return (
    <div className="shrink-0 border-b border-sz-n-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-[9px] bg-sz-accent-500 px-[7px] py-px text-[10px] font-bold text-white">
          이슈
        </span>
        <span className="truncate text-[12px] font-semibold text-sz-n-900">
          {view.groupBuy.title} · 정산 조정 요청
        </span>
        <span className="ml-auto shrink-0">
          <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-1">
        <PinRow label="공구">
          {view.groupBuy.groupBuyNumber}{" "}
          <button
            type="button"
            className={FLINK_CLASS}
            onClick={onOpenGroupBuy}
          >
            공구 상세
          </button>
        </PinRow>
        <PinRow label="보류 금액">
          <span className="tabular-nums">
            {isClosed
              ? "보류 해제"
              : `리워드 ${formatWon(view.originalRewardAmount)}`}
          </span>{" "}
          <button
            type="button"
            className={FLINK_CLASS}
            onClick={onOpenSettlement}
          >
            정산 관리
          </button>
        </PinRow>
        <PinRow label="요청 금액">
          <span className="tabular-nums">{requested}</span>
        </PinRow>
        <PinRow label="합의 기한">
          <span className="tabular-nums">
            {view.status === "AGREED" || view.status === "WITHDRAWN"
              ? "—"
              : view.status === "EXPIRED"
                ? `${formatDeadline(view.deadlineAt)} · 경과`
                : `${formatDeadline(view.deadlineAt)}${
                    view.remainingBusinessDays === null
                      ? ""
                      : ` · D-${view.remainingBusinessDays}`
                  }`}
          </span>
        </PinRow>
      </div>
    </div>
  )
}

function PinRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2 text-[11px]">
      <span className="w-[58px] shrink-0 text-sz-n-500">{props.label}</span>
      <span className="min-w-0 text-sz-n-900">{props.children}</span>
    </div>
  )
}
