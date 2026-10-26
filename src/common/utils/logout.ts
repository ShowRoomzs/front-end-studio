import { COOKIE_NAME } from "@/common/constants/cookie"
import { apiInstance } from "@/common/lib/apiInstance"
import { cookie } from "@/common/lib/cookie"

/**
 * 로그아웃 — `POST /v1/creator/auth/logout`로 리프레시 토큰을 폐기한 뒤 쿠키를 지우고 로그인 화면을 새로 띄운다.
 * 탑바 [로그아웃]과 기본정보 관리 계정 탭 [로그아웃]이 같이 쓴다.
 *
 * 서버 호출이 실패해도(토큰 만료 · 이미 폐기 · 배포 전 404) 로그아웃은 막지 않는다.
 *
 * navigate가 아니라 문서를 새로 띄운다 — role 쿠키가 빠지면 라우트 트리가 통째로 갈아끼워지는데,
 * navigate는 아직 살아 있는 mainRoutes에서 실행돼 주소와 화면이 어긋난다. 덤으로 이전 사용자의
 * 조회 캐시(스레드 목록 · 메시지)가 메모리에서 사라진다.
 */
export async function logout() {
  const refreshToken = cookie.get(COOKIE_NAME.REFRESH_TOKEN)
  if (refreshToken) {
    try {
      await apiInstance.post(
        "/creator/auth/logout",
        { refreshToken },
        { suppressErrorToast: true }
      )
    } catch {
      // 토큰이 이미 만료됐거나 서버에 경로가 없어도 화면은 로그아웃한다
    }
  }
  cookie.remove(COOKIE_NAME.ACCESS_TOKEN)
  cookie.remove(COOKIE_NAME.REFRESH_TOKEN)
  cookie.remove(COOKIE_NAME.ROLE)
  window.location.replace("/login")
}
