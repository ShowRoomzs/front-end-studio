import { Button } from "@/components/ui/button"
import { HOME_PATHS } from "@/features/home/constants/params"
import type { HomeLive } from "@/features/home/types"
import {
  formatAsOf,
  formatKstMonthDayTime,
  formatMonthDay,
  formatRemaining,
} from "@/features/home/utils/date"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

const won = (value: number) => value.toLocaleString("ko-KR")

function Kpi(props: {
  label: string
  value: ReactNode
  extra: ReactNode
  warn?: boolean
  extraMuted?: boolean
}) {
  const { label, value, extra, warn = false, extraMuted = false } = props
  return (
    <div className="border-l border-sz-n-100 pl-[18px]">
      <div className="text-[11px] text-sz-n-500">{label}</div>
      <div
        className={
          warn
            ? "mt-0.5 whitespace-nowrap text-[20px] font-semibold tabular-nums text-sz-warning-text"
            : "mt-0.5 whitespace-nowrap text-[20px] font-semibold tabular-nums text-sz-n-900"
        }
      >
        {value}
      </div>
      <div
        className={
          extraMuted
            ? "mt-0.5 text-[10px] tabular-nums text-sz-n-500"
            : "mt-0.5 text-[10px] tabular-nums text-sz-success-text"
        }
      >
        {extra}
      </div>
    </div>
  )
}

function Unit(props: { children: string }) {
  return (
    <small className="text-[12px] font-normal text-sz-n-500">
      {props.children}
    </small>
  )
}

/**
 * 진행 중 공구 실시간 띠 — 시안 `.hm-live`. 할 일 위 전폭 한 줄 · 값은 공구 관리(09) 잠정 실적과 같다.
 * 진행 중 공구가 없으면 그리지 않는다(H3).
 */
export default function LiveStrip(props: { live: HomeLive; now: number }) {
  const { live, now } = props
  const navigate = useNavigate()

  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))_auto] items-center gap-[18px] rounded-[8px] border border-sz-n-200 bg-white px-[18px] py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-[7px] text-[10px] font-semibold text-sz-success-text">
          <i className="inline-block size-[7px] rounded-full bg-sz-success-text" />
          진행 중 · 실시간 · {formatAsOf(live.asOf)} 기준
        </div>
        <div className="mt-1 truncate text-[13px] font-semibold text-sz-n-900">
          {live.name}
        </div>
        <div className="mt-0.5 text-[11px] text-sz-n-500">
          {live.brandName} · {formatMonthDay(live.startAt)} ~{" "}
          {formatMonthDay(live.endAt)}
        </div>
      </div>
      <Kpi
        label="종료까지"
        value={formatRemaining(live.endAt, now)}
        extra={`${formatKstMonthDayTime(live.endAt)} 종료`}
        warn
        extraMuted
      />
      <Kpi
        label="판매 금액 · 잠정"
        value={
          <>
            {won(live.salesAmount)}
            <Unit>원</Unit>
          </>
        }
        extra={`오늘 +${won(live.salesAmountToday)}원`}
      />
      <Kpi
        label="주문"
        value={
          <>
            {won(live.orders)}
            <Unit>건</Unit>
          </>
        }
        extra={`오늘 +${won(live.ordersToday)}건`}
      />
      <Kpi
        label="쇼룸 방문 · 공구 기간"
        value={won(live.visits)}
        extra={`오늘 +${won(live.visitsToday)}`}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => navigate(HOME_PATHS.groupBuy(live.groupBuyId))}
        className="rounded-[6px] px-3.5 text-[12px] font-medium shadow-none"
      >
        공구 보기
      </Button>
    </div>
  )
}
