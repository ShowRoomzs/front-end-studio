import DetailCard, { MetaRow } from "@/common/components/DetailCard/DetailCard"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import SanctionHoldBadge from "@/common/components/Suspension/SanctionHoldBadge"
import SuspendedTooltip from "@/common/components/Suspension/SuspendedTooltip"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import { PAYMENT_STATE_TEXT } from "@/features/contracts/constants/labels"
import type { CreatorContractDetailResponse } from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  establishedAtOf,
  type CreatorViewState,
} from "@/features/contracts/utils/contractView"
import {
  formatKRW,
  formatMonthDayTime,
} from "@/features/contracts/utils/format"
import { toneToVariant } from "@/features/contracts/utils/statusBadge"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import type { ReactNode } from "react"

interface StatusSideCardProps {
  detail: CreatorContractDetailResponse
  view: CreatorViewState
  isResending: boolean
  /** 시안 13 S3 — 계정 이용 정지 중이면 [서명 안내 다시 받기] 비활성 + 툴팁 */
  resendBlocked: boolean
  onRequestResend: () => void
  onOpenThread: () => void
  onDecline: () => void
  onOpenDraft: () => void
  onOpenGroupBuy: () => void
}

/**
 * 우측 「상태」 카드 — 배지 + 메타 행 + 액션 + 안내. 액션은 서버 `permissions` 5종으로만 결정한다.
 * 내 차례라는 사실은 배지 색이 아니라 기한 날짜의 경고색과 주 버튼으로 말한다(원칙 ③).
 */
