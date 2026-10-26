/*
  DEV 전용 — 개발 서버에 `/v1/creator/basic-info/*`가 아직 배포되지 않아 404일 때(또는 `?mock=`을 붙였을 때)
  시안 ui-studio-06-account rev.2의 상태를 그대로 재현한다. 서비스가 `import.meta.env.DEV` 가드 뒤에서
  동적 `import()`로만 불러 배포 번들에 들어가지 않는다.

  `?mock=<시나리오>` — 탭마다 자기 시나리오만 읽는다(다른 탭 값이면 기본 상태).
  - 정산 정보: t1(기본) · t2a · t4 · t4a · t5 · business · t9 · t9a · t10
  - 계정: s1(기본 · = s4) · s2 · s4 · s5 · s7 · s8 · suspended
  T2 · T3 · T6 · T7 · T8 · S3 · S6은 입력 · 모달 상태라 화면에서 눌러 연다.
  요청 · 취소 · 확인은 메모리 상태를 바꿔 다음 상태로 넘어간다(새로고침하면 처음으로).

  시각은 서버처럼 UTC 벽시계 문자열로 만든다 — 시안의 KST 값(「2026.09.08 14:20」)을 9시간 당겨 둔다.
*/
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

import { mockDelay, mockScenario } from "@/common/utils/devMock"
import type {
  AccountChangeImpact,
  AccountResponse,
  BusinessTypeChangeCreated,
  BusinessTypeChangeRequest,
  ChangeSettlementAccountRequest,
  SettlementInfoResponse,
  WithdrawalBlock,
  WithdrawalCondition,
  WithdrawalRequestResponse,
} from "@/features/basicInfo/types"

dayjs.extend(utc)

/** 시안의 KST 시각 → 서버가 내려 주는 UTC 벽시계 */
function kst(value: string) {
  return dayjs(`${value}+09:00`).utc().format("YYYY-MM-DDTHH:mm:ss")
}

function nowUtc() {
  return dayjs().utc().format("YYYY-MM-DDTHH:mm:ss")
}

function addBusinessDays(days: number) {
  let date = dayjs()
  let left = days
  while (left > 0) {
    date = date.add(1, "day")
    if (date.day() !== 0 && date.day() !== 6) left -= 1
  }
  return date.format("YYYY-MM-DD")
}

const CDN = "https://cdn.mock.showroomz/creator-document"

// ------------------------------------------------------------------ 정산 정보

const ACTIONS_IDLE_INDIVIDUAL = {
  businessTypeChange: "REQUEST_TO_BUSINESS",
  businessTypeChangeBlockedReason: null,
  accountChange: true,
  accountChangeBlockedReason: null,
} as const

const ACTIONS_IDLE_BUSINESS = {
  ...ACTIONS_IDLE_INDIVIDUAL,
  businessTypeChange: "REQUEST_TO_INDIVIDUAL",
} as const

const BUSINESS_TYPE_PENDING_ACTIONS = {
  businessTypeChange: "CANCEL",
  businessTypeChangeBlockedReason: null,
  accountChange: false,
  accountChangeBlockedReason: "사업자 구분 확인이 끝난 뒤 요청할 수 있어요",
} as const

function individualBase(): SettlementInfoResponse {
  return {
    businessType: {
      value: "INDIVIDUAL",
      label: "개인 (비사업자)",
      confirmedAt: null,
    },
    residentNumber: {
      masked: "900101-*******",
      registeredAt: kst("2026-07-02T10:11:00"),
    },
    business: null,
    taxInvoiceRecipient: null,
    account: {
      bankName: "국민은행",
      accountNumber: "******456789",
      holderName: "소*연",
      holderRule: "REAL_NAME",
      bankbook: {
        url: `${CDN}/bankbook.jpg`,
        fileName: "통장사본_국민은행.jpg",
        fileSize: 757760,
        submittedAt: kst("2026-07-02T10:11:00"),
      },
      verification: {
        status: "VERIFIED",
        label: "확인 완료",
        tone: "SUCCESS",
        verifiedAt: kst("2026-07-02T10:15:00"),
        failReason: null,
      },
    },
    businessTypeChange: null,
    actions: { ...ACTIONS_IDLE_INDIVIDUAL },
    pendingAccountChange: null,
  }
}

