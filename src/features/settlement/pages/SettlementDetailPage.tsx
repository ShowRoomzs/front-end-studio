import Notice from "@/common/components/Notice/Notice"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import Btn from "@/features/contracts/components/shared/Btn"
import { B, Grp } from "@/features/settlement/components/detail/DetailParts"
import {
  AdjustmentCard,
  AdjustmentHold,
  BreakdownCard,
  DeductionCard,
  DistributionCard,
  PayoutInfoCard,
  StatementCard,
  SummaryBar,
  WithholdingCard,
} from "@/features/settlement/components/detail/SettlementSections"
import TaxInvoiceCard from "@/features/settlement/components/detail/TaxInvoiceCard"
import {
  SETTLEMENT_PAGE_CLASS,
  SettlementPageHeader,
} from "@/features/settlement/components/list/SettlementListParts"
import AdjustmentRequestModal, {
  type AdjustmentFieldErrors,
} from "@/features/settlement/components/modals/AdjustmentRequestModal"
import {
  SETTLEMENT_LIST_PATH,
  TONE_VARIANT,
} from "@/features/settlement/constants/params"
import {
  settlementErrorCode,
  settlementErrorText,
  useSettlementDownload,
} from "@/features/settlement/hooks/useSettlementDownload"
import {
  useGetSettlementDetail,
  useInvalidateSettlement,
  useRequestAdjustment,
  useSubmitTaxInvoice,
} from "@/features/settlement/hooks/useSettlementQueries"
import { settlementService } from "@/features/settlement/services/settlementService"
import type {
  AdjustmentRequestBody,
  SettlementDetail,
  TaxInvoiceSubmitBody,
} from "@/features/settlement/types"
import {
  formatMonthDayTime,
  formatPeriod,
} from "@/features/settlement/utils/format"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom"

/** 화면이 아직 없는 목적지 — 이슈 스레드(§42) · 성과 관리 · 기본정보 관리 */
const notReadyToast = (screen: string) =>
  toast(`${screen} 화면은 준비 중입니다.`)

/** 한 몫이라도 이미 나갔는가(사업자 대기 중에도 브랜드 몫은 원래 날짜에 지급) — 소제목 시제 */
const anyPayoutPaid = (detail: SettlementDetail) =>
  detail.settlement.status === "PAID" ||
  detail.payouts.rows.some(row => row.status === "PAID")

/** 상태가 이미 바뀐 409 — 문구를 띄우고 화면을 새로 읽는다(버튼이 서버 판정대로 바뀐다) */
const ADJUSTMENT_STALE_CODES = new Set([
  "SETTLEMENT_ADJUSTMENT_WINDOW_CLOSED",
  "SETTLEMENT_ADJUSTMENT_ALREADY_EXISTS",
  "SETTLEMENT_NOT_FOUND",
])

const TAX_INVOICE_STALE_CODES = new Set([
  "SETTLEMENT_TAX_INVOICE_NOT_OPEN",
  "SETTLEMENT_TAX_INVOICE_NOT_REQUIRED",
  "SETTLEMENT_TAX_DOCUMENT_STATE_CHANGED",
  "SETTLEMENT_NOT_FOUND",
])

/**
 * `/settlement/:settlementId` — 상세 D1 ~ D5c가 모두 이 한 화면이다(ui-studio-12 rev.3).
 *
 * 「내 리워드가 어떻게 나왔는지」가 화면의 전부다. 버튼은 조회 · 이동 · 내보내기와, 확인 기간의
 * [정산 조정 요청] · 사업자 승인번호 [제출]뿐이다 — 금액 수정 · 지급 요청 · 앞당기기는 없다.
 * 블록은 서버가 상태에 따라 null로 내리고, null인 블록은 그리지 않는다.
 */
export default function SettlementDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { settlementId } = useRouteParams<{ settlementId: string }>()
  const id = Number(settlementId)

  const goList = () =>
    navigate({ pathname: SETTLEMENT_LIST_PATH, search: location.search })

  return <SettlementDetailView id={id} onList={goList} />
}

