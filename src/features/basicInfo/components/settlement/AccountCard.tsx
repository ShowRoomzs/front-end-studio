import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  Hint,
  InfoCard,
  KvList,
  KvRow,
  NoteBox,
  PolicyTbdTag,
  RequestBox,
} from "@/features/basicInfo/components/parts"
import { buttonClass } from "@/features/basicInfo/components/styles"
import {
  ACCOUNT_VERIFICATION_LABEL,
  VERIFICATION_TONE_VARIANT,
} from "@/features/basicInfo/constants/params"
import type {
  AccountInfo,
  PendingAccountChange,
  SettlementInfoResponse,
} from "@/features/basicInfo/types"
import {
  documentSubText,
  formatEventDate,
  formatWon,
} from "@/features/basicInfo/utils/format"

interface AccountCardProps {
  settlement: SettlementInfoResponse
  onStartChange: () => void
  onCancelChange: () => void
  isCancelling: boolean
}

/**
 * 「정산 계좌」 카드 — 읽기 전용 + [계좌 변경](T1 · T5 · T10), 변경 확인 중(T2a · 기-22).
 *
 * 확인이 끝난 값은 편집 필드가 아니다 — 바꾸려면 통장 사본을 다시 내고 운영자 확인을 거친다.
 * 확인 중에는 기존 계좌를 지우지 않고 새 계좌를 「확인 중」으로 따로 보인다(어느 계좌가 유효한지 헷갈리지 않게).
 */
export default function AccountCard(props: AccountCardProps) {
  const { settlement, onStartChange, onCancelChange, isCancelling } = props
  const { account, pendingAccountChange } = settlement

  if (pendingAccountChange) {
    return (
      <InfoCard
        title="정산 계좌"
        badge={<StatusBadge variant="info">변경 확인 중</StatusBadge>}
      >
        <PendingChangeView
          account={account}
          pending={pendingAccountChange}
          onCancel={onCancelChange}
          isCancelling={isCancelling}
        />
      </InfoCard>
    )
  }

  const { verification } = account

  return (
    <InfoCard
      title="정산 계좌"
      badge={
        <StatusBadge variant={VERIFICATION_TONE_VARIANT[verification.tone]}>
          {ACCOUNT_VERIFICATION_LABEL[verification.status] ??
            verification.label}
        </StatusBadge>
      }
    >
      <KvList>
        <KvRow label="은행">{account.bankName}</KvRow>
        <KvRow label="계좌번호" tabular>
          {account.accountNumber}
        </KvRow>
        <KvRow
          label="예금주"
          sub={holderSubText(account)}
          subTone={
            verification.status === "CHANGE_REQUIRED" ? "warning" : "default"
          }
        >
          {account.holderName}
        </KvRow>
        {account.bankbook && (
          <KvRow label="통장 사본" sub={documentSubText(account.bankbook)}>
            제출 완료
          </KvRow>
        )}
        {verification.status === "FAILED" && verification.failReason && (
          <KvRow label="확인 결과" subTone="warning">
            <span className="text-sz-warning-text">
              {verification.failReason}
            </span>
          </KvRow>
        )}
        {verification.verifiedAt && (
          <KvRow label="확인일" tabular>
            {formatEventDate(verification.verifiedAt)}
          </KvRow>
        )}
      </KvList>
      <AccountFooter settlement={settlement} onStartChange={onStartChange} />
    </InfoCard>
  )
}

/** 예금주 보조문 — 예금주는 본인 인증 실명 고정이라 입력받지 않는다 */
function holderSubText(account: AccountInfo) {
  if (account.verification.status === "CHANGE_REQUIRED") {
    return "상호 명의 · 비사업자는 본인 실명 계좌만 가능"
  }
  if (account.holderRule === "REAL_NAME_OR_COMPANY") {
    return "본인 명의 · 사업자는 대표자명 또는 상호 명의"
  }
  return account.verification.status === "VERIFIED"
    ? "본인 명의 · 운영자 확인"
    : "본인 명의"
}

/**
 * 카드 아래쪽 — 상태별로 다르다.
 * - 개인사업자 변경 확인 대기 · 반려(T4 · T4a): 승인 후 예금주 규칙 안내만
 * - 비사업자 변경 확인 대기 · 반려(T9 · T9a): 서버가 「승인 후 계좌 변경 필요」를 알릴 때만 경고 안내
 * - 그 밖: [계좌 변경] + (비사업자면) 운영자 확인 안내. 변경 필요(T10)면 주 버튼으로 올린다
 */
