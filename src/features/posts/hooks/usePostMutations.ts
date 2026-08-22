import { POST_QUERY_KEYS } from "@/features/posts/constants/queryKeys"
import {
  postService,
  type SavePostRequest,
} from "@/features/posts/services/postService"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

/**
 * 목록·상세를 함께 무효화한다.
 *
 * 목록 응답에는 상태 탭 건수가 같이 들어 있어서, 게시·삭제 후 목록만 두면 카드는
 * 사라졌는데 탭 숫자는 그대로인 화면이 남는다.
 */
function useInvalidatePosts() {
  const queryClient = useQueryClient()

  return (postId?: number) => {
    void queryClient.invalidateQueries({
      queryKey: [POST_QUERY_KEYS.POST_LIST],
    })
    if (postId !== undefined) {
      void queryClient.invalidateQueries({
        queryKey: [POST_QUERY_KEYS.POST_DETAIL, postId],
      })
    }
  }
}

export function useCreatePost() {
  const invalidate = useInvalidatePosts()

  return useMutation({
    mutationFn: (request: SavePostRequest) => postService.createPost(request),
    onSuccess: (data, variables) => {
      invalidate(data.postId)
      toast.success(
        variables.action === "PUBLISH"
          ? "게시물을 올렸습니다."
          : "임시저장했습니다."
      )
    },
  })
}

export function useUpdatePost(postId: number) {
  const invalidate = useInvalidatePosts()

  return useMutation({
    mutationFn: (request: SavePostRequest) =>
      postService.updatePost(postId, request),
    onSuccess: (_, variables) => {
      invalidate(postId)
      toast.success(
        variables.action === "PUBLISH"
          ? "게시물을 올렸습니다."
          : "수정 내용을 저장했습니다."
      )
    },
  })
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts()

  return useMutation({
    mutationFn: (postId: number) => postService.deletePost(postId),
    onSuccess: (_, postId) => {
      invalidate(postId)
      toast.success("게시물을 삭제했습니다.")
    },
  })
}

/** 이의 신청 — 성공하면 상태가 심사 중으로 넘어가므로 상세를 반드시 다시 읽는다 */
export function useSubmitAppeal(postId: number) {
  const invalidate = useInvalidatePosts()

  return useMutation({
    mutationFn: (content: string) => postService.submitAppeal(postId, content),
    onSuccess: () => {
      invalidate(postId)
      toast.success("이의 신청이 접수되었습니다.")
    },
  })
}