export default function StatusSideCard(props: StatusSideCardProps) {
  const {
    detail,
    view,
    isResending,
    resendBlocked,
    onRequestResend,
    onOpenThread,
    onDecline,
    onOpenDraft,
    onOpenGroupBuy,
  } = props
  const {
    signature,
    fixedFee,
    closure,
    groupBuy,
    permissions,
    documents,
    content,
  } = detail
  const isClosed = CLOSED_VIEWS.includes(view)
  const hold = detail.sanctionHold ?? null
  /*
    시안 13 S3 · R1 — 정지 보류 중 서명 기한이 멈춰 있다(서버 `signatureDeadlinePaused`).
    내 정지는 경고색 「정지 중 멈춤 · 해제 후 남은 기한부터」, 상대 사정은 중립 「보류 중 멈춤 · 재개 후 남은 기한부터」
  */
  const pausedNote = detail.signatureDeadlinePaused ? (
    <span
      className={cn(
        "block text-[11px] font-normal",
        hold?.kind === "MINE" ? "text-sz-warning-text" : "text-sz-n-500"
      )}
    >
      {hold?.kind === "MINE"
        ? "정지 중 멈춤 · 해제 후 남은 기한부터"
        : "보류 중 멈춤 · 재개 후 남은 기한부터"}
    </span>
  ) : null
  const hasDraft = documents.some(doc => doc.documentType === "GENERATED_DRAFT")

  const time = (value: string | null) => (
    <span className="tabular-nums">{formatDateTimeShort(value)}</span>
  )
  const done = (value: string | null) => (
    <span className="font-semibold tabular-nums text-sz-success-text">
      완료 · {formatMonthDayTime(value)}
    </span>
  )
  const draftRow = (
    <MetaRow
      label="계약서"
      value={
        hasDraft ? (
          <button type="button" className={FLINK_CLASS} onClick={onOpenDraft}>
            받은 계약서 보기
          </button>
        ) : (
          <span className="font-normal text-sz-n-500">생성 전</span>
        )
      }
    />
  )
  const fee = (
    <MetaRow label="고정 지급비" value={formatKRW(fixedFee.amount ?? 0)} />
  )

  const rows: ReactNode = (() => {
    switch (view) {
      case "signingNone":
      case "signingTheirs":
        return (
          <>
            <MetaRow label="받은 일시" value={time(detail.receivedAt)} />
            <MetaRow
              label="내 서명 기한"
              value={
                <span
                  className={cn(
                    "tabular-nums",
                    // 시안 S3·S3a `.due` — 내 서명이 남아 있으면 기한을 경고색으로
                    signature.creatorSignedAt === null &&
                      "font-semibold text-sz-warning-text"
                  )}
                >
                  {formatDateTimeShort(signature.deadlineAt)}
                  {pausedNote}
                </span>
              }
            />
            {fee}
            {draftRow}
          </>
        )
      case "signingMine":
        return (
          <>
            <MetaRow label="받은 일시" value={time(detail.receivedAt)} />
            <MetaRow label="내 서명" value={done(signature.creatorSignedAt)} />
            <MetaRow
              label="브랜드 서명 기한"
              value={
                <span className="tabular-nums">
                  {formatDateTimeShort(signature.deadlineAt)}
                  {pausedNote}
                </span>
              }
            />
            {fee}
            {draftRow}
          </>
        )
      case "conclusionPending":
        return (
          <>
            <MetaRow label="받은 일시" value={time(detail.receivedAt)} />
            <MetaRow
              label="양측 서명"
              // 성립 시각 = 양측 서명 완료(1021 기-05)
              value={done(establishedAtOf(detail))}
            />
            {fee}
            <MetaRow
              label="계약서"
              value={
                <span className="font-normal text-sz-n-500">
                  체결 처리 시 PDF 발급
                </span>
              }
            />
          </>
        )
      case "concluded":
        return (
          <>
            <MetaRow
              label="체결일시"
              value={time(detail.stepper.concludedAt)}
            />
            <MetaRow label="계약 문서" value="서명 PDF · 감사추적인증서" />
            <MetaRow
              label="브랜드 지급 기록"
              value={PAYMENT_STATE_TEXT[fixedFee.paymentState]}
            />
            <MetaRow
              label="연결된 공구"
              value={
                groupBuy.groupBuyId !== null ? (
                  <button
                    type="button"
                    className={FLINK_CLASS}
                    onClick={onOpenGroupBuy}
                    disabled={!permissions.canOpenGroupBuy}
                  >
                    {detail.title} ↗
                  </button>
                ) : (
                  "브랜드 생성 대기"
                )
              }
            />
          </>
        )
      case "declined":
        return (
          <>
            <MetaRow label="받은 일시" value={time(detail.receivedAt)} />
            <MetaRow label="거절 일시" value={time(closure.closedAt)} />
            <MetaRow label="고정 지급비" value="지급 없음" />
            <MetaRow
              label="연결 상태"
              value={detail.brand.connected ? "연결됨 유지" : "연결 없음"}
            />
          </>
        )
      case "expired":
        return (
          <>
            <MetaRow label="받은 일시" value={time(detail.receivedAt)} />
            <MetaRow label="서명 기한" value={time(signature.deadlineAt)} />
            <MetaRow label="만료 처리" value={time(closure.closedAt)} />
            <MetaRow label="고정 지급비" value="지급 없음" />
          </>
        )
      case "canceled":
        return (
          <>
            <MetaRow label="받은 일시" value={time(detail.receivedAt)} />
            <MetaRow label="취소 일시" value={time(closure.closedAt)} />
            <MetaRow label="고정 지급비" value="지급 없음" />
            <MetaRow
              label="연결 상태"
              value={detail.brand.connected ? "연결됨 유지" : "연결 없음"}
            />
          </>
        )
      case "terminated":
        return (
          <>
            <MetaRow label="받은 일시" value={time(detail.receivedAt)} />
            <MetaRow label="체결 일시" value={time(establishedAtOf(detail))} />
            <MetaRow label="해지 일시" value={time(closure.closedAt)} />
            <MetaRow
              label="연결된 공구"
              value={
                groupBuy.groupBuyId !== null && permissions.canOpenGroupBuy ? (
                  <button
                    type="button"
                    className={FLINK_CLASS}
                    onClick={onOpenGroupBuy}
                  >
                    {detail.title} ↗
                  </button>
                ) : (
                  "생성되지 않음"
                )
              }
            />
            <MetaRow
              label="연결 상태"
              value={detail.brand.connected ? "연결됨 유지" : "연결 없음"}
            />
          </>
        )
    }
  })()

  return (
    <DetailCard title="상태">
      <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
        <span className="shrink-0 text-[12px] text-sz-n-500">현재 상태</span>
        {/* 시안 13 S3 · R1 — 상태는 그대로 두고 보류 보조 배지만 붙인다(서버 `sanctionHold`) */}
        <span className="flex flex-wrap items-center justify-end gap-1">
          <StatusBadge variant={toneToVariant(detail.statusTone)}>
            {detail.statusLabel}
          </StatusBadge>
          <SanctionHoldBadge hold={hold} />
        </span>
      </div>
      <div className="pt-2">{rows}</div>

      <div className="mt-4 flex flex-col gap-2">
        {permissions.canRequestResend && (
          <SuspendedTooltip active={resendBlocked} className="flex w-full">
            <Btn
              variant="secondary"
              className="w-full"
              isLoading={isResending}
              disabled={resendBlocked}
              onClick={onRequestResend}
            >
              서명 안내 다시 받기
            </Btn>
          </SuspendedTooltip>
        )}
        {view === "concluded" && (
          <Btn
            variant="secondary"
            className="w-full"
            disabled={!permissions.canOpenGroupBuy}
            title={
              permissions.canOpenGroupBuy
                ? undefined
                : "아직 공구가 생성되지 않았습니다"
            }
            onClick={onOpenGroupBuy}
          >
            공구 관리 열기
          </Btn>
        )}
        {/* 시안 S10은 액션이 없다 — 해지 건은 내가 할 조치가 없고, 스레드는 계약 조건의 「스레드 열기」로 남는다 */}
        {permissions.canOpenThread && view !== "terminated" && (
          <Btn variant="secondary" className="w-full" onClick={onOpenThread}>
            스레드에서 협의하기
          </Btn>
        )}
        {permissions.canDecline && (
          <Btn variant="danger" className="w-full" onClick={onDecline}>
            거절
          </Btn>
        )}
      </div>

      <p className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
        {hintByView(
          view,
          isClosed,
          content.dueDate,
          closure.actorType,
          fixedFee.triggerLabel
        )}
      </p>
    </DetailCard>
  )
}

