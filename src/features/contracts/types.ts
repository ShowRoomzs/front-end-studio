import type { BaseParams } from "@/common/types/page"

/*
  쇼룸 스튜디오 계약 관리(§25·§27) 타입 — 백엔드 `api/creator/contract/dto/*.java`·
  `api/creator/contract/type/*.java`·`domain/contract/type/*.java`와 1:1.
  파트너센터와 DTO를 공유하지 않는다 — 라벨이 아니라 필드 집합 자체가 다르다.
*/

/**
 * 상태 10종(3서피스 공통) — 스튜디오에 도착하는 것은 그중 7종이다.
 * 라벨은 서버 `statusLabel`을 쓴다(CONCLUSION_PENDING = 「공구 생성 대기」 · TERMINATED = 「해지」, 1021 기-05).
 */
export type ContractStatus =
  | "DRAFT"
  | "REVIEW_PENDING"
  | "REVIEW_REJECTED"
  | "SIGNING"
  | "CONCLUSION_PENDING"
  | "CONCLUDED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"
  /** 해지 — 성립(양측 서명) 뒤 · 공구 오픈 전 종결(1021 기-05) */
  | "TERMINATED"

export type ContractStatusTone =
  "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER"

/** 스튜디오 목록 탭 5종 — 작성중 탭은 값 자체가 없다(§27-1 #1) */
export type CreatorContractTab =
  "ALL" | "SIGNING" | "CONCLUSION_PENDING" | "CONCLUDED" | "CLOSED"

/** 정렬 — 기본은 「받은 순」. 생성일은 브랜드의 사정이다(§27-1 #3) */
export type CreatorContractSortType =
  "RECEIVED_DESC" | "DEADLINE_ASC" | "START_AT_ASC"

/** 「내 서명 기한」 열의 표시 종류 — 서버가 판정한다. 문구는 FE가 고른다 */
export type CreatorDeadlineDisplayType =
  "DEADLINE" | "MY_SIGNED" | "BOTH_SIGNED" | "SIGNED" | "PASSED" | "NONE"

/**
 * 고정 지급비 지급 상태 — RECORDED_BY_BRAND는 브랜드가 버튼을 누른 사실이지 입금 사실이 아니다.
 * 플랫폼은 지급을 확인하지 않는다.
 */
export type CreatorFixedFeePaymentState =
  "NOT_YET" | "RECORDED_BY_BRAND" | "NONE"

/** 판매 리워드 정산 시점 — 플랫폼 고정 정책 */
export type CreatorSettlementTiming = "GROUP_BUY_ENDED"

export type FixedFeeTrigger =
  "POST_REGISTERED" | "GROUP_BUY_ENDED" | "SETTLEMENT_COMPLETED"

export type SecondaryUsePeriodType = "FIXED" | "UNLIMITED"

export type WithholdingType = "WITHHOLDING_3_3" | "TAX_INVOICE"

export type ContractDocumentType =
  "GENERATED_DRAFT" | "SIGNED_PDF" | "AUDIT_TRAIL"

export type ContractActorType = "SELLER" | "CREATOR" | "ADMIN" | "SYSTEM"

/** 이력 이벤트 — 스튜디오에는 화이트리스트 7종 + 합성된 연결 성립만 내려온다 */
export type ContractEventType =
  | "CREATED"
  | "REVIEW_REQUESTED"
  | "REVIEW_REQUEST_CANCELED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "SIGNATURE_SENT"
  | "BRAND_SIGNED"
  | "CREATOR_SIGNED"
  | "SIGNATURE_UPDATED"
  | "BOTH_SIGNED_CONFIRMED"
  | "RESEND_REQUESTED"
  | "RESEND_HANDLED"
  | "CONTRACT_PDF_GENERATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED"
  | "CONCLUDED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"
  | "FIXED_FEE_PAID"
  | "GROUP_BUY_CREATED"
  /** 이하 1021 신설 — 서버 스튜디오 화이트리스트에는 아직 없다(받으면 그대로 그린다) */
  | "ESTABLISHED"
  | "TERMINATION_REQUESTED"
  | "TERMINATION_REQUEST_WITHDRAWN"
  | "TERMINATED"
  | "DRAFT_APPROVAL_RECORDED"
  | "DELETED"

