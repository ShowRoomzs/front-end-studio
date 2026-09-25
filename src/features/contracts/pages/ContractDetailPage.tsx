import DetailCard from "@/common/components/DetailCard/DetailCard"
import HistoryList from "@/common/components/HistoryList/HistoryList"
import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import { useGetShowroomName } from "@/common/hooks/useGetShowroomName"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import ClosureReasonCard from "@/features/contracts/components/detail/ClosureReasonCard"
import ContractItemsCard from "@/features/contracts/components/detail/ContractItemsCard"
import ContractTermsCard from "@/features/contracts/components/detail/ContractTermsCard"
import DocumentsCard from "@/features/contracts/components/detail/DocumentsCard"
import MyDutiesCard from "@/features/contracts/components/detail/MyDutiesCard"
import PayoutCard from "@/features/contracts/components/detail/PayoutCard"
import SigningProgressCard from "@/features/contracts/components/detail/SigningProgressCard"
import StatusSideCard from "@/features/contracts/components/detail/StatusSideCard"
import DeclineModal from "@/features/contracts/components/modals/DeclineModal"
import SignedResultModal from "@/features/contracts/components/modals/SignedResultModal"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  CREATOR_CONTRACT_INITIAL_PARAMS,
  CREATOR_CONTRACT_LIST_PATH,
} from "@/features/contracts/constants/params"
import {
  useDeclineContract,
  useRequestResend,
} from "@/features/contracts/hooks/useCreatorContractMutations"
import { useGetCreatorContractDetail } from "@/features/contracts/hooks/useCreatorContractQueries"
import type {
  ContractDeclineReason,
  CreatorContractNavigationParams,
  CreatorContractSortType,
  CreatorContractTab,
} from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  deriveCreatorView,
} from "@/features/contracts/utils/contractView"
import { toHistoryItems } from "@/features/contracts/utils/history"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
  useSearchParams,
} from "react-router-dom"

/**
 * S3·S3a·S3b·S3c·S6·S7·S8·S9 — 받은 계약 상세(쇼룸 스튜디오). 한 응답으로 8종을 그린다.
 *
 * 인플루언서가 할 수 있는 일은 **거절 · 서명 안내 재발송 요청 · 스레드 이동 · 문서 다운로드**뿐이다.
 * 조건 입력 필드는 어디에도 없다(§27-4). 서명은 이 화면 밖(전자서명 링크)에서 일어난다.
 */
