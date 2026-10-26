/*
  기본정보 관리(§50 · 시안 ui-studio-06-account rev.2) — 서버 `CreatorBasicInfoDto`(origin/main) 그대로.

  시각 필드는 두 종류다(서버 JVM = UTC).
  - `LocalDateTime` 이벤트 시각(요청 · 반려 · 처리 · 확인 · 등록 · 제출) — 모두 `LocalDateTime.now()`로 찍는다
    → UTC 벽시계 → `parseServerDateTime`.
  - `LocalDate` 기한(`dueDate`) · 생년월일(`birthday`) — 날짜 그대로(KST 달력 날짜).
*/

// ------------------------------------------------------------------ 계정 탭(S1 ~ S8)

export interface CreatorIdentity {
  /** 가운데 마스킹 — 「소*연」 */
  realName: string
  /** 저장 형식 그대로 — 「2003-07-19」 */
  birthday: string
  /** 가운데 마스킹 — 「010-****-6416」 */
  phoneNumber: string
}

export interface CreatorLogin {
  /** KAKAO · NAVER · GOOGLE · APPLE 등 */
  provider: string
  /** 「카카오」 */
  providerLabel: string
}

/** AVAILABLE(S5) · BLOCKED(S4 · 정지 중 신청 불가 포함) · PENDING(S7) · REJECTED(S8) */
export type WithdrawalState = "AVAILABLE" | "BLOCKED" | "PENDING" | "REJECTED"

/** 조건 3행 — 상태와 무관하게 항상 내린다 */
export type WithdrawalConditionCode =
  "UNFINISHED_GROUP_BUYS" | "UNFINISHED_CONTRACTS" | "UNSETTLED"

export interface ConditionBreakdown {
  /** 공구 · 계약 · 정산 상태 코드(IN_PROGRESS · CONCLUSION_PENDING · ADJUSTING …) */
  key: string
  label: string
  count: number
}

export interface WithdrawalCondition {
  code: WithdrawalConditionCode | string
  /** 「끝나지 않은 공구」 */
  label: string
  /** 남은 건수 — 0이면 충족 */
  count: number
  satisfied: boolean
  /** 해소 방법 — 「주문이 모두 종결되어야 합니다」 */
  resolution: string
  /** 상태별 건수 — 0건 키는 내리지 않는다 */
  breakdown: Array<ConditionBreakdown>
}

export interface PendingWithdrawal {
  requestId: number
  /** 이벤트 시각(UTC 벽시계) */
  requestedAt: string
  /** 신청 사유(입력 그대로) */
  reasonText: string
  /** 승인 처리 기한 — 날짜(KST) · 무응답 자동 승인 없음 */
  dueDate: string
}

export interface WithdrawalRejection {
  requestId: number
  /** 이벤트 시각(UTC 벽시계) */
  rejectedAt: string
  reasonCode: string
  /** 「미정산 남음」 */
  reasonLabel: string
  /** 운영자가 남긴 안내 */
  note: string | null
}

export interface WithdrawalBlock {
  state: WithdrawalState
  /** 정지 중 신청 불가 안내 — 설정 false일 때만, 그 밖에는 null */
  suspensionBlockedReason: string | null
  satisfiedCount: number
  totalCount: number
  conditions: Array<WithdrawalCondition>
  /** 승인 처리 기한 — 영업일 */
  approvalDueBusinessDays: number
  pendingRequest: PendingWithdrawal | null
  rejection: WithdrawalRejection | null
}

export interface AccountResponse {
  identity: CreatorIdentity
  /** 업무 이메일 — 이 탭에서 셀프 수정하는 유일한 값 */
  businessEmail: string | null
  login: CreatorLogin
  withdrawal: WithdrawalBlock
}

export interface UpdateBusinessEmailRequest {
  businessEmail: string
}

export interface WithdrawalRequestBody {
  /** 1 ~ 500자 — 선택지가 정의되지 않아 고른 라벨 문자열을 그대로 보낸다 */
  reason: string
}

