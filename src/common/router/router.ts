import { createBrowserRouter } from "react-router-dom"
import { authRoutes, mainRoutes } from "@/common/router/routes"

/**
 * ⚠️ front-end-partners는 accessToken 유무로 분기하지만, 스튜디오는 그러면 깨진다.
 *
 * 신청 이력이 없는 사용자도 로그인 시 USER accessToken을 발급받는다(신청 API가
 * `@AuthenticationPrincipal`을 요구하기 때문). 토큰 유무로 분기하면 그 순간
 * mainRoutes로 전환돼 `/signup`에 들어갈 수 없다. 그래서 role로 분기한다.
 */
export const createRouter = (role: string | undefined) => {
  return createBrowserRouter(role === "CREATOR" ? mainRoutes : authRoutes)
}