export default function ContractDetailPage() {
  usePageSubtitle("계약서")
  const navigate = useNavigate()
  const location = useLocation()
  const { contractId: contractIdParam } = useRouteParams<{
    contractId: string
  }>()
  const [searchParams] = useSearchParams()
  const contractId = Number(contractIdParam)

  // 목록에서 들고 온 조건 — 서버가 이 범위로 이전/다음 ID를 계산한다
  const navParams = useMemo<CreatorContractNavigationParams>(
    () => ({
      tab: (searchParams.get("tab") ??
        CREATOR_CONTRACT_INITIAL_PARAMS.tab) as CreatorContractTab,
      keyword: searchParams.get("keyword") ?? "",
      sort: (searchParams.get("sort") ??
        CREATOR_CONTRACT_INITIAL_PARAMS.sort) as CreatorContractSortType,
    }),
    [searchParams]
  )

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetCreatorContractDetail(contractId, navParams)
  const { data: showroom } = useGetShowroomName()
  const { mutateAsync: decline, isPending: isDeclining } = useDeclineContract()
  const { mutateAsync: requestResend, isPending: isResending } =
    useRequestResend()

  const [isDeclineOpen, setIsDeclineOpen] = useState(false)
  const [isSignedOpen, setIsSignedOpen] = useState(false)

  /*
    S11 — 서명 링크에서 돌아와 상세를 다시 보는 동안 내 서명이 반영되는 순간을 잡는다.
    운영자가 손으로 옮겨 적는 값이라 폴링으로 뒤늦게 들어오며, 같은 계약에서 한 번만 띄운다.
  */
  const prevCreatorSignedAtRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (!detail) {
      return
    }
    const current = detail.signature.creatorSignedAt
    const previous = prevCreatorSignedAtRef.current
    prevCreatorSignedAtRef.current = current
    if (previous === null && current !== null) {
      const key = `contract-signed-shown:${detail.contractId}`
      try {
        if (sessionStorage.getItem(key)) {
          return
        }
        sessionStorage.setItem(key, "1")
      } catch {
        // 세션 저장이 막힌 환경이면 그냥 한 번 띄운다
      }
      setIsSignedOpen(true)
    }
  }, [detail])

  const goToList = useCallback(() => {
    navigate({ pathname: CREATOR_CONTRACT_LIST_PATH, search: location.search })
  }, [navigate, location.search])

  const goTo = useCallback(
    (id: number) => {
      navigate({
        pathname: `${CREATOR_CONTRACT_LIST_PATH}/${id}`,
        search: location.search,
      })
    },
    [navigate, location.search]
  )

  const threadId = detail?.brand.threadId ?? null
  const openThread = useCallback(() => {
    navigate(
      threadId !== null ? `/connections?threadId=${threadId}` : "/connections"
    )
  }, [threadId, navigate])

  const documents = detail?.documents
  const openDraft = useCallback(() => {
    const doc = documents?.find(item => item.documentType === "GENERATED_DRAFT")
    if (doc) {
      window.open(doc.downloadUrl, "_blank")
    }
  }, [documents])

  const handleResend = useCallback(async () => {
    if (!detail || isResending) {
      return
    }
    try {
      const result = await requestResend(detail.contractId)
      // 「재발송했습니다」가 아니라 「요청했습니다」 — 실제 재발송은 운영자가 모두싸인에서 한다
      if (result.alreadyRequested) {
        toast(
          "이미 접수된 재발송 요청이 있습니다. 운영자 확인을 기다려 주세요."
        )
      } else {
        toast.success(
          "서명 안내 재발송을 요청했습니다. 운영자가 확인한 뒤 모두싸인에서 다시 보냅니다."
        )
      }
    } catch {
      // 인터셉터가 서버 문구를 토스트로 띄운다
    }
  }, [detail, isResending, requestResend])

  const handleDecline = useCallback(
    async (reasonCode: ContractDeclineReason, memo: string) => {
      if (!detail || isDeclining) {
        return
      }
      try {
        await decline({
          contractId: detail.contractId,
          body: { reasonCode, memo: memo.trim() === "" ? undefined : memo },
        })
        setIsDeclineOpen(false)
        toast.success("계약을 거절했습니다. 사유가 브랜드에게 전달됩니다.")
      } catch {
        setIsDeclineOpen(false)
      }
    },
    [decline, detail, isDeclining]
  )

  if (isLoading) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        불러오는 중…
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center">
        <div className="text-[13px] font-semibold text-sz-n-700">
          계약을 찾을 수 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          아직 도착하지 않았거나 존재하지 않는 계약입니다.
        </div>
        <Btn variant="secondary" onClick={goToList}>
          목록
        </Btn>
      </div>
    )
  }

  const view = deriveCreatorView(detail)
  const isClosed = CLOSED_VIEWS.includes(view)
  const isConcluded = view === "concluded"
  const myName = showroom?.showroomName ?? "나"

  const headerEvent = (() => {
    switch (view) {
      case "concluded":
        return `${formatDateTimeShort(detail.stepper.concludedAt)} 체결`
      case "declined":
        return `${formatDateTimeShort(detail.closure.closedAt)} 거절`
      case "expired":
        return `${formatDateTimeShort(detail.closure.closedAt)} 만료`
      case "canceled":
        return `${formatDateTimeShort(detail.closure.closedAt)} 취소`
      default:
        return `${formatDateTimeShort(detail.receivedAt)} 받음`
    }
  })()

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.title}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {detail.contractNumber} · {detail.brand.name} · {headerEvent}
          </p>
        </div>
        <RecordNav
          onList={goToList}
          onPrev={
            detail.navigation.prevContractId !== null
              ? () => goTo(detail.navigation.prevContractId as number)
              : undefined
          }
          onNext={
            detail.navigation.nextContractId !== null
              ? () => goTo(detail.navigation.nextContractId as number)
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <SigningProgressCard detail={detail} view={view} myName={myName} />

          {isConcluded && (
            <DocumentsCard
              contractId={detail.contractId}
              contractNumber={detail.contractNumber}
              concludedAt={detail.stepper.concludedAt}
              documents={detail.documents}
            />
          )}

          <ClosureReasonCard detail={detail} view={view} />

          <ContractTermsCard
            detail={detail}
            view={view}
            onOpenThread={openThread}
          />

          {/* 종결 3종에서는 서버가 payout을 내리지 않는다 — 성립하지 않은 계약의 금액을 「받는 금액」으로 보이면 안 된다 */}
          {detail.payout && (
            <PayoutCard
              payout={detail.payout}
              fixedFee={detail.fixedFee}
              isConcluded={isConcluded}
            />
          )}

          {isClosed ? (
            <>
              <ContractItemsCard
                items={detail.items}
                showSettlementNote={false}
              />
              <MyDutiesCard content={detail.content} isConcluded={false} />
            </>
          ) : (
            <>
              <MyDutiesCard
                content={detail.content}
                isConcluded={isConcluded}
              />
              <ContractItemsCard items={detail.items} showSettlementNote />
            </>
          )}
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <StatusSideCard
            detail={detail}
            view={view}
            isResending={isResending}
            onRequestResend={handleResend}
            onOpenThread={openThread}
            onDecline={() => setIsDeclineOpen(true)}
            onOpenDraft={openDraft}
            onOpenGroupBuy={() => toast("공구 관리 화면은 준비 중입니다.")}
          />
          <DetailCard title="이력" flushBody>
            <HistoryList
              items={toHistoryItems(detail.history, showroom?.showroomName)}
            />
          </DetailCard>
        </div>
      </div>

      {isDeclineOpen && (
        <DeclineModal
          detail={detail}
          isPending={isDeclining}
          onClose={() => setIsDeclineOpen(false)}
          onConfirm={handleDecline}
        />
      )}

      {isSignedOpen && (
        <SignedResultModal
          signature={detail.signature}
          onClose={() => setIsSignedOpen(false)}
        />
      )}
    </>
  )
}
