import NotReady from "@/common/components/NotReady/NotReady"
import Notice from "@/common/components/Notice/Notice"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock"
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
  SETTLEMENT_DESCRIPTION,
  SettlementPageHeader,
} from "@/features/settlement/components/list/SettlementListParts"
import AdjustmentRequestModal from "@/features/settlement/components/modals/AdjustmentRequestModal"
import {
  SETTLEMENT_LIST_PATH,
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_VARIANT,
} from "@/features/settlement/constants/params"
import {
  useGetSettlementDetail,
  useRequestAdjustment,
  useSubmitTaxInvoice,
} from "@/features/settlement/hooks/useSettlementQueries"
import type { SettlementDetail } from "@/features/settlement/types"
import {
  formatMonthDayTime,
  formatPeriod,
} from "@/features/settlement/utils/format"
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

const mockDownloadToast = (label: string) =>
  toast(
    `개발용 목업이라 ${label} 파일이 없습니다. 정산 API가 연결되면 내려받을 수 있습니다.`
  )

/**
 * `/settlement/:settlementId` — 상세 D1 ~ D5c가 모두 이 한 화면이다(ui-studio-12 rev.3).
 *
 * 「내 리워드가 어떻게 나왔는지」가 화면의 전부다. 버튼은 조회 · 이동 · 내보내기와, 확인 기간의
 * [정산 조정 요청] · 사업자 승인번호 [제출]뿐이다 — 금액 수정 · 지급 요청 · 앞당기기는 없다.
 */
export default function SettlementDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { settlementId } = useRouteParams<{ settlementId: string }>()
  const id = Number(settlementId)

  const goList = () =>
    navigate({ pathname: SETTLEMENT_LIST_PATH, search: location.search })

  if (!DEV_MOCK_ENABLED) {
    return (
      <div>
        <SettlementPageHeader
          title="정산 상세"
          description={SETTLEMENT_DESCRIPTION}
          right={<RecordNav onList={goList} />}
        />
        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          <NotReady title="정산 상세 화면은 준비 중입니다" />
        </div>
      </div>
    )
  }

  return <SettlementDetailView id={id} onList={goList} />
}

function SettlementDetailView(props: { id: number; onList: () => void }) {
  const { id, onList } = props
  const { data: detail, isLoading, isError } = useGetSettlementDetail(id)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const { mutate: requestAdjustment, isPending: isRequesting } =
    useRequestAdjustment()
  const { mutate: submitTaxInvoice, isPending: isSubmittingInvoice } =
    useSubmitTaxInvoice()

  if (isLoading) {
    return (
      <div className="flex justify-center py-[120px]">
        <Loader2 className="size-5 animate-spin text-sz-n-400" />
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <NotReady
          title="정산 내역을 찾을 수 없습니다"
          action={
            <Btn variant="secondary" onClick={onList}>
              목록
            </Btn>
          }
        >
          삭제되었거나 내 정산이 아닙니다.
        </NotReady>
      </div>
    )
  }

  const business = detail.taxType === "BUSINESS"
  const openThread = () => notReadyToast("이슈 스레드")

  return (
    <div>
      <SettlementPageHeader
        title={detail.groupBuyTitle}
        description={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {detail.brandName} · 정산 대상 기간{" "}
            {formatPeriod(detail.periodStart, detail.periodEnd, true)}
            <StatusBadge variant={SETTLEMENT_STATUS_VARIANT[detail.status]}>
              {SETTLEMENT_STATUS_LABEL[detail.status]}
            </StatusBadge>
          </span>
        }
        right={
          <div className="flex shrink-0 items-center gap-1.5">
            <RecordNav onList={onList} />
            <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
            <HeaderAction
              detail={detail}
              onRequestAdjustment={() => setIsAdjustOpen(true)}
              onOpenThread={openThread}
            />
          </div>
        }
      />

      {detail.status === "CONFIRMING" && (
        <Notice tone="info" className="mb-4">
          <B>
            {formatMonthDayTime(detail.confirmDeadlineAt)}까지 리워드를 확인하고
            필요하면 정산 조정을 요청할 수 있어요. 요청이 없으면 다음 날 자동
            확정돼요.
          </B>
          <br />
          금액이 맞지 않으면 우측 상단 <B>[정산 조정 요청]</B>으로 조정할 리워드
          금액과 사유를 보내 주세요 — 요청하면 이 공구 정산이 <B>전액 보류</B>
          되고 브랜드와의 <B>이슈 스레드</B>가 열립니다.
        </Notice>
      )}

      {detail.status === "ADJUSTING" && (
        <>
          <AdjustmentHold detail={detail} onOpenThread={openThread} />
          <AdjustmentCard detail={detail} />
        </>
      )}

      {business && (
        <TaxInvoiceCard
          detail={detail}
          isSubmitting={isSubmittingInvoice}
          onSubmit={body =>
            submitTaxInvoice(
              { settlementId: detail.settlementId, body },
              {
                onSuccess: () =>
                  toast.success(
                    "승인번호를 제출했습니다. 운영팀이 확인하면 알림을 보내드립니다."
                  ),
                onError: () =>
                  toast.error("제출하지 못했습니다. 다시 시도해 주세요."),
              }
            )
          }
          onDownloadPdf={() => mockDownloadToast("세금계산서 PDF")}
        />
      )}

      <SummaryBar detail={detail} />

      <Grp title="금액" sub="내 리워드가 어떻게 나왔나" />
      <BreakdownCard detail={detail} />
      <DeductionCard detail={detail} />

      <Grp
        title="분배 · 지급"
        sub={
          detail.status === "PAID"
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

      {/* 사업자 증빙은 상단 세금계산서 발행 카드가 맡는다(시안 D5 계열에 원천징수 블록 없음) */}
      {!business && (
        <>
          <Grp title="증빙" sub="세금 처리" />
          <WithholdingCard
            detail={detail}
            onDownload={() => mockDownloadToast("원천징수영수증")}
          />
        </>
      )}

      <Grp title="명세" sub="주문 단위로 확인" />
      <StatementCard
        detail={detail}
        onDownload={() => mockDownloadToast("정산 명세")}
      />

      {isAdjustOpen && (
        <AdjustmentRequestModal
          detail={detail}
          isPending={isRequesting}
          onClose={() => setIsAdjustOpen(false)}
          onSubmit={body =>
            requestAdjustment(
              { settlementId: detail.settlementId, body },
              {
                onSuccess: () => {
                  setIsAdjustOpen(false)
                  toast.success(
                    "정산 조정을 요청했습니다. 정산이 보류되고 이슈 스레드에서 브랜드와 협의합니다."
                  )
                },
                onError: () =>
                  toast.error(
                    "요청하지 못했습니다. 확인 기간이 지났는지 확인해 주세요."
                  ),
              }
            )
          }
        />
      )}
    </div>
  )
}

/**
 * 상단 우측 액션 — 정산 확인 중 = [정산 조정 요청](이 상태에서만 · 마감 뒤 비활성) ·
 * 조정 협의 = [이슈 스레드 열기] · 그 외 = [성과 관리에서 보기].
 */
function HeaderAction(props: {
  detail: SettlementDetail
  onRequestAdjustment: () => void
  onOpenThread: () => void
}) {
  const { detail, onRequestAdjustment, onOpenThread } = props

  if (detail.status === "CONFIRMING") {
    return (
      <Btn
        variant="primary"
        disabled={!detail.canRequestAdjustment}
        onClick={onRequestAdjustment}
      >
        정산 조정 요청
      </Btn>
    )
  }
  if (detail.status === "ADJUSTING") {
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
