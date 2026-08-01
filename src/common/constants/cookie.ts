export const COOKIE_NAME = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  /**
   * 라우팅 분기에 쓰는 권한.
   *
   * 스튜디오는 accessToken 유무만으로 분기할 수 없다 — 신청 이력이 없는 사용자도
   * 로그인 시 USER 토큰을 받기 때문이다(신청 API가 로그인을 요구). 새로고침 후에도
   * 유지돼야 하므로 zustand가 아니라 쿠키에 둔다. 자세한 배경은 common/router/router.ts 참고.
   */
  ROLE: "role",
}