function hintByView(
  view: CreatorViewState,
  isClosed: boolean,
  dueDate: string | null,
  cancelActor: string | null = null,
  triggerLabel: string | null = null
): ReactNode {
  switch (view) {
    case "signingNone":
    case "signingTheirs":
      return (
        <>
          기한까지 서명하지 않으면 이 계약은{" "}
          <b className="font-semibold">만료</b>됩니다. 조건을 바꾸고 싶다면 서명
          전에 <b className="font-semibold">스레드에서 협의</b>하세요 — 이
          화면에서 조건을 고칠 수는 없고, 브랜드가 새 계약을 다시 보내야 합니다.
        </>
      )
    case "signingMine":
      return (
        <>
          <b className="font-semibold">
            내 서명은 끝났고 브랜드 서명을 기다립니다.
          </b>{" "}
          서명한 뒤에는{" "}
          <b className="font-semibold">거절하거나 되돌릴 수 없습니다</b>.
          브랜드가 기한까지 서명하지 않으면 계약은{" "}
          <b className="font-semibold">만료</b>됩니다.
        </>
      )
    case "conclusionPending":
      return (
        <>
          <b className="font-semibold">여기서 내가 할 일은 없습니다.</b> 운영자
          확인은 보통 <b className="font-semibold">영업일 1일</b> 안에 끝나며,
          체결되면 알림을 받습니다. 공구 게시물 작성은{" "}
          <b className="font-semibold">공구가 생성된 뒤</b> 가능합니다.
        </>
      )
    case "concluded":
      return (
        <>
          계약이 성립했습니다.{" "}
          <b className="font-semibold">브랜드가 공구를 생성하면</b> 공구
          관리에서 공구 게시물을 작성할 수 있고, 고정 지급비는 계약서 기재 시점(
          {triggerLabel ?? "—"})에{" "}
          <b className="font-semibold">브랜드가 직접</b> 지급합니다.
          {dueDate && (
            <>
              {" "}
              게시 완료 기한은{" "}
              <b className="font-semibold tabular-nums">
                {dayjs(dueDate).format("YYYY.MM.DD")}
              </b>
              입니다.
            </>
          )}
        </>
      )
    case "declined":
      return (
        <>
          거절은 <b className="font-semibold">이 계약만</b> 종결시킵니다 —
          연결이 끊기지는 않습니다. 조건을 다시 맞추고 싶다면 스레드에서
          협의하고, <b className="font-semibold">새 계약은 브랜드가 보냅니다</b>
          .
        </>
      )
    case "expired":
      return (
        <>
          기한까지 <b className="font-semibold">양측 서명이 완료되지 않아</b>{" "}
          종결된 건입니다. 계약이 여전히 필요하다면{" "}
          <b className="font-semibold">스레드에서 브랜드에게 재발송을 요청</b>
          하세요 — 계약을 만드는 쪽은 브랜드입니다.
        </>
      )
    case "canceled":
      return isClosed ? (
        <>
          {cancelActor === "SELLER"
            ? "브랜드가 발송을 철회한 건이라"
            : "운영자가 취소 처리한 건이라"}{" "}
          <b className="font-semibold">내가 할 조치는 없습니다</b>. 새 계약을
          기다리거나 스레드에서 일정을 협의하세요.
        </>
      ) : null
    case "terminated":
      return (
        <>
          체결 후 공구가 열리기 전에 해지된 건이라{" "}
          <b className="font-semibold">내가 할 조치는 없습니다</b>. 공구 진행
          중에 끝나는 경우는 해지가 아니라 공구 관리의{" "}
          <b className="font-semibold">「중단」</b>입니다.
        </>
      )
  }
}