export interface WithdrawalRequestResponse {
  requestId: number
  requestedAt: string
  dueDate: string
}

// ------------------------------------------------------------------ 정산 정보 탭(T1 ~ T10)

/** 서버 `CreatorBusinessType` */
export type CreatorBusinessType = "INDIVIDUAL" | "BUSINESS"

export interface BusinessTypeInfo {
  value: CreatorBusinessType
  /** 「개인 (비사업자)」 · 「개인사업자」 */
  label: string
  /** 최근 승인된 구분 변경의 처리 시각(UTC 벽시계) — 없으면 null(온보딩 값) */
  confirmedAt: string | null
}

export interface ResidentNumberInfo {
  /** 뒤 7자리 전부 마스킹 — 「900101-*******」 */
  masked: string
  /** 등록 시각(UTC 벽시계) — 이전 등록분은 null */
  registeredAt: string | null
}

/** 제출 서류 — 온보딩분은 파일명 · 크기 · 제출일이 null */
export interface DocumentFile {
  url: string
  fileName: string | null
  fileSize: number | null
  /** 제출 시각(UTC 벽시계) */
  submittedAt: string | null
}

export interface BusinessInfo {
  /** 하이픈 포함 — 「123-45-67890」 */
  registrationNumber: string
  license: DocumentFile | null
}

/** 세금계산서 공급받는자(SHOWROOMZ) — [발행 정보 복사] 재료 */
export interface TaxInvoiceRecipient {
  businessName: string
  registrationNumber: string
  representative: string
  address: string
  taxEmail: string | null
}

/** UNVERIFIED · VERIFYING · VERIFIED · FAILED · CHANGE_REQUIRED */
export type AccountVerificationStatus =
  "UNVERIFIED" | "VERIFYING" | "VERIFIED" | "FAILED" | "CHANGE_REQUIRED"

/** 배지 톤 — 서버 `CreatorAccountVerificationStatus.tone` */
export type AccountVerificationTone = "NEUTRAL" | "INFO" | "SUCCESS" | "WARNING"

export interface AccountVerification {
  status: AccountVerificationStatus
  /** 확인 전 · 운영자 확인 중 · 확인 완료 · 확인 실패 · 변경 필요 */
  label: string
  tone: AccountVerificationTone
  /** VERIFIED일 때만 — UTC 벽시계 */
  verifiedAt: string | null
  /** FAILED일 때만 */
  failReason: string | null
}

/** REAL_NAME(비사업자) · REAL_NAME_OR_COMPANY(사업자) */
export type AccountHolderRule = "REAL_NAME" | "REAL_NAME_OR_COMPANY"

export interface AccountInfo {
  bankName: string
  /** 뒤 6자리만 노출 — 「******456789」 */
  accountNumber: string
  /** 예금주 = 본인 인증 실명(가운데 마스킹) */
  holderName: string
  holderRule: AccountHolderRule
  bankbook: DocumentFile | null
  verification: AccountVerification
}

export type BusinessTypeChangeType = "TO_BUSINESS" | "TO_INDIVIDUAL"
export type BusinessTypeChangeStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface RejectReason {
  code: string
  label: string
}

/** 사업자 구분 변경 배너(T4 · T4a · T5 · T9 · T9a · T10) */
export interface BusinessTypeChangeBanner {
  requestId: number
  requestCode: string
  type: BusinessTypeChangeType
  status: BusinessTypeChangeStatus
  /** UTC 벽시계 */
  requestedAt: string
  /** 승인 · 반려 시각(UTC 벽시계) — PENDING이면 null */
  processedAt: string | null
  /** TO_BUSINESS 요청 값 */
  businessRegistrationNumber: string | null
  /** TO_INDIVIDUAL 요청 값(마스킹) */
  maskedResidentNumber: string | null
  /** 제출한 증빙 — 사업자등록증 · 폐업사실증명원 */
  evidence: DocumentFile | null
  /** REJECTED일 때만 */
  rejectReason: RejectReason | null
  /** 반려 상세 — 기타(OTHER)일 때 운영자 입력 */
  rejectReasonDetail: string | null
  /** 승인 후 예금주 규칙 위반 — 상호 명의 계좌를 받기 전에는 항상 false */
  accountChangeRequiredOnApproval: boolean
}

