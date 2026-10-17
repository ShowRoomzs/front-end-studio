import Notice, { type NoticeTone } from "@/common/components/Notice/Notice"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
} from "@/features/contracts/components/shared/styles"
import {
  ActBtn,
  B,
  ReadRow,
  Sec,
} from "@/features/settlement/components/detail/DetailParts"
import {
  TAX_INVOICE_STATUS_LABEL,
  TAX_INVOICE_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import type {
  SettlementDetail,
  SettlementTaxInvoice,
  TaxInvoiceStatus,
  TaxInvoiceSubmitBody,
} from "@/features/settlement/types"
import {
  formatFullDate,
  formatFullDateTime,
  formatPercent,
  formatWon,
  isValidApprovalNo,
} from "@/features/settlement/utils/format"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"
import toast from "react-hot-toast"

const NOTICE_TONE: Record<TaxInvoiceStatus, NoticeTone> = {
  REQUIRED: "warn",
  REVIEWING: "info",
  REJECTED: "danger",
  APPROVED: "success",
}

const APPROVAL_PLACEHOLDER = "24자리 · 예) 20260829-41000012-38475920"

/**
 * 사업자 세금계산서 발행 카드 4상태(§44-4 · 시안 D5 · D5a · D5b · D5c).
 *
 * 정산이 자동 확정된 직후에만 나타난다 — 확인 기간 중 발행하면 조정 결과로 수정세금계산서가 생긴다.
 * 구성은 홈택스 입력 순서 그대로: 발행할 내용 → [발행 정보 복사] → 승인번호 + PDF(선택) → [제출].
 * 빈 값은 [제출] 비활성만, 형식 오류만 에러 문구. 확인 중에는 독촉 버튼이 없다(결과는 자동 알림).
 */
export default function TaxInvoiceCard(props: {
  detail: SettlementDetail
  isSubmitting: boolean
  onSubmit: (body: TaxInvoiceSubmitBody) => void
  onDownloadPdf: () => void
}) {
  const { detail, isSubmitting, onSubmit, onDownloadPdf } = props
  const invoice = detail.taxInvoice
  if (!invoice) return null
  const editable =
    invoice.status === "REQUIRED" || invoice.status === "REJECTED"

  return (
    <Sec
      title="세금계산서 발행"
      note="사업자 · SHOWROOMZ 앞으로 정발행 · 홈택스"
      right={
        <StatusBadge variant={TAX_INVOICE_STATUS_VARIANT[invoice.status]}>
          {TAX_INVOICE_STATUS_LABEL[invoice.status]}
        </StatusBadge>
      }
    >
      <Notice tone={NOTICE_TONE[invoice.status]} className="mb-3">
        {noticeText(detail, invoice)}
      </Notice>

      <ReadRow
        label="공급받는자"
        sub={`사업자등록번호 ${invoice.receiver.businessNumber} · ${invoice.receiver.address} · 수신 ${invoice.receiver.email}`}
      >
        {invoice.receiver.companyName} · 대표 {invoice.receiver.ceoName}
      </ReadRow>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <SumBox label="공급가액" value={invoice.supplyAmount} />
        <SumBox
          label={`부가세 ${formatPercent(detail.taxRates.vatRate)}`}
          value={invoice.vatAmount}
        />
        <SumBox label="합계" value={invoice.totalAmount} />
      </div>

      {invoice.status === "REVIEWING" && invoice.submission && (
        <ReadRow
          label="제출한 승인번호"
          className="mt-3"
          sub={`${formatFullDateTime(invoice.submission.submittedAt)} 제출 · ${
            invoice.submission.attachmentCount > 0
              ? `PDF ${invoice.submission.attachmentCount}개 첨부`
              : "첨부 없음"
          }`}
        >
          <span className="tabular-nums">{invoice.submission.approvalNo}</span>
        </ReadRow>
      )}

      {invoice.status === "REJECTED" && invoice.rejection && (
        <ReadRow
          label="반려 사유"
          className="mt-3"
          sub={`운영팀 · ${formatFullDateTime(invoice.rejection.rejectedAt)} · 이전 승인번호 ${invoice.rejection.previousApprovalNo}`}
        >
          {invoice.rejection.reason}
        </ReadRow>
      )}

      {invoice.status === "APPROVED" && invoice.approval && (
        <>
          <ReadRow
            label="승인번호"
            className="mt-3"
            sub={`확인 ${formatFullDate(invoice.approval.approvedAt)} · 운영팀`}
          >
            <span className="tabular-nums">{invoice.approval.approvalNo}</span>
          </ReadRow>
          {invoice.approval.hasPdf && (
            <div className="mt-3 flex justify-end">
              <ActBtn onClick={onDownloadPdf}>세금계산서 PDF 다운로드</ActBtn>
            </div>
          )}
        </>
      )}

      {editable && (
        <>
          <div className="mt-3 flex justify-end">
            <ActBtn onClick={() => copyIssueInfo(detail, invoice)}>
              발행 정보 복사
            </ActBtn>
          </div>
          {/* 반려 → 재입력은 새 승인번호라 상태가 바뀌면 입력을 비운다 */}
          <ApprovalForm
            key={invoice.status}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        </>
      )}
    </Sec>
  )
}

function noticeText(
  detail: SettlementDetail,
  invoice: SettlementTaxInvoice
): ReactNode {
  switch (invoice.status) {
    case "REQUIRED":
      return (
        <B>홈택스에서 발행한 뒤 승인번호를 입력해 주세요. 확인 후 지급돼요.</B>
      )
    case "REVIEWING":
      return (
        <>
          <B>운영팀이 홈택스 수취 내역과 대조하고 있어요.</B> 확인되면 알림을
          보내드려요.
        </>
      )
    case "REJECTED":
      return (
        <>
          <B>세금계산서가 반려되었어요.</B> 홈택스에서 수정세금계산서를 발행한
          뒤 새 승인번호를 입력해 주세요.
        </>
      )
    case "APPROVED": {
      const paid = detail.status === "PAID"
      const date = formatFullDate(
        paid ? detail.payout.paidDate : detail.payout.scheduledDate
      )
      return (
        <>
          <B>세금계산서가 확인되었어요.</B> {date}에{" "}
          {formatWon(invoice.totalAmount)}이{" "}
          {paid ? "지급되었어요" : "지급됩니다"}.
        </>
      )
    }
  }
}

/** 시안 `.tx-sum .k` */
function SumBox(props: { label: string; value: number }) {
  return (
    <div className="rounded-[6px] border border-sz-n-200 px-3 py-[9px]">
      <div className="text-[11px] text-sz-n-500">{props.label}</div>
      <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-sz-n-900">
        {formatWon(props.value)}
      </div>
    </div>
  )
}

/** [발행 정보 복사] — 홈택스에 옮겨 적을 값을 한 번에 */
function copyIssueInfo(
  detail: SettlementDetail,
  invoice: SettlementTaxInvoice
) {
  const r = invoice.receiver
  const text = [
    `공급받는자: ${r.companyName} (대표 ${r.ceoName})`,
    `사업자등록번호: ${r.businessNumber}`,
    `주소: ${r.address}`,
    `수신 이메일: ${r.email}`,
    `품목: ${detail.groupBuyTitle} 판매 리워드`,
    `공급가액: ${formatWon(invoice.supplyAmount)}`,
    `부가세: ${formatWon(invoice.vatAmount)}`,
    `합계: ${formatWon(invoice.totalAmount)}`,
  ].join("\n")

  navigator.clipboard
    .writeText(text)
    .then(() => toast.success("발행 정보를 복사했습니다."))
    .catch(() => toast.error("복사하지 못했습니다. 다시 시도해 주세요."))
}

/** 승인번호 + PDF(선택) + [제출] */
function ApprovalForm(props: {
  isSubmitting: boolean
  onSubmit: (body: TaxInvoiceSubmitBody) => void
}) {
  const { isSubmitting, onSubmit } = props
  const [approvalNo, setApprovalNo] = useState("")
  const [touched, setTouched] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const trimmed = approvalNo.trim()
  const valid = isValidApprovalNo(trimmed)
  // 빈 값은 문구 없이 버튼만 비활성 — 형식 오류는 입력을 마쳤거나 허용되지 않는 글자가 들어왔을 때만
  const hasIllegalChar = /[^0-9-\s]/.test(approvalNo)
  const showError = trimmed !== "" && !valid && (touched || hasIllegalChar)

  const handleFile = (selected: File | undefined) => {
    if (!selected) return
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("PDF 파일만 첨부할 수 있습니다.")
      return
    }
    setFile(selected)
  }

  return (
    <>
      <label className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600">
        국세청 승인번호<span className="ml-0.5 text-sz-danger-text">*</span>
      </label>
      <div className="mt-3 flex items-start gap-2">
        <input
          className={cn(
            INPUT_CLASS,
            "h-[34px] flex-1 tabular-nums",
            showError && INPUT_ERROR_CLASS
          )}
          placeholder={APPROVAL_PLACEHOLDER}
          value={approvalNo}
          onChange={event => setApprovalNo(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showError}
        />
        <Btn
          variant="primary"
          disabled={!valid}
          isLoading={isSubmitting}
          onClick={() => onSubmit({ approvalNo: trimmed, file })}
        >
          제출
        </Btn>
      </div>
      {showError && (
        <div role="alert" className="mt-[5px] text-[11px] text-sz-danger-text">
          승인번호 24자리를 확인해 주세요 — 숫자와 하이픈(-)만 입력할 수 있어요.
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={event => {
          handleFile(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      {file ? (
        <div className="mt-2 flex items-center gap-2 rounded-[6px] border border-sz-n-200 px-3 py-[9px] text-[11px] text-sz-n-700">
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button
            type="button"
            aria-label="첨부 삭제"
            className="text-sz-n-400 hover:text-sz-n-600"
            onClick={() => setFile(null)}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex w-full items-center gap-2 rounded-[6px] border border-dashed border-sz-n-300 px-3 py-[9px] text-left text-[11px] text-sz-n-500"
        >
          <span className="text-[14px] text-sz-n-400">＋</span>
          발행한 세금계산서 PDF 첨부
          <span className="text-sz-n-400">(선택)</span>
        </button>
      )}
    </>
  )
}
