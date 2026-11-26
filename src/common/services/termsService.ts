import { authInstance } from "@/common/lib/authInstance"

/** 백엔드 `TermsType` — 운영정책은 열람 전용(동의 기록 없음) */
export type TermsType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "MARKETING_CONSENT"
  | "OPERATION_POLICY"

/** 백엔드 `TermsTarget` — 크리에이터(스튜디오)는 INFLUENCER */
export type TermsTarget = "ALL" | "USER" | "BRAND" | "INFLUENCER"

/** 백엔드 `TermsDocumentResponse` — 시행 중(EFFECTIVE) 버전만 내려온다 */
export interface TermsDocument {
  documentId: number
  name: string
  type: TermsType
  typeName: string
  target: TermsTarget
  targetName: string
  /** 화면 표기 버전 — 예: "v1.0" */
  version: string
  /** 시행일 — LocalDate(KST 날짜) "yyyy-MM-dd" */
  effectiveDate: string
}

/** 백엔드 `TermsDocumentDetailResponse` — 원문은 평문 */
export interface TermsDocumentDetail extends TermsDocument {
  content: string
}

/**
 * 약관 · 정책 문서 — GET /v1/common/terms(인증 불필요).
 *
 * `target`을 주면 그 대상 문서와 전체(ALL) 문서가 함께 온다. 서버 정렬은 종류 → 문서 id 순이라
 * 같은 종류에 두 문서가 있으면 고르는 일은 화면 몫이다(pickStudioDocument).
 * 시행 예정 버전은 시행일 00:00 배치 전환 전까지 내려오지 않는다 — 그동안 목록은 빈 배열이다.
 */
export const termsService = {
  getTerms: async (target: TermsTarget) => {
    const { data } = await authInstance.get<TermsDocument[]>("/common/terms", {
      params: { target },
      suppressErrorToast: true,
    })
    return data
  },
  /** 시행 중이 아니면 404 */
  getTermsDetail: async (documentId: number) => {
    const { data } = await authInstance.get<TermsDocumentDetail>(
      `/common/terms/${documentId}`,
      { suppressErrorToast: true }
    )
    return data
  },
}

/**
 * 스튜디오가 보여 줄 문서 하나 — 같은 종류에 인플루언서 전용과 전체(ALL) 문서가 함께 오면 인플루언서 전용이 먼저다
 * (소비자 앱 e139523의 USER 우선과 같은 규칙).
 */
export function pickStudioDocument(
  documents: TermsDocument[] | undefined,
  type: TermsType
) {
  const ofType = documents?.filter(d => d.type === type) ?? []
  return ofType.find(d => d.target === "INFLUENCER") ?? ofType[0]
}
