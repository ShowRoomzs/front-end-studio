import DetailCard, { MetaRow } from "@/common/components/DetailCard/DetailCard"
import HistoryList from "@/common/components/HistoryList/HistoryList"
import Btn from "@/features/contracts/components/shared/Btn"
import { B, GbBadge } from "@/features/groupBuy/components/shared/GbParts"
import { toGroupBuyHistoryItems } from "@/features/groupBuy/utils/history"
import {
  type Detail,
  type SellingSituation,
  d,
  dt,
  fixedFeeShort,
  localDate,
  num,
  won,
} from "@/features/groupBuy/utils/view"
import type { ReactNode } from "react"

export interface StudioRailActions {
  onWritePost: () => void
  onOpenThread: () => void
  onOpenFulfillmentThread: () => void
  onAcceptExtension: () => void
  onRejectExtension: () => void
  onSuspension: () => void
  onCheckFulfillment: () => void
  onGoSettlement: () => void
}

function Hint(props: { children: ReactNode }) {
  return (
    <p className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
      {props.children}
    </p>
  )
}

function Warn(props: { children: ReactNode }) {
  return (
    <span className="font-semibold text-sz-warning-text">{props.children}</span>
  )
}

/** 시안 `.due` — 기한 날짜는 경고색 굵게 */
function Due(props: { children: ReactNode }) {
  return <Warn>{props.children}</Warn>
}

/**
 * 우측 레일 「상태」 — 현재 상태 · 메타 · 액션 · 힌트. 버튼 노출은 서버 permissions로만 고른다.
 */