/** 거절 사유 5종 — 브랜드의 취소 사유와 별도 enum이다 */
export type ContractDeclineReason =
  | "CONDITION_RENEGOTIATION"
  | "SCHEDULE_MISMATCH"
  | "NOT_FIT_SHOWROOM"
  | "CONTENT_BURDEN"
  | "ETC"

export interface CreatorContractDeadline {
  type: CreatorDeadlineDisplayType
  /** type=DEADLINE일 때만 값이 있다 */
  deadlineAt: string | null
  /** type=DEADLINE일 때만 WARNING이 될 수 있다 — 이 열에 DANGER는 없다 */
  tone: ContractStatusTone
}

export interface CreatorContractListItem {
  contractId: number
  contractNumber: string
  title: string
  brandName: string
  itemCount: number
  startAt: string | null
  endAt: string | null
  /** 받은 일시 = 서명 요청 발송 시각 */
  receivedAt: string
  status: ContractStatus
  statusLabel: string
  statusTone: ContractStatusTone
  deadline: CreatorContractDeadline
  /** 정지 보류 보조 배지(시안 13 · 1017 설계서 8-4) — 공구명 옆. 옛 배포 응답에는 없다 */
  sanctionHold?: CreatorSanctionHold | null
}

export interface CreatorContractListParams extends BaseParams {
  tab: CreatorContractTab
  keyword: string
  sort: CreatorContractSortType
}

/** 상세의 이전/다음 계산용 — 목록 조건 3개 */
export interface CreatorContractNavigationParams {
  tab: CreatorContractTab
  keyword: string
  sort: CreatorContractSortType
}

export interface CreatorContractSummaryResponse {
  /** 키는 탭 코드 — 작성중 키는 존재하지 않는다 */
  tabCounts: Partial<Record<CreatorContractTab, number>>
  /** 내 서명이 필요한 계약 건수(GNB 배지) — SIGNING이면서 내 서명이 없는 것 */
  actionRequiredCount: number
}

export interface CreatorContractBrand {
  marketId: number
  name: string
  /** 스레드가 아직 없으면 null — [스레드에서 협의하기]의 목적지 */
  threadId: number | null
  connected: boolean
}

export interface CreatorContractPeriod {
  startAt: string | null
  endAt: string | null
  days: number | null
}

export interface CreatorContractStepper {
  reviewApprovedAt: string | null
  signatureRequestedAt: string | null
  /** 서명 완료 수(0~2) */
  signedCount: number
  /** 공구 생성 처리(운영자) 시각 — 1021 이후 마지막 단계 「운영자 공구 생성 처리」 */
  concludedAt: string | null
  /**
   * 계약 성립 = 양측 서명 완료 시각(1021 기-05) — 3단계 「양측 서명 완료 · 계약 성립」.
   * 개발 서버가 아직 옛 배포면 필드가 없다 → 두 서명 시각 중 나중 값으로 대신한다
   */
  establishedAt?: string | null
}

export interface CreatorContractSignature {
  deadlineAt: string | null
  brandSignedAt: string | null
  creatorSignedAt: string | null
  /** 「N 기준」 — SIGNING·CONCLUSION_PENDING에서는 항상 값이 있다 */
  asOf: string | null
}

export interface CreatorContractPayout {
  fixedFeeAmount: number | null
  fixedFeeTrigger: FixedFeeTrigger | null
  fixedFeeTriggerLabel: string | null
  rewardRates: Array<{ productName: string | null; rate: number | null }>
  settlementTiming: CreatorSettlementTiming
  /** 플랫폼이 지급을 보증하지 않는다 — MVP에서는 항상 false */
  platformGuaranteed: boolean
  disputeChannel: { threadId: number | null }
}

