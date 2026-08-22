import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle"
import { useGetShowroomName } from "@/common/hooks/useGetShowroomName"
import { Button } from "@/components/ui/button"
import ConfirmModal from "@/features/posts/components/ConfirmModal"
import CropModal from "@/features/posts/components/CropModal"
import InsightPanel from "@/features/posts/components/InsightPanel"
import PhotoGrid from "@/features/posts/components/PhotoGrid"
import PreviewCard from "@/features/posts/components/PreviewCard"
import StatusBadge from "@/features/posts/components/StatusBadge"
import {
  INSIGHT_DEFAULT_PERIOD,
  POST_CONTENT_MAX,
  POST_IMAGE_MAX,
} from "@/features/posts/constants/params"
import { usePhotoCells } from "@/features/posts/hooks/usePhotoCells"
import {
  useCreatePost,
  useDeletePost,
  useUpdatePost,
} from "@/features/posts/hooks/usePostMutations"
import type { StatsPeriod } from "@/features/posts/services/postInsightService"
import type {
  PostDetailResponse,
  PostSaveAction,
} from "@/features/posts/services/postService"
import { describeRatio } from "@/features/posts/utils/aspectRatio"
import { formatDateTime } from "@/features/posts/utils/format"
import {
  countPhotos,
  hasBusyPhoto,
  hasFailure,
  isPhoto,
  toImageRequests,
} from "@/features/posts/utils/photoDraft"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * 게시물 작성 · 수정 (§24-3 · 시안 S3~S7·S9).
 *
 * 좌측 편집 / 우측 미리보기 2컬럼. `post`가 있으면 수정, 없으면 작성이다.
 * 노출 중지·심사 중인 게시물은 여기로 오지 않는다 — 잠금 분기를 화면 전체에 뿌리지 않기
 * 위해 조치 화면(`PostSuspendedPage`)을 따로 뒀다.
 */
