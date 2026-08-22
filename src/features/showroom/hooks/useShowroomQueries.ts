import { QUERY_KEYS } from "@/common/constants/queryKeys"
import { showroomService } from "@/features/showroom/services/showroomService"
import type {
  ShowroomProfileUpdateRequest,
  StatsPeriod,
  TopContentSort,
} from "@/features/showroom/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useGetShowroomProfile() {
  return useQuery({
    queryKey: [QUERY_KEYS.SHOWROOM_PROFILE],
    queryFn: showroomService.getProfile,
  })
}

/**
 * 쇼룸 현황.
 *
 * 방문 로그와 팔로우 관계를 겹쳐 세는 무거운 조회라, 현황 탭을 열었을 때만 부른다
 * (`enabled`). 프로필만 보고 나가는 사용자에게 집계 쿼리를 태울 이유가 없다.
 */
export function useGetShowroomStats(
  params: { period: StatsPeriod; topContentSort: TopContentSort },
  enabled: boolean
) {
  return useQuery({
    queryKey: [QUERY_KEYS.SHOWROOM_STATS, params],
    queryFn: () => showroomService.getStats(params),
    enabled,
  })
}

/**
 * 프로필 저장.
 *
 * 성공하면 프로필과 함께 **탑바의 쇼룸명 캐시도 무효화**한다 — 쇼룸명을 바꿨는데
 * 헤더 칩만 옛 이름으로 남으면 저장이 안 된 것처럼 보인다.
 * (`useGetShowroomName`은 `staleTime: Infinity`라 스스로 다시 받지 않는다.)
 */
export function useUpdateShowroomProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: ShowroomProfileUpdateRequest) =>
      showroomService.updateProfile(body),
    onSuccess: updated => {
      queryClient.setQueryData([QUERY_KEYS.SHOWROOM_PROFILE], updated)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHOWROOM_NAME] })
    },
  })
}

/**
 * 연결코드 재발급.
 *
 * 응답이 새 코드를 주지만 화면은 프로필 응답 하나만 읽는다 — 같은 값을 두 곳에서
 * 들고 있으면 어느 쪽이 최신인지 따져야 한다. 무효화로 한 곳만 갱신한다.
 */
export function useReissueConnectionCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: showroomService.reissueConnectionCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHOWROOM_PROFILE] })
    },
  })
}

export function useUploadProfileImage() {
  return useMutation({
    mutationFn: (file: File) => showroomService.uploadProfileImage(file),
  })
}
