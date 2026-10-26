import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal"
import { Button } from "@/components/ui/button"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import {
  AcceptModal,
  CounterModal,
  RejectModal,
  WithdrawModal,
} from "@/features/connections/components/IssueThread/AdjustmentModals"
import IssuePin from "@/features/connections/components/IssueThread/IssuePin"
import {
  headStatus,
  isClosedStatus,
} from "@/features/connections/components/IssueThread/issueView"
import type { AdjustmentResponse } from "@/features/connections/components/IssueThread/SystemCard"
import MessageInput from "@/features/connections/components/MessageInput/MessageInput"
import MessageList from "@/features/connections/components/MessageList/MessageList"
import VideoPlayerModal from "@/features/connections/components/VideoPlayerModal/VideoPlayerModal"
import {
  CONNECTED_THREAD_STATUS_TEXT,
  ISSUE_CLOSED_INPUT_TEXT,
  ISSUE_CLOSED_NOTICE_TEXT,
  ISSUE_NOTICE_TEXT,
  OPERATOR_CHANNEL_STATUS_TEXT,
  OPERATOR_CHANNEL_SUSPENDED_STATUS_TEXT,
  OPERATOR_NOTICE_TEXT,
} from "@/features/connections/constants/params"
import { useGetThreadMessages } from "@/features/connections/hooks/useGetThreadMessages"
import { useMarkThreadRead } from "@/features/connections/hooks/useMarkThreadRead"
import { useOutgoingMessages } from "@/features/connections/hooks/useOutgoingMessages"
import {
  useAdjustmentActions,
  useGetThreadAdjustment,
} from "@/features/connections/hooks/useThreadAdjustment"
import type {
  AttachmentSummary,
  ThreadListItem,
} from "@/features/connections/services/threadService"
import { downloadAttachment } from "@/features/connections/utils/download"
import { useAccountStatus } from "@/features/home/hooks/useAccountStatus"
import {
  GROUP_BUY_LIST_PATH,
  SETTLEMENT_LIST_PATH,
} from "@/features/settlement/constants/params"
import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

interface ThreadPanelProps {
  thread: ThreadListItem
}

/** 열린 응답 모달 — 어느 제안에 답하는지 함께 든다 */
interface ResponseState {
  response: AdjustmentResponse
  proposalId: number
}

interface LightboxState {
  images: Array<AttachmentSummary>
  index: number
  senderLabel: string
}

/**
 * 우측 소통 스레드 (시안 `.cs-thread`).
 *
 * 정산 조정 이슈 스레드(kind = SETTLEMENT_ADJUSTMENT · 시안 ui-studio-11)는 같은 틀에 세 가지가 더해진다 —
 * 머리 아래 고정 카드(공구 · 보류 금액 · 요청 금액 · 합의 기한), 절차 카드의 응답 버튼(동의 · 다른 금액 제안 ·
 * 반대) · 내 요청의 [요청 철회](기-14), 종결 뒤 입력 잠금. 버튼 권한 · 차례는 전부 서버 값이다.
 */
