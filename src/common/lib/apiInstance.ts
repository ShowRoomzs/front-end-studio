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

apiInstance.interceptors.response.use(
  res => res,
  error => {
    // error.response는 네트워크 단절·CORS·타임아웃에서 undefined다.
    // 여기서 옵셔널 체이닝 없이 접근하면 원래 에러가 TypeError로 덮여
    // 호출부가 실제 원인을 알 수 없게 된다.
    if (error.config?.suppressErrorToast !== true) {
      toast.error(error.response?.data?.message ?? SERVER_ERROR_MESSAGE)
    }
    return Promise.reject(error)
  }
)
