import { useQuery } from "@tanstack/react-query"

import { bankService } from "@/common/services/bankService"
import { QUERY_KEYS } from "@/common/constants/queryKeys"

/**
 * 은행 목록 조회 — GET /v1/common/banks (인증 불필요).
 *
 * 서버가 displayOrder 오름차순(자주 쓰는 은행 우선)으로 내려주므로 재정렬하지 않는다.
 * 목록을 하드코딩하지 않는 이유: 제출 시 보내는 값이 은행명이 아니라 3자리 코드라,
 * 프론트가 들고 있는 코드가 서버와 어긋나면 제출이 그대로 실패한다.
 *
 * staleTime을 명시하는 이유: queryClient에 전역 기본값이 없어 기본 staleTime이 0이라
 * 화면을 오갈 때마다 재요청한다. 은행 목록은 세션 중 변하지 않는 참조 데이터다.
 */
export function useGetBanks(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.BANKS],
    queryFn: bankService.getBanks,
    staleTime: Infinity,
    enabled,
  })
}
