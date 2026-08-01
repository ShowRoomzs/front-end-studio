import { apiInstance } from "@/common/lib/apiInstance"
import { authInstance } from "@/common/lib/authInstance"

export type SocialProvider = "KAKAO" | "NAVER" | "APPLE" | "GOOGLE"

export type SocialLoginRequest = {
  providerType: SocialProvider
  token: string
  /** Apple 최초 로그인 시에만 내려오는 이름 */
  name?: string
}

/**
 * 백엔드 `TokenResponse`.
 *
 * 하나의 DTO가 다섯 가지 결과를 겸한다(@JsonInclude(NON_NULL)이라 필드가 통째로 빠져서 온다).
 * 어떤 조합이 어떤 화면인지는 resolveLoginResult()에 정리돼 있다.
 */
export type TokenResponse = {
  tokenType?: string | null
  accessToken?: string
  refreshToken?: string
  accessTokenExpiresIn?: number
  refreshTokenExpiresIn?: number
  isNewMember?: boolean
  /** 승인됐지만 추가 정보 미입력 상태에서만 내려온다 (5분 유효) */
  registerToken?: string
  role?: string
  /** ACCOUNT_ROLE_MISMATCH | ACCOUNT_REJECTED */
  code?: string
  message?: string
  rejectReasonType?: string
  rejectReasonDetail?: string
  /** 반려일 + 14일 */
  reapplyAvailableAt?: string
}

export type SnsType = "INSTAGRAM" | "TIKTOK" | "X" | "YOUTUBE"

/** 백엔드 `CreatorApplicationRequest`와 1:1 대응 */
export type CreatorApplicationRequest = {
  snsType: SnsType
  channelUrl: string
  accountId: string
  followerCount: number
  businessEmail: string
  agreeTermsOfService: boolean
  agreeOperationalPolicy: boolean
  agreePrivacyPolicy: boolean
  agreeMarketingPolicy: boolean
}

export type MyCreatorApplication = {
  applicationId: number
  snsType: SnsType
  channelUrl: string
  accountId: string
  followerCount: number
  businessEmail: string
  appliedAt: string
  processedAt: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectReason: string | null
  reapplyAvailableAt: string
  canReapply: boolean
}

export const authService = {
  /** 상태 4종 분기의 출발점. 에러는 화면에서 모달로 표현하므로 토스트를 끈다. */
  socialLogin: async (data: SocialLoginRequest) => {
    const { data: response } = await authInstance.post<TokenResponse>(
      "/creator/auth/social/login",
      data,
      { suppressErrorToast: true }
    )
    return response
  },

  /**
   * 크리에이터 신청 제출.
   * 로그인 상태를 요구한다(백엔드 @AuthenticationPrincipal) — 신청 이력이 없는 사용자도
   * 로그인 시 USER 토큰을 받으므로 그 토큰으로 호출한다.
   */
  apply: async (data: CreatorApplicationRequest) => {
    await apiInstance.post("/creator/application", data, {
      suppressErrorToast: true,
    })
  },

  /** 내 반려 신청 조회 (반려 건이 없으면 404) */
  getMyApplication: async () => {
    const { data } = await apiInstance.get<MyCreatorApplication>(
      "/creator/application",
      { suppressErrorToast: true }
    )
    return data
  },
}
