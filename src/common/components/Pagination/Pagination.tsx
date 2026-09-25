import type { PageInfo } from "@/common/types/page"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useState } from "react"

// 페이지네이션 설정
const INITIAL_DISPLAY_COUNT = 3 // 초기에 표시할 페이지 수 (1, 2, 3)
const MIDDLE_DISPLAY_COUNT = 3 // 중간에 표시할 페이지 수 (이전, 현재, 다음)

export interface PaginationProps extends Omit<PageInfo, "content"> {
  onPageChange?: (page: number) => void
}

export default function Pagination(props: PaginationProps) {
  const { currentPage, totalPages, onPageChange } = props
  // 내부 상태로 현재 페이지를 관리하여 즉각 반응 (1-based)
  const [displayPage, setDisplayPage] = useState(currentPage)

  // props.currentPage 변경 시 동기화
  useEffect(() => {
    setDisplayPage(currentPage)
  }, [currentPage])

  // 페이지 변경 핸들러
  const handlePageChange = useCallback(
    (newPage: number) => {
      setDisplayPage(newPage) // 즉시 UI 업데이트
      onPageChange?.(newPage)
    },
    [onPageChange]
  )

  const pageButtons = useMemo(() => {
    // page: 실제 페이지 번호 (1-based)
    const renderPageButton = (page: number, isActive = false) => {
      return (
        <button
          key={`page-${page}`}
          className={cn(
            "min-w-[30px] min-h-[30px] rounded-[4px] text-[14px] px-[5px] font-medium transition-colors",
            isActive
              ? "bg-sz-accent-500 text-white"
              : "bg-white text-sz-n-600 hover:bg-sz-n-50 border border-sz-n-300"
          )}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </button>
      )
    }

    const buttons = []

    // 초기 페이지 범위일 때: 1 2 3 ... totalPages
    if (displayPage <= INITIAL_DISPLAY_COUNT) {
      for (let i = 1; i <= INITIAL_DISPLAY_COUNT && i <= totalPages; i++) {
        buttons.push(renderPageButton(i, displayPage === i))
      }

      // totalPages가 INITIAL_DISPLAY_COUNT보다 클 때만 ... totalPages 표시
      if (totalPages > INITIAL_DISPLAY_COUNT) {
        buttons.push(
          <span key="ellipsis" className="text-sz-n-400 px-2">
            ...
          </span>
        )
        buttons.push(renderPageButton(totalPages, displayPage === totalPages))
      }
    }
    // 중간 페이지일 때: 1 ... (이전) 현재 (다음) ... totalPages
    else {
      const sideCount = Math.floor((MIDDLE_DISPLAY_COUNT - 1) / 2) // 현재 페이지 양옆에 표시할 개수
      const leftmostPage = Math.max(displayPage - sideCount, 2) // 실제로 표시될 가장 왼쪽 페이지 (1 제외)
      const rightmostPage = Math.min(displayPage + sideCount, totalPages) // 실제로 표시될 가장 오른쪽 페이지

      buttons.push(renderPageButton(1, displayPage === 1))

      // 1과 첫 번째 중간 페이지 사이에 페이지가 있을 때만 ... 표시
      if (leftmostPage > 2) {
        buttons.push(
          <span key="ellipsis-start" className="text-sz-n-400 px-2">
            ...
          </span>
        )
      }

      // 중간 페이지 표시 (현재 페이지 기준 양옆)
      for (let page = leftmostPage; page <= rightmostPage; page++) {
        if (page > 1 && page < totalPages) {
          buttons.push(renderPageButton(page, page === displayPage))
        }
      }

      // 가장 오른쪽 페이지가 totalPages가 아니고, 그 사이에 페이지가 있을 때만 ... totalPages 표시
      if (rightmostPage < totalPages) {
        // ... 표시 (rightmostPage와 totalPages 사이에 페이지가 있을 때)
        if (rightmostPage < totalPages - 1) {
          buttons.push(
            <span key="ellipsis-end" className="text-sz-n-400 px-2">
              ...
            </span>
          )
        }

        // totalPages 버튼 표시
        buttons.push(renderPageButton(totalPages, displayPage === totalPages))
      }
    }

    return buttons
  }, [displayPage, totalPages, handlePageChange])

  const isPreviousDisabled = displayPage <= 1
  const isNextDisabled = displayPage >= totalPages

  const handleClickPrevious = useCallback(() => {
    if (!isPreviousDisabled) {
      handlePageChange(displayPage - 1)
    }
  }, [isPreviousDisabled, handlePageChange, displayPage])

  const handleClickNext = useCallback(() => {
    if (!isNextDisabled) {
      handlePageChange(displayPage + 1)
    }
  }, [isNextDisabled, handlePageChange, displayPage])

  // 데이터가 없거나 totalPages가 0이면 아무것도 표시하지 않음
  if (!totalPages || totalPages === 0) {
    return null
  }

  return (
    <div className="flex flex-row items-center gap-[8px]">
      {/* 이전 버튼 */}
      <button
        className={cn(
          "w-[30px] h-[30px] rounded-[4px] bg-white border border-sz-n-300 flex items-center justify-center transition-colors",
          isPreviousDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-sz-n-50"
        )}
        onClick={handleClickPrevious}
        disabled={isPreviousDisabled}
      >
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 10L2 6L6 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {pageButtons}

      {/* 다음 버튼 */}
      <button
        className={cn(
          "w-[30px] h-[30px] rounded-[4px] bg-white border border-sz-n-300 flex items-center justify-center transition-colors",
          isNextDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-sz-n-50"
        )}
        onClick={handleClickNext}
        disabled={isNextDisabled}
      >
        <svg
          width="8"
          height="12"
          viewBox="0 0 8 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2L6 6L2 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
