import { isAxiosError } from "axios"
import type { TokenResponse } from "@/features/auth/services/authService"

/**
 * 소셜 로그인 결과 → 화면 상태.
 *
 * 백엔드는 하나의 TokenResponse로 다섯 가지 결과를 표현하고, 그중 하나(심사 대기)만
 * 예외로 던진다. 판정 규칙을 화면에 흩뿌리지 않고 여기 한 곳에 모아둔다.
 *
 * | 백엔드 결과 | 응답 | 여기서의 kind |
 * |---|---|---|
 * | 승인 크리에이터 | accessToken + role=CREATOR | approved |
 * | 승인 + 정보 미입력 | registerToken(5분), isNewMember | onboarding |
 * | PENDING | 403 ACCOUNT_NOT_APPROVED (예외) | pendingReview |
 * | REJECTED + 쿨다운 중 | code=ACCOUNT_REJECTED, 토큰 없음 | rejected |
 * | 신청 이력 없음 / 쿨다운 경과 | code=ACCOUNT_ROLE_MISMATCH + USER 토큰 | noApplication |
 */
export type LoginResult =
  | { kind: "approved"; accessToken: string; refreshToken: string }
  | { kind: "onboarding"; registerToken: string }
  | { kind: "pendingReview" }
  | {
      kind: "rejected"
      rejectReasonType?: string
      rejectReasonDetail?: string
      reapplyAvailableAt?: string
    }
  /**
   * 신청 화면으로 보내기 전에 이 토큰을 반드시 저장해야 한다 —
   * POST /v1/creator/application이 로그인 상태를 요구하기 때문이다.
   */
  | { kind: "noApplication"; accessToken: string; refreshToken?: string }
  | { kind: "error"; message: string }

export const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

export function resolveLoginResult(res: TokenResponse): LoginResult {
  if (res.code === "ACCOUNT_REJECTED") {
    return {
      kind: "rejected",
      rejectReasonType: res.rejectReasonType,
      rejectReasonDetail: res.rejectReasonDetail,
      reapplyAvailableAt: res.reapplyAvailableAt,
    }
  }

  // 신청 이력이 없거나 쿨다운이 지난 경우. 승인됐지만 계정 권한이 어긋난 예외 상황도
  // 같은 코드로 오는데, 그때는 신청 API가 ALREADY_REGISTERED로 거부하며 사유를 알려준다.
  if (res.code === "ACCOUNT_ROLE_MISMATCH") {
    if (!res.accessToken) {
      return { kind: "error", message: res.message ?? SERVER_ERROR_MESSAGE }
    }
    return {
      kind: "noApplication",
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    }
  }

  if (res.isNewMember) {
    if (!res.registerToken) {
      return { kind: "error", message: SERVER_ERROR_MESSAGE }
    }
    return { kind: "onboarding", registerToken: res.registerToken }
  }

  if (res.accessToken && res.refreshToken) {
    return {
      kind: "approved",
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    }
  }

  return { kind: "error", message: SERVER_ERROR_MESSAGE }
}

/** socialLogin이 던진 예외 → 화면 상태. 심사 대기만 모달이고 나머지는 에러 배너. */
export function resolveLoginError(err: unknown): LoginResult {
  if (!isAxiosError(err) || !err.response) {
    return { kind: "error", message: SERVER_ERROR_MESSAGE }
  }
  const code = err.response.data?.code as string | undefined
  if (code === "ACCOUNT_NOT_APPROVED") {
    return { kind: "pendingReview" }
  }
  const message = err.response.data?.message as string | undefined
  return { kind: "error", message: message ?? SERVER_ERROR_MESSAGE }
}
