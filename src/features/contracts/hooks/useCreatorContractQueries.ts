import {
  CREATOR_CONTRACT_DETAIL_POLL_INTERVAL,
  CREATOR_CONTRACT_SUMMARY_POLL_INTERVAL,
} from "@/features/contracts/constants/params"
import { CREATOR_CONTRACT_QUERY_KEYS } from "@/features/contracts/constants/queryKeys"
import { creatorContractService } from "@/features/contracts/services/creatorContractService"
import type {
  CreatorContractListParams,
  CreatorContractNavigationParams,
} from "@/features/contracts/types"
import { useQuery } from "@tanstack/react-query"

export function useGetCreatorContractList(params: CreatorContractListParams) {
  return useQuery({
    queryKey: [CREATOR_CONTRACT_QUERY_KEYS.LIST, params],
    queryFn: () => creatorContractService.getList(params),
  })
}

/** 탭 카운트 + GNB 배지(내 서명이 필요한 계약 건수). 셸과 목록이 같은 키를 쓴다 */
export function useGetCreatorContractSummary() {
  return useQuery({
    queryKey: [CREATOR_CONTRACT_QUERY_KEYS.SUMMARY],
    queryFn: creatorContractService.getSummary,
    refetchInterval: CREATOR_CONTRACT_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  })
}

/**
 * 상세 — 서명 진행중이면 폴링한다. 서명 값은 운영자가 모두싸인을 보고 손으로 옮겨 적으므로
 * 서명 링크에서 돌아온 직후에는 아직 반영 전일 가능성이 높다.
 */
export function useGetCreatorContractDetail(
  contractId: number,
  params: CreatorContractNavigationParams
) {
  return useQuery({
    queryKey: [CREATOR_CONTRACT_QUERY_KEYS.DETAIL, contractId, params],
    queryFn: () => creatorContractService.getDetail(contractId, params),
    enabled: Number.isFinite(contractId) && contractId > 0,
    retry: false,
    refetchInterval: query =>
      query.state.data?.status === "SIGNING"
        ? CREATOR_CONTRACT_DETAIL_POLL_INTERVAL
        : false,
  })
}

export function useGetCreatorContractClauses(
  contractId: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: [CREATOR_CONTRACT_QUERY_KEYS.CLAUSES, contractId],
    queryFn: () => creatorContractService.getClauses(contractId),
    enabled,
    staleTime: Infinity,
  })
}
