import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle"
import RecordNav from "@/common/components/RecordNav/RecordNav"
import SuspensionNotice from "@/common/components/Suspension/SuspensionNotice"
import Btn from "@/features/contracts/components/shared/Btn"
import {
  ClosedProgressCard,
  FulfillmentCard,
  InfoCard,
  ItemsCard,
  PayoutCard,
  PostCard,
  ReadinessCard,
  SalesCard,
  SellingProgressCard,
  SituationTopCard,
} from "@/features/groupBuy/components/detail/StudioCards"
import {
  StudioHistoryCard,
  StudioStatusRail,
} from "@/features/groupBuy/components/detail/StudioRail"
import {
  AcceptExtensionModal,
  FulfillmentModal,
  PostEditorModal,
  RejectExtensionModal,
  SuspensionModal,
} from "@/features/groupBuy/components/modals/StudioModals"
import { GROUP_BUY_LIST_PATH } from "@/features/groupBuy/constants/params"
import {
  useAcceptExtension,
  useCheckFulfillment,
  useEditPost,
  useGetCreatorGroupBuyDetail,
  useRejectExtension,
  useRequestSuspension,
  useSaveDraft,
  useSubmitPost,
} from "@/features/groupBuy/hooks/useCreatorGroupBuy"
import {
  headerMeta,
  isSelling,
  sellingSituation,
} from "@/features/groupBuy/utils/view"
import { useAccountStatus } from "@/features/home/hooks/useAccountStatus"
import { useCallback, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom"

type ModalKind =
  "post" | "accept" | "reject" | "suspension" | "fulfillment" | null

/**
 * `/group-buy/:groupBuyId` — 상세 B1~B13이 모두 이 한 화면이다.
 * 서버가 상태·요청·통지·권한을 판정해 내려주고, 화면은 그 값으로 카드 구성을 고른다.
 */
export default function GroupBuyDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { groupBuyId: idParam } = useRouteParams<{ groupBuyId: string }>()
  const groupBuyId = Number(idParam)

  usePageSubtitle("공구 상세")

  // 목록 조건을 넘기면 서버가 그 범위로 이전/다음 공구를 계산한다
  const navParams = useMemo(() => {
    const query = new URLSearchParams(location.search)
    return {
      tab: query.get("tab") ?? undefined,
      keyword: query.get("keyword") || undefined,
      sort: query.get("sort") ?? undefined,
    }
  }, [location.search])

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetCreatorGroupBuyDetail(groupBuyId, navParams)
  const [modal, setModal] = useState<ModalKind>(null)
  // 시안 13 — 연장 수락 · 공구 게시물 등록은 정지 중 막힌다. 서버 permissions가 정지를 보지 않아 계정 상태로 가른다
  const { isSuspended } = useAccountStatus()

  const { mutate: saveDraft, isPending: isSaving } = useSaveDraft()
  const { mutate: submitPost, isPending: isSubmitting } = useSubmitPost()
  const { mutate: editPost, isPending: isEditing } = useEditPost()
  const { mutate: acceptExtension, isPending: isAccepting } =
    useAcceptExtension()
  const { mutate: rejectExtension, isPending: isRejecting } =
    useRejectExtension()
  const { mutate: requestSuspension, isPending: isSuspending } =
    useRequestSuspension()
  const { mutate: checkFulfillment, isPending: isChecking } =
    useCheckFulfillment()

  const closeModal = useCallback(() => setModal(null), [])

  const goToList = useCallback(() => {
    navigate({ pathname: GROUP_BUY_LIST_PATH, search: location.search })
  }, [navigate, location.search])

  const goToRecord = useCallback(
    (id: number) => {
      navigate({
        pathname: `${GROUP_BUY_LIST_PATH}/${id}`,
        search: location.search,
      })
    },
    [navigate, location.search]
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
          공구를 찾을 수 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          삭제되었거나 내 공구가 아닙니다.
        </div>
        <Btn variant="secondary" onClick={() => navigate(GROUP_BUY_LIST_PATH)}>
          목록
        </Btn>
      </div>
    )
  }

  const status = detail.groupBuy.status
  const isPreparing = status === "PREPARING" || status === "READY"
  const selling = isSelling(detail)
  const isTerminal = !isPreparing && !selling
  const situation = selling ? sellingSituation(detail) : null
  const prevId = detail.navigation?.prevGroupBuyId ?? null
  const nextId = detail.navigation?.nextGroupBuyId ?? null

  const openThread = (threadId: number | null | undefined) => {
    navigate(threadId ? `/connections?threadId=${threadId}` : "/connections")
  }
  const openPairThread = () => openThread(detail.brand.pairThreadId)
  // 내 운영팀 채널 — 직권 중단 예고(B13)는 서버가 스레드 id를 준다. 노출 중지(B5a)에는 id가 없어 연결·소통 첫 화면으로 간다
  const openOperatorChannel = () =>
    openThread(detail.adminSuspension?.operatorChannelThreadId)
  // 게시물이 승인된 뒤(노출중·노출 중지)의 수정은 PATCH — 재승인 없이 바로 반영된다
  const isEditMode =
    detail.permissions.canEditPost && !detail.permissions.canWritePost
  const meta = headerMeta(detail)

  return (
    <>
      {/* 시안 13 R2 — 상대 브랜드 정지로 오픈 보류(서버 kind = COUNTERPARTY · 오픈 전 공구만). 정지 사실은 말하지 않는다 */}
      {detail.sanctionHold?.kind === "COUNTERPARTY" && (
        <SuspensionNotice tone="neutral" className="mb-3">
          <b>상대 브랜드 사정으로 공구 오픈이 잠시 보류되었습니다.</b> 시작 예정
          시각이 지나도 자동으로 열리지 않으며, 재개되면 일정을 다시 안내해
          드릴게요.
        </SuspensionNotice>
      )}

      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.groupBuy.title}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {meta.text}
            {meta.warn && (
              <>
                {" · "}
                <b className="font-semibold text-sz-warning-text">
                  {meta.warn}
                </b>
              </>
            )}
          </p>
        </div>
        <RecordNav
          onList={goToList}
          onPrev={prevId !== null ? () => goToRecord(prevId) : undefined}
          onNext={nextId !== null ? () => goToRecord(nextId) : undefined}
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          {situation && (
            <SituationTopCard
              detail={detail}
              situation={situation}
              canRespond={detail.permissions.canRespondExtension}
              acceptBlocked={isSuspended}
              onAccept={() => setModal("accept")}
              onReject={() => setModal("reject")}
            />
          )}

          {isPreparing && (
            <ReadinessCard
              detail={detail}
              onWritePost={() => setModal("post")}
            />
          )}
          {selling && <SellingProgressCard detail={detail} />}
          {isTerminal && <ClosedProgressCard detail={detail} />}

          {status === "ENDED" && (
            <FulfillmentCard
              detail={detail}
              onCheck={() => setModal("fulfillment")}
            />
          )}

          {!isPreparing && <SalesCard detail={detail} />}

          <InfoCard
            detail={detail}
            onOpenThread={openPairThread}
            onOpenContract={() =>
              navigate(`/contracts/${detail.contract.contractId}`)
            }
          />
          {!isTerminal && <PayoutCard detail={detail} />}
          {!isTerminal && (
            <PostCard detail={detail} onWritePost={() => setModal("post")} />
          )}
          {status !== "SUSPENDED" && <ItemsCard detail={detail} />}
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <StudioStatusRail
            detail={detail}
            situation={situation}
            suspended={isSuspended}
            actions={{
              onWritePost: () => setModal("post"),
              onOpenThread: openPairThread,
              onOpenOperatorChannel: openOperatorChannel,
              onOpenFulfillmentThread: () =>
                openThread(detail.afterEnd?.fulfillment?.threadId),
              onAcceptExtension: () => setModal("accept"),
              onRejectExtension: () => setModal("reject"),
              onSuspension: () => setModal("suspension"),
              onCheckFulfillment: () => setModal("fulfillment"),
              onGoSettlement: () => navigate("/settlement"),
            }}
          />
          <StudioHistoryCard detail={detail} />
        </div>
      </div>

      {modal === "post" && (
        <PostEditorModal
          detail={detail}
          isEdit={isEditMode}
          isPending={isEditMode ? isEditing : isSubmitting}
          isSaving={isSaving}
          submitBlocked={isSuspended}
          onClose={closeModal}
          onSaveDraft={body =>
            saveDraft(
              { groupBuyId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success(
                    "임시저장했습니다. 아직 검토는 시작되지 않았습니다."
                  )
                },
              }
            )
          }
          onSubmit={body =>
            isEditMode
              ? editPost(
                  { groupBuyId, body },
                  {
                    onSuccess: () => {
                      closeModal()
                      // 노출 중지 중 수정은 자동으로 다시 노출되지 않는다 — 운영자가 확인하고 해제한다
                      toast.success(
                        detail.post.status === "EXPOSURE_SUSPENDED"
                          ? "게시물을 수정했습니다. 운영자가 확인한 뒤 노출 중지를 해제합니다."
                          : "게시물을 수정했습니다. 바로 반영됩니다."
                      )
                    },
                  }
                )
              : submitPost(
                  { groupBuyId, body },
                  {
                    onSuccess: () => {
                      closeModal()
                      toast.success(
                        "게시물을 등록했습니다. 운영자 검토가 시작됩니다."
                      )
                    },
                  }
                )
          }
        />
      )}
      {modal === "accept" && (
        <AcceptExtensionModal
          detail={detail}
          isPending={isAccepting}
          onClose={closeModal}
          onConfirm={() =>
            acceptExtension(
              { groupBuyId, body: undefined },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success("연장을 수락했습니다. 종료일이 바뀌었습니다.")
                },
              }
            )
          }
        />
      )}
      {modal === "reject" && (
        <RejectExtensionModal
          detail={detail}
          isPending={isRejecting}
          onClose={closeModal}
          onConfirm={body =>
            rejectExtension(
              { groupBuyId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success(
                    "연장 요청을 거절했습니다. 원래 일정대로 진행됩니다."
                  )
                },
              }
            )
          }
        />
      )}
      {modal === "suspension" && (
        <SuspensionModal
          detail={detail}
          isPending={isSuspending}
          onClose={closeModal}
          onConfirm={body =>
            requestSuspension(
              { groupBuyId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success(
                    "중단을 요청했습니다. 검토 중에도 공구는 계속 진행됩니다."
                  )
                },
              }
            )
          }
        />
      )}
      {modal === "fulfillment" && (
        <FulfillmentModal
          detail={detail}
          isPending={isChecking}
          onClose={closeModal}
          onConfirm={body =>
            checkFulfillment(
              { groupBuyId, body },
              {
                onSuccess: () => {
                  closeModal()
                  toast.success("계약 이행 확인을 제출했습니다.")
                },
              }
            )
          }
        />
      )}
    </>
  )
}