export default function PostEditorPage(props: { post?: PostDetailResponse }) {
  const { post } = props
  const navigate = useNavigate()

  usePageSubtitle(post ? "수정" : "새 게시물")

  const { data: showroom } = useGetShowroomName()
  const [content, setContent] = useState(post?.content ?? "")
  const [cropTargetId, setCropTargetId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [period, setPeriod] = useState<StatsPeriod>(INSIGHT_DEFAULT_PERIOD)

  const {
    cells,
    photos,
    targetRatio,
    addFiles,
    removeCell,
    movePhoto,
    applyCrop,
  } = usePhotoCells({
    initialImages: post?.images,
    initialRatio: post?.aspectRatio ? Number(post.aspectRatio) : null,
  })

  const createPost = useCreatePost()
  const updatePost = useUpdatePost(post?.postId ?? 0)
  const deletePost = useDeletePost()

  const photoCount = countPhotos(cells)
  const isPublished = post?.status === "PUBLISHED"
  const isSaving =
    createPost.isPending || updatePost.isPending || deletePost.isPending

  /**
   * 버튼 활성 조건 (§24-3) — **에러 문구 없이 비활성만**으로 표현한다.
   *
   * 임시저장은 사진 1장 **또는** 본문 1자, 게시하기는 사진 최소 1장. 여기에 더해
   * 실패 칸이 남아 있으면 둘 다 잠긴다(§24-4) — 문구를 못 보고 그대로 게시하는 일을 막는다.
   */
  const isLockedByFailure = hasFailure(cells)
  const isUploading = hasBusyPhoto(cells)
  const canDraft =
    !isLockedByFailure &&
    !isUploading &&
    (photoCount > 0 || content.trim().length > 0)
  const canPublish = !isLockedByFailure && !isUploading && photoCount > 0

  const save = async (action: PostSaveAction) => {
    const request = {
      content: content.trim() || null,
      images: toImageRequests(cells),
      action,
    }

    if (post) {
      await updatePost.mutateAsync(request)
      navigate("/posts")
      return
    }

    await createPost.mutateAsync(request)
    navigate("/posts")
  }

  const handleDelete = async () => {
    if (!post) {
      return
    }
    await deletePost.mutateAsync(post.postId)
    setIsDeleteOpen(false)
    navigate("/posts")
  }

  const previewUrls = photos.map(photo => photo.previewUrl)

  return (
    <div className="flex items-start gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="rounded-[8px] border border-sz-n-200 bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-sz-n-200 px-[18px] py-[13px] text-[13px] font-semibold text-sz-n-900">
            {post ? "게시물 수정" : "게시물 작성"}
            <StatusBadge status={post?.status ?? "DRAFT"} />
          </div>

          <div className="border-b border-sz-n-200 p-[18px]">
            <div className="mb-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-sz-n-900">
              사진
              <div className="flex items-center gap-[9px]">
                <span className="inline-flex items-center rounded-[10px] bg-sz-n-100 px-[9px] py-0.5 text-[11px] font-normal text-sz-n-600 tabular-nums">
                  {photos[0]
                    ? describeRatio(
                        photos[0].naturalWidth,
                        photos[0].naturalHeight
                      )
                    : "원본 맞춤"}
                </span>
                <span className="text-[11px] font-normal text-sz-n-500 tabular-nums">
                  {photoCount} / {POST_IMAGE_MAX}
                </span>
              </div>
            </div>

            <PhotoGrid
              cells={cells}
              targetRatio={targetRatio}
              onAddFiles={files => void addFiles(files)}
              onRemove={removeCell}
              onMove={movePhoto}
              onCrop={setCropTargetId}
            />

            {/*
              에러 문구는 파일 형식·용량 오류에만 쓴다(§24-4).
              사진·본문 미입력은 버튼 비활성으로만 표현한다.
            */}
            {isLockedByFailure && (
              <p className="mt-[5px] text-[11px] font-medium text-sz-danger-text">
                일부 파일이 추가되지 않았습니다. 위 <b>빨간 칸의 ✕</b>를 눌러
                제외해 주세요 — 20MB 이하 JPG · PNG만 올릴 수 있습니다.
              </p>
            )}

            <p className="mt-[5px] text-[11px] leading-[1.7] text-sz-n-500">
              <b className="text-sz-n-900">JPG · PNG 최대 20장</b> · 장당 20MB
              <br />
              비율은 <b className="text-sz-n-900">첫 번째 사진의 원본 비율</b>을
              따라갑니다 · 세로가 <b className="text-sz-n-900">4:5</b>보다
              길거나 가로가 <b className="text-sz-n-900">1.91:1</b>보다 넓으면
              잘립니다
            </p>
          </div>

          <div className="p-[18px]">
            <div className="mb-2 text-[12px] font-semibold text-sz-n-900">
              본문
            </div>
            <textarea
              value={content}
              maxLength={POST_CONTENT_MAX}
              onChange={event => setContent(event.target.value)}
              placeholder="사진과 함께 하고 싶은 이야기를 자유롭게 적어주세요."
              className="h-[150px] w-full resize-none rounded-[6px] border border-sz-n-300 px-3 py-[9px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500"
            />
            <div className="mt-1 text-right text-[11px] text-sz-n-400 tabular-nums">
              {content.length.toLocaleString("ko-KR")} /{" "}
              {POST_CONTENT_MAX.toLocaleString("ko-KR")}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-sz-n-200 px-[18px] py-3.5">
            {post && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mr-auto text-sz-danger-text hover:bg-sz-danger-bg"
                onClick={() => setIsDeleteOpen(true)}
              >
                삭제
              </Button>
            )}
            {post ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/posts")}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  size="sm"
                  isLoading={isSaving}
                  disabled={isPublished ? !canPublish : !canDraft}
                  onClick={() => void save(isPublished ? "PUBLISH" : "DRAFT")}
                >
                  {isPublished ? "수정 완료" : "임시저장"}
                </Button>
                {!isPublished && (
                  <Button
                    type="button"
                    size="sm"
                    isLoading={isSaving}
                    disabled={!canPublish}
                    onClick={() => void save("PUBLISH")}
                  >
                    게시하기
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={isSaving}
                  disabled={!canDraft}
                  onClick={() => void save("DRAFT")}
                >
                  임시저장
                </Button>
                <Button
                  type="button"
                  size="sm"
                  isLoading={isSaving}
                  disabled={!canPublish}
                  onClick={() => void save("PUBLISH")}
                >
                  게시하기
                </Button>
              </>
            )}
          </div>
        </div>

        {post && (
          <InsightPanel
            postId={post.postId}
            period={period}
            onPeriodChange={setPeriod}
          />
        )}
      </div>

      <div className="flex w-100 shrink-0 flex-col gap-4">
        {/*
          공개 상태는 미리보기보다 위다 — 지금 소비자에게 어떻게 보이는지를
          먼저 알려야 아래 미리보기를 무엇으로 읽어야 할지가 정해진다.
        */}
        {post && (
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
                <span className="w-[88px] shrink-0 text-sz-n-500">
                  {post.publishedAt ? "게시일" : "임시저장"}
                </span>
                <span className="flex-1 text-sz-n-900 tabular-nums">
                  {formatDateTime(post.publishedAt ?? post.createdAt)}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-[9px] rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[11px] text-[11px] leading-[1.7] text-sz-n-600">
                <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-sz-n-600 text-[10px] text-white">
                  i
                </span>
                <span>
                  게시물은{" "}
                  <b className="text-sz-n-900">언제든 수정할 수 있습니다.</b>{" "}
                  수정해도 팔로워에게 알림이 다시 가지는 않습니다. 내리고 싶다면{" "}
                  <b className="text-sz-n-900">삭제</b>만 가능하며 되돌릴 수
                  없습니다.
                </span>
              </div>
            </div>
          </div>
        )}

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
              imageUrls={previewUrls}
              content={content}
              aspectRatio={targetRatio}
              publishedAt={post?.publishedAt ?? null}
            />
            <p className="mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600">
              쇼룸 피드는{" "}
              <b className="text-sz-n-900">노출중인 공구 게시물이 항상 위</b>에
              오고, 일반 게시물은 그 아래에 최신 순으로 쌓입니다.
            </p>
          </div>
        </div>
      </div>

      {cropTargetId && targetRatio !== null && (
        <CropModal
          photos={cells.filter(isPhoto)}
          initialPhotoId={cropTargetId}
          targetRatio={targetRatio}
          onApply={crops =>
            crops.forEach(({ id, crop }) => applyCrop(id, crop))
          }
          onClose={() => setCropTargetId(null)}
        />
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
            삭제하면 쇼룸에서 즉시 사라지고{" "}
            <b className="text-sz-n-900">되돌릴 수 없습니다.</b> 지금까지 받은{" "}
            <b className="text-sz-n-900">좋아요 수도 함께 사라집니다.</b>
          </p>
        </ConfirmModal>
      )}
    </div>
  )
}