function businessBase(): SettlementInfoResponse {
  return {
    businessType: {
      value: "BUSINESS",
      label: "개인사업자",
      confirmedAt: kst("2026-09-09T14:00:00"),
    },
    residentNumber: null,
    business: {
      registrationNumber: "123-45-67890",
      license: {
        url: `${CDN}/license.pdf`,
        fileName: "사업자등록증_뷰티소연.pdf",
        fileSize: 1258291,
        submittedAt: kst("2026-09-05T09:12:00"),
      },
    },
    taxInvoiceRecipient: {
      businessName: "쇼룸즈",
      registrationNumber: "791-12-03353",
      representative: "소병서",
      address:
        "경기도 용인시 수지구 죽전로 152, 글로컬산학협력단 B211-3호(죽전동, 단국대학교)",
      taxEmail: null,
    },
    account: {
      bankName: "국민은행",
      accountNumber: "******876541",
      holderName: "소*연",
      holderRule: "REAL_NAME_OR_COMPANY",
      bankbook: {
        url: `${CDN}/bankbook-2.jpg`,
        fileName: "통장사본_국민은행.jpg",
        fileSize: 757760,
        submittedAt: kst("2026-09-09T14:00:00"),
      },
      verification: {
        status: "VERIFIED",
        label: "확인 완료",
        tone: "SUCCESS",
        verifiedAt: kst("2026-09-09T14:05:00"),
        failReason: null,
      },
    },
    businessTypeChange: null,
    actions: { ...ACTIONS_IDLE_BUSINESS },
    pendingAccountChange: null,
  }
}

const TO_BUSINESS_EVIDENCE = {
  url: `${CDN}/license.pdf`,
  fileName: "사업자등록증_뷰티소연.pdf",
  fileSize: 1258291,
  submittedAt: kst("2026-09-05T09:12:00"),
}

const TO_INDIVIDUAL_EVIDENCE = {
  url: `${CDN}/closure.pdf`,
  fileName: "폐업사실증명원_소연컴퍼니.pdf",
  fileSize: 430080,
  submittedAt: kst("2026-10-14T10:00:00"),
}