export function StudioStatusRail(props: {
  detail: Detail
  situation: SellingSituation | null
  actions: StudioRailActions
}) {
  const { detail, situation, actions } = props
  const {
    groupBuy,
    timeline,
    post,
    permissions,
    readiness,
    contract,
    sales,
    orderClosure,
    afterEnd,
    extension,
    activeRequest,
    adminSuspension,
  } = detail
  const postBadge = <GbBadge tone={post.statusTone}>{post.statusLabel}</GbBadge>
  const rows: Array<{ label: string; value: ReactNode }> = []
  const buttons: Array<ReactNode> = []
  let hint: ReactNode = null

  const threadButton = permissions.canOpenPairThread ? (
    <Btn
      key="thread"
      variant="secondary"
      className="w-full"
      onClick={actions.onOpenThread}
    >
      스레드 열기
    </Btn>
  ) : null
  const dueRow = contract.contentDueDate
    ? {
        label: "게시 완료 기한",
        value: <Due>{localDate(contract.contentDueDate)}</Due>,
      }
    : null

  switch (groupBuy.status) {
    case "PREPARING": {
      const left = (readiness?.gates ?? []).filter(
        gate => gate.state !== "DONE"
      )
      const myTurn = left.some(gate => gate.state === "MY_TURN")
      rows.push(
        {
          label: "남은 조건",
          value: myTurn ? <Warn>{left.length}개</Warn> : `${left.length}개`,
        },
        { label: "시작 예정", value: dt(timeline.startAt) },
        { label: "내 게시물", value: postBadge }
      )
      if (post.status === "REJECTED") {
        rows.push({
          label: "반려 일시",
          value: dt(post.rejection?.rejectedAt ?? post.reviewedAt),
        })
      }
      rows.push({ label: "고정 지급비", value: fixedFeeShort(detail) })
      if (dueRow && post.status !== "REJECTED") {
        rows.push(dueRow)
      }
      if (permissions.canWritePost) {
        buttons.push(
          <Btn
            key="write"
            variant="primary"
            className="w-full"
            onClick={actions.onWritePost}
          >
            {post.status === "REJECTED"
              ? "게시물 수정 후 재등록"
              : post.status === "WRITING"
                ? "이어서 작성"
                : "공구 게시물 작성"}
          </Btn>
        )
      }
      buttons.push(threadButton)
      hint =
        post.status === "PENDING_APPROVAL" ? (
          <Hint>
            승인 결과는 <B>알림</B>으로 옵니다. 검토 중에는 게시물을 수정할 수
            없고, 취소하거나 재제출할 수도 없습니다.
          </Hint>
        ) : post.status === "REJECTED" ? (
          <Hint>
            반려는 <B>게시물에 대한 조치</B>이며 계약이 깨진 것은 아닙니다.
            표현을 고쳐 다시 등록하면 됩니다. 시작일 전에 승인이 나지 않으면{" "}
            <B>브랜드와 일정을 협의</B>하세요.
          </Hint>
        ) : (
          <Hint>
            기간 · 가격 · 리워드율은 <B>계약 확정값</B>이라 바꿀 수 없습니다.
            조정이 필요하면 <B>스레드에서 브랜드와 협의</B>하세요 — 변경은 새
            계약으로만 가능합니다.
          </Hint>
        )
      break
    }
    case "READY": {
      rows.push(
        {
          label: "시작까지",
          value:
            timeline.daysUntilStart !== null
              ? `${timeline.daysUntilStart}일`
              : "—",
        },
        { label: "시작 예정", value: dt(timeline.startAt) },
        { label: "내 게시물", value: postBadge },
        { label: "고정 지급비", value: fixedFeeShort(detail) }
      )
      if (dueRow) {
        rows.push(dueRow)
      }
      if (permissions.canEditPost) {
        buttons.push(
          <Btn
            key="edit"
            variant="secondary"
            className="w-full"
            onClick={actions.onWritePost}
          >
            게시물 수정
          </Btn>
        )
      }
      buttons.push(threadButton)
      hint = (
        <Hint>
          게시물은 <B>승인 후에도 자유롭게 수정</B>할 수 있습니다(재승인 없음).
          시작 시각은 <B>계약 확정값</B>이라 앞당기거나 미룰 수 없습니다. 기간
          연장은 <B>공구가 시작된 뒤</B> 브랜드가 요청할 수 있습니다.
        </Hint>
      )
      break
    }
    case "IN_PROGRESS":
    case "SUSPENSION_SCHEDULED": {
      const myReward = sales ? won(sales.myReward) : "—"
      if (situation === "notice" && adminSuspension) {
        const days = adminSuspension.businessDaysUntilExecution
        rows.push(
          {
            label: "집행까지",
            value: <Warn>{days !== null ? `${days}영업일` : "—"}</Warn>,
          },
          {
            label: "집행 예정",
            value: <Due>{dt(adminSuspension.executeScheduledAt)}</Due>,
          },
          { label: "내 게시물", value: postBadge },
          { label: "내 리워드(잠정)", value: myReward }
        )
        buttons.push(threadButton)
        hint = (
          <Hint>
            이 통지에 대한 <B>이의 · 소명 접수는 브랜드를 통해</B> 이뤄집니다 —
            사유에 이견이 있으면 <B>스레드에서 브랜드 · 운영자와 논의</B>해
            주세요.
          </Hint>
        )
        break
      }

      rows.push(
        {
          label: "종료까지",
          value:
            timeline.daysUntilEnd !== null ? `${timeline.daysUntilEnd}일` : "—",
        },
        { label: "종료 예정", value: dt(timeline.endAt) }
      )
      if (situation === "extensionPending" && extension) {
        rows.push(
          {
            label: "연장 요청",
            value: <GbBadge tone="INFO">내 응답 대기</GbBadge>,
          },
          {
            label: "응답 기한",
            value: (
              <Due>{dt(extension.respondDeadlineAt ?? timeline.endAt)}</Due>
            ),
          }
        )
      }
      rows.push({ label: "내 게시물", value: postBadge })
      if (situation === "hidden" && post.hidden) {
        rows.push({
          label: "숨김 경과",
          value: <Warn>{post.hidden.hiddenDays}일</Warn>,
        })
      }
      if (
        (situation === "brandRequest" || situation === "myRequest") &&
        activeRequest
      ) {
        rows.push({
          label:
            activeRequest.type === "EARLY_CLOSE"
              ? "조기 마감 요청"
              : "중단 요청",
          value: <GbBadge tone="WARNING">운영자 검토 중</GbBadge>,
        })
      }
      if (situation !== "extensionPending") {
        rows.push({ label: "내 리워드(잠정)", value: myReward })
      }

      if (situation === "extensionPending" && permissions.canRespondExtension) {
        buttons.push(
          <Btn
            key="accept"
            variant="primary"
            className="w-full"
            onClick={actions.onAcceptExtension}
          >
            연장 수락
          </Btn>,
          <Btn
            key="reject"
            variant="secondary"
            className="w-full"
            onClick={actions.onRejectExtension}
          >
            연장 거절
          </Btn>
        )
      } else if (permissions.canEditPost) {
        buttons.push(
          <Btn
            key="edit"
            variant={situation === "hidden" ? "primary" : "secondary"}
            className="w-full"
            onClick={actions.onWritePost}
          >
            게시물 수정
          </Btn>
        )
      }
      if (situation !== "extensionPending") {
        buttons.push(threadButton)
      }
      if (permissions.canRequestSuspension) {
        buttons.push(
          <Btn
            key="suspend"
            variant="danger"
            className="w-full"
            onClick={actions.onSuspension}
          >
            공구 중단 요청
          </Btn>
        )
      }

      hint =
        situation === "hidden" ? (
          <Hint>
            숨김을 푸는 방법은 <B>지적된 내용을 고치는 것</B> 하나입니다 —
            해제는 <B>운영자가</B> 합니다. 공구 기간은{" "}
            <B>숨김과 무관하게 흘러가므로</B> 빨리 수정할수록 판매할 수 있는
            날이 남습니다.
          </Hint>
        ) : situation === "brandRequest" ? (
          <Hint>
            검토 결과는 <B>알림</B>으로 옵니다. 요청을{" "}
            <B>수락 · 거절할 권한은 나에게 없고</B>(연장과 다릅니다) 결정은
            운영자가 합니다. 내가 발신하는 중단 요청은 <B>진행중 상태에서</B> 할
            수 있지만, 이미 검토 중인 요청이 있어{" "}
            <B>지금은 추가로 요청할 수 없습니다</B> — 의견이 있으면{" "}
            <B>스레드</B>로 남기세요.
          </Hint>
        ) : situation === "myRequest" ? (
          <Hint>
            중단 요청은 <B>취소할 수 없습니다.</B> 검토 결과는 <B>알림</B>으로
            오며, 그동안 공구는 계속 팔립니다.
          </Hint>
        ) : situation === "extensionPending" ? (
          <Hint>
            연장 요청은 <B>공구 상태를 바꾸지 않습니다</B> — 답하기 전까지
            공구는 원래 일정대로 진행됩니다. 조건을 조정하고 싶으면 답하기 전에{" "}
            <B>스레드에서 협의</B>하세요. 연장 응답과 별개로{" "}
            <B>공구 중단은 언제든 요청</B>할 수 있습니다.
          </Hint>
        ) : (
          <Hint>
            <B>기간 연장은 브랜드만</B> 요청할 수 있지만,{" "}
            <B>공구 중단은 나도 요청</B>할 수 있습니다 — 운영자 검토를 거치며{" "}
            <B>요청해도 공구는 즉시 멈추지 않습니다</B>.
          </Hint>
        )
      break
    }
    case "ENDED": {
      const fulfillment = afterEnd?.fulfillment
      const mine = fulfillment?.mine
      const theirs = fulfillment?.theirs
      const disputed =
        mine?.result === "UNFULFILLED" || theirs?.result === "UNFULFILLED"
      rows.push({ label: "종료일시", value: dt(groupBuy.endedAt) })
      if (orderClosure) {
        rows.push(
          {
            label: "구매확정",
            value: `${num(orderClosure.closedCount)} / ${num(orderClosure.totalCount)}건`,
          },
          {
            label: "미확정",
            value: <Warn>{num(orderClosure.unclosed.total)}건</Warn>,
          }
        )
      }
      rows.push({
        label: "이행 확인",
        value: disputed ? (
          mine?.result === "UNFULFILLED" ? (
            <GbBadge tone="DANGER">미이행 제출</GbBadge>
          ) : (
            <GbBadge tone="DANGER">브랜드 미이행 제출</GbBadge>
          )
        ) : mine && theirs ? (
          <span className="font-semibold text-sz-success-text">양측 완료</span>
        ) : mine ? (
          "브랜드 확인 대기"
        ) : (
          <Warn>내 확인 대기</Warn>
        ),
      })
      if (fulfillment?.onHold) {
        rows.push({ label: "정산", value: <Warn>보류</Warn> })
      }
      rows.push(
        { label: "내 리워드(잠정)", value: sales ? won(sales.myReward) : "—" },
        { label: "내 게시물", value: postBadge }
      )
      if (permissions.canCheckFulfillment) {
        buttons.push(
          <Btn
            key="check"
            variant="primary"
            className="w-full"
            onClick={actions.onCheckFulfillment}
          >
            계약 이행 확인
          </Btn>
        )
      }
      if (disputed && fulfillment?.threadId) {
        buttons.push(
          <Btn
            key="fthread"
            variant="primary"
            className="w-full"
            onClick={actions.onOpenFulfillmentThread}
          >
            연결·소통 열기
          </Btn>
        )
      }
      // 시안 B7 · B11 · B12 — 정산 관리 이동은 이행 확인 상태와 무관하게 늘 둔다
      buttons.push(
        <Btn
          key="settlement"
          variant="secondary"
          className="w-full"
          onClick={actions.onGoSettlement}
        >
          정산 관리 열기 ↗
        </Btn>
      )
      hint = disputed ? (
        <Hint>
          스레드에서 <B>합의가 끝나야 정산이 재개</B>됩니다. 합의 내용에 따라{" "}
          <B>리워드 금액이 조정될 수 있습니다</B> — 금액은 당사자 합의로 정하고,
          양측이 모두 동의해야 종결됩니다. 공구를 다시 열 수는 없으며, 같은
          조건으로 이어가려면 <B>브랜드가 새 계약을 보내야</B> 합니다.
        </Hint>
      ) : mine && theirs ? (
        <Hint>
          이행 확인이 끝났습니다.{" "}
          <B>배송중 · 반품 처리가 정리되면 실적이 확정</B>
          되고 정산이 시작됩니다 — 남은 처리는 브랜드 소관입니다. 공구를 다시 열
          수는 없으며, 같은 조건으로 이어가려면 <B>
            브랜드가 새 계약을 보내야
          </B>{" "}
          합니다.
        </Hint>
      ) : (
        <Hint>
          {fulfillment?.autoConfirmOnTimeout ? (
            <>
              <B>
                기한({d(fulfillment.dueAt)})까지 답하지 않으면 이행으로 처리
              </B>
              되어 정산이 진행됩니다.
            </>
          ) : (
            <>
              <B>확인 기한({d(fulfillment?.dueAt)})</B>까지 브랜드의 이행을
              확인해 주세요.
            </>
          )}{" "}
          문제가 있다면 반드시 기한 전에 «미이행»을 선택하세요. 공구를 다시 열
          수는 없으며, 같은 조건으로 이어가려면 <B>브랜드가 새 계약을 보내야</B>{" "}
          합니다.
        </Hint>
      )
      break
    }
    case "SETTLED": {
      const settlement = detail.settlement
      rows.push(
        {
          label: "정산일",
          value: d(settlement?.settledAt ?? groupBuy.settledAt),
        },
        { label: "고정 지급비", value: won(settlement?.fixedFeeAmount) },
        {
          label: "판매 리워드",
          value: won(settlement?.confirmedReward ?? sales?.myReward),
        },
        {
          label: "합계(공제 전)",
          value: won(settlement?.totalBeforeDeduction),
        },
        { label: "내 게시물", value: postBadge }
      )
      // 시안 B8 — 공제 내역·실입금액은 정산 관리 소관이라 이 버튼이 주 액션이다
      buttons.push(
        <Btn
          key="settlement"
          variant="primary"
          className="w-full"
          onClick={actions.onGoSettlement}
        >
          정산 명세 보기 ↗
        </Btn>
      )
      hint = (
        <Hint>
          실입금액 · 원천징수 내역은 <B>정산 관리</B>에서 확인합니다. 같은
          금액을 두 화면에서 따로 계산하지 않기 위해, 여기서는{" "}
          <B>공제 전 확정 실적</B>까지만 보여줍니다.
        </Hint>
      )
      break
    }
    case "SUSPENDED": {
      const closure = detail.closure
      const isAdmin =
        closure?.source === "ADMIN_NOTICE" ||
        closure?.source === "ADMIN_EMERGENCY"
      rows.push(
        { label: "중단일시", value: dt(groupBuy.endedAt) },
        { label: "처리", value: isAdmin ? "운영자 직권" : "운영자 승인" },
        { label: "고정 지급비", value: "회수 없음" },
        {
          label: "판매 리워드",
          value: sales ? `${won(sales.myReward)} 정산 예정` : "—",
        },
        { label: "내 게시물", value: postBadge }
      )
      buttons.push(threadButton)
      hint = isAdmin ? (
        <Hint>
          이 건은 <B>운영자 직권</B>으로 종결되었습니다 — 내가 되돌릴 수
          없습니다. 같은 상품으로 다시 하려면 <B>브랜드가 새 계약</B>을 보내야
          합니다.
        </Hint>
      ) : (
        <Hint>
          이 건은{" "}
          <B>
            {closure?.requester?.mine ? "내 요청" : "브랜드 요청"} + 운영자 승인
          </B>
          으로 종결되었습니다 — 내가 되돌릴 수 없습니다. 같은 상품으로 다시
          하려면 <B>브랜드가 새 계약</B>을 보내야 합니다.
        </Hint>
      )
      break
    }
    default:
      break
  }

  const visibleButtons = buttons.filter(Boolean)

  return (
    <DetailCard title="상태">
      <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
        <span className="shrink-0 text-[12px] text-sz-n-500">현재 상태</span>
        <GbBadge tone={groupBuy.statusTone}>{groupBuy.statusLabel}</GbBadge>
      </div>
      <div className="pt-2">
        {rows.map(row => (
          <MetaRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
      {visibleButtons.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">{visibleButtons}</div>
      )}
      {hint}
    </DetailCard>
  )
}

export function StudioHistoryCard(props: { detail: Detail }) {
  return (
    <DetailCard title="이력" flushBody>
      <HistoryList items={toGroupBuyHistoryItems(props.detail.history)} />
    </DetailCard>
  )
}