export default function ThreadPanel(props: ThreadPanelProps) {
  const { thread } = props
  const navigate = useNavigate()

  const { messages, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetThreadMessages(thread.threadId)
  const { outgoing, send, retry, cancel } = useOutgoingMessages(thread.threadId)
  useMarkThreadRead(thread.threadId, thread.unreadCount)

  const isIssue = thread.kind === "SETTLEMENT_ADJUSTMENT"
  const { isSuspended } = useAccountStatus()
  const { data: issueView } = useGetThreadAdjustment(thread.threadId, isIssue)
  const { counter, accept, reject, withdraw } = useAdjustmentActions(
    thread.threadId
  )
  const [responding, setResponding] = useState<ResponseState | null>(null)
  const isResponding =
    counter.isPending ||
    accept.isPending ||
    reject.isPending ||
    withdraw.isPending

  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [playingVideo, setPlayingVideo] = useState<AttachmentSummary | null>(
    null
  )

  const currentImage = lightbox?.images[lightbox.index]

  const openGroupBuy = (groupBuyId: number) =>
    navigate(`${GROUP_BUY_LIST_PATH}/${groupBuyId}`)
  const openSettlement = (settlementId: number) =>
    navigate(`${SETTLEMENT_LIST_PATH}/${settlementId}`)

  // 스튜디오 시안은 이슈가 없을 때의 빈 상태(파트너 T5)를 그리지 않는다 — 고정 카드 없이 일반 스레드로 보인다.
  // 고정 카드를 아직 못 읽었으면 목록 줄의 요약으로 머리 · 잠금을 정한다
  const issueStatus = issueView?.status ?? thread.adjustment?.status ?? "OPEN"
  const issueTurnLabel =
    issueView?.turnLabel ?? thread.adjustment?.turnLabel ?? ""
  const isIssueClosed = isIssue && isClosedStatus(issueStatus)
  const canSend = issueView ? issueView.permissions.canSend : !isIssueClosed

  const respondingProposal =
    responding && issueView
      ? (issueView.proposals.find(
          proposal => proposal.proposalId === responding.proposalId
        ) ?? issueView.latestProposal)
      : null
  const closeResponse = () => setResponding(null)

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-sz-n-50">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sz-n-200 bg-white px-5">
        <CounterpartAvatar
          name={thread.counterpartName}
          imageUrl={thread.counterpartImageUrl}
          isOperator={thread.operatorChannel}
          className="h-10 w-10"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-sz-n-900">
            {thread.counterpartName}
          </div>
          <div className="mt-0.5 text-[11px] text-sz-n-500">
            {isIssue
              ? headStatus(issueStatus, issueTurnLabel)
              : thread.operatorChannel
                ? isSuspended
                  ? OPERATOR_CHANNEL_SUSPENDED_STATUS_TEXT
                  : OPERATOR_CHANNEL_STATUS_TEXT
                : CONNECTED_THREAD_STATUS_TEXT}
          </div>
        </div>
        {/*
          [계약 확인]은 계약이 **있을 때만** 노출한다(§14-2) — 스튜디오는 계약을
          확인하는 쪽이라 없으면 볼 것이 없다. 파트너센터가 버튼을 비활성으로
          남겨두는 것과 방향이 반대다. 계약 목록을 이 브랜드명으로 검색해 연다 —
          스레드 항목에 계약 ID가 없어 상세로 바로 가지는 못한다.
        */}
        {/* 이슈 스레드는 머리 우측 버튼을 두지 않는다 — 고정 카드의 「공구 상세」와 목적지가 겹친다(ui-studio-11) */}
        {thread.hasContract && !isIssue && (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              navigate(
                `/contracts?keyword=${encodeURIComponent(thread.counterpartName)}`
              )
            }
          >
            계약 확인
          </Button>
        )}
      </div>

      {/*
        운영자 열람 고지는 스크롤과 무관하게 항상 보여야 한다(§13-4) —
        스크롤로 사라지면 "상시 고지" 요건을 만족하지 못한다.
      */}
      {!thread.operatorChannel && (
        <div className="shrink-0 bg-sz-n-100 px-4 py-2 text-center text-[11px] text-sz-n-500">
          {!isIssue
            ? OPERATOR_NOTICE_TEXT
            : isIssueClosed
              ? ISSUE_CLOSED_NOTICE_TEXT
              : ISSUE_NOTICE_TEXT}
        </div>
      )}

      {isIssue && issueView && (
        <IssuePin
          view={issueView}
          onOpenGroupBuy={() => openGroupBuy(issueView.groupBuy.groupBuyId)}
          onOpenSettlement={() =>
            openSettlement(issueView.settlement.settlementId)
          }
        />
      )}

      <MessageList
        messages={messages}
        outgoing={outgoing}
        counterpartName={thread.counterpartName}
        hasOlderMessages={Boolean(hasNextPage)}
        isFetchingOlder={isFetchingNextPage}
        onLoadOlder={() => void fetchNextPage()}
        onRetry={retry}
        onCancel={cancel}
        onClickImage={(images, index, senderLabel) =>
          setLightbox({ images, index, senderLabel })
        }
        onPlayVideo={setPlayingVideo}
        issueView={isIssue ? (issueView ?? null) : null}
        isResponding={isResponding}
        onRespond={(response, proposalId) =>
          setResponding({ response, proposalId })
        }
      />

      <MessageInput
        onSend={send}
        lockedText={canSend ? undefined : ISSUE_CLOSED_INPUT_TEXT}
      />

      {issueView &&
        respondingProposal &&
        responding?.response === "COUNTER" && (
          <CounterModal
            view={issueView}
            proposal={respondingProposal}
            isPending={counter.isPending}
            onClose={closeResponse}
            onSubmit={(rewardAmount, reason) =>
              counter.mutate(
                {
                  adjustmentId: issueView.adjustmentId,
                  body: { rewardAmount, reason: reason || undefined },
                },
                {
                  onSuccess: () => toast.success("다른 금액을 제안했습니다."),
                  onSettled: closeResponse,
                }
              )
            }
          />
        )}
      {issueView && respondingProposal && responding?.response === "ACCEPT" && (
        <AcceptModal
          view={issueView}
          proposal={respondingProposal}
          isPending={accept.isPending}
          onClose={closeResponse}
          onSubmit={() =>
            accept.mutate(
              {
                adjustmentId: issueView.adjustmentId,
                proposalId: respondingProposal.proposalId,
              },
              {
                onSuccess: () =>
                  toast.success(
                    "동의했습니다. 정산 금액이 바뀌고 보류가 해제됐습니다."
                  ),
                onSettled: closeResponse,
              }
            )
          }
        />
      )}
      {issueView && respondingProposal && responding?.response === "REJECT" && (
        <RejectModal
          view={issueView}
          proposal={respondingProposal}
          isPending={reject.isPending}
          onClose={closeResponse}
          onSubmit={() =>
            reject.mutate(
              {
                adjustmentId: issueView.adjustmentId,
                proposalId: respondingProposal.proposalId,
              },
              {
                onSuccess: () => toast.success("반대를 등록했습니다."),
                onSettled: closeResponse,
              }
            )
          }
        />
      )}
      {issueView &&
        respondingProposal &&
        responding?.response === "WITHDRAW" && (
          <WithdrawModal
            view={issueView}
            proposal={respondingProposal}
            isPending={withdraw.isPending}
            onClose={closeResponse}
            onSubmit={() =>
              withdraw.mutate(issueView, {
                onSuccess: () =>
                  toast.success(
                    "요청을 철회했습니다. 원래 금액으로 확정되고 보류가 해제됐습니다."
                  ),
                onSettled: closeResponse,
              })
            }
          />
        )}

      <PreviewModal
        isOpen={Boolean(currentImage)}
        onOpenChange={open => !open && setLightbox(null)}
        imageUrl={currentImage?.fileUrl ?? ""}
        currentIndex={lightbox?.index ?? 0}
        fileLength={lightbox?.images.length ?? 0}
        onIndexChange={index =>
          setLightbox(current => current && { ...current, index })
        }
        senderLabel={lightbox?.senderLabel}
        onDownload={() =>
          currentImage && downloadAttachment(currentImage.attachmentId)
        }
      />

      <VideoPlayerModal
        attachment={playingVideo}
        onClose={() => setPlayingVideo(null)}
      />
    </div>
  )
}
