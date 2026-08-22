import { POST_PAGE_SIZE } from "@/features/posts/constants/params"
import { POST_QUERY_KEYS } from "@/features/posts/constants/queryKeys"
import {
  postService,
  type PostStatus,
} from "@/features/posts/services/postService"
import { useInfiniteQuery } from "@tanstack/react-query"

/**
 * 목록 + 상태 탭 건수.
 *
 * 탭 건수를 따로 조회하지 않는다 — 서버가 목록과 같은 트랜잭션에서 세어 함께 내려주므로
 * 탭을 옮기는 동안 숫자가 흔들리지 않는다(§24-1).
 *
 * 페이지를 갈아끼우지 않고 이어 붙이는 이유는 격자이기 때문이다. 사진을 훑다가 다음
 * 페이지로 넘어가면 방금 보던 줄이 사라지고 스크롤이 위로 튄다.
 */
export function useGetPostList(status?: PostStatus) {
  return useInfiniteQuery({
    queryKey: [POST_QUERY_KEYS.POST_LIST, status ?? "ALL"],
    queryFn: ({ pageParam }) =>
      postService.getPosts({ status, page: pageParam, size: POST_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pageInfo.hasNext ? lastPage.pageInfo.currentPage + 1 : undefined,
  })
}
