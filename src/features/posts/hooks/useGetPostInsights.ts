import { POST_QUERY_KEYS } from "@/features/posts/constants/queryKeys"
import {
  postInsightService,
  type StatsPeriod,
} from "@/features/posts/services/postInsightService"
import { useQuery } from "@tanstack/react-query"

export function useGetPostInsights(postId: number, period: StatsPeriod) {
  return useQuery({
    queryKey: [POST_QUERY_KEYS.POST_INSIGHTS, postId, period],
    queryFn: () => postInsightService.getInsights(postId, period),
    placeholderData: previous => previous,
  })
}
