import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import { formatPercent, periodText } from "@/features/contracts/utils/format"
import {
  B,
  Checklist,
  DutyList,
  DutyRow,
  FRow,
  FSub,
  GbBadge,
  GbEmpty,
  GbStepper,
  KpiRow,
  PeriodProgress,
  type CheckRow,
  type GbStep,
  type KpiItem,
} from "@/features/groupBuy/components/shared/GbParts"
import {
  EMERGENCY_REASON_LABEL,
  POST_REASON_LABEL,
  SUSPENSION_CLAUSE_TEXT,
} from "@/features/groupBuy/constants/params"
import type { FulfillmentCheck } from "@/features/groupBuy/types"
import {
  type Detail,
  type SellingSituation,
  d,
  dt,
  dutyText,
  localDate,
  localMonthDay,
  md,
  mdDate,
  num,
  quantityText,
  won,
} from "@/features/groupBuy/utils/view"
import type { ReactNode } from "react"

/*
  시안 ui-studio-09-groupbuys 상세 카드 — 파트너센터와 같은 마크업이고 주체만 반대다.
  내 몫은 게시물 작성·연장 응답·이행 확인이며, 금액은 「내는 돈」이 아니라 「받는 돈」이다.
*/

const LIFECYCLE = ["준비중", "준비완료", "진행중", "종료", "정산완료"] as const

function lifecycleSteps(detail: Detail): Array<GbStep> {
  const { groupBuy, timeline, contract } = detail
  const whos = [
    `계약 체결 · ${mdDate(contract.concludedAt)}`,
    "3개 조건 충족",
    `${md(timeline.startAt)} 시작`,
    md(timeline.endAt),
    "판매 확정 후",
  ]
  const current = {
    PREPARING: 0,
    READY: 1,
    IN_PROGRESS: 2,
    SUSPENSION_SCHEDULED: 2,
    ENDED: 3,
    SETTLED: 4,
    SUSPENDED: 2,
  }[groupBuy.status]
  return LIFECYCLE.map((label, index) => ({
    label,
    who: whos[index],
    tone: index < current ? "done" : index === current ? "cur" : "todo",
  }))
}

/** 시안 B13 「중단 사유」 — 호수 본문만 굵게, 괄호 속 법령 예시는 보통 굵기 */
function ClauseText(props: { text: string }) {
  const index = props.text.indexOf("(")
  if (index <= 0) {
    return <B className="text-sz-n-900">{props.text}</B>
  }
  return (
    <>
      <B className="text-sz-n-900">{props.text.slice(0, index)}</B>
      {props.text.slice(index)}
    </>
  )
}

/** 시안 B5a · B13 — 경고 테두리 카드(헤더도 경고 배경) */
function AlertCard(props: {
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[8px] border border-sz-warning-text bg-white">
      <div className="flex items-center justify-between gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-warning-bg px-4 py-[11px]">
        <h2 className="text-[13px] font-semibold text-sz-n-900">
          {props.title}
        </h2>
        <span className="text-[11px] text-sz-n-500">{props.note}</span>
      </div>
      <div className="p-4">{props.children}</div>
    </section>
  )
}

// ── 좌측 맨 위 — 걸려 있는 일(B5a · B13 · B10 · B6) ───

