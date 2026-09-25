import type { BaseParams, SortOrder } from "@/common/types/page"
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"

interface UseParams<P extends BaseParams> {
  localParams: P // 로컬 상태 (필터 UI에서 변경)
  params: P // 실제 상태 (URL과 동기화)
  updateParam: (key: keyof P, value: P[keyof P]) => void
  /** 여러 축을 한 번에 바꾼다 — 탭 전환처럼 `page: 1`을 함께 되돌려야 할 때 쓴다 */
  updateParams: (updatedParams: Partial<P>) => void
  updateLocalParam: (key: keyof P, value: P[keyof P]) => void
  update: () => void
  reset: () => void
  handleSortChange: (sortKey: string, sortOrder: SortOrder) => void
}

export function useParams<P extends BaseParams>(
  initialParams: P
): UseParams<P> {
  if (!initialParams) {
    throw new Error("initialParams is required")
  }

  const [params, setParams] = useState<P>(initialParams)
  const [localParams, setLocalParams] = useState<P>(initialParams)
  const [searchParams, setSearchParams] = useSearchParams()
  const isInitializedRef = useRef(false)

  // 초기 동기화: searchParams 우선 -> initialParams fallback
  const getInitialState = useCallback(() => {
    const result = { ...initialParams }

    Object.keys(initialParams).forEach(key => {
      const initialValue = initialParams[key as keyof P]
      // 배열 타입인 경우 getAll() 사용
      if (Array.isArray(initialValue)) {
        const urlValue = searchParams.getAll(key)
        if (urlValue.length > 0) {
          result[key as keyof P] = urlValue as P[keyof P]
        }
      } else {
        const urlValue = searchParams.get(key)
        if (urlValue !== null) {
          // "null" 문자열을 실제 null로 변환
          if (urlValue === "null") {
            result[key as keyof P] = null as P[keyof P]
          } else if (urlValue === "undefined") {
            result[key as keyof P] = undefined as P[keyof P]
          } else {
            result[key as keyof P] = urlValue as P[keyof P]
          }
        }
      }
    })

    return result
  }, [initialParams, searchParams])

  // 초기화 (한 번만)
  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialState = getInitialState()
      setLocalParams(initialState)
      setParams(initialState)

      // searchParams가 비어있으면 initialParams로 URL 초기화
      if (!searchParams.toString()) {
        const newSearchParams = paramsToSearchParams(initialParams)
        setSearchParams(newSearchParams, { replace: true })
      }

      isInitializedRef.current = true
    }
  }, [getInitialState, initialParams, searchParams, setSearchParams])

  const updateLocalParam = useCallback(
    (key: keyof P, value: P[keyof P]) => {
      setLocalParams(prev => ({
        ...prev,
        [key]: value,
      }))
    },
    [setLocalParams]
  )

  // 여러 파라미터 업데이트 (실제 상태)
  const updateParams = useCallback(
    (updatedParams: Partial<P>) => {
      const newParams = {
        ...params,
        ...updatedParams,
      }
      setParams(newParams)
      setLocalParams(newParams)
      setSearchParams(paramsToSearchParams(newParams))
    },
    [params, setSearchParams]
  )

  // 개별 파라미터 업데이트 (실제 상태)
  const updateParam = useCallback(
    (key: keyof P, value: P[keyof P]) => {
      const newParams = {
        ...params,
        [key]: value,
      }
      setParams(newParams)
      setLocalParams(newParams)
      setSearchParams(paramsToSearchParams(newParams))
    },
    [params, setSearchParams]
  )

  const update = useCallback(() => {
    const paramsWithResetPage = {
      ...localParams,
      page: 1,
    }
    const newSearchParams = paramsToSearchParams(paramsWithResetPage)
    setSearchParams(newSearchParams)
    setParams(paramsWithResetPage)
    setLocalParams(paramsWithResetPage)
  }, [localParams, setSearchParams])

  const reset = useCallback(() => {
    setLocalParams(initialParams)
    setParams(initialParams)
    const newSearchParams = paramsToSearchParams(initialParams)
    setSearchParams(newSearchParams)
  }, [initialParams, setSearchParams])

  const handleSortChange = useCallback(
    (sortKey: string, sortOrder: SortOrder) => {
      const newParams = {
        ...params,
        sortBy: sortKey,
        sortOrder: sortOrder,
      }
      updateParams(newParams)
    },
    [updateParams, params]
  )

  // const sortOption = useMemo(() => {
  //   if (!params.sortBy || !params.sortOrder) return undefined
  //   return {
  //     sortKey: params.sortBy,
  //     sortOrder: params.sortOrder,
  //   }
  // }, [params.sortBy, params.sortOrder])

  return {
    localParams,
    params,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
    reset,
    handleSortChange,
    // sortOption,
  }
}
