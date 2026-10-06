import Notice from "@/common/components/Notice/Notice"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  B,
  GbModal,
  MHint,
  MLabel,
  MSelect,
  MSum,
  MSumRow,
  MTextarea,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts"
import {
  EXTENSION_REJECT_OPTIONS,
  POST_CONTENT_MAX,
  POST_TITLE_MAX,
  SUSPENSION_REASON_OPTIONS,
} from "@/features/groupBuy/constants/params"
import type {
  CreatorSuspensionReason,
  ExtensionRejectReason,
  FulfillmentResult,
} from "@/features/groupBuy/types"
import {
  type Detail,
  dt,
  dutyText,
  md,
  num,
  won,
} from "@/features/groupBuy/utils/view"
import { cn } from "@/lib/utils"
import { useState } from "react"

/*
  시안 C1~C7 — 모달 규칙: 제목은 질문형, 좌측은 [닫기](ghost), 우측 확인 라벨은 진입 버튼과 같다.
  필수 입력 전에는 에러 문구 없이 비활성만. 색은 결과의 성격이 정한다(중단만 위험).
*/

interface BaseProps {
  detail: Detail
  isPending: boolean
  onClose: () => void
}

// ── C1 연장 수락 ─────────────────────────────────────

export function AcceptExtensionModal(
  props: BaseProps & { onConfirm: () => void }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const extension = detail.extension
  if (!extension) {
    return null
  }
  return (
    <GbModal
      title="기간 연장을 수락할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
            연장 수락
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="공구명">{detail.groupBuy.title}</MSumRow>
        <MSumRow label="현재 종료">{dt(extension.beforeEndAt)}</MSumRow>
        <MSumRow label="변경 후 종료">
          <B className="text-sz-n-900">{dt(extension.afterEndAt)}</B> (+
          {extension.days}일)
        </MSumRow>
        <MSumRow label="총 기간">
          {extension.beforeTotalDays}일 → {extension.afterTotalDays}일
        </MSumRow>
      </MSum>
      <Notice tone="consent" className="flex flex-col gap-2">
        <div>
          <B className="text-sz-n-900">
            수락하면 즉시 반영되고 되돌릴 수 없습니다
          </B>
        </div>
        <div className="leading-[1.8]">
          · 종료일이 <B className="text-sz-n-900">{dt(extension.afterEndAt)}</B>
          로 바뀌고 소비자에게도 즉시 반영됩니다
          <br />· 게시물이{" "}
          <B className="text-sz-n-900">
            {extension.days === 7 ? "일주일" : `${extension.days}일`} 더 노출
          </B>
          되고 그동안의 판매도 <B className="text-sz-n-900">내 리워드에 포함</B>
          됩니다
          <br />· 계약의{" "}
          <B className="text-sz-n-900">고정 지급비와 리워드율은 그대로</B>입니다
          — 연장으로 늘어나지 않습니다
          <br />· 콘텐츠 의무를{" "}
          <B className="text-sz-n-900">이미 이행했다면 추가 의무는 없습니다</B>
        </div>
      </Notice>
      <MHint>
        연장 조건을 바꾸고 싶다면 수락하지 말고{" "}
        <B className="text-sz-n-700">스레드에서 먼저 협의</B>하세요.
      </MHint>
    </GbModal>
  )
}

// ── C2 연장 거절 ─────────────────────────────────────

