import type { Term, TermNotice } from "@/common/components/Auth/TermsAgreement"

/**
 * 기능요구사항 §8-3 — 필수 3 + 선택 1.
 * 개인정보처리방침은 동의 체크 항목이 **아니라** 고지(보기) 문서다.
 */
export const SIGNUP_TERMS: Term[] = [
  { key: "agreeTermsOfService", label: "서비스 이용약관" },
  { key: "agreeOperationalPolicy", label: "서비스 운영정책" },
  { key: "agreePrivacyPolicy", label: "개인정보 수집 및 이용 동의" },
  {
    key: "agreeMarketingPolicy",
    label: "마케팅 목적의 개인정보 수집 및 이용 동의",
    required: false,
  },
]

export const SIGNUP_TERM_NOTICES: TermNotice[] = [
  { key: "privacyPolicyDocument", label: "개인정보처리방침" },
]

/** 제출을 막는 필수 항목 키 (선택 항목 제외) */
export const REQUIRED_TERM_KEYS = SIGNUP_TERMS.filter(
  t => t.required !== false
).map(t => t.key)
