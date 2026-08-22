import { POST_QUERY_KEYS } from "@/features/posts/constants/queryKeys"
import { postService } from "@/features/posts/services/postService"
import { useQuery } from "@tanstack/react-query"

/**
 * 게시물 상세.
 *
 * 목록 카드의 호버 화살표도 이 조회를 쓴다 — 목록 응답에는 대표 썸네일 한 장과 장수만
 * 있어서 넘겨 볼 URL이 없다. 마우스를 올린 카드만 `enabled`로 열어 두면 격자 전체가
 * 상세를 미리 받는 일 없이 필요한 카드만 채워지고, 그 결과가 그대로 수정 화면의 캐시가 된다.
 */
export function useGetPost(
  postId: number | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [POST_QUERY_KEYS.POST_DETAIL, postId],
    queryFn: () => postService.getPost(postId as number),
    enabled: postId !== null && (options?.enabled ?? true),
    staleTime: 30_000,
  })
}
