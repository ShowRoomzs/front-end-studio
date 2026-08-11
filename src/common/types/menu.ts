export interface MenuItem {
  id: string
  label: string
  /** 없으면 아직 화면이 없는 자리다 — 클릭해도 이동하지 않는다 */
  path?: string
  /**
   * 활성(파란색) 판정에만 쓰는 경로 접두사 목록.
   *
   * `path`는 "클릭하면 갈 곳"이라 한 개뿐이지만, 한 메뉴가 여러 경로를 대표하는
   * 경우가 있다. 생략하면 `path` 하나만 기준으로 판정한다.
   */
  matchPaths?: Array<string>
}

export interface MenuConfig {
  groups: Array<MenuItem>
}
