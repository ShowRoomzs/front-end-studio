import { apiInstance } from "@/common/lib/apiInstance"

export interface ShowroomNameResponse {
  showroomName: string
}

export const profileService = {
  /**
   * 탑바 칩에 쓸 쇼룸명만 가져온다.
   *
   * 전체 프로필은 `GET /creator/profile`에 따로 있지만(계좌·사업자·연결코드까지),
   * 셸은 이름 하나만 필요하고 이 조회는 모든 화면에서 항상 돈다 — 굳이 민감한
   * 정보까지 실어 나를 이유가 없어 경량 엔드포인트를 쓴다.
   */
  getShowroomName: async () => {
    const { data } = await apiInstance.get<ShowroomNameResponse>(
      "/creator/profile/showroom-name"
    )
    return data
  },
}
