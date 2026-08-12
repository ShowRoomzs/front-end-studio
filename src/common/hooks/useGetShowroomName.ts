import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { profileService } from "@/common/services/profileService"
import { useQuery } from "@tanstack/react-query"

/**
 * 탑바에 띄울 쇼룸명.
 *
 * 로그인 세션 동안 거의 바뀌지 않는 값이라 폴링하지 않는다 — 쇼룸명을 바꿀 수
 * 있는 화면(쇼룸 관리)이 생기면 그쪽에서 이 키를 무효화하면 된다.
 */
export function useGetShowroomName() {
  return useQuery({
    queryKey: [QUERY_KEYS.SHOWROOM_NAME],
    queryFn: profileService.getShowroomName,
    staleTime: Infinity,
  })
}
