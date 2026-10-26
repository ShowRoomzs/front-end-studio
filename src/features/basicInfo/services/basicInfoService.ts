import axios from "axios"
import toast from "react-hot-toast"

import { apiInstance } from "@/common/lib/apiInstance"
import { mockScenario } from "@/common/utils/devMock"
import { logout } from "@/common/utils/logout"
import type {
  AccountChangeImpact,
  AccountResponse,
  BusinessTypeChangeCreated,
  BusinessTypeChangeRequest,
  ChangeSettlementAccountRequest,
  SettlementInfoResponse,
  WithdrawalRequestResponse,
} from "@/features/basicInfo/types"

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

/** 이 화면 API가 내는 도메인 404 — 라우트가 없어서 나는 404와 가른다 */
const DOMAIN_NOT_FOUND_CODES = [
  "CREATOR_NOT_FOUND",
  "CREATOR_WITHDRAWAL_NOT_FOUND",
  "CHANGE_REQUEST_NOT_FOUND",
  "BANK_NOT_FOUND",
]

type DevMock = typeof import("@/features/basicInfo/services/basicInfoDevMock")

/** 배포 빌드에서는 `import.meta.env.DEV`가 false로 바뀌어 import 자체가 빠진다(목업 청크가 생기지 않는다) */
const loadMock = (): Promise<DevMock> =>
  import.meta.env.DEV
    ? import("@/features/basicInfo/services/basicInfoDevMock")
    : Promise.reject(new Error("목업은 개발 서버에서만 쓴다"))

/**
 * 개발 서버(`api.showroomz.shop`)는 아직 10-24 이전 배포라 `/v1/creator/basic-info/*`가 404다(03a §2).
 * DEV에서 한 번 404를 만나면 이 화면의 나머지 호출도 목업으로 보낸다 — 조회는 목업인데 저장은 실서버로 가면
 * 화면이 어긋난다. 배포되면 404가 나지 않으므로 저절로 실데이터가 나온다.
 */
let devRouteMissing = false

function isRouteMissing(error: unknown) {
  if (!axios.isAxiosError<{ code?: string }>(error)) return false
  if (error.response?.status !== 404) return false
  const code = error.response.data?.code
  return !code || !DOMAIN_NOT_FOUND_CODES.includes(code)
}

/** DEV에서 목업으로 그리는 중인가 — `?mock=`을 붙였거나 라우트가 없었다. 배포본은 항상 false */
export function isBasicInfoMockActive() {
  if (!import.meta.env.DEV) return false
  return mockScenario() !== null || devRouteMissing
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || SERVER_ERROR_MESSAGE
  }
  return error instanceof Error ? error.message : SERVER_ERROR_MESSAGE
}

/**
 * 실호출 + DEV 404 대체.
 * - 배포본: 실호출만. 실패하면 인터셉터가 서버 문구를 띄우고(`toastOnError`) 화면은 오류 상태를 그린다.
 * - DEV: 목업 판정 전에 토스트가 먼저 뜨지 않게 인터셉터 토스트를 끄고, 목업이 아닌 실패만 여기서 띄운다.
 * `toastOnError = false`는 호출부가 문구를 필드 아래에 붙이는 경우다(업무 이메일).
 */
async function withDevFallback<T>(
  real: (suppressErrorToast: boolean) => Promise<T>,
  mock: (devMock: DevMock) => Promise<T>,
  toastOnError = true
): Promise<T> {
  const runMock = async () => {
    try {
      return await mock(await loadMock())
    } catch (error) {
      if (toastOnError) toast.error(errorMessage(error))
      throw error
    }
  }

  if (isBasicInfoMockActive()) return runMock()

  try {
    return await real(import.meta.env.DEV || !toastOnError)
  } catch (error) {
    if (import.meta.env.DEV) {
      if (isRouteMissing(error)) {
        devRouteMissing = true
        return runMock()
      }
      if (toastOnError) toast.error(errorMessage(error))
    }
    throw error
  }
}

const BASE = "/creator/basic-info"

/**
 * 기본정보 관리(§50 · 50 설계서) — `CreatorBasicInfoController` 11개 + 서류 업로드 · 로그아웃.
 * 계좌 변경은 1021 기-22에 따라 즉시 반영이 아니라 운영자 확인 요청이다(`pendingAccountChange`).
 */