export function SituationTopCard(props: {
  detail: Detail
  situation: SellingSituation
  canRespond: boolean
  onAccept: () => void
  onReject: () => void
}) {
  const { detail, situation, canRespond, onAccept, onReject } = props
  const { post, adminSuspension, activeRequest, extension, brand, timeline } =
    detail

  if (situation === "hidden" && post.hidden) {
    const hidden = post.hidden
    return (
      <AlertCard
        title="내 게시물이 쇼룸에서 내려갔습니다"
        note={`운영자 조치 · ${dt(hidden.hiddenAt)} · ${hidden.hiddenDays}일 경과`}
      >
        <Notice tone="warn">
          <B>쇼룸에서 내려가 새 소비자가 들어올 경로가 없습니다.</B> 공구는{" "}
          <B>진행중</B>이지만 게시물이 보이지 않아{" "}
          <B>신규 주문이 사실상 멈춥니다</B> — 기존 링크로 들어와도 게시물을 볼
          수 없습니다.
        </Notice>
        <Terms className="mt-3">
          <TermRow label="숨김 사유" labelWidth={96}>
            {hidden.detail ?? POST_REASON_LABEL[hidden.code] ?? hidden.code}
            <FSub>{dt(hidden.hiddenAt)} · 운영자</FSub>
          </TermRow>
        </Terms>
        <Notice tone="neutral" className="mt-3">
          <B>수정한다고 자동으로 다시 올라가지 않습니다</B> — 수정하면 운영자가
          내용을 확인한 뒤 해제합니다.{" "}
          <B>
            이미 접수된 주문의 배송 · 환불 · 소비자 응대는 브랜드가 계속 처리
          </B>
          하므로, 숨김 중에도 기존 주문은 정상적으로 진행됩니다.
        </Notice>
      </AlertCard>
    )
  }

  if (situation === "notice" && adminSuspension) {
    const days = adminSuspension.businessDaysUntilExecution
    const reason = adminSuspension.reasonClause
      ? SUSPENSION_CLAUSE_TEXT[adminSuspension.reasonClause]
      : null
    return (
      <AlertCard
        title="운영자 직권 중단이 예고되었습니다"
        note={`사전 통지 ${dt(adminSuspension.noticedAt)}${days !== null ? ` · 집행까지 D-${days}` : ""}`}
      >
        <Terms>
          <TermRow label="중단 사유" labelWidth={110}>
            <ClauseText text={reason ?? "운영자 직권 중단"} />
            <FSub>{adminSuspension.noticeBody}</FSub>
          </TermRow>
          <TermRow label="집행 예정 일시" labelWidth={110}>
            <span className="tabular-nums">
              <B className="text-sz-warning-text">
                {dt(adminSuspension.executeScheduledAt)}
              </B>
              {days !== null && ` · 영업일 기준 ${days}일 뒤`}
            </span>
          </TermRow>
          <TermRow label="통지 일시" labelWidth={110}>
            <span className="tabular-nums">
              {dt(adminSuspension.noticedAt)} · 운영자
            </span>
          </TermRow>
        </Terms>
        <Notice tone="warn" className="mt-4">
          <B>집행 전까지 공구는 계속 팔립니다 · 배송을 멈추지 마세요.</B> 지금
          들어오는 주문은 정상 주문이며, 접수된 주문의{" "}
          <B>배송 · 환불 · 소비자 응대는 브랜드가 계속</B> 처리합니다.
          예고만으로 게시물이 내려가지 않습니다.
        </Notice>
        <Notice tone="neutral" className="mt-3">
          집행되면 게시물은 <B>즉시 노출 중지 · 판매 차단</B>되며{" "}
          <B>재개할 수 없습니다</B>. 집행 전까지 결제 완료된 정상 주문의
          리워드는 <B>그대로 정산</B>되고, 이미 받은 고정 지급비는{" "}
          <B>플랫폼이 회수해 주지 않습니다</B>.
        </Notice>
      </AlertCard>
    )
  }

  if (
    (situation === "brandRequest" || situation === "myRequest") &&
    activeRequest
  ) {
    const mine = situation === "myRequest"
    const label =
      activeRequest.type === "EARLY_CLOSE" ? "조기 마감" : "공구 중단"
    return (
      <DetailCard
        title={mine ? `내 ${label} 요청` : `브랜드의 ${label} 요청`}
        note={
          mine
            ? "운영자 검토 중 · 결과는 알림으로 옵니다"
            : "운영자 검토 중 · 내가 할 조치는 없습니다"
        }
      >
        <Notice tone="warn">
          <B>공구는 지금도 계속 판매되고 있습니다.</B>{" "}
          {label === "조기 마감" ? "조기 마감" : "중단"}은 요청일 뿐 운영자 승인
          전까지 멈추지 않으니,{" "}
          <B>게시물을 내리거나 소비자 문의를 미루지 마세요</B>.
          <br />
          <br />
          <B>요청 사유</B> ·{" "}
          {activeRequest.reasonLabel ?? activeRequest.reasonCode}
          {mine && activeRequest.memo && (
            <>
              <br />
              {activeRequest.memo}
            </>
          )}
          <br />
          <span className="text-sz-n-500">
            {dt(activeRequest.requestedAt)} ·{" "}
            {mine ? "내 요청" : `${brand.name} 요청`} · 운영자 검토 중
          </span>
        </Notice>
        {activeRequest.type === "SUSPEND" ? (
          <Notice tone="neutral" className="mt-3">
            <B>승인되면</B> 신규 주문이 중단되고 공구가 <B>중단</B>으로 바뀝니다
            — 이미 받은 고정 지급비는 <B>플랫폼이 회수해 주지 않고</B>, 중단 전
            주문의 <B>판매 리워드는 그대로 정산</B>됩니다. <B>반려되면</B> 원래
            일정({dt(timeline.endAt)})대로 계속 진행됩니다.
            {!mine && (
              <>
                <br />
                중단에 동의하지 않는다면 결과가 나오기 전에{" "}
                <B>스레드에서 브랜드 · 운영자에게 의견을 남기세요</B> — 이
                화면에서 요청을 막을 수는 없습니다.
              </>
            )}
          </Notice>
        ) : (
          <Notice tone="neutral" className="mt-3">
            조기 마감은 <B>정상 종결</B>입니다 — 승인되면 상태가 <B>종료</B>가
            되고 접수된 주문의 리워드는 <B>그대로 정산</B>됩니다.{" "}
            <B>반려되면</B> 원래 일정({dt(timeline.endAt)})대로 계속 진행됩니다.
          </Notice>
        )}
      </DetailCard>
    )
  }

  if (situation === "extensionPending" && extension) {
    return (
      <DetailCard
        title="브랜드의 기간 연장 요청"
        note="내 수락이 있어야 반영됩니다"
      >
        <div className="rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 px-4 py-3.5">
          <div className="mb-2 text-[12px] font-semibold text-sz-n-900">
            {brand.name}
            {subjectParticle(brand.name)} 공구 기간 연장을 요청했습니다
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-[11px] text-sz-n-600">
            <span>현재 종료</span>
            <b className="font-semibold tabular-nums text-sz-n-900">
              {dt(extension.beforeEndAt)}
            </b>
            <span>연장 후 종료</span>
            <b className="font-semibold tabular-nums text-sz-n-900">
              {dt(extension.afterEndAt)} (+{extension.days}일)
            </b>
            <span>총 기간</span>
            <b className="font-semibold tabular-nums text-sz-n-900">
              {extension.beforeTotalDays}일 → {extension.afterTotalDays}일
            </b>
            <span>요청 사유</span>
            <span>{extension.reason || "—"}</span>
            <span>요청 일시</span>
            <b className="font-semibold tabular-nums text-sz-n-900">
              {dt(extension.requestedAt)}
            </b>
          </div>
          {canRespond && (
            <div className="mt-3.5 flex gap-2">
              <Btn variant="primary" onClick={onAccept}>
                수락
              </Btn>
              <Btn variant="secondary" onClick={onReject}>
                거절
              </Btn>
            </div>
          )}
          <div className="mt-2.5 text-[11px] leading-[1.7] text-sz-n-600">
            <B className="text-sz-n-900">수락하면 종료일이 즉시 바뀌고</B>{" "}
            소비자에게도 반영됩니다 — 되돌릴 수 없습니다.{" "}
            <B className="text-sz-n-900">답하지 않으면 변경 없이</B> 원래
            종료일({md(extension.beforeEndAt)})에 닫히며, 그 시각이 지나면
            수락할 수 없습니다.
            <br />
            연장된 기간에도{" "}
            <B className="text-sz-n-900">내 콘텐츠 의무는 그대로</B>
            이고, 늘어난 기간만큼{" "}
            <B className="text-sz-n-900">판매 리워드를 더 받을 수 있습니다</B>.
          </div>
        </div>
      </DetailCard>
    )
  }

  return null
}

// ── 준비 상황(B1 · B2 · B3 · B4) ────────────────────

