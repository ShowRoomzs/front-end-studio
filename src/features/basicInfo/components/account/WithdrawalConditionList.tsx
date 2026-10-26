import { Link } from "react-router-dom"

import {
  CONDITION_BREAKDOWN_LABEL_OVERRIDE,
  WITHDRAWAL_CONDITION_VIEW,
} from "@/features/basicInfo/constants/params"
import type {
  WithdrawalBlock,
  WithdrawalCondition,
  WithdrawalConditionCode,
} from "@/features/basicInfo/types"
import { cn } from "@/lib/utils"

/**
 * 탈퇴 승인 요청 조건 체크리스트(S4 · S5) — 「탈퇴할 수 없습니다」 한 줄이 아니라 무엇을 끝내야 하는지 건수와 링크로.
 * 충족해도 사라지지 않고 충족 상태로 남는다(무엇을 근거로 열렸는지 보여야 한다).
 */
export default function WithdrawalConditionList(props: {
  withdrawal: WithdrawalBlock
}) {
  const { withdrawal } = props

  return (
    <div>
      <div className="mb-[7px] flex items-center justify-between text-[11px] text-sz-n-600">
        <span>탈퇴 승인 요청 조건</span>
        <b className="font-semibold text-sz-n-900">
          {withdrawal.satisfiedCount} / {withdrawal.totalCount} 충족
        </b>
      </div>
      <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
        {withdrawal.conditions.map(condition => (
          <ConditionRow key={condition.code} condition={condition} />
        ))}
      </div>
    </div>
  )
}

function isKnownCode(code: string): code is WithdrawalConditionCode {
  return code in WITHDRAWAL_CONDITION_VIEW
}

function ConditionRow(props: { condition: WithdrawalCondition }) {
  const { condition } = props
  const view = isKnownCode(condition.code)
    ? WITHDRAWAL_CONDITION_VIEW[condition.code]
    : null
  const unmet = !condition.satisfied

  return (
    <div className="flex items-start gap-[9px] border-b border-sz-n-100 px-3 py-2.5 last:border-b-0">
      <span
        className={cn(
          "mt-px flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
          unmet
            ? "bg-sz-warning-bg text-sz-warning-text"
            : "bg-sz-success-bg text-sz-success-text"
        )}
      >
        {unmet ? "!" : "✓"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-sz-n-900">
          {view?.title ?? condition.label}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[11px] leading-[1.6]",
            unmet ? "text-sz-warning-text" : "text-sz-n-500"
          )}
        >
          {unmet
            ? unmetText(condition)
            : (view?.satisfiedText ?? `${condition.label} 0건`)}
        </span>
      </span>
      {unmet && view && (
        <Link
          to={view.linkTo}
          className="mt-px shrink-0 text-[11px] font-medium text-sz-accent-600 hover:underline"
        >
          {view.linkLabel}
        </Link>
      )}
    </div>
  )
}

/** 「진행중 1건 · 종료 후 주문 종결 대기 1건 — 주문이 모두 종결되어야 합니다」 */
function unmetText(condition: WithdrawalCondition) {
  const counts =
    condition.breakdown.length > 0
      ? condition.breakdown
          .map(
            item =>
              `${CONDITION_BREAKDOWN_LABEL_OVERRIDE[item.key] ?? item.label} ${item.count}건`
          )
          .join(" · ")
      : `${condition.count}건`
  return `${counts} — ${condition.resolution}`
}