function AccountFooter(props: {
  settlement: SettlementInfoResponse
  onStartChange: () => void
}) {
  const { settlement, onStartChange } = props
  const { actions, account, businessType } = settlement
  const change = settlement.businessTypeChange
  const isOpenOrRejected =
    change && (change.status === "PENDING" || change.status === "REJECTED")

  if (isOpenOrRejected && change.type === "TO_BUSINESS") {
    return (
      <NoteBox>
        사업자로 변경되면 예금주는 <b>대표자명 또는 상호</b>로 등록된 계좌여야
        합니다 — 지금 계좌를 그대로 쓸 수 있는지 <b>승인 후 안내</b>드립니다.
      </NoteBox>
    )
  }

  if (
    isOpenOrRejected &&
    change.type === "TO_INDIVIDUAL" &&
    change.accountChangeRequiredOnApproval
  ) {
    return (
      <NoteBox>
        비사업자는 <b>본인 실명 계좌</b>만 쓸 수 있습니다 — 승인되면 이
        계좌(상호 명의)로는 지급되지 않으니{" "}
        <b>승인 안내를 받은 뒤 계좌를 변경</b>해 주세요.
      </NoteBox>
    )
  }

  const changeRequired = account.verification.status === "CHANGE_REQUIRED"

  return (
    <>
      <div className="mt-3.5 flex justify-end">
        <button
          type="button"
          disabled={!actions.accountChange}
          onClick={onStartChange}
          className={buttonClass(
            changeRequired ? "primary" : "secondary",
            "sm"
          )}
        >
          계좌 변경
        </button>
      </div>
      {!actions.accountChange && actions.accountChangeBlockedReason && (
        <Hint className="text-right">{actions.accountChangeBlockedReason}</Hint>
      )}
      {businessType.value === "INDIVIDUAL" && (
        <NoteBox>
          계좌를 바꾸면 <b>통장 사본을 다시 제출</b>하고 <b>운영자 확인</b>을
          거칩니다 — 확인이 끝나야 변경이 완료됩니다. 지급 예정 건이 있으면{" "}
          <b>확인이 끝난 뒤에 입금</b>되므로 지급일이 늦어질 수 있습니다.
        </NoteBox>
      )}
    </>
  )
}

/** T2a — 요청 상자 + 새 계좌 · 현재 계좌 · 예금주 */
function PendingChangeView(props: {
  account: AccountInfo
  pending: PendingAccountChange
  onCancel: () => void
  isCancelling: boolean
}) {
  const { account, pending, onCancel, isCancelling } = props
  const requested = formatEventDate(pending.requestedAt)
  const newAccountSub = [
    pending.bankbookFileName,
    requested ? `${requested} 제출` : null,
    "운영자 확인 중",
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <RequestBox
        badge={<StatusBadge variant="info">확인 중</StatusBadge>}
        title="계좌 변경 요청을 운영자가 확인하고 있어요"
        action={
          <button
            type="button"
            disabled={isCancelling}
            onClick={onCancel}
            className={buttonClass("secondary", "sm")}
          >
            요청 취소
          </button>
        }
      >
        요청일 <b>{requested}</b> · 운영자가{" "}
        <b>
          {pending.reviewBusinessDays != null
            ? `${pending.reviewBusinessDays}영업일`
            : "N영업일"}{" "}
          이내
        </b>{" "}
        확인합니다 {pending.reviewBusinessDays == null && <PolicyTbdTag />}
        <br />
        {pending.holdingPayoutCount > 0 && (
          <>
            확인이 끝날 때까지{" "}
            <b>
              지급 예정 {pending.holdingPayoutCount}건(
              {formatWon(pending.holdingPayoutAmount)})
            </b>
            의 입금이 <b>보류</b>됩니다 ·{" "}
          </>
        )}
        이미 지급이 끝난 건은 영향이 없습니다.
      </RequestBox>
      <KvList className="mt-3.5">
        <KvRow label="새 계좌" sub={newAccountSub}>
          {pending.bankName} ·{" "}
          <span className="tabular-nums">{pending.maskedAccountNumber}</span>
        </KvRow>
        <KvRow label="현재 계좌" sub="변경이 완료되면 새 계좌로 바뀝니다">
          {account.bankName} ·{" "}
          <span className="tabular-nums">{account.accountNumber}</span>
        </KvRow>
        <KvRow label="예금주" sub="본인 명의">
          {pending.holderName}
        </KvRow>
      </KvList>
    </>
  )
}