export function ReadinessCard(props: {
  detail: Detail
  onWritePost: () => void
}) {
  const { detail, onWritePost } = props
  const { readiness, post, brand, timeline, permissions } = detail
  const gates = readiness?.gates ?? []
  const isReady = detail.groupBuy.status === "READY"
  const rejected = post.status === "REJECTED"
  const inReview = gates.some(gate => gate.state === "IN_REVIEW")

  const rows = gates.map<CheckRow>(gate => {
    const tone =
      gate.state === "DONE"
        ? "done"
        : gate.state === "MY_TURN"
          ? "wait"
          : "todo"
    switch (gate.key) {
      case "STOCK_CONFIRMED":
        return {
          key: gate.key,
          tone,
          label: "브랜드 준비 물량 확보",
          sub:
            gate.state === "DONE"
              ? `${brand.name} · ${mdDate(gate.doneAt)} 확인 완료`
              : `${brand.name} · 확인 전`,
          right: gate.state === "DONE" ? "완료" : "대기",
        }
      case "POST_SUBMITTED":
        if (gate.state === "MY_TURN") {
          return {
            key: gate.key,
            tone,
            label: rejected ? "내 공구 게시물 재등록" : "내 공구 게시물 등록",
            sub: rejected
              ? "나 · 반려 사유 반영 필요"
              : post.status === "WRITING"
                ? "나 · 임시저장됨 · 아직 등록하지 않음"
                : "나 · 아직 작성하지 않음",
            right: permissions.canWritePost ? (
              <Btn
                variant="primary"
                className="h-7 shrink-0"
                onClick={onWritePost}
              >
                {rejected
                  ? "게시물 수정"
                  : post.status === "WRITING"
                    ? "이어서 작성"
                    : "게시물 작성"}
              </Btn>
            ) : (
              "대기"
            ),
          }
        }
        return {
          key: gate.key,
          tone,
          label: "내 공구 게시물 등록",
          sub: gate.state === "DONE" ? `나 · ${md(gate.doneAt)} 제출` : "나",
          right: gate.state === "DONE" ? "완료" : "대기",
        }
      case "OPEN_APPROVED":
      default:
        return {
          key: gate.key,
          tone,
          label: "운영자 오픈 승인",
          sub:
            gate.state === "DONE"
              ? `${md(gate.doneAt)} 승인`
              : gate.state === "IN_REVIEW"
                ? `검토 중 · 영업일 ${readiness?.reviewSlaBusinessDays ?? 3}일${post.expectedReviewDate ? ` · ${localMonthDay(post.expectedReviewDate)} 예정` : ""}`
                : rejected
                  ? "재등록 후 다시 검토"
                  : `게시물 등록 후 검토 · 영업일 ${readiness?.reviewSlaBusinessDays ?? 3}일`,
          right:
            gate.state === "DONE"
              ? "완료"
              : gate.state === "IN_REVIEW"
                ? "진행 중"
                : "대기",
        }
    }
  })

  const note = isReady
    ? "조건 충족 · 시작일에 자동으로 열립니다"
    : rejected
      ? "승인 반려 — 재등록해야 공구가 열립니다"
      : inReview
        ? "운영자 검토 중 — 내가 할 일은 없습니다"
        : "3개 조건이 모두 충족되면 준비완료"

  const steps = lifecycleSteps(detail)
  const rejection = post.rejection
  const startPassed = timeline.startOverdue || timeline.daysUntilStart === null

  return (
    <DetailCard title="준비 상황" note={note}>
      <GbStepper steps={steps} />
      {rejected && (
        <Notice tone="warn" className="mt-4">
          <B>운영자가 게시물을 반려했습니다.</B> 사유를 반영해 <B>다시 등록</B>
          해야 공구가 열립니다 —{" "}
          {startPassed
            ? "시작 시각이 지나 재승인이 나는 즉시 열리지만, 종료일은 그대로라 판매 기간이 그만큼 줄어듭니다."
            : "시작일까지 반려 상태가 이어지면 공구는 열리지 않습니다."}
          {rejection && (
            <>
              <br />
              <br />
              <B>반려 사유</B> ·{" "}
              {rejection.detail ??
                POST_REASON_LABEL[rejection.code] ??
                rejection.code}
              <br />
              <span className="text-sz-n-500">
                {dt(rejection.rejectedAt)} · 운영자
              </span>
            </>
          )}
        </Notice>
      )}
      <Checklist className="mt-4" rows={rows} />
      {isReady && post.hidden ? (
        // 준비완료에서도 운영자가 숨길 수 있다 — 숨긴 채로 시작되면 소비자에게 보이지 않는다
        <Notice tone="warn" className="mt-4">
          <B>운영자가 내 게시물을 숨겼습니다.</B> 공구는 {dt(timeline.startAt)}
          에 그대로 시작되지만 <B>게시물이 소비자에게 보이지 않습니다</B> —
          사유를 반영해 게시물을 수정하면 운영자가 확인하고 숨김을 해제합니다.
          <br />
          <br />
          <B>숨김 사유</B> ·{" "}
          {post.hidden.detail ??
            POST_REASON_LABEL[post.hidden.code] ??
            post.hidden.code}
        </Notice>
      ) : isReady ? (
        <Notice tone="info" className="mt-4">
          <B>{dt(timeline.startAt)}에 자동으로 시작됩니다.</B> 내가 눌러야 하는
          시작 버튼은 없습니다. 게시물은 <B>예약</B> 상태로 대기하다가 시작
          시각에 소비자에게 공개됩니다.
        </Notice>
      ) : rejected ? null : inReview ? (
        <Notice tone="info" className="mt-4">
          <B>운영자가 게시물을 검토하고 있습니다.</B> 내가 할 일은 끝났고{" "}
          <B>결과를 기다리면 됩니다</B>. 승인되면 공구가 <B>준비완료</B>로
          바뀌고, 반려되면 사유와 함께 알림이 오니 게시물을 고쳐 다시 등록하면
          됩니다.
        </Notice>
      ) : startPassed ? (
        // 시작 시각이 지나도 공구는 취소되지 않는다 — 승인이 나는 즉시 열리고 종료일은 그대로다
        <Notice tone="warn" className="mt-4">
          <B>시작 시각이 지났습니다.</B> 게시물을 등록하고 운영자 승인(
          <B>영업일 {readiness?.reviewSlaBusinessDays ?? 3}일</B>)이 나는{" "}
          <B>즉시 공구가 열리지만</B> 종료일은 그대로라 판매 기간이 그만큼
          줄어듭니다. 늦어질수록 계약의 <B>게시 완료 기한</B>도 지키기
          어려워집니다.
        </Notice>
      ) : (
        <Notice tone="warn" className="mt-4">
          <B>시작일까지 {timeline.daysUntilStart}일 남았습니다.</B> 게시물 등록
          후 운영자 승인에{" "}
          <B>영업일 {readiness?.reviewSlaBusinessDays ?? 3}일</B>
          {readiness?.registrationDeadline && readiness.registrationOverdue ? (
            // 시안은 마감일 전만 그린다 — 지난 뒤에 「늦어도 지난 날짜까지」라고 하면 틀린 안내다
            <>
              이 걸리는데, 등록 마감일(
              <B>{localDate(readiness.registrationDeadline)}</B>)이 이미
              지났습니다. 지금 등록해도 시작일에 공구가 열리지 않을 수 있습니다.
            </>
          ) : readiness?.registrationDeadline ? (
            <>
              이 걸리므로, 늦어도{" "}
              <B>{localDate(readiness.registrationDeadline)}</B>까지 등록해야
              시작일에 공구가 열립니다.
            </>
          ) : (
            "이 걸리므로, 서둘러 등록해야 시작일에 공구가 열립니다."
          )}{" "}
          열리지 않으면 계약의 <B>게시 완료 기한</B>도 지킬 수 없습니다.
        </Notice>
      )}
    </DetailCard>
  )
}

