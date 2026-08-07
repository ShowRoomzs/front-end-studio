import { authInstance } from "@/common/lib/authInstance"

// 서버 응답 필드명은 code/name이다 (bankCode/bankName 아님).
// code는 금융결제원 표준 3자리 코드 문자열 — "004"처럼 0 패딩이 유지돼야 한다.
export interface Bank {
  code: string
  name: string
}

type BanksResponse = Array<Bank>

export const bankService = {
  // 온보딩은 registerToken만 있고 정식 토큰이 없는 상태라 authInstance를 쓴다.
  // (/v1/common/** 은 인증 불필요)
  getBanks: async () => {
    const { data: response } = await authInstance.get<BanksResponse>(
      "/common/banks",
      { suppressErrorToast: true }
    )

    return response
  },
}