function SettlementDetailView(props: { id: number; onList: () => void }) {
  const { id, onList } = props
  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSettlementDetail(id)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustErrors, setAdjustErrors] = useState<AdjustmentFieldErrors>({})
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const { mutate: requestAdjustment, isPending: isRequesting } =
    useRequestAdjustment()
  const { mutate: submitTaxInvoice, isPending: isSubmittingInvoice } =
    useSubmitTaxInvoice()
  const invalidate = useInvalidateSettlement()
  const { run: runDownload, pendingKey } = useSettlementDownload()

  if (isLoading) {
    return (
      <div className="flex justify-center py-[120px]">
        <Loader2 className="size-5 animate-spin text-sz-n-400" />
      </div>
    )
  }

  if (isError || !detail) {
    // 남의 정산 · 없음은 404(서버가 403을 쓰지 않는다) — 그 밖의 실패는 다시 시도할 수 있다
    const notFound =
      !isError || (axios.isAxiosError(error) && error.response?.status === 404)
    return (
      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white px-6 py-[72px] text-center">
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          {notFound
            ? "정산 내역을 찾을 수 없습니다"
            : "정산 내역을 불러오지 못했습니다"}
        </div>
        <div className="text-[12px] leading-[1.6] text-sz-n-500">
          {notFound
            ? "삭제되었거나 내 정산이 아닙니다."
            : "잠시 후 다시 시도해 주세요."}
        </div>
        <div className="mt-4 flex justify-center gap-1.5">
          {!notFound && (
            <Btn variant="primary" onClick={() => refetch()}>
              다시 시도
            </Btn>
          )}
          <Btn variant="secondary" onClick={onList}>
            목록으로
          </Btn>
        </div>
      </div>
    )
  }

  const { settlement } = detail
  const settlementNumber = settlement.settlementNumber
  const business = settlement.creatorBusinessType === "BUSINESS"
  // 이슈 스레드 화면이 아직 없다 — `adjustment.threadId`로 이동할 자리만 남겨 둔다
  const openThread = () => notReadyToast("이슈 스레드")

  const handleAdjustmentSubmit = (body: AdjustmentRequestBody) => {
    setAdjustErrors({})
    requestAdjustment(
      { settlementId: settlement.settlementId, body },
      {
        onSuccess: () => {
          setIsAdjustOpen(false)
          toast.success(
            "정산 조정을 요청했습니다. 정산이 보류되고 이슈 스레드에서 브랜드와 협의합니다."
          )
        },
        onError: error => {
          const code = settlementErrorCode(error)
          const text = settlementErrorText(
            error,
            "요청하지 못했습니다. 잠시 후 다시 시도해 주세요."
          )
          if (code === "SETTLEMENT_ADJUSTMENT_AMOUNT_OUT_OF_RANGE") {
            setAdjustErrors({ amount: text })
            return
          }
          // 사유 빈 값 · 길이 초과(INVALID_INPUT_VALUE)는 사유 칸의 오류다
          if (
            code === "SETTLEMENT_ADJUSTMENT_REASON_REQUIRED" ||
            code === "INVALID_INPUT_VALUE"
          ) {
            setAdjustErrors({ reason: text })
            return
          }
          toast.error(text)
          if (code && ADJUSTMENT_STALE_CODES.has(code)) {
            setIsAdjustOpen(false)
            invalidate()
          }
        },
      }
    )
  }

  const handleTaxInvoiceSubmit = (body: TaxInvoiceSubmitBody) => {
    setInvoiceError(null)
    submitTaxInvoice(
      { settlementId: settlement.settlementId, body },
      {
        onSuccess: () =>
          toast.success(
            "승인번호를 제출했습니다. 운영팀이 확인하면 알림을 보내드립니다."
          ),
        onError: error => {
          const code = settlementErrorCode(error)
          const text = settlementErrorText(
            error,
            "제출하지 못했습니다. 다시 시도해 주세요."
          )
          // 형식 오류 · 다른 정산에서 이미 확인된 번호 — 입력칸 아래에 적는다(D5b)
          if (code === "SETTLEMENT_TAX_INVOICE_NUMBER_INVALID") {
            setInvoiceError(text)
            return
          }
          toast.error(text)
          if (code && TAX_INVOICE_STALE_CODES.has(code)) invalidate()
        },
      }
    )
  }

  return (
    <div className={SETTLEMENT_PAGE_CLASS}>
      <SettlementPageHeader
        title={settlement.groupBuyTitle}
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {settlement.brandName} · 정산 대상 기간{" "}
            {formatPeriod(
              settlement.periodStartAt,
              settlement.periodEndAt,
              true
            )}
            <StatusBadge variant={TONE_VARIANT[settlement.statusTone]}>
              {settlement.statusLabel}
            </StatusBadge>
          </span>
        }
        right={
          <div className="flex shrink-0 items-center gap-1.5">
            <RecordNav onList={onList} listLabel="목록으로" />
            <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
            <HeaderAction
              detail={detail}
              onRequestAdjustment={() => {
                setAdjustErrors({})
                setIsAdjustOpen(true)
              }}
              onOpenThread={openThread}
            />
          </div>
        }
      />

      {settlement.status === "REVIEWING" && (
        <Notice tone="info" className="mb-4">
          <B>
            {formatMonthDayTime(
              detail.review?.requestDeadlineAt ?? detail.timeline.reviewDueAt
            )}
            까지 리워드를 확인하고 필요하면 정산 조정을 요청할 수 있어요. 요청이
            없으면 다음 날 자동 확정돼요.
          </B>
          <br />
          금액이 맞지 않으면 우측 상단 <B>[정산 조정 요청]</B>으로 조정할 리워드
          금액과 사유를 보내 주세요 — 요청하면 이 공구 정산이 <B>전액 보류</B>
          되고 브랜드와의 <B>이슈 스레드</B>가 열립니다.
        </Notice>
      )}

      {settlement.status === "ADJUSTING" && (
        <AdjustmentHold detail={detail} onOpenThread={openThread} />
      )}
      {/* 서버는 협의가 끝난 뒤에도 조정 내역을 이력으로 내린다 */}
      <AdjustmentCard detail={detail} />

      <TaxInvoiceCard
        detail={detail}
        isSubmitting={isSubmittingInvoice}
        submitError={invoiceError}
        onEdit={() => setInvoiceError(null)}
        onSubmit={handleTaxInvoiceSubmit}
        isDownloadingPdf={pendingKey === "taxInvoice"}
        onDownloadPdf={() =>
          runDownload(
            "taxInvoice",
            () =>
              settlementService.downloadTaxInvoiceAttachment(
                settlement.settlementId,
                detail.taxInvoice?.attachmentName ?? "tax-invoice.pdf"
              ),
            { notFoundText: "제출한 세금계산서 PDF가 없습니다." }
          )
        }
      />

      <SummaryBar detail={detail} />

      <Grp title="금액" sub="내 리워드가 어떻게 나왔나" />
      <BreakdownCard detail={detail} />
      <DeductionCard detail={detail} />

      <Grp
        title="분배 · 지급"
        sub={
          // 시안 D4 · D5~D5c — 한 몫이라도 이미 나갔으면(사업자 대기 중에도 브랜드 몫은 원래 날짜에 지급) 과거형
          anyPayoutPaid(detail)
            ? "누구에게 얼마가 갔고 언제 들어왔나"
            : "누구에게 얼마가 가고 언제 들어오나"
        }
      />
      <div className="mb-4 grid grid-cols-2 items-start gap-3">
        <DistributionCard detail={detail} />
        <PayoutInfoCard
          detail={detail}
          onOpenAccount={() => notReadyToast("기본정보 관리")}
        />
      </div>

      {/* 사업자 증빙은 상단 세금계산서 발행 카드가 맡는다(서버도 사업자에게 withholding을 내리지 않는다) */}
      {!business && detail.withholding && (
        <>
          <Grp title="증빙" sub="세금 처리" />
          <WithholdingCard
            detail={detail}
            isDownloading={pendingKey === "receipt"}
            onDownload={() =>
              runDownload("receipt", () =>
                settlementService.downloadWithholdingReceipt(
                  settlement.settlementId,
                  settlementNumber
                )
              )
            }
          />
        </>
      )}

      <Grp title="명세" sub="주문 단위로 확인" />
      <StatementCard
        detail={detail}
        isDownloading={pendingKey === "statement"}
        onDownload={() =>
          runDownload("statement", () =>
            settlementService.downloadItems(
              settlement.settlementId,
              settlementNumber
            )
          )
        }
      />

      {isAdjustOpen && (
        <AdjustmentRequestModal
          detail={detail}
          isPending={isRequesting}
          fieldErrors={adjustErrors}
          onEditField={field =>
            setAdjustErrors(prev => ({ ...prev, [field]: undefined }))
          }
          onClose={() => setIsAdjustOpen(false)}
          onSubmit={handleAdjustmentSubmit}
        />
      )}
    </div>
  )
}

/**
 * 상단 우측 액션 — 정산 확인 중 = [정산 조정 요청](이 상태에서만 · 서버 판정 `canRequestAdjustment`가
 * false면 에러 문구 없이 비활성) · 조정 협의 = [이슈 스레드 열기] · 그 외 = [성과 관리에서 보기].
 */
function HeaderAction(props: {
  detail: SettlementDetail
  onRequestAdjustment: () => void
  onOpenThread: () => void
}) {
  const { detail, onRequestAdjustment, onOpenThread } = props
  const status = detail.settlement.status

  if (status === "REVIEWING") {
    return (
      <Btn
        variant="primary"
        disabled={!detail.review?.canRequestAdjustment}
        onClick={onRequestAdjustment}
      >
        정산 조정 요청
      </Btn>
    )
  }
  if (status === "ADJUSTING") {
    return (
      <Btn variant="secondary" onClick={onOpenThread}>
        이슈 스레드 열기
      </Btn>
    )
  }
  return (
    <Btn variant="secondary" onClick={() => notReadyToast("성과 관리")}>
      성과 관리에서 보기
    </Btn>
  )
}
