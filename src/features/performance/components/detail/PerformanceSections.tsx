import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import { GenderValue } from "@/features/performance/components/list/PerformanceListParts"
import {
  B,
  Card,
  CardBody,
  EstTag,
  KpiTile,
  MiniStat,
  SumRow,
  TD_CLASS,
  TD_NUM,
  TH_CLASS,
  Tip,
  ToneBadge,
  Unit,
} from "@/features/performance/components/shared/PerformanceParts"
import {
  GENDER_COLOR,
  INDIGO_STEPS,
  REWARD_STAGE_LABEL,
} from "@/features/performance/constants/params"
import type {
  CreatorPerformanceConsumers,
  CreatorPerformanceDetail,
  CreatorPerformanceFollowers,
  CreatorPerformanceFunnel,
  CreatorPerformanceHeader,
  CreatorPerformanceNotice,
  CreatorPerformanceReward,
  CreatorPerformanceRewardBar,
  CreatorPerformanceSales,
  CreatorPerformanceTraffic,
  Highlight,
} from "@/features/performance/types"
import {
  DASH,
  barWidth,
  formatEventMonthDay,
  formatKstMonthDay,
  formatNumber,
  formatPeriod,
  formatRate,
  formatRewardRate,
  formatSigned,
  formatSignedWon,
  formatWon,
  formatWonOrDash,
  genderLabel,
  productCountWord,
  ratio,
} from "@/features/performance/utils/format"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/*
  ui-studio-10 상세(D1 ~ D4) 블록 — 순서는 서버 응답과 시안이 같다:
  상단 안내 → 리워드 바 → KPI 6 → ① 유입(경로 · 게시물 · 퍼널) → ② 판매 → ③ 소비자 → ④ 팔로워 → ⑤ 리워드.
  돈은 정산 행 그대로다 — stage가 CONFIRMED가 아니면 금액 대신 stage 라벨을 그리고, 화면이 다시 계산하지 않는다.
  「예정」은 줄어들 수 있는 값(판매 · 소비자 블록 · 퍼널 구간 2)에만 붙인다 — 방문 · 유입 · 게시물 · 팔로워는 확정값.
  위험색 없음(성과 화면은 조치 화면이 아니다).
*/

const won = (value: number) => (
  <>
    {formatNumber(value)}
    <Unit>원</Unit>
  </>
)

// ------------------------------------------------------------------ 머리

export function DetailHeader(props: {
  groupBuy: CreatorPerformanceHeader
  onList: () => void
  onRecollaborate: () => void
}) {
  const { groupBuy, onList, onRecollaborate } = props
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-[20px] font-semibold text-sz-n-900">
          {groupBuy.groupBuyTitle}
        </h1>
        <div className="mt-0.5 flex items-center text-[12px] text-sz-n-600">
          {groupBuy.brandName} ·{" "}
          {formatPeriod(groupBuy.periodStartAt, groupBuy.periodEndAt, true)}
          <ToneBadge tone={groupBuy.statusTone} className="ml-1.5">
            {groupBuy.statusLabel}
          </ToneBadge>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Btn variant="ghost" onClick={onList}>
          목록으로
        </Btn>
        <Btn variant="secondary" onClick={onRecollaborate}>
          이 브랜드와 재협업 제안
        </Btn>
      </div>
    </div>
  )
}

/** 서버 문장의 첫 문장을 굵게 — 시안 D2 · D3 · D4 안내가 모두 그렇다 */
function emphasizeFirstSentence(text: string): ReactNode {
  const end = text.indexOf(". ")
  if (end < 0) return text
  return (
    <>
      <B>{text.slice(0, end + 1)}</B>
      {text.slice(end + 1)}
    </>
  )
}

/**
 * 상단 안내 — 집계 중(미종결 있음) 중립 · 조정 협의 경고 + [이슈 스레드 열기] · 합의 반영 중립 + [이슈 스레드 기록 보기].
 * 응답 버튼(동의 · 제안 · 반대)은 없다 — 응답은 이슈 스레드에서만.
 */
export function TopNotice(props: {
  notice: CreatorPerformanceNotice
  onOpenThread: (threadId: number) => void
}) {
  const { notice, onOpenThread } = props
  const threadId = notice.threadId
  return (
    <Notice
      tone={notice.tone === "WARNING" ? "warn" : "neutral"}
      className="mb-4 flex items-center gap-3"
    >
      <div className="flex-1">{emphasizeFirstSentence(notice.text)}</div>
      {notice.link && threadId !== null && (
        <Btn
          variant="secondary"
          className="shrink-0"
          onClick={() => onOpenThread(threadId)}
        >
          {notice.link === "ISSUE_THREAD"
            ? "이슈 스레드 열기"
            : "이슈 스레드 기록 보기"}
        </Btn>
      )}
    </Notice>
  )
}

/** 시안 `.ctr-bar .ci` */
function BarItem(props: { label: string; value: ReactNode; note: ReactNode }) {
  return (
    <div className="text-[12px] text-sz-n-700">
      {props.label}{" "}
      <b className="font-semibold tabular-nums text-sz-n-900">{props.value}</b>
      <span className="block text-[10px] text-sz-n-500">{props.note}</span>
    </div>
  )
}

