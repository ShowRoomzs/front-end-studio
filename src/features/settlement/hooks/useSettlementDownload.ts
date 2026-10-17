import { SettlementApiError } from "@/features/settlement/services/settlementService"
import { useState } from "react"
import toast from "react-hot-toast"

/** 다운로드 실패 문구 — 서버 코드별로 「아직 없다」를 오류처럼 보이지 않게 고른다(설계서 6절 · 8-4) */
const DOWNLOAD_ERROR_TEXT: Record<string, string> = {
  SETTLEMENT_RECEIPT_NOT_READY:
    "원천징수영수증을 만드는 중이에요. 잠시 후 다시 내려받아 주세요.",
  SETTLEMENT_STATEMENT_NOT_READY:
    "정산이 확정된 뒤에 전체 명세를 내려받을 수 있어요.",
}

export function settlementErrorCode(error: unknown) {
  return error instanceof SettlementApiError ? error.code : undefined
}

/** 서버 문구가 있으면 그대로, 없으면 대체 문구 */
export function settlementErrorText(error: unknown, fallback: string) {
  return error instanceof SettlementApiError
    ? (error.serverMessage ?? fallback)
    : fallback
}

/**
 * 파일 다운로드 하나 — 진행 중 표시 + 실패 토스트. `notFoundText`는 404의 화면별 의미
 * (연간 내역 = 「그 해 지급 없음」 · 첨부 = 「첨부 없음」)다.
 */
export function useSettlementDownload() {
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const run = async (
    key: string,
    task: () => Promise<void>,
    options?: { notFoundText?: string }
  ) => {
    if (pendingKey) return
    setPendingKey(key)
    try {
      await task()
    } catch (error) {
      const code = settlementErrorCode(error)
      const text =
        (code && DOWNLOAD_ERROR_TEXT[code]) ??
        (code === "SETTLEMENT_NOT_FOUND" ? options?.notFoundText : undefined) ??
        settlementErrorText(
          error,
          "파일을 내려받지 못했습니다. 잠시 후 다시 시도해 주세요."
        )
      toast.error(text)
    } finally {
      setPendingKey(null)
    }
  }

  return { run, pendingKey }
}
