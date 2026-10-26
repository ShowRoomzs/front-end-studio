import { HOME_PATHS } from "@/features/home/constants/params"
import type { HomeReward, HomeShowroom7d } from "@/features/home/types"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`

/** 시안 `.sc` — 숫자 목록만 · [메뉴 ›]로 넘어간다 */
function SideCard(props: {
  title: string
  link: string
  linkLabel: string
  children: ReactNode
}) {
  const { title, link, linkLabel, children } = props
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-4 py-3.5">
      <div className="mb-2.5 flex items-center text-[12px] font-semibold text-sz-n-900">
        {title}
        <Link
          to={link}
          className="ml-auto text-[11px] font-medium text-sz-accent-600 hover:underline"
        >
          {linkLabel} ›
        </Link>
      </div>
      <div className="[&>*:first-child]:border-t-0 [&>*:first-child]:pt-0">
        {children}
      </div>
    </div>
  )
}

/** 시안 `.sr` — 왼쪽 이름 · 오른쪽 값 */
function Row(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-t border-sz-n-100 py-[7px] text-[12px] text-sz-n-600">
      {props.label}
      {props.children}
    </div>
  )
}

function Value(props: { children: ReactNode; className?: string }) {
  return (
    <b
      className={cn(
        "text-[13px] font-bold tabular-nums text-sz-n-900",
        props.className
      )}
    >
      {props.children}
    </b>
  )
}

/** 시안 `.sr b.hm-sm` — 값이 없을 때 */
function Muted(props: { children: string }) {
  return (
    <b className="text-[12px] font-medium text-sz-n-500">{props.children}</b>
  )
}

/**
 * 리워드 — 지급 예정 · 지급 조건(H4) · 누적 수령(세후). 정산 관리(12) 요약과 같은 값.
 * 받은 적도 받을 것도 없으면(H3) 「지급 예정 · 아직 없어요」 한 줄.
 */
export function RewardCard(props: { reward: HomeReward }) {
  const { payoutScheduledAmount, payoutCondition, totalPaidNet } = props.reward
  const isEmpty = payoutScheduledAmount == null && totalPaidNet == null

  return (
    <SideCard
      title="리워드"
      link={HOME_PATHS.SETTLEMENT_LIST}
      linkLabel="정산 관리"
    >
      <Row label="지급 예정">
        {payoutScheduledAmount != null ? (
          <Value>{won(payoutScheduledAmount)}</Value>
        ) : (
          <Muted>{isEmpty ? "아직 없어요" : "없음"}</Muted>
        )}
      </Row>
      {payoutCondition === "TAX_INVOICE_UNVERIFIED" && (
        <Row label="지급 조건">
          <Value className="text-[12px] text-sz-warning-text">
            세금계산서 확인 후
          </Value>
        </Row>
      )}
      {totalPaidNet != null && (
        <Row label="누적 수령 · 세후">
          <Value>{won(totalPaidNet)}</Value>
        </Row>
      )}
    </SideCard>
  )
}

/** 쇼룸 최근 7일 — 쇼룸 통계(DAYS_7)와 같은 정의 */
export function ShowroomCard(props: { showroom: HomeShowroom7d }) {
  const { visitors, newFollowers, conversionRate } = props.showroom

  return (
    <SideCard
      title="쇼룸 · 최근 7일"
      link={HOME_PATHS.SHOWROOM_STATS_7D}
      linkLabel="쇼룸 현황"
    >
      <Row label="방문자">
        <Value>{visitors.toLocaleString("ko-KR")}</Value>
      </Row>
      <Row label="신규 팔로워">
        <Value className={newFollowers > 0 ? "text-sz-accent-600" : undefined}>
          +{newFollowers.toLocaleString("ko-KR")}
        </Value>
      </Row>
      <Row label="팔로우 전환">
        <Value>{conversionRate == null ? "—" : `${conversionRate}%`}</Value>
      </Row>
    </SideCard>
  )
}