// ── 진행 상황(B5 계열) ───────────────────────────────

export function SellingProgressCard(props: { detail: Detail }) {
  const { detail } = props
  const { timeline, adminSuspension, contract } = detail
  const scheduled =
    detail.groupBuy.status === "SUSPENSION_SCHEDULED" && adminSuspension
  const steps: Array<GbStep> = scheduled
    ? [
        {
          label: "준비중",
          who: `계약 체결 · ${mdDate(contract.concludedAt)}`,
          tone: "done",
        },
        { label: "준비완료", who: "3개 조건 충족", tone: "done" },
        { label: "진행중", who: `${md(timeline.startAt)} 시작`, tone: "done" },
        {
          label: "중단 예정",
          who: `집행 ${md(adminSuspension.executeScheduledAt)}`,
          tone: "cur",
        },
        { label: "중단", who: "집행 시 확정", tone: "todo" },
      ]
    : lifecycleSteps(detail)

  return (
    <DetailCard title="진행 상황" note={`${dt(timeline.endAt)} 종료 예정`}>
      <GbStepper steps={steps} />
      <PeriodProgress
        elapsedDays={timeline.elapsedDays}
        totalDays={timeline.totalDays}
        endText={dt(timeline.endAt)}
      />
    </DetailCard>
  )
}

// ── 판매 실적 KPI ───────────────────────────────────

