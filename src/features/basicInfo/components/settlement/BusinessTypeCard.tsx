import toast from "react-hot-toast"

import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import {
  Field,
  FileBox,
  Hint,
  InfoCard,
  KvList,
  KvRow,
  NoteBox,
  ReadonlyInput,
  RequestBox,
} from "@/features/basicInfo/components/parts"
import { buttonClass } from "@/features/basicInfo/components/styles"
import { BUSINESS_TYPE_REVIEW_TEXT } from "@/features/basicInfo/constants/params"
import type {
  BusinessTypeChangeBanner,
  CreatorBusinessType,
  DocumentFile,
  SettlementInfoResponse,
  TaxInvoiceRecipient,
} from "@/features/basicInfo/types"
import {
  documentMetaText,
  documentSubText,
  fileBadge,
  fileNameFromUrl,
  formatEventDate,
  formatEventDateTime,
} from "@/features/basicInfo/utils/format"

interface BusinessTypeCardProps {
  settlement: SettlementInfoResponse
  onRequestChange: (target: CreatorBusinessType) => void
  onCancelRequest: (requestId: number) => void
  onAcknowledge: (requestId: number) => void
  isCancelling: boolean
  isAcknowledging: boolean
}

/**
 * 「사업자 여부」 카드(T1 · T4 · T4a · T5 · T9 · T9a · T10).
 *
 * 확인 대기 · 반려 배너가 있으면 카드 본문이 그 상자 하나가 된다(시안 T4 · T4a · T9 · T9a — 헤더 자물쇠 배지도 없다).
 * 요청 버튼은 모든 상태에서 같은 자리다. 계좌 변경이 확인 중이면 서버가 비활성 사유를 싣는다(1021 Q24).
 */
export default function BusinessTypeCard(props: BusinessTypeCardProps) {
  const {
    settlement,
    onRequestChange,
    onCancelRequest,
    onAcknowledge,
    isCancelling,
    isAcknowledging,
  } = props
  const { businessType, business, taxInvoiceRecipient, actions } = settlement
  const change = settlement.businessTypeChange
  const showsRequest =
    change && (change.status === "PENDING" || change.status === "REJECTED")

  return (
    <InfoCard
      title="사업자 여부"
      badge={
        showsRequest ? undefined : (
          <StatusBadge variant="neutral" hideDot>
            🔒 변경 시 운영자 확인
          </StatusBadge>
        )
      }
    >
      {showsRequest ? (
        <ChangeRequestPanel
          change={change}
          canCancel={actions.businessTypeChange === "CANCEL"}
          onCancel={() => onCancelRequest(change.requestId)}
          onAcknowledge={() => onAcknowledge(change.requestId)}
          isCancelling={isCancelling}
          isAcknowledging={isAcknowledging}
        />
      ) : businessType.value === "INDIVIDUAL" ? (
        <>
          <Field label="구분">
            <ReadonlyInput value={businessType.label} lock="🔒" />
            <Hint>
              리워드는 <b>SHOWROOMZ가 지급</b>하며, 비사업자는 <b>3.3%</b>
              (소득세 · 지방소득세)를 원천징수한 뒤 입금돼요.
            </Hint>
            <Hint>
              {businessType.confirmedAt
                ? `${formatEventDate(businessType.confirmedAt)} 운영자 확인 · 개인사업자에서 변경되었습니다.`
                : "가입 · 온보딩에서 선택한 값입니다."}
            </Hint>
          </Field>
          <RequestButtons settlement={settlement} onRequest={onRequestChange} />
        </>
      ) : (
        <>
          <KvList>
            <KvRow
              label="구분"
              sub={
                businessType.confirmedAt
                  ? `${formatEventDate(businessType.confirmedAt)} 확인 완료`
                  : undefined
              }
            >
              {businessType.label}
            </KvRow>
            {business && (
              <>
                <KvRow label="사업자등록번호" tabular>
                  {business.registrationNumber}
                </KvRow>
                {business.license && (
                  <KvRow
                    label="사업자등록증"
                    sub={documentSubText(business.license)}
                  >
                    제출 완료
                  </KvRow>
                )}
              </>
            )}
          </KvList>
          <NoteBox>
            원천징수 없이 <b>리워드 + 부가세 10%</b>를 지급받고, 대신{" "}
            <b>SHOWROOMZ 앞으로 세금계산서를 발행</b>합니다. 공급가액 · 승인번호
            입력은 <b>정산 관리</b>에서 공구별로 안내됩니다.
          </NoteBox>
          <RequestButtons
            settlement={settlement}
            onRequest={onRequestChange}
            copyTarget={taxInvoiceRecipient}
            className="mt-3.5"
          />
        </>
      )}
    </InfoCard>
  )
}

