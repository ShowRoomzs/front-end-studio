import { useState } from "react"

import Notice from "@/common/components/Notice/Notice"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import WithdrawalConditionList from "@/features/basicInfo/components/account/WithdrawalConditionList"
import WithdrawalRequestModal from "@/features/basicInfo/components/modals/WithdrawalRequestModal"
import {
  Field,
  InfoCard,
  NoteBox,
  ReadonlyInput,
  RequestBox,
} from "@/features/basicInfo/components/parts"
import { buttonClass } from "@/features/basicInfo/components/styles"
import {
  useAcknowledgeWithdrawalRejection,
  useCancelWithdrawal,
  useRequestWithdrawal,
} from "@/features/basicInfo/hooks/useBasicInfoQueries"
import { basicInfoService } from "@/features/basicInfo/services/basicInfoService"
import type { AccountResponse } from "@/features/basicInfo/types"
import {
  formatEventDateTime,
  formatPlainDate,
} from "@/features/basicInfo/utils/format"

/**
 * 오른쪽 「계정」 카드 — 로그인 수단 + 탈퇴 블록(S4 · S5 · S7 · S8).
 *
 * 탈퇴는 즉시 실행이 아니라 승인제다: 요청 → 운영자 승인 → 탈퇴. 기계가 판정할 수 있는 조건 3개를
 * 화면에서 먼저 잠그고(S4 → S5), 대기(S7)는 정보색 · 반려(S8)는 경고색이며 [확인]으로 직접 닫는다.
 * 정지 중 신청 불가(설정 false)면 서버 문장을 그대로 보인다(시안 06에는 없는 상태 · 1021 §7-3).
 */
export default function StudioAccountCard(props: { account: AccountResponse }) {
  const { login, withdrawal } = props.account
  const [isRequestOpen, setIsRequestOpen] = useState(false)

  const requestWithdrawal = useRequestWithdrawal()
  const cancelWithdrawal = useCancelWithdrawal()
  const acknowledgeRejection = useAcknowledgeWithdrawalRejection()

  const { state, pendingRequest, rejection } = withdrawal
  const days = withdrawal.approvalDueBusinessDays

  return (
    <InfoCard title="계정">
      <Field label="로그인 수단">
        <ReadonlyInput
          value={`${login.providerLabel} (소셜 로그인)`}
          lock="🔒 "
        />
        <div className="mt-[5px] text-[11px] leading-[1.7] text-sz-n-500">
          비밀번호가 없습니다 — 소비자 앱과 같은 계정으로 로그인합니다.
        </div>
      </Field>

      <div className="mt-3.5">
        {state === "PENDING" && pendingRequest ? (
          <RequestBox
            badge={<StatusBadge variant="info">승인 대기</StatusBadge>}
            title="탈퇴 승인 요청 중"
          >
            요청일 <b>{formatEventDateTime(pendingRequest.requestedAt)}</b> ·
            사유 <b>{pendingRequest.reasonText}</b>
            <br />
            운영자가 <b>영업일 {days}일 이내</b>(
            {formatPlainDate(pendingRequest.dueDate)}까지) 확인합니다 · 승인되면{" "}
            <b>즉시 탈퇴 처리</b>되고 알림을 받습니다.
            <br />
            대기 중에도 <b>스튜디오는 그대로 사용</b>할 수 있지만{" "}
            <b>새 연결 수락 · 계약 서명은 막힙니다</b> — 새 의무가 생기면 조건이
            다시 깨집니다.
          </RequestBox>
        ) : state === "REJECTED" && rejection ? (
          <RequestBox
            tone="warn"
            badge={<StatusBadge variant="warning">반려</StatusBadge>}
            title="탈퇴 승인이 반려되었습니다"
            action={
              <button
                type="button"
                disabled={acknowledgeRejection.isPending}
                onClick={() => acknowledgeRejection.mutate(rejection.requestId)}
                className={buttonClass("secondary", "sm")}
              >
                확인
              </button>
            }
          >
            반려일 <b>{formatEventDateTime(rejection.rejectedAt)}</b> · 운영자
            <br />
            사유 — <b>{rejection.reasonLabel}</b>
            {rejection.note && <> · {rejection.note}</>}
            <br />
            반려는 <b>거절이 아니라 남은 것이 있다는 통보</b>입니다 — 해소 후
            재요청할 수 있습니다.
          </RequestBox>
        ) : (
          <WithdrawalConditionList withdrawal={withdrawal} />
        )}
      </div>

      {withdrawal.suspensionBlockedReason && (
        <Notice tone="warn" className="mt-3.5">
          {withdrawal.suspensionBlockedReason}
        </Notice>
      )}

      <div className="mt-3.5 flex gap-2">
        <button
          type="button"
          onClick={() => void basicInfoService.logout()}
          className={buttonClass("secondary")}
        >
          로그아웃
        </button>
        {state === "PENDING" && pendingRequest ? (
          <button
            type="button"
            disabled={cancelWithdrawal.isPending}
            onClick={() => cancelWithdrawal.mutate(pendingRequest.requestId)}
            className={buttonClass("quiet")}
          >
            요청 취소
          </button>
        ) : (
          <button
            type="button"
            disabled={state !== "AVAILABLE"}
            onClick={() => setIsRequestOpen(true)}
            className={buttonClass("quiet")}
          >
            탈퇴 승인 요청
          </button>
        )}
      </div>

      <NoteBox>
        {state === "PENDING" ? (
          <>
            요청은 <b>승인 전까지 언제든 취소</b>할 수 있고, 취소하면 새 연결
            수락 · 계약 서명이 다시 열립니다.
          </>
        ) : state === "REJECTED" ? (
          <>
            <b>[확인]</b>을 누르면 이 안내가 사라지고 <b>조건 체크리스트</b>로
            돌아갑니다. 반려 사유와 이력은 <b>운영자 쪽에 남습니다</b> — 사유가
            해소되면 체크리스트가{" "}
            <b>
              {withdrawal.totalCount} / {withdrawal.totalCount} 충족
            </b>
            으로 바뀌고 다시 요청할 수 있습니다.
          </>
        ) : state === "AVAILABLE" ? (
          <>
            조건이 모두 충족되어 <b>승인을 요청할 수 있습니다</b>. 요청하면
            운영자가 세무 종결과 차감 가능성을 확인한 뒤 승인합니다(영업일{" "}
            {days}일 이내).
          </>
        ) : (
          <>
            탈퇴는 <b>운영자 승인</b>을 받아야 완료됩니다. 위 조건이{" "}
            <b>모두 충족되면</b> 승인을 요청할 수 있습니다 — 탈퇴해도{" "}
            <b>스튜디오 자격만 해지</b>되고 소비자 계정은 유지됩니다.
          </>
        )}
      </NoteBox>

      <WithdrawalRequestModal
        isOpen={isRequestOpen}
        approvalDueBusinessDays={days}
        onClose={() => setIsRequestOpen(false)}
        onSubmit={reason =>
          requestWithdrawal.mutate(reason, {
            onSettled: () => setIsRequestOpen(false),
          })
        }
        isSubmitting={requestWithdrawal.isPending}
      />
    </InfoCard>
  )
}
