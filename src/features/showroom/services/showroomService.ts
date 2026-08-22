import { apiInstance } from "@/common/lib/apiInstance"
import type {
  ConnectionCode,
  ImageUploadResult,
  ShowroomNameCheckResult,
  ShowroomProfile,
  ShowroomProfileUpdateRequest,
  ShowroomStats,
  StatsPeriod,
  TopContentSort,
} from "@/features/showroom/types"

/** 프로필 이미지 업로드 타입 — BE `ImageType.SHOWROOM_PROFILE`(크리에이터 허용 4종 중 하나) */
const SHOWROOM_PROFILE_IMAGE_TYPE = "SHOWROOM_PROFILE"

export const showroomService = {
  getProfile: async () => {
    const { data } = await apiInstance.get<ShowroomProfile>(
      "/creator/showroom/profile"
    )
    return data
  },

  /** PUT은 전체 교체다 — 바꾸지 않는 필드도 현재 값을 그대로 실어 보낸다 */
  updateProfile: async (body: ShowroomProfileUpdateRequest) => {
    const { data } = await apiInstance.put<ShowroomProfile>(
      "/creator/showroom/profile",
      body
    )
    return data
  },

  checkShowroomName: async (showroomName: string) => {
    const { data } = await apiInstance.get<ShowroomNameCheckResult>(
      "/creator/showroom/profile/check-name",
      { params: { showroomName } }
    )
    return data
  },

  getStats: async (params: {
    period: StatsPeriod
    topContentSort: TopContentSort
  }) => {
    const { data } = await apiInstance.get<ShowroomStats>(
      "/creator/showroom/stats",
      { params }
    )
    return data
  },

  /**
   * 연결코드 재발급.
   *
   * 조회는 따로 부르지 않는다 — 프로필 응답에 `connectionCode`가 함께 온다.
   * 재발급 응답도 새 코드를 돌려주지만, 프로필 캐시를 무효화해 한 곳에서만 읽는다.
   */
  reissueConnectionCode: async () => {
    const { data } = await apiInstance.post<ConnectionCode>(
      "/creator/connections/code/reissue"
    )
    return data
  },

  uploadProfileImage: async (file: File) => {
    const formData = new FormData()
    formData.append("type", SHOWROOM_PROFILE_IMAGE_TYPE)
    formData.append("file", file)

    const { data } = await apiInstance.post<ImageUploadResult>(
      "/creator/images",
      formData
    )
    return data
  },
}