/** [개인사업자로 · 비사업자로 변경 요청] (+ 사업자면 [발행 정보 복사]) */
function RequestButtons(props: {
  settlement: SettlementInfoResponse
  onRequest: (target: CreatorBusinessType) => void
  copyTarget?: TaxInvoiceRecipient | null
  className?: string
}) {
  const { settlement, onRequest, copyTarget, className } = props
  const { actions } = settlement
  if (actions.businessTypeChange === "CANCEL") return null

  const target: CreatorBusinessType =
    actions.businessTypeChange === "REQUEST_TO_BUSINESS"
      ? "BUSINESS"
      : "INDIVIDUAL"
  const blockedReason = actions.businessTypeChangeBlockedReason

  return (
    <div className={className}>
      <div className="flex justify-end gap-2">
        {copyTarget && (
          <button
            type="button"
            onClick={() => copyIssueInfo(copyTarget)}
            className={buttonClass("secondary", "sm")}
          >
            발행 정보 복사
          </button>
        )}
        <button
          type="button"
          disabled={!!blockedReason}
          onClick={() => onRequest(target)}
          className={buttonClass("secondary", "sm")}
        >
          {target === "BUSINESS"
            ? "개인사업자로 변경 요청"
            : "비사업자로 변경 요청"}
        </button>
      </div>
      {blockedReason && <Hint className="text-right">{blockedReason}</Hint>}
    </div>
  )
}