export function RejectExtensionModal(
  props: BaseProps & {
    onConfirm: (body: {
      reasonCode?: ExtensionRejectReason
      memo?: string
    }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [reasonCode, setReasonCode] = useState<ExtensionRejectReason | "">("")
  const [memo, setMemo] = useState("")
  const extension = detail.extension
  const isValid = reasonCode !== "ETC" || memo.trim() !== ""
  if (!extension) {
    return null
  }
  return (
    <GbModal
      title="기간 연장을 거절할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="secondary"
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              onConfirm({
                reasonCode: reasonCode || undefined,
                memo: memo.trim() || undefined,
              })
            }
          >
            연장 거절
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="공구명">{detail.groupBuy.title}</MSumRow>
        <MSumRow label="요청 내용">
          +{extension.days}일 · {dt(extension.afterEndAt)}까지
        </MSumRow>
      </MSum>
      <MLabel optional first>
        거절 사유
      </MLabel>
      <MSelect
        value={reasonCode}
        onChange={event =>
          setReasonCode(event.target.value as ExtensionRejectReason | "")
        }
      >
        <option value="">선택하세요</option>
        {EXTENSION_REJECT_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MLabel optional={reasonCode !== "ETC"} required={reasonCode === "ETC"}>
        브랜드에게 남길 메모
      </MLabel>
      <MTextarea
        placeholder="브랜드가 다시 제안할 수 있도록 이유를 적어주면 좋습니다."
        maxLength={1000}
        value={memo}
        onChange={event => setMemo(event.target.value)}
      />
      <MWarn>
        <B className="text-sz-n-900">
          거절해도 공구는 원래 일정대로 계속 진행됩니다.
        </B>{" "}
        종료일은 {dt(extension.beforeEndAt)} 그대로이고, 지금까지의 판매
        리워드에도 영향이 없습니다. 연장 요청은 공구당 한 번이라 브랜드가 다시
        요청할 수는 없습니다.
      </MWarn>
    </GbModal>
  )
}

// ── C3 · C4 공구 게시물 작성 · 수정 ────────────────────

export function PostEditorModal(
  props: BaseProps & {
    /** 승인 후 수정(PATCH) — 임시저장이 없고 바로 반영된다 */
    isEdit: boolean
    isSaving: boolean
    onSaveDraft: (body: { title: string; content: string }) => void
    onSubmit: (body: { title: string; content: string }) => void
  }
) {
  const {
    detail,
    isPending,
    isSaving,
    isEdit,
    onClose,
    onSaveDraft,
    onSubmit,
  } = props
  const { post, items, timeline, brand } = detail
  const [title, setTitle] = useState(post.title ?? "")
  const [content, setContent] = useState(post.content ?? "")
  const trimmedTitle = title.trim()
  const trimmedContent = content.trim()
  const canSubmit = trimmedTitle !== "" && trimmedContent !== ""
  // 임시저장은 제목·본문 중 하나만 있어도 된다(서버 규칙)
  const canSave = trimmedTitle !== "" || trimmedContent !== ""
  const isRewrite = post.status === "REJECTED" || post.status === "WRITING"

  return (
    <GbModal
      title={
        isEdit || post.status === "REJECTED"
          ? "공구 게시물 수정"
          : "공구 게시물 작성"
      }
      width={560}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          {isEdit ? (
            <Btn
              variant="primary"
              disabled={!canSubmit}
              isLoading={isPending}
              onClick={() =>
                onSubmit({ title: trimmedTitle, content: trimmedContent })
              }
            >
              수정 반영
            </Btn>
          ) : (
            <>
              <Btn
                variant="secondary"
                disabled={!canSave}
                isLoading={isSaving}
                onClick={() =>
                  onSaveDraft({ title: trimmedTitle, content: trimmedContent })
                }
              >
                임시저장
              </Btn>
              <Btn
                variant="primary"
                disabled={!canSubmit}
                isLoading={isPending}
                onClick={() =>
                  onSubmit({ title: trimmedTitle, content: trimmedContent })
                }
              >
                등록하고 검토 요청
              </Btn>
            </>
          )}
        </>
      }
    >
      <div className="rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px] text-[11px] leading-[1.7] text-sz-n-600">
        계약에서 넘어온 값이라 <B className="text-sz-n-900">바꿀 수 없습니다</B>{" "}
        — 공구 기간{" "}
        <B className="text-sz-n-900">
          {dt(timeline.startAt)} ~ {md(timeline.endAt)}
        </B>{" "}
        · 브랜드 <B className="text-sz-n-900">{brand.name}</B>
        <div className="mt-[9px] flex flex-col gap-[7px]">
          {items.map((item, index) => (
            <div
              key={`${item.productId ?? "x"}-${index}`}
              className="flex items-center gap-2 rounded-[6px] border border-sz-n-200 bg-white px-2.5 py-2 text-[11px] text-sz-n-900"
            >
              <span className="flex-1">{item.productName}</span>
              <span className="tabular-nums text-sz-n-700">
                {won(item.groupBuyPrice)}
              </span>
              <span className="text-[10px] text-sz-n-400" aria-label="잠김">
                🔒
              </span>
            </div>
          ))}
        </div>
      </div>

      <MLabel required>제목</MLabel>
      <input
        className="h-[34px] w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
        placeholder="예) 여름 수분 세럼, 제가 쓰던 그 조합"
        maxLength={POST_TITLE_MAX}
        value={title}
        onChange={event => setTitle(event.target.value)}
      />
      <div className="mt-[5px] text-right text-[11px] tabular-nums text-sz-n-400">
        {title.length} / {POST_TITLE_MAX}
      </div>

      <MLabel required>본문</MLabel>
      <MTextarea
        className="min-h-[132px]"
        placeholder="어떤 제품인지, 왜 추천하는지 적어주세요. 사진은 넣을 수 없고 글만 올라갑니다."
        maxLength={POST_CONTENT_MAX}
        value={content}
        onChange={event => setContent(event.target.value)}
      />
      <div className="mt-[5px] text-right text-[11px] tabular-nums text-sz-n-400">
        {num(content.length)} / {num(POST_CONTENT_MAX)}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-[6px] border border-dashed border-sz-n-300 px-3 py-2.5 text-[11px] leading-[1.7] text-sz-n-600">
        <div>
          게시할 때 아래 문구가{" "}
          <B className="text-sz-n-900">자동으로 붙습니다</B> — 직접 지우거나
          고칠 수 없습니다.
          <br />
          <span className="inline-block rounded-[4px] bg-sz-n-100 px-1.5 py-px text-sz-n-700">
            {post.disclosureText ??
              `유료 광고 포함 · ${brand.name}로부터 대가를 받아 진행하는 공동구매입니다`}
          </span>
          <br />
          판매자 정보(상호 · 사업자등록번호 · 교환 · 반품 안내)도 게시물 하단에{" "}
          <B className="text-sz-n-900">브랜드 정보로 자동 표기</B>됩니다.
        </div>
      </div>
      <MHint>
        {isEdit ? (
          <>
            승인 후 수정은{" "}
            <B className="text-sz-n-700">재승인 없이 바로 반영</B>
            됩니다.{" "}
            <B className="text-sz-n-700">
              수정한 내용으로 생기는 법적 책임은 나에게
            </B>{" "}
            있습니다.
          </>
        ) : (
          <>
            등록하면 <B className="text-sz-n-700">운영자 검토</B>가 시작되고{" "}
            <B className="text-sz-n-700">검토 중에는 수정할 수 없습니다</B>
            (영업일 {detail.readiness?.reviewSlaBusinessDays ?? 3}일). 승인되면
            공구가 <B className="text-sz-n-700">준비완료</B>로 바뀝니다.
            {isRewrite && " [임시저장]은 검토를 시작하지 않습니다."}
          </>
        )}
      </MHint>
    </GbModal>
  )
}

// ── C5 · C6 계약 이행 확인 ───────────────────────────

export function FulfillmentModal(
  props: BaseProps & {
    onConfirm: (body: { result: FulfillmentResult; reason?: string }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [result, setResult] = useState<FulfillmentResult | null>(null)
  const [reason, setReason] = useState("")
  const isUnfulfilled = result === "UNFULFILLED"
  const isValid =
    result === "FULFILLED" || (isUnfulfilled && reason.trim() !== "")
  const brandDuty = dutyText(detail.afterEnd?.fulfillment?.myTarget)
  // 시안 C5 「312건 중 18건 배송 중」 — 판단 근거가 되는 배송 현황. 지급비 입금은 플랫폼이 모른다
  const closure = detail.orderClosure
  const shipping = closure?.unclosed.awaitingShipment ?? null
  const currentStatus =
    closure && closure.totalCount === 0
      ? "접수된 주문 없음"
      : closure && shipping !== null
        ? `${num(closure.totalCount)}건 중 ${num(shipping)}건 배송 중`
        : null

  return (
    <GbModal
      title="브랜드가 계약을 이행했나요?"
      width={560}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant={isUnfulfilled ? "danger" : "primary"}
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              result &&
              onConfirm(
                isUnfulfilled ? { result, reason: reason.trim() } : { result }
              )
            }
          >
            {isUnfulfilled ? "미이행 제출 · 스레드 열기" : "확인 완료"}
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="브랜드">{detail.brand.name}</MSumRow>
        <MSumRow label="브랜드 의무">{brandDuty}</MSumRow>
        {currentStatus && <MSumRow label="현재 상황">{currentStatus}</MSumRow>}
      </MSum>
      <div className="rounded-[6px] border border-sz-n-200 px-[13px] py-[11px]">
        <div className="text-[12px] font-medium text-sz-n-900">
          브랜드가 계약을 이행했나요?
        </div>
        <div className="mt-[2px] text-[11px] leading-[1.6] text-sz-n-500">
          {brandDuty} 등 계약서에 적힌 브랜드 의무 전체를 기준으로 판단해
          주세요.
        </div>
        <div className="mt-[9px] flex gap-[7px]">
          {(["FULFILLED", "UNFULFILLED"] as const).map(value => {
            const isOn = result === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setResult(value)}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center rounded-[6px] border text-[11px] font-medium",
                  !isOn && "border-sz-n-300 bg-white text-sz-n-600",
                  isOn &&
                    value === "FULFILLED" &&
                    "border-sz-accent-500 bg-sz-accent-50 text-sz-accent-600",
                  isOn &&
                    value === "UNFULFILLED" &&
                    "border-sz-danger-text bg-sz-danger-bg text-sz-danger-text"
                )}
              >
                {value === "FULFILLED" ? "이행" : "미이행"}
              </button>
            )
          })}
        </div>
      </div>
      {isUnfulfilled ? (
        <>
          <MLabel required>어떤 점이 이행되지 않았나요?</MLabel>
          <MTextarea
            maxLength={2000}
            value={reason}
            onChange={event => setReason(event.target.value)}
          />
          <MWarn danger>
            <div>
              <B className="text-sz-n-900">
                «미이행»으로 제출하면 연결·소통에 스레드가 열립니다.
              </B>
              <br />· <B className="text-sz-n-900">나 · 브랜드 · 운영자</B>가
              참여하는 스레드에서 합의합니다
              <br />· 합의가 끝날 때까지{" "}
              <B className="text-sz-n-900">정산은 보류</B>
              되고 리워드 지급도 미뤄집니다
              <br />· 위에 적은 내용이{" "}
              <B className="text-sz-n-900">스레드 첫 글로 등록</B>됩니다
              <br />· 회사의{" "}
              <B className="text-sz-n-900">
                중재 의견에는 금액 조정이 포함되지 않으며
              </B>
              , 금액은 <B className="text-sz-n-900">당사자 합의</B>로 정합니다
              <br />· <B className="text-sz-n-900">양측이 모두 동의해야 종결</B>
              되고, 한쪽이라도 반대하면{" "}
              <B className="text-sz-n-900">보류가 계속</B>됩니다
            </div>
          </MWarn>
        </>
      ) : (
        <Notice tone="consent" className="mt-4">
          <B className="text-sz-n-900">이행</B>으로 확인하면 되돌릴 수 없으며,
          브랜드 쪽 확인이 끝나는 대로{" "}
          <B className="text-sz-n-900">정산 절차가 시작</B>됩니다.
        </Notice>
      )}
    </GbModal>
  )
}

