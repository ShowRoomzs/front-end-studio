import { apiInstance } from "@/common/lib/apiInstance"

/** 크리에이터가 올릴 수 있는 이미지 용도 — 서버 `ImageType.CREATOR_ALLOWED_TYPES` */
export type CreatorImageType = "POST" | "PRODUCT" | "MARKET" | "SHOWROOM_PROFILE"

export interface ImageUploadResponse {
  imageUrl: string
  /** 게시물 사진(`POST`)에만 값이 있다 — 서버가 실제 픽셀을 읽은 값이다 */
  width: number | null
  height: number | null
}

export const imageService = {
  /**
   * 이미지 업로드 (multipart).
   *
   * `POST` 타입은 서버가 확장자가 아니라 **내용으로** 이미지 여부를 판정하고 크기를 함께
   * 돌려준다. 비율 검증을 클라이언트와 서버가 같은 값으로 하기 위해서이므로, 저장 요청의
   * `width`·`height`에는 여기서 받은 값을 그대로 실어야 한다.
   *
   * `suppressErrorToast`는 호출부가 정한다 — 게시물 사진은 실패를 토스트가 아니라
   * 그리드의 칸으로 남기기 때문이다(§24-4).
   */
  upload: async (params: {
    file: File | Blob
    type: CreatorImageType
    fileName?: string
    suppressErrorToast?: boolean
    signal?: AbortSignal
  }) => {
    const { file, type, fileName, suppressErrorToast, signal } = params

    const formData = new FormData()
    formData.append("file", file, fileName)

    const { data } = await apiInstance.post<ImageUploadResponse>(
      "/creator/images",
      formData,
      { params: { type }, suppressErrorToast, signal }
    )
    return data
  },
}
