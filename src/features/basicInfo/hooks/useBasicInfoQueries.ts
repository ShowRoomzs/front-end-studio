import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { BASIC_INFO_QUERY_KEYS } from "@/features/basicInfo/constants/params"
import { basicInfoService } from "@/features/basicInfo/services/basicInfoService"
import type {
  BusinessTypeChangeRequest,
  ChangeSettlementAccountRequest,
} from "@/features/basicInfo/types"

/* ------------------------------------------------------------------ 계정 탭 */

export function useGetBasicInfoAccount(enabled: boolean) {
  return useQuery({
    queryKey: [BASIC_INFO_QUERY_KEYS.ACCOUNT],
    queryFn: basicInfoService.getAccount,
    enabled,
    // 없는 인플루언서(404)는 재시도해도 같다 — 오류 상태를 바로 보인다
    retry: false,
  })
}

/** 응답이 계정 탭 조회와 같아 그대로 캐시에 넣는다 */
export function useUpdateBusinessEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: basicInfoService.updateBusinessEmail,
    onSuccess: account => {
      queryClient.setQueryData([BASIC_INFO_QUERY_KEYS.ACCOUNT], account)
    },
  })
}

/**
 * 탈퇴 요청 · 취소 · 반려 확인 — 응답이 계정 탭 전체가 아니라 다시 조회한다.
 * 409(조건 미충족 · 열린 신청)로 실패해도 조건 행이 바뀌었을 수 있어 다시 조회한다.
 */
function useWithdrawalMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [BASIC_INFO_QUERY_KEYS.ACCOUNT],
      }),
  })
}

export function useRequestWithdrawal() {
  return useWithdrawalMutation(basicInfoService.requestWithdrawal)
}

export function useCancelWithdrawal() {
  return useWithdrawalMutation(basicInfoService.cancelWithdrawal)
}

export function useAcknowledgeWithdrawalRejection() {
  return useWithdrawalMutation(basicInfoService.acknowledgeWithdrawalRejection)
}

/* ------------------------------------------------------------------ 정산 정보 탭 */

export function useGetBasicInfoSettlement(enabled: boolean) {
  return useQuery({
    queryKey: [BASIC_INFO_QUERY_KEYS.SETTLEMENT],
    queryFn: basicInfoService.getSettlement,
    enabled,
    retry: false,
  })
}

/** 확인 모달(T6)을 열 때만 — 열 때마다 새로 센다(지급 상태가 그사이 바뀔 수 있다) */
export function useGetAccountChangeImpact(enabled: boolean) {
  return useQuery({
    queryKey: [BASIC_INFO_QUERY_KEYS.ACCOUNT_CHANGE_IMPACT],
    queryFn: basicInfoService.getAccountChangeImpact,
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

/** 계좌 변경 요청 · 취소 — 응답이 정산 정보 탭 조회와 같다 */
export function useChangeSettlementAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      body: ChangeSettlementAccountRequest
      bankName: string
    }) =>
      basicInfoService.changeSettlementAccount(params.body, params.bankName),
    onSuccess: settlement => {
      queryClient.setQueryData([BASIC_INFO_QUERY_KEYS.SETTLEMENT], settlement)
    },
    onError: () =>
      queryClient.invalidateQueries({
        queryKey: [BASIC_INFO_QUERY_KEYS.SETTLEMENT],
      }),
  })
}

export function useCancelSettlementAccountChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: basicInfoService.cancelSettlementAccountChange,
    onSuccess: settlement => {
      queryClient.setQueryData([BASIC_INFO_QUERY_KEYS.SETTLEMENT], settlement)
    },
    onError: () =>
      queryClient.invalidateQueries({
        queryKey: [BASIC_INFO_QUERY_KEYS.SETTLEMENT],
      }),
  })
}

/** 사업자 구분 변경 요청 · 취소 — 응답에 배너 · 버튼이 없어 다시 조회한다 */
function useBusinessTypeMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [BASIC_INFO_QUERY_KEYS.SETTLEMENT],
      }),
  })
}

export function useRequestBusinessTypeChange() {
  return useBusinessTypeMutation((body: BusinessTypeChangeRequest) =>
    basicInfoService.requestBusinessTypeChange(body)
  )
}

export function useCancelBusinessTypeChange() {
  return useBusinessTypeMutation(basicInfoService.cancelBusinessTypeChange)
}

/**
 * 반려 배너 [확인](T4a · T9a) — 닫고 다시 조회해 T1 · T5로 돌아간다.
 * 승인 배너(T5 · T10)는 「한 번만 보입니다」라 보여 준 직후 조용히 부른다(`refetch = false`) —
 * 지금 화면에서는 배너가 그대로 남고, 다음 진입부터 사라진다.
 */
export function useAcknowledgeBusinessTypeChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { requestId: number; refetch: boolean }) =>
      basicInfoService.acknowledgeBusinessTypeChange(params.requestId),
    onSettled: (_data, _error, params) => {
      if (params.refetch) {
        void queryClient.invalidateQueries({
          queryKey: [BASIC_INFO_QUERY_KEYS.SETTLEMENT],
        })
      }
    },
  })
}
