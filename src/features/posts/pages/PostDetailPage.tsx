import { useGetPost } from "@/features/posts/hooks/useGetPost"
import PostEditorPage from "@/features/posts/pages/PostEditorPage"
import PostSuspendedPage from "@/features/posts/pages/PostSuspendedPage"
import { Loader2 } from "lucide-react"
import { Navigate, useParams } from "react-router-dom"

/**
 * `/posts/:postId`의 갈림길.
 *
 * 같은 주소가 상태에 따라 다른 화면이다 — 수정 가능하면 편집 화면, 노출 중지·심사 중이면
 * 조치 화면. 판정은 서버가 내려준 `editable` 하나로 한다. 상태값을 프론트에서 다시 따지면
 * 규칙이 두 군데가 되고, 나중에 상태가 하나 늘 때 한쪽만 고쳐진다.
 *
 * `key`로 게시물 id를 물리는 이유는 편집 화면이 서버 값을 초기 상태로 복사해 들고 있기
 * 때문이다 — 다른 게시물로 옮겨가면 새로 마운트돼야 이전 사진·본문이 남지 않는다.
 */
export default function PostDetailPage() {
  const { postId } = useParams()
  const numericId = Number(postId)

  const {
    data: post,
    isLoading,
    isError,
  } = useGetPost(Number.isFinite(numericId) ? numericId : null)

  if (isError) {
    return <Navigate to="/posts" replace />
  }

  if (isLoading || !post) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-sz-n-400" aria-hidden />
      </div>
    )
  }

  return post.editable ? (
    <PostEditorPage key={post.postId} post={post} />
  ) : (
    <PostSuspendedPage key={post.postId} post={post} />
  )
}
