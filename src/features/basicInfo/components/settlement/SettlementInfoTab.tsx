import { useCallback, useState } from "react"

import SuspensionNotice from "@/common/components/Suspension/SuspensionNotice"
import { SETTLEMENT_MISMATCH_REASON } from "@/common/constants/suspension"
import AccountChangeConfirmModal from "@/features/basicInfo/components/modals/AccountChangeConfirmModal"
import BusinessTypeChangeModal from "@/features/basicInfo/components/modals/BusinessTypeChangeModal"
import { LoadingBlock, TwoColumns } from "@/features/basicInfo/components/parts"
import AccountCard from "@/features/basicInfo/components/settlement/AccountCard"
import AccountChangeForm, {
  type AccountChangeDraft,
} from "@/features/basicInfo/components/settlement/AccountChangeForm"
import BusinessTypeCard from "@/features/basicInfo/components/settlement/BusinessTypeCard"
import ResidentNumberCard from "@/features/basicInfo/components/settlement/ResidentNumberCard"
import ResultBanner from "@/features/basicInfo/components/settlement/ResultBanner"
import SettlementGuideCard from "@/features/basicInfo/components/settlement/SettlementGuideCard"
import {
  useAcknowledgeBusinessTypeChange,
  useCancelBusinessTypeChange,
  useCancelSettlementAccountChange,
  useChangeSettlementAccount,
  useGetBasicInfoSettlement,
  useRequestBusinessTypeChange,
} from "@/features/basicInfo/hooks/useBasicInfoQueries"
import type {
  BusinessTypeChangeRequest,
  CreatorBusinessType,
} from "@/features/basicInfo/types"
import { useAccountStatus } from "@/features/home/hooks/useAccountStatus"

/**
 * 정산 정보 탭(T1 ~ T10 · T2a) — 「어디로 · 어떤 세무 형태로」 받을지만 관리한다. 금액은 정산 관리가 단일 소스다.
 *
 * 흐름(기-22): [계좌 변경] → 입력(T2 · T3) → [변경 요청] → 확인 모달(T6) → 요청 접수 → 운영자 확인 중(T2a).
 * 사업자 구분: [개인사업자로 · 비사업자로 변경 요청] → 모달(T7 · T8) → 확인 대기(T4 · T9) → 승인(T5 · T10) / 반려(T4a · T9a).
 *
 * 계정 이용 정지(시안 13 S7) — 계좌 변경 · 사업자 구분 변경 요청은 정지 중에도 그대로 연다(막는 곳이 없다).
 * 정산 정보 불일치로 정지된 경우에만 맨 위에 「정지 중에도 정산 계좌를 변경할 수 있어요」 안내를 붙인다.
 */
export default function SettlementInfoTab() {
  const { data: settlement, isLoading } = useGetBasicInfoSettlement(true)
  const { sanction } = useAccountStatus()
  const isMismatchSuspension = sanction?.reason === SETTLEMENT_MISMATCH_REASON

  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [accountDraft, setAccountDraft] = useState<AccountChangeDraft | null>(
    null
  )
  const [businessTypeTarget, setBusinessTypeTarget] =
    useState<CreatorBusinessType | null>(null)

  const changeAccount = useChangeSettlementAccount()
  const cancelAccountChange = useCancelSettlementAccountChange()
  const requestBusinessType = useRequestBusinessTypeChange()
  const cancelBusinessType = useCancelBusinessTypeChange()
  const acknowledgeBusinessType = useAcknowledgeBusinessTypeChange()

  const { mutate: acknowledge } = acknowledgeBusinessType
  const markApprovalSeen = useCallback(
    (requestId: number) => acknowledge({ requestId, refetch: false }),
    [acknowledge]
  )

  if (isLoading || !settlement) {
    return <LoadingBlock isLoading={isLoading} />
  }

  const change = settlement.businessTypeChange
  const approvedChange = change?.status === "APPROVED" ? change : null
  // 시안 T4 · T4a는 개인사업자 변경 요청 상자가 주민등록번호 카드 자리를 대신한다
  const hidesResidentCard =
    change?.type === "TO_BUSINESS" &&
    (change.status === "PENDING" || change.status === "REJECTED")
  // 요청이 접수돼 확인 중이면 입력 카드를 닫는다(다른 탭에서 요청한 경우 포함)
  const showsAccountForm = isEditingAccount && !settlement.pendingAccountChange

  const confirmAccountChange = () => {
    if (!accountDraft) return
    changeAccount.mutate(
      {
        body: {
          bankCode: accountDraft.bankCode,
          accountNumber: accountDraft.accountNumber,
          bankbookImageUrl: accountDraft.bankbook.url,
          bankbookFileName: accountDraft.bankbook.name,
        },
        bankName: accountDraft.bankName,
      },
      {
        onSuccess: () => {
          setAccountDraft(null)
          setIsEditingAccount(false)
        },
        // 실패(같은 계좌 · 열린 요청 등)는 토스트로 알리고 입력을 남긴다 — 고쳐서 다시 보낼 수 있게
        onError: () => setAccountDraft(null),
      }
    )
  }

  const submitBusinessType = (body: BusinessTypeChangeRequest) => {
    requestBusinessType.mutate(body, {
      onSuccess: () => setBusinessTypeTarget(null),
    })
  }

  return (
    <>
      {isMismatchSuspension && (
        <SuspensionNotice tone="neutral" className="mb-3">
          <b>정지 중에도 정산 계좌를 변경할 수 있어요.</b> 정산 정보 불일치로
          정지된 경우, 변경 요청이 확인되면 정지가 해제되고 다음 영업일에
          지급됩니다.
        </SuspensionNotice>
      )}

      {approvedChange && (
        <ResultBanner
          settlement={settlement}
          change={approvedChange}
          onSeen={markApprovalSeen}
        />
      )}

      <TwoColumns
        left={
          <>
            <BusinessTypeCard
              settlement={settlement}
              onRequestChange={setBusinessTypeTarget}
              onCancelRequest={requestId =>
                cancelBusinessType.mutate(requestId)
              }
              onAcknowledge={requestId =>
                acknowledgeBusinessType.mutate({ requestId, refetch: true })
              }
              isCancelling={cancelBusinessType.isPending}
              isAcknowledging={acknowledgeBusinessType.isPending}
            />
            {settlement.businessType.value === "INDIVIDUAL" &&
              settlement.residentNumber &&
              !hidesResidentCard && (
                <ResidentNumberCard
                  residentNumber={settlement.residentNumber}
                />
              )}
            {showsAccountForm ? (
              <AccountChangeForm
                account={settlement.account}
                onCancel={() => setIsEditingAccount(false)}
                onSubmit={setAccountDraft}
              />
            ) : (
              <AccountCard
                settlement={settlement}
                onStartChange={() => setIsEditingAccount(true)}
                onCancelChange={() => cancelAccountChange.mutate()}
                isCancelling={cancelAccountChange.isPending}
              />
            )}
          </>
        }
        right={
          <SettlementGuideCard businessType={settlement.businessType.value} />
        }
      />

      <AccountChangeConfirmModal
        isOpen={!!accountDraft}
        onClose={() => setAccountDraft(null)}
        onConfirm={confirmAccountChange}
        isSubmitting={changeAccount.isPending}
      />

      <BusinessTypeChangeModal
        target={businessTypeTarget}
        onClose={() => setBusinessTypeTarget(null)}
        onSubmit={submitBusinessType}
        isSubmitting={requestBusinessType.isPending}
      />
    </>
  )
}