// ── C7 공구 중단 요청(내가 발신) ──────────────────────

export function SuspensionModal(
  props: BaseProps & {
    onConfirm: (body: {
      reasonCode: CreatorSuspensionReason
      memo: string
    }) => void
  }
) {
  const { detail, isPending, onClose, onConfirm } = props
  const [reasonCode, setReasonCode] = useState<CreatorSuspensionReason | "">("")
  const [memo, setMemo] = useState("")
  const isValid = reasonCode !== "" && memo.trim() !== ""
  const fee = detail.fixedFee.amount
  const orders = detail.sales?.orderCount

  return (
    <GbModal
      title="공구를 중단 요청할까요?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="danger"
            disabled={!isValid}
            isLoading={isPending}
            onClick={() =>
              reasonCode && onConfirm({ reasonCode, memo: memo.trim() })
            }
          >
            중단 요청
          </Btn>
        </>
      }
    >
      <MSum>
        <MSumRow label="공구명">{detail.groupBuy.title}</MSumRow>
        <MSumRow label="브랜드">{detail.brand.name}</MSumRow>
        <MSumRow label="현재 실적">
          {detail.sales
            ? `주문 ${num(detail.sales.orderCount)}건 · 내 리워드 ${won(detail.sales.myReward)}`
            : "—"}
        </MSumRow>
      </MSum>
      <MLabel required first>
        중단 사유
      </MLabel>
      <MSelect
        value={reasonCode}
        onChange={event =>
          setReasonCode(event.target.value as CreatorSuspensionReason | "")
        }
      >
        <option value="">선택하세요</option>
        {SUSPENSION_REASON_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MLabel required>운영자에게 전달할 내용</MLabel>
      <MTextarea
        placeholder="언제부터 어떤 문제가 있었는지, 브랜드와 어떤 이야기를 나눴는지 적어주세요."
        maxLength={1000}
        value={memo}
        onChange={event => setMemo(event.target.value)}
      />
      <MHint>
        브랜드와 먼저 <B className="text-sz-n-700">스레드에서 협의</B>했다면 그
        내용도 함께 적어주세요 — 운영자가 판단하는 근거가 됩니다.
      </MHint>
      <Notice tone="consent" className="mt-4 flex flex-col gap-2">
        <div>
          <B className="text-sz-n-900">중단이 승인되면 되돌릴 수 없습니다</B>
        </div>
        <div className="leading-[1.8]">
          {/* 지급비가 없으면(0원) 회수 문장 자체가 의미 없다 */}
          {fee !== null && fee > 0 && (
            <>
              · 이미 받은 고정 지급비{" "}
              <B className="text-sz-n-900">
                {won(fee)}은 플랫폼이 회수해 주지 않습니다
              </B>{" "}
              — 브랜드가 직접 지급한 돈이라{" "}
              <B className="text-sz-n-900">
                플랫폼을 지나가지 않았고 되돌릴 대상이 없습니다
              </B>
              <br />
            </>
          )}
          ·{" "}
          <B className="text-sz-n-900">
            중단 집행 시점 이전까지 결제 완료된 정상 주문
          </B>
          {orders !== undefined && `(현재 ${num(orders)}건)`}의 리워드는{" "}
          <B className="text-sz-n-900">그대로 정산</B>됩니다
          <br />·{" "}
          <B className="text-sz-n-900">
            중단 이후 잔여 기간에 관한 리워드 청구권은 소멸
          </B>
          합니다 — 남은 기간에 팔렸을 리워드는 받을 수 없습니다
          <br />· 내 게시물도 <B className="text-sz-n-900">함께 종료</B>되어
          쇼룸에서 내려갑니다
          <br />· 접수된 주문의{" "}
          <B className="text-sz-n-900">배송 · 환불은 브랜드가 계속 처리</B>
          합니다
          <br />· 다시 진행하려면{" "}
          <B className="text-sz-n-900">브랜드가 새 계약</B>을 보내야 합니다
        </div>
      </Notice>
    </GbModal>
  )
}
