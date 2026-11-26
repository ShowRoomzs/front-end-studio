import type { Term, TermNotice } from "@/common/components/Auth/TermsAgreement"
import type { TermsType } from "@/common/services/termsService"

/**
 * 기능요구사항 §8-3 — 필수 3 + 선택 1. 원문은 서버 문서(GET /v1/common/terms?target=INFLUENCER)다.
 * 개인정보처리방침은 동의 체크 항목이 **아니라** 고지(보기) 문서다.
 *
 * `termsType` — 「보기」가 여는 서버 문서 종류. 서버에는 「개인정보 수집 및 이용 동의」 전용 종류가 없어
 * 개인정보처리방침(PRIVACY_POLICY)을 연다(고지 행과 같은 문서).
 * 동의 값은 `agree*` 불리언으로만 보낸다 — 서버가 문서 · 버전을 따로 받지 않는다(CreatorApplicationRequest).
 */
export const SIGNUP_TERMS: (Term & { termsType: TermsType })[] = [
  {
    key: "agreeTermsOfService",
    label: "서비스 이용약관",
    termsType: "TERMS_OF_SERVICE",
  },
  {
    key: "agreeOperationalPolicy",
    label: "서비스 운영정책",
    termsType: "OPERATION_POLICY",
  },
  {
    key: "agreePrivacyPolicy",
    label: "개인정보 수집 및 이용 동의",
    termsType: "PRIVACY_POLICY",
  },
  {
    key: "agreeMarketingPolicy",
    label: "마케팅 목적의 개인정보 수집 및 이용 동의",
    required: false,
    termsType: "MARKETING_CONSENT",
  },
]

export const SIGNUP_TERM_NOTICES: (TermNotice & { termsType: TermsType })[] = [
  {
    key: "privacyPolicyDocument",
    label: "개인정보처리방침",
    termsType: "PRIVACY_POLICY",
  },
]

/** 제출을 막는 필수 항목 키 (선택 항목 제외) */
export const REQUIRED_TERM_KEYS = SIGNUP_TERMS.filter(
  t => t.required !== false
).map(t => t.key)