const BarSep = () => <div className="h-[26px] w-px shrink-0 bg-sz-n-200" />

/**
 * 리워드 바 — 판매 리워드 · 고정 지급비(브랜드 직접 지급 · 계약 금액이라 언제나 숫자) · 총 리워드 · [계약서 보기].
 * 보조줄은 서버 `note`에 원래 금액 · 예정액을 시안 꼴로 붙인다(「원래 1,577,040원 · …」 · 「… · 예정 677,400원」).
 */
export function RewardBar(props: {
  bar: CreatorPerformanceRewardBar
  onContract: () => void
}) {
  const { salesReward, fixedFee, totalReward } = props.bar
  const original = salesReward.originalAmount
  let salesNote = salesReward.note ?? ""
  if (salesReward.stage === "AFTER_AGREEMENT" && original !== null) {
    salesNote = `원래 ${formatWon(original)} · ${salesNote}`
  } else if (
    salesReward.stage === "AFTER_SETTLEMENT" &&
    original !== null &&
    salesNote.endsWith("예정")
  ) {
    salesNote = `${salesNote} ${formatWon(original)}`
  }
  const moneyText = (money: typeof salesReward) =>
    money.stage === "CONFIRMED" && money.amount !== null
      ? formatWon(money.amount)
      : REWARD_STAGE_LABEL[money.stage]

  return (
    <div className="mb-4 flex items-center gap-4 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[14px] py-[11px]">
      <BarItem
        label="판매 리워드"
        value={moneyText(salesReward)}
        note={salesNote}
      />
      <BarSep />
      <BarItem
        label="고정 지급비"
        value={formatWon(fixedFee.amount ?? 0)}
        note={fixedFee.note ?? "브랜드 직접 지급"}
      />
      <BarSep />
      <BarItem
        label="총 리워드"
        value={moneyText(totalReward)}
        note={
          totalReward.stage === "AFTER_SETTLEMENT"
            ? "판매 리워드는 정산 후 확정"
            : "판매 리워드 + 고정 지급비"
        }
      />
      <Btn
        variant="ghost"
        className="ml-auto underline underline-offset-[3px]"
        onClick={props.onContract}
      >
        계약서 보기
      </Btn>
    </div>
  )
}

/**
 * KPI 6(3 × 2) — 내 리워드 · 확정 거래액 · 구매전환율 · 재구매율 · 팔로워 증감(확정값) · 성비.
 * 주인공 카드(인디고)는 돈이 확정되면 내 리워드, 조정 협의면 확정 거래액, 집계 중이면 없다(시안 D1 · D3 · D2).
 */
export function DetailKpis({ detail }: { detail: CreatorPerformanceDetail }) {
  const { kpi, reward, consumers, groupBuy } = detail
  const myReward = kpi.myReward
  const confirmed = myReward.stage === "CONFIRMED" && myReward.amount !== null
  const stageText = (text: string, className?: string) => (
    <span className={cn("text-[16px]", className)}>{text}</span>
  )

  let myRewardValue: ReactNode
  let myRewardSub: string
  if (confirmed && myReward.amount !== null) {
    myRewardValue = won(myReward.amount)
    myRewardSub = reward.adjustment
      ? "리워드 + 고정 지급비 · 조정 합의 반영"
      : "리워드 + 고정 지급비"
  } else if (myReward.stage === "AFTER_AGREEMENT") {
    myRewardValue = stageText(
      REWARD_STAGE_LABEL.AFTER_AGREEMENT,
      "text-sz-warning-text"
    )
    myRewardSub = reward.adjustmentDeadlineAt
      ? `조정 협의 중 · 합의 기한 ${formatKstMonthDay(reward.adjustmentDeadlineAt)}`
      : "조정 협의 중"
  } else {
    myRewardValue = stageText(REWARD_STAGE_LABEL.AFTER_SETTLEMENT)
    myRewardSub = "리워드 + 고정 지급비"
  }

  const rateValue = (value: number | null, estimated: boolean) =>
    value === null ? (
      DASH
    ) : (
      <>
        {formatRate(value)}
        {estimated && <EstTag />}
      </>
    )

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <KpiTile
        hi={confirmed}
        dim={myReward.stage === "AFTER_SETTLEMENT"}
        label="내 리워드"
        value={myRewardValue}
        sub={myRewardSub}
      />
      <KpiTile
        hi={!confirmed && groupBuy.status === "ADJUSTING"}
        dim={kpi.confirmedSales.estimated}
        label="확정 거래액"
        value={
          kpi.confirmedSales.value === null ? (
            DASH
          ) : (
            <>
              {won(kpi.confirmedSales.value)}
              {kpi.confirmedSales.estimated && <EstTag />}
            </>
          )
        }
        sub={kpi.confirmedSales.basis}
      />
      <KpiTile
        dim={kpi.conversionRate.estimated}
        label="구매전환율"
        value={rateValue(
          kpi.conversionRate.value,
          kpi.conversionRate.estimated
        )}
        sub={kpi.conversionRate.basis}
      />
      <KpiTile
        dim={kpi.repeatRate.estimated}
        label="재구매율"
        value={rateValue(kpi.repeatRate.value, kpi.repeatRate.estimated)}
        sub={kpi.repeatRate.basis}
      />
      <KpiTile
        label="팔로워 증감"
        value={
          <>
            {formatSigned(kpi.followerDelta.delta)}
            <Unit>명</Unit>
          </>
        }
        sub={`공구 기간 중 · 종료 시점 ${formatNumber(kpi.followerDelta.countAtEnd)}명`}
      />
      <KpiTile
        dim={kpi.genderEstimated}
        label={genderLabel(kpi.genderRatio)}
        value={
          kpi.genderRatio ? (
            <>
              <GenderValue ratio={kpi.genderRatio} />
              {kpi.genderEstimated && <EstTag />}
            </>
          ) : (
            DASH
          )
        }
        sub={`구매 소비자 ${formatNumber(consumers.buyerCount)}명 기준`}
      />
    </div>
  )
}