export const basicInfoService = {
  // ---------------------------------------------------------------- 계정 탭

  getAccount: () =>
    withDevFallback(
      async suppressErrorToast => {
        const { data } = await apiInstance.get<AccountResponse>(
          `${BASE}/account`,
          { suppressErrorToast }
        )
        return data
      },
      mock => mock.getAccount()
    ),

  /** 즉시 저장 · 응답은 계정 탭 조회와 같다. 400 문구는 필드 아래에 붙이므로 토스트를 띄우지 않는다 */
  updateBusinessEmail: (businessEmail: string) =>
    withDevFallback(
      async () => {
        const { data } = await apiInstance.patch<AccountResponse>(
          `${BASE}/account/business-email`,
          { businessEmail },
          { suppressErrorToast: true }
        )
        return data
      },
      mock => mock.updateBusinessEmail(businessEmail),
      false
    ),

  requestWithdrawal: (reason: string) =>
    withDevFallback(
      async suppressErrorToast => {
        const { data } = await apiInstance.post<WithdrawalRequestResponse>(
          `${BASE}/withdrawal-requests`,
          { reason },
          { suppressErrorToast }
        )
        return data
      },
      mock => mock.requestWithdrawal(reason)
    ),

  cancelWithdrawal: (requestId: number) =>
    withDevFallback(
      async suppressErrorToast => {
        await apiInstance.post(
          `${BASE}/withdrawal-requests/${requestId}/cancel`,
          undefined,
          { suppressErrorToast }
        )
      },
      mock => mock.cancelWithdrawal()
    ),

  acknowledgeWithdrawalRejection: (requestId: number) =>
    withDevFallback(
      async suppressErrorToast => {
        await apiInstance.post(
          `${BASE}/withdrawal-requests/${requestId}/acknowledge`,
          undefined,
          { suppressErrorToast }
        )
      },
      mock => mock.acknowledgeWithdrawalRejection()
    ),

  // ---------------------------------------------------------------- 정산 정보 탭

  getSettlement: () =>
    withDevFallback(
      async suppressErrorToast => {
        const { data } = await apiInstance.get<SettlementInfoResponse>(
          `${BASE}/settlement`,
          { suppressErrorToast }
        )
        return data
      },
      mock => mock.getSettlement()
    ),

  /** 확인 모달(T6)을 열 때 부른다 */
  getAccountChangeImpact: () =>
    withDevFallback(
      async suppressErrorToast => {
        const { data } = await apiInstance.get<AccountChangeImpact>(
          `${BASE}/settlement-account/change-impact`,
          { suppressErrorToast }
        )
        return data
      },
      mock => mock.getAccountChangeImpact()
    ),

  /**
   * 계좌 변경 요청(기-22) — 응답은 정산 정보 탭 조회와 같다(`pendingAccountChange` 채움 · `account`는 기존 계좌).
   * `bankName`은 목업이 새 계좌 줄을 그릴 때만 쓴다(서버는 코드로 찾는다).
   */
  changeSettlementAccount: (
    body: ChangeSettlementAccountRequest,
    bankName: string
  ) =>
    withDevFallback(
      async suppressErrorToast => {
        const { data } = await apiInstance.put<SettlementInfoResponse>(
          `${BASE}/settlement-account`,
          body,
          { suppressErrorToast }
        )
        return data
      },
      mock => mock.changeSettlementAccount(body, bankName)
    ),

  /** 확인 중 [요청 취소] — 기존 계좌 그대로 · 보류 지급은 원래 예정일로 */
  cancelSettlementAccountChange: () =>
    withDevFallback(
      async suppressErrorToast => {
        const { data } = await apiInstance.delete<SettlementInfoResponse>(
          `${BASE}/settlement-account/change-request`,
          { suppressErrorToast }
        )
        return data
      },
      mock => mock.cancelSettlementAccountChange()
    ),

  requestBusinessTypeChange: (body: BusinessTypeChangeRequest) =>
    withDevFallback(
      async suppressErrorToast => {
        const { data } = await apiInstance.post<BusinessTypeChangeCreated>(
          `${BASE}/business-type-change-requests`,
          body,
          { suppressErrorToast }
        )
        return data
      },
      mock => mock.requestBusinessTypeChange(body)
    ),

  cancelBusinessTypeChange: (requestId: number) =>
    withDevFallback(
      async suppressErrorToast => {
        await apiInstance.post(
          `${BASE}/business-type-change-requests/${requestId}/cancel`,
          undefined,
          { suppressErrorToast }
        )
      },
      mock => mock.cancelBusinessTypeChange()
    ),

  /** 승인 · 반려 배너 닫기 — 멱등 */
  acknowledgeBusinessTypeChange: (requestId: number) =>
    withDevFallback(
      async suppressErrorToast => {
        await apiInstance.post(
          `${BASE}/business-type-change-requests/${requestId}/acknowledge`,
          undefined,
          { suppressErrorToast }
        )
      },
      mock => mock.acknowledgeBusinessTypeChange()
    ),

  // ---------------------------------------------------------------- 공용

  /**
   * 서류 업로드(통장 사본 · 사업자등록증 · 폐업사실증명원) — `POST /v1/creator/images?type=CREATOR_DOCUMENT`.
   * 실패 문구는 파일 상자 아래에 붙이므로 토스트를 띄우지 않는다. 목업으로 그리는 중이면 주소만 만든다
   * (옛 배포는 로그인 경로에서 `CREATOR_DOCUMENT`를 받지 않는다).
   */
  uploadDocument: async (file: File) => {
    if (isBasicInfoMockActive()) {
      const mock = await loadMock()
      return mock.uploadDocument(file)
    }
    const formData = new FormData()
    formData.append("file", file, file.name)
    const { data } = await apiInstance.post<{ imageUrl: string }>(
      "/creator/images",
      formData,
      { params: { type: "CREATOR_DOCUMENT" }, suppressErrorToast: true }
    )
    return data
  },

  /** 계정 탭 [로그아웃] — 탑바와 같은 공용 로그아웃(`common/utils/logout`) */
  logout,
}
