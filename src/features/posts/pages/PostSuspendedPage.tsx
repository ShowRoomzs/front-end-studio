import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle"
import { useGetShowroomName } from "@/common/hooks/useGetShowroomName"
import { Button } from "@/components/ui/button"
import AlertBanner from "@/features/posts/components/AlertBanner"
import ConfirmModal from "@/features/posts/components/ConfirmModal"
import InsightPanel from "@/features/posts/components/InsightPanel"
import PhotoGrid from "@/features/posts/components/PhotoGrid"
import PreviewCard from "@/features/posts/components/PreviewCard"
import StatusBadge from "@/features/posts/components/StatusBadge"
import {
  APPEAL_CONTENT_MAX,
  INSIGHT_DEFAULT_PERIOD,
  POST_IMAGE_MAX,
} from "@/features/posts/constants/params"
import {
  useDeletePost,
  useSubmitAppeal,
} from "@/features/posts/hooks/usePostMutations"
import type { StatsPeriod } from "@/features/posts/services/postInsightService"
import type { PostDetailResponse } from "@/features/posts/services/postService"
import { formatDateTime } from "@/features/posts/utils/format"
import { toPhotoDraft } from "@/features/posts/utils/photoDraft"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * 노출 중지 · 이의 심사 중 (§24-5 · 시안 S8·S10·S11).
 *
 * 편집 화면과 컴포넌트를 나눈 이유 — 이 상태에서는 사진도 본문도 손댈 수 없다.
 * 심사 대상이 도중에 바뀌면 안 되기 때문인데, 그 잠금을 편집 화면 안에서 분기로 처리하면
 * 입력·버튼·모달 전부에 조건이 붙는다.
 */