function buildSettlement(scenario: string | null): SettlementInfoResponse {
  switch (scenario) {
    case "t2a": {
      const base = individualBase()
      return {
        ...base,
        actions: {
          ...base.actions,
          businessTypeChangeBlockedReason:
            "정산 계좌 확인이 끝난 뒤 요청할 수 있어요",
        },
        pendingAccountChange: {
          requestId: 7,
          requestCode: "CR-2609-0007",
          bankName: "신한은행",
          maskedAccountNumber: "110-***-***567",
          holderName: "소*연",
          bankbookFileName: "통장사본_신한은행.jpg",
          requestedAt: kst("2026-09-05T11:00:00"),
          reviewBusinessDays: null,
          holdingPayoutCount: 1,
          holdingPayoutAmount: 99505,
        },
      }
    }
    case "t4":
      return {
        ...individualBase(),
        businessTypeChange: {
          requestId: 31,
          requestCode: "CHG-2026-0031",
          type: "TO_BUSINESS",
          status: "PENDING",
          requestedAt: kst("2026-09-05T09:12:00"),
          processedAt: null,
          businessRegistrationNumber: "123-45-67890",
          maskedResidentNumber: null,
          evidence: TO_BUSINESS_EVIDENCE,
          rejectReason: null,
          rejectReasonDetail: null,
          accountChangeRequiredOnApproval: false,
        },
        actions: { ...BUSINESS_TYPE_PENDING_ACTIONS },
      }
    case "t4a":
      return {
        ...individualBase(),
        businessTypeChange: {
          requestId: 31,
          requestCode: "CHG-2026-0031",
          type: "TO_BUSINESS",
          status: "REJECTED",
          requestedAt: kst("2026-09-05T09:12:00"),
          processedAt: kst("2026-09-08T14:20:00"),
          businessRegistrationNumber: "123-45-67890",
          maskedResidentNumber: null,
          evidence: TO_BUSINESS_EVIDENCE,
          rejectReason: {
            code: "LICENSE_OWNER_NAME_MISMATCH",
            label: "등록증의 대표자명이 본인 실명과 다름",
          },
          rejectReasonDetail: null,
          accountChangeRequiredOnApproval: false,
        },
      }
    case "t5":
      return {
        ...businessBase(),
        businessTypeChange: {
          requestId: 31,
          requestCode: "CHG-2026-0031",
          type: "TO_BUSINESS",
          status: "APPROVED",
          requestedAt: kst("2026-09-05T09:12:00"),
          processedAt: kst("2026-09-09T14:00:00"),
          businessRegistrationNumber: "123-45-67890",
          maskedResidentNumber: null,
          evidence: TO_BUSINESS_EVIDENCE,
          rejectReason: null,
          rejectReasonDetail: null,
          accountChangeRequiredOnApproval: false,
        },
      }
    case "business":
      return businessBase()
    case "t9":
      return {
        ...businessBase(),
        businessTypeChange: {
          requestId: 35,
          requestCode: "CHG-2026-0035",
          type: "TO_INDIVIDUAL",
          status: "PENDING",
          requestedAt: kst("2026-10-14T10:00:00"),
          processedAt: null,
          businessRegistrationNumber: null,
          maskedResidentNumber: "900101-*******",
          evidence: TO_INDIVIDUAL_EVIDENCE,
          rejectReason: null,
          rejectReasonDetail: null,
          // 서버 1차는 항상 false(상호 명의 계좌를 받지 않는다) — 시안 T9 경고를 보이려고 켠다
          accountChangeRequiredOnApproval: true,
        },
        actions: { ...BUSINESS_TYPE_PENDING_ACTIONS },
      }
    case "t9a":
      return {
        ...businessBase(),
        businessTypeChange: {
          requestId: 35,
          requestCode: "CHG-2026-0035",
          type: "TO_INDIVIDUAL",
          status: "REJECTED",
          requestedAt: kst("2026-10-14T10:00:00"),
          processedAt: kst("2026-10-16T10:40:00"),
          businessRegistrationNumber: null,
          maskedResidentNumber: "900101-*******",
          evidence: TO_INDIVIDUAL_EVIDENCE,
          rejectReason: { code: "OTHER", label: "기타" },
          rejectReasonDetail:
            "폐업사실증명원의 폐업일이 비어 있습니다. 폐업 신고가 처리된 뒤 발급한 증명원으로 다시 요청해 주세요.",
          accountChangeRequiredOnApproval: true,
        },
      }
    case "t10": {
      const base = individualBase()
      return {
        ...base,
        businessType: {
          ...base.businessType,
          confirmedAt: kst("2026-10-16T10:40:00"),
        },
        residentNumber: {
          masked: "900101-*******",
          registeredAt: kst("2026-10-16T10:40:00"),
        },
        account: {
          ...base.account,
          accountNumber: "******876541",
          verification: {
            status: "CHANGE_REQUIRED",
            label: "변경 필요",
            tone: "WARNING",
            verifiedAt: null,
            failReason: null,
          },
        },
        businessTypeChange: {
          requestId: 35,
          requestCode: "CHG-2026-0035",
          type: "TO_INDIVIDUAL",
          status: "APPROVED",
          requestedAt: kst("2026-10-14T10:00:00"),
          processedAt: kst("2026-10-16T10:40:00"),
          businessRegistrationNumber: null,
          maskedResidentNumber: "900101-*******",
          evidence: TO_INDIVIDUAL_EVIDENCE,
          rejectReason: null,
          rejectReasonDetail: null,
          accountChangeRequiredOnApproval: true,
        },
      }
    }
    default:
      return individualBase()
  }
}

// ------------------------------------------------------------------ 계정

function conditionsBlocked(): Array<WithdrawalCondition> {
  return [
    {
      code: "UNFINISHED_GROUP_BUYS",
      label: "끝나지 않은 공구",
      count: 2,
      satisfied: false,
      resolution: "주문이 모두 종결되어야 합니다",
      breakdown: [
        { key: "IN_PROGRESS", label: "진행중", count: 1 },
        {
          key: "AWAITING_ORDER_CLOSURE",
          label: "종료 후 주문 종결 대기",
          count: 1,
        },
      ],
    },
    {
      code: "UNFINISHED_CONTRACTS",
      label: "끝나지 않은 계약",
      count: 1,
      satisfied: false,
      resolution: "연결된 공구가 끝나야 합니다",
      breakdown: [{ key: "CONCLUDED", label: "체결완료", count: 1 }],
    },
    {
      code: "UNSETTLED",
      label: "미정산",
      count: 4,
      satisfied: false,
      resolution: "모두 지급 완료되어야 합니다",
      breakdown: [
        { key: "ADJUSTING", label: "조정 협의", count: 2 },
        { key: "REVIEWING", label: "정산 확인 중", count: 1 },
        { key: "PAYOUT_SCHEDULED", label: "지급 예정", count: 1 },
      ],
    },
  ]
}

function conditionsSatisfied(): Array<WithdrawalCondition> {
  return conditionsBlocked().map(condition => ({
    ...condition,
    count: 0,
    satisfied: true,
    breakdown: [],
  }))
}