export function SalesCard(props: { detail: Detail }) {
  const { detail } = props
  const { sales, orderClosure, groupBuy } = detail
  const basis =
    groupBuy.status === "SETTLED"
      ? "SETTLED"
      : groupBuy.status === "SUSPENDED"
        ? "AT_SUSPENSION"
        : groupBuy.status === "ENDED"
          ? "PROVISIONAL"
          : "LIVE"
  const { total, breakdown } = quantityText(detail)
  const orders = sales ? num(sales.orderCount) : "—"
  const quantity = sales ? num(total) : "—"
  const amount = sales ? num(sales.amount) : "—"
  const reward = sales ? num(sales.myReward) : "—"
  const unclosed = orderClosure?.unclosed.total
  // 시안 B5a — 숨김 중에는 「주문」 아래에 숨김 이후 들어온 건수를 쓴다
  const sinceHidden =
    detail.post.status === "HIDDEN" &&
    sales?.ordersSinceHidden !== null &&
    sales?.ordersSinceHidden !== undefined
      ? `숨김 이후 ${num(sales.ordersSinceHidden)}건`
      : null

  let title = "판매 실적"
  let note: string = "취소 · 반품 반영 · 확정 전 잠정치"
  let items: Array<KpiItem>
  let footer: ReactNode = null

  switch (basis) {
    case "PROVISIONAL":
      title = "판매 실적(잠정)"
      note = orderClosure
        ? `주문 ${num(orderClosure.totalCount)}건 전체 기준 · ${num(unclosed)}건 미확정`
        : "확정 전 잠정치"
      items = [
        { value: orders, label: "주문", sub: "누적" },
        { value: quantity, label: "판매 수량", sub: breakdown || "—" },
        { value: amount, label: "판매 금액(원)", sub: "확정 시 변동" },
        { value: reward, label: "내 리워드(원)", sub: "확정 시 변동" },
      ]
      break
    case "SETTLED":
      title = "확정 실적"
      // 시안 B8 「구매확정 308건 · 환불 4건 반영」 — 판매 모듈이 모르면(null) 건수 없이 쓴다
      note = sales
        ? [
            sales.purchaseConfirmedCount != null
              ? `구매확정 ${num(sales.purchaseConfirmedCount)}건`
              : "구매확정",
            sales.refundedCount != null
              ? `환불 ${num(sales.refundedCount)}건 반영`
              : "환불 반영",
          ].join(" · ")
        : "확정 실적"
      items = [
        {
          value: orders,
          label: "확정 주문",
          sub:
            sales?.refundedCount != null
              ? `환불 ${num(sales.refundedCount)}건 제외`
              : "환불 제외",
        },
        { value: quantity, label: "확정 수량", sub: breakdown || "—" },
        { value: amount, label: "확정 판매 금액(원)", sub: "확정" },
        { value: reward, label: "내 리워드(원)", sub: "지급 완료" },
      ]
      footer = (
        <Notice tone="neutral" className="mt-3">
          플랫폼 수수료 · 원천징수 등{" "}
          <B>공제 계산과 실입금액은 정산 관리(#7)</B>에서 봅니다. 이 화면의
          금액은 <B>공제 전</B> 확정 실적입니다.
        </Notice>
      )
      break
    case "AT_SUSPENSION":
      title = "중단 시점 실적"
      note = "중단 전 주문은 정상 정산됩니다"
      items = [
        { value: orders, label: "주문", sub: "중단 전 접수" },
        { value: quantity, label: "판매 수량", sub: breakdown || "—" },
        { value: amount, label: "판매 금액(원)", sub: "확정 대기" },
        { value: reward, label: "내 리워드(원)", sub: "정산 예정" },
      ]
      footer = (
        <Notice tone="neutral" className="mt-3">
          이미 접수된 주문의 <B>배송 · 환불은 브랜드가 계속 처리</B>합니다.
          소비자 문의가 오면 스레드로 브랜드에 전달하세요.
        </Notice>
      )
      break
    default:
      items = [
        { value: orders, label: "주문", sub: sinceHidden ?? "누적" },
        { value: quantity, label: "판매 수량", sub: breakdown || "—" },
        { value: amount, label: "판매 금액(원)", sub: "취소 · 반품 제외" },
        { value: reward, label: "내 리워드(원)", sub: "정산 시 지급" },
      ]
      footer = (
        <Notice tone="neutral" className="mt-3">
          주문 처리 · 배송 · 환불은 <B>브랜드 소관</B>입니다. 소비자 문의도
          브랜드가 답변하며, 이 화면에서는 <B>집계만</B> 봅니다.
        </Notice>
      )
  }

  return (
    <DetailCard title={title} note={note}>
      <KpiRow items={items} />
      {footer}
    </DetailCard>
  )
}

// ── 종결 후 진행 상황(B7 · B11 · B12 · B8 · B9) ───────

export function ClosedProgressCard(props: { detail: Detail }) {
  const { detail } = props
  const { groupBuy, orderClosure, closure, afterEnd } = detail

  if (groupBuy.status === "SUSPENDED") {
    const isAdmin =
      closure?.source === "ADMIN_NOTICE" ||
      closure?.source === "ADMIN_EMERGENCY"
    const requester = closure?.requester
    const reason = isAdmin
      ? closure?.adminBasis?.reasonClause
        ? SUSPENSION_CLAUSE_TEXT[closure.adminBasis.reasonClause]
        : closure?.adminBasis?.emergencyReason
          ? EMERGENCY_REASON_LABEL[closure.adminBasis.emergencyReason]
          : null
      : (requester?.reasonLabel ?? requester?.reasonCode)
    const who = isAdmin ? "운영자 직권" : requester?.mine ? "내" : "브랜드의"
    return (
      <DetailCard title="진행 상황" note="운영자 처리로 종결">
        <Notice tone="neutral" className="mb-4">
          <B>
            {isAdmin
              ? "운영자가 직권으로 공구를 중단했습니다."
              : `${who} 중단 요청이 승인되어 공구가 중단되었습니다.`}
          </B>{" "}
          신규 주문은 더 이상 받지 않으며 <B>내 게시물도 함께 종료</B>되어
          쇼룸에서 내려갔습니다 — 기간을 다 채우지 못하고{" "}
          <B>중단으로 내려간 건</B>입니다.{" "}
          <B>이미 받은 고정 지급비는 플랫폼이 회수해 주지 않고</B>(브랜드가 직접
          지급한 돈이라 되돌릴 대상이 없습니다),{" "}
          <B>
            중단 집행 시점 이전까지 결제 완료된 정상 주문의 리워드는 그대로 정산
          </B>
          됩니다. 다만 <B>중단 이후 잔여 기간에 관한 리워드 청구권은 소멸</B>
          합니다.
          {reason && (
            <>
              <br />
              <br />
              <B>중단 사유</B> · {reason}
              <br />
              <span className="text-sz-n-500">
                {dt(closure?.decidedAt ?? groupBuy.endedAt)} ·{" "}
                {isAdmin ? "운영자 직권" : "운영자 승인"}
                {requester &&
                  ` · ${requester.mine ? "내" : "브랜드"} 요청 ${mdDate(requester.requestedAt)}`}
              </span>
            </>
          )}
        </Notice>
        <GbStepper
          steps={[
            // 시안 B9 — 준비중 · 준비완료 · 진행중까지는 지나온 단계로 그대로 둔다.
            // 시작 전에 중단됐으면(준비완료 중 요청 승인) 진행중은 지나지 않은 칸이다
            ...lifecycleSteps(detail)
              .slice(0, 3)
              .map((step, index) =>
                index === 2 && groupBuy.openedAt === null
                  ? { ...step, who: "시작 전", tone: "todo" as const }
                  : { ...step, tone: "done" as const }
              ),
            {
              label: "중단",
              who: `${isAdmin ? "운영자 직권" : "운영자 승인"} · ${md(groupBuy.endedAt)}`,
              tone: "halt",
            },
          ]}
        />
      </DetailCard>
    )
  }

  if (groupBuy.status === "SETTLED") {
    return (
      <DetailCard title="진행 상황" note="실적 확정 · 정산 지급 완료">
        <GbStepper steps={lifecycleSteps(detail)} />
        <Notice tone="success" className="mt-4">
          <B>정산이 완료되었습니다.</B> 확정 실적 기준으로 리워드가
          지급되었습니다 — <B>공제 내역과 실입금액</B>은 정산 관리에서
          확인하세요.
        </Notice>
      </DetailCard>
    )
  }

  // ENDED
  const unclosed = orderClosure?.unclosed
  const awaiting = unclosed?.awaitingShipment
  const returning = unclosed?.inReturnOrExchange
  const onHold = afterEnd?.fulfillment?.onHold ?? false

  return (
    <DetailCard title="진행 상황" note="판매 종료 · 리워드 확정 대기">
      <GbStepper steps={lifecycleSteps(detail)} />
      <Notice tone="info" className="mt-4">
        {onHold ? (
          <>
            <B>
              배송 · 반품이 정리돼도 이행 합의가 끝나기 전에는 실적 확정 ·
              정산이 진행되지 않습니다.
            </B>{" "}
            {unclosed &&
              `배송중 ${num(awaiting)}건 · 반품 처리중 ${num(returning)}건이 남아 있고, `}
            그 처리와 별개로 <B>연결·소통 스레드의 합의가 선행</B>되어야 합니다.
          </>
        ) : (
          <>
            <B>구매확정이 끝나야 내 리워드가 확정됩니다.</B>{" "}
            {unclosed && unclosed.total > 0
              ? `배송중 ${num(awaiting)}건과 반품 처리중 ${num(returning)}건이 남아 있어 금액이 아직 잠정치입니다. `
              : ""}
            처리 주체는 <B>브랜드</B>이며, 정리되면 자동으로 확정됩니다.
          </>
        )}
      </Notice>
      {orderClosure && (
        <Checklist
          className="mt-4"
          rows={[
            {
              key: "closed",
              tone: "done",
              label: "구매확정",
              sub: "리워드 확정 대상",
              right: `${num(orderClosure.closedCount)}건`,
            },
            {
              key: "shipping",
              tone: "todo",
              label: "배송 처리 대기",
              sub: "브랜드 소관 · 송장 등록 · 배송 완료 필요",
              right: `${num(awaiting)}건`,
            },
            {
              key: "return",
              tone: "todo",
              label: "반품 처리중",
              sub: "입고 확인 후 환불 · 리워드에서 차감",
              right: `${num(returning)}건`,
            },
          ]}
        />
      )}
    </DetailCard>
  )
}

function checkValue(check: FulfillmentCheck | null) {
  if (!check) {
    return { value: "확인 전", tone: "none" as const }
  }
  return check.result === "FULFILLED"
    ? { value: "이행", tone: "ok" as const }
    : { value: "미이행", tone: "bad" as const }
}

/** B7 · B11 · B12 「계약 이행 확인」 — 확인 대상은 상대(브랜드)의 의무다 */
export function FulfillmentCard(props: {
  detail: Detail
  onCheck: () => void
}) {
  const { detail, onCheck } = props
  const fulfillment = detail.afterEnd?.fulfillment
  if (!fulfillment) {
    return null
  }
  const { mine, theirs, myTarget, theirTarget, dueAt, resolvedAt } = fulfillment
  const brandName = detail.brand.name
  const mineValue = checkValue(mine)
  const theirsValue = checkValue(theirs)
  const disputed =
    mine?.result === "UNFULFILLED" || theirs?.result === "UNFULFILLED"

  const note = !mine
    ? "양측이 서로의 이행을 확인해야 정산이 시작됩니다"
    : mine.result === "UNFULFILLED"
      ? `미이행 제출 · ${dt(mine.checkedAt)}`
      : `확인 완료 · ${dt(mine.checkedAt)}`

  let banner: ReactNode
  if (!mine) {
    banner = (
      <Notice tone="warn">
        <B>브랜드가 계약을 이행했는지 확인해 주세요.</B> 내 이행 여부는 브랜드가
        같은 방식으로 확인합니다. 판단은{" "}
        <B>항목별이 아니라 계약 전체에 대해 한 번</B>입니다.{" "}
        <B>양측이 모두 «이행»으로 확인하면 정산이 시작</B>되고, 한쪽이라도
        «미이행»을 선택하면 <B>연결·소통에 3자 스레드</B>가 열려 브랜드 ·
        운영자와 함께 합의하게 됩니다.
      </Notice>
    )
  } else if (disputed && resolvedAt) {
    banner = (
      <Notice tone="success">
        <B>3자 스레드에서 합의가 끝나 정산 보류가 해제되었습니다.</B> 실적이
        확정되는 대로 정산이 진행됩니다.
      </Notice>
    )
  } else if (mine.result === "UNFULFILLED") {
    banner = (
      <Notice tone="danger">
        <B>브랜드 이행을 «미이행»으로 제출했습니다.</B> <B>연결·소통</B>에 나 ·{" "}
        {brandName} · 운영자가 참여하는 스레드가 열렸고, 제출한 내용이 첫 글로
        등록되었습니다.
        <br />
        <B>합의가 끝날 때까지 정산은 보류</B>되며 리워드 지급도 미뤄집니다.
      </Notice>
    )
  } else if (theirs?.result === "UNFULFILLED") {
    banner = (
      <Notice tone="danger">
        <B>브랜드가 내 이행을 «미이행»으로 제출했습니다.</B> <B>연결·소통</B>의
        3자 스레드에서 합의가 끝날 때까지 <B>정산은 보류</B>됩니다.
      </Notice>
    )
  } else if (theirs) {
    banner = (
      <Notice tone="success">
        <B>브랜드 이행을 «이행»으로 확인했습니다.</B> 브랜드도 내 이행을
        «이행»으로 확인해 <B>양측 확인이 끝났습니다</B> — 실적이 확정되는 대로
        정산이 진행됩니다.
      </Notice>
    )
  } else {
    banner = (
      <Notice tone="info">
        <B>브랜드 이행을 «이행»으로 확인했습니다.</B> 브랜드가 내 이행을
        확인하면 정산이 시작됩니다.
      </Notice>
    )
  }

  return (
    <DetailCard title="계약 이행 확인" note={note}>
      {banner}
      <DutyList className="mt-4">
        <DutyRow
          label={mine ? "내가 확인한 대상" : "내가 확인할 대상"}
          sub={`${brandName}의 의무 — ${dutyText(myTarget)}`}
          value={mineValue.value}
          valueTone={mineValue.tone}
        />
        <DutyRow
          readOnly
          label={theirs ? "브랜드가 확인한 대상" : "브랜드가 확인할 대상"}
          sub={`내 의무 — ${dutyText(theirTarget)}`}
          value={theirsValue.value}
          valueTone={theirsValue.tone}
        />
      </DutyList>
      {!mine ? (
        <>
          <Notice tone="neutral" className="mt-3">
            확인 기한은 <B>{d(dueAt)}</B>입니다.
            {fulfillment.autoConfirmOnTimeout ? (
              <>
                {" "}
                기한까지 답하지 않으면 <B>이행으로 처리</B>되어 정산이 자동으로
                진행됩니다 — 문제가 있다면 기한 전에 «미이행»을 선택해 주세요.
              </>
            ) : (
              " 문제가 있다면 기한 전에 «미이행»을 선택해 주세요."
            )}
          </Notice>
          {detail.permissions.canCheckFulfillment && (
            <div className="mt-4 flex justify-end">
              <Btn variant="primary" onClick={onCheck}>
                계약 이행 확인
              </Btn>
            </div>
          )}
        </>
      ) : mine.result === "UNFULFILLED" ? (
        mine.reason && (
          <Notice tone="neutral" className="mt-3">
            내가 제출한 내용 — “{mine.reason}”
          </Notice>
        )
      ) : (
        <Notice tone="neutral" className="mt-3">
          이행 확인은 <B>되돌릴 수 없습니다</B>. 확인 이후 문제가 발견되면{" "}
          <B>연결·소통</B>에서 브랜드 · 운영자와 별도로 논의해야 합니다.
        </Notice>
      )}
    </DetailCard>
  )
}

// ── 공구 정보 · 내가 받는 금액 · 게시물 · 상품 ─────────

export function InfoCard(props: {
  detail: Detail
  onOpenThread: () => void
  onOpenContract: () => void
}) {
  const { detail, onOpenThread, onOpenContract } = props
  const { brand, contract, timeline, fixedFee, groupBuy, permissions } = detail
  const isSuspended = groupBuy.status === "SUSPENDED"

  return (
    <DetailCard
      title="공구 정보"
      note={
        isSuspended ? "종결된 공구 · 읽기 전용" : "계약에서 상속 · 변경 불가"
      }
    >
      <FRow label="브랜드">
        {brand.name}{" "}
        {permissions.canOpenPairThread && (
          <button type="button" className={FLINK_CLASS} onClick={onOpenThread}>
            스레드 열기
          </button>
        )}
      </FRow>
      <FRow label="원 계약">
        <span className="tabular-nums">{contract.contractNumber}</span>{" "}
        <button type="button" className={FLINK_CLASS} onClick={onOpenContract}>
          계약서 보기
        </button>
        {!isSuspended && (
          <FSub>{d(contract.concludedAt)} 체결 · 계약 1건당 공구 1건</FSub>
        )}
      </FRow>
      <FRow label="공구 기간">
        <span className="tabular-nums">
          {periodText(timeline.startAt, timeline.endAt)}{" "}
          <span className="text-sz-n-500">
            {/* 시안 B9 — 중단된 공구는 일수 대신 중단일을 붙인다 */}
            {isSuspended
              ? `(${mdDate(groupBuy.endedAt)} 중단)`
              : `(${timeline.totalDays}일)`}
          </span>
        </span>
      </FRow>
      <FRow label="고정 지급비">
        {fixedFee.amount === null ? (
          "없음"
        ) : (
          <>
            <span className="tabular-nums">{won(fixedFee.amount)}</span>
            <FSub>
              지급 시점 <B>{fixedFee.triggerLabel ?? "—"}</B> ·{" "}
              <B>브랜드 직접 지급</B>
              {isSuspended && fixedFee.amount > 0 && (
                <>
                  {" "}
                  · <B>플랫폼이 회수해 주지 않습니다</B>
                </>
              )}
            </FSub>
          </>
        )}
      </FRow>
    </DetailCard>
  )
}

/** 「내가 받는 금액」 — 비종결에서만. 브랜드 직접 지급이라 미보증 사실과 분쟁 경로를 함께 적는다 */
export function PayoutCard(props: { detail: Detail }) {
  const { payout } = props.detail
  if (!payout) {
    return null
  }
  return (
    <DetailCard
      title="내가 받는 금액"
      note="공제 전 금액 · 실지급액은 정산 관리"
    >
      <div className="rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 px-4 py-3.5">
        <div className="text-[11px] text-sz-n-600">고정 지급비</div>
        <div className="mt-[2px] text-[22px] font-semibold leading-[1.3] tabular-nums text-sz-accent-600">
          {payout.fixedFeeAmount === null ? "없음" : won(payout.fixedFeeAmount)}
        </div>
        <div className="mt-1 text-[11px] leading-[1.6] text-sz-n-600">
          이 금액은 <B className="text-sz-n-900">브랜드가 직접 지급</B>합니다.
          플랫폼은 지급을 보증하지 않으며, 지급이 이루어지지 않으면{" "}
          <B className="text-sz-n-900">이슈 스레드에서 운영자 중재</B>를 요청할
          수 있습니다. <B className="text-sz-n-900">계약서가 근거</B>가 됩니다.
        </div>
      </div>
      {payout.salesReward && (
        <Terms className="mt-3">
          <TermRow label="판매 리워드(잠정)">
            <span className="tabular-nums">
              <B className="text-sz-n-900">{won(payout.salesReward.amount)}</B>{" "}
              — 공구 종료 후 구매확정 · 반품이 정리되면 확정됩니다
            </span>
          </TermRow>
        </Terms>
      )}
      <Notice tone="consent" className="mt-3">
        판매 리워드는 공구가 끝나고 <B>구매확정 · 반품이 정리된 뒤</B>{" "}
        확정됩니다. 표시 금액은 <B>세금 등 공제 전</B> 기준입니다.
      </Notice>
    </DetailCard>
  )
}

function postFooter(detail: Detail): ReactNode {
  switch (detail.post.status) {
    case "PENDING_APPROVAL":
      return (
        <>
          검토 중에는 게시물을 <B>수정할 수 없습니다</B>. 고쳐야 할 내용이
          있으면 승인 결과를 기다린 뒤 수정하세요.
        </>
      )
    case "REJECTED":
      return (
        <>
          반려된 게시물은 <B>소비자에게 보이지 않습니다</B>. 사유를 반영해
          수정하고 다시 등록하면 운영자가 재검토합니다.
        </>
      )
    case "SCHEDULED":
      return (
        <>
          승인 이후에는 <B>자유롭게 수정할 수 있습니다</B> — 다시 승인받을
          필요가 없습니다. 검토는 <B>최초 등록 때 한 번</B>만 합니다.
          <br />
          <B>승인 후 수정한 내용으로 생기는 법적 책임은 나에게 있으며</B>,
          운영자는 법령 준수 · 소비자 보호를 위해{" "}
          <B>삭제 · 노출 중지 · 수정 요청</B>을 할 수 있습니다.
        </>
      )
    case "EXPOSED":
    case "HIDDEN":
      return (
        <>
          진행 중에도 <B>제목 · 본문은 자유롭게 수정</B>할 수 있고{" "}
          <B>재승인 없이 바로 반영</B>됩니다. 다만{" "}
          <B>가격 · 상품 구성은 계약 확정값</B>이라 바꿀 수 없습니다.
          <br />
          <B>승인 후 수정한 내용으로 생기는 법적 책임은 나에게 있으며</B>,
          운영자는 법령 준수 · 소비자 보호를 위해{" "}
          <B>삭제 · 노출 중지 · 수정 요청</B>을 할 수 있습니다.
        </>
      )
    default:
      return null
  }
}

export function PostCard(props: { detail: Detail; onWritePost: () => void }) {
  const { detail, onWritePost } = props
  const { post, items, timeline, groupBuy, permissions } = detail
  const hasPost = post.status !== "NOT_WRITTEN" && post.status !== "WRITING"
  const footer = postFooter(detail)

  const meta: Array<string> = []
  if (post.submittedAt) {
    meta.push(`등록 ${dt(post.submittedAt)}`)
  }
  if (post.status === "PENDING_APPROVAL") {
    meta.push(`오픈 예정 ${dt(timeline.startAt)}`)
  } else if (post.status === "REJECTED") {
    meta.push(`반려 ${dt(post.rejection?.rejectedAt ?? post.reviewedAt)}`)
  } else if (post.status === "SCHEDULED") {
    meta.push(`오픈 ${dt(timeline.startAt)}`)
  } else if (post.status === "EXPOSED" || post.status === "HIDDEN") {
    meta.push(`오픈 ${dt(post.openedAt ?? groupBuy.openedAt)}`)
  }
  if (
    post.lastEditedAt &&
    (post.status === "EXPOSED" ||
      post.status === "HIDDEN" ||
      post.status === "SCHEDULED")
  ) {
    meta.push(`최근 수정 ${dt(post.lastEditedAt)}`)
  }

  return (
    <DetailCard title="내 공구 게시물" note="쇼룸에 노출되는 판매 게시물">
      {!hasPost ? (
        <>
          <GbEmpty
            compact
            title={
              post.status === "WRITING"
                ? "임시저장한 게시물이 있습니다"
                : "아직 게시물을 작성하지 않았습니다"
            }
            action={
              permissions.canWritePost && (
                <Btn variant="primary" onClick={onWritePost}>
                  {post.status === "WRITING"
                    ? "이어서 작성"
                    : "공구 게시물 작성"}
                </Btn>
              )
            }
          >
            공구 게시물을 등록해야 운영자 승인을 거쳐 공구가 열립니다.
            <br />
            계약 상품 {items.length}건은 <B>자동으로 담기며</B> 가격도 계약
            확정값으로 고정됩니다.
          </GbEmpty>
          <Notice tone="neutral" className="mt-3">
            공구 게시물은 <B>일반 게시물(#5)과 다릅니다</B> — 제목이 필수이고,
            계약 상품이 자동으로 담기며, 대가관계 표시가 자동 삽입됩니다. 공구
            1건당 게시물 1개만 만들 수 있습니다.
          </Notice>
        </>
      ) : (
        <>
          <div className="rounded-[6px] border border-sz-n-200 px-4 py-3.5">
            <div className="mb-[3px] flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-sz-n-900">
              {post.title ?? "(제목 없음)"}
              <GbBadge tone={post.statusTone}>{post.statusLabel}</GbBadge>
            </div>
            {post.content && (
              <div className="whitespace-pre-line text-[11px] leading-[1.65] text-sz-n-600">
                {post.content}
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {items.map((item, index) => (
                <span
                  key={`${item.productId ?? "x"}-${index}`}
                  className="rounded-[6px] bg-sz-n-100 px-[9px] py-1 text-[11px] text-sz-n-700"
                >
                  {item.productName} · {won(item.groupBuyPrice)}
                </span>
              ))}
            </div>
            {meta.length > 0 && (
              <div className="mt-1.5 text-[11px] tabular-nums text-sz-n-500">
                {meta.join(" · ")}
              </div>
            )}
          </div>
          {footer && (
            <Notice tone="neutral" className="mt-3">
              {footer}
            </Notice>
          )}
        </>
      )}
    </DetailCard>
  )
}

export function ItemsCard(props: { detail: Detail }) {
  const { detail } = props
  return (
    <DetailCard
      title="공구 상품 항목"
      note={`${detail.items.length}건 · 공구가 · 내 리워드율은 계약 확정값`}
    >
      <Terms>
        {detail.items.map((item, index) => (
          <TermRow
            key={`${item.productId ?? "x"}-${index}`}
            labelWidth={176}
            label={item.productName}
          >
            <span className="tabular-nums">
              공구가 <B className="text-sz-n-900">{won(item.groupBuyPrice)}</B>{" "}
              · 내 리워드율{" "}
              <B className="text-sz-n-900">
                {formatPercent(item.myRewardRate)}
              </B>{" "}
              · 개당 리워드 {won(item.unitReward)}
            </span>
            {/* 옵션 상품 — 판매가만 다르고 리워드는 상품 공구가 기준이라 옵션마다 같다 */}
            {(item.options ?? []).some(
              option => option.variantName !== null
            ) && (
              <FSub>
                옵션 —{" "}
                {item.options
                  .map(
                    option =>
                      `${option.variantName ?? "단품"} ${won(option.salePrice)}`
                  )
                  .join(" / ")}
              </FSub>
            )}
          </TermRow>
        ))}
      </Terms>
      <Notice tone="neutral" className="mt-3">
        공구가와 리워드율은 <B>체결된 계약의 확정값</B>이라 여기서 바꿀 수
        없습니다. 브랜드의 <B>준비 물량</B>은 브랜드 소관이라 표시하지 않습니다.
      </Notice>
    </DetailCard>
  )
}

/** 받침 유무로 주격 조사를 고른다 — 「글로우랩이」 · 「○○ 브랜드가」 */
function subjectParticle(word: string) {
  const last = word.charCodeAt(word.length - 1)
  const isHangul = last >= 0xac00 && last <= 0xd7a3
  return isHangul && (last - 0xac00) % 28 !== 0 ? "이" : "가"
}