/** REQUEST_TO_BUSINESS · REQUEST_TO_INDIVIDUAL · CANCEL — 모든 상태에서 같은 자리 */
export type BusinessTypeChangeAction =
  "REQUEST_TO_BUSINESS" | "REQUEST_TO_INDIVIDUAL" | "CANCEL"

/** 버튼 상태 — 사업자 구분 변경과 계좌 변경은 동시에 요청할 수 없다(1021 Q24) */
export interface SettlementActions {
  businessTypeChange: BusinessTypeChangeAction
  /** 계좌 변경 확인 중일 때만 — 「정산 계좌 확인이 끝난 뒤 요청할 수 있어요」 */
  businessTypeChangeBlockedReason: string | null
  accountChange: boolean
  /** `accountChange = false`일 때만 — 「사업자 구분 확인이 끝난 뒤 요청할 수 있어요」 */
  accountChangeBlockedReason: string | null
}

/** 확인 중인 정산 계좌 변경 요청(1021 기-22 · T2a) */
export interface PendingAccountChange {
  requestId: number
  requestCode: string
  bankName: string
  /** 마스킹 — 「110-***-***789」 */
  maskedAccountNumber: string
  /** 예금주 = 본인 실명(마스킹) */
  holderName: string
  bankbookFileName: string | null
  /** UTC 벽시계 */
  requestedAt: string
  /** 운영자 확인 N영업일 — [정책값 미정]이면 null */
  reviewBusinessDays: number | null
  /** 확인 끝날 때까지 보류되는 지급 */
  holdingPayoutCount: number
  holdingPayoutAmount: number
}

export interface SettlementInfoResponse {
  businessType: BusinessTypeInfo
  /** 비사업자일 때만 */
  residentNumber: ResidentNumberInfo | null
  /** 사업자일 때만 */
  business: BusinessInfo | null
  /** 사업자일 때만 */
  taxInvoiceRecipient: TaxInvoiceRecipient | null
  account: AccountInfo
  /** 배너가 보이는 최근 사업자 구분 변경 요청 — 없으면 null */
  businessTypeChange: BusinessTypeChangeBanner | null
  actions: SettlementActions
  /** 확인 중인 계좌 변경 요청 — 없으면 null */
  pendingAccountChange: PendingAccountChange | null
}

/** 계좌 변경 확인 모달(T6) 재료 */
export interface AccountChangeImpact {
  /** 확정됐고 지시 전(예정 · 보류) */
  pendingPayoutCount: number
  pendingPayoutAmount: number
  /** 이미 지급 지시가 나가 이전 계좌로 지급되는 건 */
  inFlightPayoutCount: number
}

export interface ChangeSettlementAccountRequest {
  /** 은행 표준 코드 3자리 */
  bankCode: string
  /** 하이픈 없이 숫자 10~16자리 */
  accountNumber: string
  bankbookImageUrl: string
  bankbookFileName?: string
}

export interface BusinessTypeChangeRequest {
  targetType: CreatorBusinessType
  /** T7 필수 — 하이픈 포함 */
  businessRegistrationNumber?: string
  /** T8 필수 — 13자리(하이픈 허용) */
  residentRegistrationNumber?: string
  evidenceFileUrl: string
  evidenceFileName: string
  evidenceFileSize: number
}

export interface BusinessTypeChangeCreated {
  requestId: number
  requestCode: string
  type: BusinessTypeChangeType
  status: BusinessTypeChangeStatus
  requestedAt: string
}

// ------------------------------------------------------------------ 화면

export type BasicInfoTab = "settlement" | "account"

/** 업로드를 마친 서류 — 요청 본문에 URL · 파일명 · 크기를 싣는다 */
export interface UploadedDocument {
  url: string
  name: string
  size: number
}