// ------------------------------------------------------------------ ① 유입

/**
 * 유입 경로(도넛 · 4종 합 = 쇼룸 방문) · 공구 게시물(가로 막대 · 조회 → 상세 → 주문).
 * 경로는 같은 방문의 출처라 인디고 한 색의 명도 4단으로만 가른다(색을 바꾸면 상태색으로 오독된다).
 */
export function TrafficSection({
  traffic,
}: {
  traffic: CreatorPerformanceTraffic
}) {
  const total = traffic.visitorCount
  let cursor = 0
  const stops = traffic.sources.map((item, index) => {
    const start = cursor
    cursor += barWidth(item.visitors, total)
    return `${INDIGO_STEPS[index % INDIGO_STEPS.length]} ${start}% ${cursor}%`
  })
  const background =
    total > 0 ? `conic-gradient(${stops.join(",")})` : "var(--sz-n-100)"

  return (
    <div className="mb-4 grid grid-cols-2 items-stretch gap-4">
      <Card
        title="유입 경로"
        note="4종 합계 = 쇼룸 방문"
        className="mb-0 flex flex-col"
      >
        <CardBody className="flex-1">
          <div className="flex h-full items-center gap-5">
            <div
              className="relative size-[148px] shrink-0 rounded-full"
              style={{ background }}
            >
              <div className="absolute inset-[37px] rounded-full bg-white" />
              <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center">
                <div className="text-[19px] font-semibold leading-[1.2] tracking-[-.02em] tabular-nums text-sz-n-900">
                  {formatNumber(total)}
                </div>
                <div className="mt-0.5 text-[10px] text-sz-n-500">
                  쇼룸 방문
                </div>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-[11px]">
              {traffic.sources.map((item, index) => (
                <div
                  key={item.source}
                  className="flex items-center gap-[9px] text-[11px]"
                >
                  <i
                    className="size-[10px] shrink-0 rounded-[2px]"
                    style={{
                      background: INDIGO_STEPS[index % INDIGO_STEPS.length],
                    }}
                  />
                  <span className="flex-1 truncate text-sz-n-700">
                    {item.label}
                  </span>
                  <span className="font-medium tabular-nums text-sz-n-900">
                    {formatNumber(item.visitors)}
                  </span>
                  <span className="w-[40px] text-right tabular-nums text-sz-n-500">
                    {formatRate(item.ratio)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card
        title="공구 게시물"
        note="쇼룸 내부 지표 · 게시물 1건"
        className="mb-0 flex flex-col"
      >
        <CardBody className="flex-1">
          {traffic.post ? (
            <>
              <div className="flex flex-col gap-[15px]">
                <HBar
                  label="게시물 조회"
                  value={`${formatNumber(traffic.post.impressions)}회`}
                  small={`고유 ${formatNumber(traffic.post.uniqueViewers)}명`}
                  width={traffic.post.impressions > 0 ? 100 : 0}
                  color={INDIGO_STEPS[0]}
                />
                <HBar
                  label="상품 상세 이동"
                  value={`${formatNumber(traffic.post.productViews)}회`}
                  small={`조회 대비 ${formatRate(traffic.post.productViewRate)}`}
                  width={barWidth(
                    traffic.post.productViews,
                    traffic.post.impressions
                  )}
                  color={INDIGO_STEPS[1]}
                />
                <HBar
                  label="게시물 → 주문"
                  value={`${formatNumber(traffic.post.orders)}건`}
                  small={`상세 대비 ${formatRate(traffic.post.orderRate)}`}
                  width={barWidth(
                    traffic.post.orders,
                    traffic.post.impressions
                  )}
                  color={INDIGO_STEPS[2]}
                />
              </div>
              <div className="mt-4 flex gap-4 border-t border-sz-n-200 pt-[11px] text-[11px] text-sz-n-600">
                <span>
                  좋아요{" "}
                  <b className="font-semibold tabular-nums text-sz-n-900">
                    {formatNumber(traffic.post.likes)}
                  </b>
                </span>
                <span>
                  공유{" "}
                  <b className="font-semibold tabular-nums text-sz-n-900">
                    {traffic.post.shares === null
                      ? DASH
                      : formatNumber(traffic.post.shares)}
                  </b>
                  {traffic.post.shares !== null && "회"}
                </span>
                <span className="ml-auto text-sz-n-500">
                  주문은 게시물 경유분
                </span>
              </div>
            </>
          ) : (
            <div className="rounded-[6px] border border-dashed border-sz-n-300 px-5 py-[34px] text-center">
              <div className="text-[12px] font-medium text-sz-n-700">
                공구 게시물이 없습니다
              </div>
              <div className="mt-[3px] text-[11px] text-sz-n-500">
                이 공구에 연결된 공구 게시물이 없어 게시물 지표가 없습니다.
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

/** 시안 `.hb-r` — 막대는 최대값(게시물 조회) 기준 */
function HBar(props: {
  label: string
  value: string
  small: string
  width: number
  color: string
}) {
  return (
    <div>
      <div className="mb-[7px] flex items-baseline justify-between gap-2 text-[11px]">
        <span className="text-sz-n-700">{props.label}</span>
        <span className="text-[12px] font-semibold tabular-nums text-sz-n-900">
          {props.value}
          <small className="ml-[3px] text-[11px] font-normal text-sz-n-500">
            {props.small}
          </small>
        </span>
      </div>
      <div className="h-[11px] overflow-hidden rounded-[3px] bg-sz-n-100">
        <i
          className="block h-full rounded-[3px]"
          style={{ width: `${props.width}%`, background: props.color }}
        />
      </div>
    </div>
  )
}

/**
 * 전환 퍼널 2구간 — 구간 1 = 방문 → 주문(막대 기준 방문) · 구간 2 = 주문 → 구매확정(막대 기준 주문).
 * 5단을 한 축에 그리면 주문 이후가 같은 굵기의 6% 막대가 돼 구별되지 않는다. 이탈은 숫자로만(붉게 칠하지 않는다).
 */
export function FunnelCard({ funnel }: { funnel: CreatorPerformanceFunnel }) {
  const orderRatio = ratio(funnel.orderCount, funnel.visitorCount)
  return (
    <Card
      title="전환 퍼널"
      note="두 구간으로 나눠 봅니다 · 각 구간의 기준이 다릅니다"
    >
      <CardBody>
        <div className="flex flex-col gap-3">
          <FunnelSeg
            head={
              <>
                구간 1 ·{" "}
                <b className="font-medium text-sz-n-900">방문에서 주문까지</b> —
                막대 기준 = 쇼룸 방문 {formatNumber(funnel.visitorCount)}명
              </>
            }
          >
            <FunnelRow
              light
              label="쇼룸 방문"
              width={funnel.visitorCount > 0 ? 100 : 0}
              value={`${formatNumber(funnel.visitorCount)}명`}
              pct={funnel.visitorCount > 0 ? "100%" : DASH}
            />
            <FunnelRow
              label="주문(결제완료)"
              width={barWidth(funnel.orderCount, funnel.visitorCount)}
              value={`${formatNumber(funnel.orderCount)}건`}
              pct={formatRate(orderRatio)}
            />
            <FunnelNote>
              방문 <B>{formatNumber(funnel.nonOrderVisitors)}명</B>은 주문하지
              않았습니다.
            </FunnelNote>
          </FunnelSeg>
          <FunnelSeg
            head={
              <>
                구간 2 ·{" "}
                <b className="font-medium text-sz-n-900">
                  주문에서 구매확정까지
                </b>{" "}
                — 막대 기준 = 주문 {formatNumber(funnel.orderCount)}건
              </>
            }
          >
            <FunnelRow
              light
              label="주문"
              width={funnel.orderCount > 0 ? 100 : 0}
              value={`${formatNumber(funnel.orderCount)}건`}
              pct={funnel.orderCount > 0 ? "100%" : DASH}
            />
            <FunnelRow
              label={
                <>
                  구매확정
                  {funnel.estimated && <EstTag />}
                </>
              }
              width={funnel.confirmedRate ?? 0}
              value={`${formatNumber(funnel.confirmedOrderCount)}건`}
              valueDim={funnel.estimated}
              pct={formatRate(funnel.confirmedRate)}
            />
            <FunnelNote>
              막대와 비율 모두 <B>주문 대비</B>입니다. 주문{" "}
              {formatNumber(funnel.orderCount)}건 = 구매확정{" "}
              {formatNumber(funnel.confirmedOrderCount)} + 취소{" "}
              {formatNumber(funnel.cancelCount)} + 반품{" "}
              {formatNumber(funnel.returnCount)} + 배송 예외{" "}
              {formatNumber(funnel.deliveryExceptionCount)} · 건별 내역은{" "}
              <B>공구 관리</B>에서 봅니다.
            </FunnelNote>
          </FunnelSeg>
        </div>
        <div className="mt-3 flex justify-between border-t border-sz-n-200 pt-2.5 text-[12px] text-sz-n-700">
          <span>
            방문 대비 최종 구매전환율{funnel.estimated ? "(예정)" : ""}
          </span>
          <b className="font-semibold tabular-nums">
            {formatRate(funnel.finalConversionRate)}
          </b>
        </div>
      </CardBody>
    </Card>
  )
}

function FunnelSeg(props: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[6px] border border-sz-n-200 px-[15px] py-[13px]">
      <div className="mb-3 text-[11px] text-sz-n-500">{props.head}</div>
      {props.children}
    </div>
  )
}

function FunnelRow(props: {
  label: ReactNode
  width: number
  value: string
  pct: string
  light?: boolean
  valueDim?: boolean
}) {
  return (
    <div className="mb-[9px] flex items-center gap-3">
      <span className="w-[100px] shrink-0 text-[12px] text-sz-n-700">
        {props.label}
      </span>
      <span className="h-[22px] min-w-0 flex-1 overflow-hidden rounded-[3px] bg-sz-n-100">
        <i
          className="block h-full rounded-[3px]"
          style={{
            width: `${Math.min(100, Math.max(0, props.width))}%`,
            background: props.light ? INDIGO_STEPS[3] : INDIGO_STEPS[0],
          }}
        />
      </span>
      <span
        className={cn(
          "w-[82px] shrink-0 text-right text-[12px] font-semibold tabular-nums",
          props.valueDim ? "text-sz-n-500" : "text-sz-n-900"
        )}
      >
        {props.value}
      </span>
      <span className="w-[66px] shrink-0 text-right text-[11px] tabular-nums text-sz-n-500">
        {props.pct}
      </span>
    </div>
  )
}

function FunnelNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-[11px] border-t border-sz-n-100 pt-2.5 text-[11px] leading-[1.7] text-sz-n-600">
      {children}
    </div>
  )
}

// ------------------------------------------------------------------ ② 판매

/**
 * 상품별 성과 표(상품별 리워드율 · 리워드 — 단일 율을 만들지 않는다) + 하이라이트 3장(표 아래 · 근거와 분모).
 * 상품별 값은 계약 기준이다. 합의 차액은 상품에 배분하지 않고 표 아래 한 줄(주석)로만 말한다(D4).
 */
export function SalesSection(props: {
  sales: CreatorPerformanceSales
  reward: CreatorPerformanceReward
  adjusting: boolean
}) {
  const { sales, reward, adjusting } = props
  const contract =
    sales.contractRewardAmount ??
    sales.products.reduce((sum, item) => sum + item.rewardAmount, 0)
  const sumWord = `${productCountWord(sales.products.length)} 합계`
  const fixedFeeTail = (
    <>
      {" "}
      — <B>고정 지급비는 상품에 배분되지 않습니다</B>(공구 단위로 지급).
    </>
  )

  let tipBody: ReactNode
  if (sales.adjustmentDelta !== null) {
    const finalReward =
      reward.finalRewardAmount ?? contract + sales.adjustmentDelta
    tipBody = (
      <>
        {sumWord} <B>{formatWon(contract)}</B>은 계약 기준 값입니다 — 여기에{" "}
        <B>조정 반영 {formatSignedWon(sales.adjustmentDelta)}</B>(공구 단위 합의
        · 상품에 배분하지 않음)을 더한 <B>{formatWon(finalReward)}</B>이 확정
        판매 리워드입니다
      </>
    )
  } else if (adjusting) {
    tipBody = (
      <>
        {sumWord} <B>{formatWon(contract)}</B>이 판매 리워드 <B>원래 금액</B>과
        같습니다 — 조정 협의 결과에 따라 판매 리워드가 바뀌어도{" "}
        <B>상품별 값은 계약 기준 그대로</B> 남습니다
      </>
    )
  } else if (sales.estimated) {
    tipBody = (
      <>
        {sumWord} <B>{formatWon(contract)}</B>이 판매 리워드 예정액입니다
      </>
    )
  } else {
    tipBody = (
      <>
        {sumWord} <B>{formatWon(contract)}</B>이 판매 리워드와 같습니다
      </>
    )
  }

  const dimCell = (base: string) => cn(base, sales.estimated && "text-sz-n-500")

  return (
    <Card title="상품별 성과" tag={sales.estimated ? <EstTag /> : undefined}>
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col />
          <col className="w-[96px]" />
          <col className="w-[80px]" />
          <col className="w-[96px]" />
          <col className="w-[126px]" />
          <col className="w-[86px]" />
          <col className="w-[120px]" />
        </colgroup>
        <thead>
          <tr>
            <th className={TH_CLASS}>상품</th>
            <th className={cn(TH_CLASS, "text-center")}>상세 조회</th>
            <th className={cn(TH_CLASS, "text-center")}>주문</th>
            <th className={cn(TH_CLASS, "text-center")}>확정 수량</th>
            <th className={cn(TH_CLASS, "text-center")}>확정 금액</th>
            <th className={cn(TH_CLASS, "text-center")}>리워드율</th>
            <th className={cn(TH_CLASS, "text-center")}>리워드</th>
          </tr>
        </thead>
        <tbody>
          {sales.products.map(item => (
            <tr key={item.productId} className="[&:first-child>td]:border-t-0">
              <td className={TD_CLASS}>
                <span className="block truncate font-medium text-sz-n-900">
                  {item.productName}
                </span>
              </td>
              <td className={TD_NUM}>{formatNumber(item.detailViews)}</td>
              <td className={TD_NUM}>{formatNumber(item.orders)}</td>
              <td className={dimCell(TD_NUM)}>
                {formatNumber(item.confirmedQuantity)}개
              </td>
              <td className={dimCell(TD_NUM)}>
                {formatWon(item.confirmedAmount)}
              </td>
              <td className={TD_NUM}>{formatRewardRate(item.rewardRate)}</td>
              <td className={dimCell(TD_NUM)}>
                {formatWon(item.rewardAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CardBody className="border-t border-sz-n-200">
        <Tip className="mb-4 mt-0">
          <B>리워드율은 상품마다 다릅니다</B> — 계약에서 상품별로 정한 율이며
          여기 표시된 값이 그대로 적용됩니다. {tipBody}
          {fixedFeeTail}
        </Tip>
        <div className="grid grid-cols-3 gap-3">
          <HighlightCard
            title="가장 많이 본 상품"
            item={sales.highlights.mostViewed}
            estimated={sales.estimated}
          />
          <HighlightCard
            title="전환율이 높은 상품"
            item={sales.highlights.bestConversion}
            estimated={sales.estimated}
          />
          <HighlightCard
            title="리워드가 큰 상품"
            item={sales.highlights.topReward}
            estimated={sales.estimated}
          />
        </div>
      </CardBody>
    </Card>
  )
}

/** 시안 `.hl .h` — 평가어 없이 근거 수치와 분모(서버 문장 그대로) */
function HighlightCard(props: {
  title: string
  item: Highlight | null
  estimated: boolean
}) {
  return (
    <div className="min-w-0 rounded-[6px] border border-sz-n-200 px-[13px] py-[11px]">
      <div className="text-[11px] text-sz-n-600">
        {props.title}
        {props.estimated && <EstTag />}
      </div>
      <div className="mt-[5px] truncate text-[14px] font-semibold leading-[1.4] text-sz-n-900">
        {props.item?.productName ?? DASH}
      </div>
      {props.item && (
        <div className="mt-[3px] text-[11px] tabular-nums text-sz-n-500">
          {props.item.basis}
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ ③ 소비자

/**
 * 소비자 분석 — 구매 소비자 · 신규 · 재구매 · 구매 소비자 중 팔로워(해석 문구 없음) + 연령대 × 성별 차트 1개.
 * 축은 하나다 — 막대는 가장 큰 구간을 트랙 끝으로 두고, 성별 총량은 범례가 말한다.
 * 표본이 공개 최소치보다 적으면 서버가 분포를 비공개로 내린다(식별 방지).
 */
export function ConsumersSection(props: {
  consumers: CreatorPerformanceConsumers
  confirmedOrderCount: number
}) {
  const { consumers, confirmedOrderCount } = props
  const { distribution } = consumers
  const dim = consumers.estimated
  const maxTotal = Math.max(
    0,
    ...distribution.ageGroups.map(item => item.total ?? 0)
  )
  const maxGroup = distribution.ageGroups.find(
    item => (item.total ?? 0) === maxTotal && maxTotal > 0
  )
  const pct = (value: number | null) =>
    value === null ? DASH : `${Number(value.toFixed(1))}`

  return (
    <Card
      title="소비자 분석"
      note={`구매확정 ${formatNumber(confirmedOrderCount)}건 · 구매 소비자 ${formatNumber(consumers.buyerCount)}명 기준`}
      tag={dim ? <EstTag /> : undefined}
    >
      <CardBody>
        <div className="grid grid-cols-4 gap-3">
          <MiniStat
            dim={dim}
            label="구매 소비자"
            value={`${formatNumber(consumers.buyerCount)}명`}
            sub={`구매확정 ${formatNumber(confirmedOrderCount)}건 · 같은 소비자의 재구매 제외`}
          />
          <MiniStat
            dim={dim}
            label="신규 소비자"
            value={`${formatNumber(consumers.newBuyerCount)}명`}
            sub={`내 공구 첫 구매 · 구매 소비자의 ${formatRate(ratio(consumers.newBuyerCount, consumers.buyerCount))}`}
          />
          <MiniStat
            dim={dim}
            label="재구매 소비자"
            value={`${formatNumber(consumers.repeatBuyerCount)}명`}
            sub="이전 내 공구에서도 구매"
          />
          <MiniStat
            dim={dim}
            label="구매 소비자 중 팔로워"
            value={formatRate(consumers.followerBuyerRate)}
            sub={`구매 소비자 ${formatNumber(consumers.buyerCount)}명 중 ${formatNumber(consumers.followerBuyerCount)}명이 내 쇼룸 팔로워`}
          />
        </div>

        <div className="mt-4">
          <div className="mb-3 flex items-center gap-[13px] text-[13px] text-sz-n-900">
            연령대 · 성별
            {distribution.genders && (
              <>
                <Legend color={GENDER_COLOR.female}>
                  여성 {formatRate(distribution.genders.female)}
                </Legend>
                <Legend color={GENDER_COLOR.male}>
                  남성 {formatRate(distribution.genders.male)}
                </Legend>
              </>
            )}
            {maxGroup && !distribution.suppressed && (
              <span className="ml-auto text-[11px] font-normal text-sz-n-500">
                막대는 최대 구간({maxGroup.label}) 기준
              </span>
            )}
          </div>
          {distribution.suppressed ? (
            <div className="rounded-[6px] border border-dashed border-sz-n-300 px-5 py-6 text-center text-[11px] text-sz-n-500">
              구매 소비자가 {formatNumber(distribution.minimumSampleSize)}명
              미만이라 연령대 · 성별 분포를 표시하지 않습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-[7px]">
              {distribution.ageGroups.map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="w-[58px] shrink-0 text-[11px] text-sz-n-600">
                    {item.label}
                  </span>
                  <span className="flex h-[14px] flex-1 overflow-hidden rounded-[3px] bg-sz-n-100">
                    <i
                      className="block h-full rounded-l-[3px]"
                      style={{
                        width: `${barWidth(item.female ?? 0, maxTotal)}%`,
                        background: GENDER_COLOR.female,
                      }}
                    />
                    <i
                      className="block h-full rounded-r-[3px]"
                      style={{
                        width: `${barWidth(item.male ?? 0, maxTotal)}%`,
                        background: GENDER_COLOR.male,
                      }}
                    />
                  </span>
                  <span
                    className={cn(
                      "w-[44px] shrink-0 text-right text-[11px] font-medium tabular-nums",
                      dim ? "text-sz-n-500" : "text-sz-n-900"
                    )}
                  >
                    {formatRate(item.total)}
                  </span>
                  <span className="w-[112px] shrink-0 text-right text-[10px] tabular-nums text-sz-n-500">
                    여 {pct(item.female)} / 남 {pct(item.male)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {!distribution.suppressed && (
          <Tip>
            막대 안 두 색은 여성 · 남성이고, 오른쪽 숫자는{" "}
            <B>전체 소비자 대비 비율</B>입니다(연령대 합계 → 여 · 남 분해). 구간
            인원이 5명 미만이면 «기타»로 합산해 표시합니다.
          </Tip>
        )}
      </CardBody>
    </Card>
  )
}

function Legend(props: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[5px] text-[11px] font-normal text-sz-n-600">
      <i
        className="size-[9px] rounded-[2px]"
        style={{ background: props.color }}
      />
      {props.children}
    </span>
  )
}

// ------------------------------------------------------------------ ④ 팔로워

/**
 * 팔로워 · 비팔로워 비교표(합계 행 없음 — 총량은 위 패널에 있다) + 이 공구 기간의 스냅샷.
 * 기간 전체 추이 · 구성의 정본은 쇼룸 관리 › 쇼룸 현황이다.
 */
export function FollowersSection(props: {
  followers: CreatorPerformanceFollowers
  groupBuy: CreatorPerformanceHeader
  visitorCount: number
  onShowroomStats: () => void
}) {
  const { followers, groupBuy, visitorCount, onShowroomStats } = props
  const dim = followers.conversionEstimated
  const sides = [
    { key: "follower", label: "팔로워", side: followers.follower },
    { key: "nonFollower", label: "비팔로워", side: followers.nonFollower },
  ]
  const confirmedSum =
    followers.follower.confirmedOrders + followers.nonFollower.confirmedOrders

  return (
    <Card title="팔로워" note="쇼룸 팔로워 · 팔로워와 비팔로워 비교">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[104px]" />
          <col className="w-[124px]" />
        </colgroup>
        <thead>
          <tr>
            <th className={TH_CLASS}>구분</th>
            <th className={cn(TH_CLASS, "text-center")}>쇼룸 방문</th>
            <th className={cn(TH_CLASS, "text-center")}>게시물 조회</th>
            <th className={cn(TH_CLASS, "text-center")}>주문</th>
            <th className={cn(TH_CLASS, "text-center")}>
              {dim ? "구매전환율 (예정)" : "구매전환율"}
            </th>
          </tr>
        </thead>
        <tbody>
          {sides.map(({ key, label, side }) => (
            <tr
              key={key}
              className="[&:first-child>td]:border-t-0 [&:last-child>td]:border-b [&:last-child>td]:border-b-sz-n-200"
            >
              <td className={TD_CLASS}>
                <span className="block truncate font-medium text-sz-n-900">
                  {label}
                </span>
              </td>
              <td className={TD_NUM}>{formatNumber(side.visitors)}</td>
              <td className={TD_NUM}>{formatNumber(side.postViewers)}</td>
              <td className={TD_NUM}>{formatNumber(side.orders)}</td>
              <td className={cn(TD_NUM, dim && "text-sz-n-500")}>
                {formatRate(side.conversionRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CardBody>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat
            label="쇼룸 팔로워"
            value={`${formatNumber(followers.countAtEnd)}명`}
            sub="공구 종료 시점"
          />
          <MiniStat
            label="공구 기간 증감"
            value={`${formatSigned(followers.delta)}명`}
            sub={`${formatPeriod(groupBuy.periodStartAt, groupBuy.periodEndAt, true)} 사이`}
          />
          <MiniStat
            label="방문 중 팔로워 비중"
            value={formatRate(followers.followerVisitorRate)}
            sub={`방문 ${formatNumber(visitorCount)}명 중 ${formatNumber(followers.follower.visitors)}명`}
          />
        </div>
        <Tip>
          구매전환율은 <B>구간별 방문 대비 구매확정</B>입니다(팔로워{" "}
          {formatNumber(followers.follower.confirmedOrders)}건 · 비팔로워{" "}
          {formatNumber(followers.nonFollower.confirmedOrders)}건 · 합계{" "}
          {formatNumber(confirmedSum)}건). 팔로워 수는 소비자 앱에서 이 쇼룸을
          팔로우한 소비자 기준이며, 기간 전체 추이와 팔로워 구성은{" "}
          <button
            type="button"
            onClick={onShowroomStats}
            className="cursor-pointer text-[11px] font-medium text-sz-accent-600 hover:underline"
          >
            쇼룸 관리 › 쇼룸 현황
          </button>
          에서 봅니다.
        </Tip>
      </CardBody>
    </Card>
  )
}

// ------------------------------------------------------------------ ⑤ 리워드

/**
 * 리워드 — 확정 거래액 → 판매 리워드 → 고정 지급비(브랜드 직접 지급 · 계약 금액) → 내 리워드 합계(세전 · 계약 기준).
 * 조정 협의(D3)는 원래 금액 · 내 요청 · 브랜드 최근 제안을 적되 응답 버튼이 없고, 합의 반영(D4)은
 * 원래 금액 · 조정 반영 · 확정 판매 리워드 세 줄을 남긴다. 실지급은 정산 행 값 그대로다.
 */
export function RewardSection(props: {
  detail: CreatorPerformanceDetail
  onSettlement: (settlementId: number) => void
}) {
  const { reward, groupBuy, sales } = props.detail
  const stage = reward.stage
  const stageValue = (className?: string) => (
    <span className={className}>{REWARD_STAGE_LABEL[stage]}</span>
  )
  const settlementId = reward.settlementId

  let salesRows: ReactNode
  if (reward.adjustment) {
    const agreedOn = formatEventMonthDay(reward.adjustment.agreedAt)
    const label = reward.adjustment.agreedProposalLabel
    salesRows = (
      <>
        <SumRow
          label="판매 리워드"
          sub="원래 금액 · 계약 기준"
          value={formatWonOrDash(reward.originalRewardAmount)}
        />
        <SumRow
          label="조정 반영"
          sub={
            label === "합의"
              ? `${agreedOn} 합의`
              : `${agreedOn} 합의 · ${label}에 동의`
          }
          value={formatSignedWon(reward.adjustment.delta)}
        />
        <SumRow
          label="확정 판매 리워드"
          value={formatWonOrDash(reward.finalRewardAmount)}
        />
      </>
    )
  } else if (stage === "AFTER_AGREEMENT") {
    salesRows = (
      <>
        <SumRow
          label="판매 리워드"
          sub="원래 금액"
          value={formatWonOrDash(reward.originalRewardAmount)}
        />
        {reward.myRequest && (
          <SumRow
            label="내 요청"
            sub={formatEventMonthDay(reward.myRequest.at)}
            value={formatWon(reward.myRequest.amount)}
          />
        )}
        {reward.counterProposal && (
          <SumRow
            label="브랜드 제안"
            sub={`최근 · ${formatEventMonthDay(reward.counterProposal.at)}`}
            value={formatWon(reward.counterProposal.amount)}
          />
        )}
      </>
    )
  } else {
    salesRows = (
      <SumRow
        label="판매 리워드"
        value={
          stage === "CONFIRMED"
            ? formatWonOrDash(reward.finalRewardAmount)
            : stageValue()
        }
      />
    )
  }

  return (
    <Card title="리워드" note="판매 리워드 + 고정 지급비">
      <CardBody>
        <div>
          <SumRow
            label={
              <>
                확정 거래액
                {sales.estimated && <EstTag />}
              </>
            }
            value={formatWonOrDash(reward.confirmedSalesAmount)}
          />
          {salesRows}
          <SumRow
            label="고정 지급비"
            sub="브랜드 직접 지급 · 계약 금액"
            value={formatWon(reward.fixedFeeAmount)}
          />
          <SumRow
            total
            label="내 리워드 합계"
            sub="세전 · 계약 기준"
            value={
              stage === "CONFIRMED"
                ? formatWonOrDash(reward.totalRewardAmount)
                : stageValue(
                    stage === "AFTER_AGREEMENT"
                      ? "text-sz-warning-text"
                      : undefined
                  )
            }
          />
        </div>
        <div className="mt-4 flex items-center gap-2.5">
          <ToneBadge tone={groupBuy.statusTone}>
            {groupBuy.statusLabel}
          </ToneBadge>
          <Btn
            variant="secondary"
            className="ml-auto"
            disabled={settlementId === null}
            onClick={() => {
              if (settlementId !== null) props.onSettlement(settlementId)
            }}
          >
            정산 상세 보기
          </Btn>
        </div>
        <div className="mt-3 border-t border-sz-n-200 pt-3">
          <SumRow
            label="판매 리워드 실지급"
            sub={reward.payout.note}
            value={
              stage === "CONFIRMED" && reward.payout.amount !== null
                ? formatWon(reward.payout.amount)
                : stageValue("text-sz-n-500")
            }
          />
        </div>
        <Tip>
          리워드는 <B>SHOWROOMZ가 지급</B>합니다 · 고정 지급비는{" "}
          <B>브랜드가 직접 지급</B>하는 계약 금액이라 플랫폼이 지급 여부를 알지
          못하며 실지급에 포함되지 않습니다 · 지급 명세는 <B>정산 관리</B>에서
          확인합니다.
        </Tip>
      </CardBody>
    </Card>
  )
}
