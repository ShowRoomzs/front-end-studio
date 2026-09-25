import { useEffect, useMemo, useState } from "react"
import type { PaginationProps } from "@/common/components/Pagination/Pagination"
import type { PageInfo } from "@/common/types/page"

interface UsePaginationInfoOptions {
  data?: PageInfo
  onPageChange?: (page: number) => void
}

/**
 * 페이지네이션 정보를 관리하는 훅
 * 페이지 전환 시 깜빡임을 방지하기 위해 이전 데이터를 캐시합니다.
 */
export function usePaginationInfo(
  props: UsePaginationInfoOptions
): PaginationProps {
  const { data, onPageChange } = props

  const [cachedPageInfo, setCachedPageInfo] = useState<
    Omit<PaginationProps, "onPageChange">
  >({
    currentPage: 0,
    totalResults: 0,
    totalPages: 0,
    limit: 20,
    hasNext: false,
  })

  useEffect(() => {
    if (!data) return

    setCachedPageInfo({
      currentPage: data.currentPage,
      totalResults: data.totalResults,
      totalPages: data.totalPages,
      limit: data.limit,
      hasNext: data.hasNext,
    })
  }, [data])

  const pageInfo = useMemo<PaginationProps>(() => {
    return {
      currentPage: data?.currentPage ?? cachedPageInfo.currentPage,
      totalResults: data?.totalResults ?? cachedPageInfo.totalResults,
      totalPages: data?.totalPages ?? cachedPageInfo.totalPages,
      limit: data?.limit ?? cachedPageInfo.limit,
      hasNext: data?.hasNext ?? cachedPageInfo.hasNext,
      onPageChange,
    }
  }, [data, cachedPageInfo, onPageChange])

  return pageInfo
}