export default function PostSuspendedPage(props: { post: PostDetailResponse }) {
  const { post } = props
  const navigate = useNavigate()

  usePageSubtitle("노출 중지")

  const { data: showroom } = useGetShowroomName()
  const [isAppealOpen, setIsAppealOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [appealContent, setAppealContent] = useState("")
  const [period, setPeriod] = useState<StatsPeriod>(INSIGHT_DEFAULT_PERIOD)

  const submitAppeal = useSubmitAppeal(post.postId)
  const deletePost = useDeletePost()

  const cells = post.images.map(toPhotoDraft)
  const imageUrls = post.images.map(image => image.imageUrl)
  const ratio = post.aspectRatio ? Number(post.aspectRatio) : null

  const handleAppeal = async () => {
    await submitAppeal.mutateAsync(appealContent.trim())
    setIsAppealOpen(false)
    setAppealContent("")
  }

  const handleDelete = async () => {
    await deletePost.mutateAsync(post.postId)
    setIsDeleteOpen(false)
    navigate("/posts")
  }

  return (
    <div>
      {post.suspension && (
        <AlertBanner
          suspension={post.suspension}
          appeal={post.appeal}
          onAppeal={() => setIsAppealOpen(true)}
        />
      )}

      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="rounded-[8px] border border-sz-n-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-sz-n-200 px-[18px] py-[13px] text-[13px] font-semibold text-sz-n-900">
              게시물
              <StatusBadge status={post.status} />
            </div>

            <div className="border-b border-sz-n-200 p-[18px]">
              <div className="mb-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-sz-n-900">
                <span>
                  사진{" "}
                  <span className="font-normal text-sz-n-500">수정 불가</span>
                </span>
                <span className="text-[11px] font-normal text-sz-n-500 tabular-nums">
                  {post.images.length} / {POST_IMAGE_MAX}
                </span>
              </div>
              <PhotoGrid
                cells={cells}
                targetRatio={ratio}
                readOnly
                onAddFiles={() => {}}
                onRemove={() => {}}
                onMove={() => {}}
                onCrop={() => {}}
              />
            </div>

            <div className="p-[18px]">
              <div className="mb-2 text-[12px] font-semibold text-sz-n-900">
                본문
              </div>
              <div className="min-h-[150px] rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[13px] leading-[1.6] whitespace-pre-wrap text-sz-n-600">
                {post.content}
              </div>
            </div>
          </div>

          <InsightPanel
            postId={post.postId}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

        <div className="flex w-100 shrink-0 flex-col gap-4">
          <div className="rounded-[8px] border border-sz-n-200 bg-white">
            <div className="border-b border-sz-n-200 px-[18px] py-[13px] text-[13px] font-semibold text-sz-n-900">
              공개 상태
            </div>
            <div className="p-[18px]">
              <div className="flex gap-3 border-b border-sz-n-100 py-2 text-[12px]">
                <span className="w-[88px] shrink-0 text-sz-n-500">현재</span>
                <span className="flex-1">
                  <StatusBadge status={post.status} />
                </span>
              </div>
              <div className="flex gap-3 py-2 text-[12px]">
                <span className="w-[88px] shrink-0 text-sz-n-500">게시일</span>
                <span className="flex-1 text-sz-n-900 tabular-nums">
                  {formatDateTime(post.publishedAt ?? post.createdAt)}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-[9px] rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[11px] text-[11px] leading-[1.7] text-sz-n-600">
                <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-sz-n-600 text-[10px] text-white">
                  i
                </span>
                <span>
                  중지된 동안에는{" "}
                  <b className="text-sz-n-900">
                    사진 · 본문을 수정할 수 없습니다.
                  </b>{" "}
                  심사가 끝나야 다시 편집할 수 있습니다.
                </span>
              </div>
            </div>

            {/*
              심사 중에는 삭제도 막힌다 — 신청 후 도중에 지우면 처리 결과가 붕 뜬다(§24-5).
              서버가 `deletable`로 판정해 내려주므로 상태값으로 다시 따지지 않는다.
            */}
            {post.deletable && (
              <div className="flex justify-end border-t border-sz-n-200 px-[18px] py-3.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-sz-danger-text hover:bg-sz-danger-bg"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  삭제
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-[8px] border border-sz-n-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-sz-n-200 px-[18px] py-[13px] text-[13px] font-semibold text-sz-n-900">
              미리보기
              <span className="text-[11px] font-normal text-sz-n-500">
                소비자 쇼룸 기준
              </span>
            </div>
            <div className="p-[18px]">
              <PreviewCard
                showroomName={showroom?.showroomName}
                imageUrls={imageUrls}
                content={post.content ?? ""}
                aspectRatio={ratio}
                publishedAt={post.publishedAt}
                timeLabel="노출되지 않음"
              />
              <p className="mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600">
                현재 이 게시물은{" "}
                <b className="text-sz-n-900">
                  소비자 쇼룸에 노출되지 않습니다.
                </b>{" "}
                위 미리보기는 다시 노출됐을 때의 모습입니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isAppealOpen && post.suspension && (
        <ConfirmModal
          title="이의를 신청할까요?"
          confirmLabel="신청"
          isConfirmDisabled={appealContent.trim().length === 0}
          isPending={submitAppeal.isPending}
          onConfirm={() => void handleAppeal()}
          onClose={() => setIsAppealOpen(false)}
        >
          <p className="mb-3 text-[12px] leading-[1.75] text-sz-n-600">
            중지 사유{" "}
            <b className="text-sz-n-900">{post.suspension.reasonLabel}</b>에
            동의하지 않는 이유를 적어주세요. 운영자가 다시 확인합니다.
          </p>
          <textarea
            value={appealContent}
            maxLength={APPEAL_CONTENT_MAX}
            onChange={event => setAppealContent(event.target.value)}
            placeholder="어떤 점이 사실과 다른지 구체적으로 적어주세요."
            className="h-24 w-full resize-none rounded-[6px] border border-sz-n-300 px-3 py-[9px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500"
          />
          <div className="mt-1 text-right text-[11px] text-sz-n-400 tabular-nums">
            {appealContent.length} / {APPEAL_CONTENT_MAX}
          </div>
          <p className="mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600">
            신청은 게시물당 <b className="text-sz-n-900">한 번</b>만 가능합니다.
            심사 결과에 따라 <b className="text-sz-n-900">다시 노출</b>되거나{" "}
            <b className="text-sz-n-900">영구 삭제</b>됩니다.
          </p>
        </ConfirmModal>
      )}

      {isDeleteOpen && (
        <ConfirmModal
          title="게시물을 삭제할까요?"
          confirmLabel="삭제"
          isDestructive
          isPending={deletePost.isPending}
          onConfirm={() => void handleDelete()}
          onClose={() => setIsDeleteOpen(false)}
        >
          <p className="text-[12px] leading-[1.75] text-sz-n-600">
            삭제하면{" "}
            <b className="text-sz-n-900">
              이의를 신청할 수 없고 되돌릴 수 없습니다.
            </b>{" "}
            좋아요 수도 함께 사라집니다.
          </p>
        </ConfirmModal>
      )}
    </div>
  )
}