export interface CreatorContractContent {
  feedCount: number | null
  reelsCount: number | null
  storyCount: number | null
  dueDate: string | null
  secondaryUseAllowed: boolean | null
  secondaryUsePeriodType: SecondaryUsePeriodType | null
  secondaryUseMonths: number | null
  preReview: boolean | null
  note: string | null
  /** 종결 3종이면 false — 카드는 남기되 「효력 없음」으로 표기한다(§27-6) */
  obligationAlive: boolean
}

/** 상품 항목 — 필드명이 스튜디오 관점이다(내 리워드율 · 브랜드 준비 물량) */
export interface CreatorContractItem {
  contractItemId: number
  productId: number | null
  productName: string | null
  regularPrice: number | null
  groupBuyPrice: number | null
  myRewardRate: number | null
  expectedUnitReward: number | null
  brandSupplyQuantity: number | null
}

export interface CreatorContractFixedFee {
  amount: number | null
  trigger: FixedFeeTrigger | null
  triggerLabel: string | null
  /** 지급 시점 정의(기-28) — 옛 배포에는 없다 */
  triggerDescription?: string | null
  /** 지급 시점 뒤 N영업일 안에 지급 — null이면 [정책값 미정] */
  paymentBusinessDays?: number | null
  paymentState: CreatorFixedFeePaymentState
}

/** 「정산 방식」 블록의 예상 실수령 미리보기 — 리워드 100,000원 예시(이 계약의 실제 금액이 아니다) */
export interface CreatorContractNetPreview {
  gross: number
  net: number
  formula: string
}

export interface CreatorContractSettlement {
  platformFeeRate: number
  pgFeeRate: number | null
  withholdingType: WithholdingType | null
  withholdingLabel: string | null
  /** 리워드 지급자 — 「SHOWROOMZ」 */
  rewardPayer?: string
  netPreview?: CreatorContractNetPreview | null
  fixedFeeNote?: string
}

/** 종결 — 문구의 주체 전환(「내가」/「브랜드가」)은 actorType으로 FE가 고른다 */
export interface CreatorContractClosure {
  closedAt: string | null
  actorType: ContractActorType | null
  reasonCode: string | null
  reasonLabel: string | null
  memo: string | null
}

export interface CreatorContractGroupBuy {
  groupBuyId: number | null
  /** 체결완료인데 아직 공구가 없는 상태 — 「브랜드 생성 대기」 */
  awaitingBrandCreation: boolean
}

export interface CreatorContractDocument {
  documentType: ContractDocumentType
  documentTypeLabel: string
  downloadUrl: string
}

/** 스튜디오 권한 5종 — 서명·수정·삭제·취소는 없다 */
export interface CreatorContractPermissions {
  canDecline: boolean
  canRequestResend: boolean
  canOpenThread: boolean
  canDownloadDocuments: boolean
  canOpenGroupBuy: boolean
}

export interface CreatorContractHistoryEntry {
  /** null = 서버가 합성한 「연결 성립」 행 */
  eventType: ContractEventType | null
  actorType: ContractActorType
  actorDisplayName: string | null
  detail: string | null
  occurredAt: string
}

export interface CreatorContractNavigation {
  prevContractId: number | null
  nextContractId: number | null
}

/**
 * 정지 보류 보조 배지(1017 설계서 8-4 · 8-5) — 서버 `SanctionHoldView`.
 * 상태는 바꾸지 않고 배지만 붙는다. 상대 정지면 사실 · 사유 없이 「상대 브랜드 사정」으로만 온다.
 */
export interface CreatorSanctionHold {
  /** MINE(내 계정 이용 정지 · 경고) · COUNTERPARTY(상대 브랜드 사정 · 중립) */
  kind: "MINE" | "COUNTERPARTY" | "ADMIN"
  /** 배지 문구 — 「체결 보류 · 계정 이용 정지」 · 「공구 생성 보류 · 상대 브랜드 사정」 */
  label: string
  tone: "WARNING" | "NEUTRAL"
  /** 어드민만 */
  party: "BRAND" | "CREATOR" | "BOTH" | null
}

