import { useQuery } from "@tanstack/react-query"
import { authButtonClass } from "@/common/components/Auth/authStyles"
import { QUERY_KEYS } from "@/common/constants/queryKeys"
import {
  pickStudioDocument,
  termsService,
  type TermsType,
} from "@/common/services/termsService"

/** 시행 중인 문서는 하루 단위(시행일 00:00)로만 바뀐다 */
const TERMS_STALE_TIME = 1000 * 60 * 60

/**
 * 약관 원문 보기 모달 — 서버 문서(target=INFLUENCER)의 시행 중 버전을 띄운다.
 *
 * 목록이 비어 있거나 그 종류 문서가 없으면 오류가 아니다 — 등록된 문서가 시행일 00:00 전환 전이라
 * 아직 내려오지 않는 것이라 「아직 시행 중인 문서가 없어요」로 안내한다.
 */
export function TermsViewModal(props: {
  label: string
  termsType: TermsType
  onClose: () => void
}) {
  const { label, termsType, onClose } = props

  const list = useQuery({
    queryKey: [QUERY_KEYS.TERMS_LIST, "INFLUENCER"],
    queryFn: () => termsService.getTerms("INFLUENCER"),
    staleTime: TERMS_STALE_TIME,
    retry: 1,
  })
  const picked = pickStudioDocument(list.data, termsType)
  const detail = useQuery({
    queryKey: [QUERY_KEYS.TERMS_DETAIL, picked?.documentId],
    queryFn: () => termsService.getTermsDetail(picked!.documentId),
    enabled: picked !== undefined,
    staleTime: TERMS_STALE_TIME,
    retry: 1,
  })

  const isLoading = list.isPending || (picked !== undefined && detail.isPending)
  const isNotEffectiveYet = list.isSuccess && picked === undefined
  const document = detail.data

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,27,31,0.4)] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[8px] bg-white shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-sz-n-900">{label}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-7 w-7 items-center justify-center rounded text-sz-n-500 hover:bg-sz-n-100 hover:text-sz-n-900"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-[13px] leading-relaxed text-sz-n-700">
          {isLoading ? (
            <p className="py-6 text-center text-[12px] text-sz-n-500">
              불러오는 중…
            </p>
          ) : isNotEffectiveYet ? (
            <p className="py-6 text-center text-[12px] leading-[1.6] text-sz-n-500">
              아직 시행 중인 문서가 없어요.
              <br />
              시행일부터 이곳에서 볼 수 있어요.
            </p>
          ) : !document ? (
            <p className="py-6 text-center text-[12px] leading-[1.6] text-sz-n-500">
              문서를 불러오지 못했어요.
              <br />
              잠시 후 다시 시도해 주세요.
            </p>
          ) : (
            <>
              <p className="mb-3 text-[11px] text-sz-n-500">
                {document.version} · {formatDate(document.effectiveDate)} 시행
              </p>
              <div className="whitespace-pre-line">{document.content}</div>
            </>
          )}
        </div>
        <div className="border-t border-sz-n-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className={authButtonClass("primary", "w-full")}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

/** LocalDate "yyyy-MM-dd"(KST 날짜) → "yyyy.MM.dd" — 시간대 변환 없이 글자만 바꾼다 */
function formatDate(date: string) {
  return date.replaceAll("-", ".")
}
