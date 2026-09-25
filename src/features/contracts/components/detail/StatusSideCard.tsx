import DetailCard, { MetaRow } from "@/common/components/DetailCard/DetailCard"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { FLINK_CLASS } from "@/features/contracts/components/shared/styles"
import { PAYMENT_STATE_TEXT } from "@/features/contracts/constants/labels"
import type { CreatorContractDetailResponse } from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  type CreatorViewState,
} from "@/features/contracts/utils/contractView"
import {
  formatKRW,
  formatMonthDayTime,
  isDeadlineImminent,
} from "@/features/contracts/utils/format"
import { toneToVariant } from "@/features/contracts/utils/statusBadge"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import type { ReactNode } from "react"

interface StatusSideCardProps {
  detail: CreatorContractDetailResponse
  view: CreatorViewState
  isResending: boolean
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
                    isDeadlineImminent(signature.deadlineAt) &&
                      "font-semibold text-sz-warning-text"
                  )}
                >
                  {formatDateTimeShort(signature.deadlineAt)}
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
              value={time(signature.deadlineAt)}
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
              value={done(
                [signature.brandSignedAt, signature.creatorSignedAt]
                  .filter((v): v is string => v !== null)
                  .sort()
                  .at(-1) ?? null
              )}
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
            <MetaRow label="체결일시" value={time(closure.closedAt)} />
            <MetaRow label="계약 문서" value="서명 PDF · 감사추적인증서" />
            <MetaRow
              label="고정 지급비"
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
    }
  })()

  return (
    <DetailCard title="상태">
      <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
        <span className="text-[12px] text-sz-n-500">현재 상태</span>
        <StatusBadge variant={toneToVariant(detail.statusTone)}>
          {detail.statusLabel}
        </StatusBadge>
      </div>
      <div className="pt-2">{rows}</div>

      <div className="mt-4 flex flex-col gap-2">
        {permissions.canRequestResend && (
          <Btn
            variant="secondary"
            className="w-full"
            isLoading={isResending}
            onClick={onRequestResend}
          >
            서명 안내 다시 받기
          </Btn>
        )}
        {view === "concluded" && (
          <Btn
            variant="secondary"
            className="w-full"
            disabled={!permissions.canOpenGroupBuy}
            title={
              permissions.canOpenGroupBuy
                ? undefined
                : "공구 관리 화면은 준비 중입니다"
            }
            onClick={onOpenGroupBuy}
          >
            공구 관리 열기
          </Btn>
        )}
        {permissions.canOpenThread && (
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
        {hintByView(view, isClosed, content.dueDate)}
      </p>
    </DetailCard>
  )
}

function hintByView(
  view: CreatorViewState,
  isClosed: boolean,
  dueDate: string | null
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
          확인이 끝나면 체결되며 알림을 받습니다. 공구 게시물 작성은{" "}
          <b className="font-semibold">공구가 생성된 뒤</b> 가능합니다.
        </>
      )
    case "concluded":
      return (
        <>
          계약이 성립했습니다.{" "}
          <b className="font-semibold">브랜드가 공구를 생성하면</b> 공구
          관리에서 공구 게시물을 작성할 수 있고, 그 게시물을 쇼룸에 등록한
          시점에 고정 지급비가 지급됩니다.
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
          브랜드 요청으로 종결된 건이라{" "}
          <b className="font-semibold">내가 할 조치는 없습니다</b>. 새 계약을
          기다리거나 스레드에서 일정을 협의하세요.
        </>
      ) : null
  }
}