/** 브랜드의 해지 요청이 처리 대기 중(1021 기-05) — 동의 · 의견은 운영팀 채널 답글로 받는다 */
export interface CreatorContractTerminationRequested {
  reasonLabel: string
  memo: string | null
  requestedAt: string
  /** 동의 확인 카드가 붙은 내 운영팀 채널 메시지 */
  consentCardMessageId: number | null
}

/** 초안 승인 기록 1건(1021 기-30) — 브랜드가 남긴 기록 · 읽기 전용(서버 파트너 DTO와 같은 모양) */
export interface CreatorContractDraftApproval {
  approvalId: number
  /** 대상 — 「릴스 1차 초안」 */
  title: string
  approvedAt: string
  /** 승인자 — 브랜드명 */
  approvedByName: string
  /** 출처 — 「연결·소통 스레드에서 확인한 초안」 */
  sourceLabel: string
  threadMessageId: number | null
  note: string | null
}

/** 상세 — 화면 9종(S3·S3a·S3b·S3c·S6·S7·S8·S9·S10)이 이 응답 하나를 쓴다 */
export interface CreatorContractDetailResponse {
  contractId: number
  contractNumber: string
  title: string
  status: ContractStatus
  statusLabel: string
  statusTone: ContractStatusTone
  receivedAt: string
  brand: CreatorContractBrand
  period: CreatorContractPeriod
  stepper: CreatorContractStepper
  signature: CreatorContractSignature
  /** 「내가 받는 금액」 — 종결 3종에서는 null */
  payout: CreatorContractPayout | null
  content: CreatorContractContent
  items: Array<CreatorContractItem>
  fixedFee: CreatorContractFixedFee
  settlement: CreatorContractSettlement
  closure: CreatorContractClosure
  groupBuy: CreatorContractGroupBuy
  documents: Array<CreatorContractDocument>
  permissions: CreatorContractPermissions
  history: Array<CreatorContractHistoryEntry>
  navigation: CreatorContractNavigation
  /*
    아래 4개는 10-24 main에 생긴 필드다. 개발 서버가 옛 배포면 아예 없으므로 선택 필드로 받는다.
  */
  /** 정지 보류 보조 배지 — 없으면 null(시안 13 S3 · R1 · 상태 카드 · 서명 진행 안내) */
  sanctionHold?: CreatorSanctionHold | null
  /** 서명 기한이 멈춰 있는가(정지 보류 중) — 상태 카드 기한 아래 「… 멈춤 · … 남은 기한부터」 */
  signatureDeadlinePaused?: boolean
  /** 브랜드의 해지 요청(처리 대기) — 없으면 null */
  terminationRequested?: CreatorContractTerminationRequested | null
  /** 초안 승인 기록 — 없으면 빈 배열 */
  draftApprovals?: Array<CreatorContractDraftApproval>
}

export interface CreatorContractClause {
  code: string
  summaryTitle: string
  summaryDescription: string
  fullTitle: string | null
  fullBody: string | null
}

/** 계약에 고정된 조항 버전 — 문안이 개정돼도 내가 서명한 조항이 바뀌지 않는다 */
export interface CreatorContractClausesResponse {
  clauseVersionId: number
  versionNumber: string
  effectiveDate: string
  clauses: Array<CreatorContractClause>
}

export interface CreatorContractDeclineRequest {
  reasonCode: ContractDeclineReason
  /** 브랜드에게 그대로 전달되는 메모 — 선택 */
  memo?: string
}

export interface CreatorContractResendRequestResponse {
  resendRequestId: number
  requestedAt: string
  alreadyRequested: boolean
}

export interface CreatorContractDocumentDownloadResponse {
  documentType: ContractDocumentType
  documentTypeLabel: string
  downloadUrl: string
  originalName: string | null
  sizeBytes: number | null
  contentType: string | null
  uploadedAt: string
}