/** 확인 대기(T4 · T9 · 정보) · 반려(T4a · T9a · 경고) 상자 + 제출한 증빙 */
function ChangeRequestPanel(props: {
  change: BusinessTypeChangeBanner
  canCancel: boolean
  onCancel: () => void
  onAcknowledge: () => void
  isCancelling: boolean
  isAcknowledging: boolean
}) {
  const {
    change,
    canCancel,
    onCancel,
    onAcknowledge,
    isCancelling,
    isAcknowledging,
  } = props
  const toBusiness = change.type === "TO_BUSINESS"
  const evidenceLabel = toBusiness ? "사업자등록증" : "폐업사실증명원"

  return (
    <>
      {change.status === "PENDING" ? (
        <RequestBox
          badge={<StatusBadge variant="info">확인 대기</StatusBadge>}
          title={
            toBusiness ? "개인사업자 변경 요청 중" : "비사업자 변경 요청 중"
          }
          action={
            canCancel && (
              <button
                type="button"
                disabled={isCancelling}
                onClick={onCancel}
                className={buttonClass("secondary", "sm")}
              >
                요청 취소
              </button>
            )
          }
        >
          {toBusiness ? (
            <>
              요청일 <b>{formatEventDate(change.requestedAt)}</b> ·
              사업자등록번호 <b>{change.businessRegistrationNumber ?? "—"}</b>
              <br />
              운영자가 <b>{BUSINESS_TYPE_REVIEW_TEXT}</b> 확인합니다 · 승인되면{" "}
              <b>다음 정산부터</b> 원천징수 없이 <b>리워드 + 부가세 10%</b>를
              지급받고, <b>SHOWROOMZ 앞으로 세금계산서</b>를 발행합니다.
              <br />
              <b>확인이 끝날 때까지는 비사업자(3.3% 원천징수)로 정산이 계속</b>
              됩니다 — 정산이 멈추지는 않습니다.
            </>
          ) : (
            <>
              요청일 <b>{formatEventDate(change.requestedAt)}</b> · 주민등록번호{" "}
              <b>{change.maskedResidentNumber ?? "—"}</b>
              <br />
              운영자가 <b>{BUSINESS_TYPE_REVIEW_TEXT}</b> 확인합니다 · 승인되면{" "}
              <b>다음 정산부터</b> SHOWROOMZ가 <b>3.3%를 원천징수</b>한 뒤
              입금합니다.
              <br />
              <b>확인이 끝날 때까지는 개인사업자로 정산이 계속</b>됩니다 — 그
              사이 확정된 정산은 세금계산서를 발행해야 지급됩니다.
            </>
          )}
        </RequestBox>
      ) : (
        <RequestBox
          tone="warn"
          badge={<StatusBadge variant="warning">반려</StatusBadge>}
          title={
            toBusiness
              ? "개인사업자 변경 요청이 반려되었습니다"
              : "비사업자 변경 요청이 반려되었습니다"
          }
          action={
            <button
              type="button"
              disabled={isAcknowledging}
              onClick={onAcknowledge}
              className={buttonClass("secondary", "sm")}
            >
              확인
            </button>
          }
        >
          반려일 <b>{formatEventDateTime(change.processedAt) ?? "—"}</b> ·
          운영자
          <br />
          사유 — <RejectReasonText change={change} />
          <br />
          {toBusiness ? (
            <>
              정산은 지금처럼 <b>비사업자(3.3% 원천징수)로 계속</b>됩니다.
            </>
          ) : (
            <>
              정산은 지금처럼 <b>개인사업자(세금계산서 발행)로 계속</b>됩니다.
            </>
          )}
        </RequestBox>
      )}

      {change.evidence && (
        <Field
          label={`${change.status === "PENDING" ? "제출한" : "반려된"} ${evidenceLabel}`}
          className="mt-3.5"
        >
          <EvidenceBox doc={change.evidence} />
          {toBusiness && (
            <Hint>
              상호 · 대표자 · 업태는 <b>등록증으로 확인</b>합니다 — 따로
              입력받지 않습니다.
            </Hint>
          )}
        </Field>
      )}
    </>
  )
}

/** 정형 사유 라벨 + 상세(기타일 때 운영자 입력). 기타는 상세가 곧 사유다 */
function RejectReasonText(props: { change: BusinessTypeChangeBanner }) {
  const { rejectReason, rejectReasonDetail } = props.change
  if (rejectReason?.code === "OTHER" && rejectReasonDetail) {
    return <b>{rejectReasonDetail}</b>
  }
  return (
    <>
      <b>{rejectReason?.label ?? "—"}</b>
      {rejectReasonDetail && <> · {rejectReasonDetail}</>}
    </>
  )
}

function EvidenceBox(props: { doc: DocumentFile }) {
  const { doc } = props
  const name = doc.fileName ?? fileNameFromUrl(doc.url) ?? "제출 완료"

  return (
    <FileBox
      badge={fileBadge(doc.fileName ?? fileNameFromUrl(doc.url))}
      name={name}
      meta={documentMetaText(doc)}
    />
  )
}

/** [발행 정보 복사] — 공급받는자(SHOWROOMZ)를 홈택스에 옮겨 적을 형태로. 정산 관리의 같은 버튼과 같은 줄 구성 */
function copyIssueInfo(recipient: TaxInvoiceRecipient) {
  const text = [
    `공급받는자: ${recipient.businessName} (대표 ${recipient.representative})`,
    `사업자등록번호: ${recipient.registrationNumber}`,
    `주소: ${recipient.address}`,
    // 수신 이메일이 비어 있으면(서버 설정 [확인 필요]) 옮겨 적을 값이 없어 줄을 뺀다
    ...(recipient.taxEmail?.trim()
      ? [`수신 이메일: ${recipient.taxEmail}`]
      : []),
  ].join("\n")

  navigator.clipboard
    .writeText(text)
    .then(() => toast.success("발행 정보를 복사했습니다."))
    .catch(() => toast.error("복사하지 못했습니다. 다시 시도해 주세요."))
}
