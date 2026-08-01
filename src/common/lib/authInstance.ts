import axios, { isAxiosError } from "axios"
import toast from "react-hot-toast"
import { COOKIE_NAME } from "@/common/constants/cookie"
import { cookie } from "@/common/lib/cookie"

// 호출부에서 { suppressErrorToast: true }를 넘기면 이 인스턴스의 전역 에러 토스트를 끈다.
// (로그인/신청처럼 에러를 모달·배너·필드 인라인으로 직접 표현하는 화면 전용)
declare module "axios" {
  export interface AxiosRequestConfig {
    suppressErrorToast?: boolean
  }
}

export const authInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
})

authInstance.interceptors.response.use(
  res => res,
  error => {
    const suppressErrorToast = error.config?.suppressErrorToast === true
    const hasAccessToken = !!cookie.get(COOKIE_NAME.ACCESS_TOKEN)
    if (error.response?.status === 401 && hasAccessToken) {
      cookie.remove(COOKIE_NAME.ACCESS_TOKEN, { path: "/" })
      cookie.remove(COOKIE_NAME.REFRESH_TOKEN, { path: "/" })
      cookie.remove(COOKIE_NAME.ROLE, { path: "/" })
      if (!suppressErrorToast) {
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요.")
      }
      return Promise.reject(error)
    }
    if (isAxiosError(error) && !suppressErrorToast) {
      toast.error(
        error.response?.data?.message ??
          "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      )
    }
    return Promise.reject(error)
  }
)
