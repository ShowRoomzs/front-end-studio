import { CREATOR_CONTRACT_QUERY_KEYS } from "@/features/contracts/constants/queryKeys"
import { creatorContractService } from "@/features/contracts/services/creatorContractService"
import type { CreatorContractDeclineRequest } from "@/features/contracts/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/**
 * 거절 · 재발송 요청. 낙관적 업데이트 없음 — 서버가 상태·권한·이력을 다시 계산해 돌려준다.
 * 성공 후 상세·목록·요약(배지)을 모두 무효화한다.
 */
function useInvalidateCreatorContract() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({
      queryKey: [CREATOR_CONTRACT_QUERY_KEYS.DETAIL],
    })
    queryClient.invalidateQueries({
      queryKey: [CREATOR_CONTRACT_QUERY_KEYS.LIST],
    })
    queryClient.invalidateQueries({
      queryKey: [CREATOR_CONTRACT_QUERY_KEYS.SUMMARY],
    })
  }
}

export function useDeclineContract() {
  const invalidate = useInvalidateCreatorContract()

  return useMutation({
    mutationFn: (variables: {
      contractId: number
      body: CreatorContractDeclineRequest
    }) => creatorContractService.decline(variables.contractId, variables.body),
    onSuccess: invalidate,
  })
}

export function useRequestResend() {
  const invalidate = useInvalidateCreatorContract()

  return useMutation({
    mutationFn: (contractId: number) =>
      creatorContractService.requestResend(contractId),
    onSuccess: invalidate,
  })
}
