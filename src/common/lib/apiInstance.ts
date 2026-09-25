import axios from "axios"
import toast from "react-hot-toast"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { cookie } from "@/common/lib/cookie"

const SERVER_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."

export const apiInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
})

apiInstance.interceptors.request.use(config => {
  const accessToken = cookie.get(COOKIE_NAME.ACCESS_TOKEN)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

interface RefreshResponse {
  accessToken: string
  refreshToken?: string
}

/*
  액세스 토큰 만료(401) 시 한 번만 갱신한다. 갱신이 없으면 만료 뒤 모든 요청이 401이 되고,
  30초 폴링(GNB 배지)마다 오류 토스트가 쌓인다. 동시에 여러 요청이 401을 받아도
  갱신 요청은 하나만 나가도록 진행 중인 약속을 공유한다.
*/
let refreshing: Promise<string> | null = null

function refreshAccessToken(refreshToken: string) {
  refreshing ??= axios
    .post<RefreshResponse>(
      `${import.meta.env.VITE_API_URL}/v1/user/auth/refresh`,
      { refreshToken }
    )
    .then(({ data }) => {
      cookie.set(COOKIE_NAME.ACCESS_TOKEN, data.accessToken, { path: "/" })
      if (data.refreshToken) {
        cookie.set(COOKIE_NAME.REFRESH_TOKEN, data.refreshToken, { path: "/" })
      }
      return data.accessToken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

apiInstance.interceptors.response.use(
  res => res,
  async error => {
    const config = error.config
    const refreshToken = cookie.get(COOKIE_NAME.REFRESH_TOKEN)
    // `_retry` — 갱신 후 재요청이 또 401이면 갱신→재요청이 무한히 돈다. 한 요청당 한 번만.
    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      refreshToken
    ) {
      config._retry = true
      try {
        const accessToken = await refreshAccessToken(refreshToken)
        config.headers.Authorization = `Bearer ${accessToken}`
        return await apiInstance(config)
      } catch {
        // 갱신 실패는 원래 401로 돌려준다 — 아래 토스트 경로로 흘려 원인을 가리지 않는다
      }
    }

    // error.response는 네트워크 단절·CORS·타임아웃에서 undefined다.
    // 여기서 옵셔널 체이닝 없이 접근하면 원래 에러가 TypeError로 덮여
    // 호출부가 실제 원인을 알 수 없게 된다.
    if (error.config?.suppressErrorToast !== true) {
      toast.error(error.response?.data?.message ?? SERVER_ERROR_MESSAGE)
    }
    return Promise.reject(error)
  }
)
