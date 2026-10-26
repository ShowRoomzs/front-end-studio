import type {
  AccountVerificationStatus,
  AccountVerificationTone,
  BasicInfoTab,
  WithdrawalConditionCode,
} from "@/features/basicInfo/types"
import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge"

export const BASIC_INFO_QUERY_KEYS = {
  ACCOUNT: "basicInfoAccount",
  SETTLEMENT: "basicInfoSettlement",
  ACCOUNT_CHANGE_IMPACT: "basicInfoAccountChangeImpact",
} as const

/** 탭 — 시안 순서(계정 · 정산 정보). 기본 진입은 정산 정보(정산 상세 [계좌 확인]이 이곳으로 온다) */
export const BASIC_INFO_TABS: Array<{ value: BasicInfoTab; label: string }> = [
  { value: "account", label: "계정" },
  { value: "settlement", label: "정산 정보" },
]

export const DEFAULT_BASIC_INFO_TAB: BasicInfoTab = "settlement"

/** 서류 — 시안 「최대 10MB · jpg, png, pdf」 · 서버 `CREATOR_DOCUMENT`(jpg · jpeg · png · pdf · 10MB) */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024
export const DOCUMENT_ALLOWED_EXT = ["jpg", "jpeg", "png", "pdf"]
export const DOCUMENT_ACCEPT =
  ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"

/** 계좌번호 — 하이픈 없이 숫자 10~16자리(서버 `^[0-9]{10,16}$`) */
export const ACCOUNT_NUMBER_MIN_LENGTH = 10
export const ACCOUNT_NUMBER_MAX_LENGTH = 16

/** 업무 이메일 — 서버 `@Pattern` · `@Size(max = 512)`와 같은 규칙(도메인에 점이 있어야 한다) */
export const BUSINESS_EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
export const BUSINESS_EMAIL_MAX_LENGTH = 512

/** 사업자등록번호 — 하이픈 포함 000-00-00000 */
export const BUSINESS_REGISTRATION_NUMBER_PATTERN = /^\d{3}-\d{2}-\d{5}$/

/** 탈퇴 사유 — 서버 상한 500자 */
export const WITHDRAWAL_REASON_MAX_LENGTH = 500

/**
 * 탈퇴 사유 선택지 — **기획 미정**(§55 B-13 · 서버는 고른 라벨 문자열을 그대로 받는다).
 * 시안에는 「사유를 선택하세요」와 S7의 「활동 중단」 예시만 있다. 나머지는 임시 문구라 한 곳에 모은다.
 */
export const WITHDRAWAL_REASON_OPTIONS = [
  "활동 중단",
  "다른 채널에 집중",
  "공구 성과가 기대에 못 미침",
  "기타",
] as const

/**
 * 탈퇴 조건 행 제목 · 충족 시 보조문 — 시안 S4 · S5 문구(서버 `label`은 「끝나지 않은 공구」처럼 짧다).
 * 링크는 FE 라우팅이다(50 설계서 12).
 */
export const WITHDRAWAL_CONDITION_VIEW: Record<
  WithdrawalConditionCode,
  { title: string; satisfiedText: string; linkLabel: string; linkTo: string }
> = {
  UNFINISHED_GROUP_BUYS: {
    title: "끝나지 않은 공구가 없다",
    satisfiedText:
      "준비중 · 준비완료 · 진행중 · 중단 예정 · 주문 종결 대기 0건",
    linkLabel: "공구 관리 ›",
    linkTo: "/group-buy",
  },
  UNFINISHED_CONTRACTS: {
    title: "끝나지 않은 계약이 없다",
    satisfiedText: "서명 진행중 · 공구 생성 대기 · 체결완료(공구 미종결) 0건",
    linkLabel: "계약 관리 ›",
    linkTo: "/contracts",
  },
  UNSETTLED: {
    title: "미정산 건이 없다",
    satisfiedText: "정산 확인 중 · 조정 협의 · 지급 예정 0건 · 모두 지급 완료",
    linkLabel: "정산 관리 ›",
    linkTo: "/settlement",
  },
}

/**
 * 조건 내역 라벨 덮어쓰기 — 계약 `CONCLUSION_PENDING`은 기-05에서 「공구 생성 대기」가 됐다(기-04 상태명 정합).
 * 서버 라벨이 이미 바뀌었어도 같은 값이라 해가 없다.
 */
export const CONDITION_BREAKDOWN_LABEL_OVERRIDE: Record<string, string> = {
  CONCLUSION_PENDING: "공구 생성 대기",
}

/**
 * 계좌 확인 배지 — 서버 톤 그대로, 라벨은 시안(기-22 「운영자 확인」 계열).
 * 서버 VERIFIED 라벨은 「확인 완료」지만 시안 배지는 「운영자 확인 완료」다.
 */
export const ACCOUNT_VERIFICATION_LABEL: Record<
  AccountVerificationStatus,
  string
> = {
  UNVERIFIED: "확인 전",
  VERIFYING: "운영자 확인 중",
  VERIFIED: "운영자 확인 완료",
  FAILED: "확인 실패",
  CHANGE_REQUIRED: "변경 필요",
}

export const VERIFICATION_TONE_VARIANT: Record<
  AccountVerificationTone,
  StatusBadgeVariant
> = {
  NEUTRAL: "neutral",
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
}

/** 사업자 구분 확인 SLA — 서버가 저장하지 않는 FE 문구(50 설계서 7-4 · 시안 「영업일 3일 이내」) */
export const BUSINESS_TYPE_REVIEW_TEXT = "영업일 3일 이내"