function withdrawalBlock(patch: Partial<WithdrawalBlock>): WithdrawalBlock {
  return {
    state: "BLOCKED",
    suspensionBlockedReason: null,
    satisfiedCount: 0,
    totalCount: 3,
    conditions: conditionsBlocked(),
    approvalDueBusinessDays: 5,
    pendingRequest: null,
    rejection: null,
    ...patch,
  }
}

const SATISFIED = {
  state: "AVAILABLE",
  satisfiedCount: 3,
  conditions: conditionsSatisfied(),
} as const

function buildAccount(scenario: string | null): AccountResponse {
  const base: AccountResponse = {
    identity: {
      realName: "소*연",
      birthday: "2003-07-19",
      phoneNumber: "010-****-6416",
    },
    businessEmail: "soyeon@example.com",
    login: { provider: "KAKAO", providerLabel: "카카오" },
    withdrawal: withdrawalBlock({}),
  }

  switch (scenario) {
    case "s2":
      return { ...base, businessEmail: null }
    case "s5":
      return { ...base, withdrawal: withdrawalBlock({ ...SATISFIED }) }
    case "s7":
      return {
        ...base,
        withdrawal: withdrawalBlock({
          ...SATISFIED,
          state: "PENDING",
          pendingRequest: {
            requestId: 41,
            requestedAt: kst("2026-09-05T14:20:00"),
            reasonText: "활동 중단",
            dueDate: "2026-09-12",
          },
        }),
      }
    case "s8":
      return {
        ...base,
        withdrawal: withdrawalBlock({
          state: "REJECTED",
          satisfiedCount: 2,
          conditions: conditionsSatisfied().map(condition =>
            condition.code === "UNSETTLED" ? conditionsBlocked()[2] : condition
          ),
          rejection: {
            requestId: 41,
            rejectedAt: kst("2026-09-09T11:02:00"),
            reasonCode: "SETTLEMENT_IN_PROGRESS",
            reasonLabel: "미정산 남음",
            note: "퓨어랩 립밤 공구의 정산 조정 협의가 끝나지 않았습니다. 이슈 스레드에서 합의되거나 합의 기한이 지나 종결된 뒤 다시 요청해 주세요.",
          },
        }),
      }
    case "suspended":
      return {
        ...base,
        withdrawal: withdrawalBlock({
          ...SATISFIED,
          state: "BLOCKED",
          suspensionBlockedReason:
            "계정 이용 정지 중에는 탈퇴를 신청할 수 없습니다.",
        }),
      }
    default:
      return base
  }
}

// ------------------------------------------------------------------ 메모리 상태

interface MockState {
  scenario: string | null
  settlement: SettlementInfoResponse
  account: AccountResponse
}

let state: MockState | null = null

function current(): MockState {
  const scenario = mockScenario()
  if (!state || state.scenario !== scenario) {
    state = {
      scenario,
      settlement: buildSettlement(scenario),
      account: buildAccount(scenario),
    }
  }
  return state
}

class MockApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MockApiError"
  }
}

export function getSettlement() {
  return mockDelay(current().settlement)
}

export function getAccountChangeImpact(): Promise<AccountChangeImpact> {
  const { settlement } = current()
  // 시안 T6 — 「지급 예정 1건(99,505원)」. 사업자 시나리오는 보류할 건이 없는 경우를 보인다
  const hasPending = settlement.businessType.value === "INDIVIDUAL"
  return mockDelay({
    pendingPayoutCount: hasPending ? 1 : 0,
    pendingPayoutAmount: hasPending ? 99505 : 0,
    inFlightPayoutCount: 0,
  })
}

export function changeSettlementAccount(
  body: ChangeSettlementAccountRequest,
  bankName: string
) {
  const s = current()
  const impactCount = s.settlement.businessType.value === "INDIVIDUAL" ? 1 : 0
  s.settlement = {
    ...s.settlement,
    actions: {
      ...s.settlement.actions,
      businessTypeChangeBlockedReason:
        "정산 계좌 확인이 끝난 뒤 요청할 수 있어요",
    },
    pendingAccountChange: {
      requestId: 7,
      requestCode: "CR-2610-0007",
      bankName,
      maskedAccountNumber: `${body.accountNumber.slice(0, 3)}-***-***${body.accountNumber.slice(-3)}`,
      holderName: s.settlement.account.holderName,
      bankbookFileName: body.bankbookFileName ?? null,
      requestedAt: nowUtc(),
      reviewBusinessDays: null,
      holdingPayoutCount: impactCount,
      holdingPayoutAmount: impactCount ? 99505 : 0,
    },
  }
  return mockDelay(s.settlement)
}

export function cancelSettlementAccountChange() {
  const s = current()
  s.settlement = {
    ...s.settlement,
    actions: { ...s.settlement.actions, businessTypeChangeBlockedReason: null },
    pendingAccountChange: null,
  }
  return mockDelay(s.settlement)
}

export function requestBusinessTypeChange(
  body: BusinessTypeChangeRequest
): Promise<BusinessTypeChangeCreated> {
  const s = current()
  if (
    s.settlement.pendingAccountChange ||
    s.settlement.businessTypeChange?.status === "PENDING"
  ) {
    return Promise.reject(
      new MockApiError("이미 검토 중인 변경 요청이 있습니다.")
    )
  }
  const type = body.targetType === "BUSINESS" ? "TO_BUSINESS" : "TO_INDIVIDUAL"
  const requestedAt = nowUtc()
  s.settlement = {
    ...s.settlement,
    businessTypeChange: {
      requestId: 51,
      requestCode: "CHG-2026-0051",
      type,
      status: "PENDING",
      requestedAt,
      processedAt: null,
      businessRegistrationNumber: body.businessRegistrationNumber ?? null,
      maskedResidentNumber: body.residentRegistrationNumber
        ? `${body.residentRegistrationNumber.slice(0, 6)}-*******`
        : null,
      evidence: {
        url: body.evidenceFileUrl,
        fileName: body.evidenceFileName,
        fileSize: body.evidenceFileSize,
        submittedAt: requestedAt,
      },
      rejectReason: null,
      rejectReasonDetail: null,
      accountChangeRequiredOnApproval: false,
    },
    actions: { ...BUSINESS_TYPE_PENDING_ACTIONS },
  }
  return mockDelay({
    requestId: 51,
    requestCode: "CHG-2026-0051",
    type,
    status: "PENDING",
    requestedAt,
  })
}

function idleActions(settlement: SettlementInfoResponse) {
  return settlement.businessType.value === "BUSINESS"
    ? { ...ACTIONS_IDLE_BUSINESS }
    : { ...ACTIONS_IDLE_INDIVIDUAL }
}

export function cancelBusinessTypeChange() {
  const s = current()
  s.settlement = {
    ...s.settlement,
    businessTypeChange: null,
    actions: idleActions(s.settlement),
  }
  return mockDelay(undefined)
}

export function acknowledgeBusinessTypeChange() {
  const s = current()
  s.settlement = { ...s.settlement, businessTypeChange: null }
  return mockDelay(undefined)
}

export function getAccount() {
  return mockDelay(current().account)
}

export function updateBusinessEmail(businessEmail: string) {
  const s = current()
  s.account = { ...s.account, businessEmail: businessEmail.trim() }
  return mockDelay(s.account)
}

export function requestWithdrawal(
  reason: string
): Promise<WithdrawalRequestResponse> {
  const s = current()
  const requestedAt = nowUtc()
  const dueDate = addBusinessDays(s.account.withdrawal.approvalDueBusinessDays)
  s.account = {
    ...s.account,
    withdrawal: {
      ...s.account.withdrawal,
      state: "PENDING",
      rejection: null,
      pendingRequest: {
        requestId: 42,
        requestedAt,
        reasonText: reason,
        dueDate,
      },
    },
  }
  return mockDelay({ requestId: 42, requestedAt, dueDate })
}

export function cancelWithdrawal() {
  const s = current()
  s.account = {
    ...s.account,
    withdrawal: {
      ...s.account.withdrawal,
      state:
        s.account.withdrawal.satisfiedCount === s.account.withdrawal.totalCount
          ? "AVAILABLE"
          : "BLOCKED",
      pendingRequest: null,
    },
  }
  return mockDelay(undefined)
}

export function acknowledgeWithdrawalRejection() {
  const s = current()
  const { withdrawal } = s.account
  s.account = {
    ...s.account,
    withdrawal: {
      ...withdrawal,
      state:
        withdrawal.satisfiedCount === withdrawal.totalCount &&
        !withdrawal.suspensionBlockedReason
          ? "AVAILABLE"
          : "BLOCKED",
      rejection: null,
    },
  }
  return mockDelay(undefined)
}

/** 서류 업로드 — 실제 파일은 올리지 않고 주소만 만든다 */
export function uploadDocument(file: File) {
  return mockDelay({
    imageUrl: `${CDN}/${Date.now()}-${encodeURIComponent(file.name)}`,
  })
}
